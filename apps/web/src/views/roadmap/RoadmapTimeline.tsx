import { Fragment } from 'react'
import { SdgChip } from '../../components/ui/SdgChip'
import { user } from '../../demo/data'
import type { RoadmapStep } from '../../demo/types'

interface RoadmapTimelineProps {
  steps: RoadmapStep[]
  startDate: Date
}

const monthNumbers = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getSampleToday() {
  const dateMatch = user.lastCheckUp.match(/(\d{1,2}) ([A-Za-z]{3}) (\d{4})/)
  const monthIndex = monthNumbers.indexOf(dateMatch?.[2] ?? '')

  return new Date(Number(dateMatch?.[3]), monthIndex, Number(dateMatch?.[1]))
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

function WeekLines({ totalWeeks }: { totalWeeks: number }) {
  return (
    <div
      className="absolute inset-0 grid"
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
      className={`absolute top-1/2 z-10 flex h-8 -translate-y-1/2 items-center overflow-hidden rounded-sm border-[1.5px] px-2 font-sans text-label-s text-text-primary ${
        step.conditional
          ? 'border-dashed border-border-control bg-bg-panel'
          : step.state === 'next'
            ? 'border-text-primary bg-accent-box'
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
    <div className="flex min-w-0 flex-col justify-center gap-1 py-2">
      <p className="text-label-m text-text-primary">{step.skill}</p>
      <div className="flex flex-wrap gap-1">
        {step.sdgs.map((goal) => (
          <SdgChip key={goal} goal={goal} compact />
        ))}
      </div>
    </div>
  )
}

export function RoadmapTimeline({ steps, startDate }: RoadmapTimelineProps) {
  const totalWeeks = Math.max(...steps.map((step) => step.weeks[1]))
  const weeksPerMonth = Math.ceil(totalWeeks / 3)
  const monthCount = Math.ceil(totalWeeks / weeksPerMonth)
  const monthLabels = getMonthLabels(startDate, monthCount)
  const today = getSampleToday()
  const weeksUntilToday = (today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
  const todayPosition = Math.max(0, Math.min(100, (weeksUntilToday / totalWeeks) * 100))

  return (
    <section
      aria-labelledby="timeline-title"
      className="space-y-3 rounded-md border border-border-subtle bg-bg-default p-5"
    >
      <h2 id="timeline-title" className="text-title-s text-text-primary">
        Timeline
      </h2>

      <div className="hidden grid-cols-[minmax(0,236px)_minmax(0,1fr)] gap-x-3 lg:grid">
        <div aria-hidden="true" />
        <div className="space-y-1">
          <MonthGrid labels={monthLabels} />
          <WeekGrid totalWeeks={totalWeeks} />
        </div>
        <div aria-hidden="true" />
        <div className="relative h-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 z-20 border-l-2 border-text-primary"
            style={{ left: `${todayPosition}%` }}
          >
            <span className="absolute left-0 rounded-full bg-text-primary px-2 py-0.5 text-label-s text-bg-default">
              Today
            </span>
          </div>
        </div>
        {steps.map((step) => (
          <Fragment key={step.id}>
            <StepLabel step={step} />
            <div className="relative min-h-12">
              <WeekLines totalWeeks={totalWeeks} />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 z-20 border-l-2 border-text-primary"
                style={{ left: `${todayPosition}%` }}
              />
              <TimelineBar step={step} totalWeeks={totalWeeks} />
            </div>
          </Fragment>
        ))}
      </div>

      <div className="space-y-2 lg:hidden">
        <MonthGrid labels={monthLabels} />
        <WeekGrid totalWeeks={totalWeeks} compact />
        <div className="relative h-6">
          <span
            className="absolute rounded-full bg-text-primary px-2 py-0.5 text-label-s text-bg-default"
            style={{ left: `${todayPosition}%` }}
          >
            Today
          </span>
        </div>
        {steps.map((step) => (
          <div key={step.id} className="space-y-1">
            <StepLabel step={step} />
            <div className="relative h-10">
              <WeekLines totalWeeks={totalWeeks} />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 z-20 border-l-2 border-text-primary"
                style={{ left: `${todayPosition}%` }}
              />
              <TimelineBar step={step} totalWeeks={totalWeeks} />
            </div>
          </div>
        ))}
      </div>

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
