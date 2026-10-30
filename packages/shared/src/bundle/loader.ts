// Pure helpers for the browser's snapshot loader (#41): where the bundle files live, and the engine inputs joined
// from parsed bundle files. The caller fetches and parses the files; nothing here does I/O.

import type { MilestoneHours } from '../data/role-corners'
import { SnapshotIdSchema, type SnapshotId } from '../engine'
import type { DiffRole } from '../rules/diff'
import type { SnapshotSignals, TransferAnswer } from '../rules/schemas'
import type { BundleRole } from './schemas'

/** Static asset paths of the bundle, served by the Worker from the Vite build. */
export const BUNDLE_PATHS = {
  manifest: '/data/manifest.json',
  roles: '/data/roles.json',
  role: (onetCode: string) => `/data/roles/${onetCode}.json`,
  pathways: '/data/pathways.json',
  sdgReasons: '/data/sdg-reasons.json',
  /** Every role, cut to what the engine reads for a ranked role, for the 3D space (see space.ts). */
  space: '/data/space.json'
} as const

/**
 * Milestone hours for corners the batch has not written yet (`questions_ready: false`). They let the rules order the
 * roadmap and run What Changed, neither of which reads hours; they are not estimates, so never show them.
 */
export const PENDING_HOURS: MilestoneHours = { basic: 1, working: 1, advanced: 1 }

/**
 * The inputs `diffSnapshots`, `transferLevels`, `fitScore` and `roleVerdicts` take, for the user's role and the roles
 * ranked against it (which may include the role itself). `snapshots` holds every role's signals per snapshot.
 */
export function engineInputs(
  role: BundleRole,
  matched: BundleRole[]
): { role: DiffRole; snapshots: Record<SnapshotId, SnapshotSignals> } {
  const roles = [role, ...matched.filter((m) => m.onet_code !== role.onet_code)]
  const snapshot = (id: SnapshotId): SnapshotSignals => ({ snapshot_id: id, roles: roles.map((r) => r.signals[id]) })
  return {
    role: {
      onet_code: role.onet_code,
      corners: role.corners.map((c) => ({
        corner_id: c.corner_id,
        name: c.name,
        task_ids: c.task_ids,
        milestone_hours: c.hours ?? PENDING_HOURS
      })),
      matched: matched.map((m) => ({
        onet_code: m.onet_code,
        title: m.title,
        corners: m.corners.map((c) => ({ corner_id: c.corner_id, task_ids: c.task_ids }))
      })),
      links: {
        task_iwas: Object.assign({}, ...roles.map((r) => r.links.task_iwas)),
        iwa_broad: Object.assign({}, ...roles.map((r) => r.links.iwa_broad))
      }
    },
    snapshots: Object.fromEntries(SnapshotIdSchema.options.map((id) => [id, snapshot(id)])) as Record<
      SnapshotId,
      SnapshotSignals
    >
  }
}

/** The user's answered levels (0 to 3, by corner ID) as transfer answers on `role`'s corners. */
export function transferAnswers(role: BundleRole, levels: Record<string, number>): TransferAnswer[] {
  return role.corners
    .filter((c) => levels[c.corner_id] !== undefined)
    .map((c) => ({
      onet_code: role.onet_code,
      corner_id: c.corner_id,
      level: levels[c.corner_id]!,
      task_ids: c.task_ids
    }))
}
