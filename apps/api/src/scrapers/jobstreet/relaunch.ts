import { createProfile, deleteProfile, type Page } from '@kotak/browser'
import type { BrowserProfileOptions, withBrowserProfile } from './browser-profile'

// Relaunches per run after a browser crash (#264). Small and fixed, so a page that crashes the browser every time
// ends the run instead of looping.
export const MAX_BROWSER_RELAUNCHES = 3

// Opens the browser profile, runs one session in it and closes it: withBrowserProfile, or a fake in tests.
export type OpenBrowser = typeof withBrowserProfile

// Playwright's errors for a page whose renderer crashed ("Target crashed", "Page crashed") and for a page, context or
// browser that closed or disconnected under the scraper. The docs say a crashed page's error message contains "crash":
// https://playwright.dev/docs/api/class-page#page-event-crash
export function isBrowserCrash(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /\b(?:Target|Page) crashed\b|Target page, context or browser has been closed|\bBrowser (?:has been )?(?:closed|disconnected)\b/i.test(
    message
  )
}

// Runs the session in a browser and, when the browser crashes, closes it, calls onCrash, opens the profile again and
// runs the session again, at most MAX_BROWSER_RELAUNCHES times. The session resumes from progress it keeps outside
// itself. Any other error, and a crash after the last relaunch, ends the run.
export async function withRelaunches<T>(
  open: OpenBrowser,
  options: BrowserProfileOptions,
  session: (page: Page) => Promise<T>,
  hooks: {
    onProfile?: (profileId: string) => Promise<void>
    onCrash: (error: unknown, relaunch: number) => Promise<void>
  }
): Promise<T> {
  // Without a saved profile, the run creates one temporary profile and every launch reopens it, so a relaunched
  // browser keeps the run's fingerprint and cookies. It is deleted when the run ends.
  const temporary = options.profileId ? null : (await createProfile({ name: `kotak-run-${Date.now()}` })).id
  const profile = temporary ? { ...options, profileId: temporary } : options
  let failed = false
  try {
    for (let relaunches = 0; ; relaunches++) {
      try {
        return await open(profile, session, hooks.onProfile)
      } catch (error) {
        if (!isBrowserCrash(error)) throw error
        if (relaunches >= MAX_BROWSER_RELAUNCHES)
          throw new Error(
            `The browser crashed again after ${MAX_BROWSER_RELAUNCHES} relaunches, so the run stopped: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error }
          )
        await hooks.onCrash(error, relaunches + 1)
      }
    }
  } catch (error) {
    failed = true
    throw error
  } finally {
    if (temporary) {
      try {
        await deleteProfile(temporary)
      } catch (error) {
        // As withProfile does: keep the run's own failure, and fail an otherwise successful run.
        if (!failed) throw error
        console.error(`Profile cleanup failed for ${temporary}: ${String(error)}`)
      }
    }
  }
}
