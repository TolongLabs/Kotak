import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Minus, Plus } from 'lucide-react'
import { SdgChip } from '../../components/ui/SdgChip'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { fmt, type TimelineStep } from './planSupport'

interface RoadmapTimelineProps {
  steps: TimelineStep[]
  startDate: Date
  today: Date
  impactArea: number | null
  selectedStepId: string | null
  onSelectStep: (stepId: string) => void
}

const ZOOM_STEP = 1.5
const MAX_ZOOM = 8
const MIN_TICK_PX = 48
const DRAG_PX = 5
const PAN_PX = 96
const DESKTOP_LABEL_W = 236
const TOOLTIP_W = 264
// Mono/S and Label/S glyphs are about 7 px wide; used to keep axis and bar labels whole instead of truncating them.
const MONO_CHAR_PX = 7.3
const LABEL_CHAR_PX = 6.8
const LABEL_GAP_PX = 12
// Months are labelled no closer than the widest label ("Sep 2027", 8 characters) plus a gap.
const MONTH_LABEL_PX = 9 * MONO_CHAR_PX
// Week gridlines only once a week is wide enough to read; below that, months carry the grid.
const WEEK_GRID_PX = 24
const MONTH_STRIDES = [1, 2, 3, 6, 12]

function weekRange([first, last]: [number, number]) {
  return first === last ? `W${first}` : `W${first}–${last}`
}

interface HoverState {
  stepId: string
  left: number
  top: number
  bottom: number
  below: boolean
  // Opened by a touch tap, which has no hover; a second tap on the bar opens its step.
  tapped: boolean
}

function StepTooltip({ step, tapHint }: { step: TimelineStep; tapHint: boolean }) {
  return (
    <div className="space-y-1.5">
      <p className="text-label-m text-text-primary">{step.skill}</p>
      <p className="text-body-s text-text-primary">{step.title}</p>
      <dl className="space-y-1">
        <div className="flex gap-2 text-label-s text-text-primary">
          <dt className="shrink-0 font-mono text-text-muted">Weeks</dt>
          <dd className="font-mono">
            {step.weeks[0]}–{step.weeks[1]}
          </dd>
        </div>
        <div className="flex gap-2 text-label-s text-text-primary">
          <dt className="shrink-0 font-mono text-text-muted">Hours</dt>
          <dd>
            {fmt(step.hoursPerWeek)} h a week · about {fmt(step.totalHours)} h total
          </dd>
        </div>
      </dl>
      {step.resource.label && (
        <div className="space-y-1 text-label-s text-text-muted">
          <p>Resource: {step.resource.label}</p>
          <p>{step.resource.kind === 'search' ? 'Search suggestion, not checked' : 'Free'}</p>
        </div>
      )}
      {step.sdgs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {step.sdgs.map((goal) => (
            <SdgChip key={goal} goal={goal} compact />
          ))}
        </div>
      )}
      {tapHint && <p className="text-label-s text-text-muted">Tap again to see its step details.</p>}
    </div>
  )
}

export function RoadmapTimeline({
  steps,
  startDate,
  today,
  impactArea,
  selectedStepId,
  onSelectStep
}: RoadmapTimelineProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [dragging, setDragging] = useState(false)
  // Bars ignore the pointer only once a drag has moved; doing it on mousedown sent every plain click to the track.
  const [panning, setPanning] = useState(false)
  const [hovered, setHovered] = useState<HoverState | null>(null)
  const pointerTypeRef = useRef('mouse')
  const tappedStepRef = useRef<string | null>(null)
  const dragRef = useRef({ moved: false, x: 0, sl: 0 })
  const anchorRef = useRef<{ fraction: number; cursorV: number } | null>(null)

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => setViewport(el.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const totalWeeks = Math.max(1, ...steps.map((step) => step.weeks[1]))
  // On phones each row's name sits on its own line above the bar, so the side label column goes.
  const phone = viewport < 640
  const labelW = phone ? 0 : DESKTOP_LABEL_W
  const trackFit = Math.max(120, viewport - labelW)
  const trackW = trackFit * zoom
  const pxWeek = trackW / totalWeeks

  // Week ticks are labelled at most every 4 weeks, and never closer than MIN_TICK_PX apart.
  const tickInterval = 4 * Math.max(1, Math.ceil(MIN_TICK_PX / Math.max(pxWeek, 0.001) / 4))
  const tickWeeks = useMemo(() => {
    const weeks: number[] = []
    for (let week = 1; week <= totalWeeks; week += tickInterval) {
      if ((week - 1) * pxWeek + `W${week}`.length * MONO_CHAR_PX + 6 <= trackW) weeks.push(week)
    }
    return weeks
  }, [totalWeeks, tickInterval, pxWeek, trackW])
  const monthBuckets = useMemo(() => {
    let last: number | null = null
    const buckets: { week: number; date: Date }[] = []
    for (let week = 1; week <= totalWeeks; week++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + (week - 1) * 7)
      const key = date.getFullYear() * 12 + date.getMonth()
      if (key !== last) {
        buckets.push({ week, date })
        last = key
      }
    }
    return buckets
  }, [startDate, totalWeeks])
  // Long plans label every 2nd, 3rd, 6th or 12th month so each label stays whole and the gridlines stay evenly
  // spaced; a label shows its year when the year changes. The plan's first, partial month gives way to the next
  // labelled month when the two would collide.
  const monthLabels = useMemo(() => {
    const monthPx = (pxWeek * 52) / 12
    const stride = MONTH_STRIDES.find((each) => each * monthPx >= MONTH_LABEL_PX) ?? 12
    const labels: { week: number; x: number; text: string }[] = []
    let freeFrom = 0
    let lastYear: number | null = null
    for (const bucket of monthBuckets) {
      if (bucket.date.getMonth() % stride !== 0 && bucket.week > 1) continue
      const x = (bucket.week - 1) * pxWeek
      if (x < freeFrom && labels.length === 1 && labels[0].week === 1) {
        labels.pop()
        freeFrom = 0
        lastYear = null
      }
      const year = bucket.date.getFullYear()
      const text = new Intl.DateTimeFormat(
        'en-GB',
        year !== lastYear ? { month: 'short', year: 'numeric' } : { month: 'short' }
      )
        .format(bucket.date)
        // en-GB writes September as "Sept"; three letters keep every month label the same width.
        .replace('Sept', 'Sep')
      const width = text.length * MONO_CHAR_PX + 6
      if (x < freeFrom || x + width > trackW) continue
      labels.push({ week: bucket.week, x, text })
      lastYear = year
      freeFrom = x + width + LABEL_GAP_PX
    }
    return labels
  }, [monthBuckets, pxWeek, trackW])
  // Gridlines follow the labelled months, so long plans keep a calm grid.
  const monthWeeks = monthLabels.filter((label) => label.week > 1).map((label) => label.week)

  // Keeps the content point under the pointer in place while zooming.
  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const el = scrollRef.current
    if (!anchor || !el) {
      anchorRef.current = null
      return
    }
    el.scrollLeft = Math.max(0, anchor.fraction * trackW - anchor.cursorV + labelW)
    anchorRef.current = null
  }, [zoom, trackW, labelW])

  // React wheel handlers cannot preventDefault, so the listener is native.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const next = Math.min(MAX_ZOOM, Math.max(1, zoom * Math.exp(-event.deltaY * 0.002)))
      if (next === zoom) return
      const rect = el.getBoundingClientRect()
      const cursorV = event.clientX - rect.left
      const trackCursor = Math.min(Math.max(el.scrollLeft + cursorV - labelW, 0), trackW)
      anchorRef.current = { fraction: trackCursor / trackW, cursorV }
      setZoom(next)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoom, trackW, labelW])

  function zoomBy(factor: number) {
    const el = scrollRef.current
    if (!el) return
    const next = Math.min(MAX_ZOOM, Math.max(1, zoom * factor))
    if (next === zoom) return
    const cursorV = el.clientWidth / 2
    const trackCursor = Math.min(Math.max(el.scrollLeft + cursorV - labelW, 0), trackW)
    anchorRef.current = { fraction: trackCursor / trackW, cursorV }
    setZoom(next)
  }

  function fitPlan() {
    anchorRef.current = null
    setZoom(1)
    const el = scrollRef.current
    if (el) el.scrollLeft = 0
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    // A finished mouse drag must not swallow the next tap.
    dragRef.current.moved = false
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const el = scrollRef.current
    if (!el) return
    dragRef.current = { moved: false, x: event.clientX, sl: el.scrollLeft }
    setDragging(true)
  }

  // Mouse dragging pans sideways; drag marks on the bar suppress its click.
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const el = scrollRef.current
    const drag = dragRef.current
    if (!el || !dragging) return
    const dx = event.clientX - drag.x
    if (Math.abs(dx) > DRAG_PX && !drag.moved) {
      drag.moved = true
      setPanning(true)
    }
    if (drag.moved) el.scrollLeft = drag.sl - dx
  }

  function onPointerUp() {
    setDragging(false)
    setPanning(false)
  }

  function onPointerLeave() {
    setDragging(false)
    setPanning(false)
    setHovered(null)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const el = scrollRef.current
    if (!el) return
    if (event.key === 'ArrowLeft') {
      el.scrollLeft -= PAN_PX
      event.preventDefault()
    } else if (event.key === 'ArrowRight') {
      el.scrollLeft += PAN_PX
      event.preventDefault()
    } else if (event.key === 'Home') {
      el.scrollLeft = 0
      event.preventDefault()
    } else if (event.key === 'End') {
      el.scrollLeft = el.scrollWidth
      event.preventDefault()
    }
  }

  const rowLabels = useMemo(() => {
    const seen = new Map<string, number>()
    return steps.map((step) => {
      const count = (seen.get(step.skill) ?? 0) + 1
      seen.set(step.skill, count)
      return count === 1 ? step.skill : `${step.skill} · Step ${count}`
    })
  }, [steps])

  const todayX = (() => {
    const start = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    const daysFromStart = (current - start) / (24 * 60 * 60 * 1000)
    return Math.max(0, Math.min(trackW, (daysFromStart / (totalWeeks * 7)) * trackW))
  })()

  const clearTip = () => {
    setHovered(null)
    tappedStepRef.current = null
  }

  // A tapped tooltip stays until the next tap lands somewhere other than a timeline bar.
  useEffect(() => {
    if (!hovered?.tapped) return
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-timeline-bar]')) clearTip()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [hovered?.tapped])

  function showTip(step: TimelineStep, element: HTMLElement, tapped = false) {
    const host = sectionRef.current
    if (!host) return
    const bar = element.getBoundingClientRect()
    const hostRect = host.getBoundingClientRect()
    const left = Math.max(0, Math.min(bar.left - hostRect.left, hostRect.width - TOOLTIP_W))
    const top = bar.top - hostRect.top
    setHovered({
      stepId: step.id,
      left,
      top,
      bottom: top + bar.height,
      below: top < 170,
      tapped
    })
  }

  const hoveredStep = hovered ? (steps.find((step) => step.id === hovered.stepId) ?? null) : null
  const showWeekGrid = pxWeek >= WEEK_GRID_PX

  return (
    <section
      ref={sectionRef}
      aria-labelledby="timeline-title"
      className="relative space-y-3 rounded-md border border-border-subtle bg-bg-default p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 id="timeline-title" className="text-title-s text-text-primary">
          Timeline
        </h2>
        {steps.length > 0 && (
          <div className="flex items-center gap-2">
            <IconButton label="Zoom In" icon={Plus} onClick={() => zoomBy(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM} />
            <IconButton label="Zoom Out" icon={Minus} onClick={() => zoomBy(1 / ZOOM_STEP)} disabled={zoom <= 1} />
            <Button variant="secondary" onClick={fitPlan}>
              Fit Plan
            </Button>
          </div>
        )}
      </div>

      {steps.length > 0 ? (
        <>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5" aria-label="Timeline Legend">
            <li className="inline-flex items-center gap-1.5 text-label-s text-text-muted">
              <span
                aria-hidden="true"
                className="h-3.5 w-6 rounded-sm border-[1.5px] border-text-primary bg-accent-box"
              />
              Next Step
            </li>
            <li className="inline-flex items-center gap-1.5 text-label-s text-text-muted">
              <span
                aria-hidden="true"
                className="h-3.5 w-6 rounded-sm border-[1.5px] border-text-primary bg-radar-you-fill"
              />
              Upcoming Step
            </li>
            <li className="inline-flex items-center gap-1.5 text-label-s text-text-muted">
              <span
                aria-hidden="true"
                className="h-3.5 w-6 rounded-sm border-[1.5px] border-state-success bg-state-success"
              />
              Done Step
            </li>
            <li className="inline-flex items-center gap-1.5 text-label-s text-text-muted">
              <span aria-hidden="true" className="h-3.5 border-l-2 border-text-primary" />
              Today
            </li>
          </ul>

          <div
            ref={scrollRef}
            role="group"
            tabIndex={0}
            aria-label="Zoom and pan the timeline. Ctrl or Cmd plus the mouse wheel zooms, arrow keys pan, dragging pans when zoomed in."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            onKeyDown={onKeyDown}
            onScroll={clearTip}
            className={`overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
              dragging ? 'cursor-grabbing select-none' : 'cursor-grab'
            }`}
          >
            <div style={{ width: `${labelW + trackW}px` }}>
              <div className="grid" style={{ gridTemplateColumns: `${labelW}px ${trackW}px` }}>
                <div aria-hidden="true" className="sticky left-0 z-20 bg-bg-default" />
                <div className="relative pb-3">
                  <div className="relative h-6" aria-hidden="true">
                    {monthLabels.map((label) => (
                      <span
                        key={label.week}
                        className="absolute top-0 h-6 whitespace-nowrap border-l border-border-control pl-1.5 font-mono text-mono-s text-text-primary"
                        style={{ left: label.x }}
                      >
                        {label.text}
                      </span>
                    ))}
                  </div>
                  <div className="relative h-6" aria-hidden="true">
                    {tickWeeks.map((week) => (
                      <span
                        key={week}
                        className="absolute top-0 h-6 border-l border-border-subtle pl-1.5 font-mono text-mono-s text-text-muted"
                        style={{ left: (week - 1) * pxWeek }}
                      >
                        {`W${week}`}
                      </span>
                    ))}
                  </div>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 top-0 z-10 border-l-2 border-text-primary"
                    style={{ left: todayX }}
                  />
                </div>
              </div>

              {steps.map((step, index) => {
                const last = index === steps.length - 1
                const selected = selectedStepId === step.id
                const impact = impactArea !== null && step.sdgs.includes(impactArea)
                const left = (step.weeks[0] - 1) * pxWeek
                const width = Math.max((step.weeks[1] - step.weeks[0] + 1) * pxWeek, 8)
                // The row already names the step, so the bar carries when and how much. It sits inside the bar when it
                // fits, otherwise just outside it: to the right, or to the left at the end of the plan. A bar without a
                // label has no padding, so it renders at exactly this width and the label beside it never touches it.
                const fullLabel = `${weekRange(step.weeks)} · ${fmt(step.hoursPerWeek)} h/wk`
                const labelWidth = (text: string) => text.length * LABEL_CHAR_PX + 16
                const barLabel = labelWidth(fullLabel) <= width ? fullLabel : null
                const outsideLabel = barLabel ? null : fullLabel
                const outsideRight = left + width + 4 + labelWidth(fullLabel) <= trackW
                const barColor = step.conditional
                  ? 'border-dashed border-border-control bg-bg-panel'
                  : step.state === 'next'
                    ? 'on-accent border-text-primary bg-accent-box'
                    : step.state === 'done'
                      ? 'border-state-success bg-state-success text-bg-default'
                      : 'border-text-primary bg-radar-you-fill'

                return (
                  <div key={step.id}>
                    {phone && (
                      <p
                        className="sticky left-0 truncate pt-2 text-label-m text-text-primary"
                        style={{ width: viewport }}
                      >
                        {rowLabels[index]}
                      </p>
                    )}
                    <div className="grid" style={{ gridTemplateColumns: `${labelW}px ${trackW}px` }}>
                      <div className="sticky left-0 z-20 min-w-0 bg-bg-default pt-1.5 lg:min-h-14">
                        {!phone && (
                          <>
                            <p className="truncate pr-2 text-label-m text-text-primary">{rowLabels[index]}</p>
                            <div className="hidden flex-wrap gap-1 pt-1 lg:flex">
                              {step.sdgs.map((goal) => (
                                <SdgChip key={goal} goal={goal} compact />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="relative h-10 lg:h-14">
                        {showWeekGrid && (
                          <span
                            aria-hidden="true"
                            className="absolute bottom-0 left-0 right-0 top-0"
                            style={{
                              backgroundImage: `repeating-linear-gradient(to right, var(--color-border-subtle) 0 1px, transparent 1px ${pxWeek}px)`
                            }}
                          />
                        )}
                        {monthWeeks.map((week) => (
                          <span
                            key={week}
                            aria-hidden="true"
                            className="absolute bottom-0 top-0 border-l border-border-control"
                            style={{ left: (week - 1) * pxWeek }}
                          />
                        ))}
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute bottom-0 top-0 border-l border-border-subtle"
                          style={{ left: todayX }}
                        />
                        <button
                          type="button"
                          aria-pressed={selected}
                          aria-label={`${step.skill}, weeks ${step.weeks[0]} to ${step.weeks[1]}, ${fmt(step.hoursPerWeek)} h a week, about ${fmt(step.totalHours)} h total`}
                          data-timeline-bar
                          onPointerDown={(event) => {
                            pointerTypeRef.current = event.pointerType
                          }}
                          onClick={(event) => {
                            if (dragRef.current.moved) return
                            // Touch has no hover, so the first tap on a bar shows its details and a second tap opens
                            // its step. Keyboard clicks (detail 0) open the step straight away.
                            if (pointerTypeRef.current === 'touch' && event.detail > 0) {
                              if (tappedStepRef.current !== step.id) {
                                tappedStepRef.current = step.id
                                showTip(step, event.currentTarget, true)
                                return
                              }
                              clearTip()
                            }
                            onSelectStep(step.id)
                            // A later click with no pointerdown (assistive tech) opens the step straight away.
                            pointerTypeRef.current = 'mouse'
                          }}
                          // On touch only the click opens the tooltip: iOS Safari drops the click when a hover
                          // handler changes the page, which would turn two taps into three.
                          onMouseEnter={(event) => {
                            if (pointerTypeRef.current !== 'touch') showTip(step, event.currentTarget)
                          }}
                          onMouseLeave={clearTip}
                          onFocus={(event) => {
                            if (event.currentTarget.matches(':focus-visible')) showTip(step, event.currentTarget)
                          }}
                          onBlur={clearTip}
                          className={`absolute top-[6px] flex h-7 min-w-[8px] touch-manipulation items-center overflow-hidden rounded-md border-[1.5px] text-left font-sans text-label-s cursor-pointer lg:h-11 lg:top-[6px] focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ${barColor} ${
                            impact ? 'ring-2 ring-offset-1 ring-offset-bg-default ring-text-primary' : ''
                          } ${barLabel ? 'px-2' : 'px-0'} ${
                            // Bars sit above every label; a selected bar still stays under the frozen name column.
                            selected ? 'z-15 outline outline-2 outline-offset-1 outline-text-primary' : 'z-10'
                          }`}
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                            pointerEvents: panning ? 'none' : undefined
                          }}
                        >
                          {barLabel && <span className="truncate">{barLabel}</span>}
                        </button>
                        {outsideLabel && (
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none absolute top-[6px] z-5 flex h-7 items-center whitespace-nowrap rounded-sm bg-bg-default px-1 text-label-s text-text-primary lg:h-11 ${
                              outsideRight ? '' : '-translate-x-full'
                            }`}
                            style={{ left: outsideRight ? left + width + 4 : left - 4 }}
                          >
                            {outsideLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    {last && (
                      <div
                        className="grid"
                        style={{ gridTemplateColumns: `${labelW}px ${trackW}px` }}
                        aria-hidden="true"
                      >
                        <div className="sticky left-0 z-20 bg-bg-default" />
                        <div className="relative h-7">
                          <span
                            className={`absolute top-1.5 whitespace-nowrap rounded-full bg-text-primary px-2 py-0.5 text-label-s text-bg-default ${
                              todayX <= 32
                                ? 'translate-x-0'
                                : todayX >= trackW - 32
                                  ? '-translate-x-full'
                                  : '-translate-x-1/2'
                            }`}
                            style={{ left: todayX }}
                          >
                            Today
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {hoveredStep && hovered && (
            <div
              role="tooltip"
              aria-hidden="true"
              className="pointer-events-none absolute z-40 w-64 rounded-sm border border-border-subtle bg-bg-default p-3 shadow-popover"
              style={{
                left: hovered.left,
                top: hovered.below ? hovered.bottom : hovered.top,
                transform: hovered.below ? 'none' : 'translateY(calc(-100% - 6px))'
              }}
            >
              <StepTooltip step={hoveredStep} tapHint={hovered.tapped} />
            </div>
          )}
        </>
      ) : (
        <p className="rounded-md border border-border-subtle bg-bg-panel p-4 text-body-s text-text-muted">
          No Roadmap Steps Are Available For This Snapshot.
        </p>
      )}

      <div className="sr-only">
        <table>
          <caption>Roadmap timeline by week</caption>
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">Start Week</th>
              <th scope="col">End Week</th>
              <th scope="col">Hours per Week</th>
              <th scope="col">SDG Goals</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => (
              <tr key={step.id}>
                <th scope="row">{rowLabels[index]}</th>
                <td>{step.weeks[0]}</td>
                <td>{step.weeks[1]}</td>
                <td>{fmt(step.hoursPerWeek)}</td>
                <td>{step.sdgs.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
