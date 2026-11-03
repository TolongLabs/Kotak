// `/data/space.json`, the 3D space's file: every role cut to the fields the engine reads when it ranks a role against
// the assessed one, so the browser can run computeCheckup on all of them without fetching every role file. For a
// ranked role, the engine reads only:
//   engineInputs     onet_code, title, corners[].corner_id and task_ids, links.task_iwas and links.iwa_broad
//   transferLevels   onet_code, corners[].corner_id and task_ids, through those links
//   roleVerdicts     signals[id].snapshot_id, onet_code and anchors' values; per corner its corner_id, the dated
//                    ai_usage values, collaboration's automation and augmentation shares, and each demand direction
//   fitScore         the levels and targets the three above give
// The assessed role always comes from its full role file, because transferAnswers, the question order and the roadmap
// also read its names and hours. Each corner keeps its name too, for the space's skill labels; the engine doesn't read
// it. Sources and fallback labels are left out, so cite the manifest's snapshot sources; an AI-use series only keeps
// whether it was borrowed from a broader Malaysian row. The usage index anchors keep their sources once, for the file.
// The build writes this file from roles it already checked, so it has no schema of its own.

import type { SnapshotId } from '../engine'
import type {
  AiUsagePoint,
  CornerCollaboration,
  CornerDemandReading,
  CornerSignals,
  RoleSignals,
  UsageAnchors
} from '../rules/schemas'
import type { BundleCorner, BundleOnetMeta, BundleRole } from './schemas'

export interface SpaceCornerSignals {
  corner_id: CornerSignals['corner_id']
  ai_usage: {
    points: Pick<AiUsagePoint, 'vintage_date' | 'value'>[]
    /** Set when the series is borrowed from a broader Malaysian row (its fallback label starts "Borrowed from"). */
    borrowed?: true
  }
  collaboration: Pick<CornerCollaboration, 'automation_pct' | 'augmentation_pct'> | null
  demand: Pick<CornerDemandReading, 'direction'>[]
}

export interface SpaceRole {
  onet_code: string
  title: string
  /** The SOC 2018 major group: the code's first two digits, such as "15". */
  group: string
  corners: Pick<BundleCorner, 'corner_id' | 'name' | 'task_ids'>[]
  links: Pick<BundleRole['links'], 'task_iwas' | 'iwa_broad'>
  signals: Record<
    SnapshotId,
    Pick<RoleSignals, 'snapshot_id' | 'onet_code'> & {
      anchors: { mys: { value: number }; sgp: { value: number } }
      corners: SpaceCornerSignals[]
    }
  >
}

export interface SpaceFile {
  meta: BundleOnetMeta
  /**
   * Malaysia's and Singapore's AI usage index per snapshot, with their sources: the snapshot's overall Economic Index
   * rows, the same in every role's signals (resolveRoleSignals), so the space can cite them without a role file.
   */
  anchors: Record<SnapshotId, UsageAnchors>
  roles: SpaceRole[]
}

const spaceSignals = (s: RoleSignals): SpaceRole['signals'][SnapshotId] => ({
  snapshot_id: s.snapshot_id,
  onet_code: s.onet_code,
  anchors: { mys: { value: s.anchors.mys.value }, sgp: { value: s.anchors.sgp.value } },
  corners: s.corners.map((c) => ({
    corner_id: c.corner_id,
    // A suppressed (null) value never counts as a dated point, so it is left out.
    ai_usage: {
      points: c.ai_usage.points.flatMap((p) =>
        p.value === null ? [] : [{ vintage_date: p.vintage_date, value: p.value }]
      ),
      ...(c.ai_usage.fallback_label?.startsWith('Borrowed from') && { borrowed: true as const })
    },
    collaboration: c.collaboration && {
      automation_pct: c.collaboration.automation_pct,
      augmentation_pct: c.collaboration.augmentation_pct
    },
    demand: c.demand.map((d) => ({ direction: d.direction }))
  }))
})

/** A role as the space ranks it: only what the engine reads for a ranked role (see above). */
export function spaceRole(role: BundleRole): SpaceRole {
  return {
    onet_code: role.onet_code,
    title: role.title,
    group: role.onet_code.slice(0, 2),
    corners: role.corners.map((c) => ({ corner_id: c.corner_id, name: c.name, task_ids: c.task_ids })),
    links: { task_iwas: role.links.task_iwas, iwa_broad: role.links.iwa_broad },
    signals: Object.fromEntries(
      Object.entries(role.signals).map(([id, signals]) => [id, spaceSignals(signals)])
    ) as SpaceRole['signals']
  }
}
