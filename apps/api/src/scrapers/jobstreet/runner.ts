import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { jobstreetDatabase } from './database'
import { JOBSTREET_CAREERS } from './careers'
import { scrapeJobstreet } from './pipeline'
import { scrapeJobstreetDepth } from './depth'
import { persistRunOutput } from './store'

const databaseUrl = Bun.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('Set DATABASE_URL to the production Neon connection URL.')
  process.exit(1)
}

const sql = jobstreetDatabase(databaseUrl)
const root = resolve(Bun.env.JOBSTREET_DATA_DIR ?? 'data/jobstreet/production')
const delayMs = Number(Bun.env.JOBSTREET_DELAY_MS ?? 30_000)
const delayJitterMs = Number(Bun.env.JOBSTREET_DELAY_JITTER_MS ?? 30_000)
const headless = Bun.env.BROWSER_HEADLESS === 'true'
const profileId = Bun.env.BROWSER_PROFILE_ID
const sleep = (duration: number) => new Promise((done) => setTimeout(done, duration))
let stopping = false
process.on('SIGINT', () => (stopping = true))
process.on('SIGTERM', () => (stopping = true))

async function claimNext() {
  // A crashed host must not leave a career permanently blocked by the active-run index.
  // Runs can take hours at the configured human-paced rate, so recover only after 12h.
  await sql.query(
    `UPDATE jobstreet_scrape_runs
     SET status = 'failed', finished_at = now(), error = 'Runner lease expired after 12 hours',
         report = COALESCE(report, '{}'::jsonb) || jsonb_build_object(
           'status', 'failed', 'error', 'Runner lease expired after 12 hours'
         )
     WHERE status = 'running' AND started_at < now() - interval '12 hours'`
  )
  const rows = await sql.query(
    `UPDATE jobstreet_scrape_runs
     SET status = 'running', started_at = now(), error = NULL
     WHERE id = (
       SELECT id FROM jobstreet_scrape_runs
       WHERE status = 'queued'
       ORDER BY created_at
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id, career_slug, mode, source, scheduled_for`
  )
  return rows[0] as
    | {
        id: string
        career_slug: string
        mode: 'breadth' | 'depth'
        source: 'manual' | 'schedule'
        scheduled_for: string | null
      }
    | undefined
}

async function runQueued(run: NonNullable<Awaited<ReturnType<typeof claimNext>>>) {
  const career = JOBSTREET_CAREERS.find((candidate) => candidate.slug === run.career_slug)
  if (!career) throw new Error(`Unknown queued career: ${run.career_slug}`)
  await mkdir(root, { recursive: true })
  const outputPath = resolve(root, run.id)

  if (run.mode === 'breadth') {
    try {
      const report = await scrapeJobstreet({
        url: career.searchUrl,
        profileId,
        output: outputPath,
        maxPages: 200,
        maxJobs: 5000,
        delayMs,
        delayJitterMs,
        headless
      })
      await persistRunOutput(sql, outputPath, report, run.source, run.scheduled_for, run.id)
    } catch (error) {
      const report = await Bun.file(resolve(outputPath, 'run.json'))
        .json()
        .catch(() => null)
      if (report) await persistRunOutput(sql, outputPath, report, run.source, run.scheduled_for, run.id)
      throw error
    }
    return
  }

  const stored = (await sql.query(
    `SELECT latest_payload FROM jobstreet_listings
     WHERE career_slug = $1 AND latest_detail IS NULL
     ORDER BY latest_seen_at DESC LIMIT 1000`,
    [career.slug]
  )) as Array<{ latest_payload: Record<string, unknown> }>
  if (!stored.length) {
    const report = {
      mode: 'depth',
      status: 'success',
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      jobs_available: 0,
      jobs_selected: 0
    }
    await sql.query(
      `UPDATE jobstreet_scrape_runs SET status = 'success', started_at = now(), finished_at = now(), report = $2::jsonb WHERE id = $1`,
      [run.id, JSON.stringify(report)]
    )
    return
  }
  const inputDirectory = resolve(root, 'inputs')
  await mkdir(inputDirectory, { recursive: true })
  const inputPath = resolve(inputDirectory, `${run.id}.jsonl`)
  await writeFile(inputPath, `${stored.map((row) => JSON.stringify(row.latest_payload)).join('\n')}\n`)
  try {
    const report = await scrapeJobstreetDepth({
      inputs: [inputPath],
      profileId,
      output: outputPath,
      maxJobs: stored.length,
      delayMs,
      delayJitterMs,
      headless
    })
    await persistRunOutput(sql, outputPath, report, run.source, run.scheduled_for, run.id)
  } catch (error) {
    const report = await Bun.file(resolve(outputPath, 'run.json'))
      .json()
      .catch(() => null)
    if (report) await persistRunOutput(sql, outputPath, report, run.source, run.scheduled_for, run.id)
    throw error
  }
}

console.info(`JobStreet runner polling Neon; browser mode: ${headless ? 'headless' : 'headed'}`)
while (!stopping) {
  try {
    const run = await claimNext()
    if (!run) {
      await sleep(5000)
      continue
    }
    console.info(`Starting ${run.mode} for ${run.career_slug} (${run.id})`)
    try {
      await runQueued(run)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`JobStreet run ${run.id} failed: ${message}`)
      await sql.query(
        `UPDATE jobstreet_scrape_runs SET status = 'failed', finished_at = now(), error = $2,
          report = COALESCE(report, '{}'::jsonb) || jsonb_build_object('status', 'failed', 'error', $2)
         WHERE id = $1`,
        [run.id, message]
      )
    }
  } catch (error) {
    console.error('JobStreet queue poll failed:', error instanceof Error ? error.message : error)
    await sleep(15_000)
  }
}

console.info('JobStreet runner stopped.')
