import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion'
import { ramp } from './ease'

export type ActName = 'act-1-problem' | 'act-2-solution' | 'act-3-outcome'

const SLIDE = 12
const HOLD = 75
const FADE = 8
/** Frames from `from` until the banner is gone. */
export const ACT_BANNER_FRAMES = SLIDE + HOLD + FADE

/** Slides in from 700 px to the left over 12 frames, holds 2.5 s, fades out over 8 frames. */
export const ActBanner: React.FC<{ name: ActName; from: number }> = ({ name, from }) => {
  const t = useCurrentFrame() - from
  if (t < 0 || t >= ACT_BANNER_FRAMES) return null
  return (
    <AbsoluteFill
      style={{
        translate: `${(ramp(t, 0, SLIDE) - 1) * 700}px 0px`,
        opacity: 1 - ramp(t, SLIDE + HOLD, FADE)
      }}
    >
      <Img src={staticFile(`graphics/${name}.png`)} style={{ width: 1920, height: 1080 }} />
    </AbsoluteFill>
  )
}
