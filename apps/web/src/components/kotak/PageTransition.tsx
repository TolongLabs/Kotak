import { useEffect, useRef, useState } from 'react'
import { ProgressBar } from '../ui/ProgressBar'
import { cn } from '../ui/cn'

export interface PageTransitionProps {
  onDone: () => void
  durationMs?: number
}

// The flaps swing open and Kopi's ears rise. Reduced motion skips to the open box and a 200 ms fade (DESIGN.md).
function OpeningBox({ open, className }: { open: boolean; className?: string }) {
  const swing = 'transition-transform duration-700 ease-out'

  return (
    <svg viewBox="0 0 120 110" aria-hidden="true" className={className}>
      <g className={swing} style={{ transform: open ? 'translateY(0)' : 'translateY(18px)' }}>
        <polygon points="44,52 50,34 58,52" className="fill-text-primary" />
        <polygon points="62,52 70,34 76,52" className="fill-text-primary" />
      </g>
      <rect
        x="10"
        y="16"
        width="14"
        height="34"
        rx="3"
        strokeWidth="5"
        className={cn('fill-bg-default stroke-text-primary', swing)}
        style={{ transformOrigin: '24px 50px', transform: open ? 'rotate(-20deg)' : 'rotate(70deg)' }}
      />
      <rect
        x="96"
        y="16"
        width="14"
        height="34"
        rx="3"
        strokeWidth="5"
        className={cn('fill-bg-default stroke-text-primary', swing)}
        style={{ transformOrigin: '96px 50px', transform: open ? 'rotate(20deg)' : 'rotate(-70deg)' }}
      />
      <rect
        x="18"
        y="48"
        width="84"
        height="52"
        rx="8"
        strokeWidth="6"
        className="fill-bg-default stroke-text-primary"
      />
    </svg>
  )
}

// Full-screen "Opening the Box…" moment between the last question and the results.
export function PageTransition({ onDone, durationMs = 2400 }: PageTransitionProps) {
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const total = reduced ? 200 : durationMs
    const start = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const share = Math.min(1, (now - start) / total)
      setOpen(true)
      setProgress(Math.round(share * 100))
      if (share < 1) frame = requestAnimationFrame(tick)
      else onDoneRef.current()
    })

    return () => cancelAnimationFrame(frame)
  }, [durationMs])

  return (
    <div
      role="status"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-accent-box p-8 text-center text-accent-on-box"
    >
      <OpeningBox open={open} className="h-64 w-72 lg:h-88 lg:w-96" />
      <p className="text-title-l lg:text-display-l">Opening the Box…</p>
      <p className="max-w-xs text-body-l lg:max-w-lg">Kopi is reading four sources for you.</p>
      <ProgressBar label="Reading Four Sources" value={progress} className="w-72 lg:w-90" />
      <p className="font-mono text-mono-s">O*NET · Economic Index · DOSM · MyCOL</p>
    </div>
  )
}
