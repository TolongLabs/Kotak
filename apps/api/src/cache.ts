// A small byte cache for API responses, keyed by any string (callers prefix their keys, such as `tts:`).
// Memory comes first: per process on Bun, per isolate on Workers. Behind it sits the Workers Cache API
// where the runtime has one. Workers has no persistent disk, the Cache API is local to each data center
// and only works on custom domains, so every caller must treat a miss as normal.

// Claude JSON and TTS MP3s share this budget, well inside a Worker isolate's 128 MB.
const MEMORY_BUDGET_BYTES = 32 * 1024 * 1024
const TTL_SECONDS = 30 * 24 * 60 * 60
// The Cache API keys entries by GET request URL. Nothing is ever fetched from this origin.
const CACHE_ORIGIN = 'https://cache.kotak.invalid/'

type Bytes = Uint8Array<ArrayBuffer>

// Map order is recency order: the first entry is the least recently used.
const memory = new Map<string, Bytes>()
let memoryBytes = 0

const workersCache = () => (globalThis.caches as (CacheStorage & { default?: Cache }) | undefined)?.default

const forget = (key: string) => {
  const value = memory.get(key)
  if (!value) return
  memory.delete(key)
  memoryBytes -= value.byteLength
}

const remember = (key: string, value: Bytes) => {
  forget(key)
  if (value.byteLength > MEMORY_BUDGET_BYTES) return
  memory.set(key, value)
  memoryBytes += value.byteLength
  for (const [oldestKey] of memory) {
    if (memoryBytes <= MEMORY_BUDGET_BYTES) break
    forget(oldestKey)
  }
}

export const sha256Hex = async (input: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const cacheGet = async (key: string): Promise<Bytes | undefined> => {
  const hit = memory.get(key)
  if (hit) {
    remember(key, hit)
    return hit
  }
  const response = await workersCache()
    ?.match(CACHE_ORIGIN + encodeURIComponent(key))
    .catch(() => undefined)
  if (!response) return undefined
  const value = new Uint8Array(await response.arrayBuffer())
  remember(key, value)
  return value
}

export const cachePut = async (key: string, value: Bytes) => {
  remember(key, value)
  const response = new Response(value, { headers: { 'cache-control': `max-age=${TTL_SECONDS}` } })
  await workersCache()
    ?.put(CACHE_ORIGIN + encodeURIComponent(key), response)
    .catch(() => undefined)
}
