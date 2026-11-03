import { z } from 'zod'

// DOSM Big Data Analytics: Job Market Insights (#52). Quarterly online job offerings by MASCO major group
// and by the top roles each release names. DOSM copyright: store only the figures needed, each cited.

export const DOSM_JMI_SOURCE_NAME = 'DOSM Big Data Analytics: Job Market Insights'

export const DOSM_JMI_ATTRIBUTION =
  'Data source: Department of Statistics Malaysia. © Department of Statistics Malaysia (DOSM), all rights reserved.'

// Same threshold as the engine's AI-use rule: a change of more than 5% either way is a direction.
export const JMI_DIRECTION_THRESHOLD_PCT = 5

export const JmiDirectionSchema = z.enum(['up', 'flat', 'down'])
export type JmiDirection = z.infer<typeof JmiDirectionSchema>

export function jmiDirection(changePct: number): JmiDirection {
  if (changePct > JMI_DIRECTION_THRESHOLD_PCT) return 'up'
  if (changePct < -JMI_DIRECTION_THRESHOLD_PCT) return 'down'
  return 'flat'
}

export const JmiDirectionBasisSchema = z.enum([
  'qoq-and-yoy-agree',
  'qoq-and-yoy-disagree',
  'qoq-only',
  'yoy-only',
  'no-comparison'
])

// Verdict input: quarter-on-quarter and year-on-year must agree; when they disagree the demand is flat.
// With only one comparison available, that one decides. With none, the direction is unknown (null).
export function combineJmiDirections(
  qoq: JmiDirection | null,
  yoy: JmiDirection | null
): { direction: JmiDirection | null; basis: z.infer<typeof JmiDirectionBasisSchema> } {
  if (qoq && yoy)
    return qoq === yoy
      ? { direction: qoq, basis: 'qoq-and-yoy-agree' }
      : { direction: 'flat', basis: 'qoq-and-yoy-disagree' }
  if (qoq) return { direction: qoq, basis: 'qoq-only' }
  if (yoy) return { direction: yoy, basis: 'yoy-only' }
  return { direction: null, basis: 'no-comparison' }
}

export const JmiQuarterSchema = z.string().regex(/^\d{4}-Q[1-4]$/)

export function shiftJmiQuarter(quarter: string, by: number): string {
  const [year, q] = quarter.split('-Q').map(Number)
  const index = year * 4 + (q - 1) + by
  return `${Math.floor(index / 4)}-Q${(index % 4) + 1}`
}

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const JmiChangeSchema = z
  .object({
    from_quarter: JmiQuarterSchema,
    change_pct: z.number(),
    direction: JmiDirectionSchema
  })
  .strict()
  .refine((change) => change.direction === jmiDirection(change.change_pct), {
    message: `direction must follow the ${JMI_DIRECTION_THRESHOLD_PCT}% rule`
  })

const figureShape = {
  metric: z.literal('online_job_offerings'),
  // null when DOSM prints "-" or leaves the cell blank, or names a role without its count. Never 0 for missing.
  value: z.number().int().nonnegative().nullable(),
  quarter: JmiQuarterSchema,
  quarter_label: z.string().regex(/^Q[1-4] \d{4}$/),
  source_name: z.string().min(1),
  source_url: z.string().url(),
  release_title: z.string().min(1),
  vintage_date: DateSchema,
  geo_or_layer: z.enum(['MYS/total', 'MYS/L2', 'MYS/L3']),
  attribution: z.string().includes('Department of Statistics Malaysia'),
  qoq: JmiChangeSchema.nullable(),
  yoy: JmiChangeSchema.nullable()
}

type FigureShape = { [K in keyof typeof figureShape]: z.infer<(typeof figureShape)[K]> }

function checkFigure(figure: FigureShape, ctx: z.RefinementCtx) {
  const [year, q] = figure.quarter.split('-')
  if (figure.quarter_label !== `${q} ${year}`)
    ctx.addIssue({ code: 'custom', message: 'quarter_label must match quarter' })
  if (figure.qoq && figure.qoq.from_quarter !== shiftJmiQuarter(figure.quarter, -1))
    ctx.addIssue({ code: 'custom', message: 'qoq must compare with the previous quarter' })
  if (figure.yoy && figure.yoy.from_quarter !== shiftJmiQuarter(figure.quarter, -4))
    ctx.addIssue({ code: 'custom', message: 'yoy must compare with the same quarter a year earlier' })
  if (figure.value === null && (figure.qoq || figure.yoy))
    ctx.addIssue({ code: 'custom', message: 'a figure without a value has no change' })
}

export const DosmFigureSchema = z.object(figureShape).strict().superRefine(checkFigure)

export const DosmRoleFigureSchema = z
  .object({ ...figureShape, rank: z.number().int().min(1).max(10) })
  .strict()
  .superRefine(checkFigure)

export const JmiLatestSchema = z
  .object({
    quarter: JmiQuarterSchema,
    direction: JmiDirectionSchema.nullable(),
    basis: JmiDirectionBasisSchema
  })
  .strict()

const MascoMajorGroupSchema = z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9'])

function checkSeries(series: { points: FigureShape[]; latest: z.infer<typeof JmiLatestSchema> }, ctx: z.RefinementCtx) {
  const quarters = series.points.map((point) => point.quarter)
  if (quarters.some((quarter, i) => i > 0 && quarter <= quarters[i - 1]))
    ctx.addIssue({ code: 'custom', message: 'points must be in strictly increasing quarter order' })
  const point = series.points.find((p) => p.quarter === series.latest.quarter)
  if (!point) return ctx.addIssue({ code: 'custom', message: 'latest.quarter must be one of the points' })
  const expected = combineJmiDirections(point.qoq?.direction ?? null, point.yoy?.direction ?? null)
  if (expected.direction !== series.latest.direction || expected.basis !== series.latest.basis)
    ctx.addIssue({ code: 'custom', message: 'latest must combine the point’s qoq and yoy directions' })
}

export const DosmMajorGroupSeriesSchema = z
  .object({
    // null for DOSM's "Unclassified" row, which has no MASCO major group.
    masco_major_group: MascoMajorGroupSchema.nullable(),
    name: z.string().min(1),
    points: z.array(DosmFigureSchema).min(1),
    latest: JmiLatestSchema
  })
  .strict()
  .superRefine(checkSeries)

export const DosmNamedRoleSeriesSchema = z
  .object({
    name: z.string().min(1),
    // Only codes a DOSM release prints next to the role; null otherwise.
    masco_code: z
      .string()
      .regex(/^\d{4}$/)
      .nullable(),
    masco_major_group: MascoMajorGroupSchema.nullable(),
    masco_source: z
      .object({ release_title: z.string().min(1), source_url: z.string().url(), quarter: JmiQuarterSchema })
      .strict()
      .nullable(),
    // Only when the DOSM title equals an O*NET 30.1 occupation title or alternate title; null otherwise.
    onet_soc_code: z
      .string()
      .regex(/^\d{2}-\d{4}\.\d{2}$/)
      .nullable(),
    onet_title: z.string().nullable(),
    onet_match: z.enum(['occupation-title', 'alternate-title', 'none']),
    onet_note: z.string().min(1),
    points: z.array(DosmRoleFigureSchema).min(1),
    latest: JmiLatestSchema
  })
  .strict()
  .superRefine(checkSeries)

export const DosmReleaseSchema = z
  .object({
    title: z.string().min(1),
    url: z.string().url(),
    pdf_url: z.string().url(),
    release_date: DateSchema,
    quarters: z.array(JmiQuarterSchema).min(1),
    named_roles: z.enum(['with-counts', 'names-only', 'not-found']),
    total_in_release_text: z.boolean()
  })
  .strict()

export const DosmDemandSchema = z
  .object({
    dataset: z.literal('dosm-jmi'),
    source_name: z.literal(DOSM_JMI_SOURCE_NAME),
    publisher: z.literal('Department of Statistics Malaysia (DOSM)'),
    licence: z.string().min(1),
    attribution: z.literal(DOSM_JMI_ATTRIBUTION),
    retrieved_date: DateSchema,
    first_quarter: JmiQuarterSchema,
    last_quarter: JmiQuarterSchema,
    direction_rule: z
      .object({
        threshold_pct: z.literal(JMI_DIRECTION_THRESHOLD_PCT),
        comparisons: z.tuple([z.literal('qoq'), z.literal('yoy')]),
        verdict_input: z.string().min(1)
      })
      .strict(),
    releases: z.array(DosmReleaseSchema).min(1),
    totals: z.array(DosmFigureSchema).min(1),
    major_groups: z.array(DosmMajorGroupSeriesSchema).min(1),
    named_roles: z.array(DosmNamedRoleSeriesSchema),
    missing: z.array(
      z
        .object({
          quarter: JmiQuarterSchema,
          part: z.enum(['named_roles', 'named_role_counts']),
          reason: z.string().min(1)
        })
        .strict()
    ),
    notes: z.array(z.string().min(1))
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    const expected: string[] = []
    for (let q = snapshot.first_quarter; q <= snapshot.last_quarter; q = shiftJmiQuarter(q, 1)) expected.push(q)
    if (snapshot.totals.map((total) => total.quarter).join() !== expected.join())
      ctx.addIssue({ code: 'custom', message: 'totals must cover every quarter from first_quarter to last_quarter' })
    const layers: [string, { geo_or_layer: string }[]][] = [
      ['MYS/total', snapshot.totals],
      ['MYS/L2', snapshot.major_groups.flatMap((group) => group.points)],
      ['MYS/L3', snapshot.named_roles.flatMap((role) => role.points)]
    ]
    for (const [layer, figures] of layers)
      if (figures.some((figure) => figure.geo_or_layer !== layer))
        ctx.addIssue({ code: 'custom', message: `figures in this part must have geo_or_layer ${layer}` })
  })

export type DosmFigure = z.infer<typeof DosmFigureSchema>
export type DosmRoleFigure = z.infer<typeof DosmRoleFigureSchema>
export type JmiChange = z.infer<typeof JmiChangeSchema>
export type JmiLatest = z.infer<typeof JmiLatestSchema>
export type DosmMajorGroupSeries = z.infer<typeof DosmMajorGroupSeriesSchema>
export type DosmNamedRoleSeries = z.infer<typeof DosmNamedRoleSeriesSchema>
export type DosmRelease = z.infer<typeof DosmReleaseSchema>
export type DosmDemand = z.infer<typeof DosmDemandSchema>
