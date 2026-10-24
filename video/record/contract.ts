import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

// The recording contract agreed with the Director: cue ids from shots.json, cue times in ms from the take's first
// video frame, boxes in CSS px of the 1920×1080 viewport at device scale factor 1 (so 1 CSS px = 1 video px).

export type Box = { x: number; y: number; width: number; height: number }

export type Cue = {
  id: string
  tMs: number
  box: Box | null
  /** Whether a radar was on screen, and whether its "You (Self-Reported)" label was too. */
  labels: { radarOnScreen: boolean; selfReported: boolean }
}

export type Observation = { id: string; expected: string; actual: string; matches: boolean }

export type Take = {
  shot: string
  take: number
  status: 'ok' | 'ok-deviation' | 'failed'
  method: 'screencast' | 'check'
  file: string | null
  viewport: { width: number; height: number }
  durationMs: number
  fps: number
  cues: Cue[]
  /** endMs is startMs + the clip's length; playedEndMs is when the browser's own playback ended. */
  audio?: { file: string; contentType: string; bytes: number; startMs: number; endMs: number; playedEndMs: number }
  observations: Observation[]
  note?: string
}

export type Manifest = {
  runId: string
  mode: 'record' | 'check'
  commit: string
  clock: string
  browser: string
  takes: Take[]
}

type Shot = { id: string; target_s: number; cues: string[] }
type Shots = {
  clock: string
  viewport: { width: number; height: number; deviceScaleFactor: number }
  fps: number
  sample_profile: { answer_keys_in_asking_order: number[] }
  expected_numbers: Record<string, string>
  shots: Shot[]
}

export const VIDEO_ROOT = resolve(import.meta.dirname, '..')
export const APP_ROOT = resolve(VIDEO_ROOT, '..')
export const BASE_URL = process.env.KOTAK_BASE_URL ?? 'http://localhost:4310'
export const SHOTS: Shots = JSON.parse(readFileSync(join(VIDEO_ROOT, 'shots.json'), 'utf8'))
export const CLOCK = new Date(SHOTS.clock)
export const CHECK = process.env.KOTAK_RECORD_CHECK === '1'

export function shot(id: string): Shot {
  const found = SHOTS.shots.find((item) => item.id === id)
  if (!found) throw new Error(`Shot ${id} is not in shots.json`)
  return found
}

/** Run folder: public/footage/runs/<YYYYMMDD-HHMM> for takes; record/preflight/<id> for check runs. KOTAK_RECORD_DIR moves the runs, for a smoke test. */
export function runDir(): string {
  const id = process.env.KOTAK_RUN_ID
  if (!id) throw new Error('KOTAK_RUN_ID is unset; playwright.config.ts sets it')
  const runs = process.env.KOTAK_RECORD_DIR ?? (CHECK ? join(VIDEO_ROOT, 'record', 'preflight') : join(VIDEO_ROOT, 'public', 'footage', 'runs'))
  return join(runs, id)
}

export const manifestPath = () => join(runDir(), 'manifest.json')

/** The app repository's commit, read from its git files (no git command: the Kotak repo is off limits to git). */
export function appCommit(): string {
  try {
    const dotGit = join(APP_ROOT, '.git')
    const gitdir = statSync(dotGit).isDirectory()
      ? dotGit
      : resolve(APP_ROOT, /^gitdir: (.+)$/m.exec(readFileSync(dotGit, 'utf8'))![1]!.trim())
    const head = readFileSync(join(gitdir, 'HEAD'), 'utf8').trim()
    const ref = /^ref: (.+)$/.exec(head)?.[1]
    if (!ref) return head.slice(0, 7)
    // A worktree keeps its branches in the main repository's git directory.
    const common = existsSync(join(gitdir, 'commondir'))
      ? resolve(gitdir, readFileSync(join(gitdir, 'commondir'), 'utf8').trim())
      : gitdir
    if (existsSync(join(common, ref))) return readFileSync(join(common, ref), 'utf8').trim().slice(0, 7)
    const packed = readFileSync(join(common, 'packed-refs'), 'utf8')
    return new RegExp(`^([0-9a-f]{40}) ${ref}$`, 'm').exec(packed)?.[1]?.slice(0, 7) ?? ref
  } catch {
    return 'unknown'
  }
}
