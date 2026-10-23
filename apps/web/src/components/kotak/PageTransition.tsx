import { useEffect, useRef, useState } from 'react'
import { cn } from '../ui/cn'

export interface PageTransitionProps {
  onDone: () => void
  durationMs?: number
  load?: () => Promise<unknown>
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
export function PageTransition({ onDone, durationMs = 2400, load }: PageTransitionProps) {
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const onDoneRef = useRef(onDone)
  const loadRef = useRef(load)

  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const total = reduced ? 200 : durationMs
    const start = performance.now()
    // With a load, the bar holds at 90% until it settles, so it never reads 100% before the next screen's data is in.
    let settled = !loadRef.current
    void loadRef
      .current?.()
      .catch(() => {})
      .finally(() => {
        settled = true
      })
    let frame = requestAnimationFrame(function tick(now) {
      const percent = Math.round(Math.min(1, (now - start) / total) * 100)
      setOpen(true)
      setProgress(settled ? percent : Math.min(90, percent))
      if (percent < 100 || !settled) frame = requestAnimationFrame(tick)
      else onDoneRef.current()
    })

    return () => cancelAnimationFrame(frame)
  }, [durationMs])

  return (
    <div
      role="status"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-accent-box p-8 text-center text-accent-on-box"
    >
      <div className="flex h-[264px] w-[288px] items-center justify-center lg:h-[352px] lg:w-[384px]">
        <OpeningBox open={open} className="h-[114px] w-[142px] lg:h-[170px] lg:w-[204px]" />
      </div>
      <p className="text-title-l lg:text-display-l">Opening the Box…</p>
      <p className="max-w-[300px] text-body-l lg:max-w-[520px]">Kopi is reading three sources for you.</p>
      <div className="w-[280px] space-y-2 lg:w-[360px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-label-m">Reading Three Sources</span>
          <span className="font-mono text-mono-s">{progress}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Reading Three Sources"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${progress}%`}
          className="h-2 w-full overflow-hidden rounded-full bg-bg-default"
        >
          <div
            className="h-full rounded-full bg-text-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <p className="font-mono text-mono-s">O*NET · Economic Index · DOSM</p>
    </div>
  )
}
