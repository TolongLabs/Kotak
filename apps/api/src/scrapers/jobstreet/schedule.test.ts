import { expect, test } from 'bun:test'
import { QUEUE_DAILY_REFRESH, queueDailyRefresh } from './schedule'

test('the nightly refresh queues every search title in one query, whatever their number (#283)', async () => {
  const calls: Array<{ text: string; params: unknown[] | undefined }> = []
  const sql = {
    query: async (text: string, params?: unknown[]) => {
      calls.push({ text, params })
      return [{ titles: 60, queued: 58 }]
    }
  } as unknown as Parameters<typeof queueDailyRefresh>[0]
  expect(await queueDailyRefresh(sql, '2026-10-25')).toEqual({ titles: 60, queued: 58 })
  expect(calls).toEqual([{ text: QUEUE_DAILY_REFRESH, params: ['2026-10-25'] }])
})
