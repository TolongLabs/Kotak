import { biggestGaps, cornerReasoning, isEstimatedLevel, roleOutlook } from '@kotak/sdk'
import {
  addMonths,
  HORIZON_MONTHS,
  uniqueSources,
  type BundleRole,
  type CornerVerdict,
  type Source
} from '@kotak/shared'
import type { Corner, Level, Role, SourceRef, VerdictId } from '../demo/types'
import type { Checkup } from './checkup'

// Turns the engine's check-up into the shapes the screens' components already take (demo/types.ts), so the approved
// components stay as they are. Every value here comes from the role's bundle file; nothing is typed in by hand. The
// words and gaps come from @kotak/sdk, which the SDK's report reads too, so the app and the agents agree.

export { cornerReasoning, isEstimatedLevel, roleOutlook } from '@kotak/sdk'

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

/** The ranked roles, with the two biggest gaps named from each role's own corners. */
export function toRoles(checkup: Checkup, bundleRoles: BundleRole[], currentCode: string | null): Role[] {
  const byCode = new Map(bundleRoles.map((role) => [role.onet_code, role]))
  return checkup.roles.map((role) => {
    const bundleRole = byCode.get(role.onet_code)
    const names = new Map(bundleRole?.corners.map((corner) => [corner.corner_id, corner.name]))
    const gaps = biggestGaps(role.fit).map((term) => names.get(term.corner_id) ?? term.corner_id)
    return {
      id: role.onet_code,
      title: role.title,
      isCurrentJob: role.onet_code === currentCode,
      fit: Math.round(role.fit.score),
      fitEstimated: role.levels.some(isEstimatedLevel),
      outlook: bundleRole ? roleOutlook(bundleRole, checkup.snapshotId) : 'unknown',
      missing: gaps.join(', ')
    }
  })
}
