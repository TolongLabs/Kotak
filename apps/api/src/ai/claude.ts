import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { BetaRunnableTool } from '@anthropic-ai/sdk/lib/tools/BetaRunnableTool'
import type { BetaMessage, BetaMessageParam } from '@anthropic-ai/sdk/resources/beta'
import type { z } from 'zod'

export const CLAUDE_MODEL = 'claude-haiku-5-5'

// One structured-output call. The request carries no temperature, top_p or top_k (this model rejects non-default values),
// no thinking setting (adaptive thinking is the default) and no forced tool_choice: JSON comes from output_config.format.
export interface StructuredRequest {
  system: string
  user: string
  effort: 'low' | 'medium'
  max_tokens: number
  // Marks the system prompt for prompt caching when it is long and stable.
  cache_system?: boolean
}

export interface StructuredModel {
  generate<T>(request: StructuredRequest, schema: z.ZodType<T>): Promise<T>
}

// A pinned base URL keeps the key from following an ANTHROPIC_BASE_URL set in the host environment.
// One quick retry; after that the routes serve the deterministic fallback instead of waiting.
const createClient = (apiKey: string) =>
  new Anthropic({ apiKey, baseURL: 'https://api.anthropic.com', maxRetries: 1, timeout: 60_000 })

export function createClaudeModel(client: Anthropic): StructuredModel {
  return {
    async generate<T>(request: StructuredRequest, schema: z.ZodType<T>): Promise<T> {
      const message = await client.messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: request.max_tokens,
        system: [
          {
            type: 'text',
            text: request.system,
            ...(request.cache_system ? { cache_control: { type: 'ephemeral' as const } } : {})
          }
        ],
        messages: [{ role: 'user', content: request.user }],
        output_config: { effort: request.effort, format: zodOutputFormat(schema) }
      })
      // A refusal or a max_tokens stop can leave output that does not match the schema.
      if (message.stop_reason !== 'end_turn' || message.parsed_output === null) {
        throw new Error(`Claude stopped with ${message.stop_reason}`)
      }
      return message.parsed_output as T
    }
  }
}

// A tool loop (Kopi's chat, #189): the beta tool runner calls the tools until Claude answers, at low effort. Like the
// structured call, it sends no sampling settings and no thinking setting.
export interface ToolLoopRequest {
  system: string
  messages: BetaMessageParam[]
  tools: BetaRunnableTool[]
  // Per request in the loop.
  max_tokens: number
  // Requests in the loop, tool rounds included.
  max_iterations: number
  /** Asked before each request to Claude, the first included; false ends the loop with no answer. */
  allowRequest: () => Promise<boolean>
}

export interface ToolLoopModel {
  /** Claude's final answer as text, or null when allowRequest refused a request. */
  run(request: ToolLoopRequest): Promise<string | null>
}

export function createClaudeToolLoop(client: Anthropic): ToolLoopModel {
  return {
    async run({ system, allowRequest, ...request }) {
      if (!(await allowRequest())) return null
      const runner = client.beta.messages.toolRunner({
        model: CLAUDE_MODEL,
        system,
        output_config: { effort: 'low' },
        ...request
      })
      // The runner sends the next request after this loop's body, and only after a tool_use stop (Kopi's tools are
      // all client tools) within max_iterations; returning from the body ends the loop before it is sent.
      let message: BetaMessage | undefined
      let requests = 1
      for await (message of runner) {
        if (message.stop_reason !== 'tool_use' || requests >= request.max_iterations) continue
        if (!(await allowRequest())) return null
        requests += 1
      }
      if (!message) throw new Error('Claude sent no message')
      // A refusal, a max_tokens stop or running out of iterations (a tool_use stop) leaves no whole answer.
      const text = message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('\n\n')
      if (message.stop_reason !== 'end_turn' || !text.trim())
        throw new Error(`Claude stopped with ${message.stop_reason}`)
      return text.trim()
    }
  }
}

let current: { apiKey: string; client: Anthropic } | null = null

// One client per isolate for both kinds of call, rebuilt only if the key changes.
function clientFor(apiKey: string): Anthropic {
  if (current?.apiKey !== apiKey) current = { apiKey, client: createClient(apiKey) }
  return current.client
}

export function claudeModelFor(apiKey: string | null): StructuredModel | null {
  return apiKey ? createClaudeModel(clientFor(apiKey)) : null
}

export function claudeToolLoopFor(apiKey: string | null): ToolLoopModel | null {
  return apiKey ? createClaudeToolLoop(clientFor(apiKey)) : null
}

export function describeClaudeError(error: unknown): string {
  if (error instanceof Anthropic.APIConnectionError) return `connection: ${error.message}`
  if (error instanceof Anthropic.APIError) return `${error.status} ${error.type ?? error.name}`
  return error instanceof Error ? error.message : String(error)
}
