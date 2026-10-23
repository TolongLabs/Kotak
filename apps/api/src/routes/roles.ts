import {
  RoleAliasSchema,
  RoleAliasesResponseSchema,
  RoleMatchRequestSchema,
  RoleMatchResponseSchema,
  type RoleAlias,
  type RoleMatchResponse
} from '@kotak/shared'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import { generateCached, type AiDeps } from '../ai/deps'
import type { AiBindings } from '../ai/env'
import { fail, invalidRequest, tooLarge } from '../ai/errors'
import type { OccupationIndex } from '../ai/occupation-index'
import { getConfig } from '../config'
import { jobstreetDatabase } from '../scrapers/jobstreet/database'

const MatchDraftSchema = z.object({ onet_code: z.string().nullable() })

const MATCH_INSTRUCTIONS = `You match job titles typed by workers in Malaysia to the closest occupation in the O*NET 30.1 list below. A title may be in English, in Malay or in a local form, for example "jurutera perisian" or "akauntan".

Reply with the O*NET-SOC code of the single closest occupation, copied exactly from the list. Reply with null when the text is not a job title or when no occupation in the list is close.

O*NET 30.1 occupations, one per line as code and title:`

const PICK_INSTRUCTIONS = `You match job titles typed by workers in Malaysia to O*NET 30.1 occupations. The title the user sends is an exact title of every occupation listed with it, so pick the one a worker in Malaysia most likely means by it.

Reply with the O*NET-SOC code of that occupation, copied exactly from the list. Reply with null when none of them fits.`

const systemPrompts = new WeakMap<OccupationIndex, string>()

function matchSystemPrompt(index: OccupationIndex): string {
  let prompt = systemPrompts.get(index)
  if (!prompt) {
    const lines = index.occupations.map((occupation) => `${occupation.onet_code} ${occupation.title}`)
    prompt = `${MATCH_INSTRUCTIONS}\n${lines.join('\n')}`
    systemPrompts.set(index, prompt)
  }
  return prompt
}

// The title as Claude sees it and as the cache key hashes it: case and spacing do not matter.
function promptTitle(title: string): string {
  return title.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}

// Approved market titles, kept for a minute per database so a busy check-up does not query Neon on every page view.
// While Neon is unreachable, a list up to an hour old is served instead of none.
const ALIASES_TTL_MS = 60_000
const ALIASES_STALE_MS = 60 * 60_000
const aliasesCache = new Map<string, { expires: number; aliases: RoleAlias[] }>()

function respond(body: RoleMatchResponse) {
  return RoleMatchResponseSchema.parse(body)
}

export function createRolesRoute(deps: AiDeps) {
  const route = new Hono<{ Bindings: AiBindings }>()

  route.post('/match', bodyLimit({ maxSize: 2 * 1024, onError: tooLarge(2 * 1024) }), async (context) => {
    const request = RoleMatchRequestSchema.safeParse(await context.req.json().catch(() => null))
    if (!request.success) return invalidRequest(context, request.error)
    const found = deps.occupations.search(request.data.job_title)

    // Title search first. A single exact title or alternate title needs no AI and no confirmation. An official
    // O*NET title that is also another occupation's alternate title stays with its own occupation, for the user to
    // confirm.
    if (found.match === 'exact' && (found.hits.length === 1 || found.official)) {
      return context.json(
        respond({
          occupation: found.hits[0],
          needs_confirmation: found.hits.length > 1,
          match_source: 'title_search',
          cached: false
        })
      )
    }

    // A title that several occupations share as an alternate title ("Teacher" has 23): Claude picks among them all,
    // and the user confirms the pick (#145). Without a usable pick, the top hit stays, as title search ranks it.
    if (found.match === 'exact') {
      const candidates = deps.occupations.search(request.data.job_title, deps.occupations.occupations.length).hits
      const lines = candidates.map((occupation) => `${occupation.onet_code} ${occupation.title}`)
      const pick = await generateCached(
        deps,
        context,
        {
          system: PICK_INSTRUCTIONS,
          user: `Job title: ${JSON.stringify(promptTitle(request.data.job_title))}\n\nOccupations with this exact title, one per line as code and title:\n${lines.join('\n')}`,
          effort: 'low',
          max_tokens: 4096
        },
        MatchDraftSchema
      )
      const cached = pick?.cached ?? false
      const chosen = candidates.find((occupation) => occupation.onet_code === pick?.value.onet_code?.trim())
      if (chosen) {
        return context.json(respond({ occupation: chosen, needs_confirmation: true, match_source: 'claude', cached }))
      }
      const fallback_reason = pick ? 'no_valid_suggestion' : 'ai_unavailable'
      return context.json(
        respond({
          occupation: found.hits[0],
          needs_confirmation: true,
          match_source: 'title_search',
          cached,
          fallback_reason
        })
      )
    }

    // A partial match or no match goes to Claude, which picks from the whole O*NET list.
    const suggestion = await generateCached(
      deps,
      context,
      {
        system: matchSystemPrompt(deps.occupations),
        user: `Job title: ${JSON.stringify(promptTitle(request.data.job_title))}`,
        effort: 'low',
        max_tokens: 4096,
        cache_system: true
      },
      MatchDraftSchema
    )
    const cached = suggestion?.cached ?? false

    // Claude's code counts only if it is in the O*NET list; the title always comes from the list.
    const code = suggestion?.value.onet_code
    const occupation = code ? deps.occupations.getOccupation(code) : null
    if (occupation) {
      return context.json(respond({ occupation, needs_confirmation: true, match_source: 'claude', cached }))
    }

    // Without a usable suggestion, the top partial hit is the closest that title search can do.
    const fallback_reason = suggestion ? 'no_valid_suggestion' : 'ai_unavailable'
    const [top] = found.hits
    return context.json(
      respond(
        top
          ? { occupation: top, needs_confirmation: true, match_source: 'title_search', cached, fallback_reason }
          : { occupation: null, needs_confirmation: false, match_source: 'none', cached, fallback_reason }
      )
    )
  })

  // Market titles an admin approved from JobStreet listings (the review flow on /admin/scraping): a search title that
  // is not hidden and has a listing approved under its current O*NET occupation. Public and read-only: only a title
  // and its O*NET code, and only for occupations in the O*NET list. A row that does not fit is left out.
  route.get('/aliases', async (context) => {
    const databaseUrl = getConfig(context, 'DATABASE_URL')
    if (!databaseUrl) return context.json(RoleAliasesResponseSchema.parse({ aliases: [] }))
    const cached = aliasesCache.get(databaseUrl)
    let aliases = cached && cached.expires > Date.now() ? cached.aliases : null
    if (!aliases) {
      try {
        const rows = await jobstreetDatabase(databaseUrl).query(
          `SELECT career.title, career.onet_code FROM jobstreet_careers career
           WHERE NOT career.hidden AND career.onet_code IS NOT NULL
             AND EXISTS (
               SELECT 1 FROM jobstreet_listing_reviews review
               WHERE review.career_slug = career.slug AND review.approved AND review.onet_code = career.onet_code
             )
           ORDER BY career.title`
        )
        aliases = rows.flatMap((row) => {
          const alias = RoleAliasSchema.safeParse(row)
          return alias.success && deps.occupations.getOccupation(alias.data.onet_code) ? [alias.data] : []
        })
        aliasesCache.set(databaseUrl, { expires: Date.now() + ALIASES_TTL_MS, aliases })
      } catch (error) {
        console.error('Could not read approved job titles:', error instanceof Error ? error.message : error)
        if (!cached || cached.expires + ALIASES_STALE_MS < Date.now())
          return fail(context, 503, 'unavailable', 'Approved job titles are unavailable right now.')
        aliases = cached.aliases
      }
    }
    context.header('Cache-Control', 'public, max-age=300')
    return context.json(RoleAliasesResponseSchema.parse({ aliases }))
  })

  return route
}
