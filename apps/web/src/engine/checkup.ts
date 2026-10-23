import { assessedRoleCode, computeCheckup, type Checkup } from '@kotak/sdk'
import type { GuestSession, Scenario } from '@kotak/shared'
import { useMemo, useState } from 'react'
import { useGuestSession } from '../session/store'
import { useCheckupBundle, type CheckupBundle, type Loaded } from './bundle'

// The check-up itself is computed by @kotak/sdk; this module keeps its old exports for the views and adds the session
// helpers and the React hook.

export {
  answeredLevels,
  assessedRoleCode,
  computeCheckup,
  type Checkup,
  type CheckupCorner,
  type CheckupInput,
  type CheckupRole
} from '@kotak/sdk'

export interface LoadedCheckup {
  checkup: Checkup
  /** Related roles whose bundle file failed, left out of the ranking. */
  unavailable: string[]
  /** The roles behind the check-up, with the pathways data and the pool's candidates (#284). */
  bundle: CheckupBundle
}

/** The role the roadmap plans for: the role picked on the Roles page, otherwise the assessed role. */
export function planRoleCodeOf(
  session: Pick<GuestSession, 'goal' | 'role_code' | 'target_role_code' | 'plan_role_code'>
): string | null {
  return session.plan_role_code ?? assessedRoleCode(session)
}

/**
 * The check-up of the assessed role from the session's answers, active snapshot and weekly hours, ranked against its
 * related roles and the pool's (#284). The scenario is the caller's, since the session does not store it.
 */
export function useCheckup({ scenario }: { scenario: Scenario }): Loaded<LoadedCheckup> {
  const session = useGuestSession()
  const bundle = useCheckupBundle(session)
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
        startDate: today,
        planRoleCode: session.plan_role_code
      }),
    [data, answers, snapshotId, scenario, weeklyHours, today, session.plan_role_code]
  )

  if (bundle.status !== 'ready') return bundle
  return { status: 'ready', data: { checkup: checkup!, unavailable: bundle.data.unavailable, bundle: bundle.data } }
}
