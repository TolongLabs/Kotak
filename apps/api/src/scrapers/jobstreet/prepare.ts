import { appendFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createOutputDirectory, writeJson, writeListings } from './files'
import { parseSort, preferObservation, sortListings } from './records'
import { readListingRows, resolveInputs } from './inputs'
import type { JobListing, SortMode } from './records'

export async function prepareJobs(inputs: string[], destination: string, sort: SortMode = 'newest') {
  parseSort(sort)
  // Resolve all paths before creating output. Repeated paths/symlinks are read once.
  const paths = (await resolveInputs(inputs)).sort()
  const output = await createOutputDirectory(destination)
  const jobs = new Map<string, JobListing>()
  const observations = new Map<string, JobListing>()
  const report = {
    schema_version: 2,
    status: 'running' as 'running' | 'success' | 'failed',
    created_at: new Date().toISOString(),
    finished_at: null as string | null,
    input_files: paths,
    sort_by: sort,
    rows_read: 0,
    jobs_saved: 0,
    observations_saved: 0,
    repeated_job_observations: 0,
    duplicates_removed: 0,
    rows_rejected: 0,
    error: null as string | null
  }
  await writeFile(resolve(output, 'rejected.jsonl'), '')
  try {
    for await (const row of readListingRows(paths)) {
      report.rows_read++
      if (!row.job) {
        report.rows_rejected++
        const { job: _, ...rejected } = row
        await appendFile(resolve(output, 'rejected.jsonl'), `${JSON.stringify(rejected)}\n`)
        continue
      }
      const job = row.job
      const key = `${job.source}:${job.job_id}`
      const fingerprint = JSON.stringify(job)
      if (observations.has(fingerprint)) {
        report.duplicates_removed++
        continue
      }
      observations.set(fingerprint, job)
      const previous = jobs.get(key)
      if (previous) report.repeated_job_observations++
      jobs.set(key, previous ? preferObservation(previous, job) : job)
    }
    report.jobs_saved = jobs.size
    report.observations_saved = observations.size
    const history = [...observations.entries()]
      .sort(([leftKey, left], [rightKey, right]) => {
        const a = `${left.scraped_at}\0${leftKey}`
        const b = `${right.scraped_at}\0${rightKey}`
        return a < b ? -1 : a > b ? 1 : 0
      })
      .map(([, job]) => job)
    const summaries = new Map<
      string,
      {
        source: string
        job_id: string
        first_seen_at: string
        last_seen_at: string
        seen_dates: Set<string>
        observation_count: number
        run_ids: Set<string>
        legacy_observation_count: number
        search_scopes: Set<string>
      }
    >()
    for (const observation of history) {
      const key = `${observation.source}:${observation.job_id}`
      const summary = summaries.get(key) ?? {
        source: observation.source,
        job_id: observation.job_id,
        first_seen_at: observation.scraped_at,
        last_seen_at: observation.scraped_at,
        seen_dates: new Set<string>(),
        observation_count: 0,
        run_ids: new Set<string>(),
        legacy_observation_count: 0,
        search_scopes: new Set<string>()
      }
      summary.last_seen_at = observation.scraped_at
      summary.seen_dates.add(observation.scraped_at.slice(0, 10))
      summary.observation_count++
      if (observation.scrape_run_id) summary.run_ids.add(observation.scrape_run_id)
      else summary.legacy_observation_count++
      const scope = new URL(observation.search_url)
      scope.searchParams.delete('page')
      summary.search_scopes.add(scope.href)
      summaries.set(key, summary)
    }
    await writeListings(resolve(output, 'observations.jsonl'), history)
    await writeListings(
      resolve(output, 'job-history.jsonl'),
      sortListings(jobs.values(), 'job-id').map((job) => {
        const summary = summaries.get(`${job.source}:${job.job_id}`)!
        const { run_ids, seen_dates, search_scopes, ...fields } = summary
        return {
          ...fields,
          seen_dates: [...seen_dates].sort(),
          scrape_run_count: run_ids.size,
          search_scopes: [...search_scopes].sort()
        }
      })
    )
    await writeListings(resolve(output, 'jobs.jsonl'), sortListings(jobs.values(), sort))
    if (!jobs.size) throw new Error('No valid job listings remain; inspect rejected.jsonl')
    report.status = 'success'
    return report
  } catch (error) {
    report.status = 'failed'
    report.error = error instanceof Error ? error.message : String(error)
    throw error
  } finally {
    report.finished_at = new Date().toISOString()
    await writeJson(resolve(output, 'prepare.json'), report)
    console.info(
      `${report.status}: ${report.jobs_saved} unique jobs; ${report.observations_saved} observations retained; ${report.duplicates_removed} exact duplicates removed; ${report.rows_rejected} rejected; ${output}`
    )
  }
}
