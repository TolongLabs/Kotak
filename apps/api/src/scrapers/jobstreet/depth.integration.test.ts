import { afterAll, beforeAll, expect, mock, test } from 'bun:test'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import type { Page, Route } from '@kotak/browser'
import type { DepthOptions, scrapeJobstreetDepth } from './depth'
import { withBrowserProfile } from './browser-profile'

const root = fileURLToPath(new URL('../../../../../', import.meta.url))
const scratch = resolve(root, '.local')
const browserTest = Bun.env.BROWSER_INTEGRATION === '1' ? test : test.skip
const openProfile = withBrowserProfile
let workspace: string
let input: string
let scenario = 'mixed'
let temporaryAttempts = 0
let blockedAttempts = 0
let run: typeof scrapeJobstreetDepth

const listing = (id: string, extra = {}) => ({
  source: 'jobstreet',
  job_id: id,
  url: `https://my.jobstreet.com/job/${id}`,
  title: 'Engineer',
  listing_text: 'Engineer search card',
  search_url: 'https://my.jobstreet.com/software-engineer-jobs',
  scraped_at: '2026-10-20T00:00:00Z',
  ...extra
})
const lines = async (path: string) =>
  (await readFile(path, 'utf8'))
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
const html = (id: string, description = 'Build services with TypeScript.\nReact experience is preferred.') => {
  const metadata = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'JobPosting',
        url: `https://my.jobstreet.com/job/${id === '104' ? '999' : id}`,
        datePosted: '2026-10-01T09:00:00+08:00',
        validThrough: '2026-11-30'
      }
    ]
  }
  return `<html><head><title>Engineer job</title></head><body><nav>Unrelated navigation</nav>
    <h1 data-automation="job-detail-title">Engineer ${id}</h1><span data-automation="advertiser-name">Example Ltd</span>
    <span data-automation="job-detail-classifications">Engineering</span>
    ${id === '105' ? '<p>This job has expired.</p>' : ''}
    <div data-automation="jobAdDetails"><p>${description.replace('\n', '</p><p>')}</p></div>
    <script type="application/ld+json">${JSON.stringify(metadata)}</script>
    <script type="application/ld+json">malformed unrelated data</script><footer>Unrelated footer</footer></body></html>`
}

async function fixture(route: Route) {
  const id = new URL(route.request().url()).pathname.split('/').pop()!
  if (scenario === 'blocked') {
    blockedAttempts++
    return route.fulfill({ status: 429, contentType: 'text/html', body: '<h1>Rate limited</h1>' })
  }
  if (scenario === 'challenge') {
    blockedAttempts++
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html><head><title>Verify you are human</title><script>history.replaceState({}, "", "/captcha")</script></head><body>Verification required</body></html>'
    })
  }
  if (scenario === 'refresh-failed')
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<div data-automation="jobAdDetails">Missing job title</div>'
    })
  if (scenario === 'refresh-unavailable')
    return route.fulfill({ status: 410, contentType: 'text/html', body: '<h1>Gone</h1>' })
  if (scenario === 'mixed') {
    if (id === '102') return route.fulfill({ status: 404, contentType: 'text/html', body: '<h1>Not found</h1>' })
    if (id === '103')
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<p>This job is no longer available.</p>' })
    if (id === '104' && temporaryAttempts++ === 0)
      return route.fulfill({ status: 503, contentType: 'text/html', body: '<h1>Temporary outage</h1>' })
    if (id === '106')
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div data-automation="jobAdDetails"><p>Description without a job title</p></div>'
      })
  }
  return route.fulfill({ status: 200, contentType: 'text/html', body: html(id) })
}

beforeAll(async () => {
  await mkdir(scratch, { recursive: true })
  workspace = await mkdtemp(join(scratch, 'jobstreet-depth-check-'))
  input = join(workspace, 'breadth.jsonl')
  const rows = [
    listing('101'),
    listing('101', { scraped_at: '2026-10-22T00:00:00Z', scrape_run_id: 'latest-breadth' }),
    ...['102', '103', '104', '105', '106'].map((id) => listing(id))
  ]
  await writeFile(input, `${rows.map((row) => JSON.stringify(row)).join('\n')}\nnot-json\n`)
  if (Bun.env.BROWSER_INTEGRATION === '1') {
    mock.module(resolve(root, 'apps/api/src/scrapers/jobstreet/browser-profile.ts'), () => ({
      withBrowserProfile: (
        options: { profileId?: string; headless?: boolean },
        callback: (page: Page, id: string) => Promise<unknown>,
        onProfile?: (id: string) => Promise<void>
      ) =>
        openProfile(
          options,
          async (page, id) => {
            await page.route('https://my.jobstreet.com/**', fixture)
            return callback(page, id)
          },
          onProfile
        )
    }))
    run = (await import('./depth')).scrapeJobstreetDepth
  }
})

afterAll(async () => {
  if (
    workspace &&
    dirname(resolve(workspace)) === scratch &&
    basename(workspace).startsWith('jobstreet-depth-check-')
  ) {
    await rm(workspace, { recursive: true, force: true })
  }
})

// The message of a run that must fail. A plain await settles it: bun:test waits for expect(run).rejects in a nested
// event loop that can skip the microtask checkpoint after each setImmediate callback (oven-sh/bun#45020). Playwright
// handles each DevTools message in one, so a browser launched in there can miss its page's load event and hang until
// Playwright's 180-second launch timeout.
async function failure(run: Promise<unknown>): Promise<string> {
  try {
    await run
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
  throw new Error('Expected the run to fail')
}

const options = (name: string): DepthOptions => ({
  inputs: [input],
  profileId: Bun.env.BROWSER_PROFILE_ID,
  output: join(workspace, name),
  maxJobs: 100,
  delayMs: 2000,
  maxRetries: 1
})

test('CLI requires depth inputs and rejects mode-specific option mistakes before browser startup', async () => {
  const cli = resolve(root, 'apps/api/src/scrapers/jobstreet/cli.ts')
  for (const args of [
    ['--mode', 'depth'],
    ['--mode', 'unknown'],
    ['--mode', 'breadth', '--input', input],
    ['--mode', 'depth', '--input', input, '--url', 'https://my.jobstreet.com/software-engineer-jobs']
  ]) {
    const child = Bun.spawn([process.execPath, cli, ...args], { stdout: 'pipe', stderr: 'pipe' })
    const [exit, error] = await Promise.all([child.exited, new Response(child.stderr).text()])
    expect(exit).toBe(1)
    expect(error.length).toBeGreaterThan(0)
  }
})

browserTest(
  'depth enriches unique breadth IDs and preserves descriptions, metadata and partial failures',
  async () => {
    scenario = 'mixed'
    const config = options('mixed')
    const original = await readFile(input, 'utf8')
    const report = await run(config)
    expect(report.mode).toBe('depth')
    expect(report.status).toBe('partial')
    expect([report.jobs_fetched, report.jobs_unavailable, report.jobs_failed]).toEqual([3, 2, 1])
    expect([report.input_duplicates, report.records_rejected, report.jobs_attempted]).toEqual([1, 1, 6])
    const details = await lines(join(config.output, 'details.jsonl'))
    const first = details.find((detail) => detail.job_id === '101')
    expect(first.description_text).toContain('React experience is preferred.')
    expect(first.description_text).not.toContain('Unrelated footer')
    expect(first.description_html).toContain('<p>')
    expect(first.description_sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(first.breadth_observation.scrape_run_id).toBe('latest-breadth')
    expect(first.depth_run_id).toBe(report.run_id)
    expect([first.date_posted, first.valid_through, first.date_fields_source]).toEqual([
      '2026-10-01T09:00:00+08:00',
      '2026-11-30',
      'jsonld'
    ])
    expect(details.find((detail) => detail.job_id === '102').unavailable_reason).toBe('http_404')
    expect(details.find((detail) => detail.job_id === '103').unavailable_reason).toBe('explicit_closed_message')
    expect(details.find((detail) => detail.job_id === '104').date_posted).toBeNull() // Ignore another job's metadata.
    expect(report.jobs.find((job) => job.job_id === '104')?.attempts).toBe(2)
    expect(details.find((detail) => detail.job_id === '105').description_text).toBeTruthy() // Closed ads can still have useful descriptions.
    expect(details.find((detail) => detail.job_id === '106').outcome).toBe('failed')
    expect(details.find((detail) => detail.job_id === '106').unavailable_reason).toBeNull()
    expect(await readFile(input, 'utf8')).toBe(original)
  },
  120_000
)

browserTest(
  'depth stops on rate limiting and retains the failure instead of marking the job closed',
  async () => {
    scenario = 'blocked'
    const config = options('blocked')
    expect(await failure(run(config))).toContain('429')
    const report = JSON.parse(await readFile(join(config.output, 'run.json'), 'utf8'))
    expect([report.status, report.stop_reason, report.jobs_attempted, blockedAttempts]).toEqual([
      'failed',
      'blocked',
      1,
      1
    ])
    const detail = (await lines(join(config.output, 'details.jsonl')))[0]
    expect(detail.outcome).toBe('failed')
    expect(detail.unavailable_reason).toBeNull()
  },
  120_000
)

browserTest(
  'depth bounds verification waiting before validating its changed URL',
  async () => {
    scenario = 'challenge'
    blockedAttempts = 0
    const config = options('challenge')
    expect(await failure(run({ ...config, verificationTimeoutMs: 0 }))).toContain('Verification did not clear')
    const report = JSON.parse(await readFile(join(config.output, 'run.json'), 'utf8'))
    expect([report.stop_reason, report.jobs_attempted, blockedAttempts]).toEqual(['verification_timeout', 1, 1])
    const detail = (await lines(join(config.output, 'details.jsonl')))[0]
    expect(detail.final_url).toBe('https://my.jobstreet.com/captcha')
    expect(detail.unavailable_reason).toBeNull()
  },
  120_000
)

browserTest(
  'failed and unavailable refresh attempts retain reusable descriptions and their original dates',
  async () => {
    scenario = 'repeat'
    const seed = options('refresh-seed')
    await run({ ...seed, maxJobs: 1 })
    const cache = join(seed.output, 'jobs.enriched.jsonl')
    const saved = (await lines(cache))[0].detail
    for (const outcome of ['failed', 'unavailable']) {
      scenario = `refresh-${outcome}`
      const config = options(`refresh-${outcome}`)
      await run({ ...config, maxJobs: 1, previousDetails: [cache], refreshAfterHours: 0 })
      const refreshed = join(config.output, 'jobs.enriched.jsonl')
      const row = (await lines(refreshed))[0]
      expect(row.detail).toEqual(saved)
      expect(row.detail_last_attempt.outcome).toBe(outcome)
      expect(row.detail_fetch_status).toBe(outcome)
      const reused = await run({
        ...options(`reuse-after-${outcome}`),
        maxJobs: 1,
        previousDetails: [refreshed],
        profileId: 'unopened-profile'
      })
      expect([reused.jobs_reused, reused.jobs_attempted, reused.profile_id]).toEqual([1, 0, null])
      const reusedRow = (await lines(join(workspace, `reuse-after-${outcome}/jobs.enriched.jsonl`)))[0]
      expect(reusedRow.detail).toEqual(saved)
      expect(reusedRow.detail_last_attempt.outcome).toBe(outcome)
      expect(reusedRow.detail_fetch_status).toBe('reused')
    }
  },
  120_000
)

browserTest(
  'repeat depth runs preserve new observation IDs while unchanged descriptions keep their hash',
  async () => {
    scenario = 'repeat'
    const one = await run({ ...options('repeat-one'), maxJobs: 1 })
    const cache = join(workspace, 'repeat-one/jobs.enriched.jsonl')
    const reused = await run({
      ...options('reused'),
      maxJobs: 1,
      previousDetails: [cache],
      profileId: 'unopened-profile'
    })
    expect(reused.refresh_after_hours).toBeNull()
    expect([reused.jobs_reused, reused.jobs_attempted, reused.profile_id]).toEqual([1, 0, null])
    expect(await readFile(join(workspace, 'reused/details.jsonl'), 'utf8')).toBe('')
    const reusedView = await lines(join(workspace, 'reused/jobs.enriched.jsonl'))
    expect(reusedView[0].detail_fetch_status).toBe('reused')
    const two = await run({ ...options('repeat-two'), maxJobs: 1, previousDetails: [cache], refreshAfterHours: 0 })
    const first = (await lines(join(workspace, 'repeat-one/details.jsonl')))[0]
    const second = (await lines(join(workspace, 'repeat-two/details.jsonl')))[0]
    expect(one.run_id).not.toBe(two.run_id)
    expect(first.detail_scraped_at).not.toBe(second.detail_scraped_at)
    expect(first.description_sha256).toBe(second.description_sha256)
    expect(reusedView[0].detail.detail_scraped_at).toBe(first.detail_scraped_at)
    expect((await lines(join(workspace, 'repeat-two/jobs.enriched.jsonl')))[0].detail_fetch_status).toBe('fetched')
    expect(one.stop_reason).toBe('job_limit')
    expect(second.breadth_observation.scraped_at).toBe('2026-10-22T00:00:00.000Z')
  },
  120_000
)
