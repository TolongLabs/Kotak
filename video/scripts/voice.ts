// Stages the demo narration: trims each take to its speech, levels it, and times its words with Whisper.
// Usage: bun scripts/voice.ts D1=<take> D2=<take> … M1=<take> [room=<10 s of room silence>]
// The key is OPENAI_API_KEY from the environment, or from ENV_FILE (default: the repo-root .env).
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { TAKES, scriptWords, type TakeId } from '../src/data/script'
import { transcribe, type Heard } from './whisper'

const HEAD = 0.12 // seconds kept before the first word, so its attack isn't clipped
const TAIL = 0.22 // seconds kept after the last word
// -17 LUFS mono plays as -14 LUFS once Remotion puts it on both channels: YouTube's reference level.
const TARGET_LUFS = -17
const MIN_MATCH = 0.75 // share of the script's words Whisper must hear; less means a misread take
const MAX_GAP = 300 // ms: the longest pause kept between phrases

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [id, path] = arg.split('=')
    if (!id || !path) throw new Error(`Arguments are <id>=<path>, got ${arg}`)
    return [id, resolve(path)]
  })
)
const missing = TAKES.filter((id) => !args[id])
if (missing.length) throw new Error(`Missing takes: ${missing.join(' ')}. Usage: bun scripts/voice.ts D1=<take> … M1=<take> [room=<file>]`)

const root = resolve(import.meta.dirname, '..')
const outDir = join(root, 'public/voice/demo')
const whisperDir = join(root, 'src/data/whisper')
mkdirSync(outDir, { recursive: true })
mkdirSync(whisperDir, { recursive: true })


function run(cmd: string, args: string[]): string {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} exited ${r.status}: ${r.stderr.slice(-2000)}`)
  return r.stdout + r.stderr
}

const probeDuration = (file: string) =>
  Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).trim())

// Speech runs from the end of the first silence (or 0) to the start of the last silence (or the end).
// `blip` is the longest sound at the head or tail treated as noise (a breath or a click), not speech.
function speechSpan(file: string, blip: number) {
  const log = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'silencedetect=noise=-42dB:d=0.08', '-f', 'null', '-'])
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]))
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]))
  const duration = probeDuration(file)
  let onset = 0
  for (let i = 0; i < starts.length && starts[i]! <= onset + blip; i++) onset = ends[i] ?? onset
  let offset = duration
  for (let i = starts.length - 1; i >= 0 && (ends[i] ?? duration) >= offset - blip; i--) offset = starts[i]!
  if (!(offset > onset + 1)) throw new Error(`${file}: no speech found (onset ${onset}, offset ${offset})`)
  const silences = starts.map((start, i) => ({ start, end: ends[i] ?? duration }))
  return { onset, offset, duration, silences }
}

function loudness(file: string, filter: string) {
  const log = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', `${filter},loudnorm=print_format=json`, '-f', 'null', '-'])
  return JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1)) as { input_i: string; input_tp: string }
}


const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Gives each script word Whisper's times: the two word lists are aligned in order (longest common
 * subsequence); a script word Whisper heard differently takes times spread evenly between its neighbours.
 */
function align(id: TakeId, heard: Heard['words'], speechStart: number, end: number) {
  const a = scriptWords(id)
  const b = heard.map((w) => norm(w.word))
  const n = a.length
  const m = b.length
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i]![j] = norm(a[i]!) === b[j] ? L[i + 1]![j + 1]! + 1 : Math.max(L[i + 1]![j]!, L[i]![j + 1]!)
  const match = new Array<number>(n).fill(-1)
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (norm(a[i]!) === b[j]) match[i++] = j++
    else if (L[i + 1]![j]! >= L[i]![j + 1]!) i++
    else j++
  }
  const words = a.map((word, i) => {
    const j = match[i]!
    return j >= 0 ? { word, start: heard[j]!.start, end: heard[j]!.end, matched: true } : { word, start: NaN, end: NaN, matched: false }
  })
  // Spread each unmatched run between the matched words around it.
  for (let i = 0; i < n; ) {
    if (words[i]!.matched) {
      i++
      continue
    }
    let k = i
    while (k < n && !words[k]!.matched) k++
    const from = i > 0 ? words[i - 1]!.end : speechStart
    const to = k < n ? words[k]!.start : end
    const step = (to - from) / (k - i)
    for (let q = i; q < k; q++) Object.assign(words[q]!, { start: from + step * (q - i), end: from + step * (q - i + 1) })
    const said = heard
      .filter((w) => w.start >= from - 0.05 && w.end <= to + 0.05)
      .map((w) => w.word)
      .join(' ')
    console.log(`  ${id}: script "${a.slice(i, k).join(' ')}" ≠ heard "${said}"`)
    i = k
  }
  const share = match.filter((j) => j >= 0).length / n
  if (share < MIN_MATCH) throw new Error(`${id}: Whisper matched only ${(share * 100).toFixed(0)}% of the script's words`)
  // Whisper pins the first word to 0; the detected onset is more accurate.
  if (words[0]!.matched) words[0]!.start = Math.max(words[0]!.start, speechStart)
  return { share, words: words.map((w) => ({ word: w.word, startMs: Math.round(w.start * 1000), endMs: Math.round(w.end * 1000), matched: w.matched })) }
}

const roomParts: string[] = []
const gains: number[] = []
const voice: Record<string, unknown> = {}

for (const id of TAKES) {
  const input = args[id]!
  if (!existsSync(input)) throw new Error(`Missing take ${input}`)
  const { onset, offset, duration, silences } = speechSpan(input, 0.3)
  const from = Math.max(0, onset - HEAD)
  const to = Math.min(duration, offset + TAIL)
  const length = to - from
  const shape = `atrim=start=${from.toFixed(3)}:end=${to.toFixed(3)},asetpts=PTS-STARTPTS,highpass=f=70,afade=t=in:d=0.015,afade=t=out:st=${(length - 0.06).toFixed(3)}:d=0.06`
  // Every take enters the compressor at -20 LUFS, so it works the same on each.
  const preDb = -20 - Number(loudness(input, shape).input_i)
  const pre = `${shape},volume=${preDb.toFixed(2)}dB,acompressor=threshold=0.125:ratio=2:attack=5:release=100:knee=4`
  const output = join(outDir, `${id}.wav`)
  // The compressor evens the syllables, then an oversampled limiter at -1.5 dBFS catches the plosives.
  // The limiter costs a little loudness, so measure and correct the make-up gain to within 0.2 LU.
  let gainDb = TARGET_LUFS - Number(loudness(input, pre).input_i)
  for (let pass = 0; ; pass++) {
    const level = `${pre},volume=${gainDb.toFixed(2)}dB,aresample=192000,alimiter=limit=0.841:attack=2:release=50:level=disabled,aresample=48000`
    run('ffmpeg', ['-v', 'error', '-y', '-i', input, '-af', level, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', output])
    const miss = TARGET_LUFS - Number(loudness(output, 'anull').input_i)
    if (Math.abs(miss) <= 0.2) break
    if (pass === 4) throw new Error(`${id}: loudness still ${miss.toFixed(2)} LU off after 5 passes`)
    gainDb += miss
  }
  gains.push(preDb + gainDb)

  // Room tone: the silences outside the trimmed take, levelled with that take's gain.
  const outside = silences.flatMap((g) => [
    { a: g.start, b: Math.min(g.end, from) },
    { a: Math.max(g.start, to), b: g.end }
  ])
  for (const gap of args.room ? [] : outside) {
    const a = gap.a + 0.03
    const b = gap.b - 0.03
    if (b - a < 0.25) continue
    const part = join(outDir, `.room-${id}-${roomParts.length}.wav`)
    const filter = `atrim=start=${a.toFixed(3)}:end=${b.toFixed(3)},asetpts=PTS-STARTPTS,highpass=f=70,volume=${(preDb + gainDb).toFixed(2)}dB`
    run('ffmpeg', ['-v', 'error', '-y', '-i', input, '-af', filter, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', part])
    roomParts.push(part)
  }

  // Whisper's answer is cached per take, and fetched again when the source file changes.
  const cache = join(whisperDir, `${id}.json`)
  const stat = statSync(input)
  const source = { file: basename(input), size: stat.size, mtimeMs: Math.round(stat.mtimeMs) }
  const cached = existsSync(cache) ? (JSON.parse(readFileSync(cache, 'utf8')) as { source: typeof source; heard: Heard }) : null
  const fresh = cached && JSON.stringify(cached.source) === JSON.stringify(source)
  const heard = fresh ? cached.heard : await transcribe(output, scriptWords(id).join(' '))
  if (!fresh) writeFileSync(cache, JSON.stringify({ source, heard }, null, 2) + '\n')

  const durationMs = Math.round(probeDuration(output) * 1000)
  const { share, words } = align(id, heard.words, onset - from, durationMs / 1000)
  // The staged take is louder than the raw one, so its gaps sit near -45 dBFS: detect them at -36.
  const quietLog = run('ffmpeg', ['-hide_banner', '-nostats', '-i', output, '-af', 'silencedetect=noise=-36dB:d=0.06', '-f', 'null', '-'])
  const qs = [...quietLog.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]))
  const qe = [...quietLog.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]))
  const quiet = qs.map((a, k) => [Math.round(a * 1000), Math.round((qe[k] ?? a) * 1000)] as [number, number])
  // Tighten the read: every quiet stretch between words longer than MAX_GAP is cut down to MAX_GAP, its middle
  // removed, so no syllable is touched. Word times and quiet stretches shift with the cuts.
  const first = words[0]!.startMs
  const last = words.at(-1)!.endMs
  const cuts = quiet
    .filter(([a, b]) => a > first && b < last && b - a > MAX_GAP)
    .map(([a, b]) => [a + MAX_GAP / 2, b - MAX_GAP / 2] as [number, number])
  const shift = (t: number) => t - cuts.reduce((n, [a, b]) => n + Math.max(0, Math.min(t, b) - a), 0)
  if (cuts.length) {
    const tight = join(outDir, `.${id}-tight.wav`)
    const drop = cuts.map(([a, b]) => `between(t,${(a / 1000).toFixed(4)},${(b / 1000).toFixed(4)})`).join('+')
    run('ffmpeg', ['-v', 'error', '-y', '-i', output, '-af', `aselect='not(${drop})',asetpts=N/SR/TB`, '-c:a', 'pcm_s16le', tight])
    renameSync(tight, output)
  }
  const tightWords = words.map((w) => ({ ...w, startMs: Math.round(shift(w.startMs)), endMs: Math.round(shift(w.endMs)) }))
  const tightQuiet = quiet.map(([a, b]) => [Math.round(shift(a)), Math.round(shift(b))] as [number, number])
  const tightMs = Math.round(probeDuration(output) * 1000)
  voice[id] = { src: `voice/demo/${id}.wav`, take: source.file, sourceFrom: Number(from.toFixed(3)), cutsMs: cuts, durationMs: tightMs, gainDb: Number(gainDb.toFixed(2)), heard: heard.text, words: tightWords, silences: tightQuiet }
  const check = loudness(output, 'anull')
  console.log(
    `${id} (${source.file}): ${length.toFixed(2)} s → ${(tightMs / 1000).toFixed(2)} s tight, ${(share * 100).toFixed(0)}% matched, ${check.input_i} LUFS, ${check.input_tp} dBTP`
  )
}

const room = join(outDir, 'room.wav')
if (args.room) {
  // The narrator's own room silence, levelled with the takes' average gain.
  const gain = gains.reduce((a, b) => a + b, 0) / gains.length
  run('ffmpeg', ['-v', 'error', '-y', '-i', args.room, '-af', `highpass=f=70,volume=${gain.toFixed(2)}dB`, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', room])
} else {
  if (roomParts.length < 4) throw new Error(`Only ${roomParts.length} room-tone stretches found; pass room=<file>`)
  const inputs = roomParts.flatMap((p) => ['-i', p])
  let chain = '[0]'
  const steps: string[] = []
  for (let i = 1; i < roomParts.length; i++) {
    const out = i === roomParts.length - 1 ? '[room]' : `[r${i}]`
    steps.push(`${chain}[${i}]acrossfade=d=0.08${out}`)
    chain = out
  }
  run('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', steps.join(';'), '-map', '[room]', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', room])
  for (const p of roomParts) rmSync(p)
}
console.log(`room tone: ${probeDuration(room).toFixed(2)} s, ${loudness(room, 'anull').input_i} LUFS`)

writeFileSync(join(root, 'src/data/demo-voice.json'), JSON.stringify(voice, null, 2) + '\n')
console.log('Wrote src/data/demo-voice.json. Check every "≠" line above against the claims ledger.')
