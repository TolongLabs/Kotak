// Stand-in takes and voice so the edit can be built before the real ones exist. Every entry is marked
// `placeholder`, and the finish script refuses to run while any remains. Real voice and footage overwrite them.
// Usage: bun scripts/placeholders.ts [voice] [footage]   (both when no argument)
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { SCRIPT, TAKES } from '../src/data/script'

const root = resolve(import.meta.dirname, '..')
const want = process.argv.slice(2)
const doVoice = want.length === 0 || want.includes('voice')
const doFootage = want.length === 0 || want.includes('footage')
const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

function ffmpeg(args: string[]) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`ffmpeg exited ${r.status}: ${r.stderr.slice(-1500)}`)
}
const silence = (file: string, seconds: number) =>
  ffmpeg(['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', seconds.toFixed(3), '-c:a', 'pcm_s16le', file])

if (doVoice) {
  const outDir = join(root, 'public/voice/demo')
  mkdirSync(outDir, { recursive: true })
  const voice: Record<string, unknown> = {}
  for (const id of TAKES) {
    // 150 words a minute, with the script's marked pauses.
    let t = 0.12
    const words: { word: string; startMs: number; endMs: number }[] = []
    const silences: [number, number][] = []
    for (const token of SCRIPT[id].split(/\s+/)) {
      const pause = token.match(/^([\d.]+)s\]$/)
      if (pause) {
        const last = silences.at(-1)!
        last[1] += Math.round(Number(pause[1]) * 1000)
        t += Number(pause[1])
        continue
      }
      if (token.startsWith('[')) continue
      words.push({ word: token, startMs: Math.round(t * 1000), endMs: Math.round((t + 0.32) * 1000) })
      silences.push([Math.round((t + 0.32) * 1000), Math.round((t + 0.4) * 1000)])
      t += 0.4
    }
    const durationMs = Math.round((t + 0.22) * 1000)
    silence(join(outDir, `${id}.wav`), durationMs / 1000)
    voice[id] = { placeholder: true, src: `voice/demo/${id}.wav`, take: 'placeholder', durationMs, words, silences }
  }
  silence(join(outDir, 'room.wav'), 10)
  writeFileSync(join(root, 'src/data/demo-voice.json'), JSON.stringify(voice, null, 2) + '\n')
  console.log('Wrote placeholder voice for', TAKES.join(' '))
}

if (doFootage) {
  type Spec = { id: string; target_s: number; cues: string[] }
  const shots = (JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8')) as { shots: Spec[] }).shots
  const outDir = join(root, 'public/footage/edit')
  mkdirSync(outDir, { recursive: true })
  const footage: { shots: Record<string, unknown> } = { shots: {} }
  for (const s of shots) {
    const seconds = s.target_s + 8
    const step = (seconds - 4) / Math.max(1, s.cues.length - 1)
    const cues = Object.fromEntries(
      s.cues.map((c, i) => {
        const big = /radar|state|list|card|panel|open/.test(c)
        const box = {
          x: 240 + ((i * 337) % 1000),
          y: 160 + ((i * 211) % 520),
          width: big ? 560 : 360,
          height: big ? 360 : 90
        }
        return [c, { t: Number((1.5 + i * step).toFixed(3)), box }]
      })
    )
    const draws = Object.entries(cues).flatMap(([c, { t, box }]) => [
      `drawbox=x=${box.x}:y=${box.y}:w=${box.width}:h=${box.height}:color=white@0.35:t=fill:enable='gte(t,${t})'`,
      `drawtext=fontfile=${FONT}:text='${c}':x=${box.x + 12}:y=${box.y + 12}:fontsize=30:fontcolor=white:enable='gte(t,${t})'`
    ])
    const vf = [
      `drawtext=fontfile=${FONT}:text='${s.id} placeholder':x=60:y=980:fontsize=48:fontcolor=white`,
      `drawtext=fontfile=${FONT}:text='%{pts\\:hms}':x=1500:y=980:fontsize=48:fontcolor=white`,
      ...draws,
      'format=yuv420p'
    ].join(',')
    ffmpeg([
      '-f',
      'lavfi',
      '-i',
      `color=c=0x37514a:s=1920x1080:r=30:d=${seconds + 4}`,
      '-vf',
      vf,
      '-c:v',
      'libx264',
      '-crf',
      '30',
      '-g',
      '10',
      join(outDir, `${s.id}.mp4`)
    ])
    const entry: Record<string, unknown> = {
      placeholder: true,
      run: 'placeholder',
      take: 0,
      status: 'ok',
      src: `footage/edit/${s.id}.mp4`,
      width: 1920,
      height: 1080,
      seconds,
      cues
    }
    if (s.id === 'D6') {
      silence(join(root, 'public/voice/demo/kopi.wav'), 8)
      entry.audio = { src: 'voice/demo/kopi.wav', seconds: 8, start: cues['kopi-voice-start']!.t }
    }
    footage.shots[s.id] = entry
    console.log(`${s.id}: ${seconds} s placeholder`)
  }
  writeFileSync(join(root, 'src/data/footage.json'), JSON.stringify(footage, null, 2) + '\n')
}
