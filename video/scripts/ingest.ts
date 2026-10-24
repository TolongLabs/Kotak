// Converts the Recorder's runs into edit-ready footage and writes src/data/footage.json. With several runs,
// each shot comes from the last run that recorded it as "ok" or "ok-deviation" (a partial re-record wins).
// Kopi's D6 line is levelled to the narration's loudness, staged as public/voice/demo/kopi.wav and transcribed.
// Usage: bun scripts/ingest.ts [--partial] <run directory> [<later run directory> …]
// --partial keeps the current footage.json entry (placeholder or older take) for a shot with no ok take.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { transcribe } from './whisper'

type Cue = { id: string; tMs: number; box: { x: number; y: number; width: number; height: number } | null }
type Take = {
  shot: string
  take: number
  status: 'ok' | 'ok-deviation' | 'failed'
  file: string
  durationMs: number
  cues: Cue[]
  audio?: { file: string; startMs: number; endMs: number }
  note?: string
}
type Manifest = { runId: string; commit: string; takes: Take[] }

const root = resolve(import.meta.dirname, '..')
const partial = process.argv.includes('--partial')
const runDirs = process.argv.slice(2).filter((a) => a !== '--partial').map((d) => resolve(d))
if (runDirs.length === 0) throw new Error('Usage: bun scripts/ingest.ts <run directory> [<later run directory> …]')
const runs = runDirs.map((dir) => ({ dir, manifest: JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as Manifest }))
const contract = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8')) as { shots: { id: string; cues: string[] }[] }

function run(cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}: ${r.stderr.slice(-2000)}`)
  return r.stdout + r.stderr
}
const probe = (file: string, entries: string) =>
  run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', entries, '-of', 'csv=p=0', file]).trim()
const lufs = (file: string, filter: string) => {
  const log = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', `${filter},loudnorm=print_format=json`, '-f', 'null', '-'])
  return Number((JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1)) as { input_i: string }).input_i)
}

const out = join(root, 'src/data/footage.json')
const footage: { shots: Record<string, unknown> } = { shots: {} }
const previous = (existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : { shots: {} }) as typeof footage
const problems: string[] = []

for (const { id: shot, cues: wanted } of contract.shots) {
  const found = runs
    .map((r) => ({ ...r, take: r.manifest.takes.filter((t) => t.shot === shot && t.status !== 'failed').at(-1) }))
    .filter((r) => r.take)
    .at(-1)
  if (!found?.take) {
    const kept = previous.shots[shot]
    if (partial && kept) {
      footage.shots[shot] = kept
      console.log(`${shot}: kept the current entry (no ok take)`)
    } else problems.push(`${shot}: no ok take in ${runDirs.join(', ')}`)
    continue
  }
  const { dir: runDir, manifest, take } = found
  const source = join(runDir, take.file)
  if (!existsSync(source)) throw new Error(`Missing ${source}`)
  const editDir = join(runDir, 'edit')
  mkdirSync(editDir, { recursive: true })
  const target = join(editDir, `${shot}.mp4`)
  const seconds = take.durationMs / 1000
  // Constant 30 fps, with the last frame held for 4 s past the take's end so the edit can rest on a result,
  // and a keyframe every 10 frames so the edit can seek anywhere quickly.
  // Re-encode only when the take is newer than its edit file.
  if (!existsSync(target) || statSync(target).mtimeMs < statSync(source).mtimeMs) run('ffmpeg', [
    '-v', 'error', '-y', '-fflags', '+igndts', '-i', source,
    '-vf', 'fps=30,tpad=stop_mode=clone:stop_duration=5,format=yuv420p',
    '-t', (seconds + 4).toFixed(3),
    '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-g', '10', '-an', target
  ])
  const [width, height] = probe(target, 'stream=width,height').split(',').map(Number) as [number, number]
  const cues = Object.fromEntries(take.cues.map((c) => [c.id, { t: c.tMs / 1000, box: c.box }]))
  const absent = wanted.filter((c) => !cues[c])
  // An ok-deviation take may skip a cue its note explains; an ok take may not.
  if (absent.length && take.status === 'ok') problems.push(`${shot}: take ${take.take} lacks cues ${absent.join(', ')}`)
  else if (absent.length) console.log(`${shot}: no cue ${absent.join(', ')} (ok-deviation)`)
  const entry: Record<string, unknown> = {
    run: manifest.runId,
    commit: manifest.commit,
    take: take.take,
    status: take.status,
    ...(take.note ? { note: take.note } : {}),
    src: relative(join(root, 'public'), target),
    width,
    height,
    seconds,
    cues
  }
  if (shot === 'D6') {
    if (!take.audio) problems.push('D6: the take has no Kopi audio')
    else {
      const input = join(runDir, take.audio.file)
      const staged = join(root, 'public/voice/demo/kopi.wav')
      mkdirSync(join(root, 'public/voice/demo'), { recursive: true })
      // Kopi's line plays at the narration's level (-17 LUFS mono), with the same oversampled limiter.
      const gain = -17 - lufs(input, 'anull')
      run('ffmpeg', [
        '-v', 'error', '-y', '-i', input,
        '-af', `volume=${gain.toFixed(2)}dB,aresample=192000,alimiter=limit=0.841:attack=2:release=50:level=disabled,aresample=48000`,
        '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', staged
      ])
      const length = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', staged]).trim())
      const heard = await transcribe(staged)
      entry.audio = { src: 'voice/demo/kopi.wav', seconds: length, start: take.audio.startMs / 1000, text: heard.text.trim() }
      console.log(`D6 Kopi: ${length.toFixed(2)} s at ${(take.audio.startMs / 1000).toFixed(2)} s: "${heard.text.trim()}"`)
    }
  }
  footage.shots[shot] = entry
  console.log(`${shot}: ${manifest.runId} take ${take.take} (${take.status}), ${seconds.toFixed(2)} s, ${width}×${height}${take.note ? ` · ${take.note}` : ''}`)
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
writeFileSync(out, JSON.stringify(footage, null, 2) + '\n')
console.log('Wrote src/data/footage.json')
