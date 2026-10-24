import { expect, test, type Locator, type Page } from '@playwright/test'
import { CHECK, SHOTS, type Box } from './contract'
import {
  answerButton,
  goal,
  jobField,
  jobOption,
  onClock,
  questionCard,
  questionCounter,
  seedFinished,
  situation,
  startQuestions,
  url
} from './flows'
import { recordTake, type TakeApi } from './take'

const EXPECTED = SHOTS.expected_numbers
const INSPECTOR = process.env.KOTAK_INSPECTOR_URL ?? 'http://127.0.0.1:6274/'
const clean = (text: string) => text.replace(/\s+/g, ' ').trim()

// ---- Camera moves -------------------------------------------------------------------------------------------------

type Mark = { wall: number; box: Box } | null

/**
 * Scrolls the page (or `scroller`) to `top` with an eased requestAnimationFrame glide, as a trackpad would. With
 * `watch`, it also returns the wall-clock time and box of the first frame where that element sat fully in view.
 */
async function glideTo(page: Page, top: number, ms: number, scroller?: Locator, watch?: string): Promise<Mark> {
  const result = await (scroller ?? page.locator('html')).evaluate(
    async (element, args) => {
      const target = element === document.documentElement ? document.scrollingElement! : element
      const watched = args.watch ? document.querySelector(args.watch) : null
      type Seen = { at: number; box: { x: number; y: number; width: number; height: number } }
      let mark = null as Seen | null
      const from = target.scrollTop
      const to = Math.max(0, Math.min(target.scrollHeight - target.clientHeight, args.top))
      const start = performance.now()
      await new Promise<void>((done) => {
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / args.duration)
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
          target.scrollTo({ top: from + (to - from) * eased, behavior: 'instant' })
          if (watched && !mark) {
            const rect = watched.getBoundingClientRect()
            if (rect.top >= 90 && rect.bottom <= innerHeight)
              mark = { at: performance.now(), box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }
          }
          if (t < 1) requestAnimationFrame(step)
          else done()
        }
        requestAnimationFrame(step)
      })
      return { mark: mark as Seen | null, end: performance.now() }
    },
    { top, duration: CHECK ? 150 : ms, watch: watch ?? null }
  )
  const now = Date.now()
  if (!result.mark) return null
  const box = result.mark.box
  return {
    wall: Math.round(now - (result.end - result.mark.at)),
    box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
  }
}

/** Glides so the element's top sits `offset` px below the viewport top (under the sticky header), or centres it. */
async function glideToElement(page: Page, target: Locator, ms: number, offset: number | 'center' = 140): Promise<void> {
  const { top, height, scrollY } = await target.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return { top: rect.top, height: rect.height, scrollY: document.scrollingElement!.scrollTop }
  })
  const y = offset === 'center' ? scrollY + top + height / 2 - 540 : scrollY + top - offset
  await glideTo(page, y, ms)
}

/** The union of several elements' boxes, clipped to the viewport unless `raw`. */
async function unionBox(locators: Locator[], raw = false): Promise<Box> {
  const boxes = (await Promise.all(locators.map((item) => item.boundingBox()))).filter((item) => item !== null)
  if (!boxes.length) throw new Error('No boxes to join')
  const union = {
    x: Math.min(...boxes.map((b) => b.x)),
    y: Math.min(...boxes.map((b) => b.y)),
    width: Math.max(...boxes.map((b) => b.x + b.width)) - Math.min(...boxes.map((b) => b.x)),
    height: Math.max(...boxes.map((b) => b.y + b.height)) - Math.min(...boxes.map((b) => b.y))
  }
  return raw ? union : clip(union)
}

function clip(box: Box, within: Box = { x: 0, y: 0, width: 1920, height: 1080 }): Box {
  const x = Math.max(box.x, within.x)
  const y = Math.max(box.y, within.y)
  const right = Math.min(box.x + box.width, within.x + within.width)
  const bottom = Math.min(box.y + box.height, within.y + within.height)
  return { x: Math.round(x), y: Math.round(y), width: Math.round(right - x), height: Math.round(bottom - y) }
}

/** The on-screen box of the words `phrase` inside `container` (a text range, so just the words). */
async function wordsBox(container: Locator, phrase: string): Promise<Box | null> {
  return container.evaluate((element, needle) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const index = node.textContent?.toLowerCase().indexOf(needle.toLowerCase()) ?? -1
      if (index < 0) continue
      const range = document.createRange()
      range.setStart(node, index)
      range.setEnd(node, index + needle.length)
      const rect = range.getBoundingClientRect()
      return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
    }
    return null
  }, phrase)
}

/** Parks the pointer off the content, so no hover state shows at the start of a take. */
const park = (page: Page) => page.mouse.move(1900, 1060)

// ---- Shot setup ---------------------------------------------------------------------------------------------------

async function seededPage(page: Page, path: string, changes: Record<string, unknown> = {}): Promise<void> {
  await onClock(page)
  await seedFinished(page.context(), changes)
  await page.goto(url(path))
}

async function waitForKopi(page: Page): Promise<void> {
  // Kopi types its line word by word; wait until the last word shows.
  await page.waitForFunction(() => {
    const live = [...document.querySelectorAll('p[aria-live="polite"]')].find((p) => p.querySelector('span'))
    return !live || ![...live.querySelectorAll('span')].some((span) => span.classList.contains('opacity-0'))
  })
}

const roadmapTitle = (page: Page) => page.getByRole('heading', { level: 1, name: /^Your \d+-Week Roadmap$/ })
const readinessLine = (page: Page) =>
  page.locator('section[aria-labelledby="readiness-title"]').getByText(/^\d+% Fit by Week \d+ · \d+%$/)
const funding = (page: Page) => page.locator('section[aria-labelledby="employer-funding-title"]')

async function roadmapReady(page: Page, take?: TakeApi): Promise<void> {
  await expect(roadmapTitle(page)).toBeVisible()
  await expect(page.getByRole('slider', { name: 'Hours Per Week' })).toHaveValue('10')
  await expect(page.getByText('Starts Mon 2 Nov 2026')).toBeVisible()
  if (take) {
    const title = clean(await roadmapTitle(page).innerText())
    take.observe('roadmap_title', EXPECTED.roadmap_title!, title, title === EXPECTED.roadmap_title)
    const line = clean(await readinessLine(page).innerText())
    take.observe('readiness', EXPECTED.readiness!, line, line === EXPECTED.readiness)
    const table = clean(await page.locator('section[aria-labelledby="readiness-title"]').innerText())
    const start = /\b0\s+2 Nov 2026\s+(\d+%)/.exec(table)?.[1] ?? '(none)'
    take.observe('fit_start', EXPECTED.fit_start!, start, start === EXPECTED.fit_start)
  }
}

// ---- Shots --------------------------------------------------------------------------------------------------------

test('H1 @H1 roadmap at rest', async ({ page }) => {
  await seededPage(page, '/app/roadmap')
  await roadmapReady(page)
  await waitForKopi(page)
  await park(page)
  await recordTake(page, 'H1', async (take) => {
    await roadmapReady(page, take)
    await take.hold(1200)
    await take.cue('roadmap-title', roadmapTitle(page))
    await take.cue('readiness', readinessLine(page))
    await take.hold(2500)
    // One slow continuous scroll to the funding card; the timeline cue is the first frame it sits fully in view.
    const timeline = page.locator('section[aria-labelledby="timeline-title"]')
    const target = await funding(page).evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return document.scrollingElement!.scrollTop + rect.top - 120
    })
    const mark = await glideTo(page, target, 9000, undefined, 'section[aria-labelledby="timeline-title"]')
    if (!mark) throw new Error('The timeline never sat fully in view during the scroll')
    await take.cue('timeline', timeline, mark.wall, { moving: true, box: mark.box })
    await take.cue('funding-card', funding(page))
    await take.hold(3000)
  })
})

test('D1 @D1 check-up start', async ({ page }) => {
  await onClock(page)
  await page.goto(url('/'))
  await page.getByRole('link', { name: 'Start', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Tell Kopi About You' })).toBeVisible()
  await waitForKopi(page)
  await park(page)
  await recordTake(page, 'D1', async (take) => {
    await take.hold(1200)
    await situation(page).click()
    await expect(situation(page).getByRole('radio')).toBeChecked()
    await take.cue('status-picked', situation(page))
    await take.hold(1200)
    await glideToElement(page, page.locator('section[aria-labelledby="work-heading"]'), 900, 'center')
    await jobField(page).click()
    await jobField(page).pressSequentially('web developer', { delay: CHECK ? 0 : 90 })
    await expect(jobOption(page)).toBeVisible()
    await take.cue('job-typed', jobField(page))
    await take.hold(1000)
    await jobOption(page).click()
    await expect(jobField(page)).toHaveValue(/Web Developers/)
    await take.cue('job-picked', jobField(page))
    await take.hold(1200)
    await glideToElement(page, page.locator('section[aria-labelledby="goal-heading"]'), 900, 'center')
    await goal(page).click()
    await expect(goal(page).getByRole('radio')).toBeChecked()
    await take.cue('goal-picked', goal(page))
    await take.hold(1200)
    await glideToElement(page, startQuestions(page), 700, 'center')
    await startQuestions(page).click()
    await take.cue('continue', questionCard(page))
    await expect(questionCounter(page, 1)).toBeVisible()
    await take.hold(2500)
  })
})

test('D2 @D2 full check-up', async ({ page }) => {
  await onClock(page)
  await page.goto(url('/app/check-up'))
  await situation(page).click()
  await jobField(page).fill('web developer')
  await jobOption(page).click()
  await goal(page).click()
  await startQuestions(page).click()
  await expect(questionCounter(page, 1)).toBeVisible()
  await waitForKopi(page)
  await park(page)
  await recordTake(page, 'D2', async (take) => {
    await take.hold(1200)
    // All twelve answers on camera at one pace (the edit fast-forwards 4 to 12), then through to the radar.
    for (let n = 1; n <= 12; n++) {
      await expect(questionCounter(page, n)).toBeVisible()
      await waitForKopi(page)
      if (n <= 3) await take.cue(`q${n}-shown`, questionCard(page))
      await take.hold(3000)
      const key = SHOTS.sample_profile.answer_keys_in_asking_order[n - 1]!
      await page.keyboard.press(String(key))
      await expect(answerButton(page, key)).toHaveAttribute('aria-pressed', 'true')
      const pressedAt = Date.now()
      if (n <= 3 || n === 12) await take.cue(`q${n}-answered`, answerButton(page, key).locator('xpath=..'), pressedAt)
      if (n < 12) await expect(questionCounter(page, n + 1)).toBeVisible()
    }
    await page.waitForURL('**/app/radar', { timeout: 60_000 })
    await expect(page.getByText('Step 3 of 5 · Radar', { exact: true })).toBeVisible()
    const radar = page.locator('.recharts-wrapper').filter({ has: page.locator('.recharts-radar') }).first()
    await expect(radar).toBeVisible()
    await waitForKopi(page)
    await take.cue('radar-shown', radar)
    await take.hold(2000)
  })
})

test('D3 @D3 radar and gaps', async ({ page }) => {
  await seededPage(page, '/app/radar')
  const radar = page.locator('.recharts-wrapper').filter({ has: page.locator('.recharts-radar') }).first()
  await expect(radar).toBeVisible()
  await waitForKopi(page)
  await park(page)
  await recordTake(page, 'D3', async (take) => {
    await take.hold(1200)
    await take.cue('radar-visible', radar)
    const legend = page.getByRole('list', { name: 'Radar chart legend' }).first()
    await take.cue('self-reported-label', legend.getByText('You (Self-Reported)', { exact: true }))
    await take.cue('needed-by-line', legend.getByText(/^Needed by [A-Z][a-z]+ \d{4}$/))
    await take.hold(4000)

    const gaps = page.locator('section[aria-labelledby="gaps-title"]')
    const documentation = gaps
      .locator('article, li, div')
      .filter({ has: page.getByText('Technical documentation', { exact: true }) })
      .filter({ has: page.getByText('Rising', { exact: true }) })
      .last()
    await glideToElement(page, documentation, 2200)
    await take.cue('chip-rising', documentation.getByText('Rising', { exact: true }).first())
    const siteBuilding = await gaps.getByText('Web site building', { exact: true }).count()
    take.deviation(
      siteBuilding
        ? 'chip-declining: Web site building shows in Your Gaps, but without a Declining chip'
        : 'chip-declining: no Web site building card on the Radar page in May 2026 (Your Gaps lists 5 of 6 skills; Web site building is not a gap), so no Declining chip to film'
    )
    take.skip('chip-declining')
    await take.hold(4000)

    const ads = page.locator('section[aria-labelledby^="job-ads"]').first()
    await glideToElement(page, ads, 2500, 110)
    await take.cue('job-ads-card', ads, undefined, { clip: true })
    const payRow = ads.locator('div').filter({ has: page.getByText('Median Advertised Pay, All Levels', { exact: true }) }).last()
    await take.cue('pay-row', payRow)
    const adsText = clean(await ads.innerText())
    const estimate = /Ads on JobStreet About (\d[\d,]*\d|\d)/.exec(adsText)?.[1] ?? '(none)'
    const median = /Median Advertised Pay, All Levels (RM \d[\d,]*\d) a month/.exec(adsText)?.[1] ?? '(none)'
    const active = /Active Ads (\d[\d,]*\d|\d)/.exec(adsText)?.[1] ?? '(none)'
    take.observe(
      'job_ads',
      EXPECTED.job_ads!,
      `about ${estimate} on JobStreet (${active} active ads); all-levels median ${median}/month`,
      estimate === '170' && median === 'RM 6,300'
    )
    await take.hold(3000)
  })
})

test('D4 @D4 roles that fit', async ({ page }) => {
  await seededPage(page, '/app/roles')
  const roles = page.getByRole('radiogroup', { name: /Your Job.s Future/ })
  await expect(roles).toBeVisible()
  await waitForKopi(page)
  await park(page)
  await recordTake(page, 'D4', async (take) => {
    await take.hold(1200)
    await take.cue('roles-list', roles)
    const cards = clean(await roles.innerText())
    const expected = /^Web Developers \(Your Job\) 47% fit .*Document Management Specialists 51% est\. fit .*Computer Network Architects 50% est\. fit/
    take.observe('roles_cards', EXPECTED.roles_cards!, cards.slice(0, 400), expected.test(cards))
    await take.hold(2500)
    const highlighted = roles.locator('label').filter({ has: page.locator('input:checked') })
    await take.cue('highlight-card', highlighted)
    const picked = clean(await highlighted.innerText()).replace(/^Picked for you:[^.]*\.\s*/, '')
    take.deviation(`highlight-card: the highlighted card is ${/^(.+?) \d+%/.exec(picked)?.[1] ?? picked.slice(0, 60)}`)
    await take.hold(3000)
    const maths = page.getByRole('button', { name: 'See the Maths' }).last()
    await glideToElement(page, maths, 1500, 'center')
    await take.cue('maths-button', maths)
    await take.hold(1200)
    await maths.click()
    await expect(maths).toHaveAttribute('aria-expanded', 'true')
    // Glide the formula line to the middle of the screen; maths-open frames just that line.
    const panel = page.locator(`#${await maths.getAttribute('aria-controls')}`)
    const formula = panel.getByText(/^Fit = sum of min\(your level, needed level\)/)
    await expect(formula).toBeVisible()
    await take.hold(800)
    await glideToElement(page, formula, 1500, 'center')
    await take.cue('maths-open', formula)
    await take.hold(3000)
  })
})

test('D5 @D5 roadmap', async ({ page }) => {
  await seededPage(page, '/app/roadmap')
  await roadmapReady(page)
  await waitForKopi(page)
  await park(page)
  await recordTake(page, 'D5', async (take) => {
    await roadmapReady(page, take)
    await take.hold(1200)
    await take.cue('roadmap-title', roadmapTitle(page))
    await take.cue('readiness', readinessLine(page))
    await take.hold(3500)
    const steps = page.locator('section[aria-labelledby="step-details-title"]')
    await glideToElement(page, steps, 2500, 110)
    await take.cue('step-list', steps, undefined, { clip: true })
    await take.hold(2000)
    const first = steps.locator('article').first()
    await take.cue('step-1', first.getByText(/^\d+ h a Week$/))
    await take.hold(1500)
    await take.cue('free-link', first.getByRole('link').first())
    await take.hold(2500)
    const box = page.getByRole('checkbox', { name: /^Mark .+ Complete$/ }).first()
    const skill = /^Mark (.+) Complete$/.exec((await box.getAttribute('aria-label')) ?? '')?.[1] ?? '?'
    await box.click()
    const done = page.getByRole('checkbox', { name: `Mark ${skill} Incomplete` })
    await expect(done).toBeChecked()
    await take.cue('tick', done)
    take.deviation(
      'level-rise: ticking step 1 turns its number into a green check and its timeline bar green; no level or fit figure changes on screen'
    )
    take.skip('level-rise')
    await take.hold(2500)
    await take.cue('funding-card', funding(page))
    await take.hold(3000)
  })
  // Off camera: untick, so the session is as it was.
  await page.getByRole('checkbox', { name: /^Mark .+ Incomplete$/ }).first().click()
})

test('D6 @D6 what changed', async ({ page }) => {
  const events: { type: string; clip: number; wall: number }[] = []
  const tts: { text: string; contentType: string; audio: string; wall: number }[] = []
  // Each clip Kopi plays gets a number, so the April line's pause is never taken for the May line's end.
  await page.exposeBinding('__recorderAudio', (_source, type: string, clip: number) => {
    events.push({ type, clip, wall: Date.now() })
  })
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play
    let clips = 0
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      const report = (window as unknown as { __recorderAudio: (type: string, clip: number) => void }).__recorderAudio
      const clip = ++clips
      this.addEventListener('playing', () => report('playing', clip), { once: true })
      this.addEventListener('ended', () => report('ended', clip), { once: true })
      // A clip that plays to its end fires pause just before ended; report that pause as the end.
      this.addEventListener('pause', () => report(this.ended ? 'ended' : 'pause', clip), { once: true })
      return play.call(this)
    }
  })
  page.on('response', async (response) => {
    if (!response.url().endsWith('/api/tts') || response.request().method() !== 'POST' || !response.ok()) return
    const body = (await response.json()) as { content_type: string; audio_base64: string }
    const text = (JSON.parse(response.request().postData() ?? '{}') as { text?: string }).text ?? ''
    tts.push({ text, contentType: body.content_type, audio: body.audio_base64, wall: Date.now() })
  })

  await seededPage(page, '/app/changes')
  const april = page.getByRole('button', { name: 'Before (April)' })
  const may = page.getByRole('button', { name: 'After (May)' })
  await april.click()
  await expect(page.getByText('April 2026 data is active across Kotak.')).toBeVisible()
  // Let Kopi's April line finish before the take starts.
  await expect.poll(() => events.some((item) => item.type === 'ended' || item.type === 'pause'), { timeout: 30_000 }).toBe(true)
  await page.waitForTimeout(500)
  await waitForKopi(page)
  await glideTo(page, 0, 100)
  await park(page)

  const selector = page.getByRole('group', { name: 'Choose the active snapshot' })
  const cards = page.locator('section[aria-labelledby="changes-title"] > div')
  const bubble = page.locator('p[aria-live="polite"]').filter({ has: page.locator('span') }).first().locator('xpath=..')
  const card = (skill: string) => cards.locator(':scope > *').filter({ has: page.getByRole('heading', { name: skill, exact: true }) })

  await recordTake(page, 'D6', async (take) => {
    await take.hold(1200)
    await expect(april).toHaveAttribute('aria-pressed', 'true')
    await take.cue('april-selector', selector)
    await take.cue('april-state', cards, undefined, { clip: true })
    await take.hold(3000)

    const clipsBefore = Math.max(0, ...events.map((item) => item.clip))
    await may.click()
    await expect(may).toHaveAttribute('aria-pressed', 'true')
    await take.cue('may-loaded', selector)
    const status = page.getByText('New data landed: May 2026 is active across Kotak.', { exact: true })
    await take.cue('new-data-banner', status)
    const speech = clean(await bubble.innerText())
    take.observe('what_changed', EXPECTED.what_changed!, speech, speech.includes('New data landed. Six skills changed, and your roadmap moved with them.'))
    await expect.poll(() => events.some((item) => item.type === 'playing' && item.clip > clipsBefore), { timeout: 30_000 }).toBe(true)
    const started = events.find((item) => item.type === 'playing' && item.clip > clipsBefore)!
    const line = tts.find((item) => item.text.startsWith('New data landed'))
    if (!line) throw new Error("No /api/tts audio for Kopi's May line")
    await take.cue('kopi-voice-start', bubble, started.wall)
    const stop = () => events.find((item) => item.clip === started.clip && (item.type === 'ended' || item.type === 'pause'))
    await expect.poll(() => Boolean(stop()), { timeout: 60_000 }).toBe(true)
    const ended = stop()!
    if (ended.type !== 'ended') take.deviation("Kopi's May line stopped before its end")
    const length = await take.audio(Buffer.from(line.audio, 'base64'), line.contentType, started.wall, ended.wall)
    await take.cue('kopi-voice-end', bubble, started.wall + length)
    await take.hold(1500)
    await take.cue('verdict-flip', cards, undefined, { clip: true })
    const unknown = await cards.locator(':scope > *').filter({ hasText: 'Unknown' }).count()
    take.observe('verdict_flips', '6 verdicts flip from Unknown in April', `${unknown} cards read Unknown › <May verdict>`, unknown === 6)

    const step4 = card('Web performance and support').getByText(/moved to step 4\./)
    const step5 = card('Web design and databases').getByText(/moved to step 5\./)
    const both = await unionBox([step4, step5], true)
    const scrollY = await page.evaluate(() => document.scrollingElement!.scrollTop)
    await glideTo(page, scrollY + both.y + both.height / 2 - 588, 2200)
    await take.cue('ranking-reorder', step4, undefined, { box: await unionBox([step4, step5]) })
    await take.hold(2000)

    const step6 = card('Web site building').getByText(/moved to step 6\./)
    take.observe(
      'web_site_building_step',
      'Web site building moves from step 4 to step 6 (last)',
      clean(await card('Web site building').innerText()).match(/The roadmap position moved from \d+ in April to \d+ in May/)?.[0] ?? '(none)',
      /moved from 4 in April to 6 in May/.test(await card('Web site building').innerText())
    )
    await glideTo(page, 0, 2200)
    await take.cue('step-moved', step6)
    await take.hold(3000)
  })
})

const D7_TAKES = CHECK ? [1] : [1, 2, 3]
for (const attempt of D7_TAKES) {
  test(`D7 @D7 ask Kopi, live reply ${attempt}`, async ({ page }) => {
    await seededPage(page, '/app/radar')
    await expect(page.getByText('You (Self-Reported)', { exact: true }).first()).toBeVisible()
    await waitForKopi(page)
    await park(page)
    await recordTake(page, 'D7', async (take) => {
      await take.hold(1200)
      await page.getByRole('button', { name: 'Ask Kopi' }).click()
      const dialog = page.getByRole('dialog', { name: 'Ask Kopi' })
      await expect(dialog).toBeVisible()
      const field = dialog.getByRole('textbox', { name: 'Your Question' })
      await field.click()
      await field.pressSequentially('Which rising skills do web developers lack most?', { delay: CHECK ? 0 : 55 })
      await take.hold(600)
      await field.press('Enter')
      await take.cue('question-sent', dialog.locator('[data-question]').last())
      const tools = dialog.getByText('Tools Kopi Ran', { exact: true }).last()
      await expect(tools).toBeAttached({ timeout: 90_000 })
      const reply = tools.locator('xpath=ancestor::div[contains(@class,"rounded-md")][1]')
      const log = dialog.locator('[data-question]').last().locator('xpath=ancestor::*[@class and contains(@class,"overflow-y-auto")][1]')
      const logBox = (await log.boundingBox()) ?? { x: 0, y: 0, width: 1920, height: 1080 }
      await take.hold(1200)
      await take.cue('answer-done', reply, undefined, { box: clip((await reply.boundingBox())!, logBox) })
      const text = clean(await reply.innerText())
      const sample = /sample data/i.test(text)
      take.observe('sample_data_words', 'Kopi calls the national rows "sample data"', text.slice(0, 300), sample)
      const nationalTool = dialog.getByText(/^National Skill Gaps/).last()
      // Down to the tools Kopi ran, then back up to the words "sample data".
      const toTools = await nationalTool.evaluate((element) => {
        const scroller = element.closest('.overflow-y-auto')!
        return scroller.scrollTop + element.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 120
      })
      await glideTo(page, toTools, 1500, log)
      await take.cue('tool-shown', nationalTool)
      await take.hold(2500)
      if (sample) {
        const words = reply.getByText(/sample data/i).first()
        const toWords = await words.evaluate((element) => {
          const scroller = element.closest('.overflow-y-auto')!
          return scroller.scrollTop + element.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 160
        })
        await glideTo(page, toWords, 1500, log)
        await take.cue('sample-data-words', words, undefined, { box: (await wordsBox(words, 'sample data'))! })
      } else {
        take.skip('sample-data-words')
      }
      await take.hold(3500)
    })
  })
}

test('M1 @M1 connect your AI, then the MCP Inspector', async ({ page }) => {
  await seededPage(page, '/app/connect')
  const address = page.locator('section[aria-labelledby="mcp-url-title"]').getByText(/^http:\/\/localhost:4310\/api\/mcp$/)
  await expect(address).toBeVisible()
  await waitForKopi(page)
  await park(page)
  await recordTake(page, 'M1', async (take) => {
    await take.hold(1200)
    await take.cue('mcp-address', address)
    await take.hold(2500)
    await page.goto(INSPECTOR)
    await page.getByRole('switch', { name: /Connect or disconnect/ }).click({ force: true })
    await expect(page.getByText(/^Connected/).first()).toBeVisible()
    await take.hold(1000)
    await page.getByText('Tools', { exact: true }).first().click()
    const screen = page.locator('[data-testid="tools-screen"]')
    await expect(screen).toHaveAttribute('data-tool-count', '8')
    const list = page.getByText(/^Tools \(\d+\)$/).locator('xpath=ancestor::*[contains(@class,"mantine-Paper") or contains(@class,"Card")][1]')
    await take.cue('tools-listed', (await list.count()) ? list.first() : page.getByText(/^Tools \(\d+\)$/))
    await take.hold(2000)
    await page.getByRole('button', { name: /get_checkup_questions/ }).click()
    const roleCode = page.getByRole('textbox').filter({ visible: true }).nth(1)
    await roleCode.click()
    await roleCode.pressSequentially('15-1254.00', { delay: CHECK ? 0 : 90 })
    await take.hold(800)
    await page.getByRole('button', { name: 'Execute Tool' }).click()
    await expect(screen).toHaveAttribute('data-call-status', 'ok', { timeout: 30_000 })
    const output = page.locator('[data-testid="structured-output"]')
    const results = page.getByRole('heading', { name: 'Results', level: 3 })
    await take.cue('tool-called', results)
    await take.hold(1200)
    await output.scrollIntoViewIfNeeded()
    await take.cue('verdicts-shown', output, undefined, { clip: true })
    const verdicts = clean(await output.innerText())
    const pairs = [...verdicts.matchAll(/"name":\s*"([^"]+)",\s*"verdict":\s*"([A-Za-z]+)"/g)].map((m) => `${m[1]}: ${m[2]}`)
    take.observe(
      'mcp_verdicts',
      'Technical documentation: Rising; Web specifications and standards: Rising; Web site building: Declining; other three: Steady',
      pairs.join('; ') || verdicts.slice(0, 200),
      pairs.includes('Technical documentation: Rising') && pairs.includes('Web site building: Declining')
    )
    await take.hold(3500)
  })
})
