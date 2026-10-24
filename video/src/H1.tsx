import { Video } from '@remotion/media'
import { AbsoluteFill, Freeze, staticFile } from 'remotion'
import { FPS, cue, shot } from './lib'
import { SampleTag } from './motion'
import { C } from './theme'

// Shot H1 for V4: the finished roadmap at rest, then a slow scroll that reaches the funding card near the end.
export const H1_FRAMES = 12 * FPS
const TITLE_AT = 0.5
const FUNDING_AT = 10.8

export const H1 = () => {
  const s = shot('H1')
  const a = cue('H1', 'roadmap-title')
  const b = cue('H1', 'funding-card')
  const rate = Math.min(2, Math.max(0.75, (b - a) / (FUNDING_AT - TITLE_AT)))
  const srcIn = Math.max(0, a - TITLE_AT * rate)
  const live = Math.floor(((s.seconds + 3.9 - srcIn) / rate) * FPS)
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Freeze frame={live} active={(f) => f >= live}>
        <Video
          src={staticFile(s.src)}
          trimBefore={Math.round(srcIn * FPS)}
          playbackRate={rate}
          muted
          style={{ width: 1920, height: 1080 }}
        />
      </Freeze>
      <SampleTag />
    </AbsoluteFill>
  )
}
