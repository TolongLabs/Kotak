import {
  buildRoadmap,
  cornerLevel,
  engineInputs,
  fitScore,
  PENDING_HOURS,
  questionOrder,
  roleVerdicts,
  transferAnswers,
  transferLevels,
  type BundleRole,
  type CornerVerdict,
  type FitScore,
  type Roadmap,
  type Scenario,
  type SnapshotId,
  type TransferredLevel,
  type VerdictRow
} from '@kotak/shared'
import { useMemo, useState } from 'react'
import { useGuestSession } from '../session/store'
import { useRoleBundle, type Loaded } from './bundle'

// Runs the shared engine (#83) on a role's bundle file for the active snapshot. Both snapshots' signals are in the
// file, so switching snapshot or scenario recomputes synchronously, with no fetch.

export interface CheckupInput {
  role: BundleRole
  related: BundleRole[]
  /** The session's 12 answers: [2i] is corner i's working answer, [2i + 1] its follow-up (advanced or basic). */
  answers: (boolean | null)[]
  snapshotId: SnapshotId
  scenario: Scenario
  weeklyHours: number | null
  startDate: string
}

export interface CheckupCorner {
  corner_id: string
  name: string
  verdict: CornerVerdict
  /** The scenario's row of the verdict table; null when an input is missing. */
  row: VerdictRow | null
  /** The scenario's target level, an estimate. */
  target: number
  level: TransferredLevel
}

export interface CheckupRole {
  onet_code: string
  title: string
  rank: number
  fit: FitScore
  levels: TransferredLevel[]
}

export interface Checkup {
  snapshotId: SnapshotId
  scenario: Scenario
  /** false: no can-do statements yet, so show "questions not generated yet", and never show roadmap hours, weeks
   * or the finish date, which come from PENDING_HOURS. */
  questionsReady: boolean
  questionOrder: { corner_id: string; name: string }[]
  corners: CheckupCorner[]
  /** The role and its related roles, best fit first. */
  roles: CheckupRole[]
  roadmap: Roadmap
}

/** Levels 0 to 3 by corner ID for every corner with both questions answered. */
export function answeredLevels(role: BundleRole, answers: (boolean | null)[]): Record<string, number> {
  return Object.fromEntries(
    role.corners.flatMap((corner, i) => {
      const working = answers[2 * i]
      const followUp = answers[2 * i + 1]
      return working == null || followUp == null ? [] : [[corner.corner_id, cornerLevel(working, followUp)]]
    })
  )
}

export function computeCheckup(input: CheckupInput): Checkup {
  const { role, snapshotId, scenario } = input
  const matched = [role, ...input.related]
  const { links } = engineInputs(role, matched).role
  const answers = transferAnswers(role, answeredLevels(role, input.answers))
  const verdictsOf = (r: BundleRole) => roleVerdicts(r.signals[snapshotId]).corners
  const verdicts = verdictsOf(role)
  const levels = new Map(transferLevels(role, answers, links).map((level) => [level.corner_id, level]))
  const names = new Map(role.corners.map((corner) => [corner.corner_id, corner.name]))
  const signals = new Map(role.signals[snapshotId].corners.map((corner) => [corner.corner_id, corner]))

  const scored = matched.map((m) => {
    const targets = new Map(verdictsOf(m).map((v) => [v.corner_id, v.scenarios[scenario].target.value]))
    const roleLevels = transferLevels(m, answers, links)
    const fit = fitScore(
      roleLevels.map((l) => ({ corner_id: l.corner_id, user_level: l.level, target_level: targets.get(l.corner_id)! }))
    )
    return { onet_code: m.onet_code, title: m.title, fit, levels: roleLevels }
  })

  return {
    snapshotId,
    scenario,
    questionsReady: role.questions_ready,
    questionOrder: questionOrder(verdicts, scenario).map((id) => ({ corner_id: id, name: names.get(id)! })),
    corners: verdicts.map((verdict) => ({
      corner_id: verdict.corner_id,
      name: names.get(verdict.corner_id)!,
      verdict,
      row: verdict.scenarios[scenario].row,
      target: verdict.scenarios[scenario].target.value,
      level: levels.get(verdict.corner_id)!
    })),
    roles: [...scored].sort((a, b) => b.fit.score - a.fit.score).map((r, i) => ({ ...r, rank: i + 1 })),
    roadmap: buildRoadmap({
      verdicts,
      corners: role.corners.map((corner) => ({
        corner_id: corner.corner_id,
        user_level: levels.get(corner.corner_id)!.level,
        milestone_hours: corner.hours ?? PENDING_HOURS,
        time_saving: signals.get(corner.corner_id)?.time_saving ?? null
      })),
      start_date: input.startDate,
      scenario,
      weekly_hours: input.weeklyHours
    })
  }
}

export interface LoadedCheckup {
  checkup: Checkup
  /** Related roles whose bundle file failed, left out of the ranking. */
  unavailable: string[]
}

/**
 * The check-up for `onetCode` (default: the session's role) from the session's answers, active snapshot and weekly
 * hours. The scenario is the caller's, since the session does not store it.
 */
export function useCheckup({
  onetCode,
  scenario
}: {
  onetCode?: string | null
  scenario: Scenario
}): Loaded<LoadedCheckup> {
  const session = useGuestSession()
  const bundle = useRoleBundle(onetCode === undefined ? session.role_code : onetCode)
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const data = bundle.status === 'ready' ? bundle.data : null
  const { answers, active_snapshot_id: snapshotId, custom_weekly_hours: weeklyHours } = session

  const checkup = useMemo(
    () =>
      data &&
      computeCheckup({
        role: data.role,
        related: data.related,
        answers,
        snapshotId,
        scenario,
        weeklyHours,
        startDate: today
      }),
    [data, answers, snapshotId, scenario, weeklyHours, today]
  )

  if (bundle.status !== 'ready') return bundle
  return { status: 'ready', data: { checkup: checkup!, unavailable: bundle.data.unavailable } }
}
