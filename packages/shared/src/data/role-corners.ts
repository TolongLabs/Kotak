import { z } from 'zod'
import { OnetAttributionSchema, OnetIwaIdSchema, OnetSocCodeSchema, OnetTaskIdSchema, onetCredit } from './onet'

// Batch output in `data/generated/role-corners.json` (#74, #77, #79). AI groups an occupation's own O*NET tasks
// into corners and drafts the text; it sets no level, target or verdict. Checking that every task ID and IWA
// belongs to the occupation needs the O*NET files, so the #74 post-validator does it, not these schemas.

export const RoleQualitySchema = z.enum(['auto-generated', 'human-checked'])

/** A UN SDG target, such as `4.4`, `8.5` or `4.a`. */
export const SdgTargetSchema = z.string().regex(/^(?:[1-9]|1[0-7])\.(?:[1-9]\d?|[a-z])$/)

/** Can-do statements; the check-up asks `basic` and `advanced`, each on a 1 to 4 scale. */
export const CanDoStatementsSchema = z
  .object({ basic: z.string().min(1), working: z.string().min(1), advanced: z.string().min(1) })
  .strict()
  .refine((s) => new Set([s.basic, s.working, s.advanced]).size === 3, 'the three statements must differ')

/** Optional reversed wording (agreeing means less skill) for the `basic` and `advanced` statements; shown in the reversed question slots. */
export const ReversedStatementsSchema = z
  .object({ basic: z.string().min(1).optional(), advanced: z.string().min(1).optional() })
  .strict()

/** AI-drafted hours to reach each statement from the level below it. Estimates, never shown as data. */
export const MilestoneHoursSchema = z
  .object({ basic: z.number().positive(), working: z.number().positive(), advanced: z.number().positive() })
  .strict()

/** A free resource. `search` is a search link for unchecked roles; `verified` is true once a person has checked it. */
export const FreeResourceSchema = z
  .object({
    title: z.string().min(1),
    url: z.url({ protocol: /^https$/ }),
    kind: z.enum(['guide', 'video', 'community', 'programme', 'search']),
    verified: z.boolean()
  })
  .strict()

export const RoleCornerSchema = z
  .object({
    corner_id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    /** This corner's own O*NET task IDs; a task belongs to one corner only. */
    task_ids: z.array(OnetTaskIdSchema).min(1),
    /** The IWAs of `task_ids` that the corner covers. */
    iwa_ids: z.array(OnetIwaIdSchema).min(1),
    statements: CanDoStatementsSchema,
    reversed_statements: ReversedStatementsSchema.nullish(),
    hours: MilestoneHoursSchema,
    sdg_targets: z.array(SdgTargetSchema).min(1),
    resources: z.array(FreeResourceSchema).min(1)
  })
  .strict()
  .superRefine((corner, ctx) => {
    for (const key of ['task_ids', 'iwa_ids', 'sdg_targets'] as const) {
      const values = corner[key] as readonly (string | number)[]
      if (new Set(values).size !== values.length) {
        ctx.addIssue({ code: 'custom', message: `duplicate value in ${key}`, path: [key] })
      }
    }
  })

/** One occupation's corners. Fewer than 6 is allowed for occupations with too few IWA groups (#74). */
export const OccupationCornersSchema = z
  .object({
    onet_code: OnetSocCodeSchema,
    quality: RoleQualitySchema,
    generated_by: z.enum(['runpod', 'claude-batch']),
    model: z.string().min(1),
    generated_date: z.iso.date(),
    corners: z.array(RoleCornerSchema).min(1).max(6)
  })
  .strict()
  .superRefine((role, ctx) => {
    if (new Set(role.corners.map((c) => c.corner_id)).size !== role.corners.length) {
      ctx.addIssue({ code: 'custom', message: 'duplicate corner_id', path: ['corners'] })
    }
    const tasks = role.corners.flatMap((c) => c.task_ids)
    if (new Set(tasks).size !== tasks.length) {
      ctx.addIssue({ code: 'custom', message: 'a task belongs to more than one corner', path: ['corners'] })
    }
    if (role.quality === 'human-checked' && role.corners.some((c) => c.resources.some((r) => !r.verified))) {
      ctx.addIssue({ code: 'custom', message: 'human-checked roles need verified resources', path: ['quality'] })
    }
  })

/** `data/generated/role-corners.json` */
export const RoleCornersSchema = z
  .object({
    meta: z
      .object({ ...OnetAttributionSchema.shape, onet_version: z.string().regex(/^\d+\.\d+$/) })
      .strict()
      .refine((meta) => meta.credit === onetCredit(meta.onet_version), {
        message: 'credit must be the O*NET credit line naming onet_version',
        path: ['credit']
      }),
    roles: z.array(OccupationCornersSchema).min(1)
  })
  .strict()
  .refine((file) => new Set(file.roles.map((r) => r.onet_code)).size === file.roles.length, {
    message: 'duplicate onet_code',
    path: ['roles']
  })

export type RoleQuality = z.infer<typeof RoleQualitySchema>
export type SdgTarget = z.infer<typeof SdgTargetSchema>
export type CanDoStatements = z.infer<typeof CanDoStatementsSchema>
export type MilestoneHours = z.infer<typeof MilestoneHoursSchema>
export type FreeResource = z.infer<typeof FreeResourceSchema>
export type RoleCorner = z.infer<typeof RoleCornerSchema>
export type OccupationCorners = z.infer<typeof OccupationCornersSchema>
export type RoleCorners = z.infer<typeof RoleCornersSchema>
