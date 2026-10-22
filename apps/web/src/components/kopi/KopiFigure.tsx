import { useEffect, useRef, useState } from 'react'
import { cn } from '../ui/cn'
import { mountKopiStage, type KopiStage } from './live2d'
import { useReducedMotion } from './motion'
import type { KopiPose } from './poses'

export interface KopiFigureProps {
  pose: KopiPose
  // Size the figure with a height class; the width follows the pose art's aspect ratio.
  className?: string
}

// Kopi as the Live2D model when it loads; otherwise, and always under reduced motion, the static pose art.
export function KopiFigure({ pose, className }: KopiFigureProps) {
  const { reduced } = useReducedMotion()
  const host = useRef<HTMLDivElement>(null)
  const stage = useRef<KopiStage | null>(null)
  const poseRef = useRef(pose)
  const [live, setLive] = useState(false)

  useEffect(() => {
    poseRef.current = pose
    stage.current?.setPose(pose)
  }, [pose])

  useEffect(() => {
    if (reduced || !host.current) return

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
    }
  }, [reduced])

  return (
    <div className={cn('relative aspect-[561/731] shrink-0', className)} data-kopi-pose={pose}>
      <PoseArt pose={pose} animate={!reduced} className={cn(live && 'invisible')} />
      {!reduced && <div ref={host} aria-hidden="true" className="absolute inset-0" data-kopi-live={live} />}
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
