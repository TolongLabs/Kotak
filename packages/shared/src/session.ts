import { z } from 'zod'
import { SnapshotIdSchema } from './engine'
import { MAX_WEEKLY_HOURS, MIN_WEEKLY_HOURS } from './rules/constants'

export const GuestSessionSchema = z
  .object({
    is_guest: z.boolean(),
    role_code: z.string().nullable(),
    goal: z.string().nullable(),
    impact_area: z.string().nullable(),
    target_role_code: z.string().nullable(),
    // The role the roadmap plans for when the user picks one on the Roles page; null plans for the assessed role.
    plan_role_code: z.string().nullable().default(null),
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

/** The check-up's goals: stay strong in the current job, move to a target role, or explore related roles. */
export const GoalSchema = z.enum(['stay', 'target', 'explore'])

/** Hours a week for learning, in the range the Roadmap page lets a user pick, 4 by default. null: the AI dividend
 * sets them. */
export const WeeklyHoursSchema = z.number().min(MIN_WEEKLY_HOURS).max(MAX_WEEKLY_HOURS).nullable().default(4)
