import { writeFile } from 'node:fs/promises'
import { errors } from 'playwright-core'
import type { Page, Response } from 'playwright-core'

interface VerificationState {
  status: 'waiting' | 'cleared' | 'denied' | 'timed_out' | 'interrupted'
  started_at: string
  finished_at: string | null
  timeout_ms: number
  initial_http_status: number | null
  final_http_status: number | null
  ray_id: string | null
}

export interface NavigationState {
  url: string
  http_status: number | null
  attempts: number
  retry_errors: string[]
  verification?: VerificationState
}

export class VerificationTimeoutError extends Error {}

export function verificationTimeout(value = 120_000): number {
  if (!Number.isInteger(value) || value < 0 || value > 600_000)
    throw new Error('--verification-timeout-ms must be an integer from 0 to 600000')
  return value
}

async function isVerification(page: Page, response: Response | null): Promise<boolean> {
  if ((await response?.headerValue('cf-mitigated')) === 'challenge') return true
  return page.evaluate(() => {
    const title = document.title.trim()
    return (
      /^(?:just a moment\.*|security verification|verify you are human|robot check)$/i.test(title) ||
      (!!document.querySelector('script[src*="/cdn-cgi/challenge-platform/"]') &&
        /verification|verify|checking/i.test(document.body?.innerText ?? ''))
    )
  })
}

async function waitForVerification(
  page: Page,
  latestResponse: () => Response | null,
  entry: NavigationState,
  save: () => Promise<void>,
  options: { timeoutMs: number; evidencePrefix?: string }
) {
  const initial = latestResponse()
  // Authentication failures and rate limits remain terminal, even if branded as verification.
  if ([401, 429].includes(initial?.status() ?? 0) || !(await isVerification(page, initial))) return
  const started = Date.now()
  const deadline = started + options.timeoutMs
  const state: VerificationState = {
    status: 'waiting',
    started_at: new Date(started).toISOString(),
    finished_at: null,
    timeout_ms: options.timeoutMs,
    initial_http_status: initial?.status() ?? null,
    final_http_status: null,
    ray_id: (await initial?.headerValue('cf-ray')) ?? null
  }
  entry.verification = state
  try {
    await save()
    console.warn(
      `Verification required at ${entry.url}. Waiting up to ${options.timeoutMs / 1000}s. If a checkbox appears, complete it in this run's Kameleo browser window; profile ID is in run.json.`
    )
    await page.bringToFront().catch(() => {})
    if (options.evidencePrefix) await saveEvidence(page, options.evidencePrefix)
    let nextNotice = started + 15_000
    while (Date.now() < deadline) {
      if (page.isClosed()) throw new Error('Kameleo page closed while waiting for verification')
      const response = latestResponse()
      // Clearance must lead to a new top-level document response. Removing a banner alone is insufficient.
      if (response && response !== initial) {
        try {
          if (!(await isVerification(page, response))) {
            state.status = [401, 403, 429].includes(response.status()) ? 'denied' : 'cleared'
            state.finished_at = new Date().toISOString()
            state.final_http_status = response.status()
            await save()
            console.info(`Verification ${state.status}; continuing response handling for ${entry.url}`)
            return
          }
        } catch (error) {
          if (!/Execution context was destroyed|Cannot find context/.test(String(error))) throw error
        }
      }
      if (Date.now() >= nextNotice) {
        console.info(`Still waiting for verification at ${entry.url}; complete any checkbox in the Kameleo window.`)
        nextNotice = Date.now() + 15_000
      }
      await Bun.sleep(Math.min(250, Math.max(0, deadline - Date.now())))
    }
    state.status = 'timed_out'
    state.finished_at = new Date().toISOString()
    state.final_http_status = latestResponse()?.status() ?? null
    await save()
    throw new VerificationTimeoutError(
      'Verification did not clear before the wait ended; partial results are preserved'
    )
  } finally {
    if (state.status === 'waiting') {
      state.status = 'interrupted'
      state.finished_at = new Date().toISOString()
      state.final_http_status = latestResponse()?.status() ?? null
      await save()
    }
  }
}

export async function navigate(
  page: Page,
  entry: NavigationState,
  maxRetries: number,
  delay: number,
  save: () => Promise<void>,
  verification: { timeoutMs: number; evidencePrefix?: string } = { timeoutMs: 120_000 }
) {
  for (let attempt = 0; ; attempt++) {
    entry.attempts++
    entry.http_status = null
    let response: Response | null = null
    const observeResponse = (next: Response) => {
      if (next.request().isNavigationRequest() && next.frame() === page.mainFrame()) {
        if (next.status() >= 300 && next.status() < 400) return
        response = next
        entry.http_status = next.status()
      }
    }
    let retryError: string | null = null
    page.on('response', observeResponse)
    try {
      const initial = await page.goto(entry.url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      response ??= initial
      entry.http_status = response?.status() ?? null
      await waitForVerification(page, () => response, entry, save, verification)
      if (![500, 502, 503, 504].includes(entry.http_status ?? 0) || attempt >= maxRetries) return response
      retryError = `HTTP ${entry.http_status}`
    } catch (error) {
      const transient =
        error instanceof errors.TimeoutError ||
        /net::ERR_(?:CONNECTION|TIMED_OUT|NETWORK|INTERNET_DISCONNECTED)|ECONNRESET/.test(String(error))
      if (!transient || page.isClosed() || entry.verification?.status === 'interrupted' || attempt >= maxRetries)
        throw error
      retryError = error instanceof Error ? error.message : String(error)
    } finally {
      page.off('response', observeResponse)
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
