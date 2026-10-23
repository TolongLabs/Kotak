import type { ExecutionContext } from 'hono'
import { app } from './app'
import { validateSessionRequest, type ScraperAdminBindings } from './admin-auth'
import type { AiBindings } from './ai/env'
import { jobstreetDatabase } from './scrapers/jobstreet/database'
import { JOBSTREET_CAREERS } from './scrapers/jobstreet/careers'
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
    const response = await app.fetch(request, this.#env)
    // A route that answers without reading the body (a cross-origin chat, an oversized call) would leave the Worker
    // streaming it here after its response is sent, which throws there. Draining it lets that stream finish first.
    if (request.body && !request.bodyUsed) for await (const _chunk of request.body);
    return response
  }
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
      if (url.pathname !== '/admin/sign-in') {
        const user = await validateSessionRequest(request, env.DATABASE_URL)
        if (!user || url.pathname === '/admin')
          return new Response(null, {
            status: 302,
            headers: {
              Location: new URL(user ? '/admin/scraping' : '/admin/sign-in', url).href,
              'Cache-Control': 'no-store'
            }
          })
      }
      if (!env.ASSETS) return new Response('Admin interface is unavailable.', { status: 503 })
      const response = await env.ASSETS.fetch(request)
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'no-store')
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
    }
    return app.fetch(request, env, executionContext)
  },
  async scheduled(controller: ScheduledController, env: { DATABASE_URL?: string }) {
    const url = env.DATABASE_URL?.trim()
    if (!url) throw new Error('DATABASE_URL must be configured for the daily JobStreet queue')
    const sql = jobstreetDatabase(url)
    const scheduledFor = singaporeDate(new Date(controller.scheduledTime))
    for (const career of JOBSTREET_CAREERS) {
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
    console.info(`Queued daily JobStreet breadth refresh for ${scheduledFor} (Asia/Singapore).`)
  }
}
