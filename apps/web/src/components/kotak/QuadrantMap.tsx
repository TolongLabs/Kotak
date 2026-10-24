import { Diamond, Star, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from '../../app/router'
import {
  BOX_NAMES,
  placeLabel,
  placePoints,
  type BoxId,
  type Placed,
  type QuadrantPoint,
  type Trend
} from '../../engine/quadrant'
import { VerdictChip } from '../ui/VerdictChip'
import { cn } from '../ui/cn'

export interface QuadrantMapProps {
  points: QuadrantPoint[]
  /** Tint the box the You dot sits in. */
  highlightBox?: boolean
  /** Heading and one-line description; the default is the radar page's. */
  title?: string
  description?: string
  /** No card chrome and no heading block, for a page that supplies its own (the job page). */
  bare?: boolean
  className?: string
}

// Box positions in the plot: [left, top] cell of the 2x2 grid, plus the verb under the name.
const BOXES: { id: BoxId; col: 0 | 1; row: 0 | 1; verb: string }[] = [
  { id: 'plan', col: 0, row: 0, verb: 'Train for it' },
  { id: 'best', col: 1, row: 0, verb: 'Go for it' },
  { id: 'rethink', col: 0, row: 1, verb: 'Avoid' },
  { id: 'push', col: 1, row: 1, verb: 'Move soon' }
]

const RING: Record<Trend | 'none', string> = {
  rising: 'border-state-success',
  declining: 'border-state-error',
  steady: 'border-text-primary',
  none: 'border-text-primary'
}

/**
 * Keeps dots inside their own box and moves a dot to the nearest free spot when it would sit on an earlier one.
 * A dot never crosses the 50% line or the middle line: rising dots stay above the line, declining below it, steady only move sideways.
 */
const NUDGES = [0, -9, 9, -18, 18].flatMap((dx) => [0, 6, -6, 12, -12].map((dy) => [dx, dy] as const))
function spread(placed: Placed[], narrow: boolean) {
  // Rows kept clear for the box names and tags: a taller strip on phones, where the boxes are narrow.
  const [lo, hi] = narrow ? [30, 78] : [22, 78]
  const seen: { x: number; y: number }[] = []
  return placed.map((point) => {
    if (point.x === null || point.y === null) return { point, left: 0, top: 0 }
    const ready = point.x >= 50
    const [min, max] = ready ? [57, 88] : [12, 43]
    const rising = point.y > 50
    const top = 100 - point.y
    const at = ([ox, oy]: readonly [number, number]) => ({
      x: Math.min(max, Math.max(min, point.x! + ox)),
      y: point.y === 50 ? top : Math.min(rising ? 46 : hi, Math.max(rising ? lo : 54, top + oy))
    })
    const [offset] = NUDGES.map((n) => [n, at(n)] as const).filter(
      ([, p]) => !seen.some((s) => Math.abs(s.x - p.x) < 8 && Math.abs(s.y - p.y) < 8)
    )[0] ?? [NUDGES[0]]
    const spot = at(offset)
    seen.push(spot)
    return { point, left: spot.x, top: spot.y }
  })
}

function Dot({ point, index }: { point: Placed; index: number }) {
  const label = `${point.label}: fit ${point.fit}%, ${placeLabel(point)}`
  const shape =
    point.kind === 'you'
      ? 'h-[30px] w-[30px] rounded-full border-[3px] border-radar-you bg-text-primary text-label-s font-semibold text-bg-default outline outline-2 outline-offset-1 outline-text-primary'
      : point.kind === 'target'
        ? 'h-5 w-5 rotate-45 rounded-sm border-2 bg-bg-default'
        : point.kind === 'job'
          ? 'h-5 w-5 rounded-full border-2 border-text-primary bg-text-primary outline outline-2 outline-offset-2 outline-text-primary'
          : cn(
              'h-5 w-5 rounded-full border-2 bg-bg-default text-label-s text-text-primary',
              RING[point.trend ?? 'none']
            )
  return (
    <>
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center leading-none',
          shape,
          point.kind === 'target' && RING[point.trend ?? 'none']
        )}
        aria-hidden="true"
      >
        {point.kind === 'you' ? (
          'You'
        ) : point.kind === 'target' ? (
          <Diamond className="h-2.5 w-2.5 -rotate-45" />
        ) : (
          index
        )}
      </span>
      <span className="sr-only">{label}</span>
    </>
  )
}

// Roughly square on wide screens, taller on phones so the box names keep clear of the dots.
function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)')
    const update = () => setNarrow(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return narrow
}

export function QuadrantMap({
  points,
  highlightBox = true,
  title = 'Where You Stand',
  description = 'Each dot is a job. Across: how ready you are for it. Up: it is growing.',
  bare = false,
  className
}: QuadrantMapProps) {
  const narrow = useNarrow()
  const placed = useMemo(() => placePoints(points), [points])
  const you = placed.find((point) => point.kind === 'you')
  const job = placed.find((point) => point.kind === 'job')
  // The box to tint: the You dot's, else the job's own on the job page.
  const hereBox = highlightBox ? ((you ?? job)?.box ?? null) : null
  const hereTag = you ? 'You are here' : 'This job is here'
  // A lone job with no fit: no x position, so the plot shows its trend row as a band.
  const band = !you && job && job.fit === null && job.y !== null ? job : null
  const dots = spread(placed, narrow).filter(({ point }) => point.x !== null && point.y !== null)
  // Suggested dots are numbered in list order; You and target carry their own mark.
  const numbered = new Map(placed.filter((p) => p.kind === 'suggested').map((p, i) => [p.id, i + 1]))

  return (
    <section
      className={cn('@container space-y-4', !bare && 'surface-card p-4 lg:p-5', className)}
      aria-labelledby={bare ? undefined : 'quadrant-title'}
      aria-label={bare ? 'Where this job sits' : undefined}
    >
      {!bare && (
        <header className="space-y-1">
          <h2 id="quadrant-title" className="text-title-s text-text-primary">
            {title}
          </h2>
          <p className="text-body-s text-text-muted">{description}</p>
          <p className="flex items-center gap-2 text-label-m text-text-primary">
            <TrendingUp className="h-4 w-4 shrink-0" aria-hidden="true" />
            Aim for the top-right box: ready and growing.
          </p>
        </header>
      )}

      <div className="flex gap-2">
        <div className="flex w-14 shrink-0 flex-col justify-between py-1 text-label-s" aria-hidden="true">
          <span className="flex items-center gap-1 text-state-success">
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            Growing
          </span>
          <span className="text-text-muted">Steady</span>
          <span className="flex items-center gap-1 text-state-error">
            <TrendingDown className="h-3.5 w-3.5 shrink-0" />
            Shrinking
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div
            role="img"
            aria-label="Map of jobs by how ready you are for them and whether they are growing. The list below names every dot."
            className={cn(
              narrow ? 'aspect-[10/16]' : 'aspect-square',
              'relative w-full overflow-hidden rounded-sm border-[1.5px] border-text-primary'
            )}
          >
            <div className="absolute inset-0 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
              {BOXES.map(({ id, col, row, verb }) => {
                const best = id === 'best'
                const mine = hereBox === id
                return (
                  <div
                    key={id}
                    className={cn(
                      col === 0 ? 'col-start-1' : 'col-start-2',
                      row === 0 ? 'row-start-1' : 'row-start-2',
                      'flex flex-col justify-between p-2 text-text-primary',
                      row === 1 ? 'justify-end' : 'justify-start',
                      col === 1 ? 'items-end text-right' : 'items-start',
                      mine ? 'bg-radar-you-fill' : best ? 'bg-bg-panel' : 'bg-bg-default',
                      best && 'z-[1] border-[3px] border-text-primary'
                    )}
                  >
                    {best && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-accent-box px-2 text-label-s text-accent-on-box">
                        <Star className="h-3 w-3" aria-hidden="true" />
                        Best box
                      </span>
                    )}
                    {mine && (
                      <span className="rounded-sm bg-text-primary px-2 text-label-s text-bg-default">{hereTag}</span>
                    )}
                    <span className="text-label-m">{BOX_NAMES[id]}</span>
                    <span className="hidden text-label-s text-text-muted @lg:inline">{verb}</span>
                  </div>
                )
              })}
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-text-muted" />
            <div className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-text-muted" />
            {band && (
              <div
                className="pointer-events-none absolute inset-x-0 z-[1] flex items-center justify-center border-y border-text-primary"
                style={{
                  top: `${100 - band.y!}%`,
                  height: '12%',
                  transform: 'translateY(-50%)',
                  backgroundImage:
                    'repeating-linear-gradient(135deg, transparent 0 6px, var(--k-color-border-subtle) 6px 8px)'
                }}
              >
                <span className="rounded-full border-[1.5px] border-text-primary bg-accent-box px-3 text-label-s text-accent-on-box">
                  This job: {band.trend![0].toUpperCase() + band.trend!.slice(1)}
                </span>
              </div>
            )}
            {dots.map(({ point, left, top }) => (
              <Link
                key={point.id}
                to={`/app/jobs/${point.id}`}
                aria-label={`${point.label}: ${placeLabel(point)}`}
                style={{ left: `${left}%`, top: `${top}%` }}
                className="group absolute z-[2] inline-flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
              >
                <Dot point={point} index={numbered.get(point.id) ?? 0} />
                {point.kind === 'target' && (
                  <span className="pointer-events-none absolute right-full mr-0.5 rounded-sm bg-bg-default px-1 text-label-s text-text-primary">
                    Target
                  </span>
                )}
              </Link>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-label-s text-text-muted" aria-hidden="true">
            <span>0%</span>
            <span>Fit 50%</span>
            <span>100%</span>
          </div>
          <p className="text-center text-label-s text-text-primary">How ready you are (fit %)</p>
        </div>
      </div>

      <ol className="space-y-2">
        {placed.map((point) => {
          const mine = point.kind === 'you'
          return (
            <li
              key={point.id}
              className={cn(
                'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border-subtle px-3 py-2',
                mine && 'border-text-primary bg-radar-you-fill text-text-primary'
              )}
            >
              <span className="min-w-[9rem] flex-1 text-label-m">
                {point.kind === 'you'
                  ? 'You: '
                  : point.kind === 'target'
                    ? 'Target: '
                    : point.kind === 'job'
                      ? 'This job: '
                      : `${numbered.get(point.id)}. `}
                {point.label}
              </span>
              {point.trend ? (
                <VerdictChip verdict={point.trend} size="sm" className={mine ? 'text-text-primary' : undefined} />
              ) : null}
              <span className="font-mono text-mono-s">{point.fit === null ? 'Fit unknown' : `Fit ${point.fit}%`}</span>
              {point.fit !== null && <span className="text-label-s">{placeLabel(point)}</span>}
            </li>
          )
        })}
      </ol>

      <details className="border-t border-border-subtle pt-3">
        <summary className="min-h-11 cursor-pointer text-label-m text-text-primary">See the Maths</summary>
        <p className="py-2 text-body-s text-text-muted">
          Across is your fit % (50 or more counts as ready). Up is the job&apos;s trend: Rising above the middle line,
          Declining below, Steady on it, in no box.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-s">
            <thead>
              <tr className="text-label-s text-text-muted">
                <th className="py-1 pr-4">Job</th>
                <th className="py-1 pr-4 text-right">Fit</th>
                <th className="py-1 pr-4">Trend</th>
                <th className="py-1">Place</th>
              </tr>
            </thead>
            <tbody>
              {placed.map((point) => (
                <tr key={point.id} className="border-t border-border-subtle">
                  <td className="py-1 pr-4">{point.label}</td>
                  <td className="whitespace-nowrap py-1 pr-4 text-right font-mono">
                    {point.fit === null ? '-' : `${point.fit}%`}
                  </td>
                  <td className="whitespace-nowrap py-1 pr-4">{point.trend ?? 'no trend data'}</td>
                  <td className="py-1">{placeLabel(point)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
