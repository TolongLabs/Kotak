import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../components/kopi/motion'

// The footer's full-width wordmark (DESIGN.md "Motion"), after mkdir.directory's wordmark footer and footer.design's
// ASCII footers: "kotak" set in Next ExtraBold, sampled per cell and redrawn from the density ramp the theme wave and
// Kopi's entrance use. It holds still in the text colour; glyphs under a mouse scramble in the accent and settle back.
const WORD = 'kotak'
const RAMP = ' .:-=+*#%@'
const SCRAMBLE = '01<>/\\|[]{}=+*?'
const SANS = '"Atkinson Hyperlegible Next", system-ui, sans-serif'
const MONO = '"Atkinson Hyperlegible Mono", ui-monospace, monospace'
const RADIUS = 7 // in cell heights around the pointer
const SETTLE_MS = 700
const GLYPH_MS = 80 // a scrambling glyph holds ~12 frames a second, well under flicker rates

interface Grid {
  cols: number
  rows: number
  cellWidth: number
  cellHeight: number
  glyphs: string[] // '' for empty cells
}

// Fits the word to the width, then reads each cell's ink coverage. A random nudge mixes # % @ through the solid strokes.
function sample(width: number): Grid | null {
  const cellHeight = Math.min(16, Math.max(8, width / 100))
  const cols = Math.floor(width / (cellHeight * 0.6))
  const cellWidth = width / cols

  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return null
  probe.font = `800 100px ${SANS}`
  const metrics = probe.measureText(WORD)
  const scale = width / (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight)
  const rows = Math.ceil(((metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) * scale) / cellHeight)
  const height = Math.ceil(rows * cellHeight)

  const ink = document.createElement('canvas')
  ink.width = Math.ceil(width)
  ink.height = height
  const context = ink.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.font = `800 ${100 * scale}px ${SANS}`
  context.fillText(WORD, metrics.actualBoundingBoxLeft * scale, metrics.actualBoundingBoxAscent * scale)
  const alpha = context.getImageData(0, 0, ink.width, ink.height).data

  const glyphs: string[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = Math.floor(col * cellWidth)
      const x1 = Math.min(ink.width, Math.floor((col + 1) * cellWidth))
      const y0 = Math.floor(row * cellHeight)
      const y1 = Math.min(height, Math.floor((row + 1) * cellHeight))
      let sum = 0
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) sum += alpha[(y * ink.width + x) * 4 + 3]!
      const coverage = sum / 255 / Math.max(1, (x1 - x0) * (y1 - y0))
      const density = Math.max(0, coverage - 0.3 * Math.random())
      glyphs.push(coverage < 0.12 ? '' : RAMP[Math.max(1, Math.round(density * (RAMP.length - 1)))]!)
    }
  }
  return { cols, rows, cellWidth, cellHeight, glyphs }
}

export function FooterWordmark({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { reduced } = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    let grid: Grid | null = null
    let width = 0
    let colors = { settled: '', scramble: '' }
    let heat = new Float32Array(0) // 1 when the pointer passes, falling to 0 over SETTLE_MS
    let seeds = new Uint8Array(0)
    let frame = 0
    let resizeFrame = 0
    let last = 0
    let cancelled = false

    const draw = (now: number) => {
      if (!grid) return
      const { cols, cellWidth, cellHeight, glyphs } = grid
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.font = `500 ${cellHeight}px ${MONO}`
      context.textBaseline = 'top'
      const tick = Math.floor(now / GLYPH_MS)
      for (let i = 0; i < glyphs.length; i++) {
        const glyph = glyphs[i]!
        if (!glyph) continue
        const hot = heat[i]! > 0.15
        context.fillStyle = hot ? colors.scramble : colors.settled
        context.fillText(
          hot ? SCRAMBLE[(seeds[i]! + tick) % SCRAMBLE.length]! : glyph,
          (i % cols) * cellWidth,
          Math.floor(i / cols) * cellHeight
        )
      }
    }

    const animate = (now: number) => {
      const elapsed = last ? now - last : 16
      last = now
      let warm = false
      for (let i = 0; i < heat.length; i++) {
        if (heat[i]! <= 0) continue
        heat[i] = Math.max(0, heat[i]! - elapsed / SETTLE_MS)
        warm = true
      }
      draw(now)
      frame = warm ? requestAnimationFrame(animate) : 0
      if (!warm) last = 0
    }

    const readColors = () => {
      const style = getComputedStyle(canvas)
      colors = { settled: style.color, scramble: style.getPropertyValue('--color-accent-box') }
    }

    const layout = () => {
      const next = canvas.parentElement?.clientWidth ?? 0
      if (next < 1 || next === width) return
      width = next
      grid = sample(width)
      if (!grid) return
      const height = grid.rows * grid.cellHeight
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      canvas.style.height = `${height}px`
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      heat = new Float32Array(grid.glyphs.length)
      seeds = Uint8Array.from(grid.glyphs, () => Math.floor(Math.random() * SCRAMBLE.length))
      readColors()
      draw(performance.now())
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!grid || event.pointerType !== 'mouse') return
      const bounds = canvas.getBoundingClientRect()
      const px = (event.clientX - bounds.left) / grid.cellWidth
      const py = (event.clientY - bounds.top) / grid.cellHeight
      // Cells are taller than wide, so the radius is measured in cell heights to keep the patch round.
      const reachX = Math.ceil((RADIUS * grid.cellHeight) / grid.cellWidth)
      for (let row = Math.max(0, Math.floor(py - RADIUS)); row < Math.min(grid.rows, py + RADIUS); row++) {
        for (let col = Math.max(0, Math.floor(px - reachX)); col < Math.min(grid.cols, px + reachX); col++) {
          const distance = Math.hypot(((col + 0.5 - px) * grid.cellWidth) / grid.cellHeight, row + 0.5 - py) / RADIUS
          const i = row * grid.cols + col
          if (distance < 1) heat[i] = Math.max(heat[i]!, 1 - distance * distance)
        }
      }
      if (!frame) {
        readColors()
        frame = requestAnimationFrame(animate)
      }
    }

    // The word waits for its face; a fallback font would set a different wordmark, so it stays blank instead.
    // load() resolves to no faces when the face isn't in the document (fonts.check() would still say true).
    let fontReady = false
    Promise.all([document.fonts.load(`800 100px ${SANS}`), document.fonts.load(`500 12px ${MONO}`)])
      .then(([faces]) => {
        fontReady = faces.length > 0
        if (!cancelled && fontReady) layout()
      })
      .catch(() => {})

    // Only width changes re-sample; the canvas setting its own height would otherwise call back.
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => {
        if (fontReady) layout()
      })
    })
    if (canvas.parentElement) resize.observe(canvas.parentElement)
    if (!reduced) canvas.addEventListener('pointermove', onPointerMove)

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      cancelAnimationFrame(resizeFrame)
      resize.disconnect()
      canvas.removeEventListener('pointermove', onPointerMove)
    }
  }, [reduced])

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />
}
