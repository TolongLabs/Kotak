import { afterAll, beforeAll, expect, test } from 'bun:test'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'

// Exercise the public command with real files, including earlier scraper output shapes.
const root = fileURLToPath(new URL('../../../../../', import.meta.url))
const scratch = resolve(root, '.local')
const cli = resolve(root, 'apps/api/src/scrapers/jobstreet/prepare-cli.ts')
let workspace: string
let previous: string
let current: string

const row = (id: string, title: string, overrides: Record<string, unknown> = {}) => ({
  source: 'jobstreet',
  job_id: id,
  url: `https://my.jobstreet.com/job/${id}?tracking=card`,
  title,
  company: 'Beta',
  location: 'Kuala Lumpur',
  salary: null,
  work_type: 'Full time',
  listed_at_label: '1d ago',
  summary: null,
  listing_text: `Job ${id}`,
  search_url: 'https://my.jobstreet.com/software-engineer-jobs?utm_source=research&page=1',
  scraped_at: '2026-10-20T00:00:00.000Z',
  ...overrides
})

async function command(output: string, sort: string, inputs = [previous, current]) {
  const child = Bun.spawn(
    [process.execPath, cli, ...inputs.flatMap((input) => ['--input', input]), '--sort', sort, '--output', output],
    { stdout: 'pipe', stderr: 'pipe' }
  )
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited
  ])
  return { stdout, stderr, exitCode }
}
const lines = async (path: string) =>
  (await readFile(path, 'utf8'))
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))

beforeAll(async () => {
  await mkdir(scratch, { recursive: true })
  workspace = await mkdtemp(join(scratch, 'jobstreet-check-'))
  previous = join(workspace, 'old.jsonl')
  current = join(workspace, 'new.jsonl')
  const old = [
    row('10', 'Old title'),
    row('2', ' alpha '),
    row('9', 'Beta', { listed_at_label: 'unknown', location: null }),
    row('88', 'Bad URL', { url: 'https://my.jobstreet.com/job/99' })
  ]
  await writeFile(previous, `\uFEFF${old.map((job) => JSON.stringify(job)).join('\r\n')}\r\nnot-json\r\n`)
  await writeFile(
    current,
    `${JSON.stringify(row('10', 'Zeta engineer', { company: null, location: 'Johor', scraped_at: '2026-10-22T00:00:00Z', listed_at_label: '6d ago' }))}\n`
  )
})

afterAll(async () => {
  // Only remove the unique test directory created above, inside the repo's ignored scratch folder.
  if (workspace && dirname(resolve(workspace)) === scratch && basename(workspace).startsWith('jobstreet-check-')) {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('merges contributor files, keeps a complete latest observation, and quarantines bad rows', async () => {
  const output = join(workspace, 'merged')
  const result = await command(output, 'title', [previous, current, previous])
  expect(result.exitCode).toBe(0)
  const jobs = await lines(join(output, 'jobs.jsonl'))
  expect(jobs.map((job) => job.job_id)).toEqual(['2', '9', '10'])
  expect(jobs[2].title).toBe('Zeta engineer')
  expect(jobs[2].company).toBeNull() // Do not fill it with stale data from the older observation.
  expect(jobs[2].work_arrangement).toBeNull() // Earlier runs lack this optional field.
  expect(jobs[2].url).toBe('https://my.jobstreet.com/job/10')
  expect(jobs[2].search_url).toBe('https://my.jobstreet.com/software-engineer-jobs?page=1')
  expect(jobs[2].listed_at_estimate).toBe('2026-10-16T00:00:00.000Z')
  const report = JSON.parse(await readFile(join(output, 'prepare.json'), 'utf8'))
  expect([
    report.rows_read,
    report.jobs_saved,
    report.observations_saved,
    report.duplicates_removed,
    report.rows_rejected
  ]).toEqual([6, 3, 4, 0, 2])
  expect((await lines(join(output, 'rejected.jsonl'))).map((entry) => entry.line)).toEqual([4, 5])
  const original = await readFile(join(output, 'jobs.jsonl'), 'utf8')
  expect((await command(output, 'title')).exitCode).toBe(1)
  expect(await readFile(join(output, 'jobs.jsonl'), 'utf8')).toBe(original)
})

test('sorting is explicit and independent of input file order, with null values last', async () => {
  const expected: Record<string, string[]> = {
    newest: ['2', '10', '9'],
    title: ['2', '9', '10'],
    company: ['2', '9', '10'],
    location: ['10', '2', '9'],
    'job-id': ['2', '9', '10'],
    'scraped-at': ['10', '2', '9']
  }
  for (const [sort, ids] of Object.entries(expected)) {
    const output = join(workspace, `sort-${sort}`)
    expect((await command(output, sort, [current, previous])).exitCode).toBe(0)
    expect((await lines(join(output, 'jobs.jsonl'))).map((job) => job.job_id)).toEqual(ids)
  }
  const output = join(workspace, 'repeat')
  expect((await command(output, 'title', [current, previous])).exitCode).toBe(0)
  expect(await readFile(join(output, 'jobs.jsonl'), 'utf8')).toBe(
    await readFile(join(workspace, 'sort-title/jobs.jsonl'), 'utf8')
  )
})

test('equal-time conflicts resolve deterministically and invalid-only input fails visibly', async () => {
  const first = join(workspace, 'a-tie.jsonl')
  const second = join(workspace, 'z-tie.jsonl')
  await writeFile(first, JSON.stringify(row('4', 'Zeta')))
  await writeFile(second, JSON.stringify(row('4', 'Alpha')))
  const tie = join(workspace, 'tie')
  expect((await command(tie, 'title', [first, second])).exitCode).toBe(0)
  expect((await lines(join(tie, 'jobs.jsonl')))[0].title).toBe('Zeta')
  expect((await lines(join(tie, 'observations.jsonl'))).length).toBe(2)
  const bad = join(workspace, 'bad.jsonl')
  await writeFile(bad, 'not-json\n')
  const output = join(workspace, 'failed')
  expect((await command(output, 'title', [bad])).exitCode).toBe(1)
  const report = JSON.parse(await readFile(join(output, 'prepare.json'), 'utf8'))
  expect(report.status).toBe('failed')
  expect(report.rows_rejected).toBe(1)
  expect(report.finished_at).toBeTruthy()
  expect((await command(join(workspace, 'invalid-sort'), 'salary')).exitCode).toBe(1)
})

test('repeat scrape dates survive merging and history can be re-imported without inflation', async () => {
  const output = join(workspace, 'history')
  expect((await command(output, 'title')).exitCode).toBe(0)
  const observations = await lines(join(output, 'observations.jsonl'))
  expect(observations.filter((job) => job.job_id === '10').map((job) => job.scraped_at)).toEqual([
    '2026-10-20T00:00:00.000Z',
    '2026-10-22T00:00:00.000Z'
  ])
  const summary = (await lines(join(output, 'job-history.jsonl'))).find((job) => job.job_id === '10')
  expect(summary.first_seen_at).toBe('2026-10-20T00:00:00.000Z')
  expect(summary.last_seen_at).toBe('2026-10-22T00:00:00.000Z')
  expect(summary.seen_dates).toEqual(['2026-10-20', '2026-10-22'])
  expect([summary.observation_count, summary.scrape_run_count, summary.legacy_observation_count]).toEqual([2, 0, 2])
  expect(summary.search_scopes).toEqual(['https://my.jobstreet.com/software-engineer-jobs'])
  expect(summary.closed_at).toBeUndefined() // Absence or elapsed time must not become a claimed closure.
  const second = join(workspace, 'history-reimport')
  expect((await command(second, 'title', [previous, join(output, 'observations.jsonl')])).exitCode).toBe(0)
  expect(await readFile(join(second, 'observations.jsonl'), 'utf8')).toBe(
    await readFile(join(output, 'observations.jsonl'), 'utf8')
  )
  expect(await readFile(join(second, 'job-history.jsonl'), 'utf8')).toBe(
    await readFile(join(output, 'job-history.jsonl'), 'utf8')
  )
  const report = JSON.parse(await readFile(join(second, 'prepare.json'), 'utf8'))
  expect([report.jobs_saved, report.observations_saved, report.duplicates_removed]).toEqual([3, 4, 3])
})

test('independent runs at the same instant remain distinct while copied rows are removed', async () => {
  const capture = row('7', 'Engineer', { scrape_run_id: 'run-a' })
  const a = join(workspace, 'run-a.jsonl')
  const b = join(workspace, 'run-b.jsonl')
  const copy = join(workspace, 'run-a-copy.jsonl')
  await writeFile(a, JSON.stringify(capture))
  await writeFile(b, JSON.stringify({ ...capture, scrape_run_id: 'run-b' }))
  await writeFile(copy, JSON.stringify(capture))
  const output = join(workspace, 'same-time')
  expect((await command(output, 'title', [a, b, copy])).exitCode).toBe(0)
  const summary = (await lines(join(output, 'job-history.jsonl')))[0]
  expect([summary.observation_count, summary.scrape_run_count]).toEqual([2, 2])
  expect(summary.seen_dates).toEqual(['2026-10-20'])
  const report = JSON.parse(await readFile(join(output, 'prepare.json'), 'utf8'))
  expect([report.jobs_saved, report.observations_saved, report.duplicates_removed]).toEqual([1, 2, 1])
})
