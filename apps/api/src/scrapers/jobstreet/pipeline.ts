import { appendFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Page } from 'playwright-core'
import { navigate, saveEvidence } from './browser'
import type { NavigationState } from './browser'
import { createOutputDirectory, writeJson, writeListings } from './files'
import { withKameleo } from './kameleo'
import { parseListing, parseSort, searchUrl, sortListings } from './records'
import type { JobListing, SortMode } from './records'

export type { JobListing } from './records'
export { searchUrl } from './records'

export interface ScrapeOptions {
  url: string
  endpoint: string
  output: string
  maxPages: number
  maxJobs: number
  delayMs: number
  maxRetries?: number
  sort?: SortMode
}

interface PageResult extends NavigationState {
  cards: number
  saved: number
  rejected: number
}

async function extractListings(page: Page, runId: string): Promise<unknown[]> {
  return page.locator('article[data-job-id], article[data-testid="job-card"]').evaluateAll((cards, runId) => {
    const clean = (text: string | null | undefined) => text?.replace(/\s+/g, ' ').trim() || null
    return cards.map((card) => {
      const text = (selector: string) => clean(card.querySelector(selector)?.textContent)
      const link = card.querySelector<HTMLAnchorElement>('a[data-testid="job-title"], a[data-automation="jobTitle"]')
      const id = card.getAttribute('data-job-id') || link?.pathname.match(/\/job\/(\d+)/)?.[1] || ''
      const listingText = clean((card as HTMLElement).innerText) || ''
      return {
        source: 'jobstreet' as const,
        job_id: id,
        url: id ? `${location.origin}/job/${id}` : '',
        title: clean(link?.textContent) || '',
        company: text('[data-testid="company-name"], [data-automation="jobCompany"]'),
        location: text('[data-testid="job-location"], [data-automation="jobLocation"]'),
        salary: text('[data-testid="job-salary"], [data-automation="jobSalary"]'),
        work_type:
          text('[data-testid="job-work-type"], [data-automation="jobWorkType"]') ||
          listingText.match(/\bThis is an? (.+?) job\b/i)?.[1] ||
          null,
        work_arrangement: text('[data-testid="work-arrangement"]'),
        listed_at_label: text('[data-testid="job-listed-date"], [data-automation="jobListingDate"]'),
        summary: text('[data-testid="job-teaser"], [data-automation="jobShortDescription"]'),
        listing_text: listingText,
        search_url: location.href,
        scraped_at: new Date().toISOString(),
        scrape_run_id: runId
      }
    })
  }, runId)
}

export async function scrapeJobstreet(options: ScrapeOptions) {
  let next: string | null = searchUrl(options.url)
  const maxRetries = options.maxRetries ?? 2
  const sort = parseSort(options.sort ?? 'newest')
  if (!Number.isInteger(options.maxPages) || options.maxPages < 1 || options.maxPages > 50) {
    throw new Error('--max-pages must be an integer from 1 to 50')
  }
  if (!Number.isInteger(options.maxJobs) || options.maxJobs < 1 || options.maxJobs > 1000) {
    throw new Error('--max-jobs must be an integer from 1 to 1000')
  }
  if (!Number.isInteger(options.delayMs) || options.delayMs < 2000) {
    throw new Error('--delay-ms must be an integer of at least 2000')
  }
  if (!Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > 3) {
    throw new Error('--retries must be an integer from 0 to 3')
  }

  const output = await createOutputDirectory(options.output)
  await writeFile(resolve(output, 'jobs.jsonl'), '')
  await writeFile(resolve(output, 'rejected.jsonl'), '')
  const jobs = new Map<string, JobListing>()
  const report = {
    schema_version: 2,
    mode: 'breadth' as const,
    run_id: crypto.randomUUID(),
    status: 'running' as 'running' | 'success' | 'failed',
    started_at: new Date().toISOString(),
    finished_at: null as string | null,
    search_url: next,
    max_pages: options.maxPages,
    max_jobs: options.maxJobs,
    sort_by: sort,
    max_retries: maxRetries,
    profile_id: null as string | null,
    pages: [] as PageResult[],
    jobs_saved: 0,
    duplicates_skipped: 0,
    records_rejected: 0,
    stop_reason: null as 'job_limit' | 'page_limit' | 'no_next_page' | 'error' | null,
    error: null as string | null
  }
  const saveReport = () => writeJson(resolve(output, 'run.json'), report)
  await saveReport()
  try {
    await withKameleo(
      options.endpoint,
      async (page) => {
        const visited = new Set<string>()
        const pageSignatures = new Set<string>()
        while (next && report.pages.length < options.maxPages && report.jobs_saved < options.maxJobs) {
          const url: string = searchUrl(next)
          if (visited.has(url)) throw new Error('Pagination returned a previously visited search URL')
          visited.add(url)
          console.info(`Reading ${url}`)
          const entry: PageResult = {
            url,
            http_status: null,
            attempts: 0,
            retry_errors: [],
            cards: 0,
            saved: 0,
            rejected: 0
          }
          report.pages.push(entry)
          const prefix = resolve(output, `page-${report.pages.length}`)
          try {
            const response = await navigate(page, entry, maxRetries, options.delayMs, saveReport)
            if (!response || !response.ok()) throw new Error(`JobStreet returned HTTP ${entry.http_status}`)
            searchUrl(page.url())
            await page
              .locator('article[data-job-id], article[data-testid="job-card"]')
              .first()
              .waitFor({ timeout: 30_000 })
            const candidates = await extractListings(page, report.run_id)
            entry.cards = candidates.length
            const listings: JobListing[] = []
            for (const [index, raw] of candidates.entries()) {
              try {
                listings.push(parseListing(raw))
              } catch (error) {
                entry.rejected++
                report.records_rejected++
                await appendFile(
                  resolve(output, 'rejected.jsonl'),
                  `${JSON.stringify({ search_url: url, card: index + 1, error: String(error), raw })}\n`
                )
              }
            }
            if (!listings.length)
              throw new Error('No valid job cards on this page; inspect rejected.jsonl and browser evidence')
            const signature = [...new Set(listings.map((job) => job.job_id))].sort().join(',')
            if (pageSignatures.has(signature)) throw new Error('Pagination repeated the same set of job IDs')
            pageSignatures.add(signature)
            for (const job of listings) {
              if (jobs.has(job.job_id)) {
                report.duplicates_skipped++
                continue
              }
              if (report.jobs_saved >= options.maxJobs) break
              await appendFile(resolve(output, 'jobs.jsonl'), `${JSON.stringify(job)}\n`)
              jobs.set(job.job_id, job)
              report.jobs_saved++
              entry.saved++
            }
            const nextLink = page
              .locator('a[rel~="next"], a[data-testid="pagination-next"], a[aria-label="Next"]')
              .first()
            const href = (await nextLink.count()) ? await nextLink.getAttribute('href') : null
            next = href ? searchUrl(new URL(href, page.url()).href) : null
          } finally {
            await saveEvidence(page, prefix)
            await saveReport()
          }
          if (next && report.pages.length < options.maxPages && report.jobs_saved < options.maxJobs) {
            await Bun.sleep(options.delayMs)
          }
        }
        if (!report.jobs_saved) throw new Error('No job listings were extracted')
        report.stop_reason = report.jobs_saved >= options.maxJobs ? 'job_limit' : next ? 'page_limit' : 'no_next_page'
      },
      async (profileId) => {
        report.profile_id = profileId
        await saveReport()
      }
    )
    report.status = 'success'
    return report
  } catch (error) {
    report.status = 'failed'
    report.stop_reason = 'error'
    report.error = error instanceof Error ? error.message : String(error)
    throw error
  } finally {
    report.finished_at = new Date().toISOString()
    await writeListings(resolve(output, 'jobs.sorted.jsonl'), sortListings(jobs.values(), sort))
    await saveReport()
    console.info(
      `${report.status}: ${report.jobs_saved} jobs; ${report.duplicates_skipped} duplicates; ${report.records_rejected} rejected; artifacts: ${output}`
    )
  }
}
