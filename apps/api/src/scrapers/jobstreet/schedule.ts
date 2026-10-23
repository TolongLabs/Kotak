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
