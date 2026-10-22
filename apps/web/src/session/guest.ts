import { GuestSessionSchema, type GuestSession } from '@kotak/shared'

// Stand-in for #41 (guest session store). Replace with that store when it lands.
const STORAGE_KEY = 'kotak:guest-session'

const freshSession: GuestSession = {
  is_guest: true,
  role_code: null,
  goal: null,
  impact_area: null,
  target_role_code: null,
  answers: Array<boolean | null>(12).fill(null),
  follow_up_answers: {},
  ticked_milestones: [],
  custom_weekly_hours: null,
  pasted_job_ad_quotes: [],
  tts_muted: false,
  active_snapshot_id: '2026-04'
}

// The session started on this page, for when storage is blocked (private window).
let memorySession: GuestSession | null = null

export function startGuestSession(): void {
  memorySession = freshSession
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshSession))
  } catch {
    // Storage blocked: readGuestSession falls back to memorySession for this page view.
  }
}

export function readGuestSession(): GuestSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return memorySession
    const parsed = GuestSessionSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return memorySession
  }
}
