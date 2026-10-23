// Ingest the data behind the intake's pathways (#284) into data/pathways/:
// - onet-preparation.json: each occupation's Job Zone, the median education and related work experience its workers
//   report (O*NET Education, Training, and Experience), and its six interest scores, from the O*NET 30.1 database.
// - cip-soc.json: the NCES CIP 2020 to SOC 2018 crosswalk, which links fields of study to occupations.
// Run: bun run ingest:pathways [--refresh]. Downloads go to .cache/ and are reused unless --refresh.
// Docs: https://www.onetcenter.org/dictionary/30.1/text/ and https://nces.ed.gov/ipeds/cipcode/resources.aspx?y=56

import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { strFromU8, unzipSync } from 'fflate'
import {
  CipSocFileSchema,
  ONET_MODIFICATION_NOTICE,
  OnetOccupationsFileSchema,
  OnetPreparationFileSchema,
  onetCredit,
  type EducationLevel,
  type OccupationPreparation
} from '../../packages/shared/src/index'

const ROOT = join(import.meta.dir, '../..')
const REFRESH = process.argv.includes('--refresh')
const ONET_VERSION = '30.1'
const ONET_URL = `https://www.onetcenter.org/dl_files/database/db_${ONET_VERSION.replace('.', '_')}_text/`
const ONET_CACHE = join(ROOT, '.cache/onet', ONET_VERSION)
const CIP_SOC_URL = 'https://nces.ed.gov/ipeds/cipcode/Files/CIP2020_SOC2018_Crosswalk.xlsx'
const CIP_SOC_CACHE = join(ROOT, '.cache/pathways')
const OUT = join(ROOT, 'data/pathways')

const ONET_FILES = {
  jobZones: ['Job Zones.txt', ['O*NET-SOC Code', 'Job Zone', 'Date', 'Domain Source']],
  education: [
    'Education, Training, and Experience.txt',
    [
      'O*NET-SOC Code',
      'Element ID',
      'Element Name',
      'Scale ID',
      'Category',
      'Data Value',
      'N',
      'Standard Error',
      'Lower CI Bound',
      'Upper CI Bound',
      'Recommend Suppress',
      'Date',
      'Domain Source'
    ]
  ],
  interests: [
    'Interests.txt',
    ['O*NET-SOC Code', 'Element ID', 'Element Name', 'Scale ID', 'Data Value', 'Date', 'Domain Source']
  ]
} as const

// O*NET's Required Level of Education categories (scale RL) on the Malaysian ladder. A US first professional degree
// (category 10: law, medicine, dentistry) is a bachelor's degree in Malaysia (LLB, MBBS, BDS).
const EDUCATION_BY_RL: Record<number, EducationLevel> = {
  1: 'secondary',
  2: 'secondary',
  3: 'certificate',
  4: 'certificate',
  5: 'diploma',
  6: 'bachelor',
  7: 'bachelor',
  8: 'master',
  9: 'master',
  10: 'bachelor',
  11: 'doctorate',
  12: 'doctorate'
}
// The lower bound, in years, of each Related Work Experience category (scale RW): 1 none, 5 over 6 months up to a
// year, 7 over 2 up to 4 years, 8 over 4 up to 6 years, 11 over 10 years.
const YEARS_BY_RW: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0.5, 6: 1, 7: 2, 8: 4, 9: 6, 10: 8, 11: 10 }
// Without survey data, the Job Zone's typical education (Job Zone Reference); its experience is too broad to use.
const EDUCATION_BY_ZONE: Record<number, EducationLevel> = {
  1: 'secondary',
  2: 'secondary',
  3: 'diploma',
  4: 'bachelor',
  5: 'master'
}
const INTEREST_IDS = ['1.B.1.a', '1.B.1.b', '1.B.1.c', '1.B.1.d', '1.B.1.e', '1.B.1.f'] // RIASEC

async function download(url: string, path: string): Promise<boolean> {
  if (!REFRESH && (await Bun.file(path).exists())) return false
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url)
    if (response.ok) {
      await Bun.write(path, response)
      return true
    }
    if (attempt === 4 || (response.status !== 429 && response.status < 500))
      throw new Error(`GET ${url} returned HTTP ${response.status}`)
    await Bun.sleep(1000 * 2 ** attempt)
  }
}

async function retrievedOn(dir: string, downloaded: boolean): Promise<string> {
  const stamp = Bun.file(join(dir, 'retrieved-date.txt'))
  if (downloaded || !(await stamp.exists())) await Bun.write(stamp, new Date().toISOString().slice(0, 10))
  return (await stamp.text()).trim()
}

async function readTsv(name: string, columns: readonly string[]): Promise<Record<string, string>[]> {
  const lines = (await Bun.file(join(ONET_CACHE, name)).text()).split(/\r?\n/).filter((line) => line.length > 0)
  if (lines[0] !== columns.join('\t')) throw new Error(`${name}: unexpected header "${lines[0]}"`)
  return lines.slice(1).map((line, i) => {
    const cells = line.split('\t')
    if (cells.length !== columns.length) throw new Error(`${name} line ${i + 2}: ${cells.length} columns`)
    return Object.fromEntries(columns.map((column, j) => [column, cells[j]!]))
  })
}

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const decodeXml = (text: string) =>
  text.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, entity: string) =>
    entity[0] === '#'
      ? String.fromCodePoint(Number(entity[1] === 'x' ? `0${entity.slice(1)}` : entity.slice(1)))
      : XML_ENTITIES[entity]!
  )

/** The rows of one named worksheet of an XLSX file, as text cells by column. */
function readSheet(bytes: Uint8Array, sheetName: string): string[][] {
  const files = unzipSync(bytes)
  const text = (name: string) => (files[name] ? strFromU8(files[name]) : '')
  const shared = [...text('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(([, item]) =>
    [...item!.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(([, t]) => decodeXml(t!)).join('')
  )
  const targets = new Map(
    [...text('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*>/g)].flatMap(([tag]) => {
      const id = /Id="([^"]+)"/.exec(tag)?.[1]
      const target = /Target="([^"]+)"/.exec(tag)?.[1]
      return id && target ? [[id, target.replace(/^\/?xl\//, '')] as const] : []
    })
  )
  const sheet = [...text('xl/workbook.xml').matchAll(/<sheet\b[^>]*>/g)]
    .map(([tag]) => ({ name: decodeXml(/name="([^"]+)"/.exec(tag)?.[1] ?? ''), rid: /r:id="([^"]+)"/.exec(tag)?.[1] }))
    .find((candidate) => candidate.name === sheetName)
  if (!sheet?.rid) throw new Error(`The workbook has no sheet "${sheetName}".`)
  const xml = text(`xl/${targets.get(sheet.rid)}`)
  return [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(([, row]) => {
    const cells: string[] = []
    for (const [, column, attributes, body] of row!.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const inline = /<is>([\s\S]*?)<\/is>/.exec(body ?? '')?.[1]
      const value = /<v>([\s\S]*?)<\/v>/.exec(body ?? '')?.[1]
      const index = [...column!].reduce((n, letter) => n * 26 + letter.charCodeAt(0) - 64, 0) - 1
      if (inline !== undefined)
        cells[index] = [...inline.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(([, t]) => decodeXml(t!)).join('')
      else if (value !== undefined)
        cells[index] = /\bt="s"/.test(attributes!) ? shared[Number(value)]! : decodeXml(value)
    }
    return cells
  })
}

/** The category where the cumulative share of respondents first reaches half. */
function medianCategory(rows: { category: number; percent: number }[]): number | null {
  const total = rows.reduce((sum, row) => sum + row.percent, 0)
  if (total <= 0) return null
  let running = 0
  for (const row of [...rows].sort((a, b) => a.category - b.category)) {
    running += row.percent
    if (running >= total / 2) return row.category
  }
  return null
}

/** One record per line, so a data refresh shows as a readable diff. */
function serialize(file: Record<string, unknown>): string {
  const parts = Object.entries(file).map(([key, value]) => {
    const name = JSON.stringify(key)
    if (Array.isArray(value)) return `${name}: [\n${value.map((row) => JSON.stringify(row)).join(',\n')}\n]`
    if (key !== 'meta' && value && typeof value === 'object') {
      const rows = Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
      return `${name}: {\n${rows.join(',\n')}\n}`
    }
    return `${name}: ${JSON.stringify(value)}`
  })
  return `{\n${parts.join(',\n')}\n}\n`
}

async function main(): Promise<void> {
  await Promise.all([mkdir(ONET_CACHE, { recursive: true }), mkdir(CIP_SOC_CACHE, { recursive: true })])
  await mkdir(OUT, { recursive: true })

  // 1. O*NET preparation and interests, for the 923 occupations Kotak covers.
  let downloaded = false
  for (const [name] of Object.values(ONET_FILES))
    downloaded = (await download(`${ONET_URL}${encodeURIComponent(name)}`, join(ONET_CACHE, name))) || downloaded
  const onetRetrieved = await retrievedOn(ONET_CACHE, downloaded)
  const [zoneRows, educationRows, interestRows] = await Promise.all(
    Object.values(ONET_FILES).map(([name, columns]) => readTsv(name, columns))
  )
  const occupations = OnetOccupationsFileSchema.parse(await Bun.file(join(ROOT, 'data/onet/occupations.json')).json())
  const zones = new Map(zoneRows.map((row) => [row['O*NET-SOC Code']!, Number(row['Job Zone'])]))
  const byCode = new Map<string, Record<string, string>[]>()
  for (const row of educationRows) {
    const rowsOf = byCode.get(row['O*NET-SOC Code']!) ?? []
    rowsOf.push(row)
    byCode.set(row['O*NET-SOC Code']!, rowsOf)
  }
  // O*NET flags rows whose estimate is too imprecise to use; they are left out.
  const scale = (code: string, scaleId: string) =>
    (byCode.get(code) ?? [])
      .filter((row) => row['Scale ID'] === scaleId && row['Recommend Suppress'] !== 'Y')
      .map((row) => ({ category: Number(row.Category), percent: Number(row['Data Value']) }))
  const interests = new Map<string, Map<string, number>>()
  for (const row of interestRows.filter((r) => r['Scale ID'] === 'OI')) {
    const code = row['O*NET-SOC Code']!
    const scores = interests.get(code) ?? new Map<string, number>()
    scores.set(row['Element ID']!, Number(row['Data Value']))
    interests.set(code, scores)
  }

  const preparation: Record<string, OccupationPreparation> = {}
  for (const { onet_code: code } of occupations.occupations) {
    const zone = zones.get(code) ?? null
    const rl = byCode.has(code) ? medianCategory(scale(code, 'RL')) : null
    const rw = byCode.has(code) ? medianCategory(scale(code, 'RW')) : null
    const scores = interests.get(code)
    const sixScores =
      scores && INTEREST_IDS.every((id) => scores.has(id)) ? INTEREST_IDS.map((id) => scores.get(id)!) : null
    preparation[code] = {
      job_zone: zone,
      education: rl !== null ? EDUCATION_BY_RL[rl]! : zone !== null ? EDUCATION_BY_ZONE[zone]! : null,
      experience_years: rw !== null ? YEARS_BY_RW[rw]! : null,
      interests: sixScores,
      basis: rl !== null ? 'survey' : zone !== null ? 'job_zone' : 'none'
    }
  }
  const prepFile = OnetPreparationFileSchema.parse({
    meta: {
      source_name: `O*NET ${ONET_VERSION} Database: Job Zones; Education, Training, and Experience; Interests`,
      source_url: 'https://www.onetcenter.org/database.html',
      vintage_date: '2025-12-01',
      retrieved_date: onetRetrieved,
      licence: 'CC BY 4.0',
      credit: `${onetCredit(ONET_VERSION)} ${ONET_MODIFICATION_NOTICE}`
    },
    occupations: preparation
  })

  // 2. The CIP 2020 to SOC 2018 crosswalk, without its NO MATCH rows.
  const xlsxPath = join(CIP_SOC_CACHE, 'CIP2020_SOC2018_Crosswalk.xlsx')
  const cipRetrieved = await retrievedOn(CIP_SOC_CACHE, await download(CIP_SOC_URL, xlsxPath))
  const rows = readSheet(new Uint8Array(await Bun.file(xlsxPath).arrayBuffer()), 'CIP-SOC')
  const header = rows[0]?.join('|')
  if (header !== 'CIP2020Code|CIP2020Title|SOC2018Code|SOC2018Title')
    throw new Error(`CIP-SOC: unexpected header "${header}"`)
  const links = rows
    .slice(1)
    .map(([cip, , soc]) => ({ cip: cip!.trim(), soc: soc!.trim() }))
    .filter((link) => link.cip !== '99.9999' && link.soc !== '99-9999')
  const cipFile = CipSocFileSchema.parse({
    meta: {
      source_name: 'CIP 2020 to SOC 2018 Crosswalk',
      source_url: 'https://nces.ed.gov/ipeds/cipcode/resources.aspx?y=56',
      vintage_date: '2020-04-30',
      retrieved_date: cipRetrieved,
      licence: 'Public domain (U.S. government work)',
      credit:
        'U.S. Department of Education, Institute of Education Sciences, National Center for Education Statistics, with the U.S. Bureau of Labor Statistics.'
    },
    links
  })

  await Bun.write(join(OUT, 'onet-preparation.json'), serialize(prepFile))
  await Bun.write(join(OUT, 'cip-soc.json'), serialize(cipFile))
  const values = Object.values(preparation)
  const count = (test: (p: OccupationPreparation) => boolean) => values.filter(test).length
  console.info(
    `onet-preparation.json: ${values.length} occupations; survey ${count((p) => p.basis === 'survey')}, ` +
      `Job Zone only ${count((p) => p.basis === 'job_zone')}, none ${count((p) => p.basis === 'none')}; ` +
      `interests ${count((p) => p.interests !== null)}; experience 4+ years ${count((p) => (p.experience_years ?? 0) >= 4)}`
  )
  console.info(`cip-soc.json: ${links.length} links, ${new Set(links.map((l) => l.cip)).size} CIP codes`)
}

await main()
