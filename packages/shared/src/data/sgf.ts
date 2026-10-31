import { z } from 'zod'
import { SnapshotMetaSchema } from './sources'

// SkillsFuture Singapore (SGF) Skills Framework v2.0, published quarterly by the Singapore Workforce
// Development Agency (SWDA) under the Ministry of Education. Three workbooks: the framework itself
// (job roles, their critical work functions and key tasks, and the TSC/CCS skills each role needs at a
// proficiency level), a TSC-to-unique-skill mapping, and the unique skill list which flags each skill
// as emerging and/or CASL. Distinct from the Malaysian spine: roles are keyed by sector and track, not
// by O*NET-SOC, so nothing here joins to `data/onet/` by code.

/** A role's identity across all three role sheets of the framework workbook. */
export const SGF_ROLE_SEPARATOR = '|'

/** Proficiency level 1 to 6 for a TSC; CCS rows carry a word instead, which is normalised to null. */
export const SgfProficiencySchema = z.number().int().min(1).max(6).nullable()

/** A skill's kind: a Technical Skill and Competency, or a Critical Core Skill. */
export const SgfSkillTypeSchema = z.enum(['tsc', 'ccs'])

/** Whether a TSC code is current in the framework or has been retired by SWDA. */
export const SgfSkillStatusSchema = z.enum(['active', 'retired'])

export const SgfSkillRefSchema = z
  .object({
    code: z.string().min(1),
    title: z.string().min(1),
    type: SgfSkillTypeSchema,
    proficiency_level: SgfProficiencySchema
  })
  .strict()

export const SgfWorkFunctionSchema = z
  .object({
    name: z.string().min(1),
    key_tasks: z.array(z.string().min(1))
  })
  .strict()

export const SgfRoleSchema = z
  .object({
    /** `sector|track|role`, the key the three role sheets share. */
    role_id: z.string().min(1),
    sector: z.string().min(1),
    track: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    /** SWDA leaves this empty for a handful of roles; null rather than an invented string. */
    performance_expectation: z.string().min(1).nullable(),
    work_functions: z.array(SgfWorkFunctionSchema),
    /** Empty for the 29 roles the framework lists without a TSC/CCS mapping. */
    skills: z.array(SgfSkillRefSchema)
  })
  .strict()

/** One row of `TSC_CCS_Key` (active) or `TSC_CCS_Key_Retired`: the reference entry for a skill code. */
export const SgfSkillSchema = z
  .object({
    code: z.string().min(1),
    sector: z.string().min(1),
    category: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    /** Three retired rows carry `(None)` instead of a type; null rather than guessing which they are. */
    type: SgfSkillTypeSchema.nullable(),
    status: SgfSkillStatusSchema,
    /** `Latest Update Date` for an active code, `Retired Date` for a retired one. */
    dated: z.iso.date()
  })
  .strict()

/** A unique skill, as the framework's deduplicated list presents it. */
export const SgfUniqueSkillSchema = z
  .object({
    skill_id: z.string().min(1),
    skill_transaction_id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    type: SgfSkillTypeSchema,
    emerging: z.boolean(),
    casl: z.boolean()
  })
  .strict()

/** How one sectoral skill code resolves to a unique skill, before and after the framework's 2026 revision. */
export const SgfSkillMappingSchema = z
  .object({
    code: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    proficiency_level: SgfProficiencySchema,
    sector_tags: z.array(z.string().min(1)),
    previous: z
      .object({ title: z.string().min(1), description: z.string().min(1), type: SgfSkillTypeSchema })
      .strict()
      .nullable(),
    updated: z
      .object({ title: z.string().min(1), description: z.string().min(1), type: SgfSkillTypeSchema })
      .strict()
      .nullable()
  })
  .strict()

export const SgfMetaSchema = SnapshotMetaSchema.extend({
  /** The framework's own citation fields, alongside the snapshot meta's licence and attribution. */
  source_name: z.string().min(1),
  source_url: z.string().url(),
  publisher: z.string().min(1),
  /** Date of the most recently revised workbook, from its document properties. */
  vintage_date: z.iso.date(),
  geo_or_layer: z.string().min(1),
  /** The three workbooks this data was built from, each pinned by sha256 of the file as downloaded. */
  workbooks: z
    .array(
      z
        .object({
          name: z.string().min(1),
          sha256: z.string().regex(/^[0-9a-f]{64}$/),
          bytes: z.number().int().positive()
        })
        .strict()
    )
    .length(3),
  version: z.string().min(1)
}).strict()

export const SgfRolesFileSchema = z
  .object({
    meta: SgfMetaSchema,
    sectors: z.array(z.string().min(1)).min(1),
    roles: z.record(z.string(), SgfRoleSchema)
  })
  .strict()

export const SgfSkillsFileSchema = z
  .object({
    meta: SgfMetaSchema,
    skills: z.record(z.string(), SgfSkillSchema)
  })
  .strict()

export const SgfUniqueSkillsFileSchema = z
  .object({
    meta: SgfMetaSchema,
    skills: z.record(z.string(), SgfUniqueSkillSchema),
    /**
     * One entry per row of the mapping sheet's `data` tab, keyed by skill code. A code can map to more
     * than one unique skill — 125 of 12,326 rows share a code with a different resolution (up to 10 for
     * one code) — so every copy is kept in sheet order rather than one being picked.
     */
    mappings: z.record(z.string(), z.array(SgfSkillMappingSchema).min(1))
  })
  .strict()

export type SgfProficiency = z.infer<typeof SgfProficiencySchema>
export type SgfSkillType = z.infer<typeof SgfSkillTypeSchema>
export type SgfSkillStatus = z.infer<typeof SgfSkillStatusSchema>
export type SgfSkillRef = z.infer<typeof SgfSkillRefSchema>
export type SgfWorkFunction = z.infer<typeof SgfWorkFunctionSchema>
export type SgfRole = z.infer<typeof SgfRoleSchema>
export type SgfSkill = z.infer<typeof SgfSkillSchema>
export type SgfUniqueSkill = z.infer<typeof SgfUniqueSkillSchema>
export type SgfSkillMapping = z.infer<typeof SgfSkillMappingSchema>
export type SgfSkillMappings = z.infer<typeof SgfUniqueSkillsFileSchema>['mappings'][string]
export type SgfMeta = z.infer<typeof SgfMetaSchema>
export type SgfRolesFile = z.infer<typeof SgfRolesFileSchema>
export type SgfSkillsFile = z.infer<typeof SgfSkillsFileSchema>
export type SgfUniqueSkillsFile = z.infer<typeof SgfUniqueSkillsFileSchema>

// #464: the two derived files that join the framework to the O*NET spine, both written by scripts/sgf/link.ts.

/** How a model matched a SkillsFuture role, or a corner's skills, and that no person has checked it. */
export const SgfGeneratedSchema = z
  .object({
    model: z.string().min(1),
    generated_date: z.iso.date(),
    prompt_sha256: z.string().regex(/^[0-9a-f]{64}$/),
    quality: z.literal('auto-generated')
  })
  .strict()

export const SgfMatchConfidenceSchema = z.enum(['high', 'medium', 'low'])

/** One SkillsFuture role's O*NET occupation; null when no occupation does most of its work. */
export const SgfCrosswalkRowSchema = z
  .object({
    onet_code: z
      .string()
      .regex(/^\d{2}-\d{4}\.\d{2}$/)
      .nullable(),
    confidence: SgfMatchConfidenceSchema,
    reason: z.string().min(1)
  })
  .strict()

/** `data/sgf/onet-crosswalk.json`. */
export const SgfCrosswalkFileSchema = z
  .object({
    meta: SgfMetaSchema,
    generated: SgfGeneratedSchema,
    by_role: z.record(z.string(), SgfCrosswalkRowSchema),
    /** O*NET code → its SkillsFuture roles, high confidence first, then in framework order. */
    by_onet: z.record(z.string(), z.array(z.string().min(1)).min(1))
  })
  .strict()
  .superRefine((file, ctx) => {
    for (const [code, ids] of Object.entries(file.by_onet)) {
      for (const id of ids) {
        if (file.by_role[id]?.onet_code !== code) {
          ctx.addIssue({ code: 'custom', message: `${id} does not map to ${code}`, path: ['by_onet', code] })
        }
      }
    }
  })

/** A SkillsFuture skill linked to a corner, at the highest proficiency level its equivalent roles ask for. */
export const SgfCornerSkillSchema = z
  .object({
    code: z.string().min(1),
    title: z.string().min(1),
    type: SgfSkillTypeSchema,
    proficiency_level: SgfProficiencySchema,
    emerging: z.boolean(),
    /** The equivalent role the skill was first found in. */
    role_id: z.string().min(1)
  })
  .strict()

/** `data/sgf/corner-skills.json`: O*NET code → corner id → up to 3 linked skills. */
export const SgfCornerSkillsFileSchema = z
  .object({
    meta: SgfMetaSchema,
    generated: SgfGeneratedSchema,
    roles: z.record(z.string(), z.record(z.string(), z.array(SgfCornerSkillSchema).max(3)))
  })
  .strict()

export type SgfMatchConfidence = z.infer<typeof SgfMatchConfidenceSchema>
export type SgfCrosswalkRow = z.infer<typeof SgfCrosswalkRowSchema>
export type SgfCrosswalkFile = z.infer<typeof SgfCrosswalkFileSchema>
export type SgfCornerSkill = z.infer<typeof SgfCornerSkillSchema>
export type SgfCornerSkillsFile = z.infer<typeof SgfCornerSkillsFileSchema>

/** The SkillsFuture roles Kotak shows for an O*NET job, and whose skills its corners may link: high and medium only. */
export function sgfMatchedRoles(crosswalk: SgfCrosswalkFile, onetCode: string, limit = 6): string[] {
  return (crosswalk.by_onet[onetCode] ?? []).filter((id) => crosswalk.by_role[id]?.confidence !== 'low').slice(0, limit)
}
