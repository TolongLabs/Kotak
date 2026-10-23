export type VerdictId = 'rising' | 'steady' | 'declining' | 'split' | 'unknown'

export type Level = 0 | 1 | 2 | 3

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
  neededSlow: 1 | 2 | 3
  neededFast: 1 | 2 | 3
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
  resource: { label: string; href: string; citation?: number }
  sdgs: number[]
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

export type Goal = {
  id: 'stay' | 'target' | 'explore'
  title: string
  description: string
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
