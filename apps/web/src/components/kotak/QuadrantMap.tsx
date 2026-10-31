import { ArrowUpRight } from 'lucide-react'
import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  placePoints,
  type BoxId,
  type Placed,
  type PointKind,
  type QuadrantPoint,
  type Trend
} from '../../engine/quadrant'
import { Link } from '../../app/router'
import { cn } from '../ui/cn'
import { routeLinkClassName } from '../ui/TextLink'
import { commonText } from '../../i18n/common'
import { rolesText } from '../../i18n/messages/roles'
import { textNow, useText } from '../../i18n/text'

export interface QuadrantMapProps {
  points: QuadrantPoint[]
  /** The job this page is about (the job page): drawn as the star labelled "This job", and with no fit its trend band is drawn. */
  focusId?: string
  /** Heading and one-line description; the default is the radar page's. */
  title?: string
  description?: string
  /** No card chrome and no heading block, for a page that supplies its own (the job page). */
  bare?: boolean
  className?: string
}

// The four boxes in the plot: [left, top] cell of the 2x2 grid, the name, its line and its SWOT tint.
const BOXES: { id: BoxId; col: 0 | 1; row: 0 | 1; tint: string; divider: string }[] = [
  {
    id: 'plan',
    col: 0,
    row: 0,
    tint: 'bg-swot-opp',
    divider: 'border-r border-b'
  },
  {
    id: 'best',
    col: 1,
    row: 0,
    tint: 'bg-radar-you-fill',
    divider: 'border-b'
  },
  {
    id: 'rethink',
    col: 0,
    row: 1,
    tint: 'bg-swot-weak',
    divider: 'border-r'
  },
  {
    id: 'push',
    col: 1,
    row: 1,
    tint: 'bg-swot-threat',
    divider: ''
  }
]

// Stacking on the plot: the star on top, then the red targets, then the blue suggestions.
const STACK: Record<PointKind, number> = { suggested: 0, target: 1, you: 2 }

// Lucide's star path, the same shape as the star icon elsewhere in the app.
const STAR =
  'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z'

// The marker by shape and colour; the words always sit beside it, so colour is never the only cue.
// On the chart the job star is larger; legends and tables use 12 px for all three.
function Marker({ kind, chart = false, className }: { kind: PointKind; chart?: boolean; className?: string }) {
  // Stroke width that shows a 2 px ring outside the shape at this marker's size (24 units span 12 or 18 px).
  const ring = 96 / (chart && kind === 'you' ? 18 : 12)
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn(chart && kind === 'you' ? 'h-[18px] w-[18px]' : 'h-3 w-3', 'shrink-0 overflow-visible', className)}
    >
      {/* A 2 px page-colour ring: the ring is drawn under the shape, so only its outer 2 px shows. */}
      {kind === 'you' ? (
        <>
          <path
            d={STAR}
            fill="var(--color-bg-default)"
            stroke="var(--color-bg-default)"
            strokeWidth={ring}
            strokeLinejoin="round"
          />
          <path
            d={STAR}
            fill="var(--color-radar-you)"
            stroke="var(--color-text-primary)"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </>
      ) : kind === 'target' ? (
        <rect
          x={3}
          y={3}
          width={18}
          height={18}
          rx={3}
          className="fill-map-target"
          stroke="var(--color-bg-default)"
          strokeWidth={ring}
          paintOrder="stroke"
        />
      ) : (
        <circle
          cx={12}
          cy={12}
          r={9}
          className="fill-map-suggested"
          stroke="var(--color-bg-default)"
          strokeWidth={ring}
          paintOrder="stroke"
        />
      )}
    </svg>
  )
}

// The job page's own job is drawn as the star; the star is "This job" there, or "Your job" when it is the user's own.
const markOf = (point: Placed, focusId?: string): PointKind =>
  point.id === focusId && point.kind === 'suggested' ? 'you' : point.kind
const wordOf = (point: Placed, focusId?: string) => {
  const t = textNow(rolesText).quadrant
  return point.id === focusId && point.kind === 'suggested' ? t.thisJob : t.markers[point.kind]
}

// The table's Marker column uses short words so it wraps less on a phone.
const shortWordOf = (point: Placed, focusId?: string) => {
  const t = textNow(rolesText).quadrant
  return point.id === focusId && point.kind === 'suggested' ? t.thisJob : t.shortMarkers[point.kind]
}

const trendWord = (trend: Trend | null) => {
  if (!trend) return textNow(rolesText).quadrant.noTrend
  const labels = textNow(commonText).verdicts
  const key: Record<Trend, keyof typeof labels> = { rising: 'Rising', steady: 'Steady', declining: 'Declining' }
  return labels[key[trend]]
}
const fitWord = (fit: number | null) => {
  const t = textNow(rolesText).quadrant
  return fit === null ? t.fitUnknownLower : t.fitLower(fit)
}
const displayFitWord = (fit: number | null) => {
  const t = textNow(rolesText).quadrant
  return fit === null ? t.fitUnknown : t.fit(fit)
}
// Where a dot sits, in words: its box, the steady middle line, or not placed (no fit or no trend).
const placeWord = (point: Placed) => {
  const t = textNow(rolesText).quadrant
  return point.box ? t.boxes[point.box].name : point.x !== null && point.y !== null ? t.middleLine : t.notPlaced
}

// Spreads spots on one line in their given order: each lands at least `gap` after the one before, inside [from, to], as
// close to where it wants to be as it can. Taking i gaps off the i-th spot turns "a gap apart" into "in order", which
// pooling adjacent out-of-order spots solves; a line too short for the gaps shrinks them to fit.
function spreadInOrder(wanted: number[], from: number, to: number, gap: number): number[] {
  const step = wanted.length > 1 ? Math.min(gap, (to - from) / (wanted.length - 1)) : 0
  const pools: { sum: number; count: number }[] = []
  wanted.forEach((at, i) => {
    pools.push({ sum: at - i * step, count: 1 })
    while (
      pools.length > 1 &&
      pools[pools.length - 2].sum * pools[pools.length - 1].count >
        pools[pools.length - 1].sum * pools[pools.length - 2].count
    ) {
      const last = pools.pop()!
      pools[pools.length - 1].sum += last.sum
      pools[pools.length - 1].count += last.count
    }
  })
  const end = to - (wanted.length - 1) * step
  return pools
    .flatMap(({ sum, count }) => Array<number>(count).fill(sum / count))
    .map((at, i) => Math.min(end, Math.max(from, at)) + i * step)
}

// Marker centres are kept apart: 16 px on desktop, 14 px on a phone. Rising and declining dots keep their fit across and
// stack up and down inside their box's dot band (height carries no meaning): below the top boxes' names, above the bottom
// boxes' names, and that gap or more from the middle line. Dots on the steady middle line stay on it and spread sideways
// in fit order, so a higher fit is never left of a lower one. Nothing crosses the middle line or a box edge.
interface PlotSize {
  width: number
  height: number
  /** Where the top boxes' names end and the bottom boxes' names start, in px from the plot's top. */
  namesEnd: number
  namesStart: number
}
// A band keeps a dot centre half a marker hit box clear of the box names.
const NAMES_CLEARANCE_PX = 12
function spread(placed: Placed[], narrow: boolean, { width, height, namesEnd, namesStart }: PlotSize) {
  const minGap = narrow ? 14 : 16
  const middle = height / 2
  const rising = [Math.min(namesEnd + NAMES_CLEARANCE_PX, middle - minGap), middle - minGap] as const
  const declining = [middle + minGap, Math.max(middle + minGap, namesStart - NAMES_CLEARANCE_PX)] as const
  const spots = placed.flatMap((point) => {
    if (point.x === null || point.y === null) return []
    const box = point.x >= 50 ? ([53, 94] as const) : ([6, 47] as const)
    const band = point.y === 50 ? null : point.y > 50 ? rising : declining
    const top = ((100 - point.y) * height) / 100
    const x = (Math.min(box[1], Math.max(box[0], point.x)) * width) / 100
    return [{ point, x, y: band ? Math.min(band[1], Math.max(band[0], top)) : top, box, band }]
  })
  // Steady dots, each half on its own: one pass in fit order, so equal fits (and fits held at the box edge) keep the
  // list order and never share a pixel.
  for (const [from, to] of [
    [6, 47],
    [53, 94]
  ]) {
    const line = spots.filter((spot) => !spot.band && spot.box[0] === from).sort((a, b) => a.point.x! - b.point.x!)
    const xs = spreadInOrder(
      line.map((spot) => spot.x),
      (from * width) / 100,
      (to * width) / 100,
      minGap
    )
    line.forEach((spot, i) => (spot.x = xs[i]))
  }
  // Boxed dots, each box on its own, left to right: dots closer than minGap across form a stack. Each takes the height
  // nearest the stack's first dot that clears the dots before it; the stack is then centred on its trend's height and
  // kept inside the band, squeezed evenly when the band is too short.
  const stack = (dots: typeof spots) => {
    const offsets: number[] = []
    dots.forEach((dot) => {
      const need = (j: number) => Math.sqrt(Math.max(0, minGap ** 2 - (dot.x - dots[j].x) ** 2))
      const clear = (offset: number) => offsets.every((other, j) => Math.abs(offset - other) >= need(j) - 1e-6)
      const options = [0, ...offsets.flatMap((other, j) => [other - need(j), other + need(j)])].filter(clear)
      offsets.push(options.sort((a, b) => Math.abs(a) - Math.abs(b) || a - b)[0])
    })
    const [from, to] = dots[0].band!
    const [low, high] = [Math.min(...offsets), Math.max(...offsets)]
    const squeeze = high - low > to - from ? (to - from) / (high - low) : 1
    const shift = Math.min(
      to - high * squeeze,
      Math.max(from - low * squeeze, dots[0].y - ((low + high) / 2) * squeeze)
    )
    dots.forEach((dot, i) => (dot.y = offsets[i] * squeeze + shift))
  }
  for (const id of ['plan', 'best', 'rethink', 'push']) {
    const inBox = spots
      .filter((spot) => spot.band && spot.point.box === id)
      .sort((a, b) => a.x - b.x || a.point.x! - b.point.x!)
    let start = 0
    for (let end = 1; end <= inBox.length; end++) {
      if (end < inBox.length && inBox[end].x - inBox[end - 1].x < minGap) continue
      stack(inBox.slice(start, end))
      start = end
    }
  }
  return spots.map((spot) => ({ point: spot.point, left: (spot.x * 100) / width, top: (spot.y * 100) / height }))
}

// The popover sits beside its dot and stays inside the plot: below the dot in the lower half, to the side near the edges.
function popoverAt(left: number, top: number): CSSProperties {
  const x = left < 15 ? '0%' : left > 85 ? '-100%' : '-50%'
  const y = top < 45 ? '28px' : 'calc(-100% - 28px)'
  return { left: `${left}%`, top: `${top}%`, transform: `translate(${x}, ${y})` }
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

export function QuadrantMap({ points, focusId, title, description, bare = false, className }: QuadrantMapProps) {
  const t = useText(rolesText)
  const chartTitle = title ?? t.quadrant.title
  const chartDescription = description ?? t.quadrant.description
  const narrow = useNarrow()
  const placed = useMemo(() => placePoints(points), [points])
  const focused = focusId ? placed.find((point) => point.id === focusId) : undefined
  // A lone job with no fit: no x position, so the plot shows its trend row as a band.
  const band = focused && focused.fit === null && focused.y !== null ? focused : null
  const plotRef = useRef<HTMLDivElement>(null)
  const namesRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<PlotSize>({ width: 340, height: 340, namesEnd: 64, namesStart: 276 })
  useLayoutEffect(() => {
    const el = plotRef.current
    const names = [...(namesRef.current?.querySelectorAll('span') ?? [])]
    if (!el) return
    // The names wrap with the width and the font, so the dot bands follow their measured edges.
    const update = () => {
      const height = el.clientHeight || 340
      const top = el.getBoundingClientRect().top
      const rects = names.map((name) => name.getBoundingClientRect())
      setSize({
        width: el.clientWidth || 340,
        height,
        namesEnd: Math.max(0, ...rects.filter((r) => r.top - top < height / 2).map((r) => r.bottom - top)),
        namesStart: Math.min(height, ...rects.filter((r) => r.top - top >= height / 2).map((r) => r.top - top))
      })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    names.forEach((name) => observer.observe(name))
    return () => observer.disconnect()
  }, [])
  const dots = spread(placed, narrow, size)
    .filter(({ point }) => point.x !== null && point.y !== null)
    .sort((a, b) => STACK[markOf(a.point, focusId)] - STACK[markOf(b.point, focusId)])
  // The legend lists only the marks that appear on this chart.
  const marksShown = new Set(dots.map(({ point }) => markOf(point, focusId)))
  const starPoint = dots.find(({ point }) => markOf(point, focusId) === 'you')?.point

  // A dot's popover opens on hover, keyboard focus, or a tap that pins it; Escape or a tap outside closes it.
  const [hovered, setHovered] = useState<string | null>(null)
  const [focusedDot, setFocusedDot] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const openId = hovered ?? focusedDot ?? pinned
  const popoverId = useId()
  const close = () => {
    setHovered(null)
    setFocusedDot(null)
    setPinned(null)
  }

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      // A press on a dot or inside the open popover keeps it; anywhere else closes it.
      const inside = (event.target as Element).closest?.('button[aria-label], [data-popover]')
      if (!inside || !plotRef.current?.contains(inside)) close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Escape from inside the pinned popover hands focus back to its dot before the popover goes.
      const active = document.activeElement
      if (active?.closest('[data-popover]') && plotRef.current?.contains(active))
        plotRef.current.querySelector<HTMLElement>('[aria-expanded="true"]')?.focus()
      close()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <section
      className={cn('@container space-y-4', !bare && 'surface-card p-4 lg:p-5', className)}
      aria-labelledby={bare ? undefined : 'quadrant-title'}
      aria-label={bare ? t.quadrant.thisJobAria : undefined}
    >
      {!bare && (
        <header className="space-y-1">
          <h2 id="quadrant-title" className="text-title-s text-text-primary">
            {chartTitle}
          </h2>
          <p className="text-body-s text-text-muted">{chartDescription}</p>
        </header>
      )}

      <div className="min-w-0">
        <p className="mb-1 flex items-center justify-end gap-1 text-label-s text-text-primary" aria-hidden="true">
          {t.quadrant.higherIsBetter}
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
        </p>
        <div ref={plotRef} className={cn(narrow ? 'h-[340px]' : 'aspect-square', 'relative w-full')}>
          <div className="absolute inset-0 overflow-hidden rounded-[12px] border border-text-primary">
            <div
              ref={namesRef}
              className="grid h-full w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]"
            >
              {BOXES.map(({ id, col, row, tint, divider }) => (
                <div
                  key={id}
                  className={cn(
                    col === 0 ? 'col-start-1' : 'col-start-2',
                    row === 0 ? 'row-start-1' : 'row-start-2',
                    // Ink on the Best tint in both themes: light text on its dark-mode fill is 3.3:1.
                    'flex flex-col p-2.5 text-left',
                    id === 'best' ? 'text-accent-on-box' : 'text-text-primary',
                    row === 1 ? 'justify-end' : 'justify-start',
                    tint,
                    divider,
                    'border-text-primary'
                  )}
                >
                  <span className="text-label-m">{t.quadrant.boxes[id].name}</span>
                  <span className="text-label-s">{t.quadrant.boxes[id].line}</span>
                </div>
              ))}
            </div>
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
                  {t.quadrant.thisJobTrend(trendWord(band.trend))}
                </span>
              </div>
            )}
          </div>
          {dots.map(({ point, left, top }) => {
            // A pinned popover takes the pointer and the keyboard: it follows its dot in the tab order and links to the
            // job's page. A hover or focus preview stays out of the way.
            const open = point.id === openId
            const interactive = open && pinned === point.id
            return (
              <Fragment key={point.id}>
                <button
                  type="button"
                  aria-label={t.quadrant.points(
                    point.label,
                    wordOf(point, focusId),
                    fitWord(point.fit),
                    trendWord(point.trend),
                    placeWord(point),
                    Boolean(point.box),
                    point.gap
                  )}
                  onPointerEnter={() => setHovered(point.id)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setFocusedDot(point.id)}
                  onBlur={() => setFocusedDot(null)}
                  aria-expanded={pinned === point.id}
                  aria-controls={interactive ? popoverId : undefined}
                  onClick={(event) => {
                    if (pinned !== point.id) return setPinned(point.id)
                    setHovered(null)
                    setFocusedDot(null)
                    setPinned(null)
                    // A click or tap leaves focus on the dot, which would keep it open; Enter or Space (detail 0) keeps focus.
                    if (event.detail > 0) event.currentTarget.blur()
                  }}
                  style={{ left: `${left}%`, top: `${top}%` }}
                  // The focus ring sits on a 2 px page-colour halo inside and out, so it keeps 3:1 on every box tint
                  // (the dark-mode yellow ring alone is 2.5:1 on the dark Best tint).
                  className="group absolute z-[2] inline-flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:shadow-[0_0_0_7px_var(--color-bg-default)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <Marker
                    kind={markOf(point, focusId)}
                    chart
                    className="transition-transform duration-150 group-hover:scale-[1.15]"
                  />
                </button>
                {open && (
                  <div
                    id={interactive ? popoverId : undefined}
                    data-popover
                    aria-hidden={interactive ? undefined : true}
                    style={popoverAt(left, top)}
                    className={cn(
                      'absolute z-[3] w-[min(230px,calc(100%-16px))] space-y-1 rounded-md border border-text-primary bg-bg-default p-3 text-body-s text-text-primary shadow-popover',
                      !interactive && 'pointer-events-none'
                    )}
                  >
                    <p className="font-semibold">{point.label}</p>
                    <p className="flex items-center gap-1.5 text-label-s">
                      <Marker kind={markOf(point, focusId)} />
                      {wordOf(point, focusId)} · {displayFitWord(point.fit)} · {trendWord(point.trend)}
                    </p>
                    {point.gap && <p className="text-label-s">{t.quadrant.neededFirst(point.gap)}</p>}
                    {interactive && point.id !== focusId && (
                      <Link to={`/app/jobs/${point.id}`} onClick={close} className={routeLinkClassName}>
                        {t.quadrant.openJobPage}
                        <span className="sr-only">{t.quadrant.openJobTitle(point.label)}</span>
                      </Link>
                    )}
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
        <div className="mt-1 flex justify-between text-label-s text-text-muted" aria-hidden="true">
          <span>{t.quadrant.fitAxis}</span>
          <span>{t.quadrant.readinessAxis}</span>
          <span>100%</span>
        </div>
        <div className="mt-2 flex flex-wrap justify-end gap-x-4 gap-y-1 text-label-s text-text-primary">
          {marksShown.has('you') && (
            <span className="inline-flex items-center gap-1.5">
              <Marker kind="you" />
              {starPoint && starPoint.id === focusId ? wordOf(starPoint, focusId) : t.rolesView.chartYou}
            </span>
          )}
          {marksShown.has('target') && (
            <span className="inline-flex items-center gap-1.5">
              <Marker kind="target" />
              {t.quadrant.targetLegend}
            </span>
          )}
          {marksShown.has('suggested') && (
            <span className="inline-flex items-center gap-1.5">
              <Marker kind="suggested" />
              {t.quadrant.markers.suggested}
            </span>
          )}
        </div>
      </div>

      <details open className="border-t border-border-subtle pt-3">
        <summary className="min-h-11 cursor-pointer text-label-m text-text-primary">{t.quadrant.textVersion}</summary>
        <p className="py-2 text-body-s text-text-muted">
          {t.quadrant.textDescription(
            textNow(commonText).verdicts.Rising,
            textNow(commonText).verdicts.Declining,
            textNow(commonText).verdicts.Steady
          )}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-s">
            <thead>
              <tr className="text-label-s text-text-muted">
                <th className="py-1 pr-1.5 sm:pr-4">{t.quadrant.role}</th>
                <th className="py-1 pr-1.5 sm:pr-4">{t.quadrant.marker}</th>
                <th className="py-1 pr-1.5 sm:pr-4 text-right">{t.quadrant.fitColumn}</th>
                <th className="py-1 pr-1.5 sm:pr-4">{t.jobView.trend}</th>
                <th className="py-1">{t.quadrant.place}</th>
              </tr>
            </thead>
            <tbody>
              {placed.map((point) => (
                <Fragment key={point.id}>
                  <tr className="border-t border-border-subtle">
                    <td className="py-1 pr-1.5 sm:pr-4">{point.label}</td>
                    <td className="py-1 pr-1.5 sm:pr-4">
                      {/* On a phone the column shows the shape only (the legend names it), so the table fits. */}
                      <span className="inline-flex items-center gap-1">
                        <Marker kind={markOf(point, focusId)} />
                        <span className="max-sm:sr-only">{shortWordOf(point, focusId)}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-1 pr-1.5 sm:pr-4 text-right font-mono">
                      {point.fit === null ? '-' : `${point.fit}%`}
                    </td>
                    <td className="whitespace-nowrap py-1 pr-1.5 sm:pr-4">{trendWord(point.trend)}</td>
                    <td className="py-1">{placeWord(point)}</td>
                  </tr>
                  {point.gap && (
                    <tr>
                      <td colSpan={5} className="pb-1 text-label-s text-text-muted">
                        {t.quadrant.neededFirst(point.gap)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
