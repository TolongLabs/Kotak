import { GuestSessionSchema, ProfileSchema, type GuestSession, type Rating } from '@kotak/shared'
import { useSyncExternalStore } from 'react'

// The guest's check-up state, kept in this browser only (TRD.md "Client runtime"). Same key as the #136 stand-in.
const GUEST_SESSION_KEY = 'kotak:guest-session'
// The scenario options' shuffle seed (#352), kept apart from the session so the session's schema is unchanged.
const SCENARIO_SEED_KEY = 'kotak:scenario-seed'

const cleanSession: GuestSession = {
  is_guest: false,
  role_code: null,
  goal: null,
  impact_area: null,
  target_role_code: null,
  plan_role_code: null,
  answers: Array<Rating | null>(12).fill(null),
  follow_up_answers: {},
  ticked_milestones: [],
  custom_weekly_hours: 4,
  pasted_job_ad_quotes: [],
  // Kopi starts muted, as every view did before this store (#133); one tap on the speech box unmutes.
  tts_muted: false,
  active_snapshot_id: '2026-05',
  profile: ProfileSchema.parse({})
}

const listeners = new Set<() => void>()
let session: GuestSession | undefined
let seed: number | undefined

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

// Sessions saved before the 1 to 4 scale hold yes/no answers: keep the profile and settings, start over on the rest.
function withoutOldAnswers(saved: unknown): unknown {
  if (typeof saved !== 'object' || saved === null || !('answers' in saved) || !Array.isArray(saved.answers))
    return saved
  if (!saved.answers.some((answer) => typeof answer === 'boolean')) return saved
  // The old role, plan and ticks belong to the old answers: dropping the role sends the results pages to the retake prompt.
  return {
    ...saved,
    answers: Array(12).fill(null),
    role_code: null,
    target_role_code: null,
    plan_role_code: null,
    ticked_milestones: []
  }
}

function load(): GuestSession {
  try {
    const raw = localStorage.getItem(GUEST_SESSION_KEY)
    if (raw === null) return cleanSession
    const parsed = GuestSessionSchema.safeParse(withoutOldAnswers(parseJson(raw)))
    if (parsed.success) return parsed.data
    console.warn('The saved guest session was invalid, so Kotak reset it.')
    localStorage.removeItem(GUEST_SESSION_KEY)
  } catch {
    // Storage is blocked (private windows): the session lives in memory for this page.
  }
  return cleanSession
}

function commit(next: GuestSession, persist: () => void) {
  session = next
  try {
    persist()
  } catch {
    // Blocked storage: the change still applies until the page closes.
  }
  listeners.forEach((listener) => listener())
}

export function getGuestSession(): GuestSession {
  session ??= load()
  return session
}

// Same contract as the #136 stand-in: null until the visitor signs in as a guest.
export function readGuestSession(): GuestSession | null {
  const current = getGuestSession()
  return current.is_guest ? current : null
}

export function updateGuestSession(changes: Partial<GuestSession>) {
  const next = GuestSessionSchema.parse({ ...getGuestSession(), ...changes })
  commit(next, () => localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(next)))
}

// Keeps anything set before sign-in, such as the mute choice on the landing page.
export function startGuestSession() {
  updateGuestSession({ is_guest: true })
}

export function resetGuestSession() {
  seed = undefined
  commit(cleanSession, () => {
    localStorage.removeItem(GUEST_SESSION_KEY)
    localStorage.removeItem(SCENARIO_SEED_KEY)
  })
}

/**
 * The seed of this session's scenario option order (#352), for `slotQuestion`: made on first use, sessions saved
 * before it included, and kept until the session is reset, so a reload keeps the order.
 */
export function scenarioSeed(): number {
  if (seed !== undefined) return seed
  try {
    const saved = localStorage.getItem(SCENARIO_SEED_KEY)
    if (saved !== null && /^\d{1,10}$/.test(saved) && Number(saved) <= 0xffffffff) return (seed = Number(saved))
  } catch {
    // Blocked storage: the seed lives in memory for this page, like the session.
  }
  seed = crypto.getRandomValues(new Uint32Array(1))[0]!
  try {
    localStorage.setItem(SCENARIO_SEED_KEY, String(seed))
  } catch {
    // As above.
  }
  return seed
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useGuestSession(): GuestSession {
  return useSyncExternalStore(subscribe, getGuestSession)
}

/** True once the check-up has been answered; a role with blank answers would show a false 0% fit. */
export const hasAnswers = (session: Pick<GuestSession, 'answers'>) => session.answers.some((answer) => answer !== null)
