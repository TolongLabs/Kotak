import type { CandidateReason, FreeResource, RoleAccess } from '@kotak/shared'

export type VerdictId = 'rising' | 'steady' | 'declining' | 'split' | 'unknown'

export type Level = 0 | 1 | 2 | 3

// A target level, rounded up to the next half step (1 to 3).
export type NeededLevel = number

export type Scenario = 'slow' | 'fast'

export type SourceRef = {
  n: number
  name: string
  detail: string
  href: string
}

export type Corner = {
  id: string
  name: string
  verdict: VerdictId
  you: number // 0 to 3, in steps of 0.5 for a rated corner
  neededSlow: NeededLevel
  neededFast: NeededLevel
  reasoning?: string
  sources?: number[]
}

export type Role = {
  id: string
  title: string
  isCurrentJob: boolean
  fit: number
  // Some of the levels behind the fit are estimated from answers about another role or corner.
  fitEstimated?: boolean
  outlook: VerdictId
  missing: string
  reasoning?: string
  sources?: number[]
  // What stands between the user and the role, and why it is listed (#284); left out on the sample profile.
  access?: RoleAccess
  reasons?: string[]
  reasonCodes?: CandidateReason[]
  // The pool's fixed score with the outlook and fit added, to order a widened list (#284).
  poolScore?: number
}

export type RoadmapStep = {
  id: string
  state: 'next' | 'todo' | 'done'
  weeks: [number, number]
  when: string
  skill: string
  title: string
  description: string
  gain: string
  hoursPerWeek: number
  resource: { label: string; href: string; citation?: number; kind?: FreeResource['kind'] }
  sdgs: number[]
  /** The skill's SDG targets, such as `4.4`; each has a reason in /data/sdg-reasons.json (#391). */
  sdgTargets?: string[]
  conditional?: string
}

export type ChangeItem = {
  source: string
  skill: string
  from: VerdictId
  to: VerdictId
  why: string
  effect: string
}

export type SwotItem = {
  label: string
  verdict: VerdictId
  detail: string
}

export type Swot = {
  strengths: SwotItem[]
  weaknesses: SwotItem[]
  opportunities: SwotItem[]
  threats: SwotItem[]
}

export type LandingExample = {
  job: string
  question: string
  verdict: VerdictId
  note: string
}

export type Snapshot = {
  id: '2026-04' | '2026-05'
  label: string
}

export type Question = {
  cornerId: string
  level: 'basic' | 'working' | 'advanced'
  text: string
}

export type JobSuggestion = {
  title: string
  onet: string
  onetTitle: string
  alsoKnownAs?: string
}

export type ImpactArea = {
  sdg: number
  label: string
}

export type StatTile = {
  id: string
  label: string
  value: string
  caption?: string
  change?: { from: VerdictId; to: VerdictId }
  progress?: { label: string; value: string }
}

export type DividendNote = {
  title: string
  body: string
  lessImportant: { verdict: VerdictId; text: string }
  sources?: number[]
}

export type User = {
  name: string
  greeting: string
  jobTitle: string
  targetRole: string
  location: string
  lastCheckUp: string
}

export type Readiness = {
  title: string
  caption: string
  readyBy: string
  threshold: string
  yLabels: string[]
  xLabels: string[]
  // Fit % by plan week: plan is your plan, fast is the fast-uptake scenario.
  points: { week: number; plan: number; fast: number }[]
}
