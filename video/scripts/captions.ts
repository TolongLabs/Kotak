// Prints the demo segment's English SRT (times from the segment's start) from the script's timed words,
// plus Kopi's own line in D6. Usage: bun scripts/captions.ts > out/kotak-demo.srt
import { PLACED } from '../src/edit'
import { FPS, playedWords, sec, shot } from '../src/lib'

const MAX = 42
type Row = { start: number; end: number; text: string }
const rows: Row[] = []

for (const { part, from, frames } of PLACED) {
  const words = playedWords(part.id).map((w) => ({ ...w, at: from + sec(part.lead + w.start), out: from + sec(part.lead + w.end) }))
  // Kopi's line, as the app spoke it, split into rows spread over its length.
  const kopi = part.sounds[0]
  const kopiText = part.id === 'D6' ? shot('D6').audio?.text : undefined
  const lines: { words: typeof words }[] = []
  let cur: typeof words = []
  for (const w of words) {
    const prev = cur.at(-1)
    const text = [...cur, w].map((x) => x.word).join(' ')
    const gap = prev ? (w.at - prev.out) / FPS : 0
    if (cur.length && (text.length > MAX || /[.?!;]$/.test(prev!.word) || gap > 0.5)) {
      lines.push({ words: cur })
      cur = []
    }
    cur.push(w)
  }
  if (cur.length) lines.push({ words: cur })
  const partRows = lines.map((l) => ({ start: l.words[0]!.at - 2, end: l.words.at(-1)!.out + 12, text: l.words.map((w) => w.word).join(' ') }))
  if (kopi && kopiText) {
    const at = from + sec(kopi.at)
    const chunks: string[] = []
    let line = 'Kopi:'
    for (const w of kopiText.split(/\s+/)) {
      if ((line + ' ' + w).length > MAX) {
        chunks.push(line)
        line = w
      } else line += ' ' + w
    }
    chunks.push(line)
    const each = sec(kopi.seconds) / chunks.length
    chunks.forEach((text, k) => partRows.push({ start: at + Math.round(k * each), end: at + Math.round((k + 1) * each), text }))
  }
  partRows.sort((a, b) => a.start - b.start)
  // A row ends where the next starts, and never past its part.
  partRows.forEach((r, k) => {
    const next = partRows[k + 1]
    r.end = Math.min(next ? Math.min(r.end, next.start) : r.end, from + frames)
  })
  rows.push(...partRows)
}

const stamp = (f: number) => {
  const ms = Math.round((f / FPS) * 1000)
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${p(Math.floor(ms / 3_600_000))}:${p(Math.floor(ms / 60_000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`
}
process.stdout.write(rows.map((r, i) => `${i + 1}\n${stamp(r.start)} --> ${stamp(r.end)}\n${r.text}\n`).join('\n'))
