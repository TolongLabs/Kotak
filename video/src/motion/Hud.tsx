import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion'
import { ramp } from './ease'

export type HudStep = { step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; from: number }

const FADE = 6

const HudImage: React.FC<{ step: HudStep['step']; opacity: number }> = ({ step, opacity }) => (
  <AbsoluteFill style={{ opacity }}>
    <Img src={staticFile(`graphics/hud-${step}.png`)} style={{ width: 1920, height: 1080 }} />
  </AbsoluteFill>
)

/**
 * The progress bar for the whole demo: hud-<step> of the latest step that has started. Each next step fades in over
 * 6 frames on top of the previous one, which stays opaque underneath, so the bar never dims mid-crossfade.
 */
export const Hud: React.FC<{ steps: HudStep[] }> = ({ steps }) => {
  const frame = useCurrentFrame()
  const started = steps.filter((item) => item.from <= frame).sort((a, b) => a.from - b.from)
  const now = started.at(-1)
  if (!now) return null
  const previous = started.at(-2)
  const fadeIn = ramp(frame, now.from, FADE)
  return (
    <AbsoluteFill>
      {previous && fadeIn < 1 ? <HudImage step={previous.step} opacity={1} /> : null}
      <HudImage step={now.step} opacity={fadeIn} />
    </AbsoluteFill>
  )
}
