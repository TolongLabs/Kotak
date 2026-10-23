import { z } from 'zod'
import { OnetTaskIdSchema, type OnetTask } from '../data/onet'
import type { OccupationCorners } from '../data/role-corners'
import { MAX_CORNERS, type CornerGroup } from './groups'
import { SDG_TARGETS } from './sdg-targets'
import { searchResource, validateOccupationCorners, type CornerValidation } from './validate'

// Model-agnostic prompt and parser for the corner batch (#74), used by the RunPod runner (#77). The planned Claude
// Message Batches backup (#79) was never needed. A caller maps `CornerRequest` onto its API:
// - OpenAI-compatible (vLLM on RunPod): `system` becomes the first message; `schema` goes in
//   `response_format: { type: 'json_schema', json_schema: { name: schema_name, schema } }`; `temperature: 0` is fine.
// - Claude Messages API: `system` and `messages` map directly; `schema` goes in
//   `output_config: { format: { type: 'json_schema', schema } }`. Send no `temperature`: the API rejects it.
// The schema uses only keywords both accept: no numeric or length limits, and `minItems` of at most 1. The parser
// enforces the rest. AI only groups the occupation's own tasks and drafts text; code builds IDs, IWAs and links.

export interface CornerPromptInput {
  onet_code: string
  title: string
  description: string
  /** The occupation's candidate groups from `corner-groups.json`. */
  groups: readonly CornerGroup[]
  /** The occupation's full O*NET task list from `data/onet/tasks.json`. */
  tasks: readonly OnetTask[]
}

export interface CornerTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface CornerRequest {
  system: string
  messages: CornerTurn[]
  schema_name: string
  schema: Record<string, unknown>
  max_output_tokens: number
}

/** A rejected answer, sent back so the model can correct it. */
export interface CornerRetry {
  previous: string
  errors: string[]
}

export const CORNER_MAX_OUTPUT_TOKENS = 4096

const SYSTEM = `You turn one O*NET occupation's tasks into skill corners for Kotak, an app where Malaysian workers check their skills with yes/no questions. Kotak is advisory: everything you write is labelled auto-generated until a person checks it.

Rules:
1. Use only the task IDs in the request, never others, and put every one of them in exactly one corner. Never invent or reword tasks.
2. Make the number of corners the request asks for, at most ${MAX_CORNERS}. Start from the candidate groups: split a large group or merge small related groups so each corner is one skill a worker would recognise. Keep corners roughly balanced where the tasks allow.
3. name: 2 to 5 plain words naming the skill, such as "Client briefs" or "Print-ready files". No job title, no jargon.
4. statements: three yes/no can-do statements a worker answers about themselves, each grounded in the corner's own tasks. Start each with "I can" or "I have", keep it to one concrete sentence under 25 words, and make the three clearly different:
   - basic: a simple version of the work, done with guidance.
   - working: the work done independently on real jobs.
   - advanced: complex cases, or setting the standard and guiding others.
5. hours: whole-number estimates of the practice hours a learner needs to reach each statement from the level below it (basic from none, working from basic, advanced from working). These are rough estimates; typical ranges are 5 to 40, 20 to 200 and 40 to 400.
6. sdg_targets: 1 to 3 UN SDG target codes that the corner's work directly serves. Examples: 4.4 relevant skills for jobs, 8.2 productivity through technology and innovation, 8.5 decent work for all, 8.8 safe working environments, 3.8 health coverage, 9.4 clean infrastructure, 11.6 urban environmental impact, 12.5 less waste, 16.6 effective institutions. Prefer a specific target; use 8.5 or 4.4 when nothing fits better.
7. resource_queries: 1 or 2 web search queries a learner could type to find free guides, videos or courses for this corner. Write search queries only, never URLs or the names of courses you are unsure exist.

Return only JSON that matches the schema.`

const describeTask = (task: OnetTask) => `- ${task.task_id}: ${task.statement}`

function userMessage(input: CornerPromptInput): string {
  const byId = new Map(input.tasks.map((t) => [t.task_id, t]))
  const taskCount = input.groups.reduce((n, g) => n + g.task_ids.length, 0)
  const corners = Math.min(MAX_CORNERS, taskCount)
  const groups = input.groups.map((group, i) =>
    [`Group ${i + 1}: ${group.name}`, ...group.task_ids.map((id) => describeTask(byId.get(id)!))].join('\n')
  )
  return [
    `Occupation: ${input.title} (O*NET-SOC ${input.onet_code})`,
    `Description: ${input.description}`,
    '',
    `Candidate groups, from the O*NET work activities each task is linked to:`,
    '',
    groups.join('\n\n'),
    '',
    `Make ${corners} corners from these ${taskCount} tasks.`
  ].join('\n')
}

/** The JSON schema for the model's answer; `task_ids` may only take this occupation's candidate task IDs. */
export function cornerResponseSchema(taskIds: readonly number[]): Record<string, unknown> {
  const object = (properties: Record<string, unknown>) => ({
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false
  })
  const tiers = (type: string) => object({ basic: { type }, working: { type }, advanced: { type } })
  const list = (items: Record<string, unknown>) => ({ type: 'array', items, minItems: 1 })
  return object({
    corners: list(
      object({
        task_ids: list({ type: 'integer', enum: [...taskIds] }),
        name: { type: 'string' },
        statements: tiers('string'),
        hours: tiers('integer'),
        sdg_targets: list({ type: 'string', enum: [...SDG_TARGETS] }),
        resource_queries: list({ type: 'string' })
      })
    )
  })
}

/** The request for one occupation; pass `retry` to send a rejected answer back with its errors. */
export function buildCornerRequest(input: CornerPromptInput, retry?: CornerRetry): CornerRequest {
  const messages: CornerTurn[] = [{ role: 'user', content: userMessage(input) }]
  if (retry) {
    messages.push(
      { role: 'assistant', content: retry.previous },
      {
        role: 'user',
        content: `That answer was rejected:\n${retry.errors.map((e) => `- ${e}`).join('\n')}\nReturn the complete corrected JSON.`
      }
    )
  }
  return {
    system: SYSTEM,
    messages,
    schema_name: 'role_corners',
    schema: cornerResponseSchema(input.groups.flatMap((g) => g.task_ids)),
    max_output_tokens: CORNER_MAX_OUTPUT_TOKENS
  }
}

const Statement = z
  .string()
  .trim()
  .regex(/^I (can|have) /, 'must start with "I can" or "I have"')
const Hours = z.number().int().positive().max(2000)

/** The model's answer, before code adds corner IDs, IWAs and resource links. */
export const CornerDraftSchema = z
  .object({
    corners: z
      .array(
        z
          .object({
            task_ids: z.array(OnetTaskIdSchema).min(1),
            name: z.string().trim().min(1).max(60),
            statements: z.object({ basic: Statement, working: Statement, advanced: Statement }).strict(),
            hours: z.object({ basic: Hours, working: Hours, advanced: Hours }).strict(),
            sdg_targets: z.array(z.string().trim().toLowerCase()).min(1),
            resource_queries: z.array(z.string().trim().min(1).max(120)).min(1)
          })
          .strict()
      )
      .min(1)
      .max(MAX_CORNERS)
  })
  .strict()

export type CornerDraft = z.infer<typeof CornerDraftSchema>

export interface CornerProvenance {
  generated_by: OccupationCorners['generated_by']
  model: string
  generated_date: string
}

export type CornerParseResult =
  { ok: true; role: OccupationCorners; validation: CornerValidation } | { ok: false; errors: string[] }

function slug(name: string): string {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Parses and validates the model's text into the `role-corners.json` record for `input`'s occupation. */
export function parseCornerResponse(
  text: string,
  input: CornerPromptInput,
  provenance: CornerProvenance
): CornerParseResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, errors: ['the answer is not valid JSON'] }
  }
  const draft = CornerDraftSchema.safeParse(json)
  if (!draft.success) {
    return { ok: false, errors: draft.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) }
  }
  const iwasOf = new Map(input.tasks.map((t) => [t.task_id, t.iwa_ids]))
  const used = new Set<string>()
  const corners = draft.data.corners.map((c, i) => {
    const base = slug(c.name) || `corner-${i + 1}`
    let id = base
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`
    used.add(id)
    return {
      corner_id: id,
      name: c.name,
      task_ids: [...c.task_ids].sort((a, b) => a - b),
      iwa_ids: [...new Set(c.task_ids.flatMap((t) => iwasOf.get(t) ?? []))].sort(),
      statements: c.statements,
      hours: c.hours,
      sdg_targets: c.sdg_targets,
      resources: c.resource_queries.map(searchResource)
    }
  })
  const role = { onet_code: input.onet_code, quality: 'auto-generated' as const, ...provenance, corners }
  const validation = validateOccupationCorners(
    role,
    input.tasks,
    input.groups.flatMap((g) => g.task_ids)
  )
  return validation.errors.length > 0 ? { ok: false, errors: validation.errors } : { ok: true, role, validation }
}
