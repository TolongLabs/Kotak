import './fonts'
import { Composition } from 'remotion'
import { DEMO_FRAMES, Demo } from './Demo'
import { H1, H1_FRAMES } from './H1'
import { MOTION_PREVIEW_FRAMES, MotionPreview } from './motion'

export const Root = () => (
  <>
    <Composition id="Demo" component={Demo} durationInFrames={DEMO_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="H1" component={H1} durationInFrames={H1_FRAMES} fps={30} width={1920} height={1080} />
    <Composition
      id="MotionPreview"
      component={MotionPreview}
      durationInFrames={MOTION_PREVIEW_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
)
