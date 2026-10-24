// Checks the finished files: prints every problem and exits 1, or prints "QA passed".
// Usage: bun scripts/qa.ts out/kotak-demo.mp4 out/kotak-demo.srt out/h1.mp4
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { BANNED, SCRIPT } from '../src/data/script'
import { placeholders, shot } from '../src/lib'
import { DEMO_FRAMES } from '../src/edit'

const [demo, srt, h1] = process.argv.slice(2)
if (!demo || !srt || !h1) throw new Error('Usage: bun scripts/qa.ts <demo.mp4> <demo.srt> <h1.mp4>')
const problems: string[] = []
const run = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}: ${r.stderr.slice(-1500)}`)
  return r.stdout + r.stderr
}
const duration = (f: string) => Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim().replace(/,+$/, ''))
const video = (f: string) => run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'csv=p=0', f]).trim().replace(/,+$/, '')

for (const [file, seconds, tol] of [[demo, DEMO_FRAMES / 30, 0.1], [h1, 12, 0.1]] as const) {
  const d = duration(file)
  if (Math.abs(d - seconds) > tol) problems.push(`${file}: runs ${d.toFixed(2)} s, wants ${seconds} ± ${tol} s`)
  const v = video(file)
  if (v !== '1920,1080,30/1') problems.push(`${file}: video is ${v}, wants 1920,1080,30/1`)
}

const log = run('ffmpeg', ['-hide_banner', '-nostats', '-i', demo, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'])
const m = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1)) as { input_i: string; input_tp: string }
if (Math.abs(Number(m.input_i) + 14) > 0.7) problems.push(`${demo}: ${m.input_i} LUFS, wants -14 ± 0.7`)
if (Number(m.input_tp) > -1) problems.push(`${demo}: true peak ${m.input_tp} dBTP, wants at most -1`)

const kopi = shot('D6').audio?.text ?? ''
const text = [readFileSync(srt, 'utf8'), ...Object.values(SCRIPT), kopi].join('\n').toLowerCase()
for (const phrase of BANNED) if (text.includes(phrase)) problems.push(`Banned phrase "${phrase}" in the narration, captions or Kopi's line`)
if (/#\d+|\bpr \d+|issue \d+/i.test(text)) problems.push('An issue or pull-request number appears in the narration or captions')

const stubs = placeholders()
if (stubs.length) problems.push(`Placeholders still in the edit: ${stubs.join(', ')}`)
for (const id of ['H1', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'M1'] as const)
  if (shot(id).status === 'ok-deviation') console.log(`Note: ${id} is an ok-deviation take: ${shot(id).note ?? ''}`)

console.log(`${demo}: ${duration(demo).toFixed(2)} s, ${m.input_i} LUFS, ${m.input_tp} dBTP`)
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('QA passed')
