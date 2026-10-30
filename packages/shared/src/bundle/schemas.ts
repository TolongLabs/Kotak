import { z } from 'zod'
import {
  Masco2020CodeSchema,
  OnetAttributionSchema,
  OnetIwaIdSchema,
  OnetRelatednessTierSchema,
  OnetSocCodeSchema,
  OnetTaskIdSchema,
  OnetTaskTypeSchema,
  onetCredit
} from '../data/onet'
import {
  CanDoStatementsSchema,
  CornerExplainersSchema,
  ReversedStatementsSchema,
  FreeResourceSchema,
  MilestoneHoursSchema,
  RoleQualitySchema,
  SdgTargetSchema
} from '../data/role-corners'
import { StatementVariantSchema } from '../data/statement-variants'
import { CornerScenariosSchema } from '../data/scenarios'
import { SnapshotIdSchema, SourceSchema, VerdictSchema } from '../engine'
import { RoleSignalsSchema, ScenarioSchema, SnapshotDiffSchema, TransferLinksSchema } from '../rules/schemas'

// The static client bundle (#88). `bun run build:data` checks every file against these schemas before writing it.
// The browser runs the engine rules on these inputs itself, so levels, verdicts, targets, fit scores and roadmap
// order are not stored here; only the demo diffs are precomputed, for the build's verdict-flip check.
//
//   /data/manifest.json       BundleManifestSchema: snapshots, source credits, demo roles and their diffs
//   /data/roles.json          BundleRoleIndexSchema: every role, for search and the role list
//   /data/roles/<code>.json   BundleRoleSchema: one occupation's corners, signals for both snapshots, related roles

const IsoDateSchema = z.iso.date()

/** The O*NET CC BY 4.0 attribution, carried by every bundle file with O*NET content. */
export const BundleOnetMetaSchema = z
  .object({ ...OnetAttributionSchema.shape, onet_version: z.string().regex(/^\d+\.\d+$/) })
  .strict()
  .refine((meta) => meta.credit === onetCredit(meta.onet_version), {
    message: 'credit must be the O*NET credit line naming onet_version',
    path: ['credit']
  })

/**
 * Where a role's corners came from: the AI batch with can-do statements (#77), else the deterministic task groups
 * in `data/generated/corner-groups.json` (#74). Only `batch` corners have statements and hours.
 */
export const BundleCornerSourceSchema = z.enum(['batch', 'corner-groups'])

export const BundleCornerSchema = z
  .object({
    corner_id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    task_ids: z.array(OnetTaskIdSchema).min(1),
    iwa_ids: z.array(OnetIwaIdSchema).min(1),
    /** null until the batch writes them; the build never makes them up. */
    statements: CanDoStatementsSchema.nullable(),
    reversed_statements: ReversedStatementsSchema.nullish(),
    /** Optional experienced wording for roles that still use statement questions. */
    statement_variants: StatementVariantSchema.optional(),
    explainers: CornerExplainersSchema.optional(),
    /** "What would you do" questions (#352); the check-up asks them only when every corner has both. */
    scenarios: CornerScenariosSchema.optional(),
    hours: MilestoneHoursSchema.nullable(),
    sdg_targets: z.array(SdgTargetSchema),
    resources: z.array(FreeResourceSchema)
  })
  .strict()

/** An O*NET task statement in one of the role's corners. */
export const BundleTaskSchema = z
  .object({ task_id: OnetTaskIdSchema, statement: z.string().min(1), task_type: OnetTaskTypeSchema.nullable() })
  .strict()

/** One link from O*NET's related-occupations list, in O*NET's order; the role has its own bundle file. */
export const BundleRelatedRoleSchema = z
  .object({
    onet_code: OnetSocCodeSchema,
    title: z.string().min(1),
    tier: OnetRelatednessTierSchema,
    index: z.number().int().positive()
  })
  .strict()

/** `/data/roles/<onet_code>.json` */
export const BundleRoleSchema = z
  .object({
    meta: BundleOnetMetaSchema,
    onet_code: OnetSocCodeSchema,
    title: z.string().min(1),
    description: z.string().min(1),
    masco_2020: Masco2020CodeSchema.nullable(),
    masco_unmatched: z.boolean(),
    quality: RoleQualitySchema,
    corners_source: BundleCornerSourceSchema,
    /** false: the corners have no can-do statements yet, so the UI shows "questions not generated yet". */
    questions_ready: z.boolean(),
    /** Who wrote the statements, for `batch` corners only. */
    generated: z
      .object({
        generated_by: z.enum(['runpod', 'claude-batch']),
        model: z.string().min(1),
        generated_date: IsoDateSchema
      })
      .strict()
      .nullable(),
    corners: z.array(BundleCornerSchema).min(1).max(6),
    tasks: z.array(BundleTaskSchema).min(1),
    /** The transfer links of this role's tasks; merge them with the matched roles' links (see `engineInputs`). */
    links: TransferLinksSchema,
    related: z.array(BundleRelatedRoleSchema),
    /**
     * Software and tools employers name for the role (#284), from O*NET's Hot Technologies: the In Demand ones, or
     * without any, the first 12, in O*NET's alphabetical order.
     */
    tools: z
      .array(z.object({ name: z.string().min(1), in_demand: z.boolean() }).strict())
      .max(40)
      .default([]),
    /** The engine inputs per snapshot: 2026-04 holds April's data, 2026-05 April's and May's. */
    signals: z.record(SnapshotIdSchema, RoleSignalsSchema)
  })
  .strict()
  .superRefine((role, ctx) => {
    const issue = (message: string, path: PropertyKey[]) => ctx.addIssue({ code: 'custom', message, path })
    const ready = role.corners.every((c) => c.statements !== null && c.hours !== null)
    if (role.questions_ready !== ready)
      issue('must be true exactly when every corner has statements and hours', ['questions_ready'])
    if ((role.corners_source === 'batch') !== (role.generated !== null))
      issue('only batch corners name a generator', ['generated'])
    if (role.corners_source !== 'batch' && role.corners.some((c) => c.statements !== null)) {
      issue('only batch corners have statements', ['corners'])
    }
    if (role.quality === 'human-checked' && role.corners_source !== 'batch') issue('needs batch corners', ['quality'])
    const taskIds = role.corners.flatMap((c) => c.task_ids)
    if (role.tasks.map((t) => t.task_id).join() !== taskIds.join())
      issue('must list the corners’ tasks in order', ['tasks'])
    const cornerIds = role.corners.map((c) => c.corner_id).join()
    for (const id of SnapshotIdSchema.options) {
      const signals = role.signals[id]
      if (signals.snapshot_id !== id || signals.onet_code !== role.onet_code)
        issue('wrong snapshot or role', ['signals', id])
      if (signals.corners.map((c) => c.corner_id).join() !== cornerIds)
        issue('must follow the corners', ['signals', id])
    }
  })

export const BundleRoleIndexEntrySchema = z
  .object({
    onet_code: OnetSocCodeSchema,
    title: z.string().min(1),
    quality: RoleQualitySchema,
    questions_ready: z.boolean()
  })
  .strict()

/** `/data/roles.json`: every role with a bundle file, by O*NET code. Alternate-title search stays in the API (#43). */
export const BundleRoleIndexSchema = z
  .object({ meta: BundleOnetMetaSchema, roles: z.array(BundleRoleIndexEntrySchema).min(1) })
  .strict()
  .refine((index) => new Set(index.roles.map((r) => r.onet_code)).size === index.roles.length, {
    message: 'duplicate onet_code',
    path: ['roles']
  })

/** A source's credit line, shown wherever its figures appear. */
export const BundleCreditSchema = z
  .object({
    source_name: z.string().min(1),
    source_url: z.url(),
    vintage_date: IsoDateSchema,
    licence: z.string().min(1),
    credit: z.string().min(1)
  })
  .strict()

export const BundleSnapshotSchema = z
  .object({
    snapshot_id: SnapshotIdSchema,
    label: z.string().min(1),
    data_month: IsoDateSchema,
    /** The dated releases behind this snapshot's signals. */
    sources: z.array(SourceSchema).min(1)
  })
  .strict()

/** One entry of `data/demo-roles.json`, the hand-picked live-demo cases. */
export const DemoRoleSchema = z
  .object({
    onet_code: OnetSocCodeSchema,
    persona: z.string().min(1),
    why: z.string().min(1),
    /** Synthetic answers for the precomputed diff: this level on every corner of the role. */
    sample_level: z.number().int().min(0).max(3)
  })
  .strict()

/** `data/demo-roles.json` */
export const DemoRolesFileSchema = z
  .object({ roles: z.array(DemoRoleSchema).min(2).max(3) })
  .strict()
  .refine((file) => new Set(file.roles.map((r) => r.onet_code)).size === file.roles.length, {
    message: 'duplicate onet_code',
    path: ['roles']
  })

export const BundleDemoRoleSchema = z
  .object({
    ...DemoRoleSchema.shape,
    title: z.string().min(1),
    corners_source: BundleCornerSourceSchema,
    /** The roles ranked in `diff`, the demo role first. */
    matched: z.array(OnetSocCodeSchema).min(1),
    /** The selection criteria, as the build found them. */
    checks: z
      .object({
        corners: z.number().int().positive(),
        malaysian_detailed_corners: z.number().int().nonnegative(), // AI use from MYS task, DWA, IWA or occupation rows
        may_statuses: z.array(VerdictSchema).min(1),
        ranking_moved: z.boolean()
      })
      .strict(),
    /** April to May for `sample_level` answers; the build fails unless it flips a verdict and reorders the roadmap. */
    diff: SnapshotDiffSchema
  })
  .strict()

/** `/data/manifest.json` */
export const BundleManifestSchema = z
  .object({
    meta: BundleOnetMetaSchema,
    default_snapshot_id: SnapshotIdSchema,
    snapshots: z.array(BundleSnapshotSchema).length(SnapshotIdSchema.options.length),
    credits: z.array(BundleCreditSchema).min(1),
    /** Sources not ingested yet; the engine skipped their layer or fallback step for every role. */
    missing: z.array(z.string().min(1)),
    /** How many roles take their corners from each source. */
    corners: z.record(BundleCornerSourceSchema, z.number().int().nonnegative()),
    demo: z
      .object({
        scenario: ScenarioSchema,
        roles: z.array(BundleDemoRoleSchema).min(1),
        /** Occupations where slow and fast give different May verdicts on a corner (Split from the scenarios). */
        scenario_splits: z.array(
          z
            .object({ onet_code: OnetSocCodeSchema, title: z.string().min(1), corner_ids: z.array(z.string()).min(1) })
            .strict()
        )
      })
      .strict()
  })
  .strict()

export type BundleOnetMeta = z.infer<typeof BundleOnetMetaSchema>
export type BundleCornerSource = z.infer<typeof BundleCornerSourceSchema>
export type BundleCorner = z.infer<typeof BundleCornerSchema>
export type BundleTask = z.infer<typeof BundleTaskSchema>
export type BundleRelatedRole = z.infer<typeof BundleRelatedRoleSchema>
export type BundleRole = z.infer<typeof BundleRoleSchema>
export type BundleRoleIndexEntry = z.infer<typeof BundleRoleIndexEntrySchema>
export type BundleRoleIndex = z.infer<typeof BundleRoleIndexSchema>
export type BundleCredit = z.infer<typeof BundleCreditSchema>
export type BundleSnapshot = z.infer<typeof BundleSnapshotSchema>
export type DemoRole = z.infer<typeof DemoRoleSchema>
export type DemoRolesFile = z.infer<typeof DemoRolesFileSchema>
export type BundleDemoRole = z.infer<typeof BundleDemoRoleSchema>
export type BundleManifest = z.infer<typeof BundleManifestSchema>
