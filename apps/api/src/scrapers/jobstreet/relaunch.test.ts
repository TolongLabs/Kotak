import { afterAll, beforeAll, expect, spyOn, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_ROOT, type Page } from '@kotak/browser'
import { scrapeJobstreetDepth } from './depth'
import { scrapeJobstreet } from './pipeline'
import { MAX_BROWSER_RELAUNCHES, type OpenBrowser } from './relaunch'

// Browser crashes mid-run (#264), against a fake browser that serves a few JobStreet search pages and job ads. The
// scrapers' own pauses run at their two-second minimum, so these tests take some seconds.
const SEARCH = 'https://my.jobstreet.com/software-engineer-jobs'
const searchPage = (number: number) => (number === 1 ? SEARCH : `${SEARCH}?page=${number}`)
const pageNumber = (url: string) => Number(new URL(url).searchParams.get('page') ?? '1')

type Step = 'goto' | 'click' | 'cards' | 'links'
// What the fake browser does at a step of a launch: carry on, crash the tab, or fail without crashing.
type Script = (launch: number, step: Step, target: string) => 'crash' | 'error' | undefined

function fakeJobstreet(searchPages: number, script: Script) {
  const site = { launches: 0, actions: [] as string[] }
  const open: OpenBrowser = async (_options, run, onProfile) => {
    const launch = ++site.launches
    const profileId = `fake-profile-${launch}`
    await onProfile?.(profileId)
    let url = 'about:blank'
    let crashed = false
    const alive = () => {
      if (crashed) throw new Error('Target crashed')
    }
    const act = (step: Step, target: string) => {
      site.actions.push(`${launch} ${step} ${target}`)
      alive()
      const outcome = script(launch, step, target)
      if (outcome === 'crash') {
        crashed = true
        throw new Error(`${step}: Target crashed`)
      }
      if (outcome === 'error') throw new Error(`${step}: Execution context was destroyed`)
    }
    const response = { ok: () => true, status: () => 200, headerValue: async () => null }
    const nextLink = {
      getAttribute: async (name: string) => {
        alive()
        return name === 'href' ? `/software-engineer-jobs?page=${pageNumber(url) + 1}` : null
      },
      boundingBox: async () => (alive(), { x: 10, y: 100, width: 80, height: 20 }),
      click: async () => {
        const target = searchPage(pageNumber(url) + 1)
        act('click', target)
        url = target
      }
    }
    const locator = (selector: string) => {
      if (selector === 'body')
        return {
          innerText: async () => {
            alive()
            return url.includes('/job/') ? `Engineer\nBuild services with TypeScript.` : 'Software Engineer jobs'
          }
        }
      if (selector.startsWith('meta')) return { evaluateAll: async () => (alive(), []) }
      if (selector.includes('article[data-job-id]'))
        return {
          evaluateAll: async (_extract: unknown, runId: string) => {
            act('cards', url)
            return [1, 2].map((card) => {
              const id = String(pageNumber(url) * 100 + card)
              return {
                source: 'jobstreet',
                job_id: id,
                url: `https://my.jobstreet.com/job/${id}`,
                title: 'Software Engineer',
                company: 'Example Sdn Bhd',
                location: 'Kuala Lumpur',
                salary: null,
                work_type: null,
                work_arrangement: null,
                listed_at_label: '1d ago',
                summary: null,
                listing_text: 'Software Engineer at Example Sdn Bhd',
                search_url: url,
                scraped_at: new Date().toISOString(),
                scrape_run_id: runId
              }
            })
          }
        }
      if (selector.includes('jobAdDetails'))
        return { count: async () => (alive(), 1), first: () => ({ waitFor: async () => alive() }) }
      // The Next link groups: only pages before the last have one.
      return {
        count: async () => {
          act('links', url)
          return pageNumber(url) < searchPages ? 1 : 0
        },
        nth: () => nextLink
      }
    }
    const page = {
      on: () => {},
      off: () => {},
      isClosed: () => false,
      url: () => url,
      mainFrame: () => ({}),
      bringToFront: async () => alive(),
      goto: async (target: string) => {
        act('goto', target)
        url = target
        return response
      },
      // The pagination hand reads the viewport, depth reads the ad, and the verification check finds no challenge.
      evaluate: async (pageFunction: unknown, argument?: { selector: string; id: string }) => {
        alive()
        if (String(pageFunction).includes('innerHeight')) return { height: 800 }
        if (argument?.selector)
          return {
            title: `Engineer ${argument.id}`,
            company: 'Example Sdn Bhd',
            classification: 'Engineering',
            description_text: 'Build services with TypeScript.',
            description_html: '<p>Build services with TypeScript.</p>'
          }
        return false
      },
      waitForFunction: async () => alive(),
      waitForURL: async () => alive(),
      title: async () => (alive(), 'Engineer job'),
      content: async () => (alive(), '<html></html>'),
      screenshot: async () => (alive(), Buffer.alloc(0)),
      mouse: { wheel: async () => alive() },
      locator
    }
    return run(page as unknown as Page, profileId)
  }
  return { site, open }
}

let workspace: string
let runs = 0
const output = () => join(workspace, `run-${++runs}`)
const lines = async (path: string) =>
  (await readFile(path, 'utf8'))
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
const breadth = (open: OpenBrowser, path: string) =>
  scrapeJobstreet({
    url: SEARCH,
    output: path,
    maxPages: 10,
    maxJobs: 100,
    delayMs: 2000,
    delayJitterMs: 0,
    openBrowser: open
  })

let quiet: Array<{ mockRestore: () => void }> = []

beforeAll(async () => {
  workspace = await mkdtemp(join(tmpdir(), 'kotak-relaunch-'))
  // The scrapers log every page, pause and crash; keep the test output to the results.
  quiet = (['info', 'warn', 'error'] as const).map((level) => spyOn(console, level).mockImplementation(() => {}))
})

afterAll(async () => {
  for (const spy of quiet) spy.mockRestore()
  await rm(workspace, { recursive: true, force: true })
})

test('a crash on page 2 after its listings are saved resumes at page 3 after one relaunch', async () => {
  const { site, open } = fakeJobstreet(4, (launch, step, target) =>
    launch === 1 && step === 'links' && pageNumber(target) === 2 ? 'crash' : undefined
  )
  const path = output()
  const report = await breadth(open, path)
  expect(site.actions.filter((action) => / (goto|click) /.test(action))).toEqual([
    `1 goto ${searchPage(1)}`,
    `1 click ${searchPage(2)}`,
    `2 goto ${searchPage(3)}`,
    `2 click ${searchPage(4)}`
  ])
  expect([report.status, report.stop_reason, report.relaunches, report.relaunch_errors]).toEqual([
    'success',
    'no_next_page',
    1,
    ['links: Target crashed']
  ])
  expect(report.pages.map((entry) => entry.url)).toEqual([1, 2, 3, 4].map(searchPage))
  expect(report.pages.map((entry) => entry.navigation_kind)).toEqual(['goto', 'click', 'goto', 'click'])
  const saved = (await lines(join(path, 'jobs.jsonl'))).map((job) => job.job_id)
  expect(saved).toEqual(['101', '102', '201', '202', '301', '302', '401', '402'])
  expect(report.jobs_saved).toBe(8)
  expect(JSON.parse(await readFile(join(path, 'run.json'), 'utf8')).relaunches).toBe(1)
}, 30_000)

test(`repeated crashes stop after ${MAX_BROWSER_RELAUNCHES} relaunches and end the run failed`, async () => {
  const { site, open } = fakeJobstreet(3, (_launch, step, target) =>
    (step === 'click' || step === 'goto') && pageNumber(target) === 2 ? 'crash' : undefined
  )
  const path = output()
  await expect(breadth(open, path)).rejects.toThrow('Target crashed')
  expect(site.launches).toBe(MAX_BROWSER_RELAUNCHES + 1)
  // Each relaunch reopens page 2, the first page not saved.
  expect(site.actions.filter((action) => / (goto|click) /.test(action))).toEqual([
    `1 goto ${searchPage(1)}`,
    `1 click ${searchPage(2)}`,
    `2 goto ${searchPage(2)}`,
    `3 goto ${searchPage(2)}`,
    `4 goto ${searchPage(2)}`
  ])
  const report = JSON.parse(await readFile(join(path, 'run.json'), 'utf8'))
  expect([report.status, report.stop_reason, report.relaunches, report.relaunch_errors.length]).toEqual([
    'failed',
    'error',
    MAX_BROWSER_RELAUNCHES,
    MAX_BROWSER_RELAUNCHES
  ])
  expect(report.error).toContain('Target crashed')
  expect(report.pages.map((entry: { url: string }) => entry.url)).toEqual([searchPage(1)])
  expect((await lines(join(path, 'jobs.jsonl'))).map((job) => job.job_id)).toEqual(['101', '102'])
}, 30_000)

test('an error that is not a crash ends the run without a relaunch', async () => {
  const { site, open } = fakeJobstreet(3, (_launch, step, target) =>
    step === 'cards' && pageNumber(target) === 2 ? 'error' : undefined
  )
  const path = output()
  await expect(breadth(open, path)).rejects.toThrow('Execution context was destroyed')
  expect(site.launches).toBe(1)
  const report = JSON.parse(await readFile(join(path, 'run.json'), 'utf8'))
  expect([report.status, report.relaunches, report.relaunch_errors]).toEqual(['failed', 0, []])
}, 30_000)

test('a depth crash keeps the job as a failed attempt and resumes at the next job', async () => {
  const input = join(workspace, 'breadth.jsonl')
  const listing = (id: string) => ({
    source: 'jobstreet',
    job_id: id,
    url: `https://my.jobstreet.com/job/${id}`,
    title: 'Software Engineer',
    listing_text: 'Software Engineer at Example Sdn Bhd',
    search_url: SEARCH,
    scraped_at: '2026-10-22T00:00:00Z'
  })
  await writeFile(input, ['101', '102', '103'].map((id) => JSON.stringify(listing(id))).join('\n'))
  const { site, open } = fakeJobstreet(1, (launch, step, target) =>
    launch === 1 && step === 'goto' && target.endsWith('/job/102') ? 'crash' : undefined
  )
  const path = output()
  const report = await scrapeJobstreetDepth({
    inputs: [input],
    output: path,
    maxJobs: 10,
    delayMs: 2000,
    delayJitterMs: 0,
    discoverLocalCache: false,
    openBrowser: open
  })
  expect(site.actions.filter((action) => action.includes(' goto '))).toEqual([
    '1 goto https://my.jobstreet.com/job/101',
    '1 goto https://my.jobstreet.com/job/102',
    '2 goto https://my.jobstreet.com/job/103'
  ])
  expect([report.status, report.relaunches, report.jobs_attempted, report.jobs_fetched, report.jobs_failed]).toEqual([
    'partial',
    1,
    3,
    2,
    1
  ])
  const details = await lines(join(path, 'details.jsonl'))
  expect(details.map((detail) => [detail.job_id, detail.outcome])).toEqual([
    ['101', 'fetched'],
    ['102', 'failed'],
    ['103', 'fetched']
  ])
  expect(details[1].error).toContain('Target crashed')
}, 30_000)

test('a run without a saved profile reopens one temporary profile after a crash and deletes it at the end', async () => {
  const { site, open } = fakeJobstreet(3, (launch, step, target) =>
    launch === 1 && step === 'links' && pageNumber(target) === 2 ? 'crash' : undefined
  )
  const launches: Array<{ profileId: string | undefined; onDisk: boolean }> = []
  const recording: OpenBrowser = (options, run, onProfile) => {
    launches.push({
      profileId: options.profileId,
      onDisk: !!options.profileId && existsSync(join(DEFAULT_ROOT, options.profileId, 'profile.json'))
    })
    return open(options, run, onProfile)
  }
  const report = await breadth(recording, output())
  expect([report.status, report.relaunches, site.launches]).toEqual(['success', 1, 2])
  expect(launches[0].profileId).toBeString()
  expect(launches).toEqual([
    { profileId: launches[0].profileId, onDisk: true },
    { profileId: launches[0].profileId, onDisk: true }
  ])
  expect(existsSync(join(DEFAULT_ROOT, launches[0].profileId!))).toBe(false)
}, 30_000)
