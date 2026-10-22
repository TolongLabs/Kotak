// What Changed (#86): runs the rules on two dated snapshots and lists every corner and role that moved. Pure.

import type { SnapshotId } from '../engine'
import type { MilestoneHours } from '../data/role-corners'
import { uniqueSources } from './citations'
import { DEFAULT_SCENARIO } from './constants'
import { roadmapItems } from './roadmap'
import { fitScore } from './scoring'
import { transferLevels } from './transfer'
import { roleVerdicts } from './verdicts'
import type {
  CornerDiffItem,
  CornerState,
  RoleDiffItem,
  RoleSignals,
  RoleState,
  Scenario,
  SnapshotDiff,
  SnapshotSignals,
  TransferAnswer,
  TransferLinks
} from './schemas'

/** The user's role with its corners, and the roles ranked against it (which may include the role itself). */
export type DiffRole = {
  onet_code: string
  corners: { corner_id: string; name: string; task_ids: (string | number)[]; milestone_hours: MilestoneHours }[]
  matched: { onet_code: string; title: string; corners: { corner_id: string; task_ids: (string | number)[] }[] }[]
  links: TransferLinks
}

function signalsFor(snapshot: SnapshotSignals, onetCode: string): RoleSignals {
  const signals = snapshot.roles.find((r) => r.onet_code === onetCode)
  if (!signals) throw new Error(`snapshot ${snapshot.snapshot_id} has no signals for ${onetCode}`)
  return signals
}

const latestUsage = (signals: RoleSignals, cornerId: string) =>
  signals.corners
    .find((c) => c.corner_id === cornerId)!
    .ai_usage.points.filter((p) => p.value !== null)
    .reduce<{ date: string; value: number | null }>(
      (latest, p) => (p.vintage_date >= latest.date ? { date: p.vintage_date, value: p.value } : latest),
      { date: '', value: null }
    ).value

function evaluate(role: DiffRole, answers: TransferAnswer[], snapshot: SnapshotSignals, scenario: Scenario) {
  const levels = new Map(transferLevels(role, answers, role.links).map((l) => [l.corner_id, l.level]))
  const signals = signalsFor(snapshot, role.onet_code)
  const verdicts = roleVerdicts(signals).corners
  const items = roadmapItems(
    verdicts,
    role.corners.map((c) => ({
      corner_id: c.corner_id,
      user_level: levels.get(c.corner_id)!,
      milestone_hours: c.milestone_hours
    })),
    scenario
  )
  const order = [...new Set(items.map((i) => i.corner_id))]
  const corners = new Map(
    verdicts.map((v) => {
      const state: CornerState = {
        status: v.status,
        label: v.label,
        target: v.scenarios[scenario].target.value,
        ai_usage: latestUsage(signals, v.corner_id),
        ai_change: v.scenarios[scenario].projection?.change ?? null,
        roadmap_rank: order.indexOf(v.corner_id) + 1 || null
      }
      return [v.corner_id, { state, sources: v.sources }]
    })
  )

  const scored = role.matched.map((m) => {
    const matchedVerdicts = roleVerdicts(signalsFor(snapshot, m.onet_code)).corners
    const targets = new Map(matchedVerdicts.map((v) => [v.corner_id, v.scenarios[scenario].target.value]))
    const fit = fitScore(
      transferLevels(m, answers, role.links).map((l) => ({
        corner_id: l.corner_id,
        user_level: l.level,
        target_level: targets.get(l.corner_id)!
      }))
    )
    return {
      onet_code: m.onet_code,
      fit_score: fit.score,
      sources: uniqueSources(matchedVerdicts.flatMap((v) => v.sources))
    }
  })
  const ranked = [...scored].sort((a, b) => b.fit_score - a.fit_score)
  const roles = new Map(
    scored.map((s) => {
      const state: RoleState = { fit_score: s.fit_score, rank: ranked.indexOf(s) + 1 }
      return [s.onet_code, { state, sources: s.sources }]
    })
  )
  return { order, corners, roles, ranking: ranked.map((r) => r.onet_code) }
}

const ref = (id: SnapshotId) => ({ snapshot_id: id, data_month: `${id}-01` })

/**
 * Compares two snapshots for one user: corner AI use, targets, verdicts and roadmap places, and the fit score and rank
 * of every matched role. An item is listed only when something moved; Unknown to any verdict counts as a flip.
 */
export function diffSnapshots(
  role: DiffRole,
  userAnswers: TransferAnswer[],
  prevSnapshot: SnapshotSignals,
  nextSnapshot: SnapshotSignals,
  scenario: Scenario = DEFAULT_SCENARIO
): SnapshotDiff {
  const before = evaluate(role, userAnswers, prevSnapshot, scenario)
  const after = evaluate(role, userAnswers, nextSnapshot, scenario)
  const snapshots = { before: ref(prevSnapshot.snapshot_id), after: ref(nextSnapshot.snapshot_id) }

  const corners = role.corners.flatMap((corner): CornerDiffItem[] => {
    const b = before.corners.get(corner.corner_id)!
    const a = after.corners.get(corner.corner_id)!
    const changes = [
      // The label is the verdict (a table row, Split or Unknown) and sets the chip, as in the Split rule.
      b.state.label !== a.state.label && ('verdict' as const),
      b.state.target !== a.state.target && ('target' as const),
      (b.state.ai_usage !== a.state.ai_usage || b.state.ai_change !== a.state.ai_change) && ('ai_use' as const),
      b.state.roadmap_rank !== a.state.roadmap_rank && ('roadmap' as const)
    ].filter((c) => c !== false)
    if (changes.length === 0) return []
    const sources = { before: b.sources, after: a.sources }
    return [
      {
        kind: 'corner',
        corner_id: corner.corner_id,
        name: corner.name,
        changes,
        before: b.state,
        after: a.state,
        sources,
        snapshots
      }
    ]
  })

  const roles = role.matched.flatMap((m): RoleDiffItem[] => {
    const b = before.roles.get(m.onet_code)!
    const a = after.roles.get(m.onet_code)!
    const changes = [
      b.state.fit_score !== a.state.fit_score && ('fit_score' as const),
      b.state.rank !== a.state.rank && ('rank' as const)
    ].filter((c) => c !== false)
    if (changes.length === 0) return []
    const sources = { before: b.sources, after: a.sources }
    return [
      {
        kind: 'role',
        onet_code: m.onet_code,
        title: m.title,
        changes,
        before: b.state,
        after: a.state,
        sources,
        snapshots
      }
    ]
  })

  return {
    onet_code: role.onet_code,
    scenario,
    snapshots,
    corners,
    roles,
    verdict_flips: corners.filter((c) => c.changes.includes('verdict')).length,
    roadmap_reordered: before.order.join() !== after.order.join(),
    roles_reordered: before.ranking.join() !== after.ranking.join()
  }
}
