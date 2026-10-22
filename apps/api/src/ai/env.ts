import type { Context } from 'hono'
import type { KeyValueStore } from './cache'

// AI_CACHE is the KV binding in wrangler.jsonc on Workers; on Bun, bun.ts passes a disk store with the same shape.
// ANTHROPIC_API_KEY is read through getConfig (../config).
export type AiBindings = {
  AI_CACHE?: KeyValueStore
}

export type AiContext = Context<{ Bindings: AiBindings }>

export function readCacheStore(context: AiContext): KeyValueStore | undefined {
  return context.env?.AI_CACHE
}
