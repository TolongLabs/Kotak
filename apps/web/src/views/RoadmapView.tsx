import { DEFAULT_SCENARIO } from '@kotak/shared'
import { Check, Clock3 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { Reasoning } from '../components/kotak/Reasoning'
import { RoadmapStepCard } from '../components/kotak/RoadmapStepCard'
import { SourceList } from '../components/kotak/SourceList'
import { renderCited } from '../components/kotak/renderCited'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { DatePicker } from '../components/ui/DatePicker'
import { SdgChip } from '../components/ui/SdgChip'
import { Slider } from '../components/ui/Slider'
import { checkUpSteps, Stepper } from '../components/ui/Stepper'
import { VerdictChip, type VerdictType } from '../components/ui/VerdictChip'
import { useRoleBundle } from '../engine/bundle'
import { assessedRoleCode, computeCheckup } from '../engine/checkup'
import { toReadinessPoints, toRoadmapSources, toRoadmapSteps } from '../engine/roadmapModel'
import { cornerReasoning } from '../engine/viewModel'
import type { RoadmapStep } from '../demo/types'
import { updateGuestSession, useGuestSession } from '../session/store'
import { FreeUpTimeCard } from './roadmap/FreeUpTimeCard'
import { ReadinessChart } from './roadmap/ReadinessChart'
import { RoadmapTimeline } from './roadmap/RoadmapTimeline'
import { type TimelineStep } from './roadmap/planSupport'

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

function formatStepWhen(value: string) {
  return value.replace(/^Estimated · /, '')
}

function toVerdictType(value: string | undefined): VerdictType | undefined {
  const verdicts: VerdictType[] = ['rising', 'steady', 'declining', 'split', 'unknown']
  const normalized = value?.toLocaleLowerCase()
  return verdicts.find((verdict) => verdict === normalized)
}

interface LessImportantItem {
  id: string
  verdict?: VerdictType
  text: string
}

function RoadmapStepToggle({
  step,
  onChange,
  children
}: {
  step: RoadmapStep
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <div className="relative">
      <input
        type="checkbox"
        checked={step.state === 'done'}
        aria-label={`Mark ${step.skill} ${step.state === 'done' ? 'Incomplete' : 'Complete'}`}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="absolute left-0 top-0 z-20 h-7 w-7 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
      />
      {children}
    </div>
  )
}

function RoadmapStepWithoutResource({
  step,
  index,
  last,
  highlighted,
  selected,
  onSelect,
  stepRef
}: {
  step: RoadmapStep
  index: number
  last: boolean
  highlighted: boolean
  selected: boolean
  onSelect: () => void
  stepRef: (element: HTMLElement | null) => void
}) {
  const border = step.conditional
    ? 'border-[1.5px] border-dashed border-border-control bg-bg-panel'
    : step.state === 'next'
      ? 'border-[1.5px] border-text-primary bg-bg-default'
      : 'border border-border-subtle bg-bg-default'

  return (
    <div className="relative flex gap-3 sm:gap-4">
      <div className="relative flex w-7 shrink-0 justify-center">
        {!last && <span className="absolute bottom-0 top-7 w-px bg-border-subtle" aria-hidden="true" />}
        <span
          className={`relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] font-mono text-mono-s ${
            step.state === 'next'
              ? 'on-accent border-text-primary bg-accent-box text-text-primary'
              : step.state === 'done'
                ? 'border-state-success bg-state-success text-bg-default'
                : 'border-border-control bg-bg-default text-text-primary'
          }`}
          aria-hidden="true"
        >
          {step.state === 'done' ? <Check className="h-4 w-4 stroke-current" /> : index + 1}
        </span>
      </div>
      <article
        ref={stepRef}
        aria-current={selected ? 'true' : undefined}
        onClick={onSelect}
        className={`min-w-0 flex-1 cursor-pointer space-y-2 rounded-md p-4 ${border} ${
          highlighted ? 'ring-2 ring-offset-2 ring-offset-bg-default ring-text-primary' : ''
        } ${selected ? 'outline outline-2 outline-offset-2 outline-text-primary' : ''}`}
      >
        <p className="font-mono text-mono-s text-text-muted">{formatStepWhen(step.when)}</p>
        <h3 className="text-title-s text-text-primary">{step.title || step.skill}</h3>
        {step.description && <p className="text-body-s text-text-primary">{step.description}</p>}
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
    </div>
  )
}

export function RoadmapView() {
  const session = useGuestSession()
  const bundle = useRoleBundle(assessedRoleCode(session))
  const scenario = DEFAULT_SCENARIO
  const [today] = useState(() => toIsoDate(new Date()))
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const cardRefs = useRef(new Map<string, HTMLElement | null>())
  const startDate = selectedStartDate ?? today

  const checkup = useMemo(() => {
    if (bundle.status !== 'ready') return null

    return computeCheckup({
      role: bundle.data.role,
      related: bundle.data.related,
      answers: session.answers,
      snapshotId: session.active_snapshot_id,
      scenario: DEFAULT_SCENARIO,
      weeklyHours: session.custom_weekly_hours,
      startDate,
      planRoleCode: session.plan_role_code
    })
  }, [
    bundle,
    session.answers,
    session.custom_weekly_hours,
    session.active_snapshot_id,
    session.plan_role_code,
    startDate
  ])

  // Clicking a step bar or a readiness point scrolls its Step Details card into view.
  useEffect(() => {
    if (!selectedStepId) return
    cardRefs.current.get(selectedStepId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedStepId])

  // The Weekly Hours after applying the AI dividend, with the readiness week it would bring.
  const projection = useMemo(() => {
    if (!checkup || bundle.status !== 'ready') return null
    const dividend = checkup.roadmap.dividend
    if (!(dividend.sources.length > 0 && dividend.weekly_hours_saved > 0)) return null
    const base = session.custom_weekly_hours ?? checkup.roadmap.weekly_hours
    const proposed = Math.min(10, Math.round((base + dividend.weekly_hours_saved) * 2) / 2)
    if (proposed <= base + 0.001) return { proposed: null, readyWeek: null }
    const data = bundle.data
    const role =
      [data.role, ...data.related].find((candidate) => candidate.onet_code === checkup.planRoleCode) ?? data.role
    const checkupWithHours = computeCheckup({
      role: data.role,
      related: data.related,
      answers: session.answers,
      snapshotId: checkup.snapshotId,
      scenario: checkup.scenario,
      weeklyHours: proposed,
      startDate,
      planRoleCode: checkup.planRoleCode
    })
    const points = toReadinessPoints(checkupWithHours, role)
    const readyWeek = points.find((point) => point.plan >= 80)?.week ?? null
    return { proposed, readyWeek }
  }, [checkup, bundle, session.answers, session.custom_weekly_hours, startDate])

  if (!session.role_code) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <Stepper step={5} labels={checkUpSteps} />
        <CatDialogue pose="worried" speech="Tell me your job first, then I can make a roadmap for it." />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Choose Your Job
        </Button>
      </div>
    )
  }

  if (bundle.status === 'error') {
    return (
      <div className="space-y-5 lg:space-y-6">
        <Stepper step={5} labels={checkUpSteps} />
        <Banner type="error" title="Kopi Could Not Open This Job" body="Reload the page, or choose your job again." />
        <Button variant="secondary" size="lg" fullWidth onClick={bundle.retry}>
          Try Again
        </Button>
      </div>
    )
  }

  if (!checkup || bundle.status !== 'ready') {
    return (
      <div className="space-y-5 lg:space-y-6">
        <Stepper step={5} labels={checkUpSteps} />
        <CatDialogue pose="thinking" speech="Opening the box on your job…" />
      </div>
    )
  }

  if (!checkup.questionsReady) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <Stepper step={5} labels={checkUpSteps} />
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

  const role =
    [bundle.data.role, ...bundle.data.related].find((candidate) => candidate.onet_code === checkup?.planRoleCode) ??
    bundle.data.role
  const steps = toRoadmapSteps(checkup, role, session.ticked_milestones)
  const stepHours = new Map(checkup.roadmap.items.map((item) => [`${item.corner_id}:${item.statement}`, item.hours]))
  const timelineSteps: TimelineStep[] = steps.map((step) => ({ ...step, totalHours: stepHours.get(step.id) ?? 0 }))
  const readinessPoints = toReadinessPoints(checkup, role)
  const impactAreaGoals = [...new Set(steps.flatMap((step) => step.sdgs))].sort((left, right) => left - right)
  const selectedImpactArea = impactAreaGoals.find((goal) => String(goal) === session.impact_area) ?? null
  const sourceRefs = toRoadmapSources(checkup)

  const cornerNames = new Map(checkup.corners.map((corner) => [corner.corner_id, corner.name]))
  const dividend = checkup.roadmap.dividend
  const hasEstimate = dividend.sources.length > 0 && dividend.weekly_hours_saved > 0
  const dividendTasks = hasEstimate
    ? [...dividend.corners]
        .filter((row) => row.weekly_hours_saved > 0)
        .sort((left, right) => right.weekly_hours_saved - left.weekly_hours_saved)
        .slice(0, 3)
        .map((row) => ({
          id: row.corner_id,
          name: cornerNames.get(row.corner_id) ?? row.corner_id,
          weeklyHoursSaved: row.weekly_hours_saved
        }))
    : []
  const currentWeeklyHours = session.custom_weekly_hours ?? checkup.roadmap.weekly_hours

  const lessImportant: LessImportantItem[] = checkup.roadmap.items
    .filter((item) => item.tag !== null)
    .map((item) => {
      const corner = role.corners.find((entry) => entry.corner_id === item.corner_id)
      const verdict = checkup.corners.find((entry) => entry.corner_id === item.corner_id)?.verdict.status
      const numbers = sourceRefs.cornerNumbers.get(item.corner_id) ?? []
      return {
        id: `${item.corner_id}:${item.statement}`,
        verdict: toVerdictType(verdict),
        text: `${corner?.name ?? item.corner_id}: ${corner?.statements?.[item.statement] ?? ''}${numbers.length > 0 ? ` ${numbers.map((number) => `[${number}]`).join('')}` : ''}`
      }
    })
  const readyPoint = readinessPoints.find((point) => point.plan >= 80)
  const readyCopy = readyPoint
    ? `Ready by Week ${readyPoint.week}`
    : readinessPoints.length > 1
      ? `Not Ready Within ${Math.ceil(checkup.roadmap.weeks)} Weeks`
      : 'No Readiness Estimate Yet'
  const planWeeks = Math.ceil(checkup.roadmap.weeks)
  const reasonStep = steps[0]
  const reasonCorner = reasonStep && checkup.corners.find((corner) => corner.corner_id === reasonStep.id.split(':')[0])
  const reasonNumbers = reasonCorner ? (sourceRefs.cornerNumbers.get(reasonCorner.corner_id) ?? []) : []
  const reasonText =
    reasonCorner && reasonNumbers.length > 0
      ? `${cornerReasoning(reasonCorner.verdict, scenario)} Kopi marks this skill ${reasonCorner.verdict.status.toLocaleLowerCase()}. ${reasonNumbers.map((number) => `[${number}]`).join('')}`
      : ''

  function recordRef(stepId: string) {
    return (element: HTMLElement | null) => {
      if (element) cardRefs.current.set(stepId, element)
      else cardRefs.current.delete(stepId)
    }
  }

  function toggleMilestone(id: string, checked: boolean) {
    const ticked = new Set(session.ticked_milestones)
    if (checked) ticked.add(id)
    else ticked.delete(id)
    updateGuestSession({ ticked_milestones: [...ticked] })
  }

  function selectImpactArea(goal: number | null) {
    updateGuestSession({ impact_area: goal === null ? null : String(goal) })
  }

  function applyDividend() {
    if (!projection?.proposed) return
    updateGuestSession({ custom_weekly_hours: projection.proposed })
  }

  function selectStep(stepId: string) {
    setSelectedStepId(stepId)
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
        <Stepper step={5} labels={checkUpSteps} className="roadmap-print-actions" />

        <CatDialogue
          pose="happy"
          speech={
            steps.length > 0
              ? readyPoint
                ? `Your plan is ready. ${formatEstimate(checkup.roadmap.weekly_hours)} hours a week gets you there by Week ${readyPoint.week}.`
                : `Your plan is ready. About ${planWeeks} weeks at ${formatEstimate(checkup.roadmap.weekly_hours)} hours a week.`
              : 'There are no learning steps for this snapshot yet.'
          }
        />

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-title-m text-text-primary lg:text-title-l">
              {planWeeks > 0 ? `Your ${planWeeks}-Week Roadmap` : 'Your Roadmap'}
            </h1>
            <p className="text-body-s text-text-muted">
              {role.title} · {readyCopy} at {formatEstimate(checkup.roadmap.weekly_hours)} h a Week · Starts{' '}
              {formatDate(checkup.roadmap.start_date)}
            </p>
          </div>
          <div className="roadmap-print-actions hidden shrink-0 items-center gap-3 lg:flex">
            <Button variant="secondary" onClick={printPlan}>
              Export as PDF
            </Button>
          </div>
        </header>

        <section
          aria-label="Plan Controls"
          className="grid gap-6 rounded-md border border-border-subtle bg-bg-panel p-5 lg:grid-cols-2"
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
          </div>
          <DatePicker
            label="Plan Start Date"
            value={fromIsoDate(checkup.roadmap.start_date)}
            onChange={(date) => setSelectedStartDate(toIsoDate(date))}
            className="w-full"
          />
        </section>

        <ReadinessChart
          points={readinessPoints}
          roleTitle={role.title}
          startIso={checkup.roadmap.start_date}
          todayIso={today}
          steps={timelineSteps}
          onSelectStep={selectStep}
        />

        {impactAreaGoals.length > 0 && (
          <section
            aria-labelledby="impact-area-title"
            className="space-y-3 rounded-md border border-border-subtle bg-bg-panel p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="impact-area-title" className="text-label-l text-text-primary">
                Impact Area
              </h2>
              <p className="text-body-s text-text-muted">Highlight Steps By SDG</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter Steps By SDG Impact Area">
              <button
                type="button"
                aria-pressed={selectedImpactArea === null}
                onClick={() => selectImpactArea(null)}
                className={`inline-flex min-h-11 items-center rounded-full border px-3 py-2 text-label-s transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                  selectedImpactArea === null
                    ? 'border-text-primary bg-text-primary text-bg-default'
                    : 'border-border-control bg-bg-default text-text-primary hover:bg-bg-panel'
                }`}
              >
                Show All
              </button>
              {impactAreaGoals.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  aria-pressed={selectedImpactArea === goal}
                  onClick={() => selectImpactArea(goal)}
                  className="inline-flex min-h-11 items-center rounded-full p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <SdgChip
                    goal={goal}
                    className={
                      selectedImpactArea === goal
                        ? 'outline outline-2 outline-offset-2 outline-text-primary'
                        : undefined
                    }
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        <RoadmapTimeline
          steps={timelineSteps}
          startDate={fromIsoDate(checkup.roadmap.start_date)}
          today={fromIsoDate(today)}
          impactArea={selectedImpactArea}
          selectedStepId={selectedStepId}
          onSelectStep={selectStep}
        />

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-6">
          <section
            aria-labelledby="step-details-title"
            className="space-y-4 rounded-md border border-border-subtle bg-bg-default p-5"
          >
            <h2 id="step-details-title" className="text-title-s text-text-primary">
              Step Details
            </h2>
            {steps.length > 0 ? (
              <div className="space-y-0">
                {steps.map((step, index) => (
                  <RoadmapStepToggle
                    key={step.id}
                    step={step}
                    onChange={(checked) => toggleMilestone(step.id, checked)}
                  >
                    {step.resource.href && step.resource.label ? (
                      <RoadmapStepCard
                        step={{ ...step, when: formatStepWhen(step.when) }}
                        index={index}
                        last={index === steps.length - 1}
                        highlighted={selectedImpactArea !== null && step.sdgs.includes(selectedImpactArea)}
                        selected={selectedStepId === step.id}
                        onSelect={() => selectStep(step.id)}
                        stepRef={recordRef(step.id)}
                      />
                    ) : (
                      <RoadmapStepWithoutResource
                        step={step}
                        index={index}
                        last={index === steps.length - 1}
                        highlighted={selectedImpactArea !== null && step.sdgs.includes(selectedImpactArea)}
                        selected={selectedStepId === step.id}
                        onSelect={() => selectStep(step.id)}
                        stepRef={recordRef(step.id)}
                      />
                    )}
                  </RoadmapStepToggle>
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
              <section aria-label="Roadmap Reasoning" className="[&>section>p:first-of-type]:text-body-s">
                <Reasoning text={reasonText} />
              </section>
            )}
            <FreeUpTimeCard
              estimate={
                hasEstimate
                  ? {
                      weeklyHoursSaved: dividend.weekly_hours_saved,
                      tasks: dividendTasks,
                      citations: sourceRefs.dividendNumbers
                    }
                  : null
              }
              currentWeeklyHours={currentWeeklyHours}
              proposedWeeklyHours={projection?.proposed ?? null}
              readyWeekBefore={readyPoint?.week ?? null}
              readyWeekAfter={projection?.readyWeek ?? null}
              planWeeks={planWeeks}
              onApply={applyDividend}
            />
            <div className="space-y-2">
              {lessImportant.length > 0 ? (
                lessImportant.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 rounded-md border border-border-subtle bg-bg-default px-4 py-3"
                  >
                    {item.verdict && <VerdictChip verdict={item.verdict} size="sm" />}
                    <p className="min-w-0 text-body-s text-text-primary">{renderCited(item.text)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-border-subtle bg-bg-default p-3">
                  <p className="text-body-s text-text-muted">No skills are marked as less important in this plan.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {sourceRefs.sources.length > 0 ? (
          <SourceList sources={sourceRefs.sources} />
        ) : (
          <p className="rounded-md border border-border-subtle bg-bg-panel p-4 text-body-s text-text-muted">
            No sources are available for this role yet.
          </p>
        )}

        {/* One print action per screen: the header button on desktop, this sticky bar on phones. The plan already stays on
            this device, so nothing here claims to save it. */}
        <div className="roadmap-print-actions surface-glass sticky bottom-3 z-10 rounded-md p-3 lg:hidden">
          <Button variant="primary" size="lg" fullWidth onClick={printPlan}>
            Export as PDF
          </Button>
        </div>
      </div>
    </>
  )
}
