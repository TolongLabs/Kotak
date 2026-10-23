import type { ExecutionContext } from 'hono'
import { app } from './app'
import { serveAdminDocument, type ScraperAdminBindings } from './admin-auth'
import type { AiBindings } from './ai/env'
import { refreshAllListingSkills } from './market/stats'
import { jobstreetDatabase } from './scrapers/jobstreet/database'
import type { KotakBindings } from './tool-deps'

type ScheduledController = { scheduledTime: number; cron: string }
type AgentNamespace = {
  getByName: (name: string, options: { locationHint: 'apac' }) => { fetch: (request: Request) => Promise<Response> }
}

// The free plan gives a Worker request 10 ms of CPU, but an MCP call or one of Kopi's chat turns takes 15 to 130 ms on
// the live Worker, and the MCP layer alone takes about 14 (#202). A Durable Object request gets 30 s of CPU, so the
// Worker hands these routes to one object that runs the same Hono app. It also keeps the role files it parsed warm.
const AGENT_PATHS = new Set(['/api/mcp', '/api/agent/chat'])

export class KotakAgent {
  readonly #env: unknown

  constructor(_state: unknown, env: unknown) {
    this.#env = env
  }

  async fetch(request: Request) {
    return app.fetch(await readBody(request), this.#env)
  }
}

// The largest body a forwarded route accepts: Kopi's chat takes 64 KiB, /api/mcp 16 KiB.
const AGENT_BODY_LIMIT = 64 * 1024

// The Worker streams the request body to the object, and throws if that stream is still open after its response is
// sent. A route that answers 403 or 413 before reading the whole body would leave it open, including a chunked body
// that bodyLimit stops reading part way (#212). So the object reads the whole body first. It keeps at most one byte
// past the largest limit, which still trips each route's own 413.
async function readBody(request: Request): Promise<Request> {
  if (!request.body) return request
  const kept: Uint8Array<ArrayBuffer>[] = []
  let size = 0
  for await (const chunk of request.body) {
    if (size <= AGENT_BODY_LIMIT) kept.push(chunk.slice(0, AGENT_BODY_LIMIT + 1 - size))
    size += chunk.byteLength
  }
  // The body's length now comes from the buffer, so a Content-Length for a longer body must not travel with it.
  const headers = new Headers(request.headers)
  headers.delete('content-length')
  return new Request(request, { body: new Blob(kept), headers })
}
type AssetsBinding = { fetch(request: Request): Promise<Response> }
type WorkerBindings = AiBindings &
  KotakBindings &
  ScraperAdminBindings & { ASSETS?: AssetsBinding; KOTAK_AGENT?: AgentNamespace }

function singaporeDate(date: Date) {
  const values = new Map(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  )
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`
}

export default {
  async fetch(request: Request, env: WorkerBindings, executionContext: ExecutionContext) {
    if (env.KOTAK_AGENT && AGENT_PATHS.has(new URL(request.url).pathname)) {
      // Kotak's users are in Malaysia; the hint only places the object when it is first created.
      return env.KOTAK_AGENT.getByName('kotak', { locationHint: 'apac' }).fetch(request)
    }
    const url = new URL(request.url)
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      return serveAdminDocument(request, env.DATABASE_URL, env.ASSETS)
    }
    return app.fetch(request, env, executionContext)
  },
  async scheduled(controller: ScheduledController, env: { DATABASE_URL?: string }) {
    const url = env.DATABASE_URL?.trim()
    if (!url) throw new Error('DATABASE_URL must be configured for the daily JobStreet queue')
    const sql = jobstreetDatabase(url)
    const scheduledFor = singaporeDate(new Date(controller.scheduledTime))
    // Admins choose which search titles the midnight refresh covers.
    const careers = (await sql.query(
      'SELECT slug FROM jobstreet_careers WHERE enabled AND daily_refresh ORDER BY created_at, slug'
    )) as Array<{ slug: string }>
    for (const career of careers) {
      await sql.query(
        `INSERT INTO jobstreet_scrape_runs (id, career_slug, mode, status, source, scheduled_for)
         SELECT $1, $2, 'breadth', 'queued', 'schedule', $3::date
         WHERE NOT EXISTS (
           SELECT 1 FROM jobstreet_scrape_runs
           WHERE career_slug = $2 AND status IN ('queued', 'running')
         )
         ON CONFLICT DO NOTHING`,
        [crypto.randomUUID(), career.slug, scheduledFor]
      )
    }
    console.info(
      `Queued daily JobStreet breadth refresh for ${careers.length} search title(s) on ${scheduledFor} (Asia/Singapore).`
    )
    // The job-ad market (#271): match the skills of listings scraped or changed since the last night. Postgres does the
    // work, so the Worker only waits. Each batch is one of the 50 subrequests the free plan gives an invocation,
    // shared with the queueing above.
    try {
      const matched = await refreshAllListingSkills(sql, { batch: 1000, maxBatches: 10 })
      console.info(`Matched skills for ${matched} JobStreet listing(s).`)
    } catch (error) {
      console.error('Could not match listing skills:', error instanceof Error ? error.message : error)
    }
  }
}
