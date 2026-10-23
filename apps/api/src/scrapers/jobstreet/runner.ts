import { readFileSync, rmSync } from 'node:fs'
import { link, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { careerFromRow } from './careers'
import { jobstreetDatabase } from './database'
import { parseQueuedJobstreetRun, queuedDepthListing } from './tasks'
import { scrapeJobstreet } from './pipeline'
import { scrapeJobstreetDepth } from './depth'
import { persistRunOutput } from './store'

const databaseUrl = Bun.env.JOBSTREET_RUNNER_DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error(
    'Run bun run scraper:setup, then bun run scraper:worker with the restricted JobStreet database account.'
  )
  process.exit(1)
}

const sql = jobstreetDatabase(databaseUrl)
const identity = await sql.query('SELECT current_user AS role')
if (identity[0]?.role !== 'kotak_jobstreet_runner')
  throw new Error('The runner requires the dedicated JobStreet database role')

// Database values in console output, with control characters removed: a run ID is free text, and escape sequences
// could rewrite the operator's terminal or clipboard.
const printable = (value: unknown) =>
  String(value)
    .replace(/[\p{Cc}\p{Cf}]/gu, '?')
    .slice(0, 500)

// The role may read search titles and write scrape runs, listings, observations and detail attempts, and nothing
// else, table by table and column by column: no changes to search titles, no deletes, no access to any other table,
// view or schema, no new schemas, and none of the attributes or memberships that would lift those limits.
const SCRAPE_TABLES = [
  'jobstreet_scrape_runs',
  'jobstreet_listings',
  'jobstreet_observations',
  'jobstreet_detail_attempts'
]
const excess = (await sql.query(
  `SELECT 'role ' || rolname AS problem FROM pg_roles
   WHERE rolname = current_user
     AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit)
   UNION ALL
   SELECT 'member of ' || parent.rolname FROM pg_auth_members membership
   JOIN pg_roles parent ON parent.oid = membership.roleid
   WHERE membership.member = (SELECT oid FROM pg_roles WHERE rolname = current_user)
   UNION ALL
   SELECT 'database CREATE' WHERE has_database_privilege(current_database(), 'CREATE')
   UNION ALL
   SELECT 'schema ' || nspname FROM pg_namespace
   WHERE nspname !~ '^pg_(toast_)?temp_' AND has_schema_privilege(oid, 'CREATE')
   UNION ALL
   SELECT 'table ' || namespace.nspname || '.' || relation.relname
   FROM pg_class relation
   JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
   WHERE relation.relkind IN ('r', 'p', 'v', 'm', 'f')
     AND namespace.nspname NOT IN ('pg_catalog', 'information_schema')
     AND CASE
       WHEN namespace.nspname = 'public' AND relation.relname = 'jobstreet_careers' THEN
         has_table_privilege(relation.oid, 'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
         OR has_any_column_privilege(relation.oid, 'INSERT, UPDATE, REFERENCES')
       WHEN namespace.nspname = 'public' AND relation.relname = ANY($1::text[]) THEN
         has_table_privilege(relation.oid, 'DELETE, TRUNCATE, REFERENCES, TRIGGER')
         OR has_any_column_privilege(relation.oid, 'REFERENCES')
       ELSE
         has_table_privilege(relation.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
         OR has_any_column_privilege(relation.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
     END`,
  [SCRAPE_TABLES]
)) as Array<{ problem: string }>
if (excess.length)
  throw new Error(
    `The runner database role has more access than it needs: ${excess.map((row) => printable(row.problem)).join('; ')}`
  )

const root = fileURLToPath(new URL('../../../../../data/jobstreet/production', import.meta.url))
const delayMs = Number(Bun.env.JOBSTREET_DELAY_MS ?? 30_000)
const delayJitterMs = Number(Bun.env.JOBSTREET_DELAY_JITTER_MS ?? 30_000)
const headless = Bun.env.BROWSER_HEADLESS === 'true'
const profileId = Bun.env.BROWSER_PROFILE_ID
const sleep = (duration: number) => new Promise((done) => setTimeout(done, duration))
// Progress is saved at most once a minute while a run continues.
const CHECKPOINT_INTERVAL_MS = 60_000

// One runner per machine: a second would share the browser profile and double the traffic to JobStreet. The lock
// file holds the runner's process ID. It is created whole, as a hard link to a file that already holds the ID, so
// no other runner ever reads it empty. A lock whose process has exited is stale and is replaced.
const lockPath = resolve(root, 'runner.lock')
const readLock = () =>
  readFile(lockPath, 'utf8').then(
    (text) => text.trim(),
    () => null
  )
async function acquireLock() {
  await mkdir(root, { recursive: true })
  const ownPath = resolve(root, `runner.lock.${process.pid}`)
  await writeFile(ownPath, `${process.pid}\n`)
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await link(ownPath, lockPath)
        return
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      }
      const holder = await readLock()
      const pid = Number(holder)
      let running = false
      if (Number.isSafeInteger(pid) && pid > 0 && pid !== process.pid) {
        try {
          process.kill(pid, 0)
          running = true
        } catch (error) {
          running = (error as NodeJS.ErrnoException).code === 'EPERM'
        }
      }
      if (running)
        throw new Error(
          `Another JobStreet runner is running (process ${pid}). Stop it, or delete ${lockPath} if that process is not a runner.`
        )
      // Replace the stale lock only if it still names the same exited process.
      if ((await readLock()) === holder) await rm(lockPath, { force: true })
    }
    throw new Error(`Could not take the runner lock at ${lockPath}`)
  } finally {
    await rm(ownPath, { force: true })
  }
}
await acquireLock()

let stopping = false
process.on('SIGINT', () => (stopping = true))
process.on('SIGTERM', () => (stopping = true))
process.on('exit', () => {
  // Only this runner's own lock is removed.
  try {
    if (readFileSync(lockPath, 'utf8').trim() === String(process.pid)) rmSync(lockPath, { force: true })
  } catch {
    // Already gone.
  }
})

// Thrown from a progress save when the run is no longer queued or running, for example after its heartbeat expired.
class RunEndedError extends Error {}

async function claimNext() {
  // A live multi-hour scrape renews its heartbeat; recover a crashed host after five minutes.
  // Older runner versions have no heartbeat, so retain their conservative 12-hour fallback.
  await sql.query(
    `UPDATE jobstreet_scrape_runs
     SET status = 'failed', finished_at = now(), error = 'Runner heartbeat expired',
         report = COALESCE(report, '{}'::jsonb) || jsonb_build_object(
           'status', 'failed', 'error', 'Runner heartbeat expired'
         )
     WHERE status = 'running' AND (
       heartbeat_at < now() - interval '5 minutes'
       OR (heartbeat_at IS NULL AND started_at < now() - interval '12 hours')
     )`
  )
  // The Neon driver parses a date column into a JavaScript Date, which the queue check rejects as an invalid schedule
  // date, so the nightly runs failed before scraping. The date goes out as YYYY-MM-DD text instead.
  const rows = await sql.query(
    `UPDATE jobstreet_scrape_runs
     SET status = 'running', started_at = now(), heartbeat_at = now(), error = NULL
     WHERE id = (
       SELECT id FROM jobstreet_scrape_runs
       WHERE status = 'queued'
       ORDER BY created_at
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id, career_slug, mode, source, scheduled_for::text AS scheduled_for`
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

// The queued slug must name an enabled search title, and that title's row must still point at its own JobStreet
// search page. The runner's database role can read search titles but not change them.
async function loadCareer(slug: string) {
  const rows = await sql.query('SELECT slug, title, search_url, enabled FROM jobstreet_careers WHERE slug = $1', [slug])
  const row = rows[0] as { enabled?: unknown } | undefined
  if (!row) throw new Error(`Search title ${slug} no longer exists`)
  if (row.enabled !== true) throw new Error(`Search title ${slug} is turned off`)
  return careerFromRow(row)
}

async function runQueued(input: unknown) {
  const run = parseQueuedJobstreetRun(input)
  const career = await loadCareer(run.career_slug)
  await mkdir(root, { recursive: true })
  const outputPath = resolve(root, run.id)
  const queued = { careerSlug: career.slug }
  // Saves progress so the admin page shows it and a crash keeps what was scraped. A failed save is retried at the
  // next checkpoint with the same listings, and the final save sends everything again.
  let saved = 0
  let lastCheckpoint = 0
  const onProgress = async (report: Record<string, unknown>) => {
    if (Date.now() - lastCheckpoint < CHECKPOINT_INTERVAL_MS) return
    lastCheckpoint = Date.now()
    let result: Awaited<ReturnType<typeof persistRunOutput>>
    try {
      result = await persistRunOutput(sql, outputPath, report, run.source, run.scheduled_for, run.id, {
        checkpoint: { saved },
        queued
      })
    } catch (error) {
      console.error(`Could not save progress for ${run.id}; the scrape continues:`, printable(error))
      return
    }
    saved = result.imported
    if (!result.active) throw new RunEndedError(`Run ${run.id} was ended while it was running`)
  }
  const persistFinal = (report: Record<string, unknown>) =>
    persistRunOutput(sql, outputPath, report, run.source, run.scheduled_for, run.id, { queued })
  // After a failed scrape, save what it found; the scrape's own error is the one the run keeps, so a save that fails
  // (for example with no listings at all) is only logged.
  const saveAfterFailure = (report: Record<string, unknown>) =>
    persistFinal(report).catch((error) =>
      console.error(`Could not save the output of failed run ${run.id}:`, printable(error))
    )

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
        headless,
        onProgress
      })
      await persistFinal(report)
    } catch (error) {
      const report = await Bun.file(resolve(outputPath, 'run.json'))
        .json()
        .catch(() => null)
      if (report) await saveAfterFailure(report)
      throw error
    }
    return
  }

  // Listings without a description, admin-approved ones first (the job-ad market reads their descriptions), then the
  // most recently seen. approved_at is the admin route's copy of the approvals; this role cannot read the reviews.
  const stored = (await sql.query(
    `SELECT job_id, career_slug, latest_payload FROM jobstreet_listings
     WHERE career_slug = $1 AND latest_detail IS NULL
     ORDER BY approved_at IS NULL, latest_seen_at DESC LIMIT 1000`,
    [career.slug]
  )) as Array<{ job_id: string; career_slug: string; latest_payload: Record<string, unknown> }>
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
      `UPDATE jobstreet_scrape_runs SET status = 'success', started_at = now(), finished_at = now(), report = $2::jsonb
       WHERE id = $1 AND status IN ('queued', 'running')`,
      [run.id, JSON.stringify(report)]
    )
    return
  }
  const listings = stored.map((row) => queuedDepthListing(row, career))
  const inputDirectory = resolve(root, 'inputs')
  await mkdir(inputDirectory, { recursive: true })
  const inputPath = resolve(inputDirectory, `${run.id}.jsonl`)
  await writeFile(inputPath, `${listings.map((row) => JSON.stringify(row)).join('\n')}\n`)
  try {
    const report = await scrapeJobstreetDepth({
      inputs: [inputPath],
      profileId,
      output: outputPath,
      maxJobs: stored.length,
      delayMs,
      delayJitterMs,
      headless,
      discoverLocalCache: false,
      onProgress
    })
    await persistFinal(report)
  } catch (error) {
    const report = await Bun.file(resolve(outputPath, 'run.json'))
      .json()
      .catch(() => null)
    if (report) await saveAfterFailure(report)
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
    console.info(`Starting ${printable(run.mode)} for ${printable(run.career_slug)} (${printable(run.id)})`)
    const heartbeat = setInterval(() => {
      void sql
        .query("UPDATE jobstreet_scrape_runs SET heartbeat_at = now() WHERE id = $1 AND status = 'running'", [run.id])
        .catch((error) => console.error('Could not renew runner heartbeat:', printable(error)))
    }, 60_000)
    try {
      await runQueued(run)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`JobStreet run ${printable(run.id)} failed: ${printable(message)}`)
      // A run that was already ended keeps the status and error it ended with.
      await sql.query(
        `UPDATE jobstreet_scrape_runs SET status = 'failed', finished_at = now(), error = $2::text,
          report = COALESCE(report, '{}'::jsonb) || jsonb_build_object('status', 'failed', 'error', $2::text)
         WHERE id = $1 AND status IN ('queued', 'running')`,
        [run.id, message]
      )
    } finally {
      clearInterval(heartbeat)
    }
  } catch (error) {
    console.error('JobStreet queue poll failed:', printable(error instanceof Error ? error.message : error))
    await sleep(15_000)
  }
}

console.info('JobStreet runner stopped.')
