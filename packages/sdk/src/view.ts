import {
  addDays,
  roleVerdicts,
  type BundleRole,
  type CornerVerdict,
  type FitScore,
  type Roadmap,
  type RoadmapItem,
  type Scenario,
  type SnapshotId,
  type TransferredLevel
} from '@kotak/shared'
import type { Outlook } from './schemas'

// How a check-up reads in words and weeks. The SDK's report and the web's view models (apps/web/src/engine/viewModel.ts
// and roadmapModel.ts) both use these, so the app and the agents say the same thing.

const aiTrendText = { rising: 'is rising', not_rising: 'is not rising', unknown: 'has no trend yet' }
const modeText = { augmentation: 'mostly helps people do it', automation: 'mostly does it alone', unknown: '' }
const demandText = { up: 'rising', flat: 'flat', down: 'falling', unknown: 'not measured yet' }

/** Why the verdict is what it is, in plain words, from the same inputs the rule table read. */
export function cornerReasoning(verdict: CornerVerdict, scenario: Scenario): string {
  switch (verdict.reason) {
    case 'scenarios_disagree':
    case 'sources_disagree': {
      const [slow, fast] = ['slow', 'fast'].map((s) => verdict.futures.find((f) => f.scenario === s)?.status)
      const cause =
        verdict.reason === 'scenarios_disagree' ? 'The two AI futures disagree' : 'The job-ad sources disagree'
      return `${cause}: ${slow ?? 'Unknown'} at Malaysia’s pace, ${fast ?? 'Unknown'} if AI uptake speeds up.`
    }
    case 'too_few_points':
      return 'There are too few dated data points to call a trend yet.'
    case 'no_collaboration_split':
      return 'There is no data yet on whether AI helps with this work or does it alone.'
    case 'no_demand':
      return 'There is no job-ad demand data for this skill yet.'
    case 'table': {
      const outcome = verdict.scenarios[scenario]
      const mode = modeText[outcome.collaboration_mode]
      return `AI use for this work ${aiTrendText[outcome.ai_trend]}${mode ? ` and AI ${mode}` : ''}. Job-ad demand is ${demandText[outcome.demand]}.`
    }
  }
}

/** A role's outlook from its own corners; Unknown wins when it covers at least half of them. */
export function roleOutlook(role: BundleRole, snapshotId: SnapshotId): Outlook {
  const statuses = roleVerdicts(role.signals[snapshotId]).corners.map((corner) => corner.status)
  const unknown = statuses.filter((status) => status === 'Unknown').length
  if (unknown >= statuses.length / 2) return 'unknown'

  const rising = statuses.filter((status) => status === 'Rising').length
  const declining = statuses.filter((status) => status === 'Declining').length
  return rising > declining ? 'rising' : declining > rising ? 'declining' : 'steady'
}

/** A level carried over from the user's answers rather than answered directly; "not asked yet" is 0, not an estimate. */
export function isEstimatedLevel(level: TransferredLevel): boolean {
  return level.label === 'estimated from your answers' || level.label === 'rough estimate'
}

/** A role's two biggest gaps: its fit terms below their target level, the largest gap first. */
export function biggestGaps(fit: FitScore): FitScore['terms'] {
  return fit.terms
    .filter((term) => term.user_level < term.target_level)
    .sort((a, b) => b.target_level - b.user_level - (a.target_level - a.user_level))
    .slice(0, 2)
}

/** The roadmap's items in rank order, each placed in the weeks its hours take at the weekly hours, with their dates. */
export function roadmapSchedule(
  roadmap: Roadmap
): { item: RoadmapItem; weeks: [number, number]; start_date: string; end_date: string }[] {
  let cumulativeHours = 0
  return [...roadmap.items]
    .sort((left, right) => left.rank - right.rank)
    .map((item) => {
      const previousHours = cumulativeHours
      cumulativeHours += item.hours
      const startWeek = Math.floor(previousHours / roadmap.weekly_hours) + 1
      const endWeek = Math.max(startWeek, Math.ceil(cumulativeHours / roadmap.weekly_hours))
      return {
        item,
        weeks: [startWeek, endWeek],
        start_date: addDays(roadmap.start_date, (startWeek - 1) * 7),
        end_date: addDays(roadmap.start_date, endWeek * 7 - 1)
      }
    })
}
