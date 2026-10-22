import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
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
const MOBILE_LABEL_W = 104
const DESKTOP_LABEL_W = 236
const TOOLTIP_W = 264

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(date)
}

interface HoverState {
  stepId: string
  left: number
  top: number
  bottom: number
  below: boolean
}

function StepTooltip({ step }: { step: TimelineStep }) {
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
      {step.resource.label && <p className="text-label-s text-text-muted">Resource: {step.resource.label}</p>}
      {step.sdgs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {step.sdgs.map((goal) => (
            <SdgChip key={goal} goal={goal} compact />
          ))}
        </div>
      )}
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
  const [hovered, setHovered] = useState<HoverState | null>(null)
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
  const labelW = viewport < 640 ? MOBILE_LABEL_W : DESKTOP_LABEL_W
  const trackFit = Math.max(120, viewport - labelW)
  const trackW = trackFit * zoom
  const pxWeek = trackW / totalWeeks

  // Week ticks are labelled at most every 4 weeks, and never closer than MIN_TICK_PX apart.
  const tickInterval = 4 * Math.max(1, Math.ceil(MIN_TICK_PX / Math.max(pxWeek, 0.001) / 4))
  const tickWeeks = useMemo(() => {
    const weeks: number[] = []
    for (let week = 1; week <= totalWeeks; week += tickInterval) weeks.push(week)
    return weeks
  }, [totalWeeks, tickInterval])
  const monthBuckets = useMemo(() => {
    let last: string | null = null
    const buckets: { week: number; label: string }[] = []
    for (let week = 1; week <= totalWeeks; week++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + (week - 1) * 7)
      const label = formatMonth(date)
      if (label !== last) {
        buckets.push({ week, label })
        last = label
      }
    }
    return buckets
  }, [startDate, totalWeeks])
  const monthWeeks = useMemo(
    () => monthBuckets.filter((bucket) => bucket.week > 1).map((bucket) => bucket.week),
    [monthBuckets]
  )

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
    if (Math.abs(dx) > DRAG_PX) drag.moved = true
    if (drag.moved) el.scrollLeft = drag.sl - dx
  }

  function onPointerUp() {
    setDragging(false)
  }

  function onPointerLeave() {
    setDragging(false)
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

  const clearTip = () => setHovered(null)

  function showTip(step: TimelineStep, element: HTMLElement) {
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
      below: top < 170
    })
  }

  const hoveredStep = hovered ? (steps.find((step) => step.id === hovered.stepId) ?? null) : null
  const showWeekGrid = pxWeek >= 7

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
                    {monthBuckets.map((bucket, i) => {
                      const x = (bucket.week - 1) * pxWeek
                      const end = i + 1 < monthBuckets.length ? (monthBuckets[i + 1].week - 1) * pxWeek : trackW
                      return (
                        <span
                          key={bucket.week}
                          className="absolute top-0 h-6 truncate font-mono text-mono-s text-text-muted"
                          style={{ left: x, width: Math.max(end - x, 1) }}
                        >
                          {bucket.label}
                        </span>
                      )
                    })}
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
                const innerLabel =
                  width >= 150
                    ? `${fmt(step.hoursPerWeek)} h/wk · ${rowLabels[index]}`
                    : width >= 92
                      ? rowLabels[index]
                      : ''
                const barColor = step.conditional
                  ? 'border-dashed border-border-control bg-bg-panel'
                  : step.state === 'next'
                    ? 'on-accent border-text-primary bg-accent-box'
                    : step.state === 'done'
                      ? 'border-state-success bg-state-success text-bg-default'
                      : 'border-text-primary bg-radar-you-fill'

                return (
                  <div key={step.id} className="grid" style={{ gridTemplateColumns: `${labelW}px ${trackW}px` }}>
                    <div className="sticky left-0 z-20 min-h-10 min-w-0 bg-bg-default pt-1.5 lg:min-h-14">
                      <p className="truncate pr-2 text-label-s text-text-primary lg:text-label-m">{rowLabels[index]}</p>
                      <div className="hidden flex-wrap gap-1 pt-1 lg:flex">
                        {step.sdgs.map((goal) => (
                          <SdgChip key={goal} goal={goal} compact />
                        ))}
                      </div>
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
                      {last && (
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute bottom-0 z-20 rounded-full bg-text-primary px-2 py-0.5 text-label-s text-bg-default ${
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
                      )}
                      <button
                        type="button"
                        aria-pressed={selected}
                        aria-label={`${step.skill}, weeks ${step.weeks[0]} to ${step.weeks[1]}, ${fmt(step.hoursPerWeek)} h a week, about ${fmt(step.totalHours)} h total`}
                        onClick={() => {
                          if (!dragRef.current.moved) onSelectStep(step.id)
                        }}
                        onMouseEnter={(event) => showTip(step, event.currentTarget)}
                        onMouseLeave={clearTip}
                        onFocus={(event) => showTip(step, event.currentTarget)}
                        onBlur={clearTip}
                        className={`absolute top-[6px] flex h-7 min-w-[8px] items-center overflow-hidden rounded-md border-[1.5px] px-2 text-left font-sans text-label-s cursor-pointer lg:h-11 lg:top-[6px] focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ${barColor} ${
                          impact ? 'ring-2 ring-offset-1 ring-offset-bg-default ring-text-primary' : ''
                        } ${selected ? 'z-30 outline outline-2 outline-offset-1 outline-text-primary' : 'z-10'}`}
                        style={{
                          left: `${left}px`,
                          width: `${width}px`,
                          pointerEvents: dragging ? 'none' : undefined
                        }}
                      >
                        <span className="truncate">{innerLabel}</span>
                      </button>
                    </div>
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
              <StepTooltip step={hoveredStep} />
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
                <td>{step.hoursPerWeek}</td>
                <td>{step.sdgs.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
