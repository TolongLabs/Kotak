import type { RateLimiter } from './env'

// Uncached Claude calls per route in each 60-second window (#155). wrangler.jsonc gives the Workers binding the
// same limit; Cloudflare counts it per location and approximately, so it is a guard on spend, not a quota.
export const CLAUDE_CALLS_PER_MINUTE = 30
const WINDOW_MS = 60_000

// The same fixed window in memory, for Bun (Replit) and wherever the binding is missing. It counts per process.
export function createMemoryRateLimiter(limit = CLAUDE_CALLS_PER_MINUTE): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>()
  return {
    async limit({ key }) {
      const now = Date.now()
      const window = windows.get(key)
      if (!window || now - window.start >= WINDOW_MS) {
        windows.set(key, { start: now, count: 1 })
        return { success: true }
      }
      window.count += 1
      return { success: window.count <= limit }
    }
  }
}
