import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { z } from 'zod'

export const CLAUDE_MODEL = 'claude-opus-5-5'

// One structured-output call. The request carries no temperature, top_p or top_k (this model rejects them),
// no thinking setting (adaptive thinking is always on) and no forced tool_choice: JSON comes from output_config.format.
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

export function createClaudeModel(apiKey: string): StructuredModel {
  // A pinned base URL keeps the key from following an ANTHROPIC_BASE_URL set in the host environment.
  // One quick retry; after that the routes serve the deterministic fallback instead of waiting.
  const client = new Anthropic({ apiKey, baseURL: 'https://api.anthropic.com', maxRetries: 1, timeout: 60_000 })

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

let current: { apiKey: string; model: StructuredModel } | null = null

// One client per isolate, rebuilt only if the key changes.
export function claudeModelFor(apiKey: string | null): StructuredModel | null {
  if (!apiKey) return null
  if (current?.apiKey !== apiKey) current = { apiKey, model: createClaudeModel(apiKey) }
  return current.model
}

export function describeClaudeError(error: unknown): string {
  if (error instanceof Anthropic.APIConnectionError) return `connection: ${error.message}`
  if (error instanceof Anthropic.APIError) return `${error.status} ${error.type ?? error.name}`
  return error instanceof Error ? error.message : String(error)
}
