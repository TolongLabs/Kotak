// Prints the five gate stills as "<name> <frame>": one moment per act beat, each with its graphics on.
// Render them with: bun scripts/stills.ts | while read n f; do bunx remotion still src/index.ts Demo out/stills/$n.png --frame=$f; done
import { PLACED } from '../src/edit'
import { sec, word } from '../src/lib'
import type { TakeId } from '../src/data/script'

const at = (id: TakeId, w: string, plus: number, nth = 1) => {
  const p = PLACED.find((x) => x.part.id === id)!
  return p.from + sec(p.part.lead + word(id, w, nth) + plus)
}
const picks: [string, number][] = [
  ['1-D1-intake', at('D1', 'developer', 0.8)],
  ['2-D3-radar', at('D3', 'radar', 1.2)],
  ['3-D5-result', at('D5', 'eighty', 1.5)],
  ['4-D6-step', at('D6', 'drops', 1.0)],
  ['5-D7-sample-data', at('D7', 'sample', 1.0)]
]
for (const [name, frame] of picks) console.log(name, frame)
