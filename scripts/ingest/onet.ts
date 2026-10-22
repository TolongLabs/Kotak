// Ingest the O*NET 30.1 database into data/onet/: occupations with ISCO-08 and MASCO 2020 crosswalks, tasks
// with their work-activity links, the GWA > IWA > DWA reference, and the title search index. On the same
// O*NET-SOC codes it adds two supplements: Hot Technologies from O*NET 30.3 and Emerging Tasks from O*NET 31.0.
// Run: bun run ingest:onet [--refresh]. Downloads go to .cache/onet/<version>/ and are reused unless --refresh.
// Docs: https://www.onetcenter.org/dictionary/30.1/text/ and https://www.onetcenter.org/crosswalks.html

import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { strFromU8, unzipSync } from 'fflate'
import {
  ONET_LICENCE,
  ONET_LICENCE_URL,
  ONET_MODIFICATION_NOTICE,
  OnetEmergingTasksFileSchema,
  OnetHotTechnologiesFileSchema,
  OnetMascoMatchSchema,
  OnetOccupationsFileSchema,
  OnetTasksFileSchema,
  OnetTitleIndexSchema,
  OnetWorkActivitiesFileSchema,
  onetCredit,
  type OnetEmergingTask,
  type OnetHotTechnology,
  type OnetMeta,
  type OnetOccupation,
  type OnetTask,
  type OnetTitleEntry,
  type OnetTitleKind
} from '../../packages/shared/src/data/onet'
import { TITLE_KEY_VERSION, normalizeTitle } from '../../packages/shared/src/data/title-lookup'
import { MASCO_CHECKED_DATE, MASCO_MATCHES, MASCO_SOURCE_URL } from './onet-masco-matches'

const VERSION = '30.1'
const RELEASE_LABEL = 'December 2025'
// O*NET dates its releases by month only; the first of the month stands for "December 2025".
const VINTAGE_DATE = '2025-12-01'
const DOWNLOAD_URL = `https://www.onetcenter.org/dl_files/database/db_${VERSION.replace('.', '_')}_text/`
const ESCO_CROSSWALK_URL = 'https://www.onetcenter.org/crosswalks/esco/ESCO_to_ONET-SOC.xlsx'

const ROOT = join(import.meta.dir, '../..')
const CACHE_DIR = join(ROOT, '.cache/onet', VERSION)
const OUT_DIR = join(ROOT, 'data/onet')
const REFRESH = process.argv.includes('--refresh')

const FILES = {
  occupations: ['Occupation Data.txt', ['O*NET-SOC Code', 'Title', 'Description']],
  alternateTitles: ['Alternate Titles.txt', ['O*NET-SOC Code', 'Alternate Title', 'Short Title', 'Source(s)']],
  tasks: [
    'Task Statements.txt',
    ['O*NET-SOC Code', 'Task ID', 'Task', 'Task Type', 'Incumbents Responding', 'Date', 'Domain Source']
  ],
  tasksToDwas: ['Tasks to DWAs.txt', ['O*NET-SOC Code', 'Task ID', 'DWA ID', 'Date', 'Domain Source']],
  dwas: ['DWA Reference.txt', ['Element ID', 'IWA ID', 'DWA ID', 'DWA Title']],
  iwas: ['IWA Reference.txt', ['Element ID', 'IWA ID', 'IWA Title']],
  contentModel: ['Content Model Reference.txt', ['Element ID', 'Element Name', 'Description']],
  related: ['Related Occupations.txt', ['O*NET-SOC Code', 'Related O*NET-SOC Code', 'Relatedness Tier', 'Index']]
} as const satisfies Record<string, readonly [string, readonly string[]]>

const ESCO_FILE = 'ESCO_to_ONET-SOC.xlsx'
const ESCO_HEADER = ['ESCO/ISCO Code', 'ESCO/ISCO Title', 'O*NET-SOC 2019 Code', 'O*NET-SOC 2019 Title']

// The supplements docs/TRD.md lists. O*NET 30.3 renamed Technology Skills to Software Skills, and O*NET 31.0
// documents its files as Excel, CSV and JSON, not text.
// Docs: https://www.onetcenter.org/dictionary/30.3/text/software_skills.html and
// https://www.onetcenter.org/dictionary/31.0/json/emerging_tasks.html
const HOT_TECHNOLOGIES = {
  version: '30.3',
  release_label: 'May 2026',
  vintage_date: '2026-05-01',
  download_url: 'https://www.onetcenter.org/dl_files/database/db_30_3_text/',
  file: 'Software Skills.txt',
  columns: ['O*NET-SOC Code', 'Workplace Example', 'Element ID', 'Element Name', 'Hot Technology', 'In Demand']
} as const
const EMERGING_TASKS = {
  version: '31.0',
  release_label: 'August 2026',
  vintage_date: '2026-08-01',
  download_url: 'https://www.onetcenter.org/dl_files/database/db_31_0_json/',
  file: 'emerging_tasks.json',
  columns: [
    'onetsoc_code',
    'title',
    'task',
    'category',
    'original_task_id',
    'original_task',
    'date_updated',
    'domain_source'
  ]
} as const
type Supplement = typeof HOT_TECHNOLOGIES | typeof EMERGING_TASKS
type EmergingTaskRow = {
  onetsoc_code: string
  task: string
  category: OnetEmergingTask['category']
  original_task_id: number | null
  original_task: string | null
  date_updated: string
  domain_source: string
}

/** Fetch once into the cache, backing off on 429 and 5xx. Returns true when it downloaded. */
async function download(url: string, path: string): Promise<boolean> {
  if (!REFRESH && (await Bun.file(path).exists())) return false
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url)
    if (response.ok) {
      await Bun.write(path, response)
      return true
    }
    if (attempt === 4 || (response.status !== 429 && response.status < 500)) {
      throw new Error(`GET ${url} returned HTTP ${response.status}`)
    }
    await Bun.sleep(1000 * 2 ** attempt)
  }
}

/** The date in the folder's retrieved-date.txt, set to today when this run downloaded into the folder. */
async function retrievedOn(dir: string, downloaded: boolean): Promise<string> {
  const stamp = Bun.file(join(dir, 'retrieved-date.txt'))
  if (downloaded || !(await stamp.exists())) await Bun.write(stamp, new Date().toISOString().slice(0, 10))
  return (await stamp.text()).trim()
}

/** Downloads a supplement's one file into .cache/onet/<version>/. */
async function fetchSupplement(supplement: Supplement): Promise<{ dir: string; retrievedDate: string }> {
  const dir = join(ROOT, '.cache/onet', supplement.version)
  await mkdir(dir, { recursive: true })
  const url = `${supplement.download_url}${encodeURIComponent(supplement.file)}`
  return { dir, retrievedDate: await retrievedOn(dir, await download(url, join(dir, supplement.file))) }
}

async function readTsv(name: string, columns: readonly string[], dir = CACHE_DIR): Promise<string[][]> {
  const lines = (await Bun.file(join(dir, name)).text()).split(/\r?\n/).filter((line) => line.length > 0)
  if (lines[0] !== columns.join('\t')) throw new Error(`${name}: unexpected header "${lines[0]}"`)
  return lines.slice(1).map((line, i) => {
    const cells = line.split('\t')
    if (cells.length !== columns.length) throw new Error(`${name} line ${i + 2}: ${cells.length} columns`)
    return cells
  })
}

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, entity: string) =>
    entity[0] === '#'
      ? String.fromCodePoint(Number(entity[1] === 'x' ? `0${entity.slice(1)}` : entity.slice(1)))
      : XML_ENTITIES[entity]
  )
}

/** Rows of the first worksheet of an XLSX file, as text cells by column. */
function readXlsxRows(bytes: Uint8Array): string[][] {
  const wanted = ['xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml']
  const files = unzipSync(bytes, { filter: (file) => wanted.includes(file.name) })
  const shared = [...strFromU8(files[wanted[0]]).matchAll(/<si>([\s\S]*?)<\/si>/g)].map(([, item]) =>
    [...item.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(([, text]) => decodeXml(text)).join('')
  )
  return [...strFromU8(files[wanted[1]]).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(([, row]) => {
    const cells: string[] = []
    for (const [, column, attributes, body] of row.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const value = /<v>([\s\S]*?)<\/v>/.exec(body ?? '')?.[1]
      if (value === undefined) continue
      const index = [...column].reduce((n, letter) => n * 26 + letter.charCodeAt(0) - 64, 0) - 1
      cells[index] = /\bt="s"/.test(attributes) ? shared[Number(value)] : decodeXml(value)
    }
    return cells
  })
}

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

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
  await mkdir(CACHE_DIR, { recursive: true })
  await mkdir(OUT_DIR, { recursive: true })

  let downloaded = false
  for (const [name] of Object.values(FILES)) {
    downloaded = (await download(`${DOWNLOAD_URL}${encodeURIComponent(name)}`, join(CACHE_DIR, name))) || downloaded
  }
  downloaded = (await download(ESCO_CROSSWALK_URL, join(CACHE_DIR, ESCO_FILE))) || downloaded
  const retrievedDate = await retrievedOn(CACHE_DIR, downloaded)

  const [occupationRows, alternateRows, taskRows, taskDwaRows, dwaRows, iwaRows, modelRows, relatedRows] =
    await Promise.all(Object.values(FILES).map(([name, columns]) => readTsv(name, columns)))

  // Occupations: keep those with task statements, since corners and matching need tasks.
  const kept = new Set(taskRows.map(([code]) => code))
  const allOccupations = new Map(occupationRows.map(([code, title, description]) => [code, { title, description }]))
  for (const code of kept) if (!allOccupations.has(code)) throw new Error(`task for unknown occupation ${code}`)

  // Work activities: DWA > IWA > GWA, with GWA names from the Content Model.
  const elementNames = new Map(modelRows.map(([id, name]) => [id, name]))
  const iwas = iwaRows.map(([gwaId, iwaId, title]) => ({ iwa_id: iwaId, gwa_id: gwaId, title }))
  const dwas = dwaRows.map(([, iwaId, dwaId, title]) => ({ dwa_id: dwaId, iwa_id: iwaId, title }))
  const gwas = [...new Set(iwas.map((iwa) => iwa.gwa_id))].sort(byText).map((gwaId) => {
    const title = elementNames.get(gwaId)
    if (!title) throw new Error(`no Content Model name for ${gwaId}`)
    return { gwa_id: gwaId, title }
  })
  const iwaOfDwa = new Map(dwas.map((dwa) => [dwa.dwa_id, dwa.iwa_id]))

  // Tasks with their DWA and IWA links.
  const dwasOfTask = new Map<string, Set<string>>()
  for (const [code, taskId, dwaId] of taskDwaRows) {
    if (!iwaOfDwa.has(dwaId)) throw new Error(`unknown DWA ${dwaId}`)
    const key = `${code}|${taskId}`
    dwasOfTask.set(key, (dwasOfTask.get(key) ?? new Set()).add(dwaId))
  }
  const tasks: Record<string, OnetTask[]> = {}
  for (const [code, taskId, statement, type] of taskRows) {
    if (type !== 'Core' && type !== 'Supplemental' && type !== 'n/a') throw new Error(`task ${taskId}: type ${type}`)
    const dwaIds = [...(dwasOfTask.get(`${code}|${taskId}`) ?? [])].sort(byText)
    const iwaIds = [...new Set(dwaIds.map((dwaId) => iwaOfDwa.get(dwaId) as string))].sort(byText)
    ;(tasks[code] ??= []).push({
      task_id: Number(taskId),
      statement,
      task_type: type === 'n/a' ? null : type,
      dwa_ids: dwaIds,
      iwa_ids: iwaIds
    })
  }
  for (const list of Object.values(tasks)) list.sort((a, b) => a.task_id - b.task_id)

  // Related occupations, in O*NET's expert-review order.
  const related = new Map<string, OnetOccupation['related']>()
  for (const [code, relatedCode, tier, index] of relatedRows) {
    if (!kept.has(code)) continue
    if (!kept.has(relatedCode)) throw new Error(`${code} relates to ${relatedCode}, which has no tasks`)
    const link = {
      onet_code: relatedCode,
      tier: tier as OnetOccupation['related'][number]['tier'],
      index: Number(index)
    }
    related.set(code, [...(related.get(code) ?? []), link])
  }
  for (const links of related.values()) links.sort((a, b) => a.index - b.index)

  // ISCO-08 through O*NET's ESCO crosswalk: the leading digits of each ESCO code are its ISCO-08 group.
  const escoRows = readXlsxRows(await Bun.file(join(CACHE_DIR, ESCO_FILE)).bytes())
  const headerAt = escoRows.findIndex((row) => row.join('|') === ESCO_HEADER.join('|'))
  if (headerAt < 0) throw new Error(`${ESCO_FILE}: header row not found`)
  const iscoLinks = new Map<string, Map<string, number>>()
  for (const [escoCode, , onetCode] of escoRows.slice(headerAt + 1)) {
    if (escoCode === undefined && onetCode === undefined) continue
    const isco = escoCode?.split('.')[0] ?? ''
    if (!/^\d{3,4}$/.test(isco) || !onetCode) throw new Error(`${ESCO_FILE}: bad row ${escoCode} ${onetCode}`)
    const groups = iscoLinks.get(onetCode) ?? new Map<string, number>()
    iscoLinks.set(onetCode, groups.set(isco, (groups.get(isco) ?? 0) + 1))
  }

  // MASCO 2020: only the hand-checked matches; every other occupation is flagged unmatched.
  const masco = new Map(MASCO_MATCHES.map((match) => [match.onet_code, OnetMascoMatchSchema.parse(match).masco_2020]))
  for (const code of masco.keys()) if (!kept.has(code)) throw new Error(`MASCO match for unknown occupation ${code}`)

  const occupations: OnetOccupation[] = [...kept].sort(byText).map((code) => {
    const { title, description } = allOccupations.get(code) as { title: string; description: string }
    const isco08 = [...(iscoLinks.get(code) ?? new Map<string, number>())]
      .map(([isco, links]) => ({ isco08: isco, esco_links: links }))
      .sort((a, b) => b.esco_links - a.esco_links || byText(a.isco08, b.isco08))
    const masco2020 = masco.get(code) ?? null
    return {
      onet_code: code,
      title,
      description,
      masco_2020: masco2020,
      masco_unmatched: masco2020 === null,
      isco08,
      related: related.get(code) ?? []
    }
  })

  // Title index: titles, alternate titles and short titles, one entry per key and occupation.
  const kindRank: Record<OnetTitleKind, number> = { title: 0, alternate: 1, short: 2 }
  const entries = new Map<string, OnetTitleEntry>()
  const addEntry = (text: string, code: string, kind: OnetTitleKind) => {
    const key = normalizeTitle(text)
    const existing = entries.get(`${key}|${code}`)
    if (key && (!existing || kindRank[kind] < kindRank[existing[3]]))
      entries.set(`${key}|${code}`, [key, code, text, kind])
  }
  for (const occupation of occupations) addEntry(occupation.title, occupation.onet_code, 'title')
  let alternateCount = 0
  let shortCount = 0
  for (const [code, alternate, short] of alternateRows) {
    if (!kept.has(code)) continue
    alternateCount++
    addEntry(alternate, code, 'alternate')
    if (short !== 'n/a') {
      shortCount++
      addEntry(short, code, 'short')
    }
  }
  const titleEntries = [...entries.values()].sort(
    (a, b) => byText(a[0], b[0]) || kindRank[a[3]] - kindRank[b[3]] || byText(a[1], b[1])
  )

  const meta: OnetMeta = {
    source_name: `O*NET ${VERSION} Database`,
    source_url: 'https://www.onetcenter.org/db_releases.html',
    vintage_date: VINTAGE_DATE,
    geo_or_layer: 'US O*NET-SOC 2019 taxonomy',
    licence: ONET_LICENCE,
    licence_url: ONET_LICENCE_URL,
    credit: onetCredit(VERSION),
    modification_notice: ONET_MODIFICATION_NOTICE,
    version: VERSION,
    release_label: RELEASE_LABEL,
    download_url: DOWNLOAD_URL,
    retrieved_date: retrievedDate,
    modifications: [
      `Kept the ${kept.size} occupations that have task statements and dropped the ${allOccupations.size - kept.size} without them.`,
      'Linked each task to its Intermediate (IWA) and Generalized (GWA) Work Activities through Tasks to DWAs and DWA Reference.',
      'Recorded the Task Type "n/a" as null.',
      'Added ISCO-08 groups from the ESCO to O*NET-SOC crosswalk and hand-checked MASCO 2020 unit-group codes.',
      'Added normalised search keys to titles, alternate titles and short titles.',
      'Left out task ratings, incumbent counts, task dates and alternate-title sources.'
    ],
    crosswalks: [
      {
        source_name: 'ESCO to O*NET-SOC 2019 crosswalk, O*NET Resource Center',
        source_url: ESCO_CROSSWALK_URL,
        vintage_date: null,
        retrieved_date: retrievedDate,
        licence: 'CC BY 4.0',
        method:
          'The first 3 or 4 digits of each ESCO/ISCO code give its ISCO-08 group; esco_links counts the crosswalk rows per group. O*NET built the crosswalk with AI techniques and human validation.'
      },
      {
        source_name: 'MASCO 2020, Ministry of Human Resources Malaysia',
        source_url: MASCO_SOURCE_URL,
        vintage_date: null,
        retrieved_date: MASCO_CHECKED_DATE,
        licence: '© Ministry of Human Resources 2020, no reproduction; only 4-digit codes are stored',
        method:
          'Hand-checked 1-to-1 matches in scripts/ingest/onet-masco-matches.ts: the O*NET title equals the MASCO 2020 unit-group title, and the ESCO crosswalk links the same 4-digit code.'
      }
    ]
  }
  const supplementMeta = (supplement: Supplement, retrieved: string, modifications: string[]): OnetMeta => ({
    ...meta,
    source_name: `O*NET ${supplement.version} Database`,
    vintage_date: supplement.vintage_date,
    credit: onetCredit(supplement.version),
    version: supplement.version,
    release_label: supplement.release_label,
    download_url: supplement.download_url,
    retrieved_date: retrieved,
    modifications,
    crosswalks: []
  })

  // Hot Technologies: the Software Skills examples flagged as hot, joined on the 30.1 O*NET-SOC codes.
  const hot = await fetchSupplement(HOT_TECHNOLOGIES)
  const softwareRows = await readTsv(HOT_TECHNOLOGIES.file, HOT_TECHNOLOGIES.columns, hot.dir)
  const hotTechnologies: Record<string, OnetHotTechnology[]> = {}
  for (const [code, example, elementId, elementName, isHot, inDemand] of softwareRows) {
    if (!/^[YN]$/.test(isHot) || !/^[YN]$/.test(inDemand))
      throw new Error(`${code} ${example}: flags ${isHot} ${inDemand}`)
    if (isHot === 'N') continue
    if (!kept.has(code)) throw new Error(`hot technology for unknown occupation ${code}`)
    ;(hotTechnologies[code] ??= []).push({
      example,
      element_id: elementId,
      element_name: elementName,
      in_demand: inDemand === 'Y'
    })
  }
  const hotLinks = Object.values(hotTechnologies).flat()

  // Emerging Tasks, joined on the 30.1 O*NET-SOC codes; a revision's original task must be one of the 30.1 tasks.
  const emerging = await fetchSupplement(EMERGING_TASKS)
  const emergingFile: { column: { column_id: string }[]; row: EmergingTaskRow[] } = await Bun.file(
    join(emerging.dir, EMERGING_TASKS.file)
  ).json()
  const emergingColumns = emergingFile.column.map((column) => column.column_id)
  if (emergingColumns.join('|') !== EMERGING_TASKS.columns.join('|')) {
    throw new Error(`${EMERGING_TASKS.file}: unexpected columns "${emergingColumns.join(', ')}"`)
  }
  const emergingTasks: Record<string, OnetEmergingTask[]> = {}
  for (const row of emergingFile.row) {
    const code = row.onetsoc_code
    if (!kept.has(code)) throw new Error(`emerging task for unknown occupation ${code}`)
    if (row.original_task_id !== null && !tasks[code].some((task) => task.task_id === row.original_task_id)) {
      throw new Error(`emerging task revises unknown task ${row.original_task_id} of ${code}`)
    }
    ;(emergingTasks[code] ??= []).push({
      statement: row.task,
      category: row.category,
      original_task_id: row.original_task_id,
      original_task: row.original_task,
      date_updated: row.date_updated,
      domain_source: row.domain_source
    })
  }

  const outputs = {
    'occupations.json': OnetOccupationsFileSchema.parse({ meta, occupations }),
    'tasks.json': OnetTasksFileSchema.parse({ meta, tasks }),
    'work-activities.json': OnetWorkActivitiesFileSchema.parse({ meta, gwas, iwas, dwas }),
    'title-index.json': OnetTitleIndexSchema.parse({
      meta,
      key_version: TITLE_KEY_VERSION,
      occupations: occupations.map((o) => [o.onet_code, o.title, o.masco_2020]),
      entries: titleEntries
    }),
    'hot-technologies.json': OnetHotTechnologiesFileSchema.parse({
      meta: supplementMeta(HOT_TECHNOLOGIES, hot.retrievedDate, [
        `Kept the ${hotLinks.length} Software Skills examples flagged as Hot Technology and dropped the ${softwareRows.length - hotLinks.length} others.`,
        'Grouped them by O*NET-SOC code, the codes of occupations.json, and recorded the In Demand flag (Y or N) as a boolean.'
      ]),
      hot_technologies: hotTechnologies
    }),
    'emerging-tasks.json': OnetEmergingTasksFileSchema.parse({
      meta: supplementMeta(EMERGING_TASKS, emerging.retrievedDate, [
        'Grouped the rows by O*NET-SOC code, the codes of occupations.json, and left out the occupation title.'
      ]),
      emerging_tasks: emergingTasks
    })
  }
  const sizes: string[] = []
  for (const [name, file] of Object.entries(outputs)) {
    const bytes = await Bun.write(join(OUT_DIR, name), serialize(file))
    sizes.push(`${name} ${(bytes / 1024 / 1024).toFixed(2)} MB`)
  }

  const allTasks = Object.values(tasks).flat()
  const linkedIwas = new Set(allTasks.flatMap((task) => task.iwa_ids))
  const coreIwaGroups = Object.values(tasks).map(
    (list) => new Set(list.filter((t) => t.task_type === 'Core').flatMap((t) => t.iwa_ids)).size
  )
  console.log(
    [
      `O*NET ${VERSION} (${RELEASE_LABEL}), retrieved ${retrievedDate}`,
      `occupations: ${occupations.length} kept, ${allOccupations.size - kept.size} without tasks dropped`,
      `alternate titles: ${alternateCount} (+ ${shortCount} short titles), ${titleEntries.length} index entries`,
      `tasks: ${allTasks.length} (core ${allTasks.filter((t) => t.task_type === 'Core').length}, supplemental ${allTasks.filter((t) => t.task_type === 'Supplemental').length}, unrated ${allTasks.filter((t) => t.task_type === null).length})`,
      `work activities: ${gwas.length} GWAs, ${iwas.length} IWAs (${linkedIwas.size} linked to tasks), ${dwas.length} DWAs`,
      `occupations with 6+ core IWA groups: ${coreIwaGroups.filter((n) => n >= 6).length}`,
      `related links: ${occupations.reduce((n, o) => n + o.related.length, 0)}`,
      `ISCO-08: ${occupations.filter((o) => o.isco08.length > 0).length} occupations linked`,
      `MASCO 2020: ${occupations.filter((o) => !o.masco_unmatched).length} matched, ${occupations.filter((o) => o.masco_unmatched).length} unmatched`,
      `hot technologies (O*NET ${HOT_TECHNOLOGIES.version}, retrieved ${hot.retrievedDate}): ${new Set(hotLinks.map((h) => h.example)).size} technologies, ${hotLinks.length} links to ${Object.keys(hotTechnologies).length} occupations`,
      `emerging tasks (O*NET ${EMERGING_TASKS.version}, retrieved ${emerging.retrievedDate}): ${emergingFile.row.length} for ${Object.keys(emergingTasks).length} occupations, ${emergingFile.row.filter((r) => r.date_updated === EMERGING_TASKS.vintage_date).length} dated ${EMERGING_TASKS.release_label}`,
      `wrote ${sizes.join(', ')}`
    ].join('\n')
  )
}

await main()
