import type { Context } from 'hono'
import type { KeyValueStore } from './cache'

// AI_CACHE is the KV binding in wrangler.jsonc on Workers; on Bun, bun.ts passes a disk store with the same shape.
// CLAUDE_LIMITER is the rate limiting binding in wrangler.jsonc; elsewhere ./rate-limit.ts keeps the count in memory.
// ANTHROPIC_API_KEY is read through getConfig (../config).
export type AiBindings = {
  AI_CACHE?: KeyValueStore
  CLAUDE_LIMITER?: RateLimiter
}

// The part of the Workers rate limiting binding the AI routes use.
export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

export type AiContext = Context<{ Bindings: AiBindings }>

export function readCacheStore(context: AiContext): KeyValueStore | undefined {
  return context.env?.AI_CACHE
}

export function readRateLimiter(context: AiContext): RateLimiter | undefined {
  return context.env?.CLAUDE_LIMITER
}
