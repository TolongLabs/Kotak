import { flushSync } from 'react-dom'
import { setTheme, type Theme } from './theme'

// The theme switch renders the page as live ASCII art, after ascii-magic.com: a ring of glyphs sweeps out from the
// toggle with the old theme ahead and the new theme behind. Each ring cell shows what the page has there, in the
// page's own colours: text as dense glyphs, borders as +-| boxes, media as mid-density fill and the rest as faint
// grain. Glyphs re-roll 20 times a second along a 70-step density ramp, and the theme flips along a dithered seam
// marked in the accent. Underneath runs a view transition: the old view is a still, the new view is live and its clip
// follows the seam. Safari keeps the canvas's capture still, so it shows the clip alone, as a circular reveal.
// Reduced motion, and browsers without view transitions, swap at once.

// Paul Bourke's 70-step ramp, densest first.
const RAMP = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. '
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const EMPTY = 0
const TEXT = 1
const MEDIA = 2
const ROW = 3
const COLUMN = 4
const CORNER = 5
const DENSITY = [0, 0.9, 0.6]
const BORDER_GLYPHS = ['', '', '', '-', '|', '+']
const DURATION_MS = 1100
const TICK_MS = 50

interface Grid {
  cols: number
  rows: number
  cellW: number
  cellH: number
}

// What each cell shows (kind), the element whose colour inks it, and the element on top there.
interface Probe {
  kind: Uint8Array
  owner: (Element | null)[]
  top: (Element | null)[]
}

interface Colours {
  ink: string[]
  bg: string[]
  accent: string
}

let running = false

// Computed colours come back as rgb() or rgba(); under half opacity, the page behind shows through.
function opaque(color: string) {
  const alpha = /^rgba\(.*,\s*([\d.]+)\)$/.exec(color)
  return color.startsWith('rgb') && (!alpha || Number(alpha[1]) >= 0.5)
}

// Hit-testing each cell's centre gives paint order, clipping, sticky bars and the top layer for free. Text and borders
// then count only in cells where their element is the one on top.
function probe({ cols, rows, cellW, cellH }: Grid): Probe {
  const kind = new Uint8Array(cols * rows)
  const top: (Element | null)[] = []
  for (let cell = 0; cell < cols * rows; cell++) {
    // Column pairs share one hit test, taken on their shared edge, which halves the cost.
    const col = cell % cols
    const hit =
      col % 2 ? top[cell - 1] : document.elementFromPoint((col + 1) * cellW, (Math.floor(cell / cols) + 0.5) * cellH)
    top.push(hit)
    if (hit?.closest('img, canvas, video, svg')) kind[cell] = MEDIA
  }
  const owner = top.slice()
  const shows = (element: Element, cell: number) => !!top[cell] && element.contains(top[cell])
  // The cells whose centres fall inside rect.
  const span = (rect: DOMRect) => ({
    top: Math.max(0, Math.round(rect.top / cellH)),
    bottom: Math.min(rows, Math.round(rect.bottom / cellH)),
    left: Math.max(0, Math.round(rect.left / cellW)),
    right: Math.min(cols, Math.round(rect.right / cellW))
  })

  const range = document.createRange()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement
    if (!parent || !node.textContent?.trim() || parent.closest('svg')) continue
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) {
      const { top: first, bottom, left, right } = span(rect)
      for (let row = first; row < bottom; row++) {
        for (let col = left; col < right; col++) {
          if (!shows(parent, row * cols + col)) continue
          kind[row * cols + col] = TEXT
          owner[row * cols + col] = parent
        }
      }
    }
  }

  // Borders of every element on top somewhere, and of its ancestors.
  const boxes = new Set<Element>()
  for (const hit of new Set(top)) {
    for (let element = hit; element && !boxes.has(element); element = element.parentElement) boxes.add(element)
  }
  for (const box of boxes) {
    const style = getComputedStyle(box)
    const [upper, right, lower, left] = [
      style.borderTopWidth,
      style.borderRightWidth,
      style.borderBottomWidth,
      style.borderLeftWidth
    ].map((width) => parseFloat(width) > 0)
    if (!upper && !right && !lower && !left) continue
    const edge = span(box.getBoundingClientRect())
    const mark = (row: number, col: number, value: number) => {
      if (row < edge.top || row >= edge.bottom || col < edge.left || col >= edge.right) return
      if (!shows(box, row * cols + col)) return
      kind[row * cols + col] = value
      owner[row * cols + col] = box
    }
    for (let col = edge.left; col < edge.right; col++) {
      if (upper) mark(edge.top, col, ROW)
      if (lower) mark(edge.bottom - 1, col, ROW)
    }
    for (let row = edge.top; row < edge.bottom; row++) {
      if (left) mark(row, edge.left, COLUMN)
      if (right) mark(row, edge.right - 1, COLUMN)
    }
    if (upper && left) mark(edge.top, edge.left, CORNER)
    if (upper && right) mark(edge.top, edge.right - 1, CORNER)
    if (lower && left) mark(edge.bottom - 1, edge.left, CORNER)
    if (lower && right) mark(edge.bottom - 1, edge.right - 1, CORNER)
  }

  return { kind, owner, top }
}

// The page's colours for each cell under the current theme.
function colours({ kind, owner, top }: Probe): Colours {
  const root = getComputedStyle(document.documentElement)
  const inks = new Map<Element, string>()
  const surfaces = new Map<Element, string>()
  const inkOf = (element: Element | null, cell: number) => {
    if (!element) return root.color
    if (kind[cell] >= ROW) return getComputedStyle(element).borderTopColor
    if (!inks.has(element)) inks.set(element, getComputedStyle(element).color)
    return inks.get(element)!
  }
  // The nearest opaque background at or above the element on top.
  const surfaceOf = (element: Element | null) => {
    if (!element) return root.backgroundColor
    if (!surfaces.has(element)) {
      let color = root.backgroundColor
      for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
        const background = getComputedStyle(ancestor).backgroundColor
        if (opaque(background)) {
          color = background
          break
        }
      }
      surfaces.set(element, color)
    }
    return surfaces.get(element)!
  }
  return {
    ink: owner.map((element, cell) => inkOf(element, cell)),
    bg: top.map(surfaceOf),
    accent: root.getPropertyValue('--k-color-accent-box')
  }
}

// A cheap per-cell, per-tick hash in [0, 1), so each glyph re-rolls on its own.
function noise(cell: number, tick: number) {
  let hash = Math.imul(cell ^ Math.imul(tick, 0x9e3779b1), 0x85ebca6b)
  hash ^= hash >>> 13
  return (Math.imul(hash, 0xc2b2ae35) >>> 0) / 4294967296
}

export function switchTheme(theme: Theme, origin: { x: number; y: number }) {
  if (running) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('startViewTransition' in document)) {
    setTheme(theme)
    return
  }
  running = true

  // About 144 columns at any width, so the cost of a frame stays flat.
  const cellW = Math.max(8, Math.round(innerWidth / 144))
  const cellH = Math.round(cellW * 1.6)
  const grid = { cols: Math.ceil(innerWidth / cellW), rows: Math.ceil(innerHeight / cellH), cellW, cellH }
  // Colour transitions pause (base.css), so both colour reads and the live new view get final colours.
  document.documentElement.dataset.themeSwitch = ''
  const cells = probe(grid)
  const before = colours(cells)
  let after = before

  // The canvas exists only in the new view, so its capture stays live and draws on top of everything.
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;view-transition-name:theme-ascii'
  const transition = document.startViewTransition(() => {
    flushSync(() => setTheme(theme))
    after = colours(cells)
    document.body.append(canvas)
  })
  transition.ready.then(
    () => play(canvas, grid, origin, cells.kind, before, after),
    () => {}
  )
  transition.finished.finally(() => {
    canvas.remove()
    delete document.documentElement.dataset.themeSwitch
    running = false
  })
}

function play(
  canvas: HTMLCanvasElement,
  { cols, rows, cellW, cellH }: Grid,
  origin: { x: number; y: number },
  kinds: Uint8Array,
  before: Colours,
  after: Colours
) {
  const width = cols * cellW
  const height = rows * cellH
  const dpr = Math.min(devicePixelRatio, 2)
  canvas.width = innerWidth * dpr
  canvas.height = innerHeight * dpr
  const context = canvas.getContext('2d')!
  context.scale(dpr, dpr)
  context.font = `${cellH - 3}px 'Atkinson Hyperlegible Mono', monospace`
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  // The ring's edges and its seam dither on a 4x4 Bayer matrix.
  const far = Math.max(
    Math.hypot(origin.x, origin.y),
    Math.hypot(width - origin.x, origin.y),
    Math.hypot(origin.x, height - origin.y),
    Math.hypot(width - origin.x, height - origin.y)
  )
  const band = Math.min(cellH * 26, Math.max(cellH * 10, far * 0.3))
  const distance = new Float32Array(cols * rows)
  const seam = new Float32Array(cols * rows)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dither = BAYER[(row % 4) * 4 + (col % 4)] / 16 - 0.5
      distance[row * cols + col] =
        Math.hypot((col + 0.5) * cellW - origin.x, (row + 0.5) * cellH - origin.y) + dither * cellH * 2
      seam[row * cols + col] = 0.5 + dither * 0.16
    }
  }

  // The new view's clip trails the ring's leading edge by half the band, so it always sits under solid cells.
  const travel = far + band + cellH * 2
  const at = `at ${origin.x}px ${origin.y}px`
  const animation = document.documentElement.animate(
    {
      clipPath: [`circle(0px ${at})`, `circle(0px ${at})`, `circle(${travel - band / 2}px ${at})`],
      offset: [0, band / 2 / travel, 1]
    },
    { duration: DURATION_MS, fill: 'forwards', pseudoElement: '::view-transition-new(root)' }
  )

  requestAnimationFrame(function frame() {
    const elapsed = animation.currentTime as number | null
    if (elapsed === null || animation.playState === 'finished') return
    const radius = (elapsed / DURATION_MS) * travel
    const tick = Math.floor(elapsed / TICK_MS)
    context.clearRect(0, 0, width, height)
    // Backgrounds first, then glyphs, so neighbouring cells rarely switch fill colour.
    const ring: number[] = []
    let fill = ''
    for (let cell = 0; cell < cols * rows; cell++) {
      const depth = (radius - distance[cell]) / band
      if (depth < 0 || depth > 1) continue
      ring.push(cell)
      const bg = (depth > seam[cell] ? after : before).bg[cell]
      if (bg !== fill) context.fillStyle = fill = bg
      context.fillRect((cell % cols) * cellW, Math.floor(cell / cols) * cellH, cellW, cellH)
    }
    let alpha = 1
    for (const cell of ring) {
      const depth = (radius - distance[cell]) / band
      const page = depth > seam[cell] ? after : before
      const kind = kinds[cell]
      const rim = Math.abs(depth - seam[cell]) < 0.04
      const random = noise(cell, tick)
      // Sparse at the ring's edges, densest at the seam; the hash shimmers each cell a few steps along the ramp.
      const level = rim
        ? 0.7 + random * 0.3
        : DENSITY[kind] * (0.4 + 0.6 * Math.sin(Math.PI * depth)) + (random - 0.5) * 0.25
      const glyph =
        kind >= ROW && !rim
          ? BORDER_GLYPHS[kind]
          : RAMP[Math.round((1 - Math.min(1, Math.max(0, level))) * (RAMP.length - 1))]
      if (glyph === ' ') continue
      const ink = rim ? page.accent : page.ink[cell]
      const opacity = kind === EMPTY && !rim ? 0.4 : 1
      if (ink !== fill) context.fillStyle = fill = ink
      if (opacity !== alpha) context.globalAlpha = alpha = opacity
      context.fillText(glyph, ((cell % cols) + 0.5) * cellW, (Math.floor(cell / cols) + 0.5) * cellH)
    }
    context.globalAlpha = 1
    requestAnimationFrame(frame)
  })
}
