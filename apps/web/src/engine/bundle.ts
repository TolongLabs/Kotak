import {
  assessedRoleCode,
  createBundle,
  DEFAULT_SNAPSHOT,
  fetchSource,
  loadCheckupBundle,
  suggestRoles,
  type CheckupBundleInput,
  type RoleBundle,
  type SuggestedRole
} from '@kotak/sdk'
import { BUNDLE_PATHS, type GuestSession, type Profile } from '@kotak/shared'
import { useEffect, useMemo, useState } from 'react'
import {
  isRoleTranslated,
  overlayCheckupBundle,
  overlayRoleBundle,
  overlaySdgReasons,
  type LocaleIndex,
  type Overlays,
  type RoleOverlay
} from '../i18n/content/overlay'
import { useLocale, type Locale } from '../i18n/locale'

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

// The translated content (#449): a language's index once, and a job's file only when that job is on screen. Each is
// read once and kept; a failed read is tried again next time. Nothing is read in English.
const localeFiles = new Map<string, Promise<unknown>>()
function readLocaleFile<T>(path: string): Promise<T> {
  let request = localeFiles.get(path) as Promise<T> | undefined
  if (!request) {
    request = fetch(new URL(path, window.location.origin)).then((response) => {
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
      return response.json() as Promise<T>
    })
    localeFiles.set(path, request)
    request.catch(() => localeFiles.delete(path))
  }
  return request
}
const loadLocaleIndex = (locale: Locale) => readLocaleFile<LocaleIndex>(BUNDLE_PATHS.i18nIndex(locale))

let warnedOverlay = false
/** The overlays for a key from overlaysKey; null when they fail, so the page shows English rather than an error. */
async function loadOverlaysFor(key: string): Promise<Overlays | null> {
  const [locale, ...codes] = key.split('|') as [Locale, ...string[]]
  try {
    const index = await loadLocaleIndex(locale)
    const filed = new Set(index.roles)
    const wanted = [...new Set(codes)].filter((code) => filed.has(code))
    const files = await Promise.all(
      wanted.map((code) => readLocaleFile<RoleOverlay>(BUNDLE_PATHS.i18nRole(locale, code)))
    )
    return { index, roles: new Map(wanted.map((code, i) => [code, files[i]!])) }
  } catch (error) {
    if (!warnedOverlay) console.warn('Translated content did not load; showing English.', error)
    warnedOverlay = true
    return null
  }
}

/** The overlays for these jobs in the language on show; idle in English or with no jobs to overlay yet. */
function useOverlays(codes: string[] | null) {
  const locale = useLocale()
  return useLoaded(locale === 'en' || codes === null ? null : [locale, ...codes].join('|'), loadOverlaysFor)
}

/** The loaded value with the overlays applied: untouched (same identity) in English or when they failed. */
function withOverlays<T>(loaded: Loaded<T>, overlays: Loaded<Overlays | null>, apply: (data: T, o: Overlays) => T) {
  if (loaded.status !== 'ready' || overlays.status === 'idle') return loaded
  if (overlays.status === 'loading') return { status: 'loading' } as Loaded<T>
  if (overlays.status === 'error' || overlays.data === null) return loaded
  return { ...loaded, data: apply(loaded.data, overlays.data) }
}

const bundleCodes = (bundle: RoleBundle) => [bundle.role.onet_code, ...bundle.related.map((role) => role.onet_code)]

/** The language's index of job titles and skill names, for screens that show many jobs; null in English. */
export function useLocaleIndex(): LocaleIndex | null {
  const overlays = useOverlays([])
  return overlays.status === 'ready' ? (overlays.data?.index ?? null) : null
}

/**
 * Whether the job's content is translated in the language on show: null in English, while loading or with no job,
 * so a "not translated yet" note shows only once it is known.
 */
export function useRoleTranslated(onetCode: string | null): boolean | null {
  const locale = useLocale()
  const role = useLoaded(locale === 'en' ? null : onetCode, loadRole)
  const overlays = useOverlays(onetCode === null ? null : [onetCode])
  if (role.status !== 'ready' || overlays.status !== 'ready' || !overlays.data) return null
  return isRoleTranslated(role.data, overlays.data.roles.get(role.data.onet_code))
}

export const useManifest = () => useLoaded('manifest', loadManifest)
/** The role index stays English: its titles identify jobs (?job=); screens show `roleTitle` from useLocaleIndex. */
export const useRoleIndex = () => useLoaded('roles', loadRoleIndex)
export const useRoleBundle = (onetCode: string | null) => {
  const loaded = useLoaded(onetCode, loadRoleBundle)
  const overlays = useOverlays(loaded.status === 'ready' ? bundleCodes(loaded.data) : null)
  return useMemo(() => withOverlays(loaded, overlays, overlayRoleBundle), [loaded, overlays])
}
export const usePathways = () => useLoaded('pathways', loadPathways)
export const useSdgReasons = () => {
  const loaded = useLoaded('sdg-reasons', loadSdgReasons)
  const overlays = useOverlays([])
  return useMemo(
    () => withOverlays(loaded, overlays, (data, o) => overlaySdgReasons(data, o.index)),
    [loaded, overlays]
  )
}
/** The 3D space's file; nothing is fetched until `enabled`, so a session with no check-up skips its 4 MB. */
export const useSpaceFile = (enabled: boolean) => useLoaded(enabled ? 'space' : null, loadSpaceFile)
export const useSuggestions = (profile: Profile | null, currentCode: string | null) =>
  useLoaded(profile ? JSON.stringify({ profile, current_role_code: currentCode }) : null, loadSuggestionsFor)
/** The check-up's roles for the session: the assessed role first, then the roles it is ranked against. null loads none. */
export const useCheckupBundle = (session: GuestSession | null) => {
  const loaded = useLoaded(session && checkupBundleKey(session), loadCheckupBundleFor)
  const overlays = useOverlays(loaded.status === 'ready' ? bundleCodes(loaded.data) : null)
  return useMemo(() => withOverlays(loaded, overlays, overlayCheckupBundle), [loaded, overlays])
}
