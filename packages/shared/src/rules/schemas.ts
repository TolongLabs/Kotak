import { z } from 'zod'
import { MilestoneHoursSchema } from '../data/role-corners'
import { TrendDirectionSchema } from '../data/sources'
import { SignalSchema, SnapshotIdSchema, SourceSchema, VerdictSchema } from '../engine'
import { LESS_IMPORTANT_TAG } from './constants'
import { PACE_MAX, PACE_MIN } from './pace'

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
// 0 to 3 in steps of 0.5 for a corner the user rated; a transferred estimate is rounded down to a whole level.
const UserLevelSchema = z.number().min(0).max(3)
const TargetLevelSchema = z.number().min(1).max(3)
const FallbackLabelSchema = z.string().min(1).nullable()
const TaskIdSchema = z.union([z.string().min(1), z.number().int().nonnegative()])
const StatementSchema = z.enum(['basic', 'working', 'advanced'])

export const ScenarioSchema = z.enum(['slow', 'fast'])

// Engine inputs, one role in one snapshot. The hierarchy resolver (#71) fills them from any source.

/** One AI-usage reading for a corner, dated by its vintage_date (the data month), such as the usage share of its tasks. */
export const AiUsagePointSchema = SourceSchema.extend({
  value: z.number().nonnegative().nullable() // null when the source suppressed or did not publish the cell
}).strict()

export const AiUsageSeriesSchema = z
  .object({
    points: z.array(AiUsagePointSchema),
    fallback_label: FallbackLabelSchema // set when a higher layer or a GLOBAL row was borrowed
  })
  .strict()

/** How AI is used on the corner: the Economic Index automation and augmentation buckets, in percent. */
export const CornerCollaborationSchema = SourceSchema.extend({
  automation_pct: z.number().min(0).max(100),
  augmentation_pct: z.number().min(0).max(100),
  fallback_label: FallbackLabelSchema
}).strict()

/** One demand direction for the corner's role, from one step of the demand fallback. */
export const CornerDemandReadingSchema = SourceSchema.extend({
  direction: TrendDirectionSchema.exclude(['unknown']),
  fallback_label: FallbackLabelSchema
}).strict()

/** Time a person takes on the corner's tasks without and with AI, both in hours. Feeds the AI dividend. */
export const CornerTimeSavingSchema = SourceSchema.extend({
  human_hours: z.number().positive(),
  with_ai_hours: z.number().nonnegative(),
  fallback_label: FallbackLabelSchema
}).strict()

export const CornerSignalsSchema = z
  .object({
    corner_id: z.string().min(1),
    ai_usage: AiUsageSeriesSchema,
    collaboration: CornerCollaborationSchema.nullable(),
    demand: z.array(CornerDemandReadingSchema), // in fallback order; the first is used; empty means Unknown
    time_saving: CornerTimeSavingSchema.nullable().optional() // for the roadmap's AI dividend
  })
  .strict()

/** National usage-per-capita indexes that anchor the fast scenario. */
export const UsageAnchorsSchema = z
  .object({
    mys: SourceSchema.extend({ value: z.number().positive() }).strict(),
    sgp: SourceSchema.extend({ value: z.number().positive() }).strict()
  })
  .strict()

/** Context signals for the layers at and above the role. Shown beside the verdicts; they never set one. */
export const RoleContextSchema = z
  .object({
    sector: z.array(SignalSchema), // L1: DOSM QES, OpenDOSM employment_sector
    occupation_group: z.array(SignalSchema), // L2: Economic Index major group, OpenDOSM wages_occupation
    role: z.array(SignalSchema), // L3: Economic Index detailed occupation
    ai_advancement: z.array(SignalSchema), // Epoch AI
    missing: z.array(z.string().min(1)) // inputs not loaded, so their layer or fallback step was skipped
  })
  .strict()

export const RoleSignalsSchema = z
  .object({
    snapshot_id: SnapshotIdSchema,
    onet_code: z.string().min(1),
    anchors: UsageAnchorsSchema,
    corners: z.array(CornerSignalsSchema).min(1).max(6),
    context: RoleContextSchema.optional()
  })
  .strict()

// Verdict outputs (#81)

const VERDICT_ROWS = [
  'Rising: AI helps it scale',
  'Declining because of AI',
  "Rising: AI can't do it yet",
  'Steady',
  'Declining for other reasons'
] as const

export const VerdictRowSchema = z.enum(VERDICT_ROWS)
export const VerdictLabelSchema = z.enum([...VERDICT_ROWS, 'Split', 'Unknown'])

export const AiProjectionSchema = z
  .object({
    latest_date: DateSchema,
    latest_value: z.number().nonnegative(),
    slope_per_month: z.number(), // observed pace, least squares over the dated points
    growth_multiplier: z.number().min(1), // 1 for slow; fast's convergence factor
    projected_to: DateSchema,
    projected_value: z.number().nonnegative(),
    change: z.number().min(-1), // relative change over the horizon
    is_estimate: z.literal(true)
  })
  .strict()

export const TargetBreakdownSchema = z
  .object({
    value: TargetLevelSchema,
    ai_effect: z.number().min(-1).max(1),
    demand_effect: z.number().min(-0.5).max(0.5),
    is_estimate: z.literal(true)
  })
  .strict()

export const ScenarioOutcomeSchema = z
  .object({
    scenario: ScenarioSchema,
    projection: AiProjectionSchema.nullable(), // null with fewer than 2 dated points
    ai_trend: z.enum(['rising', 'not_rising', 'unknown']),
    collaboration_mode: z.enum(['augmentation', 'automation', 'unknown']),
    demand: TrendDirectionSchema,
    row: VerdictRowSchema.nullable(), // this scenario's row of the verdict table; null when an input is missing
    target: TargetBreakdownSchema
  })
  .strict()

/** One of the two futures of a Split corner. */
export const VerdictFutureSchema = z
  .object({
    scenario: ScenarioSchema,
    demand_source: SourceSchema.nullable(),
    row: VerdictRowSchema,
    status: VerdictSchema,
    target: TargetBreakdownSchema
  })
  .strict()

export const CornerVerdictSchema = z
  .object({
    corner_id: z.string().min(1),
    status: VerdictSchema, // the chip
    label: VerdictLabelSchema, // the verdict: the row both scenarios agree on, or Split, or Unknown
    reason: z.enum([
      'table',
      'scenarios_disagree',
      'sources_disagree',
      'too_few_points',
      'no_collaboration_split',
      'no_demand'
    ]),
    scenarios: z.object({ slow: ScenarioOutcomeSchema, fast: ScenarioOutcomeSchema }).strict(),
    futures: z.array(VerdictFutureSchema), // both futures when Split, else empty
    sources: z.array(SourceSchema),
    fallback_labels: z.array(z.string().min(1))
  })
  .strict()
  .refine((c) => c.futures.length === (c.status === 'Split' ? 2 : 0), {
    message: 'A Split corner has exactly 2 futures; any other corner has none'
  })

export const RoleVerdictsSchema = z
  .object({
    snapshot_id: SnapshotIdSchema,
    onet_code: z.string().min(1),
    default_scenario: ScenarioSchema,
    corners: z.array(CornerVerdictSchema).min(1).max(6)
  })
  .strict()

// Scoring outputs (#83)

export const FitScoreSchema = z
  .object({
    score: z.number().min(0).max(100),
    numerator: z.number().nonnegative(),
    denominator: z.number().positive(),
    terms: z.array(
      z
        .object({
          corner_id: z.string().min(1),
          user_level: UserLevelSchema,
          target_level: TargetLevelSchema,
          term: z.number().nonnegative() // min(user_level, target_level)
        })
        .strict()
    ),
    is_estimate: z.literal(true) // targets are projections
  })
  .strict()

// Transfer of answered levels to related roles (#83). The narrow O*NET shape the transfer needs.

/** A role's corners with the O*NET task IDs grouped into each. */
export const TransferRoleSchema = z
  .object({
    onet_code: z.string().min(1),
    corners: z.array(z.object({ corner_id: z.string().min(1), task_ids: z.array(TaskIdSchema) }).strict())
  })
  .strict()

/** A corner the user answered directly, on any role. */
export const TransferAnswerSchema = z
  .object({
    onet_code: z.string().min(1),
    corner_id: z.string().min(1),
    level: UserLevelSchema,
    task_ids: z.array(TaskIdSchema)
  })
  .strict()

export const TransferLinksSchema = z
  .object({
    task_iwas: z.record(z.string(), z.array(z.string().min(1))), // task ID to the IWA of each of its task-to-DWA links, repeats kept
    iwa_broad: z.record(z.string(), z.string().min(1)), // IWA ID to its broad (generalized) work activity element ID
    task_dwas: z.record(z.string(), z.array(z.string().min(1))).optional() // task ID to its DWA IDs; the resolver's DWA level
  })
  .strict()

export const TransferLabelSchema = z.enum([
  'self-reported',
  'estimated from your answers',
  'rough estimate',
  'not asked yet'
])

export const TransferredLevelSchema = z
  .object({
    onet_code: z.string().min(1),
    corner_id: z.string().min(1),
    level: UserLevelSchema,
    label: TransferLabelSchema,
    basis: z
      .object({
        task_links: z.number().int().nonnegative(),
        iwa_links: z.number().int().nonnegative(), // links sharing an IWA with an answered corner
        broad_links: z.number().int().nonnegative(), // links sharing only a broad work activity
        weighted_level: z.number().min(0).max(3).nullable(), // before rounding down
        from: z.array(
          z
            .object({
              onet_code: z.string().min(1),
              corner_id: z.string().min(1),
              level: UserLevelSchema,
              shared_links: z.number().int().positive()
            })
            .strict()
        )
      })
      .strict()
  })
  .strict()

// Gaps and roadmap outputs (#83)

export const RoadmapCornerSchema = z
  .object({
    corner_id: z.string().min(1),
    user_level: UserLevelSchema,
    milestone_hours: MilestoneHoursSchema,
    time_saving: CornerTimeSavingSchema.nullable()
  })
  .strict()

export const CornerGapSchema = z
  .object({
    corner_id: z.string().min(1),
    status: VerdictSchema,
    user_level: UserLevelSchema,
    target_level: TargetLevelSchema,
    size: z.number().positive()
  })
  .strict()

export const RoadmapItemSchema = z
  .object({
    rank: z.number().int().positive(),
    corner_id: z.string().min(1),
    status: VerdictSchema,
    tier: z.enum(['rising', 'middle', 'declining']),
    gap_size: z.number().positive(),
    to_level: z.number().int().min(1).max(3),
    statement: StatementSchema,
    hours: z.number().positive(),
    tag: z.literal(LESS_IMPORTANT_TAG).nullable(),
    is_estimate: z.literal(true) // hours are AI-drafted estimates
  })
  .strict()

export const AiDividendSchema = z
  .object({
    share: z.number().min(0).max(1),
    weekly_hours_saved: z.number().nonnegative(),
    default_weekly_hours: z.number().positive(),
    corners: z.array(
      z
        .object({
          corner_id: z.string().min(1),
          weekly_hours: z.number().nonnegative(),
          saved_fraction: z.number().min(0).max(1),
          weekly_hours_saved: z.number().nonnegative()
        })
        .strict()
    ),
    sources: z.array(SourceSchema),
    is_estimate: z.literal(true)
  })
  .strict()

export const PaceInputSchema = z
  .object({ label: z.string().min(1), value: z.string().min(1), factor: z.number().positive() })
  .strict()

/** The refresher step a returning worker starts with (#356). Its id is never a corner id. */
export const RefresherStepSchema = z
  .object({
    id: z.literal('refresher'),
    hours: z.number().positive(),
    weeks: z.tuple([z.number().int().positive(), z.number().int().positive()]),
    title: z.string().min(1),
    description: z.string().min(1)
  })
  .strict()

/** The personal pace (#356): a stated estimate from situation, years of work and qualification. */
export const PaceSchema = z
  .object({
    factor: z.number().min(PACE_MIN).max(PACE_MAX),
    inputs: z.array(PaceInputSchema).length(3),
    note: z.string().min(1),
    maths: z.array(z.string().min(1)),
    refresher: RefresherStepSchema.nullable()
  })
  .strict()

export const RoadmapSchema = z
  .object({
    scenario: ScenarioSchema,
    gaps: z.array(CornerGapSchema),
    items: z.array(RoadmapItemSchema),
    pace: PaceSchema,
    total_hours: z.number().nonnegative(),
    dividend: AiDividendSchema,
    weekly_hours: z.number().positive(),
    weekly_hours_from: z.enum(['ai_dividend', 'minimum', 'user']),
    weeks: z.number().nonnegative(),
    start_date: DateSchema,
    finish_date: DateSchema,
    is_estimate: z.literal(true)
  })
  .strict()

// What Changed diff (#86)

/** The engine inputs for one snapshot: the user's role and every role it is ranked against. */
export const SnapshotSignalsSchema = z
  .object({ snapshot_id: SnapshotIdSchema, roles: z.array(RoleSignalsSchema).min(1) })
  .strict()

const SnapshotRefSchema = z.object({ snapshot_id: SnapshotIdSchema, data_month: DateSchema }).strict()
const DiffSnapshotsSchema = z.object({ before: SnapshotRefSchema, after: SnapshotRefSchema }).strict()
const DiffSourcesSchema = z
  .object({ before: z.array(SourceSchema).min(1), after: z.array(SourceSchema).min(1) })
  .strict()

export const CornerStateSchema = z
  .object({
    status: VerdictSchema,
    label: VerdictLabelSchema,
    target: TargetLevelSchema,
    ai_usage: z.number().nonnegative().nullable(), // latest published value
    ai_change: z.number().nullable(), // projected change; null with fewer than 2 dated points
    roadmap_rank: z.number().int().positive().nullable() // the corner's place in the roadmap; null with no gap
  })
  .strict()

export const CornerDiffItemSchema = z
  .object({
    kind: z.literal('corner'),
    corner_id: z.string().min(1),
    name: z.string().min(1),
    changes: z.array(z.enum(['verdict', 'target', 'ai_use', 'roadmap'])).min(1),
    before: CornerStateSchema,
    after: CornerStateSchema,
    sources: DiffSourcesSchema,
    snapshots: DiffSnapshotsSchema
  })
  .strict()

export const RoleStateSchema = z
  .object({ fit_score: z.number().min(0).max(100), rank: z.number().int().positive() })
  .strict()

export const RoleDiffItemSchema = z
  .object({
    kind: z.literal('role'),
    onet_code: z.string().min(1),
    title: z.string().min(1),
    changes: z.array(z.enum(['fit_score', 'rank'])).min(1),
    before: RoleStateSchema,
    after: RoleStateSchema,
    sources: DiffSourcesSchema,
    snapshots: DiffSnapshotsSchema
  })
  .strict()

export const SnapshotDiffSchema = z
  .object({
    onet_code: z.string().min(1),
    scenario: ScenarioSchema,
    snapshots: DiffSnapshotsSchema,
    corners: z.array(CornerDiffItemSchema),
    roles: z.array(RoleDiffItemSchema),
    verdict_flips: z.number().int().nonnegative(),
    roadmap_reordered: z.boolean(),
    roles_reordered: z.boolean()
  })
  .strict()

export type Scenario = z.infer<typeof ScenarioSchema>
export type AiUsagePoint = z.infer<typeof AiUsagePointSchema>
export type AiUsageSeries = z.infer<typeof AiUsageSeriesSchema>
export type CornerCollaboration = z.infer<typeof CornerCollaborationSchema>
export type CornerDemandReading = z.infer<typeof CornerDemandReadingSchema>
export type CornerTimeSaving = z.infer<typeof CornerTimeSavingSchema>
export type CornerSignals = z.infer<typeof CornerSignalsSchema>
export type UsageAnchors = z.infer<typeof UsageAnchorsSchema>
export type RoleContext = z.infer<typeof RoleContextSchema>
export type RoleSignals = z.infer<typeof RoleSignalsSchema>
export type VerdictRow = z.infer<typeof VerdictRowSchema>
export type VerdictLabel = z.infer<typeof VerdictLabelSchema>
export type DemandState = z.infer<typeof TrendDirectionSchema>
export type AiProjection = z.infer<typeof AiProjectionSchema>
export type TargetBreakdown = z.infer<typeof TargetBreakdownSchema>
export type ScenarioOutcome = z.infer<typeof ScenarioOutcomeSchema>
export type VerdictFuture = z.infer<typeof VerdictFutureSchema>
export type CornerVerdict = z.infer<typeof CornerVerdictSchema>
export type RoleVerdicts = z.infer<typeof RoleVerdictsSchema>
export type FitScore = z.infer<typeof FitScoreSchema>
export type TransferRole = z.infer<typeof TransferRoleSchema>
export type TransferAnswer = z.infer<typeof TransferAnswerSchema>
export type TransferLinks = z.infer<typeof TransferLinksSchema>
export type TransferLabel = z.infer<typeof TransferLabelSchema>
export type TransferredLevel = z.infer<typeof TransferredLevelSchema>
export type MilestoneStatement = z.infer<typeof StatementSchema>
export type RoadmapCorner = z.infer<typeof RoadmapCornerSchema>
export type CornerGap = z.infer<typeof CornerGapSchema>
export type RoadmapItem = z.infer<typeof RoadmapItemSchema>
export type AiDividend = z.infer<typeof AiDividendSchema>
export type PaceInput = z.infer<typeof PaceInputSchema>
export type RefresherStep = z.infer<typeof RefresherStepSchema>
export type Pace = z.infer<typeof PaceSchema>
export type Roadmap = z.infer<typeof RoadmapSchema>
export type SnapshotSignals = z.infer<typeof SnapshotSignalsSchema>
export type CornerState = z.infer<typeof CornerStateSchema>
export type CornerDiffItem = z.infer<typeof CornerDiffItemSchema>
export type RoleState = z.infer<typeof RoleStateSchema>
export type RoleDiffItem = z.infer<typeof RoleDiffItemSchema>
export type SnapshotDiff = z.infer<typeof SnapshotDiffSchema>
