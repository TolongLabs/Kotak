import { Easing, interpolate } from 'remotion'
import footageJson from './data/footage.json'
import voiceJson from './data/demo-voice.json'
import { SCRIPT, SLOTS, TAKES, type TakeId } from './data/script'

export const FPS = 30
export const sec = (seconds: number) => Math.round(seconds * FPS)

export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1)
export const ramp = (t: number, from: number, to: number, easing = easeInOut) =>
  interpolate(t, [from, to], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

export type Box = { x: number; y: number; width: number; height: number }
export type ShotId = 'H1' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'M1'
export type Shot = {
  run: string
  take: number
  status: string
  note?: string
  placeholder?: boolean
  src: string
  width: number
  height: number
  /** The take's true length; ingest holds its last frame 4 s past it. */
  seconds: number
  cues: Record<string, { t: number; box: Box | null }>
  /** Kopi's spoken line in D6: the staged file and where it starts in the take. */
  audio?: { src: string; seconds: number; start: number; text?: string }
}
export type Word = { word: string; startMs: number; endMs: number; matched?: boolean }
export type Voice = {
  placeholder?: boolean
  src: string
  take: string
  durationMs: number
  words: Word[]
  /** Quiet stretches in the staged file, in ms: the safe places to cut it. */
  silences: [number, number][]
}

const footage = footageJson as unknown as { shots: Record<ShotId, Shot> }
const voice = voiceJson as unknown as Record<TakeId, Voice>

export const shot = (id: ShotId) => footage.shots[id]
export const voiceClip = (id: TakeId) => voice[id]
export const placeholders = () =>
  [
    ...Object.entries(footage.shots).filter(([, s]) => s.placeholder),
    ...Object.entries(voice).filter(([, v]) => v.placeholder)
  ].map(([id]) => id)

/** Source seconds of a cue in a take. Fails loudly if the take lacks it. */
export function cue(id: ShotId, cueId: string): number {
  const c = footage.shots[id].cues[cueId]
  if (!c) throw new Error(`${id} has no cue ${cueId}`)
  return c.t
}

/** The element a cue logged, in the take's own pixels. */
export function cueBox(id: ShotId, cueId: string): Box {
  const c = footage.shots[id].cues[cueId]
  if (!c?.box) throw new Error(`${id} cue ${cueId} has no box`)
  return c.box
}

/** Kopi's line in D6, in seconds; 8 s until the real take is in. */
export const kopiSeconds = () => footage.shots.D6.audio?.seconds ?? 8

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function findWord(id: TakeId, text: string, nth: number) {
  const words = voice[id].words
  const hits = words.flatMap((w, i) => (norm(w.word) === norm(text) ? [i] : []))
  const i = hits[nth - 1]
  if (i === undefined) throw new Error(`Voice ${id} has no word "${text}" (#${nth})`)
  return { words, i }
}

/** Kopi speaks inside this beat: 1 s of room before it (the step callout clears), 0.5 s after. */
export const KOPI_IN = 1.0
const KOPI_OUT = 0.5

/** The demo runs 2:45, so the whole video clears 5:00 (the slides run 2:23). Each part gets its script slot, scaled. */
export const DEMO_SECONDS = 165
export const slotOf = (id: TakeId) => (SLOTS[id] * DEMO_SECONDS) / 180
const BASE_LEADS: Record<TakeId, number> = { D1: 0.8, D2: 0.3, D3: 0.3, D4: 0.8, D5: 0.3, D6: 0.8, D7: 0.3, M1: 0.3 }
const kopiBeat = () => KOPI_IN + kopiSeconds() + KOPI_OUT

/**
 * A take that stops early: it ends in the first quiet stretch after this word. D3's read says "about a hundred
 * and seventy" ads at RM6,300, but the card on the recording day reads about 220 at RM6,800, so the read ends on
 * "tied to real hiring" and the callout carries the day's numbers.
 */
const ENDS: Partial<Record<TakeId, string>> = { D3: 'hiring' }

/** The first quiet stretch after word i (ms), or null. Whisper often starts the next word up to 0.3 s early. */
function gapAfter(id: TakeId, i: number) {
  const words = voice[id].words
  const next = words[i + 1]
  if (!next) return null
  const gaps = voice[id].silences
    .map(([a, b]) => [Math.max(a, words[i]!.endMs), Math.min(b, next.startMs + 300)] as const)
    .filter(([a, b]) => b - a >= 40)
    .sort((x, y) => x[0] - y[0])
  return gaps[0] ?? null
}

/** Where the played take stops, in source seconds. */
export function voiceEnd(id: TakeId) {
  const after = ENDS[id]
  if (!after) return voice[id].durationMs / 1000
  const { words, i } = findWord(id, after, 1)
  const gap = gapAfter(id, i)
  if (gap) return (gap[0] + Math.min(gap[1], gap[0] + 200)) / 1000
  // No stretch under -36 dB (the next word follows a breath): end 0.25 s after the word, clear of the next.
  return Math.min(words[i]!.endMs + 250, words[i + 1]!.startMs - 100) / 1000
}

const spoken = (id: TakeId) => voice[id].words.filter((w) => w.startMs / 1000 < voiceEnd(id))

/**
 * Held beats inside a take, where the voice stops so the picture can land: only D6's, after "last", where Kopi
 * speaks its own line. Each beat is cut in the first quiet stretch after its word, so no syllable is clipped.
 */
const pauseCache = new Map<TakeId, { at: number; seconds: number }[]>()
export function pauses(id: TakeId) {
  const hit = pauseCache.get(id)
  if (hit) return hit
  const fixed = id === 'D6' ? [{ i: findWord(id, 'last', 1).i, seconds: kopiBeat() }] : []
  // Short beats at sentence ends, 1.2 s where the script marks a pause and 0.9 s elsewhere, within 85% of the
  // spare picture: the read breathes while the next action plays, and never stops for long.
  const words = spoken(id)
  const tokens = SCRIPT[id].split(/\s+/)
  const points: { i: number; seconds: number }[] = []
  let k = -1
  tokens.forEach((t, j) => {
    if (t.startsWith('[') || /^[\d.]+s\]$/.test(t)) return
    k++
    const marked = tokens[j + 1] === '[pause'
    const kopi = tokens.slice(j + 1, j + 4).includes('[kopi]')
    if (k < words.length - 1 && !kopi && (marked || /[.?!]$/.test(t)) && gapAfter(id, k))
      points.push({ i: k, seconds: marked ? 1.2 : 0.9 })
  })
  const total = points.reduce((n, p) => n + p.seconds, 0)
  const scale = total > 0 ? Math.min(1, (0.85 * slack(id)) / total) : 0
  const beats = [...fixed, ...points.map((p) => ({ i: p.i, seconds: Number((p.seconds * scale).toFixed(3)) }))]
  const out = beats
    .map((b) => {
      const gap = gapAfter(id, b.i)
      if (!gap) throw new Error(`Voice ${id}: no quiet gap after "${voice[id].words[b.i]!.word}" to hold in`)
      return { at: (gap[0] + gap[1]) / 2000, seconds: b.seconds }
    })
    .sort((a, b) => a.at - b.at)
  pauseCache.set(id, out)
  return out
}

/** Played seconds into the take where the held beat after a word starts. */
export function holdAfter(id: TakeId, text: string, nth = 1) {
  const gap = gapAfter(id, findWord(id, text, nth).i)
  const ps = pauses(id)
  const k = gap ? ps.findIndex((p) => p.at === (gap[0] + gap[1]) / 2000) : -1
  if (k < 0) throw new Error(`Voice ${id} has no held beat after "${text}"`)
  return ps[k]!.at + ps.slice(0, k).reduce((n, q) => n + q.seconds, 0)
}

/** Played seconds into the take where its k-th held beat starts. */
export function holdAt(id: TakeId, k = 0) {
  const ps = pauses(id)
  const p = ps[k]
  if (!p) throw new Error(`Voice ${id} has no held beat #${k}`)
  return p.at + ps.slice(0, k).reduce((n, q) => n + q.seconds, 0)
}

/** The take's played length: its own length plus its held beats. */
export function voiceLength(id: TakeId) {
  return voiceEnd(id) + pauses(id).reduce((n, p) => n + p.seconds, 0)
}

const played = (id: TakeId, s: number) => s + pauses(id).reduce((n, p) => n + (p.at < s ? p.seconds : 0), 0)

/** Seconds into a played take (held beats included) where the nth occurrence of a word starts. */
export function word(id: TakeId, text: string, nth = 1): number {
  const { words, i } = findWord(id, text, nth)
  return played(id, words[i]!.startMs / 1000)
}

/** Seconds into a played take where the nth occurrence of a word ends. */
export function wordEnd(id: TakeId, text: string, nth = 1): number {
  const { words, i } = findWord(id, text, nth)
  return played(id, words[i]!.endMs / 1000)
}

/** Every word of a take with its played start and end (held beats included), in seconds. */
export const playedWords = (id: TakeId) =>
  spoken(id).map((w) => ({ word: w.word, start: played(id, w.startMs / 1000), end: played(id, w.endMs / 1000) }))

/** Picture the slot leaves beyond the read: it goes to a longer lead, short beats and live action. */
const slack = (id: TakeId) =>
  Math.max(0, slotOf(id) - BASE_LEADS[id] - voiceEnd(id) - (id === 'D6' ? kopiBeat() : 0) - 1.0)
/** Picture before each part's first word: act openers give their banner a moment; spare picture adds up to 1.2 s. */
export const LEADS = Object.fromEntries(
  TAKES.map((id) => [id, Number((BASE_LEADS[id] + Math.min(1.2, 0.15 * slack(id))).toFixed(3))])
) as Record<TakeId, number>
