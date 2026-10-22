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
  if (scenario === 'pagination' || scenario === 'spa-pagination' || scenario === 'invalid-pagination') {
    const nextCard =
      '<article data-job-id="102"><a data-automation="jobTitle" href="/job/102">Second engineer</a></article>'
    const counters =
      '<script>for (const kind of ["mousemove", "wheel", "click"]) addEventListener(kind, e => { if(e.isTrusted) sessionStorage.setItem(kind, String(Number(sessionStorage.getItem(kind) || 0) + 1)) }); addEventListener("mousedown", e => sessionStorage.setItem("pressedAt", String(e.timeStamp)));</script>'
    const next = `<a rel="next" href="/wrong-jobs?page=2" style="display:none">Hidden duplicate</a><a aria-label="Next" href="/wrong-jobs?page=2">Unrelated recommendation</a><div style="height:1600px"></div><nav aria-label="Pagination"><a rel="next" href="/${scenario === 'invalid-pagination' ? 'wrong' : 'fixture'}-jobs?page=2" style="display:block;width:120px;height:48px;margin:24px">Next page</a></nav>`
    const spa =
      scenario === 'spa-pagination'
        ? `<script>document.querySelector('nav a[rel=next]').onclick = e => { e.preventDefault(); history.pushState({}, '', '/fixture-jobs?page=2'); setTimeout(() => { document.querySelector('#cards').innerHTML = ${JSON.stringify(nextCard)}; document.querySelector('nav').remove() }, 150) };</script>`
        : ''
    const guard =
      '<script>document.querySelector("nav a[rel=next]").addEventListener("click", e => { if(!e.isTrusted || Number(sessionStorage.getItem("mousemove")) < 10 || Number(sessionStorage.getItem("wheel")) < 1 || e.timeStamp - Number(sessionStorage.getItem("pressedAt")) < 40) { e.preventDefault(); e.stopImmediatePropagation() } });</script>'
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<html><body>${counters}<div id="cards">${url.searchParams.has('page') ? nextCard : card + '<article data-job-id="999">Malformed card</article>'}</div>${url.searchParams.has('page') ? '' : next + guard + spa}</body></html>`
    })
  }
  if (url.pathname === '/frame') {
    frameRequests++
    return route.fulfill({ status: 200, contentType: 'text/html', body: card })
  }
  requests++
  if (scenario === 'denied' || scenario === 'rate-limited')
    return route.fulfill({
      status: scenario === 'denied' ? 403 : 429,
      contentType: 'text/html',
      body: '<title>Access denied</title>'
    })
  if (url.searchParams.has('__cf_chl_verified'))
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: url.pathname.includes('/job/') ? description : card
    })
  const script = scenario.startsWith('clears')
    ? '<script>setTimeout(() => { const url = new URL(location.href); url.searchParams.set("__cf_chl_verified", "1"); url.searchParams.set("__cf_chl_tk", "fixture-temporary"); location.href = url.href }, 800)</script>'
    : '<iframe src="/frame"></iframe>'
  return route.fulfill({
    status: scenario === 'clears-429' ? 429 : 403,
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

for (const initialStatus of [403, 429])
  browserTest(
    `breadth waits for HTTP ${initialStatus} verification and records the final HTTP response`,
    async () => {
      scenario = initialStatus === 403 ? 'clears' : 'clears-429'
      requests = 0
      const config = options(`cleared-${initialStatus}`)
      const report = await breadth(config)
      expect([report.status, report.jobs_saved, requests]).toEqual(['success', 1, 2])
      const page = report.pages[0]
      expect([page.http_status, page.attempts, page.verification?.status]).toEqual([200, 1, 'cleared'])
      expect([
        page.verification?.initial_http_status,
        page.verification?.final_http_status,
        page.verification?.ray_id
      ]).toEqual([initialStatus, 200, 'fixture-ray'])
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
    scenario = 'clears-429'
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

for (const status of [403, 429])
  browserTest(
    `an ordinary HTTP ${status} fails without entering verification waiting`,
    async () => {
      scenario = status === 403 ? 'denied' : 'rate-limited'
      requests = 0
      const config = options(`denied-${status}`)
      await expect(breadth(config)).rejects.toThrow(`HTTP ${status}`)
      const report = JSON.parse(await readFile(join(config.output, 'run.json'), 'utf8'))
      expect([report.stop_reason, requests, report.pages[0].verification]).toEqual(['error', 1, undefined])
    },
    30_000
  )

browserTest(
  'breadth scrolls and clicks the actual Next link, including client-side navigation',
  async () => {
    for (const mode of ['pagination', 'spa-pagination']) {
      scenario = mode
      const config = { ...options(mode), maxPages: 2, maxJobs: 2 }
      const report = await breadth(config)
      expect([report.status, report.jobs_saved]).toEqual(['success', 2])
      expect(report.records_rejected).toBe(1)
      expect(report.pages[1].navigation_kind).toBe('click')
      expect(report.pages[1].interaction!.scroll_notches).toBeGreaterThan(0)
      expect(report.pages[1].interaction!.pointer_moves).toBeGreaterThan(10)
      expect(report.pages[1].interaction!.press_ms).toBeGreaterThanOrEqual(55)
      expect(report.pages[1].http_status).toBe(mode === 'pagination' ? 200 : null)
    }
  },
  60_000
)

browserTest(
  'pagination refuses a Next link that changes search scope before clicking',
  async () => {
    scenario = 'invalid-pagination'
    const config = { ...options('invalid-pagination'), maxPages: 2, maxJobs: 2 }
    await expect(breadth(config)).rejects.toThrow('change the search query')
    const report = JSON.parse(await readFile(join(config.output, 'run.json'), 'utf8'))
    expect([report.jobs_saved, report.pages.length]).toEqual([1, 1])
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
