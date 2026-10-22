import { Clock3 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { Reasoning } from '../components/kotak/Reasoning'
import { RoadmapStepCard } from '../components/kotak/RoadmapStepCard'
import { SourceReference } from '../components/kotak/SourceReference'
import { renderCited } from '../components/kotak/renderCited'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { Checkbox } from '../components/ui/Checkbox'
import { DatePicker } from '../components/ui/DatePicker'
import { ScenarioSwitch, type ScenarioValue } from '../components/ui/ScenarioSwitch'
import { SdgChip } from '../components/ui/SdgChip'
import { Slider } from '../components/ui/Slider'
import { useRoleBundle } from '../engine/bundle'
import { computeCheckup } from '../engine/checkup'
import { toReadinessPoints, toRoadmapSources, toRoadmapSteps } from '../engine/roadmapModel'
import { cornerReasoning } from '../engine/viewModel'
import type { RoadmapStep } from '../demo/types'
import { updateGuestSession, useGuestSession } from '../session/store'
import { ReadinessChart } from './roadmap/ReadinessChart'
import { RoadmapTimeline } from './roadmap/RoadmapTimeline'

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function fromIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  })
    .format(new Date(`${value}T00:00:00Z`))
    .replace(',', '')
}

function formatEstimate(value: number) {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(value)
}

function DividendCard({ body, lessImportant }: { body: string; lessImportant: string[] }) {
  return (
    <section aria-labelledby="dividend-title" className="space-y-3">
      <div className="space-y-2 rounded-md border-[1.5px] border-text-primary bg-accent-box p-4 text-accent-on-box">
        <h3 id="dividend-title" className="flex items-center gap-2 text-label-l">
          <Clock3 className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
          AI Dividend
        </h3>
        <p className="text-body-s">{renderCited(body)}</p>
      </div>
      <div className="space-y-2 rounded-md border border-border-subtle bg-bg-default p-3">
        <h3 className="text-label-m text-text-primary">Less Important</h3>
        {lessImportant.length > 0 ? (
          <ul className="list-inside list-disc space-y-1 text-body-s text-text-primary">
            {lessImportant.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-body-s text-text-muted">No skills are marked as less important in this plan.</p>
        )}
      </div>
    </section>
  )
}

function RoadmapStepWithoutResource({ step }: { step: RoadmapStep }) {
  return (
    <article className="min-w-0 flex-1 space-y-2 rounded-md border border-border-subtle bg-bg-default p-4">
      <p className="font-mono text-mono-s text-text-muted">{step.when}</p>
      <h3 className="text-title-s text-text-primary">{step.title || step.skill}</h3>
      <p className="text-body-s text-text-primary">{step.gain}</p>
      <p className="flex items-center gap-2 text-body-s text-text-primary">
        <Clock3 className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
        <span>{step.hoursPerWeek} h a Week</span>
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        {step.sdgs.map((goal) => (
          <SdgChip key={goal} goal={goal} />
        ))}
      </div>
    </article>
  )
}

export function RoadmapView() {
  const session = useGuestSession()
  const bundle = useRoleBundle(session.role_code)
  const [scenario, setScenario] = useState<ScenarioValue>('slow')
  const [today] = useState(() => toIsoDate(new Date()))
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null)
  const roleBundle = bundle.status === 'ready' ? bundle.data : null
  const startDate = selectedStartDate ?? today

  const checkups = useMemo(() => {
    if (!roleBundle) return null

    const common = {
      role: roleBundle.role,
      related: roleBundle.related,
      answers: session.answers,
      snapshotId: session.active_snapshot_id,
      weeklyHours: session.custom_weekly_hours,
      startDate
    }

    return {
      slow: computeCheckup({ ...common, scenario: 'slow' }),
      fast: computeCheckup({ ...common, scenario: 'fast' })
    }
  }, [roleBundle, session.active_snapshot_id, session.answers, session.custom_weekly_hours, startDate])

  if (!session.role_code) {
    return (
      <div className="mx-auto w-full max-w-[45rem] space-y-6">
        <CatDialogue pose="worried" speech="Tell me your job first, then I can make a roadmap for it." />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Choose Your Job
        </Button>
      </div>
    )
  }

  if (bundle.status === 'error') {
    return (
      <div className="mx-auto w-full max-w-[45rem] space-y-6">
        <Banner type="error" title="Kopi Could Not Open This Job" body="Reload the page, or choose your job again." />
        <Button variant="secondary" size="lg" fullWidth onClick={bundle.retry}>
          Try Again
        </Button>
      </div>
    )
  }

  if (!checkups || bundle.status !== 'ready') {
    return (
      <div className="mx-auto w-full max-w-[45rem]">
        <CatDialogue pose="thinking" speech="Opening the box on your job…" />
      </div>
    )
  }

  if (!checkups.slow.questionsReady) {
    return (
      <div className="mx-auto w-full max-w-[45rem] space-y-6">
        <Banner
          type="info"
          title="Roadmap Skills Are Not Ready"
          body="Kopi has no can-do statements or learning hours for this job yet. Choose a related job for now."
        />
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Choose Another Job
        </Button>
      </div>
    )
  }

  const role = bundle.data.role
  const checkup = scenario === 'fast' ? checkups.fast : checkups.slow
  const steps = toRoadmapSteps(checkup, role, session.ticked_milestones)
  const readinessPoints = toReadinessPoints(checkups.slow, checkups.fast, role)
  const sourceRefs = toRoadmapSources(checkup)
  const dividend = checkup.roadmap.dividend
  const dividendBody =
    dividend.sources.length > 0 && dividend.weekly_hours_saved > 0
      ? `AI could save about ${formatEstimate(dividend.weekly_hours_saved)} hours a week. About ${formatEstimate(dividend.default_weekly_hours)} hours a week could go to learning. ${sourceRefs.dividendNumbers.map((number) => `[${number}]`).join('')}`
      : 'There is no source-backed estimate of time saved for this role yet.'
  const lessImportant = checkup.roadmap.items
    .filter((item) => item.tag !== null)
    .map((item) => {
      const corner = role.corners.find((entry) => entry.corner_id === item.corner_id)
      return `${corner?.name ?? item.corner_id} · ${corner?.statements?.[item.statement] ?? ''}`
    })
  const reasonStep = steps[0]
  const reasonCorner = reasonStep && checkup.corners.find((corner) => corner.corner_id === reasonStep.id.split(':')[0])
  const reasonNumbers = reasonCorner ? (sourceRefs.cornerNumbers.get(reasonCorner.corner_id) ?? []) : []
  const reasonText =
    reasonCorner && reasonNumbers.length > 0
      ? `${cornerReasoning(reasonCorner.verdict, scenario)} Kopi marks this skill ${reasonCorner.verdict.status.toLocaleLowerCase()}. ${reasonNumbers.map((number) => `[${number}]`).join('')}`
      : ''

  function toggleMilestone(id: string, checked: boolean) {
    const ticked = new Set(session.ticked_milestones)
    if (checked) ticked.add(id)
    else ticked.delete(id)
    updateGuestSession({ ticked_milestones: [...ticked] })
  }

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
        <CatDialogue
          pose="happy"
          speech={
            steps.length > 0
              ? `Your roadmap is ready. About ${Math.ceil(checkup.roadmap.weeks)} weeks at ${formatEstimate(checkup.roadmap.weekly_hours)} hours a week. Estimated finish: ${formatDate(checkup.roadmap.finish_date)}.`
              : 'There are no learning steps for this snapshot yet.'
          }
        />

        {role.quality === 'auto-generated' && (
          <Banner
            type="info"
            title="AI-Drafted Skills"
            body="Kopi drafted these skills from the job’s O*NET tasks. The team has not checked them by hand yet."
          />
        )}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-title-m text-text-primary lg:text-title-l">Your Roadmap</h1>
            <p className="text-body-s text-text-muted">
              {role.title} · About {formatEstimate(checkup.roadmap.total_hours)} Learning Hours · About{' '}
              {Math.ceil(checkup.roadmap.weeks)} Weeks
            </p>
            <p className="text-body-s text-text-muted">Estimated Finish: {formatDate(checkup.roadmap.finish_date)}</p>
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
          aria-label="Plan Controls"
          className="grid gap-6 rounded-md border border-border-subtle bg-bg-panel p-5 lg:grid-cols-3"
        >
          <div className="space-y-2">
            <Slider
              label="Hours Per Week"
              min={1}
              max={10}
              step={1}
              value={session.custom_weekly_hours ?? checkup.roadmap.weekly_hours}
              onChange={(value) => updateGuestSession({ custom_weekly_hours: value })}
              unit="h"
            />
            <p className="text-body-s text-text-muted">Roadmap hours and dates are estimates.</p>
          </div>
          <DatePicker
            label="Plan Start Date"
            value={fromIsoDate(checkup.roadmap.start_date)}
            onChange={(date) => setSelectedStartDate(toIsoDate(date))}
            className="w-full"
          />
          <div className="space-y-2">
            <span className="block text-label-m text-text-primary">AI Uptake Scenario</span>
            <ScenarioSwitch value={scenario} onChange={setScenario} className="w-full sm:w-fit" />
          </div>
        </section>

        <ReadinessChart scenario={scenario} points={readinessPoints} />

        <RoadmapTimeline steps={steps} startDate={fromIsoDate(checkup.roadmap.start_date)} />

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-6">
          <section
            aria-labelledby="step-details-title"
            className="space-y-3 rounded-md border border-border-subtle bg-bg-default p-5"
          >
            <h2 id="step-details-title" className="text-title-s text-text-primary">
              Step Details
            </h2>
            {steps.length > 0 ? (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="space-y-1">
                    <Checkbox
                      label={`Mark ${step.skill} Complete`}
                      checked={step.state === 'done'}
                      onChange={(checked) => toggleMilestone(step.id, checked)}
                    />
                    {step.resource.href && step.resource.label ? (
                      <RoadmapStepCard step={step} index={index} last={index === steps.length - 1} />
                    ) : (
                      <RoadmapStepWithoutResource step={step} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-border-subtle bg-bg-panel p-4 text-body-s text-text-muted">
                No learning steps are needed for this snapshot.
              </p>
            )}
          </section>

          <div className="roadmap-sticky-column space-y-4 lg:sticky lg:top-24 lg:self-start">
            {reasonText && (
              <section aria-label="Roadmap Reasoning">
                <Reasoning text={reasonText} />
              </section>
            )}
            <DividendCard body={dividendBody} lessImportant={lessImportant} />
          </div>
        </div>

        <section aria-labelledby="sources-title" className="space-y-3">
          <h2 id="sources-title" className="text-title-s text-text-primary">
            Sources
          </h2>
          {sourceRefs.sources.length > 0 ? (
            <div className="space-y-2">
              {sourceRefs.sources.map((source) => (
                <SourceReference key={source.n} source={source} />
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-border-subtle bg-bg-panel p-4 text-body-s text-text-muted">
              No sources are available for this role yet.
            </p>
          )}
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
