import { z } from 'zod'
import {
  DEFAULT_SNAPSHOT,
  EngineSnapshotSchema,
  OccupationSchema,
  SnapshotIdSchema,
  SourceSchema,
  VerdictSchema
} from './engine'
import { ProfileSchema } from './pathways/schemas'
import { GoalSchema, RatingSchema, WeeklyHoursSchema } from './session'

const UserLevelSchema = z.number().min(0).max(3)
const TargetLevelSchema = z.number().min(1).max(3)
// O*NET-SOC codes such as 15-1254.00, and SOC major groups such as 15-0000.
const OnetRoleCodeSchema = z.string().regex(/^\d{2}-\d{4}\.\d{2}$/)
const OccupationGroupCodeSchema = z.string().regex(/^\d{2}-0000$/)
// Who wrote a piece of explanation text: Claude, checked by the verifier, or the fixed template.
const AiTextSourceSchema = z.enum(['claude', 'template'])

// Every non-2xx API response has this body.
export const ApiErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1)
      })
      .strict()
  })
  .strict()

export const HealthResponseSchema = z.object({ status: z.literal('ok') }).strict()

export const SampleResponseSchema = EngineSnapshotSchema

// The longest O*NET 30.1 alternate title has 128 characters.
export const RoleMatchRequestSchema = z.object({ job_title: z.string().trim().min(1).max(150) }).strict()

export const RoleMatchResponseSchema = z
  .object({
    occupation: OccupationSchema.nullable(),
    needs_confirmation: z.boolean(),
    match_source: z.enum(['title_search', 'claude', 'none']).optional(),
    cached: z.boolean().optional(),
    fallback_reason: z.enum(['ai_unavailable', 'no_valid_suggestion']).optional()
  })
  .strict()

// Market job titles an admin approved from JobStreet listings, each for one O*NET occupation. The check-up offers
// them alongside the O*NET titles.
export const RoleAliasSchema = z.object({ title: z.string().min(1).max(80), onet_code: OnetRoleCodeSchema }).strict()
export const RoleAliasesResponseSchema = z.object({ aliases: z.array(RoleAliasSchema) }).strict()

export const ExplanationRequestSchema = z
  .object({
    snapshot_id: SnapshotIdSchema,
    corners: z
      .array(
        z
          .object({
            corner_id: z.string().min(1),
            // Corner-group names join their work activities; the longest has 327 characters.
            name: z.string().trim().min(1).max(400).optional(),
            verdict: VerdictSchema,
            previous_verdict: VerdictSchema.optional(),
            user_level: UserLevelSchema,
            target_level: TargetLevelSchema,
            sources: z.array(SourceSchema).min(1)
          })
          .strict()
      )
      // One per role corner: most roles have 6, and #74 lets a role have fewer.
      .min(1)
      .max(6)
  })
  .strict()

export const ExplanationResponseSchema = z
  .object({
    explanations: z
      .array(
        z
          .object({
            corner_id: z.string().min(1),
            sentences: z.tuple([z.string().min(1), z.string().min(1)]),
            citations: z
              .array(
                z
                  .object({
                    source_name: z.string().min(1),
                    vintage_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
                  })
                  .strict()
              )
              .min(1),
            source: AiTextSourceSchema.optional()
          })
          .strict()
      )
      .min(1)
      .max(6),
    what_changed_summary: z.string().min(1),
    what_changed_source: AiTextSourceSchema.optional(),
    cached: z.boolean().optional(),
    fallback_reason: z.enum(['ai_unavailable', 'verifier_rejected']).optional()
  })
  .strict()

export const JobAdExtractRequestSchema = z.object({ ad_text: z.string().trim().min(1) }).strict()

export const JobAdExtractResponseSchema = z
  .object({
    skills: z.array(
      z
        .object({
          skill: z.string().min(1),
          quote: z.string().min(1)
        })
        .strict()
    )
  })
  .strict()

// The length cap is the TTS route's cheap guard on ElevenLabs credits.
export const TtsRequestSchema = z.object({ text: z.string().trim().min(1).max(600) }).strict()

export const TtsResponseSchema = z
  .object({
    audio_base64: z.string().min(1),
    content_type: z.literal('audio/mpeg')
  })
  .strict()

export const NationalCheckupRequestSchema = z
  .object({
    onet_role_code: OnetRoleCodeSchema,
    corner_levels: z.array(UserLevelSchema).min(1).max(6)
  })
  .strict()

export const NationalCheckupResponseSchema = z.object({ recorded: z.literal(true) }).strict()

export const NationalViewSummaryRequestSchema = z
  .object({
    occupation_group: OccupationGroupCodeSchema.optional(),
    onet_role_code: OnetRoleCodeSchema.optional()
  })
  .strict()

// One row per role. Real averages need 10 or more real check-ups; otherwise the row is labelled sample data.
// Averages are rounded to one decimal.
export const NationalViewGroupSchema = z
  .object({
    onet_role_code: OnetRoleCodeSchema,
    occupation_group: OccupationGroupCodeSchema,
    occupation_group_title: z.string().min(1),
    average_corner_levels: z.array(z.number().min(0).max(3)).min(1).max(6),
    // Rows behind the averages. Real groups give a bucket floor, a multiple of 10 (show 20 as "20+"), never the
    // exact count. Sample groups give the number of sample rows.
    checkup_count: z.number().int().min(1),
    is_sample: z.boolean()
  })
  .strict()
  .refine((group) => group.is_sample || group.checkup_count % 10 === 0, {
    message: 'A real checkup_count is a multiple of 10.',
    path: ['checkup_count']
  })

export const NationalViewSummaryResponseSchema = z
  .object({
    groups: z.array(NationalViewGroupSchema),
    // false when the database is unset or unreachable; every group is then built-in sample data.
    database_available: z.boolean()
  })
  .strict()

// What Malaysian job ads say about a role (#271): JobStreet ads that an admin approved under the role's O*NET
// occupation, summed in Postgres. Context beside the verdicts; it sets none (#275). Counts are whole ads. "Active"
// ads were seen in the 14 days before the role's latest scrape. Pay is advertised monthly ringgit, the midpoint of
// each ad's range, rounded to RM 100; null under 5 ads that state pay. Skills are null under 10 checked ads.
export const JOB_MARKET_MAX_CODES = 10
export const JOB_MARKET_MIN_PAY_ADS = 5
export const JOB_MARKET_MIN_SKILL_ADS = 10

const AdCountSchema = z.number().int().min(0)
const NamedCountSchema = z.object({ name: z.string().min(1), ads: AdCountSchema }).strict()
const SkillCountSchema = z.object({ key: z.string().min(1), label: z.string().min(1), ads: AdCountSchema }).strict()

export const JobMarketSchema = z
  .object({
    onet_code: OnetRoleCodeSchema,
    // The admin's JobStreet search titles whose approved ads count here.
    search_titles: z.array(z.string().min(1)),
    ads: z
      .object({
        reviewed: AdCountSchema, // every ad approved under the occupation
        active: AdCountSchema,
        employers: AdCountSchema // distinct employers among active ads
      })
      .strict(),
    pay: z
      .object({
        ads_with_pay: AdCountSchema,
        median: z.number().int().min(0),
        p25: z.number().int().min(0),
        p75: z.number().int().min(0)
      })
      .strict()
      .nullable(),
    // The 5 states or federal territories with the most active ads, most first.
    regions: z.array(NamedCountSchema),
    without_state: AdCountSchema, // active ads whose location names no state, such as "Malaysia"
    remote: AdCountSchema,
    hybrid: AdCountSchema,
    work_types: z.array(NamedCountSchema),
    skills: z
      .object({
        ads_checked: AdCountSchema, // active ads whose text was matched against the vocabulary
        ai_ads: AdCountSchema, // checked ads that mention AI
        tools: z.array(SkillCountSchema),
        languages: z.array(SkillCountSchema),
        ai: z.array(SkillCountSchema)
      })
      .strict()
      .nullable(),
    // Distinct approved ads seen each week (weeks start on Monday, Malaysia time), oldest first: this week and the 11
    // before it.
    weekly: z.array(z.object({ week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), ads: AdCountSchema }).strict()),
    first_seen: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    source: SourceSchema
  })
  .strict()

export const JobMarketResponseSchema = z
  .object({
    // Roles with no approved ads are left out.
    markets: z.array(JobMarketSchema),
    // false when the database is unset or unreachable.
    database_available: z.boolean()
  })
  .strict()

// Kopi's chat (#189): the conversation so far, oldest first, from a user turn to the user's new question; send at
// most the last CHAT_MAX_TURNS turns. With no API key, over the rate limit or on a Claude failure, the route answers
// 503 with ApiError code agent_unavailable.
export const CHAT_MAX_TURNS = 20
/** The longest question a user can ask, in characters. */
export const CHAT_QUESTION_MAX_LENGTH = 1000

const ChatTurnSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('user'), content: z.string().trim().min(1).max(CHAT_QUESTION_MAX_LENGTH) }).strict(),
  z.object({ role: z.literal('assistant'), content: z.string().trim().min(1).max(4000) }).strict()
])

// The guest session's check-up, as the app computes it. answers are the session's 12 slots on the assessed role's
// corners (the target role with the target goal), as answerSlots in @kotak/sdk lays them out. role_code is null when
// the user has no current job, which needs the target goal. start_date is the app's today, so Kopi's dates match
// the Roadmap page.
export const AgentChatCheckupSchema = z
  .object({
    role_code: OnetRoleCodeSchema.nullable(),
    goal: GoalSchema.default('explore'),
    target_role_code: OnetRoleCodeSchema.nullable().default(null),
    plan_role_code: OnetRoleCodeSchema.nullable().default(null),
    answers: z.array(RatingSchema.nullable()).length(12),
    snapshot_id: SnapshotIdSchema.default(DEFAULT_SNAPSHOT),
    weekly_hours: WeeklyHoursSchema,
    start_date: z.iso.date(),
    profile: ProfileSchema.default(() => ProfileSchema.parse({}))
  })
  .strict()
  .refine((checkup) => checkup.role_code !== null || (checkup.goal === 'target' && checkup.target_role_code !== null), {
    message: 'Without a current job, the check-up needs the target goal and a target role.',
    path: ['role_code']
  })

export const AgentChatRequestSchema = z
  .object({
    messages: z
      .array(ChatTurnSchema)
      .min(1)
      .max(CHAT_MAX_TURNS)
      .refine((turns) => turns[0]?.role === 'user' && turns.at(-1)?.role === 'user', {
        message: "The conversation starts and ends with the user's turn."
      }),
    // null before the user has a check-up: Kopi then points to the check-up and answers general questions.
    checkup: AgentChatCheckupSchema.nullable()
  })
  .strict()

export const AgentChatResponseSchema = z
  .object({
    reply: z.string().min(1),
    // Each Kotak tool call behind the reply, in order, e.g. { name: "run_checkup", label: "Run the Check-Up: 6 h a week" }.
    tools: z.array(z.object({ name: z.string().min(1), label: z.string().min(1) }).strict()),
    // Every source in those tools' results, once.
    sources: z.array(
      z.object({ source_name: z.string().min(1), vintage_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict()
    )
  })
  .strict()

export type ApiError = z.infer<typeof ApiErrorSchema>
export type HealthResponse = z.infer<typeof HealthResponseSchema>
export type SampleResponse = z.infer<typeof SampleResponseSchema>
export type RoleMatchRequest = z.infer<typeof RoleMatchRequestSchema>
export type RoleMatchResponse = z.infer<typeof RoleMatchResponseSchema>
export type RoleAlias = z.infer<typeof RoleAliasSchema>
export type RoleAliasesResponse = z.infer<typeof RoleAliasesResponseSchema>
export type ExplanationRequest = z.infer<typeof ExplanationRequestSchema>
export type ExplanationResponse = z.infer<typeof ExplanationResponseSchema>
export type JobAdExtractRequest = z.infer<typeof JobAdExtractRequestSchema>
export type JobAdExtractResponse = z.infer<typeof JobAdExtractResponseSchema>
export type TtsRequest = z.infer<typeof TtsRequestSchema>
export type TtsResponse = z.infer<typeof TtsResponseSchema>
export type NationalCheckupRequest = z.infer<typeof NationalCheckupRequestSchema>
export type NationalCheckupResponse = z.infer<typeof NationalCheckupResponseSchema>
export type NationalViewSummaryRequest = z.infer<typeof NationalViewSummaryRequestSchema>
export type NationalViewGroup = z.infer<typeof NationalViewGroupSchema>
export type NationalViewSummaryResponse = z.infer<typeof NationalViewSummaryResponseSchema>
export type JobMarket = z.infer<typeof JobMarketSchema>
export type JobMarketResponse = z.infer<typeof JobMarketResponseSchema>
export type AgentChatCheckup = z.infer<typeof AgentChatCheckupSchema>
export type AgentChatRequest = z.infer<typeof AgentChatRequestSchema>
export type AgentChatResponse = z.infer<typeof AgentChatResponseSchema>
