import { z } from 'zod'
import { OnetSocCodeSchema } from '../data/onet'
import { SourceSchema } from '../engine'

// Pathways (#284): who the user is (their situation, study and interests) and what decides entry to each role, so
// the check-up can start from more than one job title. The data files under data/pathways/ hold the inputs; the
// bundle's /data/pathways.json joins them for the browser. Every rule over them is fixed: see access.ts and pool.ts.

const IsoDateSchema = z.iso.date()
const IdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

/** Where the user is now. Only "working" assumes the job title is the user's current job. */
export const SituationSchema = z.enum(['working', 'studying', 'graduated', 'between_jobs', 'returning'])

/** The highest qualification, on the Malaysian Qualifications Framework's ladder (SPM and below are "secondary"). */
export const EducationLevelSchema = z.enum(['secondary', 'certificate', 'diploma', 'bachelor', 'master', 'doctorate'])
export const EDUCATION_ORDER = EducationLevelSchema.options

/** Holland's six interest areas, in O*NET's order: Realistic, Investigative, Artistic, Social, Enterprising, Conventional. */
export const RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'] as const
/** How many of an area's activities the user picked, 0 to 3 each, in RIASEC order. */
// An array rather than a tuple, so the tools' JSON Schemas need no prefixItems, which some MCP clients don't read.
export const InterestPicksSchema = z.array(z.number().int().min(0).max(3)).length(6)

export const MAX_TARGETS = 3
export const MAX_AREAS = 3

/** What the intake asks before any question. Every field may stay empty: the check-up still runs on a job title. */
export const ProfileSchema = z
  .object({
    situation: SituationSchema.nullable().default(null),
    education_level: EducationLevelSchema.nullable().default(null),
    field_of_study: IdSchema.nullable().default(null), // an id from /data/pathways.json's fields
    years_experience: z.number().int().min(0).max(60).nullable().default(null), // years of work, any job
    interest_areas: z.array(IdSchema).max(MAX_AREAS).default([]), // ids from /data/pathways.json's areas
    target_role_codes: z.array(OnetSocCodeSchema).max(MAX_TARGETS).default([]), // the first is the assessed target
    interests: InterestPicksSchema.nullable().default(null) // the "I'm not sure" screen's picks
  })
  .strict()

/** The profile before the intake: every field empty. */
export const EMPTY_PROFILE: Profile = ProfileSchema.parse({})

// ---- Data files under data/pathways/ ----

const PathwaysSourceSchema = z
  .object({
    source_name: z.string().min(1),
    source_url: z.url(),
    vintage_date: IsoDateSchema,
    retrieved_date: IsoDateSchema,
    licence: z.string().min(1),
    credit: z.string().min(1)
  })
  .strict()

/** data/pathways/career-areas.json: interest areas, each a fixed list of O*NET codes or SOC code prefixes. */
export const CareerAreasFileSchema = z
  .object({
    areas: z
      .array(
        z
          .object({
            id: IdSchema,
            label: z.string().min(1),
            group: z.enum(['digital', 'other']),
            description: z.string().min(1),
            onet_codes: z.array(OnetSocCodeSchema),
            soc_prefixes: z.array(z.string().regex(/^\d{2}-\d{0,4}$/))
          })
          .strict()
          .refine((area) => area.onet_codes.length + area.soc_prefixes.length > 0, 'an area needs codes or prefixes')
      )
      .min(1)
  })
  .strict()

/** data/pathways/fields-of-study.json: the fields the intake offers, each a set of CIP 2020 code prefixes. */
export const FieldsOfStudyFileSchema = z
  .object({
    note: z.string().min(1),
    // Per field group, the SOC major groups whose All Other codes may reach its fields.
    home_majors: z.record(z.string().min(1), z.array(z.string().regex(/^\d{2}$/))),
    fields: z
      .array(
        z
          .object({
            id: IdSchema,
            label: z.string().min(1),
            group: z.string().min(1),
            cip_prefixes: z.array(z.string().regex(/^\d{2}(\.\d{1,4})?$/))
          })
          .strict()
      )
      .min(1)
  })
  .strict()

/** data/pathways/cip-soc.json: the NCES CIP 2020 to SOC 2018 crosswalk, one row per link. */
export const CipSocFileSchema = z
  .object({
    meta: PathwaysSourceSchema,
    links: z.array(
      z
        .object({
          cip: z.string().regex(/^\d{2}\.\d{4}$/),
          soc: z.string().regex(/^\d{2}-\d{4}$/)
        })
        .strict()
    )
  })
  .strict()

/** A Malaysian profession the law restricts: who regulates it, the route in, and the pages that say so. */
export const RegulatedProfessionSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1), // the regulated title in Malaysia
    onet_codes: z.array(OnetSocCodeSchema).min(1),
    // url is null where the regulator's own site couldn't be opened; the sources then carry the Act.
    body: z.object({ name: z.string().min(1), url: z.url().nullable() }).strict(),
    law: z.string().min(1).nullable(),
    route: z.array(z.string().min(1)).min(1),
    // CIP 2020 prefixes of qualifying degrees; empty when entry is by licence or examination rather than a degree.
    qualifying_fields: z.array(z.string().regex(/^\d{2}(\.\d{1,4})?$/)),
    minimum_level: EducationLevelSchema.nullable(),
    sources: z.array(z.object({ url: z.url(), title: z.string().min(1), supports: z.string().min(1) }).strict()).min(1),
    notes: z.string()
  })
  .strict()

/** data/pathways/regulated-professions.json: Malaysian professions the law restricts, checked against their sources. */
export const RegulatedProfessionsFileSchema = z
  .object({
    accessed_date: IsoDateSchema,
    professions: z.array(RegulatedProfessionSchema).min(1)
  })
  .strict()

/** How much preparation an occupation needs, from O*NET's Job Zones and Education, Training, and Experience. */
export const OccupationPreparationSchema = z
  .object({
    job_zone: z.number().int().min(1).max(5).nullable(),
    // The median level of education and of related work experience that workers say the job needs.
    education: EducationLevelSchema.nullable(),
    experience_years: z.number().min(0).max(10).nullable(), // the median category's lower bound, in years
    // Occupational interest scores, 1 to 7, in RIASEC order.
    interests: z.array(z.number().min(1).max(7)).length(6).nullable(),
    basis: z.enum(['survey', 'job_zone', 'none'])
  })
  .strict()

/** data/pathways/onet-preparation.json */
export const OnetPreparationFileSchema = z
  .object({
    meta: PathwaysSourceSchema,
    occupations: z.record(OnetSocCodeSchema, OccupationPreparationSchema)
  })
  .strict()

// ---- The bundle file /data/pathways.json ----

export const BundlePathwaysSchema = z
  .object({
    sources: z
      .object({ onet: SourceSchema, onet_tools: SourceSchema, cip_soc: SourceSchema, regulated: SourceSchema })
      .strict(),
    fields: z.array(
      z
        .object({
          id: IdSchema,
          label: z.string().min(1),
          group: z.string().min(1),
          onet_codes: z.array(OnetSocCodeSchema)
        })
        .strict()
    ),
    areas: z.array(
      z
        .object({
          id: IdSchema,
          label: z.string().min(1),
          group: z.enum(['digital', 'other']),
          description: z.string().min(1),
          onet_codes: z.array(OnetSocCodeSchema).min(1)
        })
        .strict()
    ),
    professions: z.array(
      RegulatedProfessionSchema.omit({ qualifying_fields: true, notes: true, sources: true })
        .extend({
          qualifying_field_ids: z.array(IdSchema),
          sources: z.array(z.object({ url: z.url(), title: z.string().min(1) }).strict()).min(1)
        })
        .strict()
    ),
    occupations: z.record(
      OnetSocCodeSchema,
      OccupationPreparationSchema.omit({ basis: true })
        .extend({ title: z.string().min(1) })
        .strict()
    )
  })
  .strict()

// ---- What the rules return ----

/**
 * What stands between the user and a role, by a fixed rule (access.ts):
 * - open: nothing Kotak knows of.
 * - qualify: a regulated profession, and the user's degree doesn't qualify ("Qualification Needed").
 * - register: a regulated profession; the user's degree qualifies, but registration steps remain.
 * - check_licence: a regulated profession, and Kotak doesn't know the user's study.
 * - experience: workers say the job needs years of related experience the user doesn't have yet.
 * - degree: workers say the job needs a degree the user doesn't have yet.
 */
export const AccessStatusSchema = z.enum(['open', 'qualify', 'register', 'check_licence', 'experience', 'degree'])

export const RoleAccessSchema = z
  .object({
    status: AccessStatusSchema,
    label: z.string().min(1), // the chip: "Qualification Needed", "Registration Steps Left", ...
    summary: z.string().min(1), // one plain sentence
    profession: z
      .object({
        id: IdSchema,
        name: z.string().min(1),
        body: z.object({ name: z.string().min(1), url: z.url().nullable() }).strict(),
        law: z.string().nullable(),
        route: z.array(z.string().min(1)),
        sources: z.array(z.object({ url: z.url(), title: z.string().min(1) }).strict())
      })
      .strict()
      .nullable(),
    education: EducationLevelSchema.nullable(), // what workers say the job needs (O*NET, US)
    experience_years: z.number().nullable()
  })
  .strict()

// related: in O*NET's related list of the role the check-up assesses; job_related: of the user's job, when the two differ.
export const CandidateReasonSchema = z.enum([
  'target',
  'area',
  'field',
  'interests',
  'job_related',
  'related',
  'current'
])

export type Situation = z.infer<typeof SituationSchema>
export type EducationLevel = z.infer<typeof EducationLevelSchema>
export type InterestPicks = z.infer<typeof InterestPicksSchema>
export type Profile = z.infer<typeof ProfileSchema>
export type ProfileInput = z.input<typeof ProfileSchema>
export type CareerAreasFile = z.infer<typeof CareerAreasFileSchema>
export type FieldsOfStudyFile = z.infer<typeof FieldsOfStudyFileSchema>
export type CipSocFile = z.infer<typeof CipSocFileSchema>
export type RegulatedProfession = z.infer<typeof RegulatedProfessionSchema>
export type RegulatedProfessionsFile = z.infer<typeof RegulatedProfessionsFileSchema>
export type OccupationPreparation = z.infer<typeof OccupationPreparationSchema>
export type OnetPreparationFile = z.infer<typeof OnetPreparationFileSchema>
export type BundlePathways = z.infer<typeof BundlePathwaysSchema>
export type AccessStatus = z.infer<typeof AccessStatusSchema>
export type RoleAccess = z.infer<typeof RoleAccessSchema>
export type CandidateReason = z.infer<typeof CandidateReasonSchema>
