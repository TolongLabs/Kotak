import {
  assessedRoleCode,
  createBundle,
  DEFAULT_SNAPSHOT,
  fetchSource,
  loadCheckupBundle,
  suggestRoles,
  type CheckupBundleInput,
  type SuggestedRole
} from '@kotak/sdk'
import type { GuestSession, Profile } from '@kotak/shared'
import { useEffect, useMemo, useState } from 'react'
import { contentFor, overlayCheckupBundle, overlayRoleBundle, overlaySdgReasons } from '../i18n/content/overlay'
import { useLocale } from '../i18n/locale'

// The static client bundle (#88), read through @kotak/sdk from the page's origin: each file fetched once and checked
// with its Zod schema (TRD.md "Client runtime"). The React hooks stay here.

export { BundleFileError, type CheckupBundle, type RoleBundle } from '@kotak/sdk'

const bundle = createBundle(fetchSource({ baseUrl: window.location.origin, fetch }))

export const loadManifest = () => bundle.manifest()
export const loadRoleIndex = () => bundle.roleIndex()
export const loadRole = (onetCode: string) => bundle.role(onetCode)
export const loadRoleBundle = (onetCode: string, extra?: string[]) => bundle.roleBundle(onetCode, extra)
export const loadPathways = () => bundle.pathways()
export const loadSdgReasons = () => bundle.sdgReasons()
export const loadSpaceFile = () => bundle.space()

/** The session's check-up inputs as a key: the same key loads the same roles. */
export function checkupBundleKey(session: GuestSession): string | null {
  if (!assessedRoleCode(session)) return null
  const input: CheckupBundleInput = {
    role_code: session.role_code,
    goal: (session.goal ?? 'explore') as CheckupBundleInput['goal'],
    target_role_code: session.target_role_code,
    profile: session.profile
  }
  return JSON.stringify(input)
}
/** The assessed role, its related roles and the wider pool's roles (#284), for a key from checkupBundleKey. */
export const loadCheckupBundleFor = (key: string) => loadCheckupBundle(bundle, JSON.parse(key) as CheckupBundleInput)

/** Roles to suggest before any question (#284), as the suggest_roles tool gives them, for a key from suggestionsKey. */
export const loadSuggestionsFor = (key: string): Promise<SuggestedRole[]> => {
  const { profile, current_role_code } = JSON.parse(key) as { profile: Profile; current_role_code: string | null }
  return suggestRoles(bundle, { profile, current_role_code, snapshot_id: DEFAULT_SNAPSHOT, limit: 6 })
}

export type Loaded<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry: () => void }
  | { status: 'ready'; data: T }

// `load` must be a stable, module-level function.
function useLoaded<T>(key: string | null, load: (key: string) => Promise<T>): Loaded<T> {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<{ key: string; attempt: number; result: Loaded<T> } | null>(null)

  useEffect(() => {
    if (key === null) return
    let current = true
    const settle = (result: Loaded<T>) => {
      if (current) setSettled({ key, attempt, result })
    }
    load(key).then(
      (data) => settle({ status: 'ready', data }),
      (error: Error) => settle({ status: 'error', error, retry: () => setAttempt((n) => n + 1) })
    )
    return () => {
      current = false
    }
  }, [key, attempt, load])

  if (key === null) return { status: 'idle' }
  return settled?.key === key && settled.attempt === attempt ? settled.result : { status: 'loading' }
}

export const useManifest = () => useLoaded('manifest', loadManifest)
export const useRoleIndex = () => useLoaded('roles', loadRoleIndex)
export const useRoleBundle = (onetCode: string | null) => {
  const loaded = useLoaded(onetCode, loadRoleBundle)
  const locale = useLocale()
  // In English the loaded bundle passes through untouched (same identity); otherwise its roles are overlaid.
  return useMemo(() => {
    const overlay = contentFor(locale)
    return loaded.status === 'ready' && overlay ? { ...loaded, data: overlayRoleBundle(loaded.data, overlay) } : loaded
  }, [loaded, locale])
}
export const usePathways = () => useLoaded('pathways', loadPathways)
export const useSdgReasons = () => {
  const loaded = useLoaded('sdg-reasons', loadSdgReasons)
  const locale = useLocale()
  return useMemo(() => {
    const overlay = contentFor(locale)
    return loaded.status === 'ready' && overlay ? { ...loaded, data: overlaySdgReasons(loaded.data, overlay) } : loaded
  }, [loaded, locale])
}
/** The 3D space's file; nothing is fetched until `enabled`, so a session with no check-up skips its 4 MB. */
export const useSpaceFile = (enabled: boolean) => useLoaded(enabled ? 'space' : null, loadSpaceFile)
export const useSuggestions = (profile: Profile | null, currentCode: string | null) =>
  useLoaded(profile ? JSON.stringify({ profile, current_role_code: currentCode }) : null, loadSuggestionsFor)
/** The check-up's roles for the session: the assessed role first, then the roles it is ranked against. null loads none. */
export const useCheckupBundle = (session: GuestSession | null) => {
  const loaded = useLoaded(session && checkupBundleKey(session), loadCheckupBundleFor)
  const locale = useLocale()
  return useMemo(() => {
    const overlay = contentFor(locale)
    return loaded.status === 'ready' && overlay
      ? { ...loaded, data: overlayCheckupBundle(loaded.data, overlay) }
      : loaded
  }, [loaded, locale])
}
