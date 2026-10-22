// Ingests DOSM Big Data Analytics: Job Market Insights (#52) into data/snapshots/dosm-jmi.json.
//
// Run: bun run ingest:dosm-jmi. Needs pdftotext (poppler-utils) and unzip on PATH.
// Downloads are cached in .cache/dosm-jmi/ (gitignored); delete that folder to fetch everything again.
//
// Sources, all from dosm.gov.my:
// - Each quarterly release's "Download release" PDF: the top roles it names, with counts where the text gives them.
// - The latest release's data file (xlsx): totals and MASCO major groups for every quarter since Q3 2019.
// - The infographic PDFs: the MASCO codes they print next to named roles.
// O*NET 30.1 occupation and alternate titles (onetcenter.org) give O*NET-SOC codes for exact title matches only.

import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as prettier from 'prettier'
import {
  combineJmiDirections,
  DOSM_JMI_ATTRIBUTION,
  DOSM_JMI_SOURCE_NAME,
  DosmDemandSchema,
  JMI_DIRECTION_THRESHOLD_PCT,
  jmiDirection,
  shiftJmiQuarter,
  type DosmDemand,
  type DosmFigure,
  type DosmMajorGroupSeries,
  type DosmNamedRoleSeries,
  type DosmRelease,
  type DosmRoleFigure,
  type JmiChange
} from '../../packages/shared/src/data/dosm-jmi'

const ROOT = join(import.meta.dir, '..', '..')
const CACHE = join(ROOT, '.cache', 'dosm-jmi')
const OUT = join(ROOT, 'data', 'snapshots', 'dosm-jmi.json')
const DOSM = 'https://www.dosm.gov.my'
const LATEST_SLUG = 'big-data-analytics-job-market-insights-q22026'
const FIRST_QUARTER = '2019-Q3'
const LAST_QUARTER = '2026-Q2'
const ONET_TEXT = 'https://www.onetcenter.org/dl_files/database/db_30_1_text/'

// MASCO 2020 major groups, as DOSM labels them in the Q4 2022 media statement ("Categories of MASCO").
const MASCO_MAJOR_GROUPS: [string, string][] = [
  ['1', 'Managers'],
  ['2', 'Professionals'],
  ['3', 'Technicians and Associate Professionals'],
  ['4', 'Clerical Support Workers'],
  ['5', 'Service and Sales Workers'],
  ['6', 'Skilled Agricultural, Forestry, Livestock and Fishery Workers'],
  ['7', 'Craft and Related Trades Workers'],
  ['8', 'Plant and Machine Operators and Assemblers'],
  ['9', 'Elementary Occupations']
]

const QUARTER_WORDS: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4 }
const MONTHS = 'january february march april may june july august september october november december'.split(' ')

for (const tool of ['pdftotext', 'unzip'])
  if (!Bun.which(tool)) throw new Error(`${tool} is not on PATH (install poppler-utils and unzip)`)

// ---------- Downloads ----------

type CacheEntry = { url: string; final_url: string; status: number; fetched_at: string }
const manifestPath = join(CACHE, 'manifest.json')
await mkdir(CACHE, { recursive: true })
const manifest: Record<string, CacheEntry> = existsSync(manifestPath) ? await Bun.file(manifestPath).json() : {}

type Download = { path: string; finalUrl: string }

// Returns null when the file is gone (404) or keeps failing; callers decide whether that is fatal.
async function download(name: string, url: string): Promise<Download | null> {
  const path = join(CACHE, name)
  const cached = manifest[name]
  if (cached?.status === 200 && existsSync(path)) return { path, finalUrl: cached.final_url }
  if (cached?.status === 404) return null
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(180_000) })
      const entry = { url, final_url: response.url, status: response.status, fetched_at: new Date().toISOString() }
      if (response.status === 404) {
        manifest[name] = entry
        await Bun.write(manifestPath, JSON.stringify(manifest, null, 2))
        return null
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      await mkdir(dirname(path), { recursive: true })
      await Bun.write(path, await response.arrayBuffer())
      manifest[name] = entry
      await Bun.write(manifestPath, JSON.stringify(manifest, null, 2))
      await Bun.sleep(500) // DOSM resets connections under load; stay gentle.
      return { path, finalUrl: response.url }
    } catch (error) {
      console.warn(`  attempt ${attempt} failed for ${url}: ${error}`)
      await Bun.sleep(2000 * 2 ** attempt)
    }
  }
  return null
}

async function required(name: string, url: string): Promise<Download> {
  const file = await download(name, url)
  if (!file) throw new Error(`could not download ${url}`)
  return file
}

// ---------- Text helpers ----------

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function clean(text: string): string {
  return text.normalize('NFKC').replace(/\s+/g, ' ').trim()
}

// Lower case, "&" as "and", letters only, each word singular: "Accountants & Auditors" -> "accountant and auditor".
function titleKey(title: string): string {
  return clean(title)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z ]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word))
    .join(' ')
}

function pdfText(path: string, raw = false): string | null {
  const result = Bun.spawnSync(['pdftotext', '-q', ...(raw ? ['-raw'] : []), path, '-'])
  return result.success ? clean(result.stdout.toString()) : null
}

async function isPdf(path: string): Promise<boolean> {
  return (await Bun.file(path).slice(0, 4).text()) === '%PDF'
}

function quarterLabel(quarter: string): string {
  const [year, q] = quarter.split('-')
  return `${q} ${year}`
}

function quarterRange(first: string, last: string): string[] {
  const quarters: string[] = []
  for (let q = first; q <= last; q = shiftJmiQuarter(q, 1)) quarters.push(q)
  return quarters
}

// "Third and Fourth Quarter of 2021" -> ['2021-Q3', '2021-Q4']
function titleQuarters(title: string): string[] {
  const match = title.match(/\b(first|second|third|fourth)(?: and (first|second|third|fourth))? quarter of (\d{4})/i)
  if (!match) throw new Error(`no quarter in release title "${title}"`)
  const [, a, b, year] = match
  return [a, b].filter(Boolean).map((word) => `${year}-Q${QUARTER_WORDS[word.toLowerCase()]}`)
}

function isoDate(day: string, month: string, year: string): string {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// ---------- Release list ----------

type Release = { slug: string; title: string; release_date: string; quarters: string[]; url: string }

function releaseUrl(slug: string): string {
  return `${DOSM}/portal-main/release-content/${slug}`
}

console.log('Release list')
const latestPage = await Bun.file((await required(`pages/${LATEST_SLUG}.html`, releaseUrl(LATEST_SLUG))).path).text()
const latestTitle = latestPage.match(/<h3>([^<]*?)\s*<span/)?.[1]
const latestDate = latestPage.match(/Latest Release\s*:\s*(\d{1,2}) (\w+) (\d{4})/)
if (!latestTitle || !latestDate) throw new Error('latest release page has no title or release date')
const archivePage = await Bun.file(
  (await required('pages/archive.html', `${DOSM}/portal-main/release-archive/${LATEST_SLUG}`)).path
).text()

const releases: Release[] = [
  {
    slug: LATEST_SLUG,
    title: clean(decodeEntities(latestTitle)),
    release_date: isoDate(latestDate[1], String(MONTHS.indexOf(latestDate[2].toLowerCase()) + 1), latestDate[3]),
    quarters: [],
    url: releaseUrl(LATEST_SLUG)
  }
]
for (const match of archivePage.matchAll(
  /href="\/portal-main\/release-content\/([^"]+)">\s*(\d{2})\.(\d{2})\.(\d{4}) - ([^<]+)<\/a>/g
)) {
  const [, slug, day, month, year, title] = match
  releases.push({
    slug,
    title: clean(decodeEntities(title)),
    release_date: isoDate(day, month, year),
    quarters: [],
    url: releaseUrl(slug)
  })
}
for (const release of releases) release.quarters = titleQuarters(release.title)
releases.sort((a, b) => a.quarters[0].localeCompare(b.quarters[0]))
console.log(`  ${releases.length} releases, ${releases[0].quarters[0]} to ${releases.at(-1)!.quarters.at(-1)}`)

// ---------- Release PDFs: named roles ----------

type ReleaseDocs = {
  release: Release
  pdfUrl: string
  text: string | null
  infographics: { url: string; text: string }[]
  dataFile: Download | null
}

const docs: ReleaseDocs[] = []
for (const release of releases) {
  console.log(`Fetching ${release.title}`)
  const page = await download(`pages/${release.slug}.html`, release.url)
  const pdfUrl = `${DOSM}/site/downloadrelease?id=${release.slug}&lang=English`
  const pdf = await download(`releases/${release.slug}.pdf`, pdfUrl)
  const text = pdf && (await isPdf(pdf.path)) ? pdfText(pdf.path) : null
  const infographics: { url: string; text: string }[] = []
  let dataFile: Download | null = null
  const html = page ? await Bun.file(page.path).text() : ''
  for (const link of html.matchAll(
    /<a\b[^>]*href="([^"]*release-document-log\?release_document_id=(\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g
  )) {
    const [, href, id, inner] = link
    const url = decodeEntities(href)
    if (url.includes('cat=infographic')) {
      const file = await download(`documents/${id}.pdf`, url)
      const infographicText = file && (await isPdf(file.path)) ? pdfText(file.path, true) : null
      if (file && infographicText) infographics.push({ url: file.finalUrl, text: infographicText })
    } else if (release.slug === LATEST_SLUG && /^(data|summary table)/i.test(clean(inner.replace(/<[^>]+>/g, ' ')))) {
      dataFile = await required(`documents/${id}.xlsx`, url)
    }
  }
  docs.push({ release, pdfUrl, text, infographics, dataFile })
}

const ROLE_SENTENCE = /(?:hottest jobs?|popular jobs?|in-demand jobs?|higher demand)(?:[^.]|\.(?=\d))*\./i
const COUNTED_ROLE =
  /([A-Z][A-Za-z]*(?:\s+(?:[A-Z][A-Za-z]*|&|and))*)\s*\((\d{1,3}(?:,\d{3})*)(?:\s+job\s+offerings)?\)/g

type ParsedRole = { key: string; name: string; rank: number; value: number | null }
const sentences = new Map<string, string>()
const counted = new Map<string, ParsedRole[]>()
for (const { release, text } of docs) {
  const sentence = text?.match(ROLE_SENTENCE)?.[0]
  if (!sentence) continue
  sentences.set(release.slug, sentence)
  const roles = [...sentence.matchAll(COUNTED_ROLE)].map((match, i) => ({
    key: titleKey(match[1]),
    name: match[1].replace(/\s*&\s*/g, ' and '),
    rank: i + 1,
    value: Number(match[2].replace(/,/g, ''))
  }))
  if (roles.length) counted.set(release.slug, roles)
}

// Display name per role: the most common spelling among the counted sentences.
const spellings = new Map<string, Map<string, number>>()
for (const role of [...counted.values()].flat()) {
  const names = spellings.get(role.key) ?? new Map<string, number>()
  names.set(role.name, (names.get(role.name) ?? 0) + 1)
  spellings.set(role.key, names)
}
const displayName = (key: string) => [...spellings.get(key)!].sort((a, b) => b[1] - a[1])[0][0]
const roleKeys = [...spellings.keys()].sort((a, b) => b.length - a.length)

// Sentences without counts, such as "were A, B, C and D and E.": titles with "and" inside them are ambiguous, so the
// titles seen in counted sentences are marked first, from the first one onwards. The rest splits on commas and "and".
function namedOnly(sentence: string): ParsedRole[] {
  let list = ` ${sentence.split(',').map(titleKey).join(' , ')} `
  const start = Math.min(...roleKeys.map((key) => list.indexOf(` ${key} `)).filter((at) => at >= 0))
  if (!Number.isFinite(start)) return []
  list = list.slice(start)
  roleKeys.forEach((key, i) => (list = list.replaceAll(` ${key} `, ` #${i} `)))
  const items = list
    .split(/\s(?:,\s(?:and\s|as well as\s)?|and\s|as well as\s)/)
    .map((item) => item.trim())
    .filter((item) => item && item !== ',')
  return items.map((item, i) => {
    const known = item.match(/#(\d+)/)
    const key = known ? roleKeys[Number(known[1])] : item
    if (!known) {
      const printed = sentence.match(
        new RegExp(
          item
            .split(' ')
            .map((word) => `${word}\\w*`)
            .join('\\s+'),
          'i'
        )
      )
      spellings.set(key, new Map([[printed?.[0] ?? item, 1]]))
    }
    return { key, name: displayName(key), rank: i + 1, value: null }
  })
}

// ---------- Data file: totals and major groups ----------

function unzip(path: string, member: string): string {
  const result = Bun.spawnSync(['unzip', '-p', path, member])
  if (!result.success) throw new Error(`unzip ${member} failed for ${path}`)
  return result.stdout.toString()
}

function columnIndex(letters: string): number {
  return [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0)
}

function readSheet(path: string): Map<number, Map<number, string | number>> {
  const strings = [...unzip(path, 'xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((si) =>
    decodeEntities([...si[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1]).join(''))
  )
  const rows = new Map<number, Map<number, string | number>>()
  const sheet = unzip(path, 'xl/worksheets/sheet1.xml')
  for (const cell of sheet.matchAll(/<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const [, letters, row, attributes, inner = ''] = cell
    const raw = inner.match(/<v>([^<]*)<\/v>/)?.[1] ?? inner.match(/<t[^>]*>([^<]*)<\/t>/)?.[1]
    if (raw === undefined) continue
    const type = attributes.match(/\bt="(\w+)"/)?.[1]
    const value =
      type === 's' ? strings[Number(raw)] : type === 'str' || type === 'inlineStr' ? decodeEntities(raw) : Number(raw)
    const cells = rows.get(Number(row)) ?? new Map<number, string | number>()
    cells.set(columnIndex(letters), typeof value === 'string' ? clean(value) : value)
    rows.set(Number(row), cells)
  }
  return rows
}

const latestDocs = docs.find((d) => d.release.slug === LATEST_SLUG)!
if (!latestDocs.dataFile) throw new Error('the latest release page has no data file link')
const dataFile = latestDocs.dataFile
const sheet = readSheet(dataFile.path)
const rowNumbers = [...sheet.keys()].sort((a, b) => a - b)
const label = (row: number) => String(sheet.get(row)?.get(2) ?? '')
const tableRow = rowNumbers.find((row) => /^Table 2\b/.test(label(row)))
const headerRow = rowNumbers.find((row) => tableRow !== undefined && row > tableRow && label(row) === 'Occupation')
if (!tableRow || !headerRow) throw new Error('data file has no "Table 2 ... by Major Group Occupation" header')
const yearCells = [...(sheet.get(headerRow - 1) ?? [])].filter(([, v]) => typeof v === 'number')
const quarterColumns = new Map<string, number>()
for (const [column, value] of sheet.get(headerRow) ?? []) {
  if (typeof value !== 'string' || !/^Q[1-4]$/.test(value)) continue
  const year = yearCells.filter(([c]) => c <= column).sort((a, b) => b[0] - a[0])[0]?.[1]
  quarterColumns.set(`${year}-${value}`, column)
}
const quarters = quarterRange(FIRST_QUARTER, LAST_QUARTER)
const missingColumns = quarters.filter((q) => !quarterColumns.has(q))
if (missingColumns.length) throw new Error(`data file has no column for ${missingColumns.join(', ')}`)

const tableRows: { name: string; values: Map<string, number | null> }[] = []
for (const row of rowNumbers.filter((r) => r > headerRow)) {
  const name = label(row)
  if (!name || /^Source/i.test(name)) break
  const values = new Map<string, number | null>()
  for (const quarter of quarters) {
    const cell = sheet.get(row)?.get(quarterColumns.get(quarter)!)
    if (cell !== undefined && cell !== '-' && typeof cell !== 'number')
      throw new Error(`unexpected cell "${cell}" in ${name}`)
    values.set(quarter, typeof cell === 'number' ? cell : null)
  }
  tableRows.push({ name, values })
}

// ---------- Figures and directions ----------

const round1 = (n: number) => Math.round(n * 10) / 10

function change(values: Map<string, number | null>, quarter: string, back: number): JmiChange | null {
  const now = values.get(quarter)
  const before = values.get(shiftJmiQuarter(quarter, -back))
  if (now == null || before == null || before <= 0) return null
  const change_pct = round1(((now - before) / before) * 100)
  return { from_quarter: shiftJmiQuarter(quarter, -back), change_pct, direction: jmiDirection(change_pct) }
}

type Citation = { source_url: string; release_title: string; vintage_date: string }
const dataCitation: Citation = {
  source_url: dataFile.finalUrl,
  release_title: latestDocs.release.title,
  vintage_date: latestDocs.release.release_date
}

function figure(
  values: Map<string, number | null>,
  quarter: string,
  layer: DosmFigure['geo_or_layer'],
  citation: Citation
): DosmFigure {
  return {
    metric: 'online_job_offerings',
    value: values.get(quarter) ?? null,
    quarter,
    quarter_label: quarterLabel(quarter),
    source_name: DOSM_JMI_SOURCE_NAME,
    ...citation,
    geo_or_layer: layer,
    attribution: DOSM_JMI_ATTRIBUTION,
    qoq: change(values, quarter, 1),
    yoy: change(values, quarter, 4)
  }
}

function latest(points: DosmFigure[]) {
  const point = [...points].reverse().find((p) => p.value !== null) ?? points.at(-1)!
  return { quarter: point.quarter, ...combineJmiDirections(point.qoq?.direction ?? null, point.yoy?.direction ?? null) }
}

const totalRow = tableRows.find((row) => row.name === 'Jumlah')
if (!totalRow) throw new Error('data file Table 2 has no "Jumlah" (total) row')
const totals = quarters.map((q) => figure(totalRow.values, q, 'MYS/total', dataCitation))

const major_groups: DosmMajorGroupSeries[] = tableRows
  .filter((row) => row.name !== 'Jumlah')
  .map((row) => {
    const group = MASCO_MAJOR_GROUPS.find(([, name]) => titleKey(name) === titleKey(row.name))
    if (!group && row.name !== 'Unclassified') throw new Error(`unknown major group "${row.name}"`)
    const points = quarters.map((q) => figure(row.values, q, 'MYS/L2', dataCitation))
    return {
      masco_major_group: (group?.[0] ?? null) as DosmMajorGroupSeries['masco_major_group'],
      name: group?.[1] ?? row.name,
      points,
      latest: latest(points)
    }
  })

// ---------- Named roles ----------

const missing: DosmDemand['missing'] = []
const releaseRecords: DosmRelease[] = []
const rolePoints = new Map<string, { quarter: string; rank: number; value: number | null; citation: Citation }[]>()
const releaseByQuarter = new Map(docs.flatMap((d) => d.release.quarters.map((q) => [q, d] as const)))

for (const { release, pdfUrl, text } of docs) {
  const sentence = sentences.get(release.slug)
  const roles = counted.get(release.slug) ?? (sentence ? namedOnly(sentence) : [])
  const quarter = release.quarters.at(-1)!
  const status = !roles.length ? 'not-found' : roles.some((r) => r.value !== null) ? 'with-counts' : 'names-only'
  releaseRecords.push({
    title: release.title,
    url: release.url,
    pdf_url: pdfUrl,
    release_date: release.release_date,
    quarters: release.quarters,
    named_roles: status,
    total_in_release_text: release.quarters.every((q) => {
      const total = totalRow.values.get(q)
      return !!text && total != null && text.includes(total.toLocaleString('en-US'))
    })
  })
  for (const q of release.quarters.slice(0, -1))
    missing.push({
      quarter: q,
      part: 'named_roles',
      reason: `"${release.title}" names one list of top roles, which this snapshot files under ${quarterLabel(quarter)}.`
    })
  if (status === 'not-found') {
    missing.push({
      quarter,
      part: 'named_roles',
      reason: text
        ? `No sentence naming the top roles was found in "${release.title}".`
        : `The release PDF for "${release.title}" could not be downloaded or read.`
    })
    continue
  }
  if (status === 'names-only')
    missing.push({
      quarter,
      part: 'named_role_counts',
      reason: `"${release.title}" names the top roles without counts.`
    })
  if (roles.length !== 5) console.warn(`  ${release.title}: found ${roles.length} named roles, expected 5`)
  for (const role of roles) {
    const points = rolePoints.get(role.key) ?? []
    points.push({
      quarter,
      rank: role.rank,
      value: role.value,
      citation: { source_url: release.url, release_title: release.title, vintage_date: release.release_date }
    })
    rolePoints.set(role.key, points)
  }
}
for (const quarter of quarters)
  if (!releaseByQuarter.has(quarter))
    missing.push({
      quarter,
      part: 'named_roles',
      reason: `DOSM's release archive has no release for ${quarterLabel(quarter)} (the earliest covers Q2 2021); its total and major groups come from the ${latestDocs.release.title} data file.`
    })
missing.sort((a, b) => a.quarter.localeCompare(b.quarter))

// MASCO codes printed next to a role title in an infographic, e.g. "Software Developers [2512]".
const mascoCodes = new Map<string, { code: string; quarter: string; release_title: string; source_url: string }>()
const mascoConflicts: string[] = []
const namedKeys = [...rolePoints.keys()].sort((a, b) => b.length - a.length)
for (const { release, infographics } of docs)
  for (const infographic of infographics)
    for (const match of infographic.text.matchAll(/([A-Z][A-Za-z&' ]{2,120}?)\s*[[(](\d{4})[\])]/g)) {
      const printed = ` ${titleKey(match[1])}`
      const key = namedKeys.find((k) => printed.endsWith(` ${k}`))
      if (!key) continue
      const previous = mascoCodes.get(key)
      if (previous && previous.code !== match[2])
        mascoConflicts.push(
          `${displayName(key)}: ${previous.code} (${previous.quarter}) and ${match[2]} (${release.quarters.at(-1)})`
        )
      mascoCodes.set(key, {
        code: match[2],
        quarter: release.quarters.at(-1)!,
        release_title: release.title,
        source_url: infographic.url
      })
    }

// O*NET 30.1 titles, for exact matches only.
console.log('O*NET 30.1 titles')
const occupationFile = await required('onet/Occupation Data.txt', `${ONET_TEXT}Occupation%20Data.txt`)
const alternateFile = await required('onet/Alternate Titles.txt', `${ONET_TEXT}Alternate%20Titles.txt`)
const onetTitles = new Map<string, string>()
const byTitle = new Map<string, Set<string>>()
const byAlternate = new Map<string, Set<string>>()
const addTitle = (index: Map<string, Set<string>>, title: string, code: string) =>
  index.set(titleKey(title), (index.get(titleKey(title)) ?? new Set()).add(code))
for (const line of (await Bun.file(occupationFile.path).text()).split('\n').slice(1)) {
  const [code, title] = line.split('\t')
  if (!code || !title) continue
  onetTitles.set(code, title)
  addTitle(byTitle, title, code)
}
for (const line of (await Bun.file(alternateFile.path).text()).split('\n').slice(1)) {
  const [code, title] = line.split('\t')
  if (!code || !title) continue
  addTitle(byAlternate, title.replace(/\s*\(.*\)\s*$/, ''), code)
}

function onetMatch(
  name: string
): Pick<DosmNamedRoleSeries, 'onet_soc_code' | 'onet_title' | 'onet_match' | 'onet_note'> {
  for (const [index, kind] of [
    [byTitle, 'occupation-title'],
    [byAlternate, 'alternate-title']
  ] as const) {
    const codes = [...(index.get(titleKey(name)) ?? [])]
    if (codes.length === 1) {
      const title = onetTitles.get(codes[0]) ?? null
      return {
        onet_soc_code: codes[0],
        onet_title: title,
        onet_match: kind,
        onet_note: `The DOSM title equals an O*NET 30.1 ${kind === 'occupation-title' ? 'occupation' : 'alternate'} title for ${codes[0]} ${title}.`
      }
    }
  }
  return {
    onet_soc_code: null,
    onet_title: null,
    onet_match: 'none',
    onet_note: 'No single O*NET 30.1 occupation or alternate title equals the DOSM title, so no O*NET code is given.'
  }
}

const named_roles: DosmNamedRoleSeries[] = [...rolePoints]
  .map(([key, entries]) => {
    const values = new Map(entries.map((e) => [e.quarter, e.value]))
    const points: DosmRoleFigure[] = entries
      .sort((a, b) => a.quarter.localeCompare(b.quarter))
      .map((e) => ({ ...figure(values, e.quarter, 'MYS/L3', e.citation), rank: e.rank }))
    const masco = mascoCodes.get(key)
    return {
      name: displayName(key),
      masco_code: masco?.code ?? null,
      masco_major_group: (masco?.code[0] ?? null) as DosmNamedRoleSeries['masco_major_group'],
      masco_source: masco
        ? { release_title: masco.release_title, source_url: masco.source_url, quarter: masco.quarter }
        : null,
      ...onetMatch(displayName(key)),
      points,
      latest: latest(points)
    }
  })
  .sort((a, b) => b.points.length - a.points.length || a.name.localeCompare(b.name))

// ---------- Snapshot ----------

const notes = [
  `Totals and major groups for every quarter come from one vintage: the data file of "${latestDocs.release.title}". Named roles come from each quarter's own release.`,
  'A cell DOSM prints as "-" or leaves blank is stored as null, never 0. A role absent from a quarter\'s top list has no point for that quarter.',
  "DOSM's 2021 releases say MASCO major group 9 (elementary occupations) and 0 (armed forces) were excluded from the series.",
  `Changes are percentages against the previous quarter (qoq) and the same quarter a year earlier (yoy). Above +${JMI_DIRECTION_THRESHOLD_PCT}% is up, below -${JMI_DIRECTION_THRESHOLD_PCT}% is down, anything else is flat. No change is computed from a null or zero base.`,
  'O*NET-SOC codes and titles include information from the O*NET 30.1 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), used under the CC BY 4.0 license. O*NET® is a trademark of USDOL/ETA.',
  ...mascoConflicts.map((conflict) => `Releases print different MASCO codes for ${conflict}; the latest is used.`)
]
const jump = [...totals].reverse().find((t) => t.qoq && t.qoq.change_pct > 100)
if (jump)
  notes.push(
    `The total rose ${jump.qoq!.change_pct}% from ${quarterLabel(jump.qoq!.from_quarter)} to ${jump.quarter_label}. Year-on-year changes that span ${jump.quarter_label} may reflect wider coverage as well as demand.`
  )

const snapshot: DosmDemand = {
  dataset: 'dosm-jmi',
  source_name: DOSM_JMI_SOURCE_NAME,
  publisher: 'Department of Statistics Malaysia (DOSM)',
  licence:
    'DOSM copyright. No open reuse licence was found for Job Market Insights, so Kotak stores only the figures it needs and cites each one with its release.',
  attribution: DOSM_JMI_ATTRIBUTION,
  retrieved_date: manifest[`pages/${LATEST_SLUG}.html`].fetched_at.slice(0, 10),
  first_quarter: FIRST_QUARTER,
  last_quarter: LAST_QUARTER,
  direction_rule: {
    threshold_pct: JMI_DIRECTION_THRESHOLD_PCT,
    comparisons: ['qoq', 'yoy'],
    verdict_input:
      "Each series' latest field is the demand input: up or down only when quarter-on-quarter and year-on-year agree, flat when they disagree, the one available comparison when only one exists, and null when neither does."
  },
  releases: releaseRecords,
  totals,
  major_groups,
  named_roles,
  missing,
  notes
}

const parsed = DosmDemandSchema.safeParse(snapshot)
if (!parsed.success) {
  console.error(JSON.stringify(parsed.error.issues.slice(0, 20), null, 2))
  throw new Error('snapshot failed DosmDemandSchema')
}
const options = await prettier.resolveConfig(OUT)
await mkdir(dirname(OUT), { recursive: true })
await Bun.write(OUT, await prettier.format(JSON.stringify(parsed.data), { ...options, filepath: OUT }))

// ---------- Report ----------

console.log(`\nWrote ${OUT}`)
console.log(`  ${totals.length} quarters, ${major_groups.length} major groups, ${named_roles.length} named roles`)
for (const r of releaseRecords)
  console.log(
    `  ${r.quarters.join('+')}: named roles ${r.named_roles}, total in release text: ${r.total_in_release_text}`
  )
for (const m of missing) console.log(`  missing ${m.quarter} ${m.part}: ${m.reason}`)
for (const role of named_roles)
  console.log(
    `  ${role.name}: MASCO ${role.masco_code ?? '-'}, O*NET ${role.onet_soc_code ?? '-'}, ${role.points.length} quarters, latest ${role.latest.quarter} ${role.latest.direction} (${role.latest.basis})`
  )
const value = (series: DosmFigure[], quarter: string) => series.find((p) => p.quarter === quarter)?.value
const developers = named_roles.find((r) => r.name === 'Software Developers')?.points ?? []
for (const [anchor, actual, expected] of [
  ['Total Q3 2019', value(totals, '2019-Q3'), 74018],
  ['Total Q2 2026', value(totals, '2026-Q2'), 555509],
  ['Software Developers Q2 2026', value(developers, '2026-Q2'), 19899]
] as const)
  console.log(`  anchor ${anchor}: ${actual} ${actual === expected ? 'matches' : `DOES NOT MATCH ${expected}`}`)
