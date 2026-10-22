import { writeFile } from 'node:fs/promises'
import { errors } from 'playwright-core'
import type { Page } from 'playwright-core'

export interface NavigationState {
  url: string
  http_status: number | null
  attempts: number
  retry_errors: string[]
}

export async function navigate(
  page: Page,
  entry: NavigationState,
  maxRetries: number,
  delay: number,
  save: () => Promise<void>
) {
  for (let attempt = 0; ; attempt++) {
    entry.attempts++
    entry.http_status = null
    let response
    let retryError: string | null = null
    try {
      response = await page.goto(entry.url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      entry.http_status = response?.status() ?? null
      if (![500, 502, 503, 504].includes(entry.http_status ?? 0) || attempt >= maxRetries) return response
      retryError = `HTTP ${entry.http_status}`
    } catch (error) {
      const transient =
        error instanceof errors.TimeoutError ||
        /net::ERR_(?:CONNECTION|TIMED_OUT|NETWORK|INTERNET_DISCONNECTED)|ECONNRESET/.test(String(error))
      if (!transient || page.isClosed() || attempt >= maxRetries) throw error
      retryError = error instanceof Error ? error.message : String(error)
    }
    entry.retry_errors.push(retryError!)
    await save()
    console.warn(`Retry ${attempt + 1}/${maxRetries}: ${retryError}`)
    await Bun.sleep(delay * 2 ** attempt)
  }
}

export async function saveEvidence(page: Page, prefix: string): Promise<void> {
  await page
    .content()
    .then((html) => writeFile(`${prefix}.html`, html))
    .catch((error) => console.error(`HTML evidence unavailable: ${String(error)}`))
  await page
    .screenshot({ path: `${prefix}.png`, fullPage: true, timeout: 10_000 })
    .catch((error) => console.error(`Screenshot unavailable: ${String(error)}`))
}
