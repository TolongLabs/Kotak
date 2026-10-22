import { RoleMatchRequestSchema, RoleMatchResponseSchema, type RoleMatchResponse } from '@kotak/shared'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import { generateCached, type AiDeps } from '../ai/deps'
import type { AiBindings } from '../ai/env'
import { invalidRequest, tooLarge } from '../ai/errors'
import type { OccupationIndex } from '../ai/occupation-index'

const MatchDraftSchema = z.object({ onet_code: z.string().nullable() })

const MATCH_INSTRUCTIONS = `You match job titles typed by workers in Malaysia to the closest occupation in the O*NET 30.1 list below. A title may be in English, in Malay or in a local form, for example "jurutera perisian" or "akauntan".

Reply with the O*NET-SOC code of the single closest occupation, copied exactly from the list. Reply with null when the text is not a job title or when no occupation in the list is close.

O*NET 30.1 occupations, one per line as code and title:`

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

function respond(body: RoleMatchResponse) {
  return RoleMatchResponseSchema.parse(body)
}

export function createRolesRoute(deps: AiDeps) {
  const route = new Hono<{ Bindings: AiBindings }>()

  route.post('/match', bodyLimit({ maxSize: 2 * 1024, onError: tooLarge(2 * 1024) }), async (context) => {
    const request = RoleMatchRequestSchema.safeParse(await context.req.json().catch(() => null))
    if (!request.success) return invalidRequest(context, request.error)
    const found = deps.occupations.search(request.data.job_title)

    // Title search first. A single exact title or alternate title needs no AI and no confirmation. A title that
    // several occupations share ("Teacher") stays with title search too: the top hit, for the user to confirm.
    if (found.match === 'exact') {
      return context.json(
        respond({
          occupation: found.hits[0],
          needs_confirmation: found.hits.length > 1,
          match_source: 'title_search',
          cached: false
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

  return route
}
