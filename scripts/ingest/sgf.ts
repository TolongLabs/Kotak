// Ingests the SkillsFuture Singapore (SGF) Skills Framework v2.0 workbooks (#sgf) into validated JSON
// under data/sgf/. Run with `bun run ingest:sgf`.
//
// The three workbooks are downloaded by hand from jobsandskills.gov.sg and cached in .cache/sgf/, which
// is gitignored: the raw files are SWDA's and are never committed. Each file's sha256 is recorded in the
// snapshot meta so a re-run reads the same bytes.
//
// Reading .xlsx directly, with the `fflate` the repo already depends on: an .xlsx is a zip of XML, and
// the sheets here are plain (shared strings, no formulas in the cells we read), so a small reader beats
// adding a spreadsheet dependency.
//
// K&A sheet (`TSC_CCS_K&A`, 150,265 rows, 95.8 MB as JSON) is deliberately not ingested. It holds the
// knowledge and ability items behind each proficiency level and is the one part of the framework that
// repeats the TSC description on every row. It would multiply the bundle several times over for detail
// no screen reads yet. Recorded under `excluded` in the meta rather than dropped silently.

import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { unzipSync } from 'fflate'
import { format, resolveConfig } from 'prettier'
import {
  SGF_ROLE_SEPARATOR,
  SgfRolesFileSchema,
  SgfSkillsFileSchema,
  SgfUniqueSkillsFileSchema,
  type SgfProficiency,
  type SgfRole,
  type SgfSkill,
  type SgfSkillMapping,
  type SgfSkillRef,
  type SgfSkillType,
  type SgfUniqueSkill,
  type SgfWorkFunction
} from '../../packages/shared/src/data/sgf'

const ROOT = join(import.meta.dir, '../..')
const CACHE_DIR = join(ROOT, '.cache/sgf')
const OUT_DIR = join(ROOT, 'data/sgf')

const WORKBOOKS = {
  framework: 'jobsandskills-skillsfuture-skills-framework-dataset.xlsx',
  mapping: 'jobsandskills-skillsfuture-tsc-to-unique-skills-mapping.xlsx',
  skills: 'jobsandskills-skillsfuture-unique-skills-list.xlsx'
} as const

const SOURCE_NAME = 'SkillsFuture Singapore Skills Framework'
const SOURCE_URL = 'https://www.skillsfuture.gov.sg/skills-framework'
const PUBLISHER = 'Singapore Workforce Development Agency (SWDA), Ministry of Education'
const VERSION = '2.0'
// The framework publishes quarterly. This is the last-modified date of the most recently revised
// workbook, taken from the .xlsx document properties, and is the newest statement of the data's vintage.
const VINTAGE_DATE = '2026-09-30'
// Every workbook carries the M365 sensitivity label "Official (Open)", the Singapore Government's
// classification for material cleared for public sharing. The label is not a licence: SWDA's terms of use
// forbid reproduction or display "without the prior written permission of SWDA" (docs/research/trend-data.md).
// A SkillsFuture ambassador gave the team verbal approval at the hackathon on 31 October 2026; nothing in
// writing yet. Kotak stores only the fields it needs and cites each one.
const LICENCE =
  'SWDA terms of use; used on verbal approval from a SkillsFuture ambassador to the team at the XMUM SDC Hackathon, 31 October 2026. Written permission not yet obtained.'
const LICENCE_URL = 'https://jobsandskills.swda.gov.sg/terms-of-use'
const ATTRIBUTION =
  'Source: SkillsFuture Singapore Skills Framework v2.0, published by the Singapore Workforce Development Agency (SWDA).'

const EXCLUDED = [
  {
    sheet: 'TSC_CCS_K&A',
    rows: 150265,
    reason:
      'The knowledge and ability items behind each proficiency level: 95.8 MB of JSON, the framework’s bulk, and no screen reads it yet.'
  }
]

// ---------------------------------------------------------------- xlsx reading

const XML_ENTITIES: Record<string, string> = { lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' }
const decode = (text: string) =>
  text.replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|([a-z]+));/g, (whole, hex, dec, name) =>
    hex
      ? String.fromCodePoint(parseInt(hex, 16))
      : dec
        ? String.fromCodePoint(Number(dec))
        : (XML_ENTITIES[name] ?? whole)
  )

const columnIndex = (ref: string) => {
  let n = 0
  for (const ch of ref) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

/** Every sheet of one workbook, as rows of cell text in column order. */
async function readWorkbook(file: string): Promise<Map<string, string[][]>> {
  const path = join(CACHE_DIR, file)
  const handle = Bun.file(path)
  if (!(await handle.exists())) throw new Error(`Missing ${path}. Download the workbooks into .cache/sgf/.`)
  const zip = unzipSync(new Uint8Array(await handle.arrayBuffer()))
  const part = (name: string) => (zip[name] ? new TextDecoder().decode(zip[name]) : '')

  // The shared string table: every `t="s"` cell holds an index into it.
  const strings = [...part('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((si) =>
    decode([...si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''))
  )

  const targets = new Map<string, string>()
  for (const rel of part('xl/_rels/workbook.xml.rels').matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g))
    targets.set(rel[1], rel[2].replace(/^\/?xl\//, ''))

  const sheets = new Map<string, string[][]>()
  for (const tag of part('xl/workbook.xml').matchAll(/<sheet[^>]*name="([^"]*)"[^>]*r:id="([^"]+)"/g)) {
    const name = decode(tag[1])
    const xml = part(`xl/${targets.get(tag[2]) ?? ''}`)
    if (!xml) throw new Error(`${file}: sheet ${name} has no part`)
    const rows: string[][] = []
    for (const row of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells: string[] = []
      for (const cell of row[1].matchAll(/<c ([^>]*?)\/>|<c ([^>]*?)>([\s\S]*?)<\/c>/g)) {
        const attrs = cell[1] ?? cell[2] ?? ''
        const body = cell[3] ?? ''
        const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1]
        if (!ref) continue
        const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? ''
        const inline = /<is>([\s\S]*?)<\/is>/.exec(body)?.[1]
        const value =
          /t="s"/.test(attrs) && raw !== ''
            ? (strings[Number(raw)] ?? '')
            : inline
              ? decode([...inline.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''))
              : decode(raw)
        cells[columnIndex(ref)] = value
      }
      rows.push(cells.map((value) => value ?? ''))
    }
    sheets.set(name, rows)
  }
  return sheets
}

/** A sheet's rows as objects keyed by its header row, dropping rows that are blank in every column. */
function table(rows: string[][], sheet: string): Record<string, string>[] {
  const header = rows[0]
  if (!header) throw new Error(`${sheet}: no header row`)
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => Object.fromEntries(header.map((key, index) => [key, row[index] ?? ''])))
}

const cell = (row: Record<string, string>, key: string, where: string) => {
  const value = row[key]?.trim() ?? ''
  if (value === '') throw new Error(`${where}: empty ${key}`)
  return value
}

/** A field the source sometimes leaves blank, which becomes null rather than an invented value. */
const optional = (row: Record<string, string>, key: string) => row[key]?.trim() || null

// ------------------------------------------------------------- value coercions

/** A TSC carries a proficiency level 1 to 6; a CCS carries a word in that column, which has no level. */
function proficiency(raw: string): SgfProficiency {
  const value = raw.trim()
  if (value === '') return null
  const level = Number(value)
  return Number.isInteger(level) && level >= 1 && level <= 6 ? level : null
}

function skillType(raw: string, where: string): SgfSkillType {
  const value = raw.trim().toLowerCase()
  if (value !== 'tsc' && value !== 'ccs') throw new Error(`${where}: unknown TSC_CCS type "${raw}"`)
  return value
}

/** The retired-key sheet writes `(None)` in the type column for 3 rows, which is a gap, not a type. */
function optionalSkillType(raw: string, where: string): SgfSkillType | null {
  const value = raw.trim().toLowerCase()
  if (value === '' || value === '(none)') return null
  return skillType(raw, where)
}

const splitTags = (raw: string) =>
  raw
    .split(/[;,]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '')

const roleId = (sector: string, track: string, title: string) => [sector, track, title].join(SGF_ROLE_SEPARATOR)

// ------------------------------------------------------------------- ingestion

const problems: string[] = []
const note = (message: string) => problems.push(message)

async function readRoles() {
  const sheets = await readWorkbook(WORKBOOKS.framework)
  const sheet = (name: string) => {
    const rows = sheets.get(name)
    if (!rows) throw new Error(`${WORKBOOKS.framework}: no sheet ${name}`)
    return rows
  }

  const descriptions = table(sheet('Job Role_Description'), 'Job Role_Description')
  const functionRows = table(sheet('Job Role_CWF_KT'), 'Job Role_CWF_KT')
  const mappings = table(sheet('Job Role_TSC_CCS'), 'Job Role_TSC_CCS')

  // Critical work functions, in sheet order, each with its key tasks in sheet order.
  const byRoleFunctions = new Map<string, Map<string, SgfWorkFunction>>()
  for (const [index, row] of functionRows.entries()) {
    const where = `Job Role_CWF_KT row ${index + 2}`
    const id = roleId(cell(row, 'Sector', where), cell(row, 'Track', where), cell(row, 'Job Role', where))
    const name = cell(row, 'Critical Work Function', where)
    const task = cell(row, 'Key Tasks', where)
    const workFunctions = byRoleFunctions.get(id) ?? new Map<string, SgfWorkFunction>()
    const found = workFunctions.get(name) ?? { name, key_tasks: [] }
    if (found.key_tasks.includes(task)) note(`${where}: duplicate key task under "${name}"`)
    found.key_tasks.push(task)
    workFunctions.set(name, found)
    byRoleFunctions.set(id, workFunctions)
  }

  const byRoleSkills = new Map<string, SgfSkillRef[]>()
  for (const [index, row] of mappings.entries()) {
    const where = `Job Role_TSC_CCS row ${index + 2}`
    const id = roleId(cell(row, 'Sector', where), cell(row, 'Track', where), cell(row, 'Job Role', where))
    const ref: SgfSkillRef = {
      code: cell(row, 'TSC_CCS Code', where),
      title: cell(row, 'TSC_CCS Title', where),
      type: skillType(cell(row, 'TSC_CCS Type', where), where),
      proficiency_level: proficiency(row['Proficiency Level'] ?? '')
    }
    byRoleSkills.set(id, [...(byRoleSkills.get(id) ?? []), ref])
  }

  const roles: Record<string, SgfRole> = {}
  for (const [index, row] of descriptions.entries()) {
    const where = `Job Role_Description row ${index + 2}`
    const sector = cell(row, 'Sector', where)
    const track = cell(row, 'Track', where)
    const title = cell(row, 'Job Role', where)
    const id = roleId(sector, track, title)
    if (roles[id]) throw new Error(`${where}: duplicate role ${id}`)
    const skills = byRoleSkills.get(id)
    if (!skills) note(`${id}: listed in Job Role_Description with no TSC/CCS mapping`)
    roles[id] = {
      role_id: id,
      sector,
      track,
      title,
      description: cell(row, 'Job Role Description', where),
      performance_expectation: optional(row, 'Performance Expectation'),
      work_functions: [...(byRoleFunctions.get(id)?.values() ?? [])],
      skills: skills ?? []
    }
  }

  // A role's skills that no role claims, and a role's functions that no description claims, are both
  // silent drops in the sheets, so say so rather than losing them.
  for (const id of byRoleFunctions.keys()) if (!roles[id]) note(`${id}: has work functions but no description row`)
  for (const id of byRoleSkills.keys()) if (!roles[id]) note(`${id}: has skills but no description row`)

  const sectors = [...new Set(Object.values(roles).map((role) => role.sector))].sort((a, b) => a.localeCompare(b, 'en'))
  return { sectors, roles }
}

async function readSkillKeys() {
  const sheets = await readWorkbook(WORKBOOKS.framework)
  const active = table(sheets.get('TSC_CCS_Key')!, 'TSC_CCS_Key')
  const retired = table(sheets.get('TSC_CCS_Key_Retired')!, 'TSC_CCS_Key_Retired')

  const skills: Record<string, SgfSkill> = {}
  const add = (rows: Record<string, string>[], sheetName: string, status: SgfSkill['status'], dateKey: string) => {
    for (const [index, row] of rows.entries()) {
      const where = `${sheetName} row ${index + 2}`
      const code = cell(row, 'TSC Code', where)
      if (skills[code]) {
        note(`${code}: in both ${skills[code].status} and ${status} lists; keeping ${skills[code].status}`)
        continue
      }
      skills[code] = {
        code,
        sector: cell(row, 'Sector', where),
        category: cell(row, 'TSC_CCS Category', where),
        title: cell(row, 'TSC_CCS Title', where),
        description: cell(row, 'TSC_CCS Description', where),
        type: optionalSkillType(cell(row, 'TSC_CCS Type', where), where),
        status,
        dated: cell(row, dateKey, where)
      }
    }
  }
  add(active, 'TSC_CCS_Key', 'active', 'Latest Update Date')
  add(retired, 'TSC_CCS_Key_Retired', 'retired', 'Retired Date')
  return { skills }
}

async function readUniqueSkills() {
  const listed = await readWorkbook(WORKBOOKS.skills)
  const mapped = await readWorkbook(WORKBOOKS.mapping)

  const rows = table(listed.get('Unique Skills List')!, 'Unique Skills List')
  const skills: Record<string, SgfUniqueSkill> = {}
  for (const [index, row] of rows.entries()) {
    const where = `Unique Skills List row ${index + 2}`
    const id = cell(row, 'skill_id', where)
    if (skills[id]) throw new Error(`${where}: duplicate skill_id ${id}`)
    skills[id] = {
      skill_id: id,
      skill_transaction_id: cell(row, 'skill_transaction_id', where),
      title: cell(row, 'skill_title', where),
      description: cell(row, 'skill_description', where),
      type: skillType(cell(row, 'skill_type', where), where),
      emerging: cell(row, 'Emerging Skills', where) === '1',
      casl: cell(row, 'CASL Skills', where) === '1'
    }
  }

  const data = table(mapped.get('data')!, 'data')

  /** `No mapping` and a blank both mean the framework carries the skill over unchanged. */
  const side = (row: Record<string, string>, prefix: string, where: string) => {
    const title = row[`${prefix}_skill_title`]?.trim() ?? ''
    const type = row[`${prefix}_skill_type`]?.trim() ?? ''
    if (title === '' || type === '' || type === 'No mapping') return null
    return { title, description: row[`${prefix}_skill_desc`]?.trim() ?? '', type: skillType(type, where) }
  }

  const mappings: Record<string, SgfSkillMapping[]> = {}
  for (const [index, row] of data.entries()) {
    const where = `data row ${index + 2}`
    const code = cell(row, 'skills_framework_skill_code', where)
    const entry: SgfSkillMapping = {
      code,
      title: cell(row, 'skills_framework_skill_title', where),
      description: cell(row, 'skills_framework_skill_desc', where),
      proficiency_level: proficiency(row['skills_framework_skill_pl'] ?? ''),
      sector_tags: splitTags(row['Unique skill_updated_sector_tagging'] ?? ''),
      previous: side(row, 'Unique skill_previous', where),
      updated: side(row, 'Unique skill_updated', where)
    }
    mappings[code] = [...(mappings[code] ?? []), entry]
  }
  return { skills, mappings }
}

// ---------------------------------------------------------------------- output

const sha256 = async (file: string) => {
  const hasher = new Bun.CryptoHasher('sha256')
  for await (const chunk of Bun.file(join(CACHE_DIR, file)).stream()) hasher.update(chunk)
  return hasher.digest('hex')
}

async function write(path: string, value: unknown) {
  const text = await format(JSON.stringify(value), { ...(await resolveConfig(path)), filepath: path })
  await mkdir(OUT_DIR, { recursive: true })
  await Bun.write(path, text)
  return { path, bytes: Buffer.byteLength(text) }
}

const [roleData, skillData, uniqueData] = await Promise.all([readRoles(), readSkillKeys(), readUniqueSkills()])
const { sectors, roles } = roleData
const { skills: skillIndex } = skillData
const { skills: uniqueSkillsIndex, mappings } = uniqueData

const workbooks = await Promise.all(
  (Object.values(WORKBOOKS) as string[]).map(async (name) => ({
    name,
    sha256: await sha256(name),
    bytes: Bun.file(join(CACHE_DIR, name)).size
  }))
)

const meta = {
  dataset: 'sgf-skills-framework',
  source_name: SOURCE_NAME,
  source_url: SOURCE_URL,
  publisher: PUBLISHER,
  vintage_date: VINTAGE_DATE,
  geo_or_layer: 'Singapore, by sector and track',
  licence: LICENCE,
  licence_url: LICENCE_URL,
  attribution: ATTRIBUTION,
  version: VERSION,
  retrieved_date: new Date().toISOString().slice(0, 10),
  workbooks,
  notes: [
    `The framework is published quarterly by SWDA. This ingest reads version ${VERSION}, the ${VINTAGE_DATE} revision.`,
    'Roles are keyed by sector, track and title; skills by TSC/CCS code. Neither carries an O*NET-SOC code, so nothing here joins to data/onet/ by key.',
    `Excluded: ${EXCLUDED.map((e) => `\`${e.sheet}\` (${e.rows} rows) — ${e.reason}`).join(' ')}`
  ]
}

// Titles and descriptions repeat heavily (the mapping workbook carries its TSC's full description on every
// row and the framework repeats each role's description across every work function), so the files are
// written as keyed records and read back through the schemas, which rebuild the shared shape once.

const written = await Promise.all([
  write(join(OUT_DIR, 'roles.json'), SgfRolesFileSchema.parse({ meta, sectors, roles })),
  write(join(OUT_DIR, 'skills.json'), SgfSkillsFileSchema.parse({ meta, skills: skillIndex })),
  write(
    join(OUT_DIR, 'unique-skills.json'),
    SgfUniqueSkillsFileSchema.parse({ meta, skills: uniqueSkillsIndex, mappings })
  )
])

// --------------------------------------------------------------------- summary

const pad = (cells: (string | number)[], width = 16) => cells.map((value) => String(value).padEnd(width - 1)).join(' ')

console.log(`\nSource: ${SOURCE_NAME} v${VERSION} (${PUBLISHER})`)
console.log(`Vintage ${VINTAGE_DATE}, retrieved ${meta.retrieved_date}`)
for (const workbook of workbooks)
  console.log(
    `  ${workbook.name}  ${(workbook.bytes / 1024 / 1024).toFixed(1)} MB  sha256 ${workbook.sha256.slice(0, 12)}…`
  )

const roleList = Object.values(roles)
const skillList = Object.values(skillIndex)
const uniqueList = Object.values(uniqueSkillsIndex)
const mappingList = Object.values(mappings).flat()

console.log(`\nRoles: ${roleList.length} across ${sectors.length} sectors`)
console.log(pad(['sector', 'roles', 'work functions', 'key tasks', 'skills']))
for (const sector of sectors) {
  const inSector = roleList.filter((role) => role.sector === sector)
  const functions = inSector.reduce((total, role) => total + role.work_functions.length, 0)
  const tasks = inSector.reduce(
    (total, role) => total + role.work_functions.reduce((sum, fn) => sum + fn.key_tasks.length, 0),
    0
  )
  const refs = inSector.reduce((total, role) => total + role.skills.length, 0)
  console.log(pad([sector, inSector.length, functions, tasks, refs]))
}

console.log(`\nSkills: ${skillList.length} codes in the key`)
console.log(
  pad(['status', 'total', 'tsc', 'ccs']) +
    '\n' +
    pad([
      'active',
      skillList.filter((skill) => skill.status === 'active').length,
      skillList.filter((skill) => skill.status === 'active' && skill.type === 'tsc').length,
      skillList.filter((skill) => skill.status === 'active' && skill.type === 'ccs').length
    ]) +
    '\n' +
    pad([
      'retired',
      skillList.filter((skill) => skill.status === 'retired').length,
      skillList.filter((skill) => skill.status === 'retired' && skill.type === 'tsc').length,
      skillList.filter((skill) => skill.status === 'retired' && skill.type === 'ccs').length
    ])
)

console.log(`\nProfiles used by roles`)
const byLevel = new Map<string, number>()
for (const role of roleList)
  for (const ref of role.skills) {
    const key = ref.proficiency_level === null ? 'none (ccs)' : `level ${ref.proficiency_level}`
    byLevel.set(key, (byLevel.get(key) ?? 0) + 1)
  }
for (const [level, count] of [...byLevel].sort())
  console.log(`  ${level.padEnd(12)} ${count.toLocaleString('en')} role-skill rows`)

console.log(`\nUnique skills: ${uniqueList.length}`)
console.log(`  emerging          ${uniqueList.filter((skill) => skill.emerging).length}`)
console.log(`  CASL              ${uniqueList.filter((skill) => skill.casl).length}`)
console.log(`  emerging and CASL ${uniqueList.filter((skill) => skill.emerging && skill.casl).length}`)

console.log(`\nSectoral skills mapped to a unique skill: ${mappingList.length}`)
console.log(`  with a previous entry ${mappingList.filter((mapping) => mapping.previous).length}`)
console.log(`  with an updated entry  ${mappingList.filter((mapping) => mapping.updated).length}`)
console.log(
  `  titled as a unique skill ${mappingList.filter((m) => uniqueList.some((s) => s.title === m.title)).length}`
)
console.log(`  sector tags ${new Set(mappingList.flatMap((mapping) => mapping.sector_tags)).size} distinct`)

for (const { path, bytes } of written)
  console.log(`Wrote ${path.replace(`${ROOT}/`, '')} (${(bytes / 1024).toFixed(0)} KB), valid against its schema`)

if (problems.length > 0) {
  console.warn(`\n${problems.length} note(s) from the source, all carried through rather than dropped:`)
  for (const problem of problems.slice(0, 20)) console.warn(`  ${problem}`)
  if (problems.length > 20) console.warn(`  …and ${problems.length - 20} more`)
}
