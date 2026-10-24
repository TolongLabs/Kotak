import { afterAll, beforeAll, expect, test } from 'bun:test'
import type { PGlite } from '@electric-sql/pglite'
import { migratedDatabase, routeNeonTo, TEST_DATABASE_URL } from '../../db/test-database'
import { market } from './market'

// GET /api/market (#271) against a Postgres built by the repo's own migrations (PGlite, in memory). On Bun the route
// reads DATABASE_URL from the process environment, so each test sets it; the Neon driver is routed to PGlite, so no
// test reaches a real database.

let db: PGlite
let restoreNeon: () => void
const savedUrl = process.env.DATABASE_URL

beforeAll(async () => {
  db = await migratedDatabase()
  restoreNeon = routeNeonTo(db)
  await db.exec(
    `INSERT INTO jobstreet_careers (slug, title, search_url, enabled, daily_refresh, hidden, onet_code)
     VALUES ('web-developer', 'Web Developer', 'https://my.jobstreet.com/web-developer-jobs', true, false, false, '15-1254.00');
     INSERT INTO jobstreet_scrape_runs (id, career_slug, mode, status, source)
     VALUES ('run-web', 'web-developer', 'breadth', 'success', 'manual');
     INSERT INTO jobstreet_listings (job_id, career_slug, latest_payload, latest_seen_at)
     VALUES ('1', 'web-developer', '{"title": "Web Developer", "location": "Kuala Lumpur"}', now());
     INSERT INTO jobstreet_observations (job_id, career_slug, scrape_run_id, observed_at, payload)
     VALUES ('1', 'web-developer', 'run-web', now(), '{}');
     INSERT INTO jobstreet_listing_reviews (job_id, career_slug, approved, onet_code, scrape_run_id)
     VALUES ('1', 'web-developer', true, '15-1254.00', 'run-web');`
  )
}, 30_000)

afterAll(async () => {
  restoreNeon()
  await db.close()
  if (savedUrl === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = savedUrl
})

test('refuses no codes, codes Kotak does not know, and more than 10 codes', async () => {
  process.env.DATABASE_URL = TEST_DATABASE_URL
  // 11 codes Kotak knows, one more than a request may ask for.
  const eleven = [
    '15-1252.00',
    '15-1254.00',
    '15-1255.00',
    '15-1212.00',
    '15-2051.00',
    '13-2011.00',
    '17-2141.00',
    '17-2051.00',
    '17-2071.00',
    '29-1141.00',
    '29-1051.00'
  ].join(',')
  for (const query of ['', 'codes=', 'codes=99-9999.99', `codes=${eleven}`, 'codes=15-1254.00,not-a-code']) {
    const response = await market.request(`/?${query}`)
    expect(response.status).toBe(400)
  }
})

test('answers each role with approved ads, leaves the rest out, and lets browsers keep it for 5 minutes', async () => {
  process.env.DATABASE_URL = TEST_DATABASE_URL
  const response = await market.request('/?codes=15-1254.00,15-1252.00')
  expect(response.status).toBe(200)
  expect(response.headers.get('Cache-Control')).toBe('public, max-age=300')
  const body = (await response.json()) as { markets: Array<{ onet_code: string }>; database_available: boolean }
  expect(body.database_available).toBe(true)
  expect(body.markets.map((item) => item.onet_code)).toEqual(['15-1254.00'])
})

test('without a database it says so, and the answer is not kept', async () => {
  delete process.env.DATABASE_URL
  const response = await market.request('/?codes=15-1254.00')
  expect(response.status).toBe(200)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  expect(await response.json()).toEqual({ markets: [], database_available: false })
})
