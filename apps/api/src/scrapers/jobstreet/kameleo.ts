import { ErrorCode, KameleoLocalApiClient, ResponseError } from '@kameleo/local-api-client'
import { chromium } from 'playwright-core'
import type { Page } from 'playwright-core'

// Each run owns its profile; existing user profiles are never stopped or deleted.
export async function withKameleo<T>(
  endpoint: string,
  run: (page: Page, profileId: string) => Promise<T>,
  onProfile?: (profileId: string) => Promise<void>
): Promise<T> {
  const base = new URL(endpoint)
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.pathname !== '/' ||
    base.search ||
    base.hash
  ) {
    throw new Error('KAMELEO_ENDPOINT must be an HTTP(S) origin without credentials, path, query, or fragment')
  }
  const client = new KameleoLocalApiClient({
    basePath: base.origin,
    fetchApi: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(120_000) })
  })
  await client.verifyEngineReady()
  const fingerprints = await client.fingerprint.searchFingerprints('desktop', 'windows', 'chrome')
  if (!fingerprints.length) throw new Error('Kameleo returned no desktop Chrome fingerprints')

  const profile = await client.profile.createProfile({
    fingerprintId: fingerprints[0].id,
    name: `kotak-jobstreet-${Date.now()}`
  })
  const ws = new URL(`/playwright/${profile.id}`, base)
  ws.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:'
  let failed = false
  try {
    await onProfile?.(profile.id)
    // Connecting starts the profile. Use the default context as required by Kameleo.
    const browser = await chromium.connectOverCDP(ws.href, { noDefaults: true, timeout: 90_000 })
    const context = browser.contexts()[0]
    if (!context) throw new Error('Kameleo did not provide a default browser context')
    const page = await context.newPage()
    return await run(page, profile.id)
  } catch (error) {
    failed = true
    throw error
  } finally {
    try {
      try {
        await client.profile.stopProfile(profile.id)
      } catch (error) {
        if (
          !(error instanceof ResponseError) ||
          (error.errorCode !== ErrorCode.ProfileNotRunning && error.errorCode !== ErrorCode.ProfileNeverStarted)
        ) {
          throw error
        }
      }
      await client.profile.deleteProfile(profile.id)
    } catch (error) {
      // Keep the original failure; make unsuccessful cleanup visible in either case.
      if (!failed) throw error
      console.error(`Kameleo cleanup failed for profile ${profile.id}: ${String(error)}`)
    }
  }
}
