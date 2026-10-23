import type { z } from 'zod'
import { getConfig } from '../config'
import { claudeCacheKey, createResponseCache, type ResponseCache } from './cache'
import {
  CLAUDE_MODEL,
  claudeModelFor,
  claudeToolLoopFor,
  describeClaudeError,
  type StructuredModel,
  type StructuredRequest,
  type ToolLoopModel
} from './claude'
import { readCacheStore, readRateLimiter, type AiContext, type RateLimiter } from './env'
import { onetOccupationIndex, type OccupationIndex } from './occupation-index'
import { createMemoryRateLimiter } from './rate-limit'

export interface AiDeps {
  occupations: OccupationIndex
  // null when no API key is set.
  model(context: AiContext): StructuredModel | null
  // Kopi's chat; null when no API key is set.
  agent(context: AiContext): ToolLoopModel | null
  cache(context: AiContext): ResponseCache
  limiter(context: AiContext): RateLimiter
}

const memoryLimiter = createMemoryRateLimiter()

export const defaultAiDeps: AiDeps = {
  occupations: onetOccupationIndex,
  model: (context) => claudeModelFor(getConfig(context, 'ANTHROPIC_API_KEY') ?? null),
  agent: (context) => claudeToolLoopFor(getConfig(context, 'ANTHROPIC_API_KEY') ?? null),
  cache: (context) => createResponseCache(readCacheStore(context)),
  limiter: (context) => readRateLimiter(context) ?? memoryLimiter
}

// Counts one uncached Claude call against the route's rate limit (#155); false when the route is over it. The key is
// the request's path, as Cloudflare's docs advise over IP addresses, unless the route passes its own: a route whose
// path holds an ID, such as sorting a batch, passes a fixed key so every path shares one limit (#266). A limiter
// failure counts as over the limit, so the route falls back instead of failing.
export async function withinRateLimit(deps: AiDeps, context: AiContext, key = context.req.path): Promise<boolean> {
  const { success } = await deps
    .limiter(context)
    .limit({ key })
    .catch(() => ({ success: false }))
  if (!success) console.warn(`[ai] Rate limited: ${key}`)
  return success
}

// Serves Claude's answer from the cache, or asks Claude and caches the answer. The key is a SHA-256 hash of
// the whole normalised request sent to Claude, so a changed prompt or model never reuses an old answer.
// Returns null when there is no key, the route is over its rate limit or the call fails, and the route falls
// back to its fixed answer. Cached answers never count toward the limit.
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
  if (!model || !(await withinRateLimit(deps, context))) return null
  try {
    const value = await model.generate(request, schema)
    await cache.set(key, value)
    return { value, cached: false }
  } catch (error) {
    console.warn('[ai] Claude request failed:', describeClaudeError(error))
    return null
  }
}
