import {
  addMonths,
  HORIZON_MONTHS,
  roleVerdicts,
  uniqueSources,
  type BundleRole,
  type CornerVerdict,
  type Scenario,
  type SnapshotId,
  type Source
} from '@kotak/shared'
import type { Corner, Level, Role, SourceRef, VerdictId } from '../demo/types'
import type { Checkup } from './checkup'

// Turns the engine's check-up into the shapes the screens' components already take (demo/types.ts), so the approved
// components stay as they are. Every value here comes from the role's bundle file; nothing is typed in by hand.

export const verdictId = (status: CornerVerdict['status']) => status.toLowerCase() as VerdictId

// Targets are estimates between 1 and 3; the meters show whole levels, the radar line plots the same rounding.
const neededLevel = (target: number) => Math.min(3, Math.max(1, Math.round(target))) as 1 | 2 | 3

const monthLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })

/** "Needed by Apr 2027": the end of the projection, 12 months after the latest data month. */
export function neededByLabel(checkup: Checkup) {
  const projected = checkup.corners
    .map((corner) => corner.verdict.scenarios[checkup.scenario].projection?.projected_to)
    .find(Boolean)
  return `Needed by ${monthLabel(projected ?? addMonths(`${checkup.snapshotId}-01`, HORIZON_MONTHS))}`
}

const sourceKey = (source: Source) => [source.source_url, source.vintage_date, source.geo_or_layer].join('|')

/** The check-up's sources, numbered once each, and each corner's citation numbers. */
export function sourceRefs(checkup: Checkup) {
  const all = uniqueSources(checkup.corners.flatMap((corner) => corner.verdict.sources))
  const numberOf = new Map(all.map((source, i) => [sourceKey(source), i + 1]))
  const sources: SourceRef[] = all.map((source, i) => ({
    n: i + 1,
    name: source.source_name,
    detail: `${source.geo_or_layer} · ${source.vintage_date}`,
    href: source.source_url
  }))
  const numbers = new Map(
    checkup.corners.map((corner) => [
      corner.corner_id,
      [...new Set(corner.verdict.sources.map((source) => numberOf.get(sourceKey(source))!))]
    ])
  )
  return { sources, numbers }
}

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

export function toCorners(checkup: Checkup, numbers: Map<string, number[]>): Corner[] {
  return checkup.corners.map((corner) => ({
    id: corner.corner_id,
    name: corner.name,
    verdict: verdictId(corner.verdict.status),
    you: corner.level.level as Level,
    neededSlow: neededLevel(corner.verdict.scenarios.slow.target.value),
    neededFast: neededLevel(corner.verdict.scenarios.fast.target.value),
    reasoning: cornerReasoning(corner.verdict, checkup.scenario),
    sources: numbers.get(corner.corner_id) ?? []
  }))
}

/** A role's outlook from its own corners; Unknown wins when it covers at least half of them. */
export function roleOutlook(role: BundleRole, snapshotId: SnapshotId): VerdictId {
  const statuses = roleVerdicts(role.signals[snapshotId]).corners.map((corner) => corner.status)
  const unknown = statuses.filter((status) => status === 'Unknown').length
  if (unknown >= statuses.length / 2) return 'unknown'

  const rising = statuses.filter((status) => status === 'Rising').length
  const declining = statuses.filter((status) => status === 'Declining').length
  return rising > declining ? 'rising' : declining > rising ? 'declining' : 'steady'
}

/** The ranked roles, with the two biggest gaps named from each role's own corners. */
export function toRoles(checkup: Checkup, bundleRoles: BundleRole[], currentCode: string | null): Role[] {
  const byCode = new Map(bundleRoles.map((role) => [role.onet_code, role]))
  return checkup.roles.map((role) => {
    const bundleRole = byCode.get(role.onet_code)
    const names = new Map(bundleRole?.corners.map((corner) => [corner.corner_id, corner.name]))
    const gaps = role.fit.terms
      .filter((term) => term.user_level < term.target_level)
      .sort((a, b) => b.target_level - b.user_level - (a.target_level - a.user_level))
      .slice(0, 2)
      .map((term) => names.get(term.corner_id) ?? term.corner_id)
    return {
      id: role.onet_code,
      title: role.title,
      isCurrentJob: role.onet_code === currentCode,
      fit: Math.round(role.fit.score),
      outlook: bundleRole ? roleOutlook(bundleRole, checkup.snapshotId) : 'unknown',
      missing: gaps.join(', ')
    }
  })
}
