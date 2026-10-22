// Filters the Anthropic Economic Index release CSV into dated monthly snapshots for MYS, SGP and
// GLOBAL (#50), validates them with AeiSnapshotSchema and prints a verification summary.
// Run with `bun run ingest:aei`. The 219 MB CSV is cached in .cache/aei/ and never committed.
import { createReadStream } from 'node:fs'
import { mkdir, rename } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { createInterface } from 'node:readline'
import { format, resolveConfig } from 'prettier'
import { SnapshotIdSchema, type SnapshotId } from '../../packages/shared/src/engine'
import {
  AEI_METRICS,
  AEI_UNITS,
  AeiGeoSchema,
  AeiLevelSchema,
  AeiSnapshotSchema,
  type AeiGeo,
  type AeiLevel,
  type AeiMetric,
  type AeiSnapshot
} from '../../packages/shared/src/data/aei'

const REPO = 'Anthropic/EconomicIndex'
// `main` when retrieved on 2026-10-22. Pinned so every run reads the same bytes.
const REVISION = '4e5f69fab13a9c3f7d0dcc31a6f893a9818738f6'
// Earlier releases are not used: they are one-week samples keyed by task text, with privacy-filtered cells kept in
// the denominator and no work-activity or occupation rows, and their shares do not line up with this release's.
const FILE = 'release_2026_06_26/data/aei_claude_ai_2026-06-26.csv'
const RELEASE_DATE = '2026-06-26'
const SOURCE_NAME = 'Anthropic Economic Index, release 2026-06-26 (Claude.ai)'
const SOURCE_URL = `https://huggingface.co/datasets/${REPO}/blob/${REVISION}/${FILE}`
// The dataset README says "Data released under CC-BY, code released under MIT License".
const LICENCE = 'CC-BY (data), MIT (code)'
// The May 2026 anchors in kymil4's notes, which TRD.md asks this script to re-check.
const NOTED_MAY_INDEX = { MYS: 0.87, SGP: 5.81 }
const MAX_BYTES = 2 * 1024 * 1024

const ROOT = join(import.meta.dir, '../..')
const CACHE_DIR = join(ROOT, '.cache/aei', REVISION)
const OUT_DIR = join(ROOT, 'data/snapshots/aei')

const COLUMNS =
  'date_start,date_end,geo_id,geo_level,category_name,hierarchy_level,metric_id,value,node_name,node_external_id'
const LEVELS: Record<string, AeiLevel> = {
  'onet/0': 'task',
  'onet/1': 'dwa',
  'onet/2': 'iwa',
  'onet/3': 'gwa',
  'soc_occupation/0': 'occupation',
  'soc_occupation/1': 'major_group'
}
const OVERALL_METRICS = ['usage_pct', 'usage_per_capita_index', ...AEI_METRICS.slice(1)] as const
const GEO_LEVEL: Record<AeiGeo, string> = { MYS: 'country', SGP: 'country', GLOBAL: 'global' }

type Row = (number | null)[]
type Month = {
  overall: Record<AeiGeo, Record<string, number>>
  rows: Record<AeiGeo, Record<AeiLevel, Map<string, Row>>>
  labels: Record<AeiLevel, Map<string, string>>
}

// Follows the Hub rate-limit guidance: on HTTP 429, wait until the reset time in the RateLimit header.
async function hubFetch(url: string, init?: RequestInit): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, init)
    if (response.status !== 429 || attempt === 3) return response
    const seconds = Number(/t=(\d+)/.exec(response.headers.get('ratelimit') ?? '')?.[1] ?? 60)
    console.warn(`Hugging Face rate limit reached, retrying in ${seconds} s`)
    await Bun.sleep(seconds * 1000)
  }
}

async function sha256(path: string): Promise<string> {
  const hasher = new Bun.CryptoHasher('sha256')
  for await (const chunk of Bun.file(path).stream()) hasher.update(chunk)
  return hasher.digest('hex')
}

// A cache hit makes no request. A miss makes one resolver request; the file itself comes from the
// CDN it redirects to, and its sha256 must match the X-Linked-Etag the Hub sends with the redirect.
async function download(): Promise<{ path: string; sha256: string; retrieved_on: string }> {
  const path = join(CACHE_DIR, FILE.split('/').pop()!)
  const meta = Bun.file(`${path}.json`)
  if (await meta.exists()) {
    const cached = await meta.json()
    if ((await sha256(path)) === cached.sha256) return { path, ...cached }
    console.warn('The cached CSV does not match its recorded sha256, downloading it again')
  }
  const resolveUrl = `https://huggingface.co/datasets/${REPO}/resolve/${REVISION}/${FILE}`
  const redirect = await hubFetch(resolveUrl, { redirect: 'manual' })
  const expected = redirect.headers.get('x-linked-etag')?.replaceAll('"', '')
  const location = redirect.headers.get('location')
  if (!expected || !location) throw new Error(`Unexpected HTTP ${redirect.status} from ${resolveUrl}`)
  console.log(`Downloading ${FILE} (${redirect.headers.get('x-linked-size')} bytes)`)
  const response = await fetch(new URL(location, resolveUrl))
  if (!response.ok || !response.body) throw new Error(`Download failed with HTTP ${response.status}`)
  await mkdir(CACHE_DIR, { recursive: true })
  const hasher = new Bun.CryptoHasher('sha256')
  const writer = Bun.file(`${path}.part`).writer()
  for await (const chunk of response.body) {
    hasher.update(chunk)
    writer.write(chunk)
  }
  await writer.end()
  const actual = hasher.digest('hex')
  if (actual !== expected) throw new Error(`sha256 mismatch: expected ${expected}, got ${actual}`)
  await rename(`${path}.part`, path)
  const record = { sha256: actual, retrieved_on: new Date().toISOString().slice(0, 10) }
  await Bun.write(meta, JSON.stringify(record))
  return { path, ...record }
}

// One CSV record per line (the release has no embedded newlines), with RFC 4180 quoting.
function parseLine(line: string): string[] {
  const fields: string[] = []
  let i = 0
  while (i <= line.length) {
    if (line[i] !== '"') {
      const comma = line.indexOf(',', i)
      const end = comma < 0 ? line.length : comma
      fields.push(line.slice(i, end))
      i = end + 1
      continue
    }
    let field = ''
    i++
    for (;;) {
      const quote = line.indexOf('"', i)
      if (quote < 0) throw new Error(`Unterminated quote: ${line}`)
      field += line.slice(i, quote)
      i = quote + 1
      if (line[i] !== '"') break
      field += '"'
      i++
    }
    if (i < line.length && line[i] !== ',') throw new Error(`Bad quoting: ${line}`)
    fields.push(field)
    i++
  }
  return fields
}

const nextMonthStart = (snapshotId: SnapshotId) => {
  const [year, month] = snapshotId.split('-').map(Number)
  return month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`
}

const byGeo = <T>(make: () => T) => Object.fromEntries(AeiGeoSchema.options.map((geo) => [geo, make()]))
const byLevel = <T>(make: () => T) => Object.fromEntries(AeiLevelSchema.options.map((level) => [level, make()]))

async function readRelease(path: string) {
  const months = Object.fromEntries(
    SnapshotIdSchema.options.map((id) => [
      id,
      { overall: byGeo(() => ({})), rows: byGeo(() => byLevel(() => new Map())), labels: byLevel(() => new Map()) }
    ])
  ) as Record<SnapshotId, Month>
  const ignoredMonths = new Map<string, number>()
  let header = true
  for await (const line of createInterface({ input: createReadStream(path), crlfDelay: Infinity })) {
    if (header) {
      if (line !== COLUMNS) throw new Error(`Unexpected header: ${line}`)
      header = false
      continue
    }
    // Dates hold no commas, so the third field is the geography: skip other geographies cheaply.
    const geoStart = line.indexOf(',', line.indexOf(',') + 1) + 1
    const geo = AeiGeoSchema.safeParse(line.slice(geoStart, line.indexOf(',', geoStart))).data
    if (!geo) continue
    const [dateStart, dateEnd, , geoLevel, category, hierarchy, metric, rawValue, name, id] = parseLine(line)
    const snapshotId = SnapshotIdSchema.safeParse(dateStart.slice(0, 7)).data
    if (!snapshotId || dateStart !== `${snapshotId}-01`) {
      ignoredMonths.set(dateStart, (ignoredMonths.get(dateStart) ?? 0) + 1)
      continue
    }
    if (dateEnd !== nextMonthStart(snapshotId)) throw new Error(`Not a calendar month: ${line}`)
    if (geoLevel !== GEO_LEVEL[geo]) throw new Error(`Unexpected geo_level: ${line}`)
    const value = Number(rawValue)
    if (rawValue === '' || !Number.isFinite(value)) throw new Error(`Bad value: ${line}`)
    const month = months[snapshotId]
    if (category === 'overall') {
      if (!(OVERALL_METRICS as readonly string[]).includes(metric)) continue
      if (metric in month.overall[geo]) throw new Error(`Duplicate cell: ${line}`)
      month.overall[geo][metric] = value
      continue
    }
    const level = LEVELS[`${category}/${hierarchy}`]
    const column = AEI_METRICS.indexOf(metric as AeiMetric)
    if (!level || column < 0) continue
    const label = month.labels[level].get(id)
    if (label !== undefined && label !== name) throw new Error(`${level} ${id} has two names: ${label} | ${name}`)
    month.labels[level].set(id, name)
    const row = month.rows[geo][level].get(id) ?? AEI_METRICS.map(() => null)
    if (row[column] !== null) throw new Error(`Duplicate cell: ${line}`)
    row[column] = value
    month.rows[geo][level].set(id, row)
  }
  return { months, ignoredMonths }
}

const sortedObject = <T>(map: Map<string, T>) =>
  Object.fromEntries([...map].sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })))

function buildSnapshot(snapshotId: SnapshotId, month: Month, file: { sha256: string; retrieved_on: string }) {
  const date_start = `${snapshotId}-01`
  const source = (geo: AeiGeo, layer: string) => ({
    source_name: SOURCE_NAME,
    source_url: SOURCE_URL,
    vintage_date: date_start,
    geo_or_layer: `${geo}/${layer}`
  })
  const geos = byGeo(() => null) as Record<AeiGeo, unknown>
  for (const geo of AeiGeoSchema.options) {
    const overall = month.overall[geo]
    const levels = byLevel(() => null) as Record<AeiLevel, unknown>
    for (const level of AeiLevelSchema.options) {
      if (month.rows[geo][level].size === 0) throw new Error(`${snapshotId}: no ${geo} rows at ${level} level`)
      levels[level] = { ...source(geo, level), rows: sortedObject(month.rows[geo][level]) }
    }
    geos[geo] = {
      overall: {
        ...source(geo, 'overall'),
        ...Object.fromEntries(OVERALL_METRICS.map((m) => [m, overall[m] ?? null]))
      },
      levels
    }
  }
  return AeiSnapshotSchema.parse({
    snapshot_id: snapshotId,
    period: { date_start, date_end: nextMonthStart(snapshotId) },
    release: {
      repo: REPO,
      revision: REVISION,
      path: FILE,
      release_date: RELEASE_DATE,
      sha256: file.sha256,
      retrieved_on: file.retrieved_on,
      licence: LICENCE
    },
    metrics: AEI_METRICS,
    units: AEI_UNITS,
    labels: Object.fromEntries(AeiLevelSchema.options.map((level) => [level, sortedObject(month.labels[level])])),
    geos
  })
}

async function writeSnapshot(snapshot: AeiSnapshot): Promise<{ path: string; bytes: number }> {
  const path = join(OUT_DIR, `${snapshot.snapshot_id}.json`)
  const text = await format(JSON.stringify(snapshot), { ...(await resolveConfig(path)), filepath: path })
  const bytes = Buffer.byteLength(text)
  if (bytes > MAX_BYTES) throw new Error(`${path} is ${bytes} bytes, over the 2 MB budget`)
  await mkdir(OUT_DIR, { recursive: true })
  await Bun.write(path, text)
  return { path, bytes }
}

function printSummary(snapshots: AeiSnapshot[], file: { sha256: string; retrieved_on: string }) {
  const pad = (cells: (string | number)[], width = 20) => cells.map((cell) => String(cell).padEnd(width - 1)).join(' ')
  const filled = (rows: Record<string, (number | null)[]>, metric: AeiMetric) =>
    Object.values(rows).filter((row) => row[AEI_METRICS.indexOf(metric)] !== null).length
  const [april, may] = snapshots

  console.log(`\nSource: ${REPO}@${REVISION.slice(0, 7)} ${FILE}`)
  console.log(`sha256 ${file.sha256} verified, retrieved ${file.retrieved_on}`)

  console.log('\nUsage per capita index (1.0 = usage in proportion to working-age population)')
  console.log(pad(['geo', ...snapshots.map((s) => s.snapshot_id), 'May in notes', 'check'], 14))
  for (const geo of ['MYS', 'SGP'] as const) {
    const values = snapshots.map((s) => s.geos[geo].overall.usage_per_capita_index?.toFixed(2) ?? 'not published')
    const check = may.geos[geo].overall.usage_per_capita_index === NOTED_MAY_INDEX[geo] ? 'matches' : 'DIFFERS'
    console.log(pad([geo, ...values, NOTED_MAY_INDEX[geo].toFixed(2), check], 14))
  }

  for (const snapshot of snapshots) {
    console.log(
      `\nRows per facet and level in ${snapshot.snapshot_id}: usage share / collaboration split / time metrics`
    )
    console.log(pad(['geo', ...AeiLevelSchema.options]))
    for (const geo of AeiGeoSchema.options) {
      const cells = AeiLevelSchema.options.map((level) => {
        const { rows } = snapshot.geos[geo].levels[level]
        return [
          filled(rows, 'pct'),
          filled(rows, 'collaboration_bucket_automation_pct'),
          filled(rows, 'human_only_time_mean')
        ].join(' / ')
      })
      console.log(pad([geo, ...cells]))
    }
  }

  console.log('\nMYS usage share published in both months (changed = the value differs)')
  console.log(pad(['level', april.snapshot_id, may.snapshot_id, 'both', 'changed'], 14))
  for (const level of AeiLevelSchema.options) {
    const before = april.geos.MYS.levels[level].rows
    const after = may.geos.MYS.levels[level].rows
    const both = Object.keys(after).filter((id) => before[id]?.[0] != null && after[id][0] != null)
    const changed = both.filter((id) => before[id][0] !== after[id][0]).length
    console.log(pad([level, filled(before, 'pct'), filled(after, 'pct'), both.length, changed], 14))
  }
}

const file = await download()
const { months, ignoredMonths } = await readRelease(file.path)
if (ignoredMonths.size > 0) console.warn('Ignored months without a snapshot ID:', Object.fromEntries(ignoredMonths))
const snapshots = SnapshotIdSchema.options.map((id) => buildSnapshot(id, months[id], file))
for (const snapshot of snapshots) {
  const { path, bytes } = await writeSnapshot(snapshot)
  console.log(`Wrote ${relative(ROOT, path)} (${(bytes / 1024).toFixed(0)} KB), valid against AeiSnapshotSchema`)
}
printSummary(snapshots, file)
