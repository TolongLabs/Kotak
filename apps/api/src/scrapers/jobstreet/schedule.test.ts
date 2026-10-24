import { afterAll, beforeAll, beforeEach, expect, test } from 'bun:test'
import type { PGlite } from '@electric-sql/pglite'
import { readMigrations } from '../../../db/read-migrations'
import { migratedDatabase, routeNeonTo, TEST_DATABASE_URL } from '../../../db/test-database'
import { jobstreetDatabase } from './database'
import { queueDailyRefresh, SYNC_APPROVED_AT, syncAllApprovedAt } from './schedule'
import { CLAIM_NEXT_RUN, parseQueuedJobstreetRun } from './tasks'

// The nightly queue, the approval copy, migration 0008's backfill and the runner's claim, sent by the Neon driver to a
// Postgres built by the repo's own migrations (PGlite, in memory). PGlite is a single connection, so no other
// transaction can hold a row: the statements' SKIP LOCKED clauses run here, but these tests can't show them skipping
// a locked row.

let db: PGlite
let restoreNeon: () => void
const sql = jobstreetDatabase(TEST_DATABASE_URL)

beforeAll(async () => {
  db = await migratedDatabase()
  restoreNeon = routeNeonTo(db)
}, 30_000)

afterAll(async () => {
  restoreNeon()
  await db.close()
})

// Each test starts without search titles, so without runs, listings or reviews.
beforeEach(() => db.exec('TRUNCATE jobstreet_careers CASCADE'))

const addCareer = (
  slug: string,
  { enabled = true, daily = true, onet = null as string | null, createdAt = '2026-10-01T00:00:00Z' } = {}
) =>
  db.query(
    `INSERT INTO jobstreet_careers (slug, title, search_url, enabled, daily_refresh, onet_code, created_at)
     VALUES ($1, $1, 'https://my.jobstreet.com/' || $1 || '-jobs', $2, $3, $4, $5)`,
    [slug, enabled, daily, onet, createdAt]
  )

const addRun = (
  id: string,
  careerSlug: string,
  status: string,
  { source = 'manual', createdAt = '2026-10-01T00:00:00Z' } = {}
) =>
  db.query(
    `INSERT INTO jobstreet_scrape_runs (id, career_slug, mode, status, source, created_at)
     VALUES ($1, $2, 'breadth', $3, $4, $5)`,
    [id, careerSlug, status, source, createdAt]
  )

test('the nightly refresh queues one run per enabled title once a date, in title order (#283)', async () => {
  // Added in this order; the two added at the same moment go by slug.
  await addCareer('zeta-designer', { createdAt: '2026-10-01T00:00:00Z' })
  await addCareer('alpha-analyst', { createdAt: '2026-10-02T00:00:00Z' })
  await addCareer('beta-builder', { createdAt: '2026-10-02T00:00:00Z' })
  await addCareer('turned-off', { enabled: false })
  await addCareer('not-nightly', { daily: false })
  await addCareer('already-queued')
  await addCareer('already-running')
  await addRun('finished-earlier', 'zeta-designer', 'success')
  await addRun('queued-by-hand', 'already-queued', 'queued')
  await addRun('running-by-hand', 'already-running', 'running')

  // The titles with a run queued or running get none. The query's NOT EXISTS skips them, and the one-active-run index
  // with ON CONFLICT DO NOTHING would drop their runs anyway, so this checks the outcome, not which of the two gave it.
  expect(await queueDailyRefresh(sql, '2026-10-25')).toEqual({ titles: 5, queued: 3 })
  // claim_order ranks the runs as the runner claims them, oldest first; a tie would share a rank.
  const scheduled = await db.query(
    `SELECT career_slug, mode, status, to_char(scheduled_for, 'YYYY-MM-DD') AS scheduled_for,
       rank() OVER (ORDER BY created_at)::int AS claim_order
     FROM jobstreet_scrape_runs WHERE source = 'schedule' ORDER BY created_at, career_slug`
  )
  expect(scheduled.rows).toEqual(
    ['zeta-designer', 'alpha-analyst', 'beta-builder'].map((career_slug, index) => ({
      career_slug,
      mode: 'breadth',
      status: 'queued',
      scheduled_for: '2026-10-25',
      claim_order: index + 1
    }))
  )

  // Once those runs finish, the same date queues nothing again, and the next date queues them once more.
  await db.exec("UPDATE jobstreet_scrape_runs SET status = 'success' WHERE source = 'schedule'")
  expect(await queueDailyRefresh(sql, '2026-10-25')).toEqual({ titles: 5, queued: 0 })
  expect(await queueDailyRefresh(sql, '2026-10-26')).toEqual({ titles: 5, queued: 3 })
  const perDate = await db.query(
    `SELECT to_char(scheduled_for, 'YYYY-MM-DD') AS scheduled_for, array_agg(career_slug ORDER BY created_at) AS titles
     FROM jobstreet_scrape_runs WHERE source = 'schedule' GROUP BY scheduled_for ORDER BY scheduled_for`
  )
  expect(perDate.rows).toEqual([
    { scheduled_for: '2026-10-25', titles: ['zeta-designer', 'alpha-analyst', 'beta-builder'] },
    { scheduled_for: '2026-10-26', titles: ['zeta-designer', 'alpha-analyst', 'beta-builder'] }
  ])
})

const T1 = '2026-10-20T01:00:00.000Z'
const T2 = '2026-10-21T02:00:00.000Z'
const T3 = '2026-10-22T03:00:00.000Z'
const T5 = '2026-10-20T05:00:00.000Z'
const DRIFT = '2026-09-01T00:00:00.000Z'

// Two search titles. ux-designer's listings: 1 approved, 2 excluded, 3 approved under the title's old occupation and
// 4 never reviewed. data-analyst's listing 5 is approved. approvedAt seeds the copy, possibly wrong.
async function seedReviews(approvedAt: Record<string, string | null> = {}) {
  await addCareer('ux-designer', { onet: '15-1255.00' })
  await addCareer('data-analyst', { onet: '15-2051.00' })
  await addRun('run-ux', 'ux-designer', 'success')
  await addRun('run-data', 'data-analyst', 'success')
  for (const [jobId, careerSlug] of [
    ['1', 'ux-designer'],
    ['2', 'ux-designer'],
    ['3', 'ux-designer'],
    ['4', 'ux-designer'],
    ['5', 'data-analyst']
  ])
    await db.query(
      `INSERT INTO jobstreet_listings (job_id, career_slug, latest_payload, latest_seen_at, approved_at)
       VALUES ($1, $2, '{}', now(), $3)`,
      [jobId, careerSlug, approvedAt[jobId] ?? null]
    )
  for (const [jobId, careerSlug, approved, onet, runId, reviewedAt] of [
    ['1', 'ux-designer', true, '15-1255.00', 'run-ux', T1],
    ['2', 'ux-designer', false, '15-1255.00', 'run-ux', T1],
    ['3', 'ux-designer', true, '27-1024.00', 'run-ux', T1],
    ['5', 'data-analyst', true, '15-2051.00', 'run-data', T5]
  ])
    await db.query(
      `INSERT INTO jobstreet_listing_reviews (job_id, career_slug, approved, onet_code, scrape_run_id, reviewed_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [jobId, careerSlug, approved, onet, runId, reviewedAt]
    )
}

const approvedAt = async () =>
  Object.fromEntries(
    (
      await db.query<{ job_id: string; approved_at: Date | null }>(
        'SELECT job_id, approved_at FROM jobstreet_listings ORDER BY job_id'
      )
    ).rows.map((row) => [row.job_id, row.approved_at?.toISOString() ?? null])
  )
const syncTitle = async (slug: string) =>
  ((await sql.query(SYNC_APPROVED_AT, [slug])) as Array<{ synced: number }>)[0].synced

test('approved_at copies the approval that stands under the occupation of its title (#276)', async () => {
  // Listing 3's copy is left from when its approval stood under the old occupation.
  await seedReviews({ '3': DRIFT })

  // A title's sync writes only its own listings that are wrong: 1 gains its approval, and 3 loses the old one.
  expect(await syncTitle('ux-designer')).toBe(2)
  expect(await approvedAt()).toEqual({ '1': T1, '2': null, '3': null, '4': null, '5': null })
  // The nightly pass syncs every title, then has nothing left to write.
  expect(await syncAllApprovedAt(sql)).toBe(1)
  expect(await syncAllApprovedAt(sql)).toBe(0)
  expect(await approvedAt()).toEqual({ '1': T1, '2': null, '3': null, '4': null, '5': T5 })

  // A newer batch excludes listing 1, then a later one approves it again.
  await db.query("UPDATE jobstreet_listing_reviews SET approved = false, reviewed_at = $1 WHERE job_id = '1'", [T2])
  expect(await syncTitle('ux-designer')).toBe(1)
  expect((await approvedAt())['1']).toBeNull()
  await db.query("UPDATE jobstreet_listing_reviews SET approved = true, reviewed_at = $1 WHERE job_id = '1'", [T3])
  expect(await syncTitle('ux-designer')).toBe(1)
  expect((await approvedAt())['1']).toBe(T3)

  // Rejecting the batch withdraws its decisions, as the admin route does.
  await db.query("DELETE FROM jobstreet_listing_reviews WHERE scrape_run_id = 'run-ux'")
  expect(await syncTitle('ux-designer')).toBe(1)
  expect(await approvedAt()).toEqual({ '1': null, '2': null, '3': null, '4': null, '5': T5 })
})

test('migration 0008 fills approved_at once, and a later deploy rewrites no listing', async () => {
  // Copies an earlier API version left wrong: approvals without one, and one where nothing stands.
  await seedReviews({ '2': DRIFT, '3': DRIFT })
  const migration = (await readMigrations()).find(({ file }) => file.endsWith('0008_jobstreet_listing_approval.sql'))
  // As migrate.ts sends them: every statement in one transaction.
  const deploy = () => sql.transaction(migration!.statements.map((statement) => sql.query(statement)))
  // xmin changes whenever a row is written, even with the same values.
  const versions = async () =>
    Object.fromEntries(
      (
        await db.query<{ job_id: string; version: string }>(
          'SELECT job_id, xmin::text AS version FROM jobstreet_listings ORDER BY job_id'
        )
      ).rows.map((row) => [row.job_id, row.version])
    )
  const rewritten = (before: Record<string, string>, after: Record<string, string>) =>
    Object.keys(before).filter((jobId) => before[jobId] !== after[jobId])

  const seeded = await versions()
  await deploy()
  const filled = await versions()
  expect(rewritten(seeded, filled)).toEqual(['1', '2', '3', '5'])
  expect(await approvedAt()).toEqual({ '1': T1, '2': null, '3': null, '4': null, '5': T5 })

  await deploy()
  expect(rewritten(filled, await versions())).toEqual([])
  expect(await approvedAt()).toEqual({ '1': T1, '2': null, '3': null, '4': null, '5': T5 })
})

test('the runner claims a nightly run with its date as YYYY-MM-DD text, whatever the DateStyle (#289)', async () => {
  await addCareer('night-title')
  await addCareer('manual-title', { daily: false })
  const manualId = crypto.randomUUID()
  await addRun(manualId, 'manual-title', 'queued', { createdAt: '2026-10-24T00:00:00Z' })
  expect(await queueDailyRefresh(sql, '2026-10-25')).toEqual({ titles: 1, queued: 1 })

  // In this DateStyle a date cast to text reads 25/10/2026.
  await db.exec("SET DateStyle = 'SQL, DMY'")
  let claimed: unknown[]
  try {
    claimed = [
      ...(await sql.query(CLAIM_NEXT_RUN)),
      ...(await sql.query(CLAIM_NEXT_RUN)),
      ...(await sql.query(CLAIM_NEXT_RUN))
    ]
  } finally {
    await db.exec('RESET DateStyle')
  }
  // Oldest first: the manual run, then the nightly one, then nothing.
  expect(claimed.map((row) => parseQueuedJobstreetRun(row))).toEqual([
    { id: manualId, career_slug: 'manual-title', mode: 'breadth', source: 'manual', scheduled_for: null },
    {
      id: expect.any(String),
      career_slug: 'night-title',
      mode: 'breadth',
      source: 'schedule',
      scheduled_for: '2026-10-25'
    }
  ])
  const statuses = await db.query('SELECT status FROM jobstreet_scrape_runs WHERE started_at IS NOT NULL')
  expect(statuses.rows).toEqual([{ status: 'running' }, { status: 'running' }])
})
