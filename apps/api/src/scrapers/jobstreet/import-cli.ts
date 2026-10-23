import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { jobstreetDatabase } from './database'
import { persistRunOutput, readRunOutput } from './store'
import { slugForSearchUrl } from './careers'

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: { input: { type: 'string' }, 'dry-run': { type: 'boolean' } },
  strict: true
})
const databaseUrl = Bun.env.DATABASE_URL?.trim()
if (!values['dry-run'] && !databaseUrl) {
  console.error('Set DATABASE_URL to the Neon connection URL first, or run with --dry-run to inspect local files.')
  process.exit(1)
}

const input = resolve(values.input ?? 'data/jobstreet')
const runFiles = [...new Bun.Glob('**/run.json').scanSync({ cwd: input, absolute: true })].sort()
const sql = databaseUrl && !values['dry-run'] ? jobstreetDatabase(databaseUrl) : null
let imported = 0
let skipped = 0
const byCareer = new Map<string, { runs: number; rows: number }>()

for (const runFile of runFiles) {
  const outputPath = runFile.slice(0, -'/run.json'.length)
  const report = await Bun.file(runFile)
    .json()
    .catch(() => null)
  if (!report || report.status === 'running') {
    skipped++
    continue
  }
  try {
    const { rows } = await readRunOutput(outputPath, report)
    const searchUrl = rows.find((row) => typeof row.search_url === 'string')?.search_url
    if (typeof searchUrl !== 'string') throw new Error('no searchable job rows')
    const career = slugForSearchUrl(searchUrl)
    if (sql) {
      const result = await persistRunOutput(sql, outputPath, report, 'local_import')
      imported += result.imported
    }
    const tally = byCareer.get(career) ?? { runs: 0, rows: 0 }
    tally.runs++
    tally.rows += rows.length
    byCareer.set(career, tally)
    console.info(`${career}: ${rows.length} rows from ${outputPath}`)
  } catch (error) {
    if (String(error).includes('no searchable job rows')) {
      skipped++
      continue
    }
    throw error
  }
}

for (const [career, tally] of byCareer) console.info(`TOTAL ${career}: ${tally.rows} rows across ${tally.runs} runs`)
if (values['dry-run'])
  console.info(`Dry run only: ${runFiles.length - skipped} completed runs inspected; skipped ${skipped}.`)
else
  console.info(
    `Imported ${imported} listing rows from ${runFiles.length - skipped} completed runs; skipped ${skipped}.`
  )
