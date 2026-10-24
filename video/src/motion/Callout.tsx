import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion'
import { ramp } from './ease'

// Every c-* card in the pack ends at the same bottom-right corner, so scaling about it keeps each card in its corner.
const CARD_CORNER = '1874px 950px'

/**
 * A full-frame callout (c-*): in from 60 px right over 10 frames, out over 6 frames ending at `to`. Children ride in
 * the same moving layer, for the day's numbers set on c-blank. `scale` shrinks the card toward its bottom-right
 * corner; `x` and `y` move it, in px, to blank space on the page.
 */
export const Callout: React.FC<{
  name: string
  from: number
  to: number
  scale?: number
  x?: number
  y?: number
  children?: React.ReactNode
}> = ({ name, from, to, scale = 1, x = 0, y = 0, children }) => {
  const frame = useCurrentFrame()
  if (frame < from || frame >= to) return null
  const enter = ramp(frame, from, 10)
  return (
    <AbsoluteFill
      style={{
        translate: `${x + (1 - enter) * 60}px ${y}px`,
        scale,
        transformOrigin: CARD_CORNER,
        opacity: Math.min(enter, 1 - ramp(frame, to - 6, 6))
      }}
    >
      <Img src={staticFile(`graphics/${name}.png`)} style={{ width: 1920, height: 1080 }} />
      {children}
    </AbsoluteFill>
  )
}
