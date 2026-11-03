import { useCurrentFrame } from 'remotion'
import { ramp, type Box } from './ease'

export type RingName = 'ring-wide' | 'ring-box' | 'ring-small' | 'ring-circle'

// The pack's ring look (graphics/overlays.html .ring) at half its weight, as the user asked: a 4 px yellow band
// between two 2 px ink lines. Drawing it as CSS at the box's size keeps the stroke constant at any aspect, with no
// image to load.
const RADIUS: Record<RingName, string> = {
  'ring-wide': '22px',
  'ring-box': '26px',
  'ring-small': '18px',
  'ring-circle': '50%'
}
const BAND = 4
const INK = 2

/**
 * A ring around `box` + `pad`: scales 0.85 to 1 about its centre and fades in over 6 frames; fades out over 6 frames
 * ending at `to`. ring-circle passes through the padded box's corners, so it never cuts across what it circles.
 */
export const Ring: React.FC<{ name: RingName; box: Box; from: number; to: number; pad?: number }> = ({
  name,
  box,
  from,
  to,
  pad = 12
}) => {
  const frame = useCurrentFrame()
  if (frame < from || frame >= to) return null
  const enter = ramp(frame, from, 6)
  const around = name === 'ring-circle' ? Math.SQRT2 : 1
  const width = (box.width + 2 * pad) * around + 2 * BAND
  const height = (box.height + 2 * pad) * around + 2 * BAND
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x + box.width / 2 - width / 2,
        top: box.y + box.height / 2 - height / 2,
        width,
        height,
        boxSizing: 'border-box',
        border: `${BAND}px solid #f6d732`,
        outline: `${INK}px solid #191812`,
        outlineOffset: 0,
        boxShadow: `inset 0 0 0 ${INK}px #191812`,
        borderRadius: RADIUS[name],
        scale: 0.85 + 0.15 * enter,
        opacity: Math.min(enter, 1 - ramp(frame, to - 6, 6))
      }}
    />
  )
}
