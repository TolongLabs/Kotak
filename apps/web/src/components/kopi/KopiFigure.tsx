import { useEffect, useRef, useState } from 'react'
import { cn } from '../ui/cn'
import { KopiAscii } from './KopiAscii'
import { mountKopiStage, prefetchKopiStage, type KopiStage } from './live2d'
import { useReducedMotion } from './motion'
import type { KopiPose } from './poses'

// One entrance per page visit. A page's loading Kopi and its results Kopi are different elements: once the first has
// played the rise, the other draws its glyphs already settled. Navigation lets the next page play it again.
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
  // Turning it on makes Kopi react once: the live cat plays a React motion, the still art or glyphs hop (CSS
  // .kopi-hop). Reduced motion does neither.
  react?: boolean
  // Size the figure with a height class; the width follows the pose art's aspect ratio.
  className?: string
}

// Kopi arrives as ASCII (KopiAscii). Live2D's files download during the rise, and it mounts once the glyphs have settled
// so its setup can't stutter them; the settled glyphs hold until the live cat is ready, then fade with it underneath. The pose art shows only under reduced
// motion, or as the fallback when Live2D is missing, fails, or another Kopi on the page holds the stage.
export function KopiFigure({ pose, react = false, className }: KopiFigureProps) {
  const { reduced } = useReducedMotion()
  const host = useRef<HTMLDivElement>(null)
  const stage = useRef<KopiStage | null>(null)
  const poseRef = useRef(pose)
  const [live, setLive] = useState(false)
  const [fallback, setFallback] = useState(false)
  const [entrance, setEntrance] = useState<'playing' | 'settled' | 'handover' | 'done'>(reduced ? 'done' : 'playing')
  const [artReady, setArtReady] = useState(false)
  // Turning reduced motion off replays the entrance, so Kopi isn't blank while Live2D loads.
  const [wasReduced, setWasReduced] = useState(reduced)
  if (reduced !== wasReduced) {
    setWasReduced(reduced)
    setEntrance(reduced ? 'done' : 'playing')
  }
  const [entrancePose] = useState(pose)
  const [instant] = useState(enteredThisVisit)
  const handedOver = entrance === 'handover' || entrance === 'done'
  const startLive = !reduced && entrance !== 'playing'

  // Runs before the pose effect, so the pose change that comes with an answer can't cut the reaction short (setPose).
  useEffect(() => {
    if (react) stage.current?.react()
  }, [react])

  useEffect(() => {
    poseRef.current = pose
    stage.current?.setPose(pose)
  }, [pose])

  useEffect(() => {
    if (!reduced) prefetchKopiStage()
  }, [reduced])

  useEffect(() => {
    if (!startLive || !host.current) return

    const controller = new AbortController()
    // A load that never settles (a hung CDN script) falls back to the pose art; Live2D still takes over if it lands.
    const giveUp = window.setTimeout(() => setFallback(true), 8000)
    mountKopiStage(host.current, poseRef.current, controller.signal)
      .then((mounted) => {
        window.clearTimeout(giveUp)
        if (controller.signal.aborted) return mounted?.destroy()
        if (!mounted) return setFallback(true)
        stage.current = mounted
        setLive(true)
      })
      .catch((error: unknown) => {
        window.clearTimeout(giveUp)
        console.warn('Kopi shows still poses because Live2D did not load.', error)
        if (!controller.signal.aborted) setFallback(true)
      })

    return () => {
      window.clearTimeout(giveUp)
      controller.abort()
      stage.current?.destroy()
      stage.current = null
      setLive(false)
      setFallback(false)
      setArtReady(false)
    }
  }, [startLive])

  // Hand over once the glyphs have settled and there is something to hand over to: the live cat, or the loaded art.
  useEffect(() => {
    if (entrance === 'settled' && (live || (fallback && artReady))) setEntrance('handover')
  }, [entrance, live, fallback, artReady])

  // The glyph layer leaves on its fade's transitionend; this covers a fade that never runs.
  useEffect(() => {
    if (entrance !== 'handover') return
    const timer = window.setTimeout(() => setEntrance('done'), 400)
    return () => window.clearTimeout(timer)
  }, [entrance])

  return (
    <div
      className={cn(
        'relative aspect-[561/731] shrink-0',
        className,
        react && !reduced && !(live && handedOver) && 'kopi-hop'
      )}
      data-kopi-pose={pose}
    >
      {(reduced || fallback) && (
        <PoseArt
          pose={pose}
          animate={!reduced}
          onReady={() => setArtReady(true)}
          className={cn(!reduced && !handedOver && 'opacity-0')}
        />
      )}
      {!reduced && (
        <div
          ref={host}
          aria-hidden="true"
          className={cn('absolute inset-0', !(live && handedOver) && 'opacity-0')}
          data-kopi-live={live}
        />
      )}
      {!reduced && entrance !== 'done' && (
        <div
          className={cn('absolute inset-0 transition-opacity duration-200 ease-out', handedOver && 'opacity-0')}
          onTransitionEnd={() => setEntrance('done')}
        >
          <KopiAscii
            pose={entrancePose}
            instant={instant}
            onSettled={() => {
              enteredThisVisit = true
              setEntrance((current) => (current === 'playing' ? 'settled' : current))
            }}
          />
        </div>
      )}
    </div>
  )
}

// Cross-fades from the previous pose once the new art has loaded. Under reduced motion the art swaps at once.
function PoseArt({
  pose,
  animate,
  onReady,
  className
}: {
  pose: KopiPose
  animate: boolean
  onReady?: () => void
  className?: string
}) {
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
        onLoad={() => {
          setLoaded(layers.pose)
          onReady?.()
        }}
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
