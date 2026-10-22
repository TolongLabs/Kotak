import { cacheGet, cachePut, sha256Hex } from '../cache'

// The subset of the Workers KV API the response cache needs. bun.ts passes a disk store with the same shape.
export interface KeyValueStore {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

export interface ResponseCache {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// Claude answers go through the shared byte cache (memory, then the Workers Cache API) and, behind it, a
// persistent store: Workers KV, or files on Bun. The Cache API alone does not fit here: it is local to one data
// centre and does nothing on workers.dev, so a pre-warmed answer would not reach every visitor.
// A store failure never fails the request.
export function createResponseCache(store?: KeyValueStore): ResponseCache {
  return {
    async get(key) {
      let bytes = await cacheGet(key)
      if (!bytes && store) {
        const text = await store.get(key).catch((error: unknown) => {
          console.warn('[ai] cache read failed:', error)
          return null
        })
        if (text !== null) {
          bytes = encoder.encode(text)
          await cachePut(key, bytes)
        }
      }
      if (!bytes) return undefined
      try {
        return JSON.parse(decoder.decode(bytes)) as unknown
      } catch {
        return undefined
      }
    },
    async set(key, value) {
      const text = JSON.stringify(value)
      await cachePut(key, encoder.encode(text))
      await store?.put(key, text).catch((error: unknown) => console.warn('[ai] cache write failed:', error))
    }
  }
}

// JSON with object keys sorted, so equal payloads always hash to the same key.
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export async function claudeCacheKey(payload: unknown): Promise<string> {
  return `claude:${await sha256Hex(canonicalJson(payload))}`
}
