import { AbsoluteFill, Sequence } from 'remotion'
import { ActBanner } from './ActBanner'
import { Arrow } from './Arrow'
import { Callout } from './Callout'
import type { Box } from './ease'
import { Hud } from './Hud'
import { ResultCard } from './ResultCard'
import { Ring } from './Ring'
import { SampleTag } from './SampleTag'

/** Length of MotionPreview at 30 fps: every component once, then the sample tag alone. */
export const MOTION_PREVIEW_FRAMES = 660

const WIDE: Box = { x: 160, y: 420, width: 520, height: 64 }
const CARD: Box = { x: 760, y: 360, width: 420, height: 260 }
const CHIP: Box = { x: 1300, y: 430, width: 120, height: 40 }
const RADAR: Box = { x: 260, y: 300, width: 360, height: 360 }
const TARGET: Box = { x: 860, y: 430, width: 200, height: 120 }

// A dashed outline where a capture's element would be, to check ring and arrow placement.
const Target: React.FC<{ box: Box }> = ({ box }) => (
  <div
    style={{
      position: 'absolute',
      left: box.x,
      top: box.y,
      width: box.width,
      height: box.height,
      boxSizing: 'border-box',
      border: '2px dashed #ffffff',
      background: 'rgba(255, 255, 255, 0.25)'
    }}
  />
)

/** Every motion component on a grey frame, 1920×1080 at 30 fps. */
export const MotionPreview: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#9a9a92' }}>
    <Sequence from={0} durationInFrames={540} name="Targets 1">
      <Target box={WIDE} />
      <Target box={CARD} />
      <Target box={CHIP} />
    </Sequence>
    <Sequence from={360} durationInFrames={180} name="Targets 2">
      <Target box={RADAR} />
      <Target box={TARGET} />
    </Sequence>

    <Ring name="ring-wide" box={WIDE} from={20} to={110} />
    <Ring name="ring-box" box={CARD} from={60} to={150} />
    <Ring name="ring-small" box={CHIP} from={100} to={190} />
    <Ring name="ring-circle" box={RADAR} from={380} to={470} />
    <Arrow dir="right" box={TARGET} from={360} to={420} />
    <Arrow dir="down" box={TARGET} from={390} to={450} />
    <Arrow dir="left" box={TARGET} from={420} to={480} />
    <Arrow dir="up" box={TARGET} from={450} to={510} />

    <Callout name="c-d1-who" from={30} to={150} />
    <Callout name="c-d3-radar" from={160} to={250} />
    <ResultCard name="r-d5-plan" from={260} to={350} />
    <ResultCard name="r-d6-moved" from={450} to={540} />

    <ActBanner name="act-1-problem" from={0} />
    <ActBanner name="act-2-solution" from={190} />
    <ActBanner name="act-3-outcome" from={360} />

    <Sequence from={0} durationInFrames={540} name="HUD">
      <Hud
        steps={[
          { step: 1, from: 0 },
          { step: 2, from: 60 },
          { step: 3, from: 120 },
          { step: 4, from: 190 },
          { step: 5, from: 260 },
          { step: 6, from: 360 },
          { step: 7, from: 420 },
          { step: 8, from: 480 }
        ]}
      />
    </Sequence>
    <Sequence from={540} durationInFrames={120} name="Sample tag alone">
      <SampleTag />
    </Sequence>
  </AbsoluteFill>
)
