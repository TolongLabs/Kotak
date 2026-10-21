import { z } from 'zod'
import { SnapshotIdSchema } from './engine'

export const GuestSessionSchema = z
  .object({
    is_guest: z.boolean(),
    role_code: z.string().nullable(),
    goal: z.string().nullable(),
    impact_area: z.string().nullable(),
    target_role_code: z.string().nullable(),
    answers: z.array(z.boolean().nullable()).length(12),
    follow_up_answers: z.record(z.string(), z.boolean().nullable()),
    ticked_milestones: z.array(z.string()),
    custom_weekly_hours: z.number().positive().nullable(),
    pasted_job_ad_quotes: z.array(z.string()),
    tts_muted: z.boolean(),
    active_snapshot_id: SnapshotIdSchema
  })
  .strict()

export type GuestSession = z.infer<typeof GuestSessionSchema>
