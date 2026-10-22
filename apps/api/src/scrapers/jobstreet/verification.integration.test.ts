import { afterAll, beforeAll, expect, mock, test } from 'bun:test'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import type { Page, Route } from 'playwright-core'
import { withKameleo } from './kameleo'
import type { scrapeJobstreet } from './pipeline'
import type { scrapeJobstreetDepth } from './depth'

const root = fileURLToPath(new URL('../../../../../', import.meta.url))
const scratch = resolve(root, '.local')
const browserTest = Bun.env.KAMELEO_INTEGRATION === '1' ? test : test.skip
const openProfile = withKameleo
let workspace: string
let breadth: typeof scrapeJobstreet
let depth: typeof scrapeJobstreetDepth
let scenario = 'clears'
let requests = 0
let frameRequests = 0

const card = '<article data-job-id="101"><a data-automation="jobTitle" href="/job/101">Engineer</a></article>'
const description =
  '<h1 data-automation="job-detail-title">Engineer</h1><div data-automation="jobAdDetails">Build reliable software.</div>'

async function fixture(route: Route) {
  const url = new URL(route.request().url())
  if (url.pathname === '/frame') {
    frameRequests++
    return route.fulfill({ status: 200, contentType: 'text/html', body: card })
  }
  requests++
  if (scenario === 'denied')
    return route.fulfill({ status: 403, contentType: 'text/html', body: '<title>Access denied</title>' })
  if (url.searchParams.has('verified'))
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: url.pathname.includes('/job/') ? description : card
    })
  const script =
    scenario === 'clears'
      ? '<script>setTimeout(() => { const url = new URL(location.href); url.searchParams.set("verified", "1"); url.searchParams.set("__cf_chl_tk", "fixture-temporary"); location.href = url.href }, 800)</script>'
      : '<iframe src="/frame"></iframe>'
  return route.fulfill({
    status: 403,
    headers: { 'cf-mitigated': 'challenge', 'cf-ray': 'fixture-ray' },
    contentType: 'text/html',
    body: `<html><head><title>Just a moment...</title></head><body>Performing security verification${script}</body></html>`
  })
}

beforeAll(async () => {
  await mkdir(scratch, { recursive: true })
  workspace = await mkdtemp(join(scratch, 'jobstreet-verification-check-'))
  if (Bun.env.KAMELEO_INTEGRATION !== '1') return
  mock.module(resolve(root, 'apps/api/src/scrapers/jobstreet/kameleo.ts'), () => ({
    withKameleo: (
      endpoint: string,
      run: (page: Page, id: string) => Promise<unknown>,
      onProfile?: (id: string) => Promise<void>
    ) =>
      openProfile(
        endpoint,
        async (page, id) => {
          await page.route('https://my.jobstreet.com/**', fixture)
          return run(page, id)
        },
        onProfile
      )
  }))
  breadth = (await import('./pipeline')).scrapeJobstreet
  depth = (await import('./depth')).scrapeJobstreetDepth
})

afterAll(async () => {
  if (
    workspace &&
    dirname(resolve(workspace)) === scratch &&
    basename(workspace).startsWith('jobstreet-verification-check-')
  )
    await rm(workspace, { recursive: true, force: true })
})

const options = (name: string) => ({
  url: 'https://my.jobstreet.com/fixture-jobs',
  endpoint: Bun.env.KAMELEO_ENDPOINT || 'http://localhost:5050',
  output: join(workspace, name),
  maxJobs: 1,
  maxPages: 1,
  delayMs: 2000,
  maxRetries: 0,
  verificationTimeoutMs: 5000
})

browserTest(
  'breadth waits for automatic verification clearance and records the final HTTP response',
  async () => {
    scenario = 'clears'
    requests = 0
    const config = options('cleared')
    const report = await breadth(config)
    expect([report.status, report.jobs_saved, requests]).toEqual(['success', 1, 2])
    const page = report.pages[0]
    expect([page.http_status, page.attempts, page.verification?.status]).toEqual([200, 1, 'cleared'])
    expect([
      page.verification?.initial_http_status,
      page.verification?.final_http_status,
      page.verification?.ray_id
    ]).toEqual([403, 200, 'fixture-ray'])
    expect(await readFile(join(config.output, 'page-1-verification.html'), 'utf8')).toContain(
      'Performing security verification'
    )
    const job = JSON.parse((await readFile(join(config.output, 'jobs.jsonl'), 'utf8')).trim())
    expect(job.search_url).not.toContain('__cf_chl_')
  },
  30_000
)

browserTest(
  'depth resumes description extraction after automatic verification clearance',
  async () => {
    scenario = 'clears'
    requests = 0
    const input = join(workspace, 'breadth.jsonl')
    await writeFile(
      input,
      JSON.stringify({
        source: 'jobstreet',
        job_id: '101',
        url: 'https://my.jobstreet.com/job/101',
        title: 'Engineer',
        listing_text: 'Engineer',
        search_url: 'https://my.jobstreet.com/fixture-jobs',
        scraped_at: '2026-10-22T00:00:00Z'
      })
    )
    const config = options('depth-cleared')
    const report = await depth({ ...config, inputs: [input] })
    expect([report.status, report.jobs_fetched, requests]).toEqual(['success', 1, 2])
    expect(report.jobs[0].verification?.status).toBe('cleared')
    const detail = JSON.parse((await readFile(join(config.output, 'details.jsonl'), 'utf8')).trim())
    expect([detail.http_status, detail.description_text]).toEqual([200, 'Build reliable software.'])
  },
  30_000
)

browserTest(
  'an ordinary HTTP 403 fails without entering verification waiting',
  async () => {
    scenario = 'denied'
    requests = 0
    const config = options('denied')
    await expect(breadth(config)).rejects.toThrow('HTTP 403')
    const report = JSON.parse(await readFile(join(config.output, 'run.json'), 'utf8'))
    expect([report.stop_reason, requests, report.pages[0].verification]).toEqual(['error', 1, undefined])
  },
  30_000
)

browserTest(
  'verification times out without counting a successful iframe response as clearance',
  async () => {
    scenario = 'stuck'
    requests = 0
    frameRequests = 0
    const config = { ...options('timed-out'), verificationTimeoutMs: 1500 }
    await expect(breadth(config)).rejects.toThrow('Verification did not clear')
    const report = JSON.parse(await readFile(join(config.output, 'run.json'), 'utf8'))
    expect([report.stop_reason, report.jobs_saved, requests, frameRequests]).toEqual(['verification_timeout', 0, 1, 1])
    expect([report.pages[0].http_status, report.pages[0].verification.status]).toEqual([403, 'timed_out'])
    expect(await readFile(join(config.output, 'jobs.jsonl'), 'utf8')).toBe('')
  },
  30_000
)
