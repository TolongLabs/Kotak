// #353: deterministic checks on one generated job. Returns a list of problems; empty means valid.
export interface Option {
  id: string
  text: string
  score: number
}
export interface Slot {
  slot: number
  corner_id: string
  level: 'basic' | 'advanced'
  situation: string
  options: Option[]
  task_ids: number[]
}
export interface CornerIn {
  corner_id: string
  task_ids: number[]
}

export const GIVEAWAYS = [
  'best',
  'always',
  'never',
  'ignore',
  'ignores',
  'ignoring',
  'immediately',
  'comprehensive',
  'comprehensively',
  'thoroughly',
  'do nothing',
  'guess',
  'perfect',
  'perfectly',
  'correct',
  'wrong'
]
const MAX_SITUATION = 40
const MAX_OPTION = 20
const MAX_SITUATION_CHARS = 250 // the questions page has fixed-size boxes
const MAX_OPTION_CHARS = 120

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean)
const tokens = (s: string) => new Set(s.toLowerCase().match(/[a-z0-9']+/g) ?? [])
const jaccard = (a: Set<string>, b: Set<string>) => {
  let i = 0
  for (const x of a) if (b.has(x)) i++
  return i / (a.size + b.size - i || 1)
}

export function validateJob(slots: Slot[], corners: CornerIn[]): string[] {
  const bad: string[] = []
  if (slots.length !== 12) return [`expected 12 slots, got ${slots.length}`]
  slots.forEach((s, i) => {
    const p = `slot ${i}:`
    const corner = corners[Math.floor(i / 2)]!
    const level = i % 2 === 0 ? 'basic' : 'advanced'
    if (s.slot !== i || s.corner_id !== corner.corner_id || s.level !== level)
      bad.push(`${p} wrong order or corner/level`)
    if (typeof s.situation !== 'string' || !s.situation.trim()) return void bad.push(`${p} no situation`)
    if (words(s.situation).length > MAX_SITUATION) bad.push(`${p} situation over ${MAX_SITUATION} words`)
    if (s.situation.length > MAX_SITUATION_CHARS) bad.push(`${p} situation over ${MAX_SITUATION_CHARS} characters`)
    if (!Array.isArray(s.options) || s.options.length !== 4) return void bad.push(`${p} needs 4 options`)
    const scores = s.options.map((o) => o.score).sort()
    if (scores.join() !== '1,2,3,4') bad.push(`${p} scores must be exactly 1,2,3,4`)
    for (const o of s.options) {
      if (typeof o.text !== 'string' || !o.text.trim()) return void bad.push(`${p} empty option`)
      if (words(o.text).length > MAX_OPTION) bad.push(`${p} option over ${MAX_OPTION} words`)
      if (o.text.length > MAX_OPTION_CHARS) bad.push(`${p} option over ${MAX_OPTION_CHARS} characters`)
      const low = ` ${o.text.toLowerCase().replace(/[^a-z' ]+/g, ' ')} `
      for (const g of GIVEAWAYS) if (low.includes(` ${g} `)) bad.push(`${p} giveaway word "${g}"`)
    }
    for (let a = 0; a < 4; a++)
      for (let b = a + 1; b < 4; b++)
        if (jaccard(tokens(s.options[a]!.text), tokens(s.options[b]!.text)) >= 0.7)
          bad.push(`${p} near-duplicate options`)
    const lens = s.options.map((o) => words(o.text).length)
    if (Math.max(...lens) - Math.min(...lens) > 5) bad.push(`${p} option lengths differ by more than 5 words`)
    const ids = s.task_ids
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((t) => corner.task_ids.includes(t)))
      bad.push(`${p} task ids empty or outside the corner`)
  })
  // per job the score-4 option may be the strictly longest in at most 4 slots (more is its own giveaway)
  const longest = slots.filter((s) => {
    const l = s.options.map((o) => words(o.text).length)
    const top = s.options.findIndex((o) => o.score === 4)
    return top >= 0 && l[top] === Math.max(...l) && l.filter((n) => n === l[top]).length === 1
  }).length
  if (longest > 4) bad.push(`score-4 option is the longest in ${longest} of 12 slots (max 4)`)
  return [...new Set(bad)]
}
