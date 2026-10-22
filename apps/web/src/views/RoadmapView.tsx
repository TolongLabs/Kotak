import { Clock3 } from 'lucide-react'
import { useState } from 'react'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { DatePicker } from '../components/ui/DatePicker'
import { ScenarioSwitch, type ScenarioValue } from '../components/ui/ScenarioSwitch'
import { Slider } from '../components/ui/Slider'
import { SourceReference } from '../components/kotak/SourceReference'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { Reasoning } from '../components/kotak/Reasoning'
import { renderCited } from '../components/kotak/renderCited'
import { VerdictChip } from '../components/ui/VerdictChip'
import { corners, dividend, roadmap, readiness, roles, sources, user } from '../demo/data'
import type { RoadmapStep } from '../demo/types'
import { RoadmapStepCard } from '../components/kotak/RoadmapStepCard'
import { ReadinessChart } from './roadmap/ReadinessChart'
import { RoadmapTimeline } from './roadmap/RoadmapTimeline'

const monthNumbers = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const hourWords = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

function getInitialStartDate() {
  const dateMatch = roadmap[0]?.when.match(/(\d{1,2})[–-]\d{1,2}\s+([A-Za-z]{3})/)
  const yearMatch = user.lastCheckUp.match(/\d{4}/)
  const monthIndex = monthNumbers.indexOf(dateMatch?.[2] ?? '')

  return new Date(Number(yearMatch?.[0]), monthIndex, Number(dateMatch?.[1]))
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
    .format(date)
    .replace(',', '')
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDayMonth(date: Date) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date)
}

function formatStepWhen(step: RoadmapStep, startDate: Date) {
  const [startWeek, endWeek] = step.weeks
  const kind = step.when.split(' · ')[1]

  if (kind === 'Practice Project') return `Weeks ${startWeek}–${endWeek} · ${kind}`

  const firstDay = addDays(startDate, (startWeek - 1) * 7)
  const lastDay = addDays(startDate, endWeek * 7 - 1)
  const lastDayLabel = firstDay.getMonth() === lastDay.getMonth() ? String(lastDay.getDate()) : formatDayMonth(lastDay)
  const conditionalLabel = step.conditional ? ` · ${step.conditional}` : ''

  return `Weeks ${startWeek}–${endWeek} · ${formatDayMonth(firstDay)}–${lastDayLabel}${conditionalLabel}`
}

function DividendCard() {
  return (
    <section aria-labelledby="dividend-title" className="space-y-3">
      <div className="space-y-2 rounded-md border-[1.5px] border-text-primary bg-accent-box p-4 text-accent-on-box">
        <h3 id="dividend-title" className="flex items-center gap-2 text-label-l">
          <Clock3 className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
          {dividend.title}
        </h3>
        <p className="text-body-s">{renderCited(dividend.body)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border-subtle bg-bg-default p-3">
        <VerdictChip verdict={dividend.lessImportant.verdict} size="sm" />
        <p className="min-w-0 flex-1 text-body-s text-text-primary">{renderCited(dividend.lessImportant.text)}</p>
      </div>
    </section>
  )
}

export function RoadmapView() {
  const [hoursPerWeek, setHoursPerWeek] = useState(
    roadmap.find((step) => !step.conditional && step.state === 'todo')?.hoursPerWeek ?? roadmap[0]?.hoursPerWeek ?? 1
  )
  const [startDate, setStartDate] = useState(getInitialStartDate)
  const [scenario, setScenario] = useState<ScenarioValue>('slow')

  const visibleSteps = roadmap.filter((step) => !step.conditional || scenario === 'fast')
  const reasoningCorner = corners.find((corner) => corner.name === roadmap[0]?.skill)
  const reasonText = reasoningCorner?.reasoning ?? roles.find((role) => role.title === user.targetRole)?.reasoning ?? ''
  const citedNumbers = new Set([
    ...(reasoningCorner?.sources ?? []),
    ...(dividend.sources ?? []),
    ...visibleSteps.flatMap((step) => (step.resource.citation ? [step.resource.citation] : []))
  ])
  const citedSources = sources.filter((source) => citedNumbers.has(source.n))
  const readyWeek = readiness.readyBy.match(/Week \d+/)?.[0] ?? ''
  const readyPhrase = readiness.readyBy.split(' · ')[0]
  const planSummary = `${user.targetRole} · ${readyPhrase} at ${hoursPerWeek} h a Week · Starts ${formatDate(startDate)}`
  const speech = `Your plan is ready. ${hourWords[hoursPerWeek] ?? hoursPerWeek} hours a week gets you there by ${readyWeek}.`

  function printPlan() {
    window.print()
  }

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 12mm; }
          body:has(.roadmap-view) * { visibility: hidden !important; }
          body:has(.roadmap-view) .roadmap-view,
          body:has(.roadmap-view) .roadmap-view * { visibility: visible !important; }
          body:has(.roadmap-view) .roadmap-view {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body:has(.roadmap-view) .roadmap-print-actions { display: none !important; }
          body:has(.roadmap-view) .roadmap-sticky-column { position: static !important; }
        }
      `}</style>
      <div className="roadmap-view space-y-5 lg:space-y-6">
        <CatDialogue pose="happy" speech={speech} />

        <Banner type="sample" />

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-title-m text-text-primary lg:text-title-l">Your 12-Week Roadmap</h1>
            <p className="text-body-s text-text-muted">{planSummary}</p>
          </div>
          <Button
            variant="secondary"
            className="roadmap-print-actions hidden shrink-0 lg:inline-flex"
            onClick={printPlan}
          >
            Export as PDF
          </Button>
        </header>

        <section
          aria-label="Plan controls"
          className="grid gap-6 rounded-md border border-border-subtle bg-bg-panel p-5 lg:grid-cols-3"
        >
          <Slider
            label="Hours per Week"
            min={1}
            max={10}
            step={1}
            value={hoursPerWeek}
            onChange={setHoursPerWeek}
            unit="h"
          />
          <DatePicker label="Plan Start Date" value={startDate} onChange={setStartDate} className="w-full" />
          <div className="space-y-2">
            <span className="block text-label-m text-text-primary">AI Uptake Scenario</span>
            <ScenarioSwitch value={scenario} onChange={setScenario} className="w-full sm:w-fit" />
          </div>
        </section>

        <ReadinessChart scenario={scenario} />

        <RoadmapTimeline steps={visibleSteps} startDate={startDate} />

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-6">
          <section
            aria-labelledby="step-details-title"
            className="space-y-3 rounded-md border border-border-subtle bg-bg-default p-5"
          >
            <h2 id="step-details-title" className="text-title-s text-text-primary">
              Step Details
            </h2>
            <div>
              {visibleSteps.map((step, index) => (
                <RoadmapStepCard
                  key={step.id}
                  step={{ ...step, when: formatStepWhen(step, startDate) }}
                  index={index}
                  last={index === visibleSteps.length - 1}
                />
              ))}
            </div>
          </section>

          <div className="roadmap-sticky-column space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section aria-label="Roadmap reasoning">
              <Reasoning text={reasonText} />
            </section>
            <DividendCard />
          </div>
        </div>

        <section aria-labelledby="sources-title" className="space-y-3">
          <h2 id="sources-title" className="text-title-s text-text-primary">
            Sources
          </h2>
          <div className="space-y-2">
            {citedSources.map((source) => (
              <SourceReference key={source.n} source={source} />
            ))}
          </div>
        </section>

        <div className="roadmap-print-actions hidden lg:block">
          <Button variant="primary" fullWidth onClick={printPlan}>
            Save My Plan
          </Button>
        </div>
        <div className="roadmap-print-actions surface-glass sticky bottom-0 z-10 -mx-3 grid grid-cols-2 gap-3 p-3 lg:hidden">
          <Button variant="primary" fullWidth onClick={printPlan}>
            Save My Plan
          </Button>
          <Button variant="secondary" fullWidth onClick={printPlan}>
            Export as PDF
          </Button>
        </div>
      </div>
    </>
  )
}
