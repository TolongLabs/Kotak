import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion'
import { ramp } from './ease'

export type ResultName = 'r-d5-plan' | 'r-d6-moved'

/** Dims the frame to 45% #10100B and scales the card from 92% about the frame centre, both over 10 frames; both fade out over 8 frames ending at `to`. */
export const ResultCard: React.FC<{ name: ResultName; from: number; to: number }> = ({ name, from, to }) => {
  const frame = useCurrentFrame()
  if (frame < from || frame >= to) return null
  const enter = ramp(frame, from, 10)
  const opacity = Math.min(enter, 1 - ramp(frame, to - 8, 8))
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: '#10100B', opacity: 0.45 * opacity }} />
      <AbsoluteFill style={{ scale: 0.92 + 0.08 * enter, opacity }}>
        <Img src={staticFile(`graphics/${name}.png`)} style={{ width: 1920, height: 1080 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
