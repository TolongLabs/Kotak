import { expect, test } from 'bun:test'
import { CLASSIFY_RATE_LIMIT_KEY } from '../routes/jobstreet-admin'
import { withinRateLimit, type AiDeps } from './deps'
import type { AiContext } from './env'
import { createMemoryRateLimiter } from './rate-limit'

const contextFor = (path: string) => ({ req: { path } }) as unknown as AiContext

test('sorting several batches shares one rate limit, and other routes keep their own (#266)', async () => {
  const limiter = createMemoryRateLimiter(2)
  const deps = { limiter: () => limiter } as unknown as AiDeps
  const sortBatch = (runId: string) =>
    withinRateLimit(deps, contextFor(`/api/admin/scraper/runs/${runId}/classify`), CLASSIFY_RATE_LIMIT_KEY)

  expect(await sortBatch('batch-a')).toBe(true)
  expect(await sortBatch('batch-a')).toBe(true)
  // A second batch has another path, but the same allowance, which is used up.
  expect(await sortBatch('batch-b')).toBe(false)
  // A route without its own key is still limited by its path.
  expect(await withinRateLimit(deps, contextFor('/api/roles/match'))).toBe(true)
  expect(await withinRateLimit(deps, contextFor('/api/roles/match'))).toBe(true)
  expect(await withinRateLimit(deps, contextFor('/api/roles/match'))).toBe(false)
  expect(await withinRateLimit(deps, contextFor('/api/explanations'))).toBe(true)
})
