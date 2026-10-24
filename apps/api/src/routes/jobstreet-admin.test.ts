import { afterAll, beforeAll, expect, test } from 'bun:test'
import type { PGlite } from '@electric-sql/pglite'
import { Hono } from 'hono'
import { migratedDatabase, routeNeonTo, TEST_DATABASE_URL } from '../../db/test-database'
import type { AiDeps } from '../ai/deps'
import { onetOccupationIndex } from '../ai/occupation-index'
import { createJobstreetAdminRoute } from './jobstreet-admin'

// Sorting through the admin route as the app mounts it, with a signed-in admin, a Postgres built by the repo's
// migrations (PGlite, in memory), a fake Claude and a limiter that records the keys it is asked to count.

const TOKEN = 'route-test-session-token'.padEnd(43, '0')
const previousDatabaseUrl = process.env.DATABASE_URL
let db: PGlite
let restoreNeon: () => void

beforeAll(async () => {
  db = await migratedDatabase()
  restoreNeon = routeNeonTo(db)
  // The app reads DATABASE_URL from the environment on Bun.
  process.env.DATABASE_URL = TEST_DATABASE_URL
  await db.query(
    `WITH admin AS (
       INSERT INTO scraper_admin_users (username, password_hash)
       VALUES ('tester', crypt('unused-test-password', gen_salt('bf', 4))) RETURNING id
     )
     INSERT INTO scraper_admin_sessions (token_hash, user_id, expires_at)
     SELECT $1, id, now() + interval '1 hour' FROM admin`,
    [new Bun.CryptoHasher('sha256').update(TOKEN).digest('hex')]
  )
  // A seeded search title with an occupation, and two finished breadth batches, each with one listing title that
  // isn't the search title, so Claude is asked about it.
  await db.exec("UPDATE jobstreet_careers SET onet_code = '15-1252.00' WHERE slug = 'software-engineer'")
  for (const [runId, jobId, title] of [
    ['batch-a', '1', 'Backend Developer'],
    ['batch-b', '2', 'Platform Engineer']
  ]) {
    await db.query(
      `INSERT INTO jobstreet_scrape_runs (id, career_slug, mode, status, source)
       VALUES ($1, 'software-engineer', 'breadth', 'success', 'manual')`,
      [runId]
    )
    await db.query(
      `INSERT INTO jobstreet_listings (job_id, career_slug, latest_payload, latest_seen_at)
       VALUES ($1, 'software-engineer', $2, now())`,
      [jobId, { title }]
    )
    await db.query(
      `INSERT INTO jobstreet_observations (job_id, career_slug, scrape_run_id, observed_at, payload)
       VALUES ($1, 'software-engineer', $2, now(), $3)`,
      [jobId, runId, { title }]
    )
  }
}, 30_000)

afterAll(async () => {
  if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = previousDatabaseUrl
  restoreNeon()
  await db.close()
})

test('sorting two batches counts both Claude requests against the one jobstreet-classify key (#266)', async () => {
  const keys: string[] = []
  const deps: AiDeps = {
    occupations: onetOccupationIndex,
    // Claude's answer: every numbered title in the request is a match, copied back.
    model: () => ({
      generate: async (request, schema) =>
        schema.parse({
          verdicts: [...request.user.matchAll(/^(\d+)\. (".*")$/gm)].map(([, number, title]) => ({
            number: Number(number),
            title: JSON.parse(title),
            verdict: 'match'
          }))
        })
    }),
    agent: () => null,
    cache: () => {
      throw new Error('Sorting does not use the response cache')
    },
    limiter: () => ({
      limit: async ({ key }) => {
        keys.push(key)
        return { success: true }
      }
    })
  }
  const app = new Hono().route('/api/admin/scraper', createJobstreetAdminRoute(deps))
  const classify = (runId: string) =>
    app.request(`/api/admin/scraper/runs/${runId}/classify`, {
      method: 'POST',
      headers: {
        Cookie: `__Host-kotak_scraper_admin=${TOKEN}`,
        'Content-Type': 'application/json',
        Origin: 'http://localhost'
      },
      body: '{}'
    })

  for (const runId of ['batch-a', 'batch-b']) {
    const response = await classify(runId)
    expect(await response.json()).toEqual({ sorted: 1, remaining: 0 })
  }
  // Each batch has its own path; without the route's key, each would get its own allowance.
  expect(keys).toEqual(['jobstreet-classify', 'jobstreet-classify'])
  const verdicts = await db.query('SELECT title, verdict, source FROM jobstreet_title_verdicts ORDER BY title')
  expect(verdicts.rows).toEqual([
    { title: 'Backend Developer', verdict: 'match', source: 'claude' },
    { title: 'Platform Engineer', verdict: 'match', source: 'claude' }
  ])
})
