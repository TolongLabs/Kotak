import { z } from 'zod'
import { EngineSnapshotSchema, OccupationSchema, SnapshotIdSchema, SourceSchema, VerdictSchema } from './engine'

const UserLevelSchema = z.number().int().min(0).max(3)
const TargetLevelSchema = z.number().min(1).max(3)

export const HealthResponseSchema = z.object({ status: z.literal('ok') }).strict()

export const SampleResponseSchema = EngineSnapshotSchema

export const RoleMatchRequestSchema = z.object({ job_title: z.string().trim().min(1) }).strict()

export const RoleMatchResponseSchema = z
  .object({
    occupation: OccupationSchema,
    needs_confirmation: z.boolean()
  })
  .strict()

export const ExplanationRequestSchema = z
  .object({
    snapshot_id: SnapshotIdSchema,
    corners: z
      .array(
        z
          .object({
            corner_id: z.string().min(1),
            verdict: VerdictSchema,
            user_level: UserLevelSchema,
            target_level: TargetLevelSchema,
            sources: z.array(SourceSchema).min(1)
          })
          .strict()
      )
      .length(6)
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
              .min(1)
          })
          .strict()
      )
      .length(6),
    what_changed_summary: z.string().min(1)
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

export const TtsRequestSchema = z.object({ text: z.string().trim().min(1) }).strict()

export const TtsResponseSchema = z
  .object({
    audio_base64: z.string().min(1),
    content_type: z.literal('audio/mpeg')
  })
  .strict()

export const NationalCheckupRequestSchema = z
  .object({
    onet_role_code: z.string().min(1),
    corner_levels: z.array(UserLevelSchema).length(6)
  })
  .strict()

export const NationalCheckupResponseSchema = z.object({ recorded: z.literal(true) }).strict()

export const NationalViewSummaryRequestSchema = z
  .object({
    occupation_group: z.string().optional(),
    onet_role_code: z.string().optional()
  })
  .strict()

export const NationalViewGroupSchema = z
  .object({
    onet_role_code: z.string().min(1),
    occupation_group: z.string().min(1),
    average_corner_levels: z.array(z.number().min(0).max(3)).length(6),
    is_sample: z.boolean()
  })
  .strict()

export const NationalViewSummaryResponseSchema = z.object({ groups: z.array(NationalViewGroupSchema) }).strict()

export type HealthResponse = z.infer<typeof HealthResponseSchema>
export type SampleResponse = z.infer<typeof SampleResponseSchema>
export type RoleMatchRequest = z.infer<typeof RoleMatchRequestSchema>
export type RoleMatchResponse = z.infer<typeof RoleMatchResponseSchema>
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
