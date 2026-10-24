import { expect, type Locator, type Page } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CHECK,
  SHOTS,
  appCommit,
  manifestPath,
  runDir,
  shot as shotSpec,
  type Box,
  type Cue,
  type Manifest,
  type Observation,
  type Take
} from './contract'

export type CueOptions = {
  /** Seen mid-scroll by the caller at `at` (with `box`): skip the on-screen and settle checks. */
  moving?: boolean
  /** Clip the box to the viewport, for an element taller than the screen. */
  clip?: boolean
  /** Use this box instead of the element's, such as the words of a phrase. */
  box?: Box
}

export type TakeApi = {
  /** Logs a cue once its element is visible, on screen and still, and its radar label rule holds. `at` is a wall-clock time to log instead of now. */
  cue: (id: string, locator: Locator, at?: number, options?: CueOptions) => Promise<void>
  /** Marks a shots.json cue as not filmable on this build; the caller records the deviation. */
  skip: (id: string) => void
  /** A pacing hold; shortened to 100 ms in a check run. */
  hold: (ms: number) => Promise<void>
  /** Compares an on-screen value with shots.json; a difference becomes a deviation note, never a change. */
  observe: (id: string, expected: string, actual: string, matches: boolean) => void
  deviation: (note: string) => void
  /**
   * Saves Kopi's line next to the take and returns its length in ms. `startWall` is when the browser began playing
   * it; the end is start + the clip's own length, since the browser's playback clock can run slow under load.
   */
  audio: (bytes: Buffer, contentType: string, startWall: number, playedEndWall: number) => Promise<number>
}

const isMissing = (error: unknown) => error instanceof Error && 'code' in error && error.code === 'ENOENT'
const message = (error: unknown) => (error instanceof Error ? error.message.split('\n')[0]! : String(error))

async function readManifest(): Promise<Manifest | null> {
  try {
    return JSON.parse(await readFile(manifestPath(), 'utf8')) as Manifest
  } catch (error) {
    if (isMissing(error)) return null
    throw error
  }
}

async function saveTake(take: Take, browser: string): Promise<void> {
  await mkdir(runDir(), { recursive: true })
  const manifest = (await readManifest()) ?? {
    runId: process.env.KOTAK_RUN_ID!,
    mode: CHECK ? 'check' : 'record',
    commit: appCommit(),
    clock: SHOTS.clock,
    browser,
    takes: []
  }
  manifest.takes.push(take)
  const tmp = `${manifestPath()}.${process.pid}.tmp`
  await writeFile(tmp, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  await rename(tmp, manifestPath())
}

/** Next take number for a shot in this run: never overwrites an earlier take, failed or not. */
async function nextTake(shot: string): Promise<number> {
  let highest = 0
  for (const item of (await readManifest())?.takes ?? []) if (item.shot === shot) highest = Math.max(highest, item.take)
  try {
    for (const name of await readdir(join(runDir(), 'raw'))) {
      const match = new RegExp(`^${shot}-take(\\d+)\\.`).exec(name)
      if (match) highest = Math.max(highest, Number(match[1]))
    }
  } catch (error) {
    if (!isMissing(error)) throw error
  }
  return highest + 1
}

function run(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (chunk: Buffer) => (out += chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => (err = (err + chunk.toString()).slice(-2000)))
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${command} exited ${code}: ${err}`))))
  })
}

/** The encoder's own start time, which Playwright stamps on the WebM; cue times are measured from it. */
async function encoderOrigin(file: string): Promise<number> {
  const out = await run('ffprobe', ['-v', 'error', '-show_entries', 'format_tags=creation_time', '-of', 'json', file])
  const origin = Date.parse(JSON.parse(out).format?.tags?.creation_time)
  if (!Number.isFinite(origin)) throw new Error(`No encoder creation time in ${file}`)
  return origin
}

/** An audio clip's length in ms, read by ffprobe from a temporary copy (a pipe hides an MP3's length). */
async function audioLength(bytes: Buffer): Promise<number> {
  const dir = await mkdtemp(join(tmpdir(), 'kotak-audio-'))
  try {
    await writeFile(join(dir, 'clip'), bytes)
    const out = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(dir, 'clip')])
    const seconds = Number(out.trim())
    if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`ffprobe gave no length for Kopi's audio: ${out.trim()}`)
    return Math.round(seconds * 1000)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** The element's box once two reads 120 ms apart agree, so a cue is never logged mid-scroll. */
async function settledBox(page: Page, locator: Locator): Promise<Box | null> {
  let last = await locator.boundingBox()
  for (let attempt = 0; attempt < 25; attempt++) {
    await page.waitForTimeout(120)
    const next = await locator.boundingBox()
    if (
      last &&
      next &&
      Math.abs(last.x - next.x) < 0.5 &&
      Math.abs(last.y - next.y) < 0.5 &&
      Math.abs(last.width - next.width) < 0.5 &&
      Math.abs(last.height - next.height) < 0.5
    )
      return next
    last = next
  }
  throw new Error('The element kept moving for 3 s')
}

const roundBox = (box: Box): Box => ({
  x: Math.round(box.x),
  y: Math.round(box.y),
  width: Math.round(box.width),
  height: Math.round(box.height)
})

function clipToViewport(box: Box): Box {
  const x = Math.max(0, box.x)
  const y = Math.max(0, box.y)
  return roundBox({ x, y, width: Math.min(1920, box.x + box.width) - x, height: Math.min(1080, box.y + box.height) - y })
}

/** Is any radar on screen, and is a "You (Self-Reported)" label on screen with it? */
async function radarLabels(page: Page): Promise<Cue['labels']> {
  return page.evaluate(() => {
    const onScreen = (element: Element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < innerHeight &&
        rect.left < innerWidth &&
        style.visibility !== 'hidden' &&
        Number(style.opacity) > 0
      )
    }
    const radarOnScreen = [...document.querySelectorAll('.recharts-radar')].some(onScreen)
    // The legend item holds a swatch and the words, so match on the element's own text nodes.
    const ownText = (element: Element) =>
      [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join('').trim()
    const labels = [...document.querySelectorAll('body *')].filter(
      (element) => ownText(element) === 'You (Self-Reported)' && !element.closest('.sr-only')
    )
    return { radarOnScreen, selfReported: labels.some(onScreen) }
  })
}

export async function recordTake(page: Page, shot: string, action: (take: TakeApi) => Promise<void>): Promise<Take> {
  const spec = shotSpec(shot)
  const viewport = page.viewportSize() ?? { width: 1920, height: 1080 }
  const browser = `Chromium ${page.context().browser()?.version() ?? '?'} (headless)`
  const number = await nextTake(shot)
  const file = CHECK ? null : `raw/${shot}-take${number}.webm`
  const cues: Cue[] = []
  const observations: Observation[] = []
  const deviations: string[] = []
  const skipped: string[] = []
  let audio: Take['audio']
  let audioWall: { start: number; end: number } | undefined
  let failure: unknown = null
  let started = false
  let captureStart = Date.now()

  const take: TakeApi = {
    async cue(id, locator, at, options = {}) {
      if (!spec.cues.includes(id)) throw new Error(`Cue ${id} is not one of ${shot}'s cues in shots.json`)
      // A moving cue was seen by the caller mid-scroll, at `at`; by now it may have scrolled away.
      if (!options.moving) {
        await expect(locator, `cue ${id}`).toBeVisible()
        await expect(locator, `cue ${id}`).toBeInViewport()
      }
      const measured = options.moving ? (options.box ?? (await locator.boundingBox())) : await settledBox(page, locator)
      const raw = options.box ?? measured
      const box = raw && options.clip ? clipToViewport(raw) : raw && roundBox(raw)
      const labels = await radarLabels(page)
      if (labels.radarOnScreen && !labels.selfReported)
        throw new Error(`Cue ${id}: a radar is on screen without its "You (Self-Reported)" label`)
      cues.push({ id, tMs: (at ?? Date.now()) - captureStart, box, labels })
      if (CHECK) {
        await mkdir(join(runDir(), 'stills'), { recursive: true })
        await page.screenshot({ path: join(runDir(), 'stills', `${shot}-${id}.png`) })
      }
    },
    skip(id) {
      skipped.push(id)
    },
    async hold(ms) {
      await page.waitForTimeout(CHECK ? Math.min(ms, 100) : ms)
    },
    observe(id, expected, actual, matches) {
      observations.push({ id, expected, actual, matches })
      if (!matches) deviations.push(`${id}: expected "${expected}", saw "${actual}"`)
    },
    deviation(note) {
      deviations.push(note)
    },
    async audio(bytes, contentType, startWall, playedEndWall) {
      const ext = contentType.includes('mpeg') ? 'mp3' : (contentType.split('/')[1]?.split(';')[0] ?? 'bin')
      const audioFile = `audio/${shot}-kopi-take${number}.${ext}`
      if (!CHECK) {
        await mkdir(join(runDir(), 'audio'), { recursive: true })
        await writeFile(join(runDir(), audioFile), bytes)
      }
      const length = await audioLength(bytes)
      audioWall = { start: startWall, end: startWall + length }
      audio = {
        file: audioFile,
        contentType,
        bytes: bytes.length,
        startMs: startWall - captureStart,
        endMs: startWall + length - captureStart,
        playedEndMs: playedEndWall - captureStart
      }
      return length
    }
  }

  try {
    if (!CHECK) {
      await mkdir(join(runDir(), 'raw'), { recursive: true })
      let firstFrame!: () => void
      const firstFrameSeen = new Promise<void>((resolve) => (firstFrame = resolve))
      captureStart = Date.now()
      await page.screencast.start({
        path: join(runDir(), file!),
        fps: 30,
        size: { width: 1920, height: 1080 },
        onFrame: () => firstFrame()
      })
      started = true
      await page.screencast.showActions({ cursor: 'pointer', style: { title: 'display: none' } })
      await Promise.race([
        firstFrameSeen,
        new Promise((_, reject) => setTimeout(() => reject(new Error('No screencast frame within 15 s')), 15_000))
      ])
    }
    await action(take)
    const missing = spec.cues.filter((id) => !skipped.includes(id) && !cues.some((item) => item.id === id))
    if (missing.length) throw new Error(`Missing cues: ${missing.join(', ')}`)
  } catch (error) {
    failure = error
  }

  let durationMs = Date.now() - captureStart
  if (started) {
    try {
      await page.screencast.hideActions()
    } catch {
      // The page may have closed after a failure.
    }
    try {
      await page.screencast.stop()
      durationMs = Date.now() - captureStart
      const offset = captureStart - (await encoderOrigin(join(runDir(), file!)))
      for (const item of cues) item.tMs += offset
      if (audio && audioWall) {
        audio.startMs += offset
        audio.endMs += offset
        audio.playedEndMs += offset
      }
      durationMs += offset
    } catch (error) {
      failure ??= error
    }
  }
  for (const item of cues) item.tMs = Math.max(0, Math.round(item.tMs))

  const result: Take = {
    shot,
    take: number,
    status: failure ? 'failed' : deviations.length ? 'ok-deviation' : 'ok',
    method: CHECK ? 'check' : 'screencast',
    file,
    viewport,
    durationMs: Math.round(durationMs),
    fps: 30,
    cues,
    ...(audio
      ? {
          audio: {
            ...audio,
            startMs: Math.round(audio.startMs),
            endMs: Math.round(audio.endMs),
            playedEndMs: Math.round(audio.playedEndMs)
          }
        }
      : {}),
    observations,
    ...(failure || deviations.length
      ? { note: [...(failure ? [message(failure)] : []), ...deviations].join(' | ') }
      : {})
  }
  await saveTake(result, browser)
  if (failure) throw failure
  return result
}

