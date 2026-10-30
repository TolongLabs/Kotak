// The demo cut, as data. Times are seconds from the start of their part, and most are set on a spoken
// word, so the picture follows the voice. Camera framings and boxes are in the take's own pixels.
// Graphics follow the cue sheet in docs/demo/prelim/demo-graphics.md. Each part runs as long as its read needs.
import type { TakeId } from './data/script'
import { FPS, KOPI_IN, LEADS, cue, cueBox, holdAfter, kopiSeconds, sec, shot, voiceLength, word, type Box, type ShotId } from './lib'
import type { ActName, ArrowDir, HudStep, ResultName, RingName } from './motion'

export type Framing = { at: number; x: number; y: number; z: number; move?: number }
/** A stretch of the part's take: from part time `from` until the next clip, playing from `srcIn`. */
export type Clip = { from: number; srcIn: number; freeze?: boolean; /** Playback speed, for a fast-forward. */ rate?: number }
/**
 * Something the voice names, on screen from `from` to `to`: a ring or an arrow around `box`, or neither (a
 * zoom only). The camera eases in on it unless `zoom` is false; `zoom` sets the scale, else it fits the box.
 */
export type Mark = { ring?: RingName; arrow?: ArrowDir; box: Box; from: number; to: number; pad?: number; zoom?: number | false }
/** A callout (c-*) or a result card (r-*). One at a time. */
export type Graphic = { name: string; from: number; to: number }
export type Sfx = { src: string; at: number; volume: number }
export type Part = {
  id: TakeId
  shot: ShotId
  step: HudStep['step']
  act?: ActName
  /** Seconds of picture before the voice starts. */
  lead: number
  /** Seconds of picture after the voice ends. */
  minTail: number
  clips: Clip[]
  marks: Mark[]
  graphics: Graphic[]
  sounds: { src: string; at: number; seconds: number }[]
  /** Source-time sounds of the take (clicks, keys), placed where the cut shows them. */
  takeSfx?: { src: string; t: number; volume: number }[]
}

export const END = 10_000 // until the part ends
const ZOOM = 1.2 // the takes are 1080p, so zooms stay at 120% or below
const ZOOM_MOVE = 1.0 // seconds each zoom eases in or out: slow, so the eye follows
const RESULT = 3 // seconds a result card holds
const HOLD = 0.6 // seconds a take plays past each landing before it holds still
const PRE = 2 // seconds of the action that leads to each landing, when the voice leaves room

const at =
  (id: TakeId) =>
  (text: string, nth = 1) =>
    LEADS[id] + word(id, text, nth)

const ring = (name: RingName, s: ShotId, cueId: string, from: number, to: number, extra: Partial<Mark> = {}): Mark => ({
  ring: name,
  box: cueBox(s, cueId),
  from,
  to,
  ...extra
})
const arrow = (dir: ArrowDir, s: ShotId, cueId: string, from: number, to: number): Mark => ({
  arrow: dir,
  box: cueBox(s, cueId),
  from,
  to
})
const look = (s: ShotId, cueId: string, from: number, to: number): Mark => ({ box: cueBox(s, cueId), from, to })
const union = (a: Box, b: Box): Box => {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y }
}
/** Callouts in order: each stays until the next one starts, the last until `to` or the part's end. */
const chain = (list: { name: string; from: number; to?: number }[]): Graphic[] =>
  list.map((g, i) => ({ name: g.name, from: g.from, to: g.to ?? list[i + 1]?.from ?? END }))
const result = (name: ResultName, from: number): Graphic => ({ name, from, to: from + RESULT })

type Anchor = { cue: string; at: number; pre?: number; hold?: number }
/**
 * Time-remaps a take so each anchor's cue lands at its part time. Each window starts `pre` seconds before its
 * cue, so the action that leads to it plays, then plays `hold` seconds past the cue and holds that frame until
 * the next window, so the page never moves under a ring. The cut into the next window skips what lies between.
 */
function track(s: ShotId, anchors: Anchor[]): Clip[] {
  const clips: Clip[] = []
  anchors.forEach((a, k) => {
    const prev = anchors[k - 1]
    const lead = k === 0 ? a.at : Math.min(a.pre ?? PRE, Math.max(0, a.at - prev!.at - 0.3))
    let part = a.at - lead
    let src = cue(s, a.cue) - lead
    // The take starts too late for this landing: hold its first frame until it can play.
    if (src < 0) {
      clips.push({ from: part, srcIn: 0, freeze: true })
      part -= src
      src = 0
    }
    clips.push({ from: part, srcIn: src })
    const hold = a.hold ?? HOLD
    const next = anchors[k + 1]
    const nextStart = next ? next.at - Math.min(next.pre ?? PRE, Math.max(0, next.at - a.at - 0.3)) : Infinity
    if (Number.isFinite(hold) && a.at + hold < nextStart) clips.push({ from: a.at + hold, srcIn: cue(s, a.cue) + hold, freeze: true })
  })
  return clips
}

const d1 = at('D1')
const d2 = at('D2')
const d3 = at('D3')
const d4 = at('D4')
const d5 = at('D5')
const d6 = at('D6')
const d7 = at('D7')
const m1 = at('M1')
const tailOf = (id: TakeId, tail: number) => LEADS[id] + voiceLength(id) + tail

// Kopi speaks in the held beat after "last": nothing covers it from KOPI_CLEAR until its line ends.
const kopiAt = LEADS.D6 + holdAfter('D6', 'last') + KOPI_IN
const KOPI_CLEAR = kopiAt - 0.3
const kopiAudio = shot('D6').audio
// D2's fast-forward, once the take runs through all 12 questions to the Radar page: Q4 to Q12 in at most 8 s.
const D2_FF = (() => {
  const c = shot('D2').cues
  if (!c['radar-shown'] || !c['q3-answered']) return null
  const from = d2('minutes') + 0.5
  const span = c['radar-shown'].t + 0.3 - (c['q3-answered'].t + 0.5)
  const seconds = Math.max(3, Math.min(8, span / 6))
  return { from, seconds, rate: span / seconds, tail: from + seconds + 1.2 - (LEADS.D2 + voiceLength('D2')) }
})()
const D5_FREE = Math.max(d5('its'), d5('eighty') + RESULT)
const D5_TICK = Math.min(d5('funding') - 1.2, Math.max(d5('link') + 0.4, D5_FREE + 1.2))

const PARTS_RAW: Part[] = [
  {
    id: 'D1',
    shot: 'D1',
    step: 1,
    act: 'act-1-problem',
    lead: LEADS.D1,
    minTail: 0.8,
    clips: track('D1', [
      { cue: 'status-picked', at: d1('problem') + 0.3 },
      // "web developer" typed live, then Web Developers picked from Kopi's matches.
      { cue: 'job-typed', at: d1('working') + 0.3, pre: 2.2 },
      { cue: 'job-picked', at: d1('developer') + 0.3 },
      { cue: 'goal-picked', at: d1('stay') + 0.2 },
      // The click into the questions lands just before the cut to D2, which opens on question 1.
      { cue: 'continue', at: tailOf('D1', 0.8) - 0.4 }
    ]),
    marks: [],
    graphics: chain([{ name: 'c-d1-who', from: d1('who') }]),
    sounds: [],
    takeSfx: [
      { src: 'click', t: cue('D1', 'status-picked') - 0.2, volume: 0.7 },
      { src: 'typing', t: cue('D1', 'job-typed') - 1.77, volume: 0.5 },
      { src: 'click', t: cue('D1', 'job-picked') - 0.2, volume: 0.7 },
      { src: 'click', t: cue('D1', 'goal-picked') - 0.2, volume: 0.7 },
      { src: 'click', t: cue('D1', 'continue') - 0.2, volume: 0.7 }
    ]
  },
  {
    id: 'D2',
    shot: 'D2',
    step: 2,
    lead: LEADS.D2,
    minTail: D2_FF ? D2_FF.tail : 0.6,
    clips: [
      ...track('D2', [
        { cue: 'q1-shown', at: 0.3 },
        { cue: 'q1-answered', at: d2('two') },
        // Question 2 is worded the other way round: on screen as the voice says so.
        { cue: 'q2-shown', at: d2('some') - 0.3 },
        { cue: 'q2-answered', at: d2('autopilot') },
        { cue: 'q3-answered', at: d2('minutes'), hold: D2_FF ? 0.5 : undefined }
      ]),
      // Questions 4 to 12 fast-forwarded, then the Radar page arrives and holds for the cut to D3.
      ...(D2_FF
        ? [
            { from: D2_FF.from, srcIn: cue('D2', 'q3-answered') + 0.5, rate: D2_FF.rate },
            { from: D2_FF.from + D2_FF.seconds, srcIn: cue('D2', 'radar-shown') + 0.3, freeze: true }
          ]
        : [])
    ],
    marks: [look('D2', 'q1-shown', 0.3, D2_FF ? D2_FF.from : END)],
    graphics: chain([
      { name: 'c-d2-questions', from: d2('twelve') },
      // Off as the fast-forward starts, so the questions flick past unobstructed.
      { name: 'c-d2-reversed', from: d2('worded'), to: D2_FF ? D2_FF.from + 0.6 : undefined }
    ]),
    sounds: [],
    takeSfx: ['q1-answered', 'q2-answered', 'q3-answered'].map((c) => ({ src: 'key', t: cue('D2', c) - 0.05, volume: 0.6 }))
  },
  {
    id: 'D3',
    shot: 'D3',
    step: 3,
    lead: LEADS.D3,
    minTail: 3.2,
    clips: track('D3', [
      { cue: 'radar-visible', at: 0.3 },
      // Your Gaps: Technical documentation, its Rising chip and its dated sources.
      { cue: 'chip-rising', at: d3('each') + 0.2 },
      { cue: 'job-ads-card', at: d3('tied'), pre: 3 },
      // Then the card's pay row: the median the callout quotes.
      { cue: 'pay-row', at: d3('tied') + 2.4, hold: Infinity }
    ]),
    marks: [
      // A rounded box hugs the radar; a circle round its box would cross the page title.
      ring('ring-box', 'D3', 'radar-visible', d3('radar'), d3('each') - 1.0, { pad: 6 }),
      // The Radar page shows no Declining chip for Web site building (it is not a gap in May): callout only.
      // No zoom: at 1.2× on the chip the page's blank gutters leave the frame and the callout would cover text.
      ring('ring-small', 'D3', 'chip-rising', d3('technical'), d3('tied') - 1.6, { zoom: false }),
      ring('ring-box', 'D3', 'job-ads-card', d3('tied'), d3('tied') + 2.0),
      ring('ring-wide', 'D3', 'pay-row', d3('tied') + 2.4, END)
    ],
    graphics: chain([
      { name: 'c-d3-radar', from: d3('radar') },
      { name: 'c-d3-rising', from: d3('technical') },
      { name: 'c-d3-declining', from: d3('web') },
      // The pack's c-d3-jobs reads 170 ads at RM6,300; this is the card as read on the recording day.
      { name: 'c-d3-jobs-day', from: d3('tied') }
    ]),
    sounds: []
  },
  {
    id: 'D4',
    shot: 'D4',
    step: 4,
    act: 'act-2-solution',
    lead: LEADS.D4,
    minTail: 2.5,
    clips: track('D4', [
      { cue: 'roles-list', at: 0.3 },
      { cue: 'highlight-card', at: d4('ranks') },
      { cue: 'maths-button', at: d4('see') },
      { cue: 'maths-open', at: d4('number'), hold: Infinity }
    ]),
    marks: [
      ring('ring-box', 'D4', 'highlight-card', d4('ranks'), d4('see') - 1.0),
      arrow('right', 'D4', 'maths-button', d4('see'), d4('number') - 1.0),
      look('D4', 'maths-open', d4('number'), END)
    ],
    graphics: chain([
      { name: 'c-d4-fit', from: d4('ranks') },
      { name: 'c-d4-maths', from: d4('see') }
    ]),
    sounds: [],
    takeSfx: [{ src: 'click', t: cue('D4', 'maths-open') - 0.3, volume: 0.7 }]
  },
  {
    id: 'D5',
    shot: 'D5',
    step: 5,
    lead: LEADS.D5,
    minTail: 2.2,
    clips: track('D5', [
      { cue: 'roadmap-title', at: 0.3 },
      { cue: 'step-list', at: d5('most') },
      // Back up to the readiness line: "80% Fit by Week 34" at 10 hours a week.
      { cue: 'readiness', at: d5('ten'), pre: 0.4 },
      { cue: 'free-link', at: D5_FREE, pre: 1.5 },
      // Step 1 ticked: its number turns into a green check.
      { cue: 'tick', at: D5_TICK },
      { cue: 'funding-card', at: d5('funding') }
    ]),
    marks: [
      {
        ring: 'ring-wide',
        box: union(cueBox('D5', 'step-1'), cueBox('D5', 'free-link')),
        from: D5_FREE,
        to: D5_TICK - 0.9
      },
      ring('ring-wide', 'D5', 'readiness', d5('ten'), d5('eighty') - 0.1),
      ring('ring-box', 'D5', 'funding-card', d5('funding'), END)
    ],
    graphics: [
      { name: 'c-d5-order', from: d5('most'), to: d5('eighty') },
      result('r-d5-plan', d5('eighty')),
      ...(d5('funding') - D5_FREE > 1.2 ? [{ name: 'c-d5-free', from: D5_FREE, to: d5('funding') }] : [])
    ],
    sounds: [],
    takeSfx: [{ src: 'click', t: cue('D5', 'tick') - 0.2, volume: 0.7 }]
  },
  {
    id: 'D6',
    shot: 'D6',
    step: 6,
    act: 'act-3-outcome',
    lead: LEADS.D6,
    minTail: 0.6,
    // The take: April at the top; May clicked and Kopi speaks, still at the top; then (Kopi done) the cards,
    // a glide down to the "moved to step 4/5" lines, and back up to card 1's "moved to step 6". The edit plays
    // those in the voice's order and cuts back to Kopi's line after "last", then holds the frame after it.
    clips: [
      ...track('D6', [
        { cue: 'april-state', at: 0.3 },
        // Straight from April to the May state after Kopi's line, so Kopi's mouth never moves under the voice.
        { cue: 'verdict-flip', at: d6('may', 2), pre: 0 },
        // Card 1, at the top, reads "moved to step 6": the take's same view after its glide back up.
        { cue: 'step-moved', at: d6('drops'), pre: 0 },
        // Kopi's line in sync with its audio, cut in once the May button shows pressed.
        {
          cue: 'may-loaded',
          at: kopiAt + cue('D6', 'may-loaded') - cue('D6', 'kopi-voice-start'),
          pre: 0,
          hold: kopiSeconds() + 0.3
        }
      ])
    ],
    marks: [
      ring('ring-small', 'D6', 'april-selector', d6('same'), d6('every')),
      look('D6', 'april-state', d6('every'), d6('may', 2)),
      // The Live Demo status line, "New data landed: May 2026 is active across Kotak."; gone before the glide.
      // In May the cards hold the change; the take has scrolled since the status line's cue, so no ring on it.
      look('D6', 'verdict-flip', d6('may', 2) + 0.2, d6('drops') - 0.3),
      // From the empty gutter left of the card, so the arrow covers none of its text.
      arrow('right', 'D6', 'step-moved', d6('drops'), KOPI_CLEAR)
    ],
    graphics: [
      ...chain([
        { name: 'c-d6-same', from: d6('same') },
        { name: 'c-d6-april', from: d6('every') },
        { name: 'c-d6-may', from: d6('six') },
        { name: 'c-d6-step', from: d6('drops'), to: KOPI_CLEAR }
      ]),
      result('r-d6-moved', d6('trend'))
    ],
    sounds: kopiAudio ? [{ src: kopiAudio.src, at: kopiAt, seconds: kopiAudio.seconds }] : []
  },
  {
    id: 'D7',
    shot: 'D7',
    step: 7,
    lead: LEADS.D7,
    minTail: 3.0,
    clips: track('D7', [
      // The question typed live, then Kopi's tool call and its answer streaming in.
      { cue: 'question-sent', at: d7('ask') + 0.8 },
      { cue: 'tool-shown', at: d7('checks') },
      { cue: 'sample-data-words', at: d7('sample'), hold: Infinity }
    ]),
    // Around Kopi's whole answer: a ring on the words inside the paragraph would cover the lines around
    // them, "not real Malaysian check-ups" among them. The callout quotes "sample data".
    // No zoom: the callout sits left, and a zoom toward the panel would slide the radar's "You (Self-Reported)"
    // label under it.
    marks: [ring('ring-box', 'D7', 'answer-done', d7('sample'), END, { zoom: false })],
    graphics: [{ name: 'c-d7-kopi', from: d7('says'), to: END }],
    sounds: [],
    takeSfx: [
      { src: 'typing', t: cue('D7', 'question-sent') - 1.8, volume: 0.5 },
      { src: 'key', t: cue('D7', 'question-sent') - 0.15, volume: 0.6 }
    ]
  },
  {
    id: 'M1',
    shot: 'M1',
    step: 8,
    lead: LEADS.M1,
    minTail: 2.5,
    clips: track('M1', [
      { cue: 'mcp-address', at: 0.3, hold: 1.5 },
      // A few seconds of the Connect Your AI page, then the assistant.
      { cue: 'tools-listed', at: m1('most') },
      { cue: 'tool-called', at: m1('any') },
      { cue: 'verdicts-shown', at: m1('verdicts'), hold: Infinity }
    ]),
    marks: [
      ring('ring-wide', 'M1', 'mcp-address', 0.4, m1('most') - 1.0),
      look('M1', 'verdicts-shown', m1('verdicts'), END)
    ],
    graphics: chain([{ name: 'c-m1-mcp', from: m1('kotak', 2) }]),
    sounds: [],
    takeSfx: [
      { src: 'click', t: cue('M1', 'tools-listed') - 0.3, volume: 0.7 },
      { src: 'click', t: cue('M1', 'tool-called') - 0.5, volume: 0.7 }
    ]
  }
]

/** Where the cut shows a source moment of its take, in part time, or null when the cut skips or holds it. */
function partTimeOf(clips: Clip[], t: number) {
  for (const [i, c] of clips.entries()) {
    if (c.freeze) continue
    const length = (clips[i + 1]?.from ?? Infinity) - c.from
    if (t >= c.srcIn && t < c.srcIn + length) return c.from + (t - c.srcIn)
  }
  return null
}

/** Picture lengths: the read plus its tail, and any result card's full hold. */
function natural(p: Part) {
  const ends = p.graphics.filter((g) => g.to < END).map((g) => g.to + 0.1)
  return Math.max(p.lead + voiceLength(p.id) + p.minTail, ...ends)
}

/**
 * A ring or arrow fades out as the take starts moving again: it ends where the next live stretch of the take
 * begins, so it never slides off the element it names when the page scrolls or switches.
 */
export const PARTS = PARTS_RAW.map((p) => ({
  ...p,
  marks: p.marks.map((m) => {
    if (!m.ring && !m.arrow) return m
    const moving = p.clips.find((c, i) => !c.freeze && c.from > m.from + 0.05 && i > 0)
    return moving ? { ...m, to: Math.min(m.to, moving.from) } : m
  })
}))
export const PLACED = (() => {
  // Each part runs as long as its read, its tail and its result card need: no padding, no silent holds.
  const lengths = PARTS.map((p) => sec(natural(p)))
  let cursor = 0
  return PARTS.map((part, idx) => {
    const frames = lengths[idx]!
    const end = frames / FPS
    // The UI's own sounds where the cut shows them; a whoosh under each act banner, a soft pop under each
    // callout and a chime under each result card.
    const sfx: Sfx[] = [
      ...(part.takeSfx ?? []).flatMap((s) => {
        const t = partTimeOf(part.clips, s.t)
        return t === null || t < 0 || t > end ? [] : [{ src: s.src, at: t, volume: s.volume }]
      }),
      ...(part.act ? [{ src: 'whoosh', at: 0, volume: 0.45 }] : []),
      ...part.graphics
        .filter((g) => g.from < end)
        .map((g) => ({ src: g.name.startsWith('r-') ? 'chime' : 'pop', at: g.from, volume: g.name.startsWith('r-') ? 0.45 : 0.35 }))
    ]
    const p = { part, from: cursor, frames, sfx }
    cursor += frames
    return p
  })
})()
export const DEMO_FRAMES = PLACED.reduce((n, p) => n + p.frames, 0)

/** The camera for a part: the whole page, easing in on each mark the voice names and back out after it. */
export function cameraFor(part: Part, s: { width: number; height: number }): Framing[] {
  const keys: Framing[] = [{ at: 0, x: s.width / 2, y: s.height / 2, z: 1 }]
  const marks = part.marks.filter((m) => m.zoom !== false).sort((a, b) => a.from - b.from)
  marks.forEach((m, i) => {
    const z = m.zoom || Math.max(1, Math.min(ZOOM, (s.width * 0.8) / m.box.width, (s.height * 0.8) / m.box.height))
    if (z > 1.02) keys.push({ at: m.from + ZOOM_MOVE, x: m.box.x + m.box.width / 2, y: m.box.y + m.box.height / 2, z, move: ZOOM_MOVE })
    const next = marks[i + 1]
    if (m.to < END && (!next || next.from > m.to + 0.8)) keys.push({ at: m.to + ZOOM_MOVE, x: s.width / 2, y: s.height / 2, z: 1, move: ZOOM_MOVE })
  })
  return keys.sort((a, b) => a.at - b.at)
}

// Nothing covers Kopi while it speaks, and at most one callout or result card shows at a time.
for (const { part, frames } of PLACED) {
  const end = frames / FPS
  const spans = part.graphics.map((g) => ({ ...g, to: Math.min(g.to, end) })).sort((a, b) => a.from - b.from)
  spans.forEach((g, i) => {
    const next = spans[i + 1]
    if (next && next.from < g.to - 1e-6) throw new Error(`${part.id}: ${g.name} overlaps ${next.name}`)
  })
  if (part.id === 'D6') {
    const kopiEnd = kopiAt + kopiSeconds()
    for (const m of [...part.graphics, ...part.marks])
      if (m.from < kopiEnd && Math.min(m.to, end) > KOPI_CLEAR + 1e-6)
        throw new Error(`D6: a graphic covers Kopi (${'name' in m ? m.name : (m.ring ?? m.arrow ?? 'zoom')})`)
  }
}
