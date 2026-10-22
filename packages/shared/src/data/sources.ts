import { z } from 'zod'
import { SignalSchema, SourceSchema } from '../engine'
import { OnetSocCodeSchema } from './onet'

// Dated signal snapshots under `data/snapshots/`. Every record that holds a number carries the four
// provenance fields of `SourceSchema`. In these schemas `vintage_date` is the date the publisher released or
// last updated the figures, and a separate field (`quarter`, `date`, `edition`) names the period they cover.
// A suppressed or unpublished value is `null`, never 0.

const IsoDateSchema = z.iso.date()

/** File header of a dated snapshot. */
export const SnapshotMetaSchema = z
  .object({
    dataset: z.string().min(1),
    retrieved_date: IsoDateSchema,
    licence: z.string().min(1),
    licence_url: z.url().nullable(),
    /** The credit line the source requires, shown wherever its figures appear. */
    attribution: z.string().min(1),
    notes: z.array(z.string().min(1)).optional()
  })
  .strict()

/** Direction between two dated points; `unknown` when either point is missing. */
export const TrendDirectionSchema = z.enum(['up', 'flat', 'down', 'unknown'])

/** A calendar quarter, such as `2026-Q2`. */
export const QuarterSchema = z.string().regex(/^\d{4}-Q[1-4]$/)

const CountSchema = z.number().nonnegative().nullable()

// DOSM Quarterly Employment Statistics (#55)

/** The exact statement DOSM's terms of use require: https://www.dosm.gov.my/portal-main/article/term-of-use */
export const DOSM_ATTRIBUTION = 'Data source: Department of Statistics Malaysia'

/** The five broad economic activities QES reports. */
export const QesSectorSchema = z.enum(['agriculture', 'mining_quarrying', 'manufacturing', 'construction', 'services'])
export const QesSkillCategorySchema = z.enum(['skilled', 'semi_skilled', 'low_skilled'])

/** One QES cell: a quarter, a sector (or `all`) and a skill category (or `all`), in thousands of jobs. */
export const DosmQesRowSchema = z
  .object({
    ...SourceSchema.shape,
    attribution: z.literal(DOSM_ATTRIBUTION),
    quarter: QuarterSchema,
    sector: z.union([QesSectorSchema, z.literal('all')]),
    skill_category: z.union([QesSkillCategorySchema, z.literal('all')]),
    unit: z.literal('thousand'),
    jobs: CountSchema,
    filled_jobs: CountSchema,
    vacancies: CountSchema,
    jobs_created: CountSchema,
    vacancy_trend_qoq: TrendDirectionSchema,
    vacancy_trend_yoy: TrendDirectionSchema
  })
  .strict()

/** `data/snapshots/dosm-qes.json` */
export const DosmQesSnapshotSchema = z
  .object({ meta: SnapshotMetaSchema, rows: z.array(DosmQesRowSchema).min(1) })
  .strict()
  .refine(
    (file) => new Set(file.rows.map((r) => `${r.quarter}|${r.sector}|${r.skill_category}`)).size === file.rows.length,
    { message: 'duplicate quarter, sector and skill_category row', path: ['rows'] }
  )

// OpenDOSM series (#63)

export const OpenDosmDatasetIdSchema = z.enum([
  'employment_sector',
  'wages_occupation',
  'wages_skill',
  'lfs_qtr_sru_sex',
  'lfs_qtr_sru_age',
  'lfs_month'
])

/** One API row, split into its text dimensions (such as `sex`, `occupation`) and its numeric values. */
export const OpenDosmRowSchema = z
  .object({
    date: IsoDateSchema,
    dimensions: z.record(z.string().min(1), z.string().min(1)),
    values: z.record(z.string().min(1), z.number().nullable())
  })
  .strict()

/** One OpenDOSM dataset. `vintage_date` is the catalogue's last-updated date; `units` names the unit of each value key. */
export const OpenDosmSeriesSchema = z
  .object({
    ...SourceSchema.shape,
    dataset_id: OpenDosmDatasetIdSchema,
    frequency: z.enum(['monthly', 'quarterly', 'annual']),
    units: z.record(z.string().min(1), z.string().min(1)),
    rows: z.array(OpenDosmRowSchema).min(1)
  })
  .strict()
  .refine((series) => series.rows.every((row) => Object.keys(row.values).every((key) => key in series.units)), {
    message: 'every value key needs a unit',
    path: ['units']
  })

/** `data/snapshots/opendosm.json` */
export const OpenDosmSnapshotSchema = z
  .object({ meta: SnapshotMetaSchema, series: z.array(OpenDosmSeriesSchema).min(1) })
  .strict()
  .refine((file) => new Set(file.series.map((s) => s.dataset_id)).size === file.series.length, {
    message: 'duplicate dataset_id',
    path: ['series']
  })

// TalentCorp MyCOL (#60). MyCOL has no open licence, so the snapshot keeps codes, edition presence and
// citations only; the strict schemas reject titles.

/** A MyCOL edition, such as `2024/25`. */
export const MyColEditionIdSchema = z
  .string()
  .regex(/^\d{4}\/\d{2}$/)
  .refine((id) => (Number(id.slice(0, 4)) + 1) % 100 === Number(id.slice(5)), 'edition must span two consecutive years')

export const MyColEditionSchema = z
  .object({
    ...SourceSchema.shape,
    edition: MyColEditionIdSchema,
    list: z.enum(['national', 'regional']),
    masco_version: z.enum(['MASCO 2008', 'MASCO 2013', 'MASCO 2020']),
    occupation_count: z.number().int().nonnegative().nullable(),
    sector_count: z.number().int().nonnegative().nullable(),
    /** What the edition covered, since list scope changes between editions and raw size is not a vacancy count. */
    scope_note: z.string().min(1)
  })
  .strict()

export const MyColOccupationSchema = z
  .object({
    /** 4-digit MASCO code as printed in the newest edition that lists the occupation. */
    masco_code: z.string().regex(/^\d{4}$/),
    editions: z.array(MyColEditionIdSchema).min(1),
    in_all_editions: z.boolean(),
    /** O*NET occupations whose hand-checked `masco_2020` equals `masco_code`; may be empty. */
    onet_codes: z.array(OnetSocCodeSchema)
  })
  .strict()

/** `data/snapshots/mycol.json` */
export const MyColSchema = z
  .object({
    meta: SnapshotMetaSchema,
    editions: z.array(MyColEditionSchema).min(1),
    occupations: z.array(MyColOccupationSchema).min(1)
  })
  .strict()
  .superRefine((file, ctx) => {
    const editions = new Set(file.editions.map((e) => `${e.edition}|${e.list}`))
    if (editions.size !== file.editions.length) {
      ctx.addIssue({ code: 'custom', message: 'duplicate edition', path: ['editions'] })
    }
    const ids = new Set(file.editions.map((e) => e.edition))
    if (new Set(file.occupations.map((o) => o.masco_code)).size !== file.occupations.length) {
      ctx.addIssue({ code: 'custom', message: 'duplicate masco_code', path: ['occupations'] })
    }
    file.occupations.forEach((occupation, i) => {
      const seen = new Set(occupation.editions)
      if ([...seen].some((id) => !ids.has(id))) {
        ctx.addIssue({ code: 'custom', message: 'unknown edition', path: ['occupations', i, 'editions'] })
      }
      if (occupation.in_all_editions !== [...ids].every((id) => seen.has(id))) {
        ctx.addIssue({ code: 'custom', message: 'in_all_editions disagrees with editions', path: ['occupations', i] })
      }
    })
  })

// Epoch AI frontier context (#66)

export const EpochModelSchema = z
  .object({ model: z.string().min(1), organization: z.string().min(1).nullable(), release_date: IsoDateSchema })
  .strict()

/** `data/snapshots/epoch-context.json`: the one dated line shown beside Economic Index usage, and its numbers. */
export const EpochContextSchema = z
  .object({
    meta: SnapshotMetaSchema,
    headline: z.object({ ...SourceSchema.shape, text: z.string().min(1) }).strict(),
    signals: z.array(SignalSchema).min(1),
    frontier_models: z.array(EpochModelSchema)
  })
  .strict()

export type SnapshotMeta = z.infer<typeof SnapshotMetaSchema>
export type TrendDirection = z.infer<typeof TrendDirectionSchema>
export type Quarter = z.infer<typeof QuarterSchema>
export type QesSector = z.infer<typeof QesSectorSchema>
export type QesSkillCategory = z.infer<typeof QesSkillCategorySchema>
export type DosmQesRow = z.infer<typeof DosmQesRowSchema>
export type DosmQesSnapshot = z.infer<typeof DosmQesSnapshotSchema>
export type OpenDosmDatasetId = z.infer<typeof OpenDosmDatasetIdSchema>
export type OpenDosmRow = z.infer<typeof OpenDosmRowSchema>
export type OpenDosmSeries = z.infer<typeof OpenDosmSeriesSchema>
export type OpenDosmSnapshot = z.infer<typeof OpenDosmSnapshotSchema>
export type MyColEditionId = z.infer<typeof MyColEditionIdSchema>
export type MyColEdition = z.infer<typeof MyColEditionSchema>
export type MyColOccupation = z.infer<typeof MyColOccupationSchema>
export type MyCol = z.infer<typeof MyColSchema>
export type EpochModel = z.infer<typeof EpochModelSchema>
export type EpochContext = z.infer<typeof EpochContextSchema>
