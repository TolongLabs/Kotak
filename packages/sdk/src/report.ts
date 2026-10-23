import { uniqueSources, type BundleRole, type Roadmap, type RoleAccess, type SnapshotId } from '@kotak/shared'
import type { z } from 'zod'
import type { Checkup, CheckupRole } from './checkup'
import { accessFor, pathwaysSources, rankedReasons, type CheckupBundle } from './pathways'
import type { CheckupParamsSchema, CheckupReport, CornerReport, RankedRole, RoadmapReport } from './schemas'
import { biggestGaps, cornerReasoning, isEstimatedLevel, roadmapSchedule, roleOutlook } from './view'

// Turns the engine's check-up into the report. The reason, outlook, gaps and step weeks come from ./view, as the web's
// view models' do, so the report and the app say the same thing.

type Pool = Pick<CheckupBundle, 'role' | 'pathways' | 'candidates'>

function rankedRole(
  ranked: CheckupRole,
  role: BundleRole,
  snapshotId: SnapshotId,
  input: z.output<typeof CheckupParamsSchema>,
  pool: Pool
): RankedRole {
  const names = new Map(role.corners.map((corner) => [corner.corner_id, corner.name]))
  return {
    rank: ranked.rank,
    onet_code: ranked.onet_code,
    title: ranked.title,
    fit_score: ranked.fit.score,
    fit_percent: Math.round(ranked.fit.score),
    fit_estimated: ranked.levels.some(isEstimatedLevel),
    gaps: biggestGaps(ranked.fit).map((term) => ({
      corner_id: term.corner_id,
      name: names.get(term.corner_id)!,
      level: term.user_level,
      target_level: term.target_level
    })),
    outlook: roleOutlook(role, snapshotId),
    access: accessFor(ranked.onet_code, input.profile, pool.pathways, input.role_code),
    reasons: rankedReasons(ranked.onet_code, {
      role: pool.role,
      roleCode: input.role_code,
      candidates: pool.candidates
    })
  }
}

/** The roadmap's steps in order, each placed in the weeks its hours take at the weekly hours. */
function roadmapReport(roadmap: Roadmap, role: BundleRole, access: RoleAccess): RoadmapReport {
  const corners = new Map(role.corners.map((corner) => [corner.corner_id, corner]))
  const steps = roadmapSchedule(roadmap).map(({ item, weeks, start_date, end_date }) => {
    const corner = corners.get(item.corner_id)!
    return {
      rank: item.rank,
      corner_id: item.corner_id,
      name: corner.name,
      verdict: item.status,
      to_level: item.to_level,
      statement: corner.statements![item.statement],
      hours: item.hours,
      tag: item.tag,
      weeks,
      start_date,
      end_date,
      resource: corner.resources[0] ?? null,
      sdg_targets: corner.sdg_targets
    }
  })
  return {
    onet_code: role.onet_code,
    title: role.title,
    steps,
    weekly_hours: roadmap.weekly_hours,
    weekly_hours_from: roadmap.weekly_hours_from,
    total_hours: roadmap.total_hours,
    weeks: roadmap.weeks,
    start_date: roadmap.start_date,
    finish_date: roadmap.finish_date,
    dividend: roadmap.dividend,
    access,
    tools: role.tools
  }
}

/** `roles` holds the assessed role first, then its related roles that loaded. */
export function checkupReport(
  input: z.output<typeof CheckupParamsSchema>,
  roles: BundleRole[],
  checkup: Checkup,
  unavailable: string[],
  pool: Pool
): CheckupReport {
  const byCode = new Map(roles.map((role) => [role.onet_code, role]))
  const corners = checkup.corners.map((corner): CornerReport => ({
    corner_id: corner.corner_id,
    name: corner.name,
    level: corner.level.level,
    level_label: corner.level.label,
    target_level: corner.target,
    verdict: corner.verdict.status,
    verdict_label: corner.verdict.label,
    row: corner.row,
    futures: corner.verdict.futures.map((future) => ({
      scenario: future.scenario,
      status: future.status,
      row: future.row,
      target_level: future.target.value
    })),
    reason: cornerReasoning(corner.verdict, checkup.scenario),
    sources: corner.verdict.sources
  }))
  return {
    input,
    role: { onet_code: roles[0]!.onet_code, title: roles[0]!.title },
    corners,
    roles: checkup.roles.map((ranked) =>
      rankedRole(ranked, byCode.get(ranked.onet_code)!, checkup.snapshotId, input, pool)
    ),
    roadmap: roadmapReport(
      checkup.roadmap,
      byCode.get(checkup.planRoleCode)!,
      accessFor(checkup.planRoleCode, input.profile, pool.pathways, input.role_code)
    ),
    sources: uniqueSources([
      ...checkup.corners.flatMap((corner) => corner.verdict.sources),
      ...checkup.roadmap.dividend.sources,
      ...pathwaysSources(pool.pathways)
    ]),
    unavailable
  }
}
