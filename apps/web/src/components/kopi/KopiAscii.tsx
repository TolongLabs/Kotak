import { useEffect, useRef, useState } from 'react'
import type { KopiPose } from './poses'

// Kopi's entrance (DESIGN.md "Motion"), after ascii-magic.com's image-to-ASCII looks: the pose art rebuilt from glyphs
// that rise row by row from the bottom. Each cell scrambles in the text colour, then settles on the glyph for its
// density in the art's own colour. The settled glyphs stay on screen until the caller hands over to Live2D.
const RAMP = ' .:-=+*#%@'
const SCRAMBLE = '01<>/\\|[]{}=+*?'
const ART_WIDTH = 561
const ART_HEIGHT = 731
const CELL_PX = 7 // about 7 px glyphs stay legible as glyphs at Kopi's usual 80–250 px heights
const RISE_MS = 440 // the bottom row starts at 0 ms, the top row at RISE_MS
const JITTER_MS = 60
const SCRAMBLE_MS = 120
const GLYPH_MS = 80 // a scrambling glyph holds ~12 frames a second, well under flicker rates
const END_MS = RISE_MS + JITTER_MS + SCRAMBLE_MS
const FONT = '"Atkinson Hyperlegible Mono", ui-monospace, monospace'
// A font request that never answers (a stalled connection) counts as failed after the questions' font cap (#394). The
// wait is shared, so a Kopi that mounts after the cap (the questions' own, once the loading line goes) doesn't wait again.
const FONT_WAIT_MS = 3000
let fontWait: Promise<unknown> | undefined

interface Cell {
  x: number
  y: number
  start: number
  glyph: string
  color: string
  seed: number
}

export interface KopiAsciiProps {
  pose: KopiPose
  // Draw the glyphs already settled, for a second Kopi on a page whose entrance has played.
  instant?: boolean
  onSettled: () => void
}

export function KopiAscii({ pose, instant = false, onSettled }: KopiAsciiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onSettledRef = useRef(onSettled)
  const [startSettled] = useState(instant)

  useEffect(() => {
    onSettledRef.current = onSettled
  }, [onSettled])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let frame = 0
    let cancelled = false
    // Any failure just lets Kopi appear; the entrance never holds him back.
    const finish = () => {
      if (!cancelled) onSettledRef.current()
    }

    const image = new Image()
    image.src = `/kopi/${pose}.png`
    fontWait ??= Promise.race([
      document.fonts.load(`500 ${CELL_PX}px ${FONT}`).catch(() => []),
      new Promise((resolve) => window.setTimeout(resolve, FONT_WAIT_MS))
    ])
    Promise.all([image.decode(), fontWait])
      .then(() => {
        if (cancelled) return
        try {
          play(canvas, image)
        } catch {
          finish()
        }
      })
      .catch(finish)

    function play(target: HTMLCanvasElement, art: HTMLImageElement) {
      const { clientWidth: width, clientHeight: height } = target
      const context = target.getContext('2d')
      if (!context || width < 1 || height < 1) return finish()

      const ratio = window.devicePixelRatio || 1
      target.width = Math.round(width * ratio)
      target.height = Math.round(height * ratio)
      context.scale(ratio, ratio)

      // Monospace glyphs are about 0.6 em wide. The art is sampled where object-contain draws it.
      const rows = Math.max(10, Math.round(height / CELL_PX))
      const cellHeight = height / rows
      const cols = Math.max(1, Math.round(width / (cellHeight * 0.6)))
      const cellWidth = width / cols
      const scale = Math.min(width / ART_WIDTH, height / ART_HEIGHT)
      const sample = document.createElement('canvas')
      sample.width = cols
      sample.height = rows
      const sampler = sample.getContext('2d', { willReadFrequently: true })
      if (!sampler) return finish()
      sampler.drawImage(
        art,
        (width - ART_WIDTH * scale) / 2 / cellWidth,
        (height - ART_HEIGHT * scale) / 2 / cellHeight,
        (ART_WIDTH * scale) / cellWidth,
        (ART_HEIGHT * scale) / cellHeight
      )
      const pixels = sampler.getImageData(0, 0, cols, rows).data

      // The cat is mostly one dark tone, so density follows the art's own light range rather than black-to-white.
      const opaque: { i: number; alpha: number; rgb: number[]; light: number }[] = []
      for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3]! / 255
        if (alpha < 0.1) continue
        const rgb = [pixels[i]!, pixels[i + 1]!, pixels[i + 2]!].map((value) => Math.min(255, value / alpha))
        opaque.push({ i: i / 4, alpha, rgb, light: (0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!) / 255 })
      }
      if (opaque.length === 0) return finish()
      const lights = opaque.map((cell) => cell.light)
      const darkest = Math.min(...lights)
      const range = Math.max(Math.max(...lights) - darkest, 0.05)

      const cells: Cell[] = opaque.map(({ i, alpha, rgb, light }) => {
        const row = Math.floor(i / cols)
        const density = alpha * (0.25 + 0.75 * (1 - (light - darkest) / range))
        return {
          x: (i % cols) * cellWidth,
          y: row * cellHeight,
          start: ((rows - 1 - row) / (rows - 1)) * RISE_MS + Math.random() * JITTER_MS,
          glyph: RAMP[Math.max(1, Math.round(density * (RAMP.length - 1)))]!,
          color: `rgb(${rgb.map(Math.round).join(' ')})`,
          seed: Math.floor(Math.random() * SCRAMBLE.length)
        }
      })

      context.font = `500 ${cellHeight}px ${FONT}`
      context.textBaseline = 'top'
      // Scrambling glyphs use the text colour so they read on dark surfaces, where the black cat's own tone wouldn't.
      const scrambleColor = getComputedStyle(target).color
      const began = performance.now() - (startSettled ? END_MS : 0)

      const draw = (now: number) => {
        const elapsed = now - began
        context.clearRect(0, 0, width, height)
        for (const cell of cells) {
          if (elapsed < cell.start) continue
          const settled = elapsed >= cell.start + SCRAMBLE_MS
          context.fillStyle = settled ? cell.color : scrambleColor
          context.fillText(
            settled ? cell.glyph : SCRAMBLE[(cell.seed + Math.floor(elapsed / GLYPH_MS)) % SCRAMBLE.length]!,
            cell.x,
            cell.y
          )
        }
        if (elapsed < END_MS) frame = requestAnimationFrame(draw)
        else finish()
      }
      frame = requestAnimationFrame(draw)
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [pose, startSettled])

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full text-text-primary" />
}
