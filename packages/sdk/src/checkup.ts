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
  type GuestSession,
  type Roadmap,
  type Scenario,
  type SnapshotId,
  type TransferredLevel,
  type VerdictRow
} from '@kotak/shared'
import type { CornerAnswer } from './schemas'

// Runs the shared engine (#83) on a role's bundle file for the active snapshot. Both snapshots' signals are in the
// file, so switching snapshot or scenario recomputes synchronously, with no fetch.

export interface CheckupInput {
  role: BundleRole
  related: BundleRole[]
  /** The session's 12 answer slots, as answerSlots lays them out. */
  answers: (boolean | null)[]
  snapshotId: SnapshotId
  scenario: Scenario
  weeklyHours: number | null
  startDate: string
  /** The role the roadmap plans for; null, or a role outside `related`, plans for `role`. */
  planRoleCode?: string | null
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
  /** The role the roadmap plans for. */
  planRoleCode: string
}

type AnsweredRole = { onet_code: string; corners: { corner_id: string }[] }

/**
 * The session's 12 answer slots, as the app keeps them, from a role's answers: [2i] is the role's corner i's can-do
 * answer and [2i + 1] its follow-up; a corner left out stays null. Throws on a corner the role doesn't have.
 */
export function answerSlots(role: AnsweredRole, answers: CornerAnswer[]): (boolean | null)[] {
  const slots = Array<boolean | null>(12).fill(null)
  for (const answer of answers) {
    const i = role.corners.findIndex((corner) => corner.corner_id === answer.corner_id)
    if (i < 0)
      throw new Error(
        `${role.onet_code} has no corner ${answer.corner_id}; its corners are ${role.corners.map((c) => c.corner_id).join(', ')}.`
      )
    slots[2 * i] = answer.can_do
    slots[2 * i + 1] = answer.follow_up
  }
  return slots
}

/** The answers in a role's 12 answer slots (see answerSlots), in corner order; a corner without both is left out. */
export function cornerAnswers(role: AnsweredRole, slots: (boolean | null)[]): CornerAnswer[] {
  return role.corners.flatMap(({ corner_id }, i) => {
    const [can_do, follow_up] = [slots[2 * i], slots[2 * i + 1]]
    return can_do == null || follow_up == null ? [] : [{ corner_id, can_do, follow_up }]
  })
}

/** Levels 0 to 3 by corner ID for every corner with both questions answered. */
export function answeredLevels(role: BundleRole, answers: (boolean | null)[]): Record<string, number> {
  return Object.fromEntries(
    cornerAnswers(role, answers).map((answer) => [answer.corner_id, cornerLevel(answer.can_do, answer.follow_up)])
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

  const scored = matched.map((m) => {
    const targets = new Map(verdictsOf(m).map((v) => [v.corner_id, v.scenarios[scenario].target.value]))
    const roleLevels = transferLevels(m, answers, links)
    const fit = fitScore(
      roleLevels.map((l) => ({ corner_id: l.corner_id, user_level: l.level, target_level: targets.get(l.corner_id)! }))
    )
    return { onet_code: m.onet_code, title: m.title, fit, levels: roleLevels }
  })

  const planRole = matched.find((m) => m.onet_code === input.planRoleCode) ?? role
  const planVerdicts = planRole === role ? verdicts : verdictsOf(planRole)
  const planLevels =
    planRole === role
      ? levels
      : new Map(transferLevels(planRole, answers, links).map((level) => [level.corner_id, level]))
  const planSignals = new Map(planRole.signals[snapshotId].corners.map((corner) => [corner.corner_id, corner]))

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
    planRoleCode: planRole.onet_code,
    roadmap: buildRoadmap({
      verdicts: planVerdicts,
      corners: planRole.corners.map((corner) => ({
        corner_id: corner.corner_id,
        user_level: planLevels.get(corner.corner_id)!.level,
        milestone_hours: corner.hours ?? PENDING_HOURS,
        time_saving: planSignals.get(corner.corner_id)?.time_saving ?? null
      })),
      start_date: input.startDate,
      scenario,
      weekly_hours: input.weeklyHours
    })
  }
}

/** The role the check-up is about: the target role for the target goal, otherwise the current job (null before one). */
export function assessedRoleCode<Code extends string | null>(
  session: Pick<GuestSession, 'goal' | 'target_role_code'> & { role_code: Code }
): Code | string {
  return session.goal === 'target' && session.target_role_code ? session.target_role_code : session.role_code
}
