import { z } from 'zod'
import { SnapshotIdSchema, SourceSchema, type Signal, type Source } from '../engine'

// Anthropic Economic Index snapshots (#50): one file per calendar month, filtered from a release CSV
// to Malaysia, Singapore and worldwide. Every number sits in a table that carries `source_name`,
// `source_url`, `vintage_date` (the first day of the data month) and `geo_or_layer` (`<geo>/<level>`),
// so each value inherits its provenance from exactly one table (#40).

export const AeiGeoSchema = z.enum(['MYS', 'SGP', 'GLOBAL'])

// Levels of the AI-use fallback chain, finest first. Each level is one `category_name` and
// `hierarchy_level` pair in the release, and its row keys join to O*NET 30.1 as noted.
export const AeiLevelSchema = z.enum([
  'task', // onet level 0: O*NET Task ID, as in Task Statements ("2408")
  'dwa', // onet level 1: DWA ID, as in DWA Reference ("4.A.4.b.6.I05.D10")
  'iwa', // onet level 2: IWA ID, as in IWA Reference ("4.A.3.b.6.I01")
  'gwa', // onet level 3: work activity Element ID, as in Content Model Reference ("4.A.1.a.1")
  'occupation', // soc_occupation level 0: O*NET-SOC 2019 code, as in Occupation Data ("15-1252.00")
  'major_group' // soc_occupation level 1: the first two digits of the SOC code ("15")
])

const NODE_ID_PATTERNS: Record<AeiLevel, RegExp> = {
  task: /^\d+$/,
  dwa: /^4\.A\.\d+\.[a-z]\.\d+\.I\d+\.D\d+$/,
  iwa: /^4\.A\.\d+\.[a-z]\.\d+\.I\d+$/,
  gwa: /^4\.A\.\d+\.[a-z]\.\d+$/,
  occupation: /^\d{2}-\d{4}\.\d{2}$/,
  major_group: /^\d{2}$/
}

// The columns of every row, in order. `pct` is the node's share of the geography's usage in that
// category. Where the release does not publish a metric for a geography and level, the cell is null:
// for MYS and SGP it publishes only `pct` at task, DWA, IWA and occupation level.
export const AEI_METRICS = [
  'pct',
  'collaboration_bucket_automation_pct',
  'collaboration_bucket_augmentation_pct',
  'human_only_time_mean',
  'human_with_ai_time_mean'
] as const

export const AEI_UNITS = {
  pct: 'percent',
  collaboration_bucket_automation_pct: 'percent',
  collaboration_bucket_augmentation_pct: 'percent',
  human_only_time_mean: 'hours',
  human_with_ai_time_mean: 'minutes'
} as const

export const AeiMetricSchema = z.enum(AEI_METRICS)

// Published values are rounded to two decimals, so a published 0 means "under 0.005".
// A suppressed cell is null, never 0.
const PercentSchema = z.number().min(0).max(100).nullable()
const MeanTimeSchema = z.number().min(0).nullable()

const AeiRowSchema = z.tuple([PercentSchema, PercentSchema, PercentSchema, MeanTimeSchema, MeanTimeSchema])

// A node absent from `rows` was not published for that geography and month: read it as null.
export const AeiTableSchema = SourceSchema.extend({
  rows: z.record(z.string().min(1), AeiRowSchema)
})

export const AeiOverallSchema = SourceSchema.extend({
  usage_pct: PercentSchema,
  usage_per_capita_index: z.number().min(0).nullable(),
  collaboration_bucket_automation_pct: PercentSchema,
  collaboration_bucket_augmentation_pct: PercentSchema,
  human_only_time_mean: MeanTimeSchema,
  human_with_ai_time_mean: MeanTimeSchema
})

const AeiGeoSnapshotSchema = z
  .object({
    overall: AeiOverallSchema,
    levels: z.record(AeiLevelSchema, AeiTableSchema)
  })
  .strict()

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const nextMonthStart = (snapshotId: string) => {
  const [year, month] = snapshotId.split('-').map(Number)
  return month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`
}

export const AeiSnapshotSchema = z
  .object({
    snapshot_id: SnapshotIdSchema,
    period: z.object({ date_start: DateSchema, date_end: DateSchema }).strict(),
    release: z
      .object({
        repo: z.literal('Anthropic/EconomicIndex'),
        revision: z.string().regex(/^[0-9a-f]{40}$/),
        path: z.string().min(1),
        release_date: DateSchema,
        sha256: z.string().regex(/^[0-9a-f]{64}$/),
        retrieved_on: DateSchema,
        licence: z.string().min(1)
      })
      .strict(),
    metrics: z
      .array(AeiMetricSchema)
      .refine((metrics) => metrics.join() === AEI_METRICS.join(), `metrics must be ${AEI_METRICS.join(', ')}`),
    units: z
      .record(AeiMetricSchema, z.string())
      .refine((units) => AEI_METRICS.every((metric) => units[metric] === AEI_UNITS[metric]), 'units do not match'),
    labels: z.record(AeiLevelSchema, z.record(z.string().min(1), z.string().min(1))),
    geos: z.record(AeiGeoSchema, AeiGeoSnapshotSchema)
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    const issue = (message: string, path: PropertyKey[]) => ctx.addIssue({ code: 'custom', message, path })
    const { date_start, date_end } = snapshot.period
    if (date_start !== `${snapshot.snapshot_id}-01`) issue('must be the month start', ['period', 'date_start'])
    if (date_end !== nextMonthStart(snapshot.snapshot_id)) issue('must be the next month start', ['period', 'date_end'])
    const checkSource = (source: Source, layer: string, path: PropertyKey[]) => {
      if (source.vintage_date !== date_start) issue(`must be ${date_start}`, [...path, 'vintage_date'])
      if (source.geo_or_layer !== layer) issue(`must be ${layer}`, [...path, 'geo_or_layer'])
    }
    for (const geo of AeiGeoSchema.options) {
      const { overall, levels } = snapshot.geos[geo]
      checkSource(overall, `${geo}/overall`, ['geos', geo, 'overall'])
      for (const level of AeiLevelSchema.options) {
        const path = ['geos', geo, 'levels', level]
        checkSource(levels[level], `${geo}/${level}`, path)
        for (const id of Object.keys(levels[level].rows)) {
          if (!NODE_ID_PATTERNS[level].test(id)) issue(`not a ${level} ID`, [...path, 'rows', id])
          if (!snapshot.labels[level][id]) issue(`no label for ${level} ${id}`, ['labels', level, id])
        }
      }
    }
  })

export type AeiGeo = z.infer<typeof AeiGeoSchema>
export type AeiLevel = z.infer<typeof AeiLevelSchema>
export type AeiMetric = z.infer<typeof AeiMetricSchema>
export type AeiTable = z.infer<typeof AeiTableSchema>
export type AeiOverall = z.infer<typeof AeiOverallSchema>
export type AeiSnapshot = z.infer<typeof AeiSnapshotSchema>

// One cell as an engine signal, with the provenance of its table. A suppressed or unpublished cell
// returns value null, so the caller falls back to the next level or geography.
export function aeiSignal(snapshot: AeiSnapshot, geo: AeiGeo, level: AeiLevel, id: string, metric: AeiMetric): Signal {
  const { rows, ...source } = snapshot.geos[geo].levels[level]
  return { metric, value: rows[id]?.[AEI_METRICS.indexOf(metric)] ?? null, ...source }
}
