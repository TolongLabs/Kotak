import { Img, staticFile, useCurrentFrame } from 'remotion'
import { ramp, type Box } from './ease'

export type ArrowDir = 'right' | 'down' | 'left' | 'up'

const SIZE = 220
// Where each 220×220 arrow PNG's tip sits, measured from its alpha bounds.
const TIP_NEAR = 19
const TIP_FAR = 201
const SLIDE = 24

/** Top-left of the PNG so its tip is `gap` px outside the box edge it points at, centred on that edge. */
function place(dir: ArrowDir, box: Box, gap: number): { left: number; top: number } {
  const midX = box.x + box.width / 2 - SIZE / 2
  const midY = box.y + box.height / 2 - SIZE / 2
  if (dir === 'right') return { left: box.x - gap - TIP_FAR, top: midY }
  if (dir === 'left') return { left: box.x + box.width + gap - TIP_NEAR, top: midY }
  if (dir === 'down') return { left: midX, top: box.y - gap - TIP_FAR }
  return { left: midX, top: box.y + box.height + gap - TIP_NEAR }
}

const STEP: Record<ArrowDir, [number, number]> = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }

/** Points at `box` from the side it points from; slides 24 px toward it while fading in over 8 frames, fades out over 6 frames ending at `to`. */
export const Arrow: React.FC<{ dir: ArrowDir; box: Box; from: number; to: number; gap?: number }> = ({
  dir,
  box,
  from,
  to,
  gap = 12
}) => {
  const frame = useCurrentFrame()
  if (frame < from || frame >= to) return null
  const enter = ramp(frame, from, 8)
  const { left, top } = place(dir, box, gap)
  const [dx, dy] = STEP[dir]
  const back = (1 - enter) * SLIDE
  return (
    <Img
      src={staticFile(`graphics/arrow-${dir}.png`)}
      style={{
        position: 'absolute',
        left: left - dx * back,
        top: top - dy * back,
        width: SIZE,
        height: SIZE,
        opacity: Math.min(enter, 1 - ramp(frame, to - 6, 6))
      }}
    />
  )
}
