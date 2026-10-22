import {
  BundleCornerSchema,
  BundleCreditSchema,
  BundleRelatedRoleSchema,
  BundleSnapshotSchema,
  DEFAULT_SCENARIO,
  DEFAULT_SNAPSHOT,
  FreeResourceSchema,
  GoalSchema,
  OnetSocCodeSchema,
  PREVIOUS_SNAPSHOT,
  RoadmapItemSchema,
  RoadmapSchema,
  ScenarioSchema,
  SdgTargetSchema,
  SnapshotDiffSchema,
  SnapshotIdSchema,
  SourceSchema,
  TransferLabelSchema,
  VerdictLabelSchema,
  VerdictRowSchema,
  VerdictSchema,
  WeeklyHoursSchema
} from '@kotak/shared'
import { z } from 'zod'

// The inputs and results of the `Kotak` facade (#184 "SDK layer"). The defaults are the web app's, so a tool call
// and the app agree for the same answers. Every result value comes from the rules in @kotak/shared.

// Defined in @kotak/shared, which Kopi's chat schema shares; the SDK still exports them.
export { DEFAULT_SNAPSHOT, GoalSchema }

const RoleRefSchema = z.object({ onet_code: OnetSocCodeSchema, title: z.string().min(1) }).strict()
const LevelSchema = z.number().int().min(0).max(3)

/** One corner's two answers: "can you do this?" on the working statement, then the follow-up that answer picks. */
export const CornerAnswerSchema = z
  .object({
    corner_id: z.string().min(1),
    can_do: z.boolean(),
    follow_up: z.boolean() // on the advanced statement after a yes, the basic one after a no
  })
  .strict()

const AssessmentParamsSchema = z.object({
  role_code: OnetSocCodeSchema, // the user's current job
  answers: z.array(CornerAnswerSchema), // on the assessed role's corners; unanswered corners are left out
  goal: GoalSchema.default('explore'),
  target_role_code: OnetSocCodeSchema.nullable().default(null), // with the target goal, the assessed role
  scenario: ScenarioSchema.default(DEFAULT_SCENARIO)
})

export const CheckupParamsSchema = AssessmentParamsSchema.extend({
  plan_role_code: OnetSocCodeSchema.nullable().default(null), // a ranked role to plan for; else the assessed role
  snapshot_id: SnapshotIdSchema.default(DEFAULT_SNAPSHOT),
  weekly_hours: WeeklyHoursSchema, // null: the AI dividend sets them
  start_date: z.iso.date() // the roadmap's first day; the SDK never reads the clock
}).strict()

export const WhatChangedParamsSchema = AssessmentParamsSchema.extend({
  before: SnapshotIdSchema.default(PREVIOUS_SNAPSHOT),
  after: SnapshotIdSchema.default(DEFAULT_SNAPSHOT)
}).strict()

export const ManifestSchema = z
  .object({
    default_snapshot_id: SnapshotIdSchema,
    snapshots: z.array(BundleSnapshotSchema),
    credits: z.array(BundleCreditSchema) // every source with its vintage date, licence and credit line
  })
  .strict()

export const RoleSummarySchema = z
  .object({
    ...RoleRefSchema.shape,
    description: z.string().min(1),
    questions_ready: z.boolean(), // false: no can-do statements yet, so no check-up
    corners: z.array(BundleCornerSchema.pick({ corner_id: true, name: true, statements: true })),
    related: z.array(BundleRelatedRoleSchema)
  })
  .strict()

export const QuestionsSchema = z
  .object({
    ...RoleRefSchema.shape,
    snapshot_id: SnapshotIdSchema,
    scenario: ScenarioSchema,
    /** In asking order: Rising corners first. */
    corners: z.array(
      z
        .object({
          corner_id: z.string().min(1),
          name: z.string().min(1),
          verdict: VerdictSchema,
          can_do: z.string().min(1), // asked first
          follow_up: z.object({ if_yes: z.string().min(1), if_no: z.string().min(1) }).strict()
        })
        .strict()
    )
  })
  .strict()

export const CornerReportSchema = z
  .object({
    corner_id: z.string().min(1),
    name: z.string().min(1),
    level: LevelSchema,
    level_label: TransferLabelSchema, // self-reported, estimated from other answers, or not asked yet
    target_level: z.number(), // the scenario's target, an estimate
    verdict: VerdictSchema,
    verdict_label: VerdictLabelSchema,
    row: VerdictRowSchema.nullable(), // the scenario's row of the verdict table; null when an input is missing
    /** Both scenarios when the verdict is Split, else empty. */
    futures: z.array(
      z
        .object({ scenario: ScenarioSchema, status: VerdictSchema, row: VerdictRowSchema, target_level: z.number() })
        .strict()
    ),
    reason: z.string().min(1),
    sources: z.array(SourceSchema)
  })
  .strict()

export const OutlookSchema = z.enum(['rising', 'steady', 'declining', 'unknown'])

export const RankedRoleSchema = z
  .object({
    rank: z.number().int().positive(),
    ...RoleRefSchema.shape,
    fit_score: z.number().min(0).max(100),
    fit_percent: z.number().int().min(0).max(100),
    fit_estimated: z.boolean(), // some levels are carried over from the answers, not answered on this role
    /** The two biggest gaps on the role's own corners. */
    gaps: z.array(
      z
        .object({ corner_id: z.string().min(1), name: z.string().min(1), level: LevelSchema, target_level: z.number() })
        .strict()
    ),
    outlook: OutlookSchema
  })
  .strict()

export const RoadmapStepSchema = RoadmapItemSchema.pick({
  rank: true,
  corner_id: true,
  to_level: true,
  hours: true,
  tag: true
})
  .extend({
    name: z.string().min(1),
    verdict: VerdictSchema,
    statement: z.string().min(1), // the can-do statement to reach
    weeks: z.tuple([z.number().int().positive(), z.number().int().positive()]),
    start_date: z.iso.date(),
    end_date: z.iso.date(),
    resource: FreeResourceSchema.nullable(), // the corner's first free resource
    sdg_targets: z.array(SdgTargetSchema)
  })
  .strict()

export const RoadmapReportSchema = RoadmapSchema.pick({
  weekly_hours: true,
  weekly_hours_from: true,
  total_hours: true,
  weeks: true,
  start_date: true,
  finish_date: true,
  dividend: true // the hours AI saves, to suggest as weekly hours
})
  .extend({ ...RoleRefSchema.shape, steps: z.array(RoadmapStepSchema) })
  .strict()

export const CheckupReportSchema = z
  .object({
    input: CheckupParamsSchema, // every input used, defaults included
    role: RoleRefSchema, // the assessed role
    corners: z.array(CornerReportSchema),
    roles: z.array(RankedRoleSchema), // the role and its related roles, best fit first
    roadmap: RoadmapReportSchema,
    sources: z.array(SourceSchema), // every source above, once
    unavailable: z.array(OnetSocCodeSchema) // related roles whose file failed, left out of the ranking
  })
  .strict()

export const WhatChangedReportSchema = z
  .object({
    input: WhatChangedParamsSchema,
    diff: SnapshotDiffSchema,
    unavailable: z.array(OnetSocCodeSchema)
  })
  .strict()

export type CornerAnswer = z.infer<typeof CornerAnswerSchema>
export type Goal = z.infer<typeof GoalSchema>
/** What `checkup` takes; fields with a default may be left out. */
export type CheckupParams = z.input<typeof CheckupParamsSchema>
export type WhatChangedParams = z.input<typeof WhatChangedParamsSchema>
export type Manifest = z.infer<typeof ManifestSchema>
export type RoleSummary = z.infer<typeof RoleSummarySchema>
export type Questions = z.infer<typeof QuestionsSchema>
export type CornerReport = z.infer<typeof CornerReportSchema>
export type Outlook = z.infer<typeof OutlookSchema>
export type RankedRole = z.infer<typeof RankedRoleSchema>
export type RoadmapStep = z.infer<typeof RoadmapStepSchema>
export type RoadmapReport = z.infer<typeof RoadmapReportSchema>
export type CheckupReport = z.infer<typeof CheckupReportSchema>
export type WhatChangedReport = z.infer<typeof WhatChangedReportSchema>
