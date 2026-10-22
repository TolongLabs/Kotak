import { useEffect, useRef, useState } from 'react'
import { cn } from '../ui/cn'
import { KopiAscii } from './KopiAscii'
import { mountKopiStage, type KopiStage } from './live2d'
import { useReducedMotion } from './motion'
import type { KopiPose } from './poses'

// One entrance per page visit. A page's loading Kopi and its results Kopi are different elements: whichever finishes
// the entrance first marks the visit, so the other arrives without replaying it. Navigation lets it play again.
let enteredThisVisit = false
if (typeof window !== 'undefined') {
  const resetEntrance = () => {
    enteredThisVisit = false
  }
  window.addEventListener('popstate', resetEntrance)
  // Must match NAVIGATE_EVENT in app/router.tsx.
  window.addEventListener('kotak:navigate', resetEntrance)
}

export interface KopiFigureProps {
  pose: KopiPose
  // Size the figure with a height class; the width follows the pose art's aspect ratio.
  className?: string
}

// Kopi as the Live2D model when it loads; otherwise, and always under reduced motion, the static pose art. Kopi
// arrives through the ASCII entrance (KopiAscii), which hands over to the art; Live2D then loads and fades in on top.
// Reduced motion skips the entrance and Live2D.
export function KopiFigure({ pose, className }: KopiFigureProps) {
  const { reduced } = useReducedMotion()
  const host = useRef<HTMLDivElement>(null)
  const stage = useRef<KopiStage | null>(null)
  const poseRef = useRef(pose)
  const [live, setLive] = useState(false)
  // The art stays opaque under Live2D until the live cat has faded in, so the cross-fade never shows through.
  const [liveShown, setLiveShown] = useState(false)
  const [entrance, setEntrance] = useState<'playing' | 'handover' | 'done'>(
    reduced || enteredThisVisit ? 'done' : 'playing'
  )
  const [entrancePose] = useState(pose)
  const entered = reduced || entrance !== 'playing'

  useEffect(() => {
    poseRef.current = pose
    stage.current?.setPose(pose)
  }, [pose])

  // A pose change mid-entrance (a quick answer on Questions) hands straight over; the art cross-fades to the new pose.
  useEffect(() => {
    if (entrance !== 'playing' || pose === entrancePose) return
    enteredThisVisit = true
    setEntrance('handover')
  }, [pose, entrance, entrancePose])

  // Live2D starts once the entrance is over, so its WebGL setup can't stutter the animation.
  useEffect(() => {
    if (reduced || !entered || !host.current) return

    const controller = new AbortController()
    mountKopiStage(host.current, poseRef.current, controller.signal)
      .then((mounted) => {
        if (!mounted) return
        if (controller.signal.aborted) return mounted.destroy()
        stage.current = mounted
        setLive(true)
      })
      .catch((error: unknown) => console.warn('Kopi shows still poses because Live2D did not load.', error))

    return () => {
      controller.abort()
      stage.current?.destroy()
      stage.current = null
      setLive(false)
      setLiveShown(false)
    }
  }, [reduced, entered])

  return (
    <div className={cn('relative aspect-[561/731] shrink-0', className)} data-kopi-pose={pose}>
      <PoseArt pose={pose} animate={!reduced} className={cn(!entered && 'opacity-0', liveShown && 'invisible')} />
      {!reduced && (
        <div
          ref={host}
          aria-hidden="true"
          className={cn('absolute inset-0 transition-opacity duration-200 ease-out', !live && 'opacity-0')}
          data-kopi-live={live}
          onTransitionEnd={() => setLiveShown(live)}
        />
      )}
      {!reduced && entrance !== 'done' && (
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-200 ease-out',
            entrance === 'handover' && 'opacity-0'
          )}
          onTransitionEnd={() => setEntrance('done')}
        >
          <KopiAscii
            pose={entrancePose}
            onDone={() => {
              enteredThisVisit = true
              setEntrance('handover')
            }}
          />
        </div>
      )}
    </div>
  )
}

// Cross-fades from the previous pose once the new art has loaded. Under reduced motion the art swaps at once.
function PoseArt({ pose, animate, className }: { pose: KopiPose; animate: boolean; className?: string }) {
  const [layers, setLayers] = useState<{ pose: KopiPose; previous: KopiPose | null }>({ pose, previous: null })
  const [loaded, setLoaded] = useState<KopiPose | null>(null)

  if (layers.pose !== pose) setLayers({ pose, previous: animate ? layers.pose : null })

  const art = 'absolute inset-0 h-full w-full object-contain'

  return (
    <div className={cn('absolute inset-0', className)}>
      {layers.previous && <img src={`/kopi/${layers.previous}.png`} alt="" className={art} />}
      <img
        key={layers.pose}
        src={`/kopi/${layers.pose}.png`}
        alt=""
        onLoad={() => setLoaded(layers.pose)}
        onTransitionEnd={() => setLayers((current) => ({ ...current, previous: null }))}
        className={cn(
          art,
          animate && 'transition-opacity duration-200 ease-out',
          animate && loaded !== layers.pose && 'opacity-0'
        )}
      />
    </div>
  )
}
