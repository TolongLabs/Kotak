import type { jobstreetDatabase } from './database'

type Sql = ReturnType<typeof jobstreetDatabase>

// The midnight refresh: one breadth run for each enabled search title with Nightly Refresh on, unless the title already
// has a run queued or running, and at most one scheduled run per title a day. One statement queues every title, so the
// cron's Neon subrequests stay the same however many titles there are (#283). now() is the same for every row of one
// statement, so each run is offset by a microsecond in the titles' order, and the runner, which claims the oldest
// queued run first, still takes them in the order they were added.
export const QUEUE_DAILY_REFRESH = `WITH career AS (
    SELECT slug, row_number() OVER (ORDER BY created_at, slug) AS queue_order
    FROM jobstreet_careers WHERE enabled AND daily_refresh
  ),
  queued AS (
    INSERT INTO jobstreet_scrape_runs (id, career_slug, mode, status, source, scheduled_for, created_at)
    SELECT gen_random_uuid()::text, career.slug, 'breadth', 'queued', 'schedule', $1::date,
      now() + career.queue_order * interval '1 microsecond'
    FROM career
    WHERE NOT EXISTS (
      SELECT 1 FROM jobstreet_scrape_runs run
      WHERE run.career_slug = career.slug AND run.status IN ('queued', 'running')
    )
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT (SELECT count(*)::int FROM career) AS titles, (SELECT count(*)::int FROM queued) AS queued`

// Queues the refresh for scheduledFor (YYYY-MM-DD, Asia/Singapore) in one query. titles counts the search titles the
// refresh covers; queued counts the runs added.
export async function queueDailyRefresh(sql: Pick<Sql, 'query'>, scheduledFor: string) {
  const [counts] = (await sql.query(QUEUE_DAILY_REFRESH, [scheduledFor])) as Array<{ titles: number; queued: number }>
  return counts
}

// Copies each listing's standing approval to jobstreet_listings.approved_at (#276): the review's reviewed_at while an
// approval stands under the search title's current occupation, else null. The runner's role can't read the reviews,
// so this is how its depth runs describe approved listings first; nothing else reads the column. $1 is one search
// title's slug, or null for every title. Only listings whose value is wrong are locked and written; synced counts them.
//
// The runner saves its progress in one transaction that locks listing rows in scrape order, so a writer of many rows in
// another order could deadlock with it. This statement never waits for a row lock instead: SKIP LOCKED passes over
// rows another transaction holds. FOR NO KEY UPDATE is the lock the update takes anyway, which the foreign-key checks
// of review, observation and skill inserts don't conflict with. A skipped listing keeps its old value until the next
// sync: the admin route syncs a title in every transaction that changes its reviews, and the nightly cron syncs all.
export const SYNC_APPROVED_AT = `WITH standing AS (
    SELECT listing.job_id, listing.career_slug, review.reviewed_at AS approved_at
    FROM jobstreet_listings listing
    JOIN jobstreet_careers career ON career.slug = listing.career_slug
    LEFT JOIN jobstreet_listing_reviews review
      ON review.job_id = listing.job_id AND review.career_slug = listing.career_slug
      AND review.approved AND review.onet_code = career.onet_code
    WHERE ($1::text IS NULL OR listing.career_slug = $1::text)
      AND listing.approved_at IS DISTINCT FROM review.reviewed_at
    FOR NO KEY UPDATE OF listing SKIP LOCKED
  ),
  synced AS (
    UPDATE jobstreet_listings listing SET approved_at = standing.approved_at
    FROM standing
    WHERE listing.job_id = standing.job_id AND listing.career_slug = standing.career_slug
    RETURNING 1
  )
  SELECT count(*)::int AS synced FROM synced`

// The nightly repair pass: syncs every search title in one query, including the listings an admin's sync skipped.
export async function syncAllApprovedAt(sql: Pick<Sql, 'query'>) {
  const [counts] = (await sql.query(SYNC_APPROVED_AT, [null])) as Array<{ synced: number }>
  return counts?.synced ?? 0
}
