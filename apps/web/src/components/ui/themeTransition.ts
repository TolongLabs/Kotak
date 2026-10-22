import { setTheme, type Theme } from './theme'

// The theme switch renders like ASCII art (after ascii-magic.com): a dithered wave of glyphs spreads from the toggle and
// climbs a density ramp until each cell is solid in the new background, the theme swaps underneath, then the cells
// fall back down the ramp. Reduced motion, and browsers without popovers, swap at once.
const RAMP = ' .:-=+*#%@'
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const CELL_W = 10
const CELL_H = 16
const WAVE_MS = 420
const CELL_MS = 140
const HOLD_MS = 80

let running = false

// Reads the incoming theme's colours by flipping the attribute and back in one task, so nothing paints in between.
function colorsOf(theme: Theme) {
  const root = document.documentElement
  const current = root.dataset.theme
  root.dataset.theme = theme
  const style = getComputedStyle(root)
  const colors = {
    bg: style.getPropertyValue('--k-color-bg-default'),
    accent: style.getPropertyValue('--k-color-accent-box')
  }
  if (current) root.dataset.theme = current
  return colors
}

export function switchTheme(theme: Theme, origin: { x: number; y: number }) {
  if (running) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('showPopover' in HTMLElement.prototype)) {
    return setTheme(theme)
  }
  running = true

  const { bg, accent } = colorsOf(theme)
  const width = innerWidth
  const height = innerHeight
  const cols = Math.ceil(width / CELL_W)
  const rows = Math.ceil(height / CELL_H)

  // A manual popover sits in the top layer, so the wave also covers the open menu drawer.
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.popover = 'manual'
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;margin:0;padding:0;border:0;background:transparent;pointer-events:none'
  canvas.width = width * devicePixelRatio
  canvas.height = height * devicePixelRatio
  document.body.append(canvas)
  canvas.showPopover()

  const context = canvas.getContext('2d')!
  context.scale(devicePixelRatio, devicePixelRatio)
  context.font = `${CELL_H - 2}px 'Atkinson Hyperlegible Mono', monospace`
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  // Each cell starts by its distance from the toggle, nudged by a 4x4 Bayer matrix so the wavefront dithers.
  const far = Math.max(
    Math.hypot(origin.x, origin.y),
    Math.hypot(width - origin.x, origin.y),
    Math.hypot(origin.x, height - origin.y),
    Math.hypot(width - origin.x, height - origin.y)
  )
  const delays = new Float32Array(cols * rows)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const distance = Math.hypot((col + 0.5) * CELL_W - origin.x, (row + 0.5) * CELL_H - origin.y) / far
      delays[row * cols + col] = (0.8 * distance + (0.2 * BAYER[(row % 4) * 4 + (col % 4)]) / 16) * WAVE_MS
    }
  }

  const phaseMs = WAVE_MS + CELL_MS
  const start = performance.now()
  let swapped = false

  requestAnimationFrame(function frame(now) {
    const elapsed = now - start
    const covering = elapsed < phaseMs + HOLD_MS
    if (!covering && !swapped) {
      setTheme(theme)
      swapped = true
    }
    if (elapsed >= 2 * phaseMs + HOLD_MS) {
      canvas.remove()
      running = false
      return
    }

    const phaseElapsed = covering ? elapsed : elapsed - phaseMs - HOLD_MS
    context.clearRect(0, 0, width, height)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const rise = Math.min(1, Math.max(0, (phaseElapsed - delays[row * cols + col]) / CELL_MS))
        const level = covering ? rise : 1 - rise
        if (level >= 1) {
          context.fillStyle = bg
          context.fillRect(col * CELL_W, row * CELL_H, CELL_W, CELL_H)
          continue
        }
        const glyph = RAMP[Math.floor(level * RAMP.length)]
        if (glyph === ' ') continue
        // The thin end of the ramp glows in the accent, like the leading edge of a character bloom.
        context.fillStyle = level < 0.4 ? accent : bg
        context.fillText(glyph, (col + 0.5) * CELL_W, (row + 0.5) * CELL_H)
      }
    }
    requestAnimationFrame(frame)
  })
}
