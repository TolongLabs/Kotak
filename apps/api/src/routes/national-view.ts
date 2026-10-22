import {
  NationalCheckupRequestSchema,
  NationalCheckupResponseSchema,
  NationalViewSummaryRequestSchema,
  NationalViewSummaryResponseSchema,
  type NationalViewGroup,
  type NationalViewSummaryRequest
} from '@kotak/shared'
import { neon } from '@neondatabase/serverless'
import { Hono, type Context } from 'hono'
import { sampleCheckups } from '../../db/sample-checkups'
import { fail } from '../ai/errors'
import { getConfig } from '../config'

// A role shows real averages only from this many real check-ups; sample rows never count (#34).
// Privacy against differencing (reading the summary before and after one post):
// - Real averages cover only whole blocks of 10 rows in insertion order, so a post changes nothing until it
//   completes a block, and checkup_count is that block floor (10, 20, ...), never the exact count.
// - Averages are rounded to one decimal.
// Residual risk: this is k-anonymity with k = 10, nothing stronger. POST /checkups is open to anyone, with no
// sign-in, rate limit or abuse protection, so someone who posts 9 rows of their own can still read the 10th
// row of a block from the change. Fixing that needs authenticated posts or noise, not more rounding.
const PRIVACY_THRESHOLD = 10
const DATABASE_TIMEOUT_MS = 5_000
const CORNERS = [0, 1, 2, 3, 4, 5]

// O*NET job families are the SOC 2018 major groups, named by a role code's first two digits.
const OCCUPATION_GROUP_TITLES: Record<string, string> = {
  '11': 'Management',
  '13': 'Business and Financial Operations',
  '15': 'Computer and Mathematical',
  '17': 'Architecture and Engineering',
  '19': 'Life, Physical, and Social Science',
  '21': 'Community and Social Service',
  '23': 'Legal',
  '25': 'Educational Instruction and Library',
  '27': 'Arts, Design, Entertainment, Sports, and Media',
  '29': 'Healthcare Practitioners and Technical',
  '31': 'Healthcare Support',
  '33': 'Protective Service',
  '35': 'Food Preparation and Serving Related',
  '37': 'Building and Grounds Cleaning and Maintenance',
  '39': 'Personal Care and Service',
  '41': 'Sales and Related',
  '43': 'Office and Administrative Support',
  '45': 'Farming, Fishing, and Forestry',
  '47': 'Construction and Extraction',
  '49': 'Installation, Maintenance, and Repair',
  '51': 'Production',
  '53': 'Transportation and Material Moving',
  '55': 'Military Specific'
}

type RoleAggregate = {
  onet_role_code: string
  is_sample: boolean
  checkup_count: number
  average_corner_levels: number[]
}

// Real rows count only in whole blocks of PRIVACY_THRESHOLD by id, so fewer than 10 never leave the database.
const SUMMARY_SQL = `
  WITH ranked AS (
    SELECT onet_role_code, is_sample, corner_levels,
      row_number() OVER (PARTITION BY onet_role_code, is_sample ORDER BY id) AS position,
      count(*) OVER (PARTITION BY onet_role_code, is_sample) AS total
    FROM national_checkups
  )
  SELECT onet_role_code, is_sample, COUNT(*)::int AS checkup_count,
    ARRAY[${CORNERS.map((corner) => `ROUND(AVG((corner_levels->>${corner})::numeric), 1)::float8`).join(', ')}]
      AS average_corner_levels
  FROM ranked
  WHERE is_sample OR position <= total - total % ${PRIVACY_THRESHOLD}
  GROUP BY onet_role_code, is_sample`

const database = (context: Context) => {
  const url = getConfig(context, 'DATABASE_URL')
  return url ? neon(url, { fetchOptions: { signal: AbortSignal.timeout(DATABASE_TIMEOUT_MS) } }) : undefined
}

const databaseAggregates = async (context: Context) => {
  const sql = database(context)
  if (!sql) return undefined
  try {
    return (await sql.query(SUMMARY_SQL)) as RoleAggregate[]
  } catch (error) {
    console.error('National view summary failed:', error instanceof Error ? error.message : error)
    return undefined
  }
}

// The same averages the database would give for the seeded sample rows.
const sampleAggregates = (): RoleAggregate[] => {
  const rows = sampleCheckups()
  return [...new Set(rows.map((row) => row.onet_role_code))].map((onet_role_code) => {
    const levels = rows.filter((row) => row.onet_role_code === onet_role_code).map((row) => row.corner_levels)
    return {
      onet_role_code,
      is_sample: true,
      checkup_count: levels.length,
      average_corner_levels: CORNERS.map(
        (corner) => Math.round((levels.reduce((sum, row) => sum + row[corner], 0) / levels.length) * 10) / 10
      )
    }
  })
}

const toGroups = (aggregates: RoleAggregate[], filter: NationalViewSummaryRequest): NationalViewGroup[] =>
  [...new Set(aggregates.map((row) => row.onet_role_code))].sort().flatMap((onet_role_code) => {
    const occupation_group = `${onet_role_code.slice(0, 2)}-0000`
    if (filter.onet_role_code && filter.onet_role_code !== onet_role_code) return []
    if (filter.occupation_group && filter.occupation_group !== occupation_group) return []
    const real = aggregates.find((row) => row.onet_role_code === onet_role_code && !row.is_sample)
    const sample = aggregates.find((row) => row.onet_role_code === onet_role_code && row.is_sample)
    const shown = real && real.checkup_count >= PRIVACY_THRESHOLD ? real : sample
    if (!shown) return []
    return [
      {
        onet_role_code,
        occupation_group,
        occupation_group_title: OCCUPATION_GROUP_TITLES[onet_role_code.slice(0, 2)] ?? 'Other',
        average_corner_levels: shown.average_corner_levels,
        checkup_count: shown.checkup_count,
        is_sample: shown.is_sample
      }
    ]
  })

export const nationalView = new Hono()

nationalView.post('/checkups', async (context) => {
  const checkup = NationalCheckupRequestSchema.safeParse(await context.req.json().catch(() => undefined))
  if (!checkup.success) {
    return fail(context, 400, 'invalid_request', 'Send only onet_role_code and 6 corner_levels from 0 to 3.')
  }
  const sql = database(context)
  if (!sql) return fail(context, 503, 'national_view_unavailable', 'The national view database is not set up.')
  try {
    await sql.query('INSERT INTO national_checkups (onet_role_code, corner_levels) VALUES ($1, $2::jsonb)', [
      checkup.data.onet_role_code,
      JSON.stringify(checkup.data.corner_levels)
    ])
  } catch (error) {
    console.error('National view insert failed:', error instanceof Error ? error.message : error)
    return fail(context, 503, 'national_view_unavailable', 'The check-up was not recorded. Try again later.')
  }
  return context.json(NationalCheckupResponseSchema.parse({ recorded: true }), 201)
})

// When the database is unset or unreachable, the view shows the built-in sample rows, never an error.
nationalView.get('/summary', async (context) => {
  const filter = NationalViewSummaryRequestSchema.safeParse(context.req.query())
  if (!filter.success) {
    return fail(context, 400, 'invalid_request', 'Filter by occupation_group (15-0000) or onet_role_code (15-1254.00).')
  }
  const aggregates = await databaseAggregates(context)
  const response = NationalViewSummaryResponseSchema.parse({
    groups: toGroups(aggregates ?? sampleAggregates(), filter.data),
    database_available: aggregates !== undefined
  })
  return context.json(response)
})
