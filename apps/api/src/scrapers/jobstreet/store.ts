import { readFile, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import type { NeonQueryFunction } from '@neondatabase/serverless'
import { slugForSearchUrl } from './careers'
import { writeJson } from './files'
import { parseListing } from './records'
import type { JobListing } from './records'

type Sql = NeonQueryFunction<false, false>
type Statement = { text: string; params: unknown[] }
type RunRecord = {
  id: string
  careerSlug: string
  mode: 'breadth' | 'depth'
  source: 'manual' | 'schedule' | 'local_import'
  report: Record<string, unknown>
  status: 'queued' | 'running' | 'success' | 'partial' | 'failed'
  scheduledFor?: string | null
}

export interface PersistRunOutputOptions {
  // Progress while the run continues: the run stays running. A breadth checkpoint sends only the listings after the
  // first `saved` rows of jobs.jsonl, which the runner appends to; a depth checkpoint sends only the run's report.
  checkpoint?: { saved: number }
  // A run the runner claimed from the queue: every row must be for this search title, and the run's row changes
  // only while it is queued or running, so a run that was ended elsewhere stays ended.
  queued?: { careerSlug: string }
}

function runStatement(run: RunRecord, activeOnly: boolean): Statement {
  return {
    text: `INSERT INTO jobstreet_scrape_runs
      (id, career_slug, mode, status, source, scheduled_for, started_at, finished_at, report, error)
     VALUES ($1, $2, $3, $4, $5, $6::date, $7::timestamptz, $8::timestamptz, $9::jsonb, $10)
     ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status, started_at = EXCLUDED.started_at, finished_at = EXCLUDED.finished_at,
       report = EXCLUDED.report, error = EXCLUDED.error
     ${activeOnly ? "WHERE jobstreet_scrape_runs.status IN ('queued', 'running')" : ''}
     RETURNING id`,
    params: [
      run.id,
      run.careerSlug,
      run.mode,
      run.status,
      run.source,
      run.scheduledFor ?? null,
      typeof run.report.started_at === 'string' ? run.report.started_at : null,
      typeof run.report.finished_at === 'string' ? run.report.finished_at : null,
      JSON.stringify(run.report),
      typeof run.report.error === 'string' ? run.report.error : null
    ]
  }
}

function breadthStatements(careerSlug: string, runId: string, rows: JobListing[]): Statement[] {
  const statements: Statement[] = []
  for (let start = 0; start < rows.length; start += 100) {
    const observedAt = rows.slice(start, start + 100).map((row) => ({
      job_id: row.job_id,
      career_slug: careerSlug,
      scrape_run_id: runId,
      observed_at: row.scraped_at,
      payload: { ...row, scrape_run_id: runId }
    }))
    statements.push({
      text: `INSERT INTO jobstreet_listings (job_id, career_slug, latest_payload, latest_seen_at)
       SELECT job_id, career_slug, payload, observed_at
       FROM jsonb_to_recordset($1::jsonb) AS item(job_id text, career_slug text, payload jsonb, observed_at timestamptz)
       ON CONFLICT (job_id, career_slug) DO UPDATE SET
         latest_payload = EXCLUDED.latest_payload,
         latest_seen_at = EXCLUDED.latest_seen_at,
         updated_at = now()
       WHERE EXCLUDED.latest_seen_at >= jobstreet_listings.latest_seen_at`,
      params: [JSON.stringify(observedAt)]
    })
    statements.push({
      text: `INSERT INTO jobstreet_observations (job_id, career_slug, scrape_run_id, observed_at, payload)
       SELECT job_id, career_slug, scrape_run_id, observed_at, payload
       FROM jsonb_to_recordset($1::jsonb) AS item(
         job_id text, career_slug text, scrape_run_id text, observed_at timestamptz, payload jsonb
       )
       ON CONFLICT (job_id, career_slug, scrape_run_id, observed_at) DO NOTHING`,
      params: [JSON.stringify(observedAt)]
    })
  }
  return statements
}

function currentListingStatements(careerSlug: string, rows: JobListing[]): Statement[] {
  const statements: Statement[] = []
  for (let start = 0; start < rows.length; start += 100) {
    const current = rows.slice(start, start + 100).map((row) => ({
      job_id: row.job_id,
      career_slug: careerSlug,
      payload: row,
      observed_at: row.scraped_at
    }))
    statements.push({
      text: `INSERT INTO jobstreet_listings (job_id, career_slug, latest_payload, latest_seen_at)
       SELECT job_id, career_slug, payload, observed_at
       FROM jsonb_to_recordset($1::jsonb) AS item(job_id text, career_slug text, payload jsonb, observed_at timestamptz)
       ON CONFLICT (job_id, career_slug) DO UPDATE SET
         latest_payload = EXCLUDED.latest_payload,
         latest_seen_at = EXCLUDED.latest_seen_at,
         updated_at = now()
       WHERE EXCLUDED.latest_seen_at >= jobstreet_listings.latest_seen_at`,
      params: [JSON.stringify(current)]
    })
  }
  return statements
}

function detailValues(rows: Record<string, unknown>[]) {
  return rows.flatMap((row) => {
    if (typeof row.outcome === 'string') return [row]
    return [row.detail, row.detail_last_attempt].filter(
      (value): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
    )
  })
}

function depthStatements(
  careerSlug: string,
  runId: string,
  rows: Record<string, unknown>[],
  observations: Record<string, unknown>[]
): Statement[] {
  const statements: Statement[] = []
  const attempts = observations.flatMap((value) => {
    const breadth = value.breadth_observation as JobListing | undefined
    const jobId = typeof value.job_id === 'string' ? value.job_id : breadth?.job_id
    const outcome = value.outcome
    const attemptedAt = value.detail_scraped_at
    if (
      typeof jobId !== 'string' ||
      typeof attemptedAt !== 'string' ||
      (outcome !== 'fetched' && outcome !== 'unavailable' && outcome !== 'failed')
    )
      return []
    return [
      {
        job_id: jobId,
        career_slug: careerSlug,
        scrape_run_id: runId,
        attempted_at: attemptedAt,
        outcome,
        payload: value
      }
    ]
  })
  const latest = new Map<string, Record<string, unknown>>()
  for (const value of [...detailValues(rows), ...observations]) {
    if (value.outcome !== 'fetched' || typeof value.job_id !== 'string') continue
    const previous = latest.get(value.job_id)
    if (!previous || String(value.detail_scraped_at) >= String(previous.detail_scraped_at))
      latest.set(value.job_id, value)
  }
  const fetched = [...latest.values()].map((payload) => ({ job_id: payload.job_id, career_slug: careerSlug, payload }))
  for (let start = 0; start < fetched.length; start += 20) {
    statements.push({
      text: `UPDATE jobstreet_listings AS listing
         SET latest_detail = selected.payload, updated_at = now()
         FROM jsonb_to_recordset($1::jsonb) AS selected(job_id text, career_slug text, payload jsonb)
         WHERE listing.job_id = selected.job_id AND listing.career_slug = selected.career_slug
           AND COALESCE((listing.latest_detail->>'detail_scraped_at')::timestamptz, '-infinity'::timestamptz)
             <= COALESCE((selected.payload->>'detail_scraped_at')::timestamptz, '-infinity'::timestamptz)`,
      params: [JSON.stringify(fetched.slice(start, start + 20))]
    })
  }
  for (let start = 0; start < attempts.length; start += 20) {
    statements.push({
      text: `INSERT INTO jobstreet_detail_attempts (job_id, career_slug, scrape_run_id, attempted_at, outcome, payload)
       SELECT job_id, career_slug, scrape_run_id, attempted_at, outcome, payload
       FROM jsonb_to_recordset($1::jsonb) AS item(
         job_id text, career_slug text, scrape_run_id text, attempted_at timestamptz, outcome text, payload jsonb
       )
       ON CONFLICT (job_id, career_slug, scrape_run_id, attempted_at) DO NOTHING`,
      params: [JSON.stringify(attempts.slice(start, start + 20))]
    })
  }
  return statements
}

export async function readJsonLines<T>(path: string): Promise<T[]> {
  const content = await readFile(path, 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return ''
    throw error
  })
  const rows: T[] = []
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (!line.trim()) continue
    try {
      rows.push(JSON.parse(line) as T)
    } catch (error) {
      throw new Error(`${path}:${index + 1} is malformed JSON: ${String(error)}`)
    }
  }
  return rows
}

export async function readRunOutput(outputPath: string, report: Record<string, unknown>) {
  if (report.mode !== 'depth')
    return { rows: await readJsonLines<Record<string, unknown>>(join(outputPath, 'jobs.jsonl')), details: [] }

  const rows = await readJsonLines<Record<string, unknown>>(join(outputPath, 'jobs.enriched.jsonl'))
  const detailsPath = join(outputPath, 'details.jsonl')
  const hasLedger = await stat(detailsPath)
    .then(() => true)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return false
      throw error
    })
  const details = hasLedger
    ? await readJsonLines<Record<string, unknown>>(detailsPath)
    : detailValues(rows).filter((value) => typeof report.run_id === 'string' && value.depth_run_id === report.run_id)
  const byId = new Map(rows.map((row) => [row.job_id, row]))
  for (const detail of details) {
    const breadth = detail.breadth_observation
    if (!breadth || typeof breadth !== 'object' || Array.isArray(breadth)) continue
    const row = breadth as Record<string, unknown>
    if (typeof row.job_id === 'string' && !byId.has(row.job_id)) byId.set(row.job_id, { ...row, detail })
  }
  return { rows: [...byId.values()], details }
}

export async function persistRunOutput(
  sql: Sql,
  outputPath: string,
  report: Record<string, unknown>,
  source: RunRecord['source'],
  scheduledFor?: string | null,
  runIdOverride?: string,
  options: PersistRunOutputOptions = {}
) {
  const mode = report.mode === 'depth' ? 'depth' : 'breadth'
  const reportRunId = typeof report.run_id === 'string' ? report.run_id : ''
  const { rows, details } = await readRunOutput(outputPath, report)
  const first = rows.find((row) => typeof row.search_url === 'string')
  if (!first || typeof first.search_url !== 'string') throw new Error('Scrape output has no searchable job rows')
  const career = { slug: slugForSearchUrl(first.search_url) }
  if (options.queued && options.queued.careerSlug !== career.slug)
    throw new Error(`Scrape output is for ${career.slug}, not the queued search title ${options.queued.careerSlug}`)
  for (const row of rows) {
    if (typeof row.search_url !== 'string' || slugForSearchUrl(row.search_url) !== career.slug)
      throw new Error('A database scrape run must contain one search title')
  }
  const known = await sql.query('SELECT 1 FROM jobstreet_careers WHERE slug = $1', [career.slug])
  if (!known.length)
    throw new Error(`Search title ${career.slug} is not in jobstreet_careers; add it on the admin page first`)
  for (const detail of details) {
    const breadth = detail.breadth_observation as Record<string, unknown> | undefined
    if (
      !breadth ||
      breadth.job_id !== detail.job_id ||
      typeof breadth.search_url !== 'string' ||
      slugForSearchUrl(breadth.search_url) !== career.slug ||
      (reportRunId && detail.depth_run_id !== reportRunId)
    )
      throw new Error('Detail ledger identity or career does not match its scrape run')
  }
  const legacyRunId = `legacy-${createHash('sha256').update(JSON.stringify({ report, rows, details })).digest('hex').slice(0, 32)}`
  const databaseRunId = typeof report.database_run_id === 'string' ? report.database_run_id : ''
  const id = runIdOverride || databaseRunId || reportRunId || legacyRunId
  const checkpoint = options.checkpoint !== undefined
  const finalStatus = checkpoint
    ? 'running'
    : report.status === 'partial' || report.status === 'success'
      ? report.status
      : 'failed'
  const storedReport = {
    ...report,
    ...(checkpoint ? { status: 'running' as const } : {}),
    finished_at: checkpoint
      ? null
      : typeof report.finished_at === 'string'
        ? report.finished_at
        : new Date().toISOString(),
    ...(reportRunId && id !== reportRunId ? { pipeline_run_id: reportRunId } : {}),
    ...(runIdOverride || databaseRunId ? { database_run_id: id } : {}),
    run_id: id
  }
  const statements = [
    runStatement(
      {
        id,
        careerSlug: career.slug,
        mode,
        source,
        status: finalStatus,
        scheduledFor,
        report: storedReport
      },
      options.queued !== undefined
    )
  ]
  if (mode === 'breadth') {
    const unsaved = rows.slice(options.checkpoint?.saved ?? 0)
    statements.push(...breadthStatements(career.slug, id, unsaved.map(parseListing)))
  } else if (!checkpoint) {
    const mapped = rows.flatMap((row) => {
      if (typeof row.job_id === 'string' && typeof row.scraped_at === 'string') return [parseListing(row)]
      const detail = row.detail ?? row.detail_last_attempt
      const nested = detail && typeof detail === 'object' ? (detail as Record<string, unknown>) : null
      if (nested?.breadth_observation && typeof nested.breadth_observation === 'object')
        return [parseListing(nested.breadth_observation)]
      return []
    })
    // Depth data may include a listing absent from the imported breadth set. Keep
    // the current listing snapshot available for the detail-attempt foreign key,
    // but do not invent a breadth observation for a depth run.
    statements.push(...currentListingStatements(career.slug, mapped))
    statements.push(...depthStatements(career.slug, id, rows, details))
  }
  // Preserve the queue identity if these same browser artifacts are imported offline later.
  if (runIdOverride && !checkpoint) await writeJson(join(outputPath, 'run.json'), { ...report, database_run_id: id })
  const [runRows] = (await sql.transaction(
    (transaction) => statements.map(({ text, params }) => transaction.query(text, params)),
    { fetchOptions: { signal: AbortSignal.timeout(60_000) } }
  )) as unknown[][]
  // active is false when a queued run was no longer queued or running; its listings are still saved.
  return { runId: id, careerSlug: career.slug, imported: rows.length, active: runRows.length > 0 }
}
