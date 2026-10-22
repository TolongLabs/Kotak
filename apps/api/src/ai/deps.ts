import type { z } from 'zod'
import { getConfig } from '../config'
import { claudeCacheKey, createResponseCache, type ResponseCache } from './cache'
import {
  CLAUDE_MODEL,
  claudeModelFor,
  describeClaudeError,
  type StructuredModel,
  type StructuredRequest
} from './claude'
import { readCacheStore, type AiContext } from './env'
import { onetOccupationIndex, type OccupationIndex } from './occupation-index'

export interface AiDeps {
  occupations: OccupationIndex
  // null when no API key is set.
  model(context: AiContext): StructuredModel | null
  cache(context: AiContext): ResponseCache
}

export const defaultAiDeps: AiDeps = {
  occupations: onetOccupationIndex,
  model: (context) => claudeModelFor(getConfig(context, 'ANTHROPIC_API_KEY') ?? null),
  cache: (context) => createResponseCache(readCacheStore(context))
}

// Serves Claude's answer from the cache, or asks Claude and caches the answer. The key is a SHA-256 hash of
// the whole normalised request sent to Claude, so a changed prompt or model never reuses an old answer.
// Returns null when there is no key or the call fails, and the route falls back to its fixed answer.
export async function generateCached<T>(
  deps: AiDeps,
  context: AiContext,
  request: StructuredRequest,
  schema: z.ZodType<T>
): Promise<{ value: T; cached: boolean } | null> {
  const cache = deps.cache(context)
  const key = await claudeCacheKey({ model: CLAUDE_MODEL, ...request })
  const hit = schema.safeParse(await cache.get(key))
  if (hit.success) return { value: hit.data, cached: true }

  const model = deps.model(context)
  if (!model) return null
  try {
    const value = await model.generate(request, schema)
    await cache.set(key, value)
    return { value, cached: false }
  } catch (error) {
    console.warn('[ai] Claude request failed:', describeClaudeError(error))
    return null
  }
}
