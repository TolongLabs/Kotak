import { Fragment } from 'react'
import { SdgChip } from '../../components/ui/SdgChip'
import type { RoadmapStep } from '../../demo/types'

interface RoadmapTimelineProps {
  steps: RoadmapStep[]
  startDate: Date
  today: Date
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(date)
}

function getMonthLabels(startDate: Date, monthCount: number) {
  return Array.from({ length: monthCount }, (_, index) => {
    return formatMonth(new Date(startDate.getFullYear(), startDate.getMonth() + index, 1))
  })
}

function getStepStart(step: RoadmapStep, totalWeeks: number) {
  return ((step.weeks[0] - 1) / totalWeeks) * 100
}

function getStepWidth(step: RoadmapStep, totalWeeks: number) {
  return ((step.weeks[1] - step.weeks[0] + 1) / totalWeeks) * 100
}

function getTodayPosition(startDate: Date, today: Date, totalWeeks: number) {
  const start = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const daysFromStart = (current - start) / (24 * 60 * 60 * 1000)
  return Math.max(0, Math.min(100, (daysFromStart / (totalWeeks * 7)) * 100))
}

function WeekGrid({ totalWeeks, compact = false }: { totalWeeks: number; compact?: boolean }) {
  const labelInterval = Math.ceil(totalWeeks / 3)

  return (
    <div
      className="grid h-6"
      style={{ gridTemplateColumns: `repeat(${totalWeeks}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {Array.from({ length: totalWeeks }, (_, index) => {
        const week = index + 1
        const showLabel = !compact || week === 1 || week === totalWeeks || (week - 1) % labelInterval === 0

        return (
          <span
            key={week}
            className="border-l border-border-subtle text-center font-mono text-mono-s text-text-muted last:border-r"
          >
            {showLabel ? `W${week}` : ''}
          </span>
        )
      })}
    </div>
  )
}

function MonthGrid({ labels }: { labels: string[] }) {
  return (
    <div
      className="grid font-mono text-mono-s text-text-muted"
      style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
    >
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  )
}

function WeekLines({ totalWeeks, className = 'absolute inset-0' }: { totalWeeks: number; className?: string }) {
  return (
    <div
      className={`${className} grid`}
      style={{ gridTemplateColumns: `repeat(${totalWeeks}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {Array.from({ length: totalWeeks }, (_, index) => (
        <span key={index} className="border-l border-border-subtle last:border-r" />
      ))}
    </div>
  )
}

function TimelineBar({ step, totalWeeks }: { step: RoadmapStep; totalWeeks: number }) {
  const start = getStepStart(step, totalWeeks)
  const width = getStepWidth(step, totalWeeks)
  const label = `${step.hoursPerWeek} h/wk · ${step.title}`

  return (
    <span
      title={label}
      className={`absolute top-0 z-10 flex h-7 items-center overflow-hidden rounded-md border-[1.5px] px-2 font-sans text-label-s text-text-primary lg:h-11 lg:px-3 ${
        step.conditional
          ? 'border-dashed border-border-control bg-bg-panel'
          : step.state === 'next'
            ? 'on-accent border-text-primary bg-accent-box'
            : 'border-text-primary bg-radar-you-fill'
      }`}
      style={{ left: `${start}%`, width: `${width}%` }}
    >
      <span className="truncate">{label}</span>
    </span>
  )
}

function StepLabel({ step }: { step: RoadmapStep }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-3 pt-1.5 lg:px-0 lg:pt-0">
      <p className="text-label-s text-text-primary lg:text-label-m">{step.skill}</p>
      <div className="hidden flex-wrap gap-1 lg:flex">
        {step.sdgs.map((goal) => (
          <SdgChip key={goal} goal={goal} compact />
        ))}
      </div>
    </div>
  )
}

function TodayMarker({
  position,
  label = false,
  lineClassName = 'inset-y-0'
}: {
  position: number
  label?: boolean
  lineClassName?: string
}) {
  const labelPosition = position < 8 ? 'translate-x-0' : position > 92 ? '-translate-x-full' : '-translate-x-1/2'

  return (
    <>
      <span
        className={`pointer-events-none absolute ${lineClassName} z-20 border-l-2 border-text-primary`}
        style={{ left: `${position}%` }}
        aria-hidden="true"
      />
      {label && (
        <span
          className={`pointer-events-none absolute bottom-0 z-20 rounded-full bg-text-primary px-2 py-0.5 text-label-s text-bg-default ${labelPosition}`}
          style={{ left: `${position}%` }}
          aria-hidden="true"
        >
          Today
        </span>
      )}
    </>
  )
}

export function RoadmapTimeline({ steps, startDate, today }: RoadmapTimelineProps) {
  const totalWeeks = Math.max(1, ...steps.map((step) => step.weeks[1]))
  const weeksPerMonth = Math.ceil(totalWeeks / 3)
  const monthCount = Math.ceil(totalWeeks / weeksPerMonth)
  const monthLabels = getMonthLabels(startDate, monthCount)
  const todayPosition = getTodayPosition(startDate, today, totalWeeks)

  return (
    <section
      aria-labelledby="timeline-title"
      className="space-y-3 rounded-md border border-border-subtle bg-bg-default p-5"
    >
      <h2 id="timeline-title" className="text-title-s text-text-primary">
        Timeline
      </h2>

      {steps.length > 0 ? (
        <>
          <div className="hidden grid-cols-[minmax(0,236px)_minmax(0,1fr)] gap-x-3 lg:grid">
            <div aria-hidden="true" />
            <div className="space-y-1 pb-3">
              <MonthGrid labels={monthLabels} />
              <WeekGrid totalWeeks={totalWeeks} />
            </div>
            {steps.map((step, index) => (
              <Fragment key={step.id}>
                <StepLabel step={step} />
                <div className="relative h-[68px]">
                  <WeekLines totalWeeks={totalWeeks} className="absolute -top-3 inset-x-0 bottom-0" />
                  <TodayMarker
                    position={todayPosition}
                    label={index === steps.length - 1}
                    lineClassName={index === 0 ? '-top-4 bottom-0' : 'inset-y-0'}
                  />
                  <TimelineBar step={step} totalWeeks={totalWeeks} />
                </div>
              </Fragment>
            ))}
          </div>

          <div className="lg:hidden">
            <div className="space-y-0">
              <MonthGrid labels={monthLabels} />
              <WeekGrid totalWeeks={totalWeeks} compact />
            </div>
            <div className="relative mt-0 min-h-[260px]">
              <WeekLines totalWeeks={totalWeeks} className="absolute inset-x-0 top-0 bottom-7" />
              <div className="relative z-10 space-y-2.5">
                {steps.map((step) => (
                  <div key={step.id} className="space-y-1">
                    <StepLabel step={step} />
                    <div className="relative h-7">
                      <TimelineBar step={step} totalWeeks={totalWeeks} />
                    </div>
                  </div>
                ))}
              </div>
              <TodayMarker position={todayPosition} label lineClassName="top-0 bottom-7" />
            </div>
          </div>
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
            {steps.map((step) => (
              <tr key={step.id}>
                <th scope="row">{step.title}</th>
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
