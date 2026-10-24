// Prints the demo's placed parts and every graphic's span, in demo seconds and frames.
import { DEMO_FRAMES, PLACED } from '../src/edit'
const t = (f: number) => `${Math.floor(f / 1800)}:${((f % 1800) / 30).toFixed(2).padStart(5, '0')}`
for (const { part, from, frames } of PLACED) {
  console.log(`${part.id}  ${t(from)}–${t(from + frames)}  (${(frames / 30).toFixed(2)} s)`)
  for (const g of part.graphics)
    console.log(`   ${g.name.padEnd(15)} f${from + Math.round(g.from * 30)}  ${t(from + Math.round(g.from * 30))}–${t(from + Math.min(frames, Math.round(g.to * 30)))}`)
}
console.log(`total ${DEMO_FRAMES} frames = ${(DEMO_FRAMES / 30).toFixed(2)} s`)
