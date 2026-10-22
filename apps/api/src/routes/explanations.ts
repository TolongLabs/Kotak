import { ExplanationRequestSchema, ExplanationResponseSchema, type ExplanationRequest } from '@kotak/shared'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { generateCached, type AiDeps } from '../ai/deps'
import type { AiBindings } from '../ai/env'
import { invalidRequest, tooLarge } from '../ai/errors'
import { buildExplanations, cornerName, ExplanationDraftSchema } from '../ai/verifier'

const EXPLAIN_SYSTEM = `You write the explanations in Kotak, a career check-up for workers in Malaysia. Fixed rules have already set every verdict and level from dated public sources. You explain them and never change them.

The input lists the skill corners from one snapshot. Each corner has a corner_id, a name, a verdict, the user's self-reported level, the target level on the same 0 to 3 scale, and dated sources. It may also have previous_verdict, its verdict in the earlier snapshot.

For each corner, write two plain-English sentences that explain the verdict and whether the user's level is below, at or above the target. sentence_1 and sentence_2 each hold exactly one sentence.
- State the verdict plainly in the present tense with its exact label, for example "Problem Solving is Rising". Do not negate, date or hedge it (no "not", "no longer", "was", "could"), and do not use the words Rising, Steady, Declining, Split or Unknown except for that label.
- Cite at least one of the corner's sources as (source_name, vintage_date): the exact name, then its own date, for example (Anthropic Economic Index, 2026-04-01). Every source you name must carry its own date.
- Write no other digits: no levels, percentages, years or snapshot ids. The app shows the numbers.
- Use only facts in the input, and invent no statistic, task, job, course or quote.

Then write what_changed_summary in one or two sentences. For each corner whose previous_verdict differs from its verdict, write "<name> moved from <previous_verdict> to <verdict>" with the corner's exact name before its own two labels, and cite at least one source the same way. If no corner moved, or no previous_verdict is given, say that no verdict changed, without using any verdict label. The same rules on digits and on negating labels apply.

Return one entry for each corner_id, in the input order.`

// The normalised input Claude sees. Source URLs are left out: the text cites names and dates only.
function promptInput(request: ExplanationRequest) {
  return {
    snapshot_id: request.snapshot_id,
    corners: request.corners.map((corner) => ({
      corner_id: corner.corner_id,
      name: cornerName(corner),
      verdict: corner.verdict,
      previous_verdict: corner.previous_verdict,
      user_level: corner.user_level,
      target_level: corner.target_level,
      sources: corner.sources.map(({ source_name, vintage_date, geo_or_layer }) => ({
        source_name,
        vintage_date,
        geo_or_layer
      }))
    }))
  }
}

export function createExplanationsRoute(deps: AiDeps) {
  const route = new Hono<{ Bindings: AiBindings }>()

  route.post('/', bodyLimit({ maxSize: 32 * 1024, onError: tooLarge(32 * 1024) }), async (context) => {
    const request = ExplanationRequestSchema.safeParse(await context.req.json().catch(() => null))
    if (!request.success) return invalidRequest(context, request.error)

    const draft = await generateCached(
      deps,
      context,
      {
        system: EXPLAIN_SYSTEM,
        user: JSON.stringify(promptInput(request.data)),
        effort: 'medium',
        max_tokens: 16000
      },
      ExplanationDraftSchema
    )
    // The verifier runs on every answer, cached or new, so a cached draft is held to the current checks.
    const response = { ...buildExplanations(request.data, draft?.value ?? null), cached: draft?.cached ?? false }
    return context.json(ExplanationResponseSchema.parse(response))
  })

  return route
}
