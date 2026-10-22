import type { RoadmapStep } from '../../demo/types'

/** A RoadmapStep plus its own learning hours, straight from the roadmap item. */
export interface TimelineStep extends RoadmapStep {
  totalHours: number
}

const DAY_MS = 24 * 60 * 60 * 1000

/** One decimal at most: no unrounded float reaches the screen. */
export function fmt(value: number) {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(value)
}

/** Midnight UTC, the same day every part of the plan uses. */
export function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00Z`)
}

export function dayDiff(fromIso: string, toIso: string) {
  return Math.round((parseIsoDate(toIso).getTime() - parseIsoDate(fromIso).getTime()) / DAY_MS)
}

export function addIsoDays(iso: string, days: number) {
  const date = parseIsoDate(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** The plan date of a readiness week: week 0 is the start day, week n (from 1) is its first day. */
export function planWeekDate(startIso: string, week: number) {
  return addIsoDays(startIso, week === 0 ? 0 : (week - 1) * 7)
}

export function formatPlanDay(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(parseIsoDate(iso))
}

/** The step that runs in readiness week: it covers the week, or the next one to start, or the last one. */
export function stepActiveInWeek(steps: TimelineStep[], week: number): RoadmapStep | null {
  const inside = steps.find((step) => step.weeks[0] <= week && week <= step.weeks[1])
  if (inside) return inside
  const upcoming = steps.find((step) => step.weeks[0] > week)
  if (upcoming) return upcoming
  return steps[steps.length - 1] ?? null
}
