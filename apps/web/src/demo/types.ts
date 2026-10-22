export type VerdictId = 'rising' | 'steady' | 'declining' | 'split' | 'unknown'

export type Level = 0 | 1 | 2 | 3

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
  you: Level
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

export type NationalRow = {
  skill: string
  share: number
  verdict: VerdictId
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
}

export type NationalView = {
  title: string
  intro: string
  sample: { title: string; body: string }
  filters: {
    occupationGroup: { label: string; value: string }
    quarter: { label: string; value: string }
  }
  gapsTitle: string
  rows: NationalRow[]
  howCounted: {
    title: string
    steps: string[]
    privacy: string
    downloadLabel: string
    sampleLabel: string
  }
}
