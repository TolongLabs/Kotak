import { z } from 'zod'

export const VerdictSchema = z.enum(['Rising', 'Steady', 'Declining', 'Split', 'Unknown'])

export const SnapshotIdSchema = z.enum(['2026-04', '2026-05'])

export const SourceSchema = z
  .object({
    source_name: z.string().min(1),
    source_url: z.string().url(),
    vintage_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    geo_or_layer: z.string().min(1)
  })
  .strict()

export const SignalSchema = z
  .object({
    metric: z.string().min(1),
    value: z.number().nullable(),
    source_name: z.string().min(1),
    source_url: z.string().url(),
    vintage_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    geo_or_layer: z.string().min(1),
    is_estimate: z.boolean().optional()
  })
  .strict()

export const OccupationSchema = z
  .object({
    onet_code: z.string().min(1),
    title: z.string().min(1),
    masco_unmatched: z.boolean().optional()
  })
  .strict()

const UserLevelSchema = z.number().int().min(0).max(3)
const TargetLevelSchema = z.number().min(1).max(3)

export const EngineCornerSchema = z
  .object({
    corner_id: z.string().min(1),
    name: z.string().min(1),
    levels: z
      .object({
        self_reported: UserLevelSchema,
        slow_target: TargetLevelSchema,
        fast_target: TargetLevelSchema
      })
      .strict(),
    signals: z.array(SignalSchema).min(1),
    verdict: VerdictSchema
  })
  .strict()

export const EngineSnapshotSchema = z
  .object({
    snapshot_id: SnapshotIdSchema,
    is_sample: z.boolean(),
    occupation: OccupationSchema,
    corners: z.array(EngineCornerSchema).length(6),
    sources: z.array(SourceSchema).min(2)
  })
  .strict()

export type Verdict = z.infer<typeof VerdictSchema>
export type SnapshotId = z.infer<typeof SnapshotIdSchema>
export type Source = z.infer<typeof SourceSchema>
export type Signal = z.infer<typeof SignalSchema>
export type Occupation = z.infer<typeof OccupationSchema>
export type EngineCorner = z.infer<typeof EngineCornerSchema>
export type EngineSnapshot = z.infer<typeof EngineSnapshotSchema>
