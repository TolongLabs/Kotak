import type { Page } from 'playwright-core'
import { createProfile, deleteProfile, readProfile, startProfile } from './profiles'

export interface SessionOptions {
  // Reuse a saved profile; omitted, a fresh profile is created for this run and deleted afterwards.
  profileId?: string
  root?: string
  headless?: boolean
}

// Same shape as the scraper's withKameleo(): run on one page, then always close the browser.
export async function withProfile<T>(
  options: SessionOptions,
  run: (page: Page, profileId: string) => Promise<T>,
  onProfile?: (profileId: string) => Promise<void>
): Promise<T> {
  const profile = options.profileId
    ? await readProfile(options.profileId, options.root)
    : await createProfile({ name: `kotak-run-${Date.now()}`, root: options.root })
  let failed = false
  try {
    await onProfile?.(profile.id)
    const context = await startProfile(profile, options)
    try {
      const page = context.pages()[0] ?? (await context.newPage())
      return await run(page, profile.id)
    } finally {
      await context.close()
    }
  } catch (error) {
    failed = true
    throw error
  } finally {
    if (!options.profileId) {
      try {
        await deleteProfile(profile.id, options.root)
      } catch (error) {
        // Keep the original failure; make unsuccessful cleanup visible in either case.
        if (!failed) throw error
        console.error(`Profile cleanup failed for ${profile.id}: ${String(error)}`)
      }
    }
  }
}
