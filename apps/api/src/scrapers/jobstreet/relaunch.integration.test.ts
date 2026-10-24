import { afterAll, beforeAll, expect, spyOn, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProfile, deleteProfile, DEFAULT_ROOT, withProfile, type Page, type Route } from '@kotak/browser'
import { scrapeJobstreetDepth } from './depth'
import { scrapeJobstreet, type ScrapeOptions } from './pipeline'
import { MAX_BROWSER_RELAUNCHES, type OpenBrowser } from './relaunch'

// Browser crashes mid-run (#264) in the real Clearcote browser: a renderer crash through the DevTools Protocol's
// Page.crash, and the browser process killed by its PID. Every request the browser makes goes through page.route:
// fixture pages are served for my.jobstreet.com and every other host is aborted, so nothing reaches JobStreet.
// Opt-in, like the other browser checks: BROWSER_INTEGRATION=1.
const enabled = Bun.env.BROWSER_INTEGRATION === '1'
const browserTest = enabled ? test : test.skip
const root = fileURLToPath(new URL('../../../../../', import.meta.url))
const scratch = resolve(root, '.local')
const headless = Bun.env.BROWSER_HEADLESS === 'true'

const SEARCH = 'https://my.jobstreet.com/software-engineer-jobs'
const LAST_PAGE = 4
const searchPage = (number: number) => (number === 1 ? SEARCH : `${SEARCH}?page=${number}`)
const pageOf = (url: string) => Number(new URL(url).searchParams.get('page') ?? '1')
const jobIds = (page: number) => [1, 2, 3].map((card) => String(page * 100 + card))
const BASELINE = [1, 2, 3, 4].flatMap(jobIds)
// A disrupted page renders its cards or description this long after loading, so the crash or kill, 200 ms after
// the document is served, always lands before the scraper can read them.
const SLOW_RENDER_MS = 5_000

// A favicon link stops the browser fetching /favicon.ico from the network, outside page.route.
const head = (title: string) => `<head><title>${title}</title><link rel="icon" href="data:,"></head>`

function searchHtml(number: number, renderAfterMs: number) {
  const cards = jobIds(number)
    .map(
      (id, index) =>
        `<article data-job-id="${id}"><a data-automation="jobTitle" href="/job/${id}">Software Engineer ${id}</a>` +
        `<span data-automation="jobCompany">Example Sdn Bhd</span><span data-automation="jobLocation">Kuala Lumpur</span>` +
        `<span data-automation="jobListingDate">${index + 1}d ago</span></article>`
    )
    .join('')
  const next =
    number < LAST_PAGE
      ? `<nav aria-label="Pagination"><a rel="next" href="/software-engineer-jobs?page=${number + 1}" style="display:block;width:120px;height:48px;margin:24px">Next</a></nav>`
      : ''
  const render = renderAfterMs
    ? `<script>setTimeout(() => { document.querySelector('#cards').innerHTML = ${JSON.stringify(cards)} }, ${renderAfterMs})</script>`
    : ''
  return `<!doctype html><html>${head('Software Engineer Jobs in Malaysia')}<body><h1>Software Engineer jobs</h1><div id="cards">${renderAfterMs ? '' : cards}</div>${next}${render}</body></html>`
}

// JobStreet's page past the last one: HTTP 200, the total and "No matching search results", no cards.
const endHtml = () =>
  `<!doctype html><html>${head('Software Engineer Jobs in Malaysia')}<body><h1>12 jobs</h1><h2>No matching search results</h2><p>We couldn't find anything matching your search.</p></body></html>`

function jobHtml(id: string, renderAfterMs: number) {
  const details = `<div data-automation="jobAdDetails"><p>Build services with TypeScript for job ${id}.</p><p>React experience is preferred.</p></div>`
  const render = renderAfterMs
    ? `<script>setTimeout(() => { document.querySelector('#details').innerHTML = ${JSON.stringify(details)} }, ${renderAfterMs})</script>`
    : ''
  return `<!doctype html><html>${head(`Software Engineer ${id} Job in Kuala Lumpur`)}<body><h1 data-automation="job-detail-title">Software Engineer ${id}</h1><span data-automation="advertiser-name">Example Sdn Bhd</span><span data-automation="job-detail-classifications">Engineering</span><div id="details">${renderAfterMs ? '' : details}</div>${render}</body></html>`
}

// Where a disruption can fire: as a search page or job ad is served (before its cards or description render), or
// as the scraper looks for the Next link (after the page's listings are saved).
type Moment = { kind: 'document' | 'next-link'; url: string }
type Action = 'crash' | 'kill' | 'sample'
interface Launch {
  number: number
  profileId: string
  pid: number
  canvas: string
  cookies: string[]
}
interface Site {
  plan: (launch: number, moment: Moment) => Action | undefined
  // Serve this document as a Cloudflare challenge that never clears.
  challenge?: (launch: number, url: string) => boolean
  // How long after serving a document its disruption fires; 200 ms unless set.
  disruptAfterMs?: number
  launches: Launch[]
  served: Array<{ launch: number; url: string; how: 'fulfilled' | 'aborted'; cookie: string | null }>
  seen: string[]
  fired: Set<string>
  disruptions: string[]
  sockets: string[]
  problems: string[]
}
const site = (plan: Site['plan'] = () => undefined, extra: Pick<Site, 'challenge' | 'disruptAfterMs'> = {}): Site => ({
  plan,
  ...extra,
  launches: [],
  served: [],
  seen: [],
  fired: new Set(),
  disruptions: [],
  sockets: [],
  problems: []
})

async function output(command: string[]) {
  const child = Bun.spawn(command, { stdin: 'ignore', stderr: 'ignore' })
  const [text] = await Promise.all([new Response(child.stdout).text(), child.exited])
  return text.trim()
}

// The browser's own process: started with this profile's data directory and, unlike its child processes, without a
// --type= switch. Nothing else on the machine is ever matched, so only the browser this test launched is killed.
async function browserPid(profileId: string): Promise<number> {
  let pids: number[] = []
  if (process.platform === 'win32') {
    const found = await output([
      'powershell.exe',
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" | Where-Object { $_.CommandLine -like '*${profileId}*' -and $_.CommandLine -notlike '*--type=*' } | ForEach-Object { $_.ProcessId }`
    ])
    pids = found.split(/\s+/).filter(Boolean).map(Number)
  } else {
    for (const entry of await readdir('/proc')) {
      if (!/^\d+$/.test(entry)) continue
      const command = await readFile(`/proc/${entry}/cmdline`, 'utf8').catch(() => '')
      if (command.includes(profileId) && !command.includes('--type=')) pids.push(Number(entry))
    }
  }
  if (pids.length !== 1) throw new Error(`Expected one browser process for profile ${profileId}, found ${pids}`)
  return pids[0]
}

// TCP and UDP sockets held by any of this browser's processes. Routed pages should leave it with none at all.
async function sockets(profileId: string): Promise<string[]> {
  if (process.platform !== 'win32') return []
  const found = await output([
    'powershell.exe',
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    `$ids = @(Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" | Where-Object { $_.CommandLine -like '*${profileId}*' } | ForEach-Object { $_.ProcessId }); ` +
      `if ($ids.Count -eq 0) { 'no browser processes' }; ` +
      `Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $ids -contains $_.OwningProcess } | ForEach-Object { "tcp $($_.RemoteAddress):$($_.RemotePort) $($_.State)" }; ` +
      `Get-NetUDPEndpoint -ErrorAction SilentlyContinue | Where-Object { $ids -contains $_.OwningProcess } | ForEach-Object { "udp $($_.LocalAddress):$($_.LocalPort)" }`
  ])
  return found.split(/\r?\n/).filter(Boolean)
}

// Seeded per profile by Clearcote, so the same profile draws the same canvas and another profile draws another.
const canvasHash = (page: Page) =>
  page
    .evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 220
      canvas.height = 40
      const context = canvas.getContext('2d')!
      context.font = '16px Arial'
      context.fillStyle = '#069'
      context.fillText('Kotak relaunch check', 4, 24)
      return canvas.toDataURL()
    })
    .then((url) => new Bun.CryptoHasher('sha256').update(url).digest('hex').slice(0, 16))

function fire(state: Site, launch: Launch, moment: Moment): Action | undefined {
  const key = `${launch.number} ${moment.kind} ${moment.url}`
  if (state.fired.has(key)) return undefined
  const action = state.plan(launch.number, moment)
  if (action) state.fired.add(key)
  return action
}

async function disrupt(state: Site, launch: Launch, page: Page, action: Action) {
  try {
    state.sockets.push(...(await sockets(launch.profileId)))
    if (action === 'sample') return
    const gone = new Promise((done) => {
      page.once('crash', done)
      page.once('close', done)
    })
    state.disruptions.push(`${launch.number} ${action} ${page.url()}`)
    if (action === 'crash') {
      const cdp = await page.context().newCDPSession(page)
      // The renderer dies before it can answer, so the command's own result is never awaited.
      void cdp.send('Page.crash').catch(() => {})
    } else process.kill(launch.pid, 'SIGKILL')
    let timer: ReturnType<typeof setTimeout> | undefined
    await Promise.race([
      gone,
      new Promise((_, fail) => {
        timer = setTimeout(() => fail(new Error(`The page outlived a ${action}`)), 15_000)
      })
    ]).finally(() => clearTimeout(timer))
  } catch (error) {
    state.problems.push(String(error))
  }
}

async function serve(state: Site, launch: Launch, page: Page, route: Route) {
  const request = route.request()
  const url = new URL(request.url())
  if (url.hostname !== 'my.jobstreet.com') {
    state.served.push({ launch: launch.number, url: request.url(), how: 'aborted', cookie: null })
    return route.abort('blockedbyclient')
  }
  const job = url.pathname.match(/^\/job\/(\d+)$/)?.[1]
  const search = url.pathname === '/software-engineer-jobs'
  const action = job || search ? fire(state, launch, { kind: 'document', url: request.url() }) : undefined
  const slow = action === 'crash' || action === 'kill' ? SLOW_RENDER_MS : 0
  const body = job
    ? jobHtml(job, slow)
    : search
      ? pageOf(request.url()) <= LAST_PAGE
        ? searchHtml(pageOf(request.url()), slow)
        : endHtml()
      : 'Not found'
  state.served.push({
    launch: launch.number,
    url: request.url(),
    how: 'fulfilled',
    cookie: await request.headerValue('cookie')
  })
  const cookie = { 'set-cookie': `kotak_fixture=launch-${launch.number}; Path=/; Max-Age=86400; Secure` }
  if (state.challenge?.(launch.number, request.url()))
    await route.fulfill({
      status: 403,
      contentType: 'text/html',
      headers: { ...cookie, 'cf-mitigated': 'challenge', 'cf-ray': 'fixture-ray' },
      body: `<!doctype html><html>${head('Just a moment...')}<body>Performing security verification</body></html>`
    })
  else await route.fulfill({ status: job || search ? 200 : 404, contentType: 'text/html', headers: cookie, body })
  if (action) setTimeout(() => void disrupt(state, launch, page, action), state.disruptAfterMs ?? 200)
}

// The scraper reads both Next-link groups with locator(...).count() right after it saves a page's listings.
function watchNextLinks(state: Site, launch: Launch, page: Page) {
  const locate = page.locator.bind(page)
  page.locator = ((selector: string, options?: Parameters<Page['locator']>[1]) => {
    const locator = locate(selector, options)
    if (!selector.includes('pagination')) return locator
    const count = locator.count.bind(locator)
    locator.count = async () => {
      const action = fire(state, launch, { kind: 'next-link', url: page.url() })
      if (action) await disrupt(state, launch, page, action)
      return count()
    }
    return locator
  }) as Page['locator']
}

// Each launch, including every relaunch, opens the real profile and installs the routes before the scraper's first
// request. withProfile is the function withBrowserProfile wraps; it is imported from @kotak/browser because the other
// browser checks replace browser-profile.ts with mock.module, which lasts for the whole bun test process.
const opener =
  (state: Site): OpenBrowser =>
  (options, run, onProfile) =>
    withProfile(
      options,
      async (page, profileId) => {
        const launch: Launch = {
          number: state.launches.length + 1,
          profileId,
          pid: await browserPid(profileId),
          canvas: await canvasHash(page),
          cookies: (await page.context().cookies('https://my.jobstreet.com')).map(
            ({ name, value }) => `${name}=${value}`
          )
        }
        state.launches.push(launch)
        page.context().on('request', (request) => state.seen.push(request.url()))
        await page.route('**/*', (route) => serve(state, launch, page, route))
        watchNextLinks(state, launch, page)
        return run(page, profileId)
      },
      onProfile
    )

const label = (url: string) => {
  const job = new URL(url).pathname.match(/^\/job\/(\d+)$/)?.[1]
  return job ? `job ${job}` : `p${pageOf(url)}`
}
const documents = (state: Site) =>
  state.served.filter((entry) => entry.how === 'fulfilled').map((entry) => `${entry.launch} ${label(entry.url)}`)
const lines = async (path: string) =>
  (await readFile(path, 'utf8'))
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
const profilesOnDisk = async () => (await readdir(DEFAULT_ROOT).catch(() => [] as string[])).sort()

let workspace: string
const logs: string[] = []
let quiet: Array<{ mockRestore: () => void }> = []
let savedProfile: string | null = null
let baseline: { ids: string[]; seconds: number } | null = null

beforeAll(async () => {
  if (!enabled) return
  await mkdir(scratch, { recursive: true })
  workspace = await mkdtemp(join(scratch, 'jobstreet-relaunch-check-'))
  // The scrapers log every page, pause and crash. Keep them for the assertions and print only the results.
  quiet = (['info', 'warn', 'error'] as const).map((level) =>
    spyOn(console, level).mockImplementation((...parts: unknown[]) => {
      logs.push(`${level}: ${parts.map(String).join(' ')}`)
    })
  )
})

afterAll(async () => {
  for (const spy of quiet) spy.mockRestore()
  if (savedProfile) await removeProfile(savedProfile)
  if (
    workspace &&
    dirname(resolve(workspace)) === scratch &&
    basename(workspace).startsWith('jobstreet-relaunch-check-')
  )
    await rm(workspace, { recursive: true, force: true })
})

// A browser that has just closed can hold handles in its profile for a moment on Windows.
async function removeProfile(id: string) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await deleteProfile(id)
    } catch (error) {
      if (attempt >= 20) throw error
      await Bun.sleep(250)
    }
  }
}

async function breadth(name: string, state: Site, extra: Partial<ScrapeOptions> = {}) {
  const path = join(workspace, name)
  const before = await profilesOnDisk()
  const from = logs.length
  const started = performance.now()
  let error: unknown = null
  try {
    await scrapeJobstreet({
      url: SEARCH,
      output: path,
      maxPages: 10,
      maxJobs: 100,
      delayMs: 2000,
      delayJitterMs: 0,
      headless,
      openBrowser: opener(state),
      ...extra
    })
  } catch (caught) {
    error = caught
  }
  const seconds = Math.round((performance.now() - started) / 100) / 10
  const report = JSON.parse(await readFile(join(path, 'run.json'), 'utf8'))
  const ids = (await lines(join(path, 'jobs.jsonl'))).map((job: { job_id: string }) => job.job_id)
  return { report, error, ids, seconds, log: logs.slice(from), before, after: await profilesOnDisk() }
}

async function cleanBaseline() {
  if (baseline) return baseline
  const state = site((_launch, moment) =>
    moment.kind === 'next-link' && pageOf(moment.url) === LAST_PAGE ? 'sample' : undefined
  )
  const run = await breadth('baseline', state)
  expect([run.error, run.report.status, run.report.stop_reason, run.report.relaunches]).toEqual([
    null,
    'success',
    'no_next_page',
    0
  ])
  expect(documents(state)).toEqual(['1 p1', '1 p2', '1 p3', '1 p4'])
  expect(state.sockets).toEqual([])
  baseline = { ids: run.ids, seconds: run.seconds }
  console.log(`[relaunch] baseline: 1 launch, ${run.ids.length} listings, ${run.seconds}s`)
  return baseline
}

// What every run must show, crash or not: the browser stayed off the network, each launch had its own browser
// process, nothing failed to clean up, and the run left no profile behind.
function expectHealthy(state: Site, run: Awaited<ReturnType<typeof breadth>>) {
  expect(state.problems).toEqual([])
  expect(state.sockets).toEqual([])
  expect(state.served.filter((entry) => entry.how === 'aborted')).toEqual([])
  expect(state.seen.filter((url) => !state.served.some((entry) => entry.url === url))).toEqual([])
  expect(new Set(state.launches.map((launch) => launch.pid)).size).toBe(state.launches.length)
  expect(
    run.log.filter((line) => /cleanup failed|\bin use\b|lockfile|SingletonLock|ProcessSingleton/i.test(line))
  ).toEqual([])
  expect(run.after).toEqual(run.before)
}

const summary = (name: string, state: Site, run: Awaited<ReturnType<typeof breadth>>, extra = '') =>
  console.log(
    `[relaunch] ${name}: ${state.launches.length} launches, relaunches ${run.report.relaunches}, ${run.ids.length} listings` +
      ` (baseline ${baseline?.ids.length}), status ${run.report.status}/${run.report.stop_reason}, ${run.seconds}s` +
      ` (baseline ${baseline?.seconds}s); disruptions: ${state.disruptions.join('; ')}; relaunch errors: ` +
      `${JSON.stringify(run.report.relaunch_errors.map((error: string) => error.split('\n')[0]))}${extra}`
  )

browserTest(
  'a renderer crash on search page 2 before its listings are saved resumes at page 2',
  async () => {
    const { ids } = await cleanBaseline()
    expect(ids).toEqual(BASELINE)
    const state = site((launch, moment) =>
      launch === 1 && moment.kind === 'document' && pageOf(moment.url) === 2 ? 'crash' : undefined
    )
    const run = await breadth('crash-before-save', state)
    summary('renderer crash on page 2, before save', state, run)
    expect(run.error).toBeNull()
    expect([run.report.status, run.report.stop_reason, run.report.relaunches]).toEqual(['success', 'no_next_page', 1])
    expect(run.report.relaunch_errors).toHaveLength(1)
    expect(run.report.relaunch_errors[0]).toMatch(/crashed/i)
    expect(documents(state)).toEqual(['1 p1', '1 p2', '2 p2', '2 p3', '2 p4'])
    expect(run.report.pages.map((entry: { url: string }) => entry.url)).toEqual([1, 2, 3, 4].map(searchPage))
    expect(run.report.pages.map((entry: { navigation_kind: string }) => entry.navigation_kind)).toEqual([
      'goto',
      'goto',
      'click',
      'click'
    ])
    expect(run.ids).toEqual(ids)
    expect([run.report.jobs_saved, run.report.duplicates_skipped]).toEqual([ids.length, 0])
    expectHealthy(state, run)
  },
  240_000
)

browserTest(
  'a renderer crash on search page 2 after its listings are saved resumes at page 3',
  async () => {
    const { ids } = await cleanBaseline()
    const state = site((launch, moment) =>
      launch === 1 && moment.kind === 'next-link' && pageOf(moment.url) === 2 ? 'crash' : undefined
    )
    const run = await breadth('crash-after-save', state)
    summary('renderer crash on page 2, after save', state, run)
    expect(run.error).toBeNull()
    expect([run.report.status, run.report.stop_reason, run.report.relaunches]).toEqual(['success', 'no_next_page', 1])
    expect(documents(state)).toEqual(['1 p1', '1 p2', '2 p3', '2 p4'])
    expect(run.report.pages.map((entry: { navigation_kind: string }) => entry.navigation_kind)).toEqual([
      'goto',
      'click',
      'goto',
      'click'
    ])
    expect(run.ids).toEqual(ids)
    expect([run.report.jobs_saved, run.report.duplicates_skipped]).toEqual([ids.length, 0])
    expectHealthy(state, run)
  },
  180_000
)

browserTest(
  'killing the browser process on search page 2 relaunches it and resumes at page 2',
  async () => {
    const { ids } = await cleanBaseline()
    const state = site((launch, moment) =>
      launch === 1 && moment.kind === 'document' && pageOf(moment.url) === 2 ? 'kill' : undefined
    )
    const run = await breadth('killed', state)
    summary('browser killed on page 2', state, run, `; pids ${state.launches.map((launch) => launch.pid)}`)
    expect(run.error).toBeNull()
    expect([run.report.status, run.report.stop_reason, run.report.relaunches]).toEqual(['success', 'no_next_page', 1])
    expect(run.report.relaunch_errors[0]).toMatch(/closed|disconnected/i)
    expect(documents(state)).toEqual(['1 p1', '1 p2', '2 p2', '2 p3', '2 p4'])
    expect(run.ids).toEqual(ids)
    expect([run.report.jobs_saved, run.report.duplicates_skipped]).toEqual([ids.length, 0])
    expectHealthy(state, run)
  },
  180_000
)

for (const action of ['crash', 'kill'] as const)
  browserTest(
    `${action === 'crash' ? 'a renderer crash' : 'killing the browser'} while waiting for verification on search page 2 relaunches and resumes at page 2`,
    async () => {
      const { ids } = await cleanBaseline()
      // The first launch serves page 2 as a challenge that never clears; the disruption lands 3 s into the wait.
      const state = site(
        (launch, moment) =>
          launch === 1 && moment.kind === 'document' && pageOf(moment.url) === 2 ? action : undefined,
        { challenge: (launch, url) => launch === 1 && pageOf(url) === 2, disruptAfterMs: 3_000 }
      )
      const run = await breadth(`verification-${action}`, state, { verificationTimeoutMs: 60_000 })
      summary(`${action} during the verification wait on page 2`, state, run)
      expect(run.error).toBeNull()
      expect([run.report.status, run.report.stop_reason, run.report.relaunches]).toEqual(['success', 'no_next_page', 1])
      expect(run.report.relaunch_errors).toEqual([
        action === 'crash'
          ? 'Page crashed while waiting for verification'
          : 'Browser disconnected while waiting for verification'
      ])
      expect(run.log.some((line) => line.includes(`Verification required at ${searchPage(2)}`))).toBe(true)
      expect(documents(state)).toEqual(['1 p1', '1 p2', '2 p2', '2 p3', '2 p4'])
      expect(run.report.pages.map((entry: { url: string }) => entry.url)).toEqual([1, 2, 3, 4].map(searchPage))
      expect(run.ids).toEqual(ids)
      expectHealthy(state, run)
    },
    180_000
  )

browserTest(
  'a crash right after the last page is saved ends the run normally at the page past the end',
  async () => {
    const { ids } = await cleanBaseline()
    const state = site((launch, moment) =>
      launch === 1 && moment.kind === 'next-link' && pageOf(moment.url) === LAST_PAGE ? 'crash' : undefined
    )
    const run = await breadth('crash-last-page', state)
    summary('renderer crash after the last page is saved', state, run)
    expect(run.error).toBeNull()
    expect([run.report.status, run.report.stop_reason, run.report.relaunches]).toEqual(['success', 'no_next_page', 1])
    expect(documents(state)).toEqual(['1 p1', '1 p2', '1 p3', '1 p4', `2 p${LAST_PAGE + 1}`])
    expect(run.report.pages.at(-1)).toMatchObject({ url: searchPage(LAST_PAGE + 1), cards: 0, saved: 0 })
    expect(run.ids).toEqual(ids)
    expectHealthy(state, run)
  },
  180_000
)

async function depth(name: string, state: Site) {
  const input = join(workspace, `${name}-input.jsonl`)
  const listing = (id: string) => ({
    source: 'jobstreet',
    job_id: id,
    url: `https://my.jobstreet.com/job/${id}`,
    title: `Software Engineer ${id}`,
    listing_text: 'Software Engineer at Example Sdn Bhd',
    search_url: SEARCH,
    scraped_at: '2026-10-22T00:00:00Z'
  })
  await writeFile(input, `${['101', '102', '103', '104'].map((id) => JSON.stringify(listing(id))).join('\n')}\n`)
  const path = join(workspace, name)
  const before = await profilesOnDisk()
  const from = logs.length
  const started = performance.now()
  let error: unknown = null
  try {
    await scrapeJobstreetDepth({
      inputs: [input],
      output: path,
      maxJobs: 10,
      delayMs: 2000,
      delayJitterMs: 0,
      headless,
      discoverLocalCache: false,
      openBrowser: opener(state)
    })
  } catch (caught) {
    error = caught
  }
  const seconds = Math.round((performance.now() - started) / 100) / 10
  const report = JSON.parse(await readFile(join(path, 'run.json'), 'utf8'))
  const details = await lines(join(path, 'details.jsonl'))
  const enriched = await lines(join(path, 'jobs.enriched.jsonl'))
  return { report, error, details, enriched, seconds, log: logs.slice(from), before, after: await profilesOnDisk() }
}

browserTest(
  'a depth crash on a job ad keeps it as a failed attempt and carries on with the next job',
  async () => {
    const state = site((launch, moment) =>
      launch === 1 && moment.kind === 'document' && moment.url.endsWith('/job/102') ? 'crash' : undefined
    )
    const { report, error, details, enriched, seconds, log, before, after } = await depth('depth-crash', state)
    console.log(
      `[relaunch] depth crash on job 102: ${state.launches.length} launches, relaunches ${report.relaunches}, outcomes ` +
        `${details.map((detail) => `${detail.job_id}=${detail.outcome}`).join(' ')}, status ${report.status}, ${seconds}s; ` +
        `error ${JSON.stringify(details[1]?.error?.split('\n')[0])}`
    )
    expect(error).toBeNull()
    expect(state.problems).toEqual([])
    expect(state.sockets).toEqual([])
    expect(log.filter((line) => /cleanup failed/i.test(line))).toEqual([])
    expect([report.status, report.stop_reason, report.relaunches]).toEqual(['partial', 'completed', 1])
    expect([report.jobs_attempted, report.jobs_fetched, report.jobs_failed]).toEqual([4, 3, 1])
    expect(documents(state)).toEqual(['1 job 101', '1 job 102', '2 job 103', '2 job 104'])
    expect(details.map((detail) => [detail.job_id, detail.outcome])).toEqual([
      ['101', 'fetched'],
      ['102', 'failed'],
      ['103', 'fetched'],
      ['104', 'fetched']
    ])
    expect(details[1].error).toMatch(/crashed/i)
    expect(enriched.find((row) => row.job_id === '102').detail_fetch_status).toBe('failed')
    expect(details[2].description_text).toContain('job 103')
    expect(after).toEqual(before)
  },
  180_000
)

browserTest(
  'a depth browser killed on the last job ends the run partial and still deletes its temporary profile',
  async () => {
    const state = site((launch, moment) =>
      launch === 1 && moment.kind === 'document' && moment.url.endsWith('/job/104') ? 'kill' : undefined
    )
    const { report, error, details, seconds, log, before, after } = await depth('depth-kill-last', state)
    console.log(
      `[relaunch] depth browser killed on the last job: ${state.launches.length} launches, relaunches ${report.relaunches}, ` +
        `outcomes ${details.map((detail) => `${detail.job_id}=${detail.outcome}`).join(' ')}, status ${report.status}, ` +
        `${seconds}s; run error ${JSON.stringify(report.error)}; cleanup logs ${JSON.stringify(log.filter((line) => /cleanup/i.test(line)))}`
    )
    expect(state.problems).toEqual([])
    // Nothing is left to resume, so there is no relaunch; the killed job stays a failed attempt.
    expect(documents(state)).toEqual(['1 job 101', '1 job 102', '1 job 103', '1 job 104'])
    expect(details.map((detail) => detail.outcome)).toEqual(['fetched', 'fetched', 'fetched', 'failed'])
    expect(details[3].error).toMatch(/closed/i)
    expect(error).toBeNull()
    expect([report.status, report.stop_reason, report.relaunches, report.error]).toEqual([
      'partial',
      'completed',
      0,
      null
    ])
    expect(log.filter((line) => /cleanup failed/i.test(line))).toEqual([])
    expect(after).toEqual(before)
  },
  180_000
)

browserTest(
  `a page that crashes every time fails the run after ${MAX_BROWSER_RELAUNCHES} relaunches`,
  async () => {
    const state = site((_launch, moment) =>
      moment.kind === 'document' && pageOf(moment.url) === 2 ? 'crash' : undefined
    )
    const run = await breadth('crash-every-time', state)
    summary('page 2 crashes every time', state, run, `; error ${JSON.stringify(String(run.report.error))}`)
    expect(run.error).toBeInstanceOf(Error)
    expect(state.launches).toHaveLength(MAX_BROWSER_RELAUNCHES + 1)
    expect(documents(state)).toEqual(['1 p1', '1 p2', '2 p2', '3 p2', '4 p2'])
    expect([run.report.status, run.report.stop_reason, run.report.relaunches]).toEqual([
      'failed',
      'error',
      MAX_BROWSER_RELAUNCHES
    ])
    expect(run.report.relaunch_errors).toHaveLength(MAX_BROWSER_RELAUNCHES)
    expect(run.report.error).toBe((run.error as Error).message)
    expect(run.report.error).toMatch(
      new RegExp(`^The browser crashed again after ${MAX_BROWSER_RELAUNCHES} relaunches, so the run stopped: .*crashed`)
    )
    expect(run.ids).toEqual(jobIds(1))
    expect(run.report.pages.map((entry: { url: string }) => entry.url)).toEqual([searchPage(1)])
    expectHealthy(state, run)
  },
  240_000
)

browserTest(
  'a saved profile is reopened after a kill and a renderer crash without a profile lock error',
  async () => {
    const { ids } = await cleanBaseline()
    const profile = await createProfile({ name: 'jobstreet-relaunch-check' })
    savedProfile = profile.id
    const state = site((launch, moment) => {
      if (launch === 1 && moment.kind === 'document' && pageOf(moment.url) === 2) return 'kill'
      if (launch === 2 && moment.kind === 'next-link' && pageOf(moment.url) === 3) return 'crash'
      return undefined
    })
    const run = await breadth('saved-profile', state, { profileId: profile.id })
    summary('saved profile, killed on page 2 then crashed on page 3', state, run, `; profile ${profile.id}`)
    expect(run.error).toBeNull()
    expect([run.report.status, run.report.stop_reason, run.report.relaunches]).toEqual(['success', 'no_next_page', 2])
    expect(state.launches.map((launch) => launch.profileId)).toEqual([profile.id, profile.id, profile.id])
    expect(run.report.profile_id).toBe(profile.id)
    expect(new Set(state.launches.map((launch) => launch.canvas)).size).toBe(1)
    expect(documents(state)).toEqual(['1 p1', '1 p2', '2 p2', '2 p3', '3 p4'])
    expect(run.ids).toEqual(ids)
    expectHealthy(state, run)
    // The saved profile outlives the run.
    expect(existsSync(join(DEFAULT_ROOT, profile.id, 'profile.json'))).toBe(true)
    await removeProfile(profile.id)
    savedProfile = null
  },
  240_000
)

browserTest(
  'without a saved profile, a run reopens its one temporary profile after a crash and deletes it at the end',
  async () => {
    const { ids } = await cleanBaseline()
    const state = site((launch, moment) =>
      launch === 1 && moment.kind === 'document' && pageOf(moment.url) === 2 ? 'crash' : undefined
    )
    const run = await breadth('temporary-profile', state)
    const [first, second] = state.launches
    const resumed = state.served.find((entry) => entry.launch === 2)
    summary(
      'temporary profile, crashed on page 2',
      state,
      run,
      `; profiles ${state.launches.map((launch) => launch.profileId)}; canvas ${state.launches.map((launch) => launch.canvas)}` +
        `; cookies at relaunch ${JSON.stringify(second?.cookies)}; resumed request cookie ${JSON.stringify(resumed?.cookie)}`
    )
    expect(run.error).toBeNull()
    expect([run.report.status, run.report.relaunches]).toEqual(['success', 1])
    expect(state.launches).toHaveLength(2)
    // One profile for the whole run: the same identity, fingerprint and cookies after the relaunch.
    expect(second.profileId).toBe(first.profileId)
    expect(run.report.profile_id).toBe(first.profileId)
    expect(second.canvas).toBe(first.canvas)
    expect(first.cookies).toEqual([])
    expect(second.cookies).toEqual(['kotak_fixture=launch-1'])
    expect(resumed).toMatchObject({ url: searchPage(2), cookie: 'kotak_fixture=launch-1' })
    expect(run.ids).toEqual(ids)
    expectHealthy(state, run)
    // Deleted when the run ended.
    expect(existsSync(join(DEFAULT_ROOT, first.profileId))).toBe(false)
  },
  180_000
)
