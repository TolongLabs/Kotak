import { z } from 'zod'
import { LocaleSchema } from './api'

// Proof of a roadmap step (#457): the user uploads a certificate or a completion screen, Claude rules on it, and only a
// pass marks the step done. Proof is never self-report, and the file is read once and never stored.

/** The judge's ruling. unclear never punishes: it asks for a better file. */
export const EvidenceVerdictSchema = z.enum(['pass', 'fail', 'unclear'])
export type EvidenceVerdict = z.infer<typeof EvidenceVerdictSchema>

/** The file types the judge reads. HEIC, an iPhone's default, is refused with a fix. */
export const EVIDENCE_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'] as const
export const EvidenceMediaTypeSchema = z.enum(EVIDENCE_MEDIA_TYPES)
export type EvidenceMediaType = z.infer<typeof EvidenceMediaTypeSchema>

export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024
// The file travels as base64, four characters for every three bytes.
export const EVIDENCE_MAX_BASE64 = Math.ceil(EVIDENCE_MAX_BYTES / 3) * 4

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const EvidenceRequestSchema = z
  .object({
    step_id: z.string().min(1).max(400),
    // What the step builds: its statement, its skill and the level it aims for.
    step_title: z.string().max(600),
    skill: z.string().min(1).max(200),
    target_level: z.string().max(300),
    // The step's resource; checked is true for a checked course (#369), whose name and provider must match.
    resource: z
      .object({
        title: z.string().min(1).max(300),
        provider: z.string().max(200).nullable(),
        url: z.string().max(2000).nullable(),
        checked: z.boolean()
      })
      .strict()
      .nullable(),
    today: IsoDateSchema,
    file: z
      .object({
        media_type: EvidenceMediaTypeSchema,
        // Base64 without a data: prefix.
        data: z.string().min(1).max(EVIDENCE_MAX_BASE64)
      })
      .strict(),
    // The interface language: the reason and the fix hint come back in it. Absent means English. Lazy, since ./api
    // imports the session, which imports this file.
    lang: z.lazy(() => LocaleSchema).optional()
  })
  .strict()
export type EvidenceRequest = z.infer<typeof EvidenceRequestSchema>

export const EvidenceResponseSchema = z
  .object({
    verdict: EvidenceVerdictSchema,
    // One sentence on why, in the request's language.
    reason: z.string().min(1),
    // What to fix on unclear, else null.
    fix_hint: z.string().nullable(),
    // What the file shows, when it shows it.
    course: z.string().nullable(),
    provider: z.string().nullable(),
    completion_date: IsoDateSchema.nullable()
  })
  .strict()
export type EvidenceResponse = z.infer<typeof EvidenceResponseSchema>

/** What a pass keeps in the session, keyed by step id. The file itself is never kept. */
export const MilestoneEvidenceSchema = z
  .object({
    verdict: z.literal('pass'),
    course: z.string().nullable(),
    provider: z.string().nullable(),
    completion_date: IsoDateSchema.nullable(),
    judged_at: z.iso.datetime()
  })
  .strict()
export type MilestoneEvidence = z.infer<typeof MilestoneEvidenceSchema>
