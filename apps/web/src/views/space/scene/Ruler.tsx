import type { Scenario } from '@kotak/shared'
import { useEffect, useRef, type ReactNode, type Ref } from 'react'
import { useReducedMotion } from '../../../components/kopi/motion'
import { cn } from '../../../components/ui/cn'
import { formatIndex } from '../format'
import { FUTURE_SECONDS, MONTH_SECONDS, REDUCED_SECONDS } from './layout'

// The ring's 2D readout: Malaysia's AI usage index as a scale from 0, marking Malaysia in each future and Singapore,
// with a marker at the future on show. Down the right edge it stands vertical; on a phone it lies flat at the foot of
// the HUD, where the frame is dark. The ring stands at the same index, so the marker glides with it on a flip
// (FUTURE_SECONDS) and the marks with a month switch (MONTH_SECONDS), both in REDUCED_SECONDS under reduced motion, as
// the ring does; the numbers beside them swap at once.

interface RulerProps {
  anchors: { mys: number; sgp: number; fastMys: number }
  /** The scale's top, the same in every month, so a month switch moves the marks and not the scale. */
  max: number
  scenario: Scenario
  /** The snapshot's label, such as "May 2026", for screen readers. */
  month: string
  cite: ReactNode
  /** Vertical down the right edge (the caller positions it, absolute), or flat across the foot of a phone's HUD. */
  orientation: 'vertical' | 'horizontal'
  className?: string
  ref?: Ref<HTMLElement>
}

/** A whole tick and a half tick, across the scale. */
const TICK = { vertical: ['h-px w-2.5', 'h-px w-1.5'], horizontal: ['h-2.5 w-px', 'h-1.5 w-px'] }

export function Ruler({ anchors, max, scenario, month, cite, orientation, className, ref }: RulerProps) {
  const { reduced } = useReducedMotion()
  const flip = reduced ? REDUCED_SECONDS : FUTURE_SECONDS
  const monthSwitch = reduced ? REDUCED_SECONDS : MONTH_SECONDS
  // The live marker moves on a flip and on a month switch, so it takes whichever just happened.
  const shownMonth = useRef(month)
  const markerSeconds = shownMonth.current === month ? flip : monthSwitch
  useEffect(() => {
    shownMonth.current = month
  }, [month])
  const ticks = Array.from({ length: max * 2 + 1 }, (_, i) => i / 2)
  // The caption names Malaysia once, so its two marks say only the future; the caption's hidden text says it all.
  const marks = [
    { key: 'sgp', label: 'Singapore', value: anchors.sgp, live: false },
    { key: 'fast', label: 'Fast', value: anchors.fastMys, live: scenario === 'fast' },
    { key: 'slow', label: 'Slow', value: anchors.mys, live: scenario === 'slow' }
  ]
  const live = scenario === 'fast' ? anchors.fastMys : anchors.mys

  // One mapping for both axes: a value's share of the scale, measured up from the foot or right from 0.
  const flat = orientation === 'horizontal'
  const share = (value: number) => Math.max(0, value) / max
  const at = (value: number) => (flat ? { left: `${share(value) * 100}%` } : { bottom: `${share(value) * 100}%` })
  // A slider as long as the scale, moved along it by a transform over `seconds`, so a switch glides on the compositor;
  // what it carries sits on its start edge, the top (moved down) or the left (moved right).
  const slide = (value: number, seconds: number) => ({
    transform: flat ? `translateX(${share(value) * 100}%)` : `translateY(${(1 - share(value)) * 100}%)`,
    transitionDuration: `${seconds}s`
  })
  const slider = cn('absolute transition-transform ease-in-out', flat ? 'inset-0' : 'inset-y-0 right-6')

  return (
    <figure ref={ref} className={cn('flex flex-col', flat ? 'items-center gap-1.5' : 'items-end gap-4', className)}>
      <figcaption className="pointer-events-auto flex items-center gap-1.5 text-label-s text-text-primary">
        Malaysia’s AI Usage Index
        {cite}
        <span className="sr-only">
          , {month}: Malaysia {formatIndex(anchors.mys)} in Slow AI Uptake and {formatIndex(anchors.fastMys)} in Fast AI
          Uptake, halfway to Singapore’s {formatIndex(anchors.sgp)}.{' '}
          {scenario === 'fast' ? 'Fast AI Uptake' : 'Slow AI Uptake'} is on show.
        </span>
      </figcaption>
      {/* Vertical, a spine 24 px in from the right edge, the tick numbers right of it and the marks left of it. Flat, a
          line with 0 and the top under its ends, so the scale takes the full width and Malaysia's two marks, labelled
          below it, keep apart on a narrow one; Singapore's is labelled above it. */}
      <div aria-hidden="true" className={cn('flex', flat ? 'w-[min(21rem,100%)] px-1' : 'min-h-0 flex-1')}>
        <div className={cn('relative', flat ? 'h-14 flex-1' : 'w-44')}>
          <div className={cn('absolute bg-text-muted', flat ? 'inset-x-0 top-1/2 h-px' : 'inset-y-0 right-6 w-px')} />
          {flat &&
            [0, max].map((end, i) => (
              <span
                key={end}
                className={cn(
                  'absolute bottom-0 -translate-x-1/2 font-mono text-mono-s text-text-muted',
                  i === 0 ? 'left-0' : 'left-full'
                )}
              >
                {end}
              </span>
            ))}
          {ticks.map((t) => (
            <div
              key={t}
              className={cn(
                'absolute flex items-center',
                flat ? 'top-1/2 -translate-x-1/2 -translate-y-1/2' : 'right-6 translate-y-1/2'
              )}
              style={at(t)}
            >
              <span className={cn('bg-text-muted', TICK[orientation][Number.isInteger(t) ? 0 : 1])} />
              {!flat && Number.isInteger(t) && (
                <span
                  className={cn(
                    'absolute left-full ml-[9px] font-mono text-mono-s text-text-muted',
                    // On a landscape phone the scale is short, so only the even numbers fit.
                    t % 2 === 1 && '[@media(max-height:480px)]:hidden'
                  )}
                >
                  {t}
                </span>
              )}
            </div>
          ))}
          {marks.map((mark) => (
            <div key={mark.key} className={slider} style={slide(mark.value, monthSwitch)}>
              <span
                className={cn(
                  'absolute',
                  flat
                    ? 'left-0 top-1/2 h-4 -translate-x-1/2 -translate-y-1/2 border-l'
                    : 'right-0 top-0 w-5 -translate-y-1/2 border-t',
                  mark.live ? 'border-text-primary' : 'border-text-muted'
                )}
              />
              <span
                className={cn(
                  'absolute flex items-baseline gap-1.5 whitespace-nowrap text-label-s',
                  !flat
                    ? 'right-7 top-0 -translate-y-1/2'
                    : mark.key === 'sgp'
                      ? 'right-full top-0 -mr-2'
                      : 'bottom-0 left-0 -ml-2',
                  mark.live ? 'text-text-primary' : 'text-text-muted'
                )}
              >
                {mark.label}
                <span className="font-mono text-mono-m">{formatIndex(mark.value)}</span>
              </span>
            </div>
          ))}
          {/* The live marker, a ring with nothing inside, sits on the scale at the future on show. */}
          <div className={slider} style={slide(live, markerSeconds)}>
            <div
              className={cn(
                'absolute size-3.5 -translate-y-1/2 rounded-full border-2 border-text-primary',
                flat ? 'left-0 top-1/2 -translate-x-1/2' : 'right-0 top-0 translate-x-1/2'
              )}
            />
          </div>
        </div>
      </div>
    </figure>
  )
}
