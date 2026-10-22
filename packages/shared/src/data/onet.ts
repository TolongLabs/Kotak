import { z } from 'zod'
import { SourceSchema } from '../engine'

// O*NET identifiers. Work activities form a three-level hierarchy, linked to tasks through DWAs:
// GWA (Generalized Work Activity, 41 Content Model elements such as `4.A.2.a.4`) > IWA (332, `4.A.2.a.4.I09`)
// > DWA (2,087, `4.A.2.a.4.I09.D03`). The issues' "broad work activity" (BWA) is the GWA level.

/** O*NET-SOC 2019 code, such as `15-1252.00`. */
export const OnetSocCodeSchema = z.string().regex(/^\d{2}-\d{4}\.\d{2}$/)
export const OnetTaskIdSchema = z.number().int().positive()
export const OnetGwaIdSchema = z.string().regex(/^4\.A\.\d\.[a-z]\.\d+$/)
export const OnetIwaIdSchema = z.string().regex(/^4\.A\.\d\.[a-z]\.\d+\.I\d{2}$/)
export const OnetDwaIdSchema = z.string().regex(/^4\.A\.\d\.[a-z]\.\d+\.I\d{2}\.D\d{2}$/)
/** ISCO-08 unit group (4 digits) or, where the ESCO crosswalk links only a minor group, 3 digits. */
export const Isco08CodeSchema = z.string().regex(/^\d{3,4}$/)
/** MASCO 2020 unit group. */
export const Masco2020CodeSchema = z.string().regex(/^\d{4}$/)

const IsoDateSchema = z.iso.date()

export const ONET_LICENCE = 'CC BY 4.0'
export const ONET_LICENCE_URL = 'https://creativecommons.org/licenses/by/4.0/'
export const ONET_MODIFICATION_NOTICE =
  'TolongLabs has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.'

/** The fixed O*NET credit line from https://www.onetcenter.org/license_db.html, naming the database version used. */
export function onetCredit(version: string): string {
  return `This page includes information from the O*NET ${version} Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the CC BY 4.0 license. O*NET® is a trademark of USDOL/ETA.`
}

/** CC BY 4.0 attribution that every file holding O*NET-derived content must carry. */
export const OnetAttributionSchema = z
  .object({
    licence: z.literal(ONET_LICENCE),
    licence_url: z.literal(ONET_LICENCE_URL),
    credit: z.string().min(1),
    modification_notice: z.literal(ONET_MODIFICATION_NOTICE)
  })
  .strict()

/** Provenance of a crosswalk joined onto O*NET. `vintage_date` is null where the publisher prints no date. */
export const OnetCrosswalkSourceSchema = z
  .object({
    source_name: z.string().min(1),
    source_url: z.url(),
    vintage_date: IsoDateSchema.nullable(),
    retrieved_date: IsoDateSchema,
    licence: z.string().min(1),
    method: z.string().min(1)
  })
  .strict()

/** Metadata header of every file under `data/onet/`. */
export const OnetMetaSchema = z
  .object({
    ...SourceSchema.shape,
    ...OnetAttributionSchema.shape,
    version: z.string().regex(/^\d+\.\d+$/),
    release_label: z.string().min(1),
    download_url: z.url(),
    retrieved_date: IsoDateSchema,
    modifications: z.array(z.string().min(1)).min(1),
    crosswalks: z.array(OnetCrosswalkSourceSchema)
  })
  .strict()
  .refine((meta) => meta.credit === onetCredit(meta.version), {
    message: 'credit must be the O*NET credit line naming this version',
    path: ['credit']
  })

export const OnetTaskTypeSchema = z.enum(['Core', 'Supplemental'])

export const OnetTaskSchema = z
  .object({
    task_id: OnetTaskIdSchema,
    statement: z.string().min(1),
    /** `null` where O*NET publishes "n/a": the task has no incumbent ratings yet. */
    task_type: OnetTaskTypeSchema.nullable(),
    dwa_ids: z.array(OnetDwaIdSchema).min(1),
    /** The IWAs of `dwa_ids`, unique and sorted. */
    iwa_ids: z.array(OnetIwaIdSchema).min(1)
  })
  .strict()
  .refine(
    (task) => {
      const iwas = [...new Set(task.dwa_ids.map((dwa) => dwa.slice(0, dwa.lastIndexOf('.'))))].sort()
      return iwas.length === task.iwa_ids.length && iwas.every((iwa, i) => iwa === task.iwa_ids[i])
    },
    { message: 'iwa_ids must be the sorted IWAs of dwa_ids', path: ['iwa_ids'] }
  )

export const OnetGwaSchema = z.object({ gwa_id: OnetGwaIdSchema, title: z.string().min(1) }).strict()

export const OnetIwaSchema = z
  .object({ iwa_id: OnetIwaIdSchema, gwa_id: OnetGwaIdSchema, title: z.string().min(1) })
  .strict()
  .refine((iwa) => iwa.iwa_id.startsWith(`${iwa.gwa_id}.`), { message: 'IWA must sit under its GWA', path: ['gwa_id'] })

export const OnetDwaSchema = z
  .object({ dwa_id: OnetDwaIdSchema, iwa_id: OnetIwaIdSchema, title: z.string().min(1) })
  .strict()
  .refine((dwa) => dwa.dwa_id.startsWith(`${dwa.iwa_id}.`), { message: 'DWA must sit under its IWA', path: ['iwa_id'] })

export const OnetRelatednessTierSchema = z.enum(['Primary-Short', 'Primary-Long', 'Supplemental'])

/** One link from O*NET's Related Occupations file; `index` is O*NET's expert-review order (1 is closest). */
export const OnetRelatedOccupationSchema = z
  .object({ onet_code: OnetSocCodeSchema, tier: OnetRelatednessTierSchema, index: z.number().int().positive() })
  .strict()

/** ISCO-08 crosswalk row: an ISCO-08 group and how many ESCO occupations link it to this O*NET occupation. */
export const OnetIsco08LinkSchema = z
  .object({ isco08: Isco08CodeSchema, esco_links: z.number().int().positive() })
  .strict()

/** MASCO 2020 crosswalk row: a hand-checked unit-group match, with the printed MASCO 2020 PDF page that lists it. */
export const OnetMascoMatchSchema = z
  .object({
    onet_code: OnetSocCodeSchema,
    masco_2020: Masco2020CodeSchema,
    masco_pdf_page: z.number().int().positive()
  })
  .strict()

export const OnetOccupationSchema = z
  .object({
    onet_code: OnetSocCodeSchema,
    title: z.string().min(1),
    description: z.string().min(1),
    /** Set only for a hand-checked 1-to-1 match; otherwise null with `masco_unmatched: true`. */
    masco_2020: Masco2020CodeSchema.nullable(),
    masco_unmatched: z.boolean(),
    /** Sorted by `esco_links`, most first. */
    isco08: z.array(OnetIsco08LinkSchema),
    /** Sorted by `index`. */
    related: z.array(OnetRelatedOccupationSchema)
  })
  .strict()
  .refine((occupation) => occupation.masco_unmatched === (occupation.masco_2020 === null), {
    message: 'masco_unmatched must be true exactly when masco_2020 is null',
    path: ['masco_unmatched']
  })
  .refine(
    (occupation) =>
      occupation.masco_2020 === null || occupation.isco08.some((link) => link.isco08 === occupation.masco_2020),
    { message: 'masco_2020 must be one of the occupation’s ISCO-08 crosswalk groups', path: ['masco_2020'] }
  )

function uniqueBy<T>(rows: T[], key: (row: T) => string): boolean {
  return new Set(rows.map(key)).size === rows.length
}

/** `data/onet/occupations.json` */
export const OnetOccupationsFileSchema = z
  .object({ meta: OnetMetaSchema, occupations: z.array(OnetOccupationSchema).min(1) })
  .strict()
  .refine((file) => uniqueBy(file.occupations, (o) => o.onet_code), {
    message: 'duplicate onet_code',
    path: ['occupations']
  })

/** `data/onet/tasks.json`: each occupation's task statements, keyed by O*NET-SOC code. */
export const OnetTasksFileSchema = z
  .object({ meta: OnetMetaSchema, tasks: z.record(OnetSocCodeSchema, z.array(OnetTaskSchema).min(1)) })
  .strict()

/** `data/onet/work-activities.json`: the GWA > IWA > DWA reference. */
export const OnetWorkActivitiesFileSchema = z
  .object({
    meta: OnetMetaSchema,
    gwas: z.array(OnetGwaSchema).min(1),
    iwas: z.array(OnetIwaSchema).min(1),
    dwas: z.array(OnetDwaSchema).min(1)
  })
  .strict()
  .refine(
    (file) => {
      const gwas = new Set(file.gwas.map((g) => g.gwa_id))
      const iwas = new Set(file.iwas.map((i) => i.iwa_id))
      return file.iwas.every((i) => gwas.has(i.gwa_id)) && file.dwas.every((d) => iwas.has(d.iwa_id))
    },
    { message: 'every IWA and DWA must reference a listed parent' }
  )

export const OnetTitleKindSchema = z.enum(['title', 'alternate', 'short'])

/** `[search key, O*NET-SOC code, title as published, kind]`; the key comes from `normalizeTitle` in `title-lookup.ts`. */
export const OnetTitleEntrySchema = z.tuple([
  z.string().min(1),
  OnetSocCodeSchema,
  z.string().min(1),
  OnetTitleKindSchema
])

/** `[O*NET-SOC code, occupation title, MASCO 2020 code or null]` */
export const OnetTitleOccupationSchema = z.tuple([OnetSocCodeSchema, z.string().min(1), Masco2020CodeSchema.nullable()])

/** `data/onet/title-index.json`: titles, alternate titles and short titles, sorted by key for binary search. */
export const OnetTitleIndexSchema = z
  .object({
    meta: OnetMetaSchema,
    key_version: z.number().int().positive(),
    occupations: z.array(OnetTitleOccupationSchema).min(1),
    entries: z.array(OnetTitleEntrySchema).min(1)
  })
  .strict()
  .superRefine((index, ctx) => {
    const codes = new Set(index.occupations.map(([code]) => code))
    index.entries.forEach(([key, code], i) => {
      const previous = index.entries[i - 1]
      if (previous && previous[0] > key) {
        ctx.addIssue({ code: 'custom', message: 'entries must be sorted by key', path: ['entries', i] })
      }
      if (!codes.has(code)) {
        ctx.addIssue({ code: 'custom', message: `unknown onet_code ${code}`, path: ['entries', i] })
      }
    })
  })

export type OnetSocCode = z.infer<typeof OnetSocCodeSchema>
export type OnetAttribution = z.infer<typeof OnetAttributionSchema>
export type OnetCrosswalkSource = z.infer<typeof OnetCrosswalkSourceSchema>
export type OnetMeta = z.infer<typeof OnetMetaSchema>
export type OnetTaskType = z.infer<typeof OnetTaskTypeSchema>
export type OnetTask = z.infer<typeof OnetTaskSchema>
export type OnetGwa = z.infer<typeof OnetGwaSchema>
export type OnetIwa = z.infer<typeof OnetIwaSchema>
export type OnetDwa = z.infer<typeof OnetDwaSchema>
export type OnetRelatednessTier = z.infer<typeof OnetRelatednessTierSchema>
export type OnetRelatedOccupation = z.infer<typeof OnetRelatedOccupationSchema>
export type OnetIsco08Link = z.infer<typeof OnetIsco08LinkSchema>
export type OnetMascoMatch = z.infer<typeof OnetMascoMatchSchema>
export type OnetOccupation = z.infer<typeof OnetOccupationSchema>
export type OnetOccupationsFile = z.infer<typeof OnetOccupationsFileSchema>
export type OnetTasksFile = z.infer<typeof OnetTasksFileSchema>
export type OnetWorkActivitiesFile = z.infer<typeof OnetWorkActivitiesFileSchema>
export type OnetTitleKind = z.infer<typeof OnetTitleKindSchema>
export type OnetTitleEntry = z.infer<typeof OnetTitleEntrySchema>
export type OnetTitleOccupation = z.infer<typeof OnetTitleOccupationSchema>
export type OnetTitleIndex = z.infer<typeof OnetTitleIndexSchema>
