import {
  BundleFileError,
  CheckupParamsSchema,
  CheckupReportSchema,
  DEFAULT_SNAPSHOT,
  ManifestSchema,
  QuestionsSchema,
  WhatChangedParamsSchema,
  WhatChangedReportSchema,
  type Kotak
} from '@kotak/sdk'
import {
  NationalViewSummaryRequestSchema,
  OnetSocCodeSchema,
  PREVIOUS_SNAPSHOT,
  SnapshotIdSchema,
  VerdictSchema,
  type NationalViewSummaryRequest,
  type NationalViewSummaryResponse
} from '@kotak/shared'
import { z } from 'zod'
import { TOOL_CATALOG, type ToolName } from './catalog'

// Kotak's tool registry (#184 "Agent layer"): each tool defined once over the SDK, and adapted to MCP (./mcp.ts) and
// to Claude tool use. A tool's name, title and description come from the catalogue; to add a tool, add its catalogue
// entry, then its entry in `registry` below (the type check asks for it), and any dependency it needs in ToolDeps.

/** What the tools run on. The adapters supply them; the registry never reads the clock or the network itself. */
export interface ToolDeps {
  kotak: Kotak
  /** O*NET title and alternate-title search, best first: the role match route's first step, with no Claude call. */
  searchTitles: (
    title: string,
    limit: number
  ) => { match: 'exact' | 'partial' | 'none'; hits: { onet_code: string; title: string }[] }
  /** Today's date as YYYY-MM-DD, the start date of a check-up that gives none. */
  today: () => string
  /** The national view summary, exactly as GET /api/national-view/summary answers it for the same filter. */
  nationalView: (filter: NationalViewSummaryRequest) => Promise<NationalViewSummaryResponse>
}

/** Today in Malaysia, for the adapters' ToolDeps. Malaysia has kept UTC+8, with no daylight saving, since 1982. */
export const malaysiaToday = () => new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)

/** Every Kotak tool only reads public data, gives the same result for the same input, and calls nothing outside. */
export const TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
} as const

export interface KotakTool<I extends z.ZodObject = z.ZodObject, O extends z.ZodObject = z.ZodObject> {
  name: ToolName
  title: string
  description: string
  inputSchema: I
  outputSchema: O
  annotations: typeof TOOL_ANNOTATIONS
  /** Throws an Error whose message tells the model what went wrong (an unknown role, a role not ready). */
  run: (input: z.output<I>, deps: ToolDeps) => Promise<z.input<O>>
}

/** A role file that can't be read is a code Kotak doesn't know: say so in words the model can act on. */
function explain(error: unknown): never {
  const code = error instanceof BundleFileError && /^\/data\/roles\/(.+)\.json$/.exec(error.path)?.[1]
  throw code ? new Error(`Kotak has no role ${code}. Look the job up with find_role and use a code it returns.`) : error
}

function tool<I extends z.ZodObject, O extends z.ZodObject>(
  name: ToolName,
  { run, ...spec }: Pick<KotakTool<I, O>, 'inputSchema' | 'outputSchema' | 'run'>
): KotakTool<I, O> {
  return {
    name,
    ...TOOL_CATALOG[name],
    annotations: TOOL_ANNOTATIONS,
    ...spec,
    run: (input, deps) => run(input, deps).catch(explain)
  }
}

// The SDK's inputs, with a description per field for the model. Defaults stay the SDK's, which are the web app's.
const checkup = CheckupParamsSchema.shape
const assessment = {
  role_code: checkup.role_code.describe("O*NET-SOC code of the user's current job, from find_role, e.g. 15-1254.00."),
  answers: checkup.answers.describe(
    "One entry per corner the user answered, on the corners get_checkup_questions gave for the assessed role (the target role with the target goal). basic and advanced: the user's rating, an integer from 1 (Not yet) to 4 (Yes, on my own), of the corner's basic and advanced statements. Leave out corners the user didn't answer."
  ),
  goal: checkup.goal.describe(
    'stay: stay strong in the current job. target: move to target_role_code, which the check-up then assesses. explore: see which related roles fit. Default explore.'
  ),
  target_role_code: checkup.target_role_code.describe(
    'With the target goal, the O*NET-SOC code of the role the user wants to move to, from find_role; else null.'
  ),
  scenario: checkup.scenario.describe(
    "The AI pace: slow is Malaysia's current pace (default), fast is if AI uptake speeds up."
  )
}
const snapshot = (what: string, fallback: string) =>
  `${what}: 2026-05 (May 2026, the latest) or 2026-04 (April 2026), ${fallback} by default. It sets the AI-use and job-ad data the verdicts read.`

const registry = {
  find_role: tool('find_role', {
    inputSchema: z
      .object({
        job_title: z.string().trim().min(1).max(100).describe('The job title in English, as the user would say it.'),
        limit: z.number().int().min(1).max(10).default(5).describe('How many roles to return, 5 by default.')
      })
      .strict(),
    outputSchema: z
      .object({
        job_title: z.string(),
        match: z.enum(['exact', 'partial', 'none']), // exact: a known O*NET title or alternate title
        roles: z.array(
          z
            .object({
              onet_code: OnetSocCodeSchema,
              title: z.string(),
              description: z.string().optional(), // left out when the role has no bundle file
              questions_ready: z.boolean() // false: no can-do questions yet, so no check-up
            })
            .strict()
        )
      })
      .strict(),
    async run({ job_title, limit }, { kotak, searchTitles }) {
      const { match, hits } = searchTitles(job_title, limit)
      const roles = await Promise.all(
        hits.map(async ({ onet_code, title }) => {
          const role = await kotak.role(onet_code).catch(() => null)
          return { onet_code, title, description: role?.description, questions_ready: !!role?.questions_ready }
        })
      )
      return { job_title, match, roles }
    }
  }),

  get_checkup_questions: tool('get_checkup_questions', {
    inputSchema: z
      .object({
        role_code: OnetSocCodeSchema.describe('O*NET-SOC code of the role to ask about, from find_role.'),
        snapshot_id: SnapshotIdSchema.default(DEFAULT_SNAPSHOT).describe(
          snapshot('The data snapshot', DEFAULT_SNAPSHOT)
        ),
        scenario: assessment.scenario
      })
      .strict(),
    outputSchema: QuestionsSchema,
    run: ({ role_code, ...options }, { kotak }) => kotak.questions(role_code, options)
  }),

  run_checkup: tool('run_checkup', {
    inputSchema: CheckupParamsSchema.extend({
      ...assessment,
      plan_role_code: checkup.plan_role_code.describe(
        'Build the roadmap for this role instead, one of the ranked roles of an earlier result; null builds it for the assessed role.'
      ),
      snapshot_id: checkup.snapshot_id.describe(snapshot('The data snapshot', DEFAULT_SNAPSHOT)),
      weekly_hours: checkup.weekly_hours.describe(
        'Hours a week the user will spend learning, 4 by default. null takes the AI dividend: the weekly hours AI could save in this job, which every result reports in roadmap.dividend so you can suggest it.'
      ),
      start_date: checkup.start_date
        .optional()
        .describe("The roadmap's first day as YYYY-MM-DD; today in Malaysia if left out.")
    }),
    outputSchema: CheckupReportSchema,
    run: ({ start_date, ...input }, { kotak, today }) => kotak.checkup({ ...input, start_date: start_date ?? today() })
  }),

  what_changed: tool('what_changed', {
    inputSchema: WhatChangedParamsSchema.extend({
      ...assessment,
      before: WhatChangedParamsSchema.shape.before.describe(snapshot('The earlier snapshot', PREVIOUS_SNAPSHOT)),
      after: WhatChangedParamsSchema.shape.after.describe(snapshot('The later snapshot', DEFAULT_SNAPSHOT))
    }),
    outputSchema: WhatChangedReportSchema,
    run: (input, { kotak }) => kotak.whatChanged(input)
  }),

  national_skill_gaps: tool('national_skill_gaps', {
    inputSchema: NationalViewSummaryRequestSchema.extend({
      occupation_group: NationalViewSummaryRequestSchema.shape.occupation_group.describe(
        "An O*NET job family: a role code's first two digits then -0000, e.g. 15-0000 for Computer and Mathematical. Leave out for every family."
      ),
      onet_role_code: NationalViewSummaryRequestSchema.shape.onet_role_code.describe(
        'One role by its O*NET-SOC code, from find_role, e.g. 15-1254.00. Leave out for every role.'
      )
    }),
    outputSchema: z
      .object({
        snapshot_id: SnapshotIdSchema, // the data snapshot the verdicts come from
        database_available: z.boolean(), // false: the database is unset or unreachable, so every row is sample data
        groups: z.array(
          z
            .object({
              onet_role_code: OnetSocCodeSchema,
              title: z.string().nullable(), // null when the role has no bundle file
              occupation_group: z.string(),
              occupation_group_title: z.string(),
              is_sample: z.boolean(), // true: built-in sample rows, never real check-ups
              checkup_count: z.number().int().min(1), // real: a floor in blocks of 10, never exact; sample: its rows
              checkup_count_label: z.string(), // the count as Kotak shows it: 20+, or 12 sample rows
              corners: z.array(
                z
                  .object({
                    corner_id: z.string().nullable(), // null when the averages can't be matched to the role's corners
                    name: z.string().nullable(),
                    verdict: VerdictSchema.nullable(), // in snapshot_id; null for a role without questions
                    average_level: z.number().min(0).max(3) // rounded to one decimal
                  })
                  .strict()
              )
            })
            .strict()
        )
      })
      .strict(),
    async run(filter, { kotak, nationalView }) {
      const { groups, database_available } = await nationalView(filter)
      // Only the roles in the result are read; each is read once per isolate.
      const joined = groups.map(async ({ average_corner_levels, ...group }) => {
        const role = await kotak.role(group.onet_role_code).catch(() => null)
        const verdicts = role?.questions_ready
          ? (await kotak.questions(role.onet_code, { snapshot_id: DEFAULT_SNAPSHOT })).corners
          : []
        // Averages over another corner count come from before the role's corners were regenerated: leave them unnamed.
        const corners = role?.corners.length === average_corner_levels.length ? role.corners : []
        return {
          ...group,
          title: role?.title ?? null,
          checkup_count_label: group.is_sample
            ? `${group.checkup_count} sample rows, not real check-ups`
            : `${group.checkup_count}+`,
          corners: average_corner_levels.map((average_level, i) => {
            const corner = corners[i]
            return {
              corner_id: corner?.corner_id ?? null,
              name: corner?.name ?? null,
              verdict: verdicts.find((v) => v.corner_id === corner?.corner_id)?.verdict ?? null,
              average_level
            }
          })
        }
      })
      return { snapshot_id: DEFAULT_SNAPSHOT, database_available, groups: await Promise.all(joined) }
    }
  }),

  list_sources: tool('list_sources', {
    inputSchema: z.object({}).strict(),
    outputSchema: ManifestSchema,
    run: (_input, { kotak }) => kotak.manifest()
  })
} satisfies Record<ToolName, AnyKotakTool>

/** Any tool of the registry; its input and output types differ per tool. */
export type AnyKotakTool = KotakTool<any, any>

/** Every Kotak tool, in the catalogue's order. */
export const kotakTools: AnyKotakTool[] = Object.values(registry)
