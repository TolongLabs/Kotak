import { createHash } from 'node:crypto'
import { appendFile, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from 'playwright-core'
import {
  navigate,
  saveEvidence,
  verificationTimeout,
  VerificationTimeoutError,
  pacingJitter,
  pauseBetweenRequests
} from './browser'
import type { NavigationState } from './browser'
import { createOutputDirectory, writeJson, writeListings } from './files'
import { readListingRows, resolveInputs } from './inputs'
import { withKameleo } from './kameleo'
import { jobUrl, parseListing, preferObservation, utcTimestamp } from './records'
import type { JobListing } from './records'

export interface DepthOptions {
  inputs: string[]
  endpoint: string
  output: string
  maxJobs: number
  delayMs: number
  delayJitterMs?: number
  maxRetries?: number
  verificationTimeoutMs?: number
  previousDetails?: string[]
  refreshAfterHours?: number
}

type Outcome = 'fetched' | 'unavailable' | 'failed'
export interface JobDetailObservation {
  source: 'jobstreet'
  job_id: string
  url: string
  depth_run_id: string
  detail_scraped_at: string
  breadth_observation: JobListing
  outcome: Outcome
  http_status: number | null
  final_url: string | null
  unavailable_reason: 'http_404' | 'http_410' | 'explicit_closed_message' | null
  title: string | null
  company: string | null
  classification: string | null
  description_text: string | null
  description_html: string | null
  description_sha256: string | null
  date_posted: string | null
  valid_through: string | null
  date_fields_source: 'jsonld' | null
  error: string | null
}

interface DetailAttempt extends NavigationState {
  job_id: string
  outcome: Outcome | null
  error: string | null
}

function cachedObservation(value: unknown): JobDetailObservation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a depth observation')
  if ('detail' in value) return cachedObservation((value as { detail: unknown }).detail)
  const row = value as JobDetailObservation
  if (row.source !== 'jobstreet' || typeof row.job_id !== 'string' || !/^\d+$/.test(row.job_id))
    throw new Error('Invalid cached job identity')
  if (typeof row.depth_run_id !== 'string' || !row.depth_run_id.trim()) throw new Error('Missing cached depth_run_id')
  if (typeof row.detail_scraped_at !== 'string') throw new Error('Missing cached detail_scraped_at')
  const timestamp = utcTimestamp(row.detail_scraped_at, 'detail_scraped_at')
  const breadth = parseListing(row.breadth_observation)
  if (breadth.job_id !== row.job_id) throw new Error('Cached detail does not match breadth job_id')
  if (!['fetched', 'unavailable', 'failed'].includes(row.outcome)) throw new Error('Invalid cached outcome')
  for (const key of [
    'final_url',
    'unavailable_reason',
    'title',
    'company',
    'classification',
    'description_text',
    'description_html',
    'description_sha256',
    'date_posted',
    'valid_through',
    'date_fields_source',
    'error'
  ] as const) {
    if (row[key] !== null && typeof row[key] !== 'string') throw new Error(`Invalid cached ${key}`)
  }
  if (
    row.http_status !== null &&
    (!Number.isInteger(row.http_status) || row.http_status < 100 || row.http_status > 599)
  )
    throw new Error('Invalid cached HTTP status')
  if (
    row.outcome === 'fetched' &&
    (!row.title ||
      !row.description_text?.trim() ||
      !row.description_html?.trim() ||
      createHash('sha256').update(row.description_text).digest('hex') !== row.description_sha256)
  )
    throw new Error('Cached description is missing or its hash does not match')
  return { ...row, url: jobUrl(row.url, row.job_id), detail_scraped_at: timestamp, breadth_observation: breadth }
}

function preferDetail(previous: JobDetailObservation, next: JobDetailObservation): JobDetailObservation {
  const a = `${previous.detail_scraped_at}\0${JSON.stringify(previous)}`
  const b = `${next.detail_scraped_at}\0${JSON.stringify(next)}`
  return a >= b ? previous : next
}

function canReuse(detail: JobDetailObservation | undefined, time: number, hours: number | null): boolean {
  if (!detail || detail.outcome !== 'fetched') return false
  if (hours === null) return true // Descriptions are refreshed only when explicitly requested.
  const age = time - Date.parse(detail.detail_scraped_at)
  return age >= 0 && age < hours * 3_600_000
}

async function previousLocalDepthFiles(): Promise<string[]> {
  const root = fileURLToPath(new URL('../../../../../', import.meta.url))
  const directory = resolve(root, 'data/jobstreet/depth')
  const folders = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return []
    throw error
  })
  const files: string[] = []
  for (const folder of folders.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    if (!folder.isDirectory()) continue
    const path = resolve(directory, folder.name)
    try {
      const report = JSON.parse(await readFile(resolve(path, 'run.json'), 'utf8'))
      if (report.mode === 'depth' && report.finished_at && report.status !== 'running') {
        const enriched = resolve(path, 'jobs.enriched.jsonl')
        const details = resolve(path, 'details.jsonl')
        if (
          await stat(enriched)
            .then((file) => file.isFile())
            .catch(() => false)
        )
          files.push(enriched)
        else if (
          await stat(details)
            .then((file) => file.isFile())
            .catch(() => false)
        )
          files.push(details)
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        console.warn(`Skipping unreadable depth cache report: ${path}`)
    }
  }
  return files
}

function sourceDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(text)) return null
  const calendar = new Date(`${text.slice(0, 10)}T00:00:00Z`)
  if (
    !Number.isFinite(Date.parse(text)) ||
    !Number.isFinite(calendar.getTime()) ||
    calendar.toISOString().slice(0, 10) !== text.slice(0, 10)
  )
    return null
  return text // Preserve the source's precision and timezone, including date-only values.
}

async function closedMessage(page: Page): Promise<string | null> {
  const lines = (await page.locator('body').innerText()).split('\n').map((line) => line.trim())
  return (
    lines.find((line) =>
      /^(?:this job (?:is no longer available|has expired|is no longer accepting applications)|this job ad has expired)[.!]?$/i.test(
        line
      )
    ) ?? null
  )
}

async function extractDescription(page: Page, id: string) {
  const selector = '[data-automation="jobAdDetails"], [data-testid="job-ad-details"]'
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: 30_000 })
  return page.evaluate(
    ({ selector, id }) => {
      const text = (query: string) => document.querySelector(query)?.textContent?.replace(/\s+/g, ' ').trim() || null
      const description = document.querySelector<HTMLElement>(selector)!
      const descriptionText = description.innerText
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
      const postings: Record<string, unknown>[] = []
      const visit = (value: unknown) => {
        if (Array.isArray(value)) {
          value.forEach(visit)
          return
        }
        if (!value || typeof value !== 'object') return
        const node = value as Record<string, unknown>
        const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']]
        if (types.includes('JobPosting')) postings.push(node)
        if (node['@graph']) visit(node['@graph'])
        if (node.mainEntity) visit(node.mainEntity)
      }
      for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          visit(JSON.parse(script.textContent || 'null'))
        } catch {
          /* An unrelated malformed script must not discard the visible description. */
        }
      }
      const postingId = (node: Record<string, unknown>) => {
        const entity = node.mainEntityOfPage
        const href =
          typeof node.url === 'string'
            ? node.url
            : typeof entity === 'string'
              ? entity
              : entity && typeof entity === 'object'
                ? (entity as Record<string, unknown>)['@id']
                : null
        if (typeof href !== 'string') return null
        try {
          const url = new URL(href, location.href)
          return url.hostname === 'my.jobstreet.com' ? (url.pathname.match(/^\/job\/(\d+)\/?$/)?.[1] ?? null) : 'other'
        } catch {
          return 'other'
        }
      }
      const posting =
        postings.find((node) => postingId(node) === id) ??
        (postings.length === 1 && postingId(postings[0]) === null ? postings[0] : null)
      return {
        title: text('[data-automation="job-detail-title"], h1'),
        company: text('[data-automation="advertiser-name"]'),
        classification: text('[data-automation="job-detail-classifications"]'),
        description_text: descriptionText,
        description_html: description.innerHTML,
        date_posted: posting?.datePosted,
        valid_through: posting?.validThrough
      }
    },
    { selector, id }
  )
}

export async function scrapeJobstreetDepth(options: DepthOptions) {
  const retries = options.maxRetries ?? 2
  const verificationTimeoutMs = verificationTimeout(options.verificationTimeoutMs)
  const delayJitterMs = pacingJitter(options.delayJitterMs)
  const refreshAfterHours = options.refreshAfterHours ?? null
  if (refreshAfterHours !== null && (!Number.isFinite(refreshAfterHours) || refreshAfterHours < 0))
    throw new Error('--refresh-after-hours must be a nonnegative number')
  if (!Number.isInteger(options.maxJobs) || options.maxJobs < 1 || options.maxJobs > 1000)
    throw new Error('--max-jobs must be an integer from 1 to 1000')
  if (!Number.isInteger(options.delayMs) || options.delayMs < 2000)
    throw new Error('--delay-ms must be an integer of at least 2000')
  if (!Number.isInteger(retries) || retries < 0 || retries > 3)
    throw new Error('--retries must be an integer from 0 to 3')
  const paths = await resolveInputs(options.inputs)
  const previousFiles = [...(await previousLocalDepthFiles()), ...(options.previousDetails ?? [])]
  const cachePaths = previousFiles.length ? await resolveInputs(previousFiles) : []
  const output = await createOutputDirectory(options.output)
  await writeFile(resolve(output, 'details.jsonl'), '')
  await writeFile(resolve(output, 'rejected.jsonl'), '')
  const report = {
    schema_version: 1,
    mode: 'depth' as const,
    run_id: crypto.randomUUID(),
    status: 'running' as 'running' | 'success' | 'partial' | 'failed',
    started_at: new Date().toISOString(),
    finished_at: null as string | null,
    input_files: paths,
    previous_depth_files: cachePaths,
    refresh_after_hours: refreshAfterHours,
    max_jobs: options.maxJobs,
    max_retries: retries,
    verification_timeout_ms: verificationTimeoutMs,
    delay_ms: options.delayMs,
    delay_jitter_ms: delayJitterMs,
    browser_mode: 'headed',
    rows_read: 0,
    input_duplicates: 0,
    records_rejected: 0,
    jobs_available: 0,
    jobs_selected: 0,
    jobs_attempted: 0,
    jobs_fetched: 0,
    jobs_reused: 0,
    jobs_unavailable: 0,
    jobs_failed: 0,
    profile_id: null as string | null,
    jobs: [] as DetailAttempt[],
    stop_reason: null as 'completed' | 'job_limit' | 'blocked' | 'verification_timeout' | 'error' | null,
    error: null as string | null
  }
  const targets = new Map<string, JobListing>()
  const latestDetails = new Map<string, JobDetailObservation>()
  const descriptions = new Map<string, JobDetailObservation>()
  const remember = (observation: JobDetailObservation) => {
    const previous = latestDetails.get(observation.job_id)
    latestDetails.set(observation.job_id, previous ? preferDetail(previous, observation) : observation)
    if (observation.outcome === 'fetched') {
      const description = descriptions.get(observation.job_id)
      descriptions.set(observation.job_id, description ? preferDetail(description, observation) : observation)
    }
  }
  const refreshReference = Date.now()
  const save = () => writeJson(resolve(output, 'run.json'), report)
  await save()
  try {
    for await (const row of readListingRows(paths)) {
      report.rows_read++
      if (!row.job) {
        report.records_rejected++
        const { job: _, ...rejected } = row
        await appendFile(resolve(output, 'rejected.jsonl'), `${JSON.stringify(rejected)}\n`)
        continue
      }
      const previous = targets.get(row.job.job_id)
      if (previous) report.input_duplicates++
      targets.set(row.job.job_id, previous ? preferObservation(previous, row.job) : row.job)
    }
    report.jobs_available = targets.size
    for (const file of cachePaths) {
      const lines = (await readFile(file, 'utf8')).split(/\r?\n/)
      for (const [index, original] of lines.entries()) {
        const raw = original.replace(/^\uFEFF/, '').trim()
        if (!raw) continue
        let observations: JobDetailObservation[]
        try {
          const value = JSON.parse(raw)
          const values =
            value && typeof value === 'object' && 'detail' in value
              ? [value.detail, value.detail_last_attempt].filter((item) => item != null)
              : [value]
          observations = values.map(cachedObservation)
        } catch (error) {
          report.records_rejected++
          await appendFile(
            resolve(output, 'rejected.jsonl'),
            `${JSON.stringify({ kind: 'previous_depth', file, line: index + 1, raw, error: String(error) })}\n`
          )
          continue
        }
        observations.forEach(remember)
      }
    }
    const selected = [...targets.values()].slice(0, options.maxJobs)
    report.jobs_selected = selected.length
    if (!selected.length) throw new Error('No valid breadth listings to enrich; inspect rejected.jsonl')
    const pending = selected.filter((job) => {
      if (!canReuse(descriptions.get(job.job_id), refreshReference, refreshAfterHours)) return true
      report.jobs_reused++
      return false
    })
    await save()
    if (pending.length)
      await withKameleo(
        options.endpoint,
        async (page) => {
          for (const [index, breadth] of pending.entries()) {
            const entry: DetailAttempt = {
              job_id: breadth.job_id,
              url: breadth.url,
              http_status: null,
              attempts: 0,
              retry_errors: [],
              outcome: null,
              error: null
            }
            report.jobs.push(entry)
            const observation: JobDetailObservation = {
              source: 'jobstreet',
              job_id: breadth.job_id,
              url: breadth.url,
              depth_run_id: report.run_id,
              detail_scraped_at: new Date().toISOString(),
              breadth_observation: breadth,
              outcome: 'failed',
              http_status: null,
              final_url: null,
              unavailable_reason: null,
              title: null,
              company: null,
              classification: null,
              description_text: null,
              description_html: null,
              description_sha256: null,
              date_posted: null,
              valid_through: null,
              date_fields_source: null,
              error: null
            }
            let blocked = false
            console.info(`Enriching ${breadth.url}`)
            try {
              const response = await navigate(page, entry, retries, options.delayMs, save, {
                timeoutMs: verificationTimeoutMs,
                evidencePrefix: resolve(output, `job-${breadth.job_id}-verification`)
              })
              observation.http_status = entry.http_status
              observation.final_url = page.url()
              if ([401, 403, 429].includes(entry.http_status ?? 0)) {
                blocked = true
                throw new Error(`JobStreet returned HTTP ${entry.http_status}; stopping depth run`)
              }
              if (
                /^(?:just a moment\.*|access denied|security verification|verify you are human|robot check)$/i.test(
                  (await page.title()).trim()
                )
              ) {
                blocked = true
                throw new Error('JobStreet returned a verification or access-denied page; stopping depth run')
              }
              jobUrl(page.url(), breadth.job_id)
              if ([404, 410].includes(entry.http_status ?? 0)) {
                observation.outcome = 'unavailable'
                observation.unavailable_reason = entry.http_status === 404 ? 'http_404' : 'http_410'
              } else {
                if (!response?.ok()) throw new Error(`JobStreet returned HTTP ${entry.http_status}`)
                const closed = await closedMessage(page)
                if (closed) observation.unavailable_reason = 'explicit_closed_message'
                if (
                  closed &&
                  (await page.locator('[data-automation="jobAdDetails"], [data-testid="job-ad-details"]').count()) === 0
                ) {
                  observation.outcome = 'unavailable'
                } else {
                  const detail = await extractDescription(page, breadth.job_id)
                  if (!detail.description_text || !detail.title)
                    throw new Error('Detail page is missing its title or description')
                  observation.title = detail.title
                  observation.company = detail.company
                  observation.classification = detail.classification
                  observation.description_text = detail.description_text
                  observation.description_html = detail.description_html
                  observation.description_sha256 = createHash('sha256').update(detail.description_text).digest('hex')
                  observation.date_posted = sourceDate(detail.date_posted)
                  observation.valid_through = sourceDate(detail.valid_through)
                  if (observation.date_posted || observation.valid_through) observation.date_fields_source = 'jsonld'
                  observation.outcome = 'fetched'
                }
              }
            } catch (error) {
              if (error instanceof VerificationTimeoutError) {
                blocked = true
                report.stop_reason = 'verification_timeout'
              } else if (entry.verification?.status === 'interrupted') {
                blocked = true
                report.stop_reason = 'error'
              }
              observation.error = error instanceof Error ? error.message : String(error)
            } finally {
              observation.detail_scraped_at = new Date().toISOString()
              observation.http_status = entry.http_status
              observation.final_url = observation.final_url ?? page.url()
              entry.outcome = observation.outcome
              entry.error = observation.error
              report.jobs_attempted++
              if (observation.outcome === 'fetched') report.jobs_fetched++
              else if (observation.outcome === 'unavailable') report.jobs_unavailable++
              else report.jobs_failed++
              await appendFile(resolve(output, 'details.jsonl'), `${JSON.stringify(observation)}\n`)
              remember(observation)
              await saveEvidence(page, resolve(output, `job-${breadth.job_id}`))
              await save()
            }
            if (blocked) {
              report.stop_reason ??= 'blocked'
              throw new Error(observation.error!)
            }
            if (index < pending.length - 1) await pauseBetweenRequests(options.delayMs, delayJitterMs)
          }
        },
        async (profileId) => {
          report.profile_id = profileId
          await save()
        }
      )
    report.stop_reason = selected.length < targets.size ? 'job_limit' : 'completed'
    report.status =
      report.jobs_failed === 0 ? 'success' : report.jobs_failed === report.jobs_attempted ? 'failed' : 'partial'
    if (report.status === 'failed') report.error = 'All selected detail fetches failed; inspect details.jsonl'
    return report
  } catch (error) {
    report.status = 'failed'
    if (report.stop_reason !== 'blocked' && report.stop_reason !== 'verification_timeout') report.stop_reason = 'error'
    report.error = error instanceof Error ? error.message : String(error)
    throw error
  } finally {
    report.finished_at = new Date().toISOString()
    await writeListings(
      resolve(output, 'jobs.enriched.jsonl'),
      [...targets.values()].map((breadth) => {
        const detail = descriptions.get(breadth.job_id) ?? null
        const lastAttempt = latestDetails.get(breadth.job_id) ?? null
        return {
          ...breadth,
          detail,
          detail_last_attempt: lastAttempt?.outcome === 'fetched' ? null : lastAttempt,
          detail_fetch_status:
            lastAttempt?.depth_run_id === report.run_id
              ? lastAttempt.outcome
              : detail
                ? 'reused'
                : (lastAttempt?.outcome ?? 'not_fetched')
        }
      })
    )
    await save()
    console.info(
      `${report.status}: ${report.jobs_fetched} fetched; ${report.jobs_reused} reused; ${report.jobs_unavailable} unavailable; ${report.jobs_failed} failed; artifacts: ${output}`
    )
  }
}
