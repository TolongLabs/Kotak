import { computeCheckup, isEstimatedLevel } from '@kotak/sdk'
import {
  DEFAULT_SCENARIO,
  DEFAULT_SNAPSHOT,
  FAST_CONVERGENCE,
  roleVerdicts,
  rowStatus,
  ScenarioSchema,
  SnapshotIdSchema,
  VerdictSchema,
  type BundleManifest,
  type BundlePathways,
  type BundleRole,
  type CornerVerdict,
  type Rating,
  type Scenario,
  type SnapshotId,
  type Source,
  type SpaceFile,
  type Verdict
} from '@kotak/shared'

// The 3D space and its 2D table: every job's fit for the session's answers, its AI-use
// growth and its skill verdicts, in both snapshots and both AI futures. The engine computes every number, so the space,
// the table and the Roles page agree by construction. Look Around (/app/space?view=look-around) is the space with no
// answers: no fit, so every job is placed by its O*NET Job Zone instead.

/**
 * SOC 2018 major groups by the first two digits of an O*NET-SOC code, without the trailing "Occupations". Source: U.S.
 * Bureau of Labor Statistics, "2018 Standard Occupational Classification System: Major Groups",
 * https://www.bls.gov/soc/2018/major_groups.htm (read 30 October 2026).
 */
export const SOC_MAJOR_GROUPS: Record<string, string> = {
  '11': 'Management',
  '13': 'Business and Financial Operations',
  '15': 'Computer and Mathematical',
  '17': 'Architecture and Engineering',
  '19': 'Life, Physical, and Social Science',
  '21': 'Community and Social Service',
  '23': 'Legal',
  '25': 'Educational Instruction and Library',
  '27': 'Arts, Design, Entertainment, Sports, and Media',
  '29': 'Healthcare Practitioners and Technical',
  '31': 'Healthcare Support',
  '33': 'Protective Service',
  '35': 'Food Preparation and Serving Related',
  '37': 'Building and Grounds Cleaning and Maintenance',
  '39': 'Personal Care and Service',
  '41': 'Sales and Related',
  '43': 'Office and Administrative Support',
  '45': 'Farming, Fishing, and Forestry',
  '47': 'Construction and Extraction',
  '49': 'Installation, Maintenance, and Repair',
  '51': 'Production',
  '53': 'Transportation and Material Moving',
  '55': 'Military Specific'
}

type ByState<T> = Record<SnapshotId, Record<Scenario, T>>

/** One of a job's skills (corners), for one blade of its tuft. */
export interface SpaceSkill {
  corner_id: string
  name: string
  /** The skill's 12-month change in AI use, a fraction; an estimate. null without a projection (fewer than 2 points). */
  growth: ByState<number | null>
  /** The skill's verdict in that future (verdictIn). */
  status: ByState<Verdict>
  /** Whether the skill's AI-use series is borrowed from a broader Malaysian row in that snapshot. */
  borrowed: Record<SnapshotId, boolean>
}

export interface SpaceJob {
  code: string
  title: string
  /** The SOC 2018 major group code, such as "15". */
  group: string
  /** The group's name, such as "Computer and Mathematical" (SOC_MAJOR_GROUPS). */
  groupName: string
  /** The O*NET Job Zone, 1 to 5: how much preparation the job needs (pathways.json). Always present. */
  zone: 1 | 2 | 3 | 4 | 5
  /**
   * The assessed role, the roles the Roles page ranks against it, or any other job. Always 'other' in Look Around.
   */
  kind: 'yours' | 'related' | 'other'
  /**
   * 0 to 100: the engine's fit.score for the session's answers, transferred to this job; an estimate. null in Look
   * Around, which has no answers.
   */
  fit: ByState<number> | null
  /**
   * As on the Roles page's cards: true when at least one of the job's levels is carried over from the answers. false
   * for the assessed job (every level answered) and for a job no answer reaches (every level "not asked yet", so its
   * fit is 0): for a job other than yours, false means no estimate. false in Look Around, which has no fit.
   */
  fitEstimated: boolean
  /**
   * The median 12-month change in AI use over the job's skills (the median, because a few skills swing far), as a fraction (0.42 is +42%); an estimate. null when no
   * skill has a projection, as in all of April, which has one dated point.
   */
  growth: ByState<number | null>
  /** How many of the job's skills get each verdict in that future (verdictIn). */
  verdicts: ByState<Record<Verdict, number>>
  /** The job's skills, in its corner order. */
  skills: SpaceSkill[]
}

export interface SpaceSnapshot {
  id: SnapshotId
  /** The manifest's label, such as "May 2026", as What Changed shows it. */
  label: string
  /** The data month, such as "2026-05-01". */
  date: string
  /** The dated releases behind the snapshot's numbers, for the citations. */
  sources: Source[]
}

export interface SpaceModel {
  /** Every job, by group, then title. */
  jobs: SpaceJob[]
  /** false in Look Around: no answers, so no fit, no assessed job and no related roles. */
  answers: boolean
  /** The assessed job's code; null in Look Around. */
  assessedCode: string | null
  snapshots: SpaceSnapshot[]
  /** The O*NET release the jobs' Job Zones come from, for their Source Reference. */
  zoneSource: Source
  /** The median of the jobs' growth; null when no job has one. */
  medianGrowth: ByState<number | null>
  /**
   * Jobs whose fit, in whole percents, differs between slow and fast, and the largest difference, in points. null in
   * Look Around, which has no fit.
   */
  moved: Record<SnapshotId, { count: number; max: number }> | null
  /**
   * The AI-use-per-head indexes that set the fast future, the same for every job: Malaysia's, Singapore's, and
   * Malaysia's in the fast future (halfway to Singapore's, FAST_CONVERGENCE), with their source and date. null when a
   * snapshot has none.
   */
  anchors: Record<
    SnapshotId,
    { mys: number; sgp: number; fastMys: number; source: string; sourceUrl: string; date: string } | null
  >
}

/** The check-up's next step for the session (startAgain): where its button goes and what it says. */
export interface CheckUpLink {
  route: string
  label: string
}

/** What the page passes the lazy-loaded scene (scene/SpaceScene.tsx). */
export interface SpaceSceneProps {
  model: SpaceModel
  scenario: Scenario
  snapshotId: SnapshotId
  onScenario: (scenario: Scenario) => void
  onSnapshot: (snapshotId: SnapshotId) => void
  /** Opens the table dialog over the scene, as the D key does. */
  show2D: () => void
  /** Reports a lost WebGL context the scene couldn't get back; the page shows the table with a note saying so. */
  onContextLost: () => void
  /** The check-up's next step, Look Around's one primary action. */
  checkUp: CheckUpLink
  /** True while the table dialog covers the scene: it stays mounted and still, drawing a frame only on a resize. */
  paused: boolean
  /** Focus the HUD's title once the scene is up, after a switch from the table dialog, whose button goes with it. */
  focusTitle: boolean
  /** Reports the job in focus, the pinned card's code, whenever it changes; null when no card is pinned. The table
   * dialog opens on that job's page. */
  onFocusChange?: (code: string | null) => void
}

const SNAPSHOTS = SnapshotIdSchema.options
const SCENARIOS = ScenarioSchema.options

const byState = <T>(value: (snapshotId: SnapshotId, scenario: Scenario) => T): ByState<T> =>
  Object.fromEntries(
    SNAPSHOTS.map((id) => [id, Object.fromEntries(SCENARIOS.map((s) => [s, value(id, s)]))])
  ) as ByState<T>

/**
 * A skill's verdict in one future: its chip, except that a Split between the two futures resolves to that future's own
 * row. A Split between job-ad sources stays Split.
 */
export const verdictIn = (verdict: CornerVerdict, scenario: Scenario): Verdict =>
  verdict.reason === 'scenarios_disagree' ? rowStatus(verdict.scenarios[scenario].row!) : verdict.status

function median(xs: number[]): number | null {
  if (!xs.length) return null
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

/** The session's check-up, for the space with answers. */
export interface SpaceCheckup {
  /** The assessed role's full file, from the session's check-up bundle. */
  role: BundleRole
  /** The codes the Roles page ranks against it: the check-up bundle's related roles. */
  relatedCodes: string[]
  /** The 12 answer slots, as the session keeps them. */
  answers: (Rating | null)[]
  startDate: string
}

export interface SpaceModelInput {
  /** Every job and the usage index anchors, from space.json. */
  space: SpaceFile
  snapshots: BundleManifest['snapshots']
  /** pathways.json, for each job's O*NET Job Zone and its source. */
  pathways: BundlePathways
  /** null in Look Around, which has no answers. */
  checkup: SpaceCheckup | null
}

/**
 * The space for a set of answers: one check-up per snapshot and future, ranking every job at once. Look Around has no
 * answers, so it runs no check-up.
 */
export function spaceModel({ space, snapshots, pathways, checkup }: SpaceModelInput): SpaceModel {
  const role = checkup?.role ?? null
  // A space role carries every field the engine reads for a ranked role (packages/shared/src/bundle/space.ts), so it
  // stands in for a full one; the assessed role is always the full file.
  const roles = space.roles.map((job) =>
    role && job.onet_code === role.onet_code ? role : (job as unknown as BundleRole)
  )
  const ranked = roles.filter((r) => r !== role)
  // Fit and levels don't read the weekly hours or the profile; only the roadmap, which the space doesn't show, does.
  const fits =
    checkup &&
    byState((snapshotId, scenario) => {
      const result = computeCheckup({
        role: checkup.role,
        related: ranked,
        answers: checkup.answers,
        snapshotId,
        scenario,
        weeklyHours: null,
        startDate: checkup.startDate
      })
      return new Map(
        result.roles.map((r) => [r.onet_code, { score: r.fit.score, estimated: r.levels.some(isEstimatedLevel) }])
      )
    })

  const related = new Set(checkup?.relatedCodes)
  const jobs = space.roles
    .map((job, i): SpaceJob => {
      const zone = pathways.occupations[job.onet_code]?.job_zone
      if (!zone) throw new Error(`pathways.json has no O*NET Job Zone for ${job.onet_code}.`)
      const verdicts = Object.fromEntries(
        SNAPSHOTS.map((id) => [id, roleVerdicts(roles[i]!.signals[id]).corners])
      ) as Record<SnapshotId, CornerVerdict[]>
      const skills = roles[i]!.corners.map((corner): SpaceSkill => {
        const verdict = (id: SnapshotId) => verdicts[id].find((v) => v.corner_id === corner.corner_id)!
        const signals = (id: SnapshotId) => job.signals[id].corners.find((c) => c.corner_id === corner.corner_id)
        return {
          corner_id: corner.corner_id,
          name: corner.name,
          growth: byState((id, s) => verdict(id).scenarios[s].projection?.change ?? null),
          status: byState((id, s) => verdictIn(verdict(id), s)),
          borrowed: Object.fromEntries(SNAPSHOTS.map((id) => [id, Boolean(signals(id)?.ai_usage.borrowed)])) as Record<
            SnapshotId,
            boolean
          >
        }
      })
      return {
        code: job.onet_code,
        title: job.title,
        group: job.group,
        groupName: SOC_MAJOR_GROUPS[job.group] ?? job.group,
        zone: zone as SpaceJob['zone'],
        kind: job.onet_code === role?.onet_code ? 'yours' : related.has(job.onet_code) ? 'related' : 'other',
        fit: fits && byState((id, s) => fits[id][s].get(job.onet_code)!.score),
        // Levels carry over the same way in every snapshot and future.
        fitEstimated: fits?.[DEFAULT_SNAPSHOT][DEFAULT_SCENARIO].get(job.onet_code)!.estimated ?? false,
        growth: byState((id, s) => median(skills.flatMap((skill) => skill.growth[id][s] ?? []))),
        verdicts: byState(
          (id, s) =>
            Object.fromEntries(
              VerdictSchema.options.map((status) => [
                status,
                skills.filter((skill) => skill.status[id][s] === status).length
              ])
            ) as Record<Verdict, number>
        ),
        skills
      }
    })
    .sort((a, b) => a.group.localeCompare(b.group) || a.title.localeCompare(b.title))

  return {
    jobs,
    answers: checkup !== null,
    assessedCode: role?.onet_code ?? null,
    snapshots: snapshots.map((s) => ({ id: s.snapshot_id, label: s.label, date: s.data_month, sources: s.sources })),
    zoneSource: pathways.sources.onet,
    medianGrowth: byState((id, s) => median(jobs.flatMap((job) => job.growth[id][s] ?? []))),
    moved:
      fits &&
      (Object.fromEntries(
        SNAPSHOTS.map((id) => {
          // In whole percents, as the table and the Roles page show fit, so every count can be checked there.
          const shifts = jobs.map((job) => Math.abs(Math.round(job.fit![id].fast) - Math.round(job.fit![id].slow)))
          return [id, { count: shifts.filter((d) => d >= 1).length, max: Math.max(0, ...shifts) }]
        })
      ) as NonNullable<SpaceModel['moved']>),
    anchors: Object.fromEntries(
      SNAPSHOTS.map((id) => {
        const anchors = space.anchors[id]
        if (!anchors) return [id, null]
        const { mys, sgp } = anchors
        return [
          id,
          {
            mys: mys.value,
            sgp: sgp.value,
            fastMys: mys.value + FAST_CONVERGENCE * (sgp.value - mys.value),
            source: mys.source_name,
            sourceUrl: mys.source_url,
            date: mys.vintage_date
          }
        ]
      })
    ) as SpaceModel['anchors']
  }
}
