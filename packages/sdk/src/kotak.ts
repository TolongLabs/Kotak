import {
  DEFAULT_SCENARIO,
  diffSnapshots,
  engineInputs,
  followUpStatement,
  questionOrder,
  roleVerdicts,
  transferAnswers,
  type BundleRole,
  type Scenario,
  type SnapshotId
} from '@kotak/shared'
import { createBundle, type BundleSource } from './bundle'
import { answeredLevels, answerSlots, assessedRoleCode, computeCheckup } from './checkup'
import { checkupReport } from './report'
import {
  CheckupParamsSchema,
  DEFAULT_SNAPSHOT,
  WhatChangedParamsSchema,
  type CheckupParams,
  type CheckupReport,
  type Goal,
  type Manifest,
  type Questions,
  type RoleSummary,
  type WhatChangedParams,
  type WhatChangedReport
} from './schemas'

// The SDK's facade (#184 "SDK layer"): a whole check-up from the data bundle, in the browser, Bun or a Worker. Hold
// one `Kotak` per bundle source; it keeps the files it read for its whole life.

export interface Kotak {
  /** The snapshots, the default snapshot and every source with its vintage date. */
  manifest: () => Promise<Manifest>
  /** A role's title, description, corners with their can-do statements, and related roles. */
  role: (code: string) => Promise<RoleSummary>
  /** The can-do questions in Kotak's asking order, Rising corners first. */
  questions: (code: string, options?: { snapshot_id?: SnapshotId; scenario?: Scenario }) => Promise<Questions>
  /** Levels, verdicts, the ranked roles and the roadmap for the answers. With the target goal it assesses the target. */
  checkup: (input: CheckupParams) => Promise<CheckupReport>
  /** What changed between two snapshots for the same answers. */
  whatChanged: (input: WhatChangedParams) => Promise<WhatChangedReport>
}

/** A role with no can-do statements has no questions, so it is refused rather than given made-up levels. */
function ready(role: BundleRole): BundleRole {
  if (!role.questions_ready)
    throw new Error(`${role.title} (${role.onet_code}) has no can-do questions yet, so Kotak can't check it up.`)
  return role
}

export function createKotak({ source }: { source: BundleSource }): Kotak {
  const bundle = createBundle(source)

  async function assessed(input: { role_code: string; goal: Goal; target_role_code: string | null }) {
    const loaded = await bundle.roleBundle(assessedRoleCode(input))
    ready(loaded.role)
    return loaded
  }

  return {
    async manifest() {
      const { snapshots, credits } = await bundle.manifest()
      return { default_snapshot_id: DEFAULT_SNAPSHOT, snapshots, credits }
    },

    async role(code) {
      const role = await bundle.role(code)
      return {
        onet_code: role.onet_code,
        title: role.title,
        description: role.description,
        questions_ready: role.questions_ready,
        corners: role.corners.map(({ corner_id, name, statements }) => ({ corner_id, name, statements })),
        related: role.related
      }
    },

    async questions(code, { snapshot_id = DEFAULT_SNAPSHOT, scenario = DEFAULT_SCENARIO } = {}) {
      const role = ready(await bundle.role(code))
      const verdicts = roleVerdicts(role.signals[snapshot_id]).corners
      return {
        onet_code: role.onet_code,
        title: role.title,
        snapshot_id,
        scenario,
        corners: questionOrder(verdicts, scenario).map((id) => {
          const corner = role.corners.find((c) => c.corner_id === id)!
          const statements = corner.statements!
          return {
            corner_id: id,
            name: corner.name,
            verdict: verdicts.find((v) => v.corner_id === id)!.status,
            can_do: statements.working,
            follow_up: { if_yes: statements[followUpStatement(true)], if_no: statements[followUpStatement(false)] }
          }
        })
      }
    },

    async checkup(input) {
      const params = CheckupParamsSchema.parse(input)
      const { role, related, unavailable } = await assessed(params)
      const roles = [role, ...related]
      const planRole = params.plan_role_code ? roles.find((r) => r.onet_code === params.plan_role_code) : role
      if (!planRole)
        throw new Error(
          `${params.plan_role_code} isn't one of the roles ranked for ${role.onet_code}, so Kotak can't plan for it; plan for one of ${roles.map((r) => r.onet_code).join(', ')}.`
        )
      ready(planRole)
      const checkup = computeCheckup({
        role,
        related,
        answers: answerSlots(role, params.answers),
        snapshotId: params.snapshot_id,
        scenario: params.scenario,
        weeklyHours: params.weekly_hours,
        startDate: params.start_date,
        planRoleCode: params.plan_role_code
      })
      return checkupReport(params, roles, checkup, unavailable)
    },

    async whatChanged(input) {
      const params = WhatChangedParamsSchema.parse(input)
      const { role, related, unavailable } = await assessed(params)
      const engine = engineInputs(role, [role, ...related])
      const answers = transferAnswers(role, answeredLevels(role, answerSlots(role, params.answers)))
      const diff = diffSnapshots(
        engine.role,
        answers,
        engine.snapshots[params.before],
        engine.snapshots[params.after],
        params.scenario
      )
      return { input: params, diff, unavailable }
    }
  }
}
