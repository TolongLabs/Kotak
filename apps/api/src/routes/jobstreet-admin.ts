import { Hono } from 'hono'
import { noStore, requireScraperAdmin, type ScraperAdminEnv } from '../admin-auth'
import { getConfig } from '../config'
import { JOBSTREET_CAREERS } from '../scrapers/jobstreet/careers'
import { jobstreetDatabase } from '../scrapers/jobstreet/database'

const route = new Hono<ScraperAdminEnv>()

route.use('*', noStore, requireScraperAdmin)

route.get('/careers', async (context) => {
  const databaseUrl = getConfig(context, 'DATABASE_URL')
  if (!databaseUrl) return context.json({ error: 'database is not configured' }, 503)
  const sql = jobstreetDatabase(databaseUrl)
  const rows = (await sql.query(
    `SELECT career.slug, career.title, career.search_url, career.enabled,
      (SELECT count(*)::int FROM jobstreet_listings listing WHERE listing.career_slug = career.slug) AS listing_count,
      (SELECT count(*)::int FROM jobstreet_listings listing WHERE listing.career_slug = career.slug AND listing.latest_detail IS NOT NULL) AS described_count
     FROM jobstreet_careers career ORDER BY career.title`
  )) as Array<Record<string, unknown>>
  return context.json({ careers: rows })
})

route.get('/runs', async (context) => {
  const databaseUrl = getConfig(context, 'DATABASE_URL')
  if (!databaseUrl) return context.json({ error: 'database is not configured' }, 503)
  const sql = jobstreetDatabase(databaseUrl)
  const rows = await sql.query(
    `SELECT run.id, run.career_slug, career.title AS career_title, run.mode, run.status, run.source,
      run.scheduled_for, run.created_at, run.started_at, run.finished_at, run.report, run.error
     FROM jobstreet_scrape_runs run JOIN jobstreet_careers career ON career.slug = run.career_slug
     ORDER BY run.created_at DESC LIMIT 50`
  )
  return context.json({ runs: rows })
})

route.get('/jobs', async (context) => {
  const databaseUrl = getConfig(context, 'DATABASE_URL')
  if (!databaseUrl) return context.json({ error: 'database is not configured' }, 503)
  const careerSlug = context.req.query('career')
  const sql = jobstreetDatabase(databaseUrl)
  const rows = careerSlug
    ? await sql.query(
        `SELECT job_id, career_slug, latest_payload, latest_seen_at, latest_detail
         FROM jobstreet_listings WHERE career_slug = $1 ORDER BY latest_seen_at DESC LIMIT 100`,
        [careerSlug]
      )
    : await sql.query(
        `SELECT job_id, career_slug, latest_payload, latest_seen_at, latest_detail
         FROM jobstreet_listings ORDER BY latest_seen_at DESC LIMIT 100`
      )
  return context.json({ jobs: rows })
})

route.post('/runs', async (context) => {
  const body = await context.req.json().catch(() => null)
  if (!body || typeof body !== 'object') return context.json({ error: 'invalid request' }, 400)
  const input = body as { career_slug?: unknown; mode?: unknown }
  const career = JOBSTREET_CAREERS.find((candidate) => candidate.slug === input.career_slug)
  if (!career || (input.mode !== 'breadth' && input.mode !== 'depth'))
    return context.json({ error: 'choose a supported career and breadth or depth mode' }, 400)
  const databaseUrl = getConfig(context, 'DATABASE_URL')
  if (!databaseUrl) return context.json({ error: 'database is not configured' }, 503)
  const sql = jobstreetDatabase(databaseUrl)
  const runId = crypto.randomUUID()
  try {
    const rows = await sql.query(
      `INSERT INTO jobstreet_scrape_runs (id, career_slug, mode, status, source)
       VALUES ($1, $2, $3, 'queued', 'manual') RETURNING id, career_slug, mode, status, created_at`,
      [runId, career.slug, input.mode]
    )
    return context.json({ run: rows[0] }, 202)
  } catch (error) {
    if (String(error).includes('jobstreet_scrape_runs_one_active_per_career_idx'))
      return context.json({ error: 'a scrape for this career is already queued or running' }, 409)
    console.error('Could not queue JobStreet run:', error instanceof Error ? error.message : error)
    return context.json({ error: 'could not queue the scrape' }, 503)
  }
})

export const jobstreetAdmin = route
