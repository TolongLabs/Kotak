import { JOB_MARKET_MAX_CODES, JobMarketResponseSchema, type JobMarket, type JobMarketResponse } from '@kotak/shared'
import { Hono, type Context } from 'hono'
import { fail } from '../ai/errors'
import { onetOccupationIndex } from '../ai/occupation-index'
import { getConfig } from '../config'
import { readJobMarkets } from '../market/stats'
import { jobstreetDatabase } from '../scrapers/jobstreet/database'

// GET /api/market?codes=15-1254.00,15-1252.00 (#271): what Malaysian job ads say about each role, from JobStreet ads an
// admin approved under its O*NET occupation. Public and read-only: counts, pay quartiles and shares only, never an
// ad's text, title or employer. Roles with no approved ads are left out.

// Admins approve ads only under the 923 occupations Kotak knows, so other codes are refused, and the cache holds at
// most one answer for each of those. Each role's answer is kept for a minute per isolate; while Neon is unreachable,
// one up to an hour old is served.
const isKnownCode = (code: string) => onetOccupationIndex.getOccupation(code) !== null
const FRESH_MS = 60_000
const STALE_MS = 60 * 60_000
const cache = new Map<string, { at: number; market: JobMarket | null }>()

/** The job-ad market for these roles, as GET /api/market answers it; the job_market tool calls it too. */
export async function jobMarketsFor(context: Context, codes: string[]): Promise<JobMarketResponse> {
  const databaseUrl = getConfig(context, 'DATABASE_URL')
  if (!databaseUrl) return { markets: [], database_available: false }
  const key = (code: string) => `${databaseUrl}\n${code}`
  const now = Date.now()
  codes = codes.filter(isKnownCode)
  const missing = codes.filter((code) => {
    const hit = cache.get(key(code))
    return !hit || now - hit.at > FRESH_MS
  })
  let databaseAvailable = true
  if (missing.length) {
    try {
      const markets = await readJobMarkets(jobstreetDatabase(databaseUrl), missing)
      const byCode = new Map(markets.map((market) => [market.onet_code, market]))
      for (const code of missing) cache.set(key(code), { at: now, market: byCode.get(code) ?? null })
    } catch (error) {
      console.error('Could not read the job-ad market:', error instanceof Error ? error.message : error)
      databaseAvailable = false
    }
  }
  const markets = codes.flatMap((code) => {
    const hit = cache.get(key(code))
    return hit && now - hit.at <= STALE_MS && hit.market ? [hit.market] : []
  })
  return { markets, database_available: databaseAvailable }
}

export const market = new Hono().get('/', async (context) => {
  const codes = [
    ...new Set(
      (context.req.query('codes') ?? '')
        .split(',')
        .map((code) => code.trim())
        .filter(Boolean)
    )
  ]
  if (!codes.length || codes.length > JOB_MARKET_MAX_CODES || !codes.every(isKnownCode))
    return fail(
      context,
      400,
      'invalid_request',
      `Send codes as 1 to ${JOB_MARKET_MAX_CODES} O*NET-SOC codes of Kotak's occupations separated by commas, such as 15-1254.00.`
    )
  const body = JobMarketResponseSchema.parse(await jobMarketsFor(context, codes))
  context.header('Cache-Control', body.database_available ? 'public, max-age=300' : 'no-store')
  return context.json(body)
})
