import type { BetaRunnableTool } from '@anthropic-ai/sdk/lib/tools/BetaRunnableTool'
import type { BetaTool } from '@anthropic-ai/sdk/resources/beta'
import type { CheckupParamsSchema } from '@kotak/sdk'
import { z } from 'zod'
import type { ToolName } from './catalog'
import { kotakTools, malaysiaToday, type ToolDeps } from './tools'

// The registry as tools for the Anthropic tool runner (#184 "Adapters"), for Kopi's chat. The tools that take answers
// are bound to the user's own check-up, so the model never retypes it: their input schema drops the user's own
// fields, and the what-if fields default to the user's values. The model's input is merged with the user's fields and
// parsed with the registry's full schema before the tool runs.

/** The user's check-up as run_checkup takes it, without the scenario, which the session doesn't keep. */
export type BoundCheckup = Omit<z.output<typeof CheckupParamsSchema>, 'scenario'>

/** Only the user's check-up sets these. */
const OWN_FIELDS = ['role_code', 'answers', 'goal', 'target_role_code', 'start_date', 'profile'] as const
/** The model may change these for a what-if; left out, they keep the user's value. */
const WHAT_IF_FIELDS = ['plan_role_code', 'snapshot_id', 'weekly_hours'] as const

export interface KotakToolCall {
  name: ToolName
  title: string
  /** What the model sent, without the user's own fields. */
  input: unknown
  output: unknown
}

export function createKotakClaudeTools(
  deps: Omit<ToolDeps, 'today'>,
  { checkup, onCall }: { checkup: BoundCheckup | null; onCall?: (call: KotakToolCall) => void }
): BetaRunnableTool[] {
  const toolDeps: ToolDeps = { ...deps, today: malaysiaToday }

  return kotakTools.flatMap((tool) => {
    const shape = tool.inputSchema.shape
    const bound = 'answers' in shape
    // With no check-up, the tools that need answers are left out, so the model can't make answers up.
    if (bound && !checkup) return []
    const own = bound ? OWN_FIELDS.filter((field) => field in shape) : []
    const whatIf = bound ? WHAT_IF_FIELDS.filter((field) => field in shape) : []
    const ownValues = Object.fromEntries(own.map((field) => [field, checkup![field]]))
    // suggest_roles takes no answers, but with a check-up it starts from the user's own profile and job, so Kopi
    // suggests what the app would; the model may still change them to explore.
    const profileDefaults =
      !bound && checkup && 'profile' in shape
        ? {
            profile: shape.profile.default(checkup.profile),
            ...('current_role_code' in shape
              ? { current_role_code: shape.current_role_code.default(checkup.role_code) }
              : {})
          }
        : {}
    const modelSchema = tool.inputSchema.omit(Object.fromEntries(own.map((field) => [field, true]))).extend({
      ...Object.fromEntries(whatIf.map((field) => [field, shape[field].default(checkup![field])])),
      ...profileDefaults
    })

    const runnable: BetaRunnableTool = {
      type: 'custom',
      name: tool.name,
      description: tool.description,
      // Zod's input view, as the MCP server shows it: a field with a default is optional. betaZodTool shows the
      // output view, which would make the model fill in every default.
      input_schema: z.toJSONSchema(modelSchema, { io: 'input' }) as BetaTool.InputSchema,
      parse: (input) => tool.inputSchema.parse({ ...modelSchema.parse(input), ...ownValues }),
      async run(input, context) {
        const output = await tool.run(input, toolDeps)
        onCall?.({ name: tool.name, title: tool.title, input: context?.toolUse.input, output })
        return JSON.stringify(output)
      }
    }
    return [runnable]
  })
}
