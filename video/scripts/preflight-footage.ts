// Stand-in takes built from a preflight's cue stills: each still holds from its cue to the next, with the
// preflight's real boxes, so graphics can be checked against the real screens before recording. Entries stay
// marked `placeholder`. Usage: bun scripts/preflight-footage.ts record/preflight/<run>
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

type Take = { shot: string; status: string; durationMs: number; cues: { id: string; tMs: number; box: unknown }[] }
const dir = resolve(process.argv[2] ?? '')
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as { takes: Take[] }
const root = resolve(import.meta.dirname, '..')
const outDir = join(root, 'public/footage/preflight')
mkdirSync(outDir, { recursive: true })
const file = join(root, 'src/data/footage.json')
const footage = JSON.parse(readFileSync(file, 'utf8')) as { shots: Record<string, Record<string, unknown>> }

for (const shot of ['H1', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'M1']) {
  const take = manifest.takes.filter((t) => t.shot === shot && t.status !== 'failed').at(-1)
  if (!take) throw new Error(`${shot}: no passing take in ${dir}`)
  const cues = [...take.cues].sort((a, b) => a.tMs - b.tMs).filter((c) => existsSync(join(dir, 'stills', `${shot}-${c.id}.png`)))
  // Each still from its cue to the next; the first also covers the time before it, the last 4 s more.
  const seconds = Math.max(take.durationMs, cues.at(-1)!.tMs + 500) / 1000
  const list = cues
    .map((c, i) => {
      const end = i + 1 < cues.length ? cues[i + 1]!.tMs / 1000 : seconds + 4
      const start = i === 0 ? 0 : c.tMs / 1000
      return `file '${join(dir, 'stills', `${shot}-${c.id}.png`)}'\nduration ${Math.max(1 / 30, end - start).toFixed(3)}`
    })
    .join('\n')
  const listFile = join(outDir, `${shot}.txt`)
  writeFileSync(listFile, `${list}\nfile '${join(dir, 'stills', `${shot}-${cues.at(-1)!.id}.png`)}'\n`)
  const target = join(outDir, `${shot}.mp4`)
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-vf', 'fps=30,scale=1920:1080,format=yuv420p', '-t', (seconds + 4).toFixed(3), '-c:v', 'libx264', '-crf', '24', '-g', '10', target], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`${shot}: ffmpeg ${r.stderr.slice(-800)}`)
  const prev = footage.shots[shot] ?? {}
  footage.shots[shot] = {
    ...prev,
    placeholder: true,
    run: `preflight ${dir.split('/').at(-1)}`,
    status: take.status,
    src: `footage/preflight/${shot}.mp4`,
    width: 1920,
    height: 1080,
    seconds,
    cues: Object.fromEntries(take.cues.map((c) => [c.id, { t: c.tMs / 1000, box: c.box }]))
  }
  if (shot === 'D6') {
    const a = (take as Take & { audio?: { startMs: number; endMs: number } }).audio
    if (a) footage.shots.D6!.audio = { src: 'voice/demo/kopi.wav', seconds: (a.endMs - a.startMs) / 1000, start: a.startMs / 1000 }
  }
  console.log(`${shot}: ${cues.length} stills over ${seconds.toFixed(2)} s`)
}
writeFileSync(file, JSON.stringify(footage, null, 2) + '\n')
