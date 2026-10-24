import { afterAll, beforeAll, expect, spyOn, test } from 'bun:test'
import { EventEmitter } from 'node:events'
import type { Page } from '@kotak/browser'
import { navigate, type NavigationState } from './browser'
import { isBrowserCrash } from './relaunch'

// A page held on a Cloudflare challenge, as navigate() sees it, which the test then crashes, kills or closes.
function challengedPage() {
  const events = new EventEmitter()
  const browser = { connected: true, isConnected: () => browser.connected }
  let closed = false
  const response = {
    status: () => 403,
    headerValue: async (name: string) =>
      name === 'cf-mitigated' ? 'challenge' : name === 'cf-ray' ? 'fixture-ray' : null,
    request: () => ({ isNavigationRequest: () => true }),
    frame: () => null
  }
  const page = {
    on: (name: string, listener: () => void) => events.on(name, listener),
    off: (name: string, listener: () => void) => events.off(name, listener),
    isClosed: () => closed,
    context: () => ({ browser: () => browser }),
    mainFrame: () => null,
    goto: async () => response,
    bringToFront: async () => {}
  }
  return {
    page: page as unknown as Page,
    // The renderer died: Playwright's page 'crash' event; the page stays open.
    crash: () => events.emit('crash'),
    // The browser process died: the page closes and the browser disconnects at once.
    kill: () => {
      closed = true
      browser.connected = false
      events.emit('close')
    },
    // The window was closed by hand: the page closes first, the browser shuts down about 70 ms later.
    closeWindow: () => {
      closed = true
      events.emit('close')
      setTimeout(() => (browser.connected = false), 70)
    }
  }
}

async function waitThrough(disrupt: (fake: ReturnType<typeof challengedPage>) => void) {
  const fake = challengedPage()
  const entry: NavigationState = {
    url: 'https://my.jobstreet.com/fixture-jobs',
    http_status: null,
    attempts: 0,
    retry_errors: []
  }
  const started = performance.now()
  setTimeout(() => disrupt(fake), 300)
  let error: unknown = null
  try {
    await navigate(fake.page, entry, 0, 2000, async () => {}, { timeoutMs: 10_000 })
  } catch (caught) {
    error = caught
  }
  return { error, entry, seconds: (performance.now() - started) / 1000 }
}

let quiet: Array<{ mockRestore: () => void }> = []
beforeAll(() => {
  quiet = (['info', 'warn'] as const).map((level) => spyOn(console, level).mockImplementation(() => {}))
})
afterAll(() => quiet.forEach((spy) => spy.mockRestore()))

test('a renderer crash during a verification wait ends the wait as a crash the relaunch loop recognises', async () => {
  const { error, entry, seconds } = await waitThrough((fake) => fake.crash())
  expect(String(error)).toContain('Page crashed while waiting for verification')
  expect(isBrowserCrash(error)).toBe(true)
  expect(entry.verification?.status).toBe('interrupted')
  expect(seconds).toBeLessThan(2)
})

test('a browser killed during a verification wait ends the wait as a crash the relaunch loop recognises', async () => {
  const { error, entry, seconds } = await waitThrough((fake) => fake.kill())
  expect(String(error)).toContain('Browser disconnected while waiting for verification')
  expect(isBrowserCrash(error)).toBe(true)
  expect(entry.verification?.status).toBe('interrupted')
  expect(seconds).toBeLessThan(2)
})

test('a window closed by hand during a verification wait still ends the run', async () => {
  const { error, entry } = await waitThrough((fake) => fake.closeWindow())
  expect(String(error)).toContain('Browser page closed while waiting for verification')
  expect(isBrowserCrash(error)).toBe(false)
  expect(entry.verification?.status).toBe('interrupted')
})
