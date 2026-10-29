import { z } from 'zod'
import { SDG_TARGETS } from '../corners/sdg-targets'
import { RoleQualitySchema, SdgTargetSchema } from './role-corners'

// The fixed SDG table (#391) in `data/sdg-reasons.json`: for each UN SDG target a skill corner is tagged with, the
// UN's official target text and one plain-English reason why building such a skill contributes to it. Written by
// hand once and reviewed against the UN text, never by a model at run time. build:data fails when a corner's target
// has no row.

const REAL_TARGETS = new Set(SDG_TARGETS)

/** One line: no line break, under 30 words. */
const ReasonSchema = z
  .string()
  .min(1)
  .refine((text) => !text.includes('\n') && text.trim().split(/\s+/).length < 30, 'a reason must be one line')

export const SdgReasonSchema = z
  .object({
    /** The UN's official wording of the target, verbatim. */
    text: z.string().min(1),
    reason: ReasonSchema
  })
  .strict()

/** `data/sdg-reasons.json`: `{ meta, targets: { [target]: { text, reason } } }`. */
export const SdgReasonsFileSchema = z
  .object({
    meta: z
      .object({
        source_name: z.string().min(1),
        source_url: z.url({ protocol: /^https$/ }),
        retrieved_date: z.iso.date(),
        notes: z.array(z.string().min(1)),
        reasons_by: z.string().min(1),
        reviewers: z.array(z.string().min(1)),
        quality: RoleQualitySchema
      })
      .strict()
      .refine((meta) => meta.quality !== 'human-checked' || meta.reviewers.length > 0, {
        message: 'human-checked reasons need a reviewer',
        path: ['reviewers']
      }),
    targets: z.record(
      SdgTargetSchema.refine((target) => REAL_TARGETS.has(target), 'not a UN SDG target'),
      SdgReasonSchema
    )
  })
  .strict()

export type SdgReason = z.infer<typeof SdgReasonSchema>
export type SdgReasonsFile = z.infer<typeof SdgReasonsFileSchema>
