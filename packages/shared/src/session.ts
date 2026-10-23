import { z } from 'zod'
import { SnapshotIdSchema } from './engine'
import { MAX_WEEKLY_HOURS, MIN_WEEKLY_HOURS } from './rules/constants'

/** One answer on the 1 to 4 scale (1 "Not yet" to 4 "Yes, on my own"); a reversed question is stored already flipped. */
export const RatingSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
export type Rating = z.infer<typeof RatingSchema>

export const GuestSessionSchema = z
  .object({
    is_guest: z.boolean(),
    role_code: z.string().nullable(),
    goal: z.string().nullable(),
    impact_area: z.string().nullable(),
    target_role_code: z.string().nullable(),
    // The role the roadmap plans for when the user picks one on the Roles page; null plans for the assessed role.
    plan_role_code: z.string().nullable().default(null),
    answers: z.array(RatingSchema.nullable()).length(12),
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
