import { accessFor } from '@kotak/sdk'
import { addDays, MAX_WEEKLY_HOURS, MIN_WEEKLY_HOURS, needsQualification, REFRESHER_ID } from '@kotak/shared'
import { Gauge } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { AccessNotice } from '../components/kotak/AccessNotice'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { Reasoning } from '../components/kotak/Reasoning'
import { RoadmapStepCard } from '../components/kotak/RoadmapStepCard'
import { ScenarioControl } from '../components/kotak/ScenarioControl'
import { SourceList } from '../components/kotak/SourceList'
import { ToolsCard } from '../components/kotak/ToolsCard'
import { renderCited } from '../components/kotak/renderCited'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { DatePicker } from '../components/ui/DatePicker'
import { SdgChip } from '../components/ui/SdgChip'
import { Slider } from '../components/ui/Slider'
import { Stepper } from '../components/ui/Stepper'
import { VerdictChip, type VerdictType } from '../components/ui/VerdictChip'
import { useCheckupBundle } from '../engine/bundle'
import { assessedRoleCode, computeCheckup, type Checkup } from '../engine/checkup'
import { toIsoDate } from '../engine/dates'
import {
  planWeeksFor,
  toReadinessPoints,
  toReadinessWindow,
  toRoadmapSources,
  toRoadmapWindow
} from '../engine/roadmapModel'
import { isEstimatedLevel } from '../engine/viewModel'
import type { RoadmapStep } from '../demo/types'
import { useScenario } from '../session/scenario'
import { hasAnswers, updateGuestSession, useGuestSession } from '../session/store'
import { FreeUpTimeCard } from './roadmap/FreeUpTimeCard'
import { EmployerFundingCard } from './roadmap/EmployerFundingCard'
import { PathContributionCard } from './roadmap/PathContributionCard'
import { ReadinessChart } from './roadmap/ReadinessChart'
import { PaceMathsCard } from './roadmap/PaceMathsCard'
import { RoadmapTimeline } from './roadmap/RoadmapTimeline'
import { type TimelineStep } from './roadmap/planSupport'
import { startAgain } from './checkup/startAgain'
import { commonText } from '../i18n/common'
import { dateLocale, useLocale } from '../i18n/locale'
import { roadmapText } from '../i18n/messages/roadmap'
import { useText } from '../i18n/text'

function fromIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(dateLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  })
    .format(new Date(`${value}T00:00:00Z`))
    .replace(',', '')
}

function formatDayMonth(value: string) {
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00Z`)
  )
}

function formatSourceDate(value: string) {
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${value}T00:00:00Z`))
}

function formatEstimate(value: number) {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(value)
}

function formatStepWhen(value: string, estimated: string) {
  const prefix = `${estimated} · `
  return value.startsWith(prefix) ? value.slice(prefix.length) : value.replace(/^Estimated · /, '')
}

function buildRoadmapReason(
  verdict: Checkup['corners'][number]['verdict'],
  scenario: Checkup['scenario'],
  citationNumbers: number[],
  t: typeof roadmapText.en,
  common: typeof commonText.en
) {
  let reason = ''
  if (verdict.reason === 'scenarios_disagree' || verdict.reason === 'sources_disagree') {
    const slow = verdict.futures.find((future) => future.scenario === 'slow')?.status ?? 'Unknown'
    const fast = verdict.futures.find((future) => future.scenario === 'fast')?.status ?? 'Unknown'
    const cause = verdict.reason === 'scenarios_disagree' ? t.reasoning.twoFutures : t.reasoning.jobAdSources
    reason = t.reasoning.disagree(cause, common.verdicts[slow], common.verdicts[fast])
  } else if (verdict.reason === 'too_few_points') {
    reason = t.reasoning.tooFewPoints
  } else if (verdict.reason === 'no_collaboration_split') {
    reason = t.reasoning.noCollaborationSplit
  } else if (verdict.reason === 'no_demand') {
    reason = t.reasoning.noDemand
  } else {
    const outcome = verdict.scenarios[scenario]
    const trend = t.reasoning.aiTrend[outcome.ai_trend === 'not_rising' ? 'notRising' : outcome.ai_trend]
    const mode = t.reasoning.aiMode[outcome.collaboration_mode]
    const demand = t.reasoning.demand[outcome.demand]
    reason = t.reasoning.tableReason(trend, mode, demand)
  }
  const status = common.verdicts[verdict.status]
  const citations = citationNumbers.map((number) => `[${number}]`).join('')
  return `${reason} ${t.reasoning.skillMark(status)} ${citations}`
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

export function RoadmapView() {
  const locale = useLocale()
  const t = useText(roadmapText)
  const common = useText(commonText)
  const session = useGuestSession()
  const bundle = useCheckupBundle(session)
  const [scenario, setScenario] = useScenario()
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
      scenario,
      weeklyHours: session.custom_weekly_hours,
      profile: session.profile,
      startDate,
      planRoleCode: session.plan_role_code
    })
  }, [
    bundle,
    locale,
    session.answers,
    session.custom_weekly_hours,
    session.active_snapshot_id,
    session.plan_role_code,
    session.profile,
    startDate,
    scenario
  ])

  // Clicking a step bar or a readiness point scrolls its Step Details card into view.
  useEffect(() => {
    if (!selectedStepId) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    cardRefs.current
      .get(selectedStepId)
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' })
  }, [selectedStepId])

  // The Weekly Hours after applying the AI dividend, with the readiness week it would bring.
  const projection = useMemo(() => {
    if (!checkup || bundle.status !== 'ready') return null
    const dividend = checkup.roadmap.dividend
    if (!(dividend.sources.length > 0 && dividend.weekly_hours_saved > 0)) return null
    const base = session.custom_weekly_hours ?? checkup.roadmap.weekly_hours
    const proposed = Math.min(MAX_WEEKLY_HOURS, Math.round((base + dividend.weekly_hours_saved) * 2) / 2)
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
      profile: session.profile,
      startDate,
      planRoleCode: checkup.planRoleCode
    })
    const readyWeek = toReadinessPoints(checkupWithHours, role).find((point) => point.plan >= 80)?.week ?? null
    return { proposed, readyWeek }
  }, [checkup, bundle, session.answers, session.custom_weekly_hours, session.profile, startDate, locale])

  if (!assessedRoleCode(session) || !hasAnswers(session)) {
    const next = startAgain(session)
    const speech = t.startAgain.speech[next.speech as keyof typeof t.startAgain.speech] ?? next.speech
    const label = t.startAgain.label[next.label as keyof typeof t.startAgain.label] ?? next.label
    return (
      <div className="space-y-5 lg:space-y-6">
        <Stepper step={5} />
        <CatDialogue pose="worried" speech={t.startAgain.continueSpeech(speech)} />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(startAgain(session).route)}>
          {label}
        </Button>
      </div>
    )
  }

  if (bundle.status === 'error') {
    return (
      <div className="space-y-5 lg:space-y-6">
        <Stepper step={5} />
        <Banner type="error" title={t.errors.openJobTitle} body={t.errors.reloadOrChooseJob} />
        <Button variant="secondary" size="lg" fullWidth onClick={bundle.retry}>
          {common.tryAgain}
        </Button>
      </div>
    )
  }

  if (!checkup || bundle.status !== 'ready') {
    return (
      <div className="space-y-5 lg:space-y-6">
        <Stepper step={5} />
        <CatDialogue pose="thinking" speech={t.errors.openingJob} />
      </div>
    )
  }

  if (!checkup.questionsReady) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <Stepper step={5} />
        <Banner type="info" title={t.errors.skillsNotReadyTitle} body={t.errors.skillsNotReadyBody} />
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          {t.errors.chooseAnotherJob}
        </Button>
      </div>
    )
  }

  const role =
    [bundle.data.role, ...bundle.data.related].find((candidate) => candidate.onet_code === checkup?.planRoleCode) ??
    bundle.data.role
  // The fast future's multiplier, quoted from the data in See the Maths (#389).
  const scenarioAnchors = role.signals[checkup.snapshotId]?.anchors
  const fullReadiness = toReadinessPoints(checkup, role)
  const planWeeks = planWeeksFor(fullReadiness, (point) => point.plan)
  const { steps, stepHours, partialIds, later, remainingHours } = toRoadmapWindow(
    checkup,
    role,
    session.ticked_milestones,
    planWeeks
  )
  const pace = checkup.roadmap.pace
  const refresherDone = session.ticked_milestones.includes(REFRESHER_ID)
  const refresherWeeks = pace.refresher ? t.stepCard.weekRange(...pace.refresher.weeks) : ''
  const refresherCopy = pace.refresher
    ? (t.pace.refreshers[pace.refresher.id as keyof typeof t.pace.refreshers] ?? pace.refresher)
    : null
  const refresherStep: RoadmapStep | null = pace.refresher && {
    id: REFRESHER_ID,
    // Never 'next': the first skill step keeps the yellow strip and the refresher its dashed look.
    state: refresherDone ? 'done' : 'todo',
    weeks: pace.refresher.weeks,
    when: `${refresherWeeks} · ${formatDayMonth(addDays(checkup.roadmap.start_date, (pace.refresher.weeks[0] - 1) * 7))}–${formatDayMonth(addDays(checkup.roadmap.start_date, pace.refresher.weeks[1] * 7 - 1))}`,
    skill: refresherCopy?.title ?? pace.refresher.title,
    title: refresherCopy?.title ?? pace.refresher.title,
    description: refresherCopy?.description ?? pace.refresher.description,
    gain: '',
    hoursPerWeek:
      Math.round((pace.refresher.hours / (pace.refresher.weeks[1] - pace.refresher.weeks[0] + 1)) * 10) / 10,
    resource: { label: '', href: '' },
    sdgs: []
  }
  const listSteps = refresherStep ? [refresherStep, ...steps] : steps
  const timelineSteps: TimelineStep[] = steps.map((step) => ({ ...step, totalHours: stepHours.get(step.id) ?? 0 }))
  const readinessPoints = toReadinessWindow(fullReadiness, planWeeks)
  const impactAreaGoals = [...new Set(steps.flatMap((step) => step.sdgs))].sort((left, right) => left - right)
  const selectedImpactArea = impactAreaGoals.find((goal) => String(goal) === session.impact_area) ?? null
  const sourceRefs = toRoadmapSources(checkup)
  const fundingSourceNumber = sourceRefs.sources.length + 1
  const sources = [
    ...sourceRefs.sources,
    {
      n: fundingSourceNumber,
      name: 'HRD Corp',
      detail: `HRD Corp Claimable Courses · ${t.funding.accessed(formatSourceDate('2026-10-20'))}`,
      href: 'https://hrdcorp.gov.my/hrdcorp-claimable-courses'
    },
    {
      n: fundingSourceNumber + 1,
      name: 'HRD Corp',
      detail: `e-LATiH · ${t.funding.accessed(formatSourceDate('2026-10-20'))}`,
      href: 'https://elatih.hrdcorp.gov.my/about-us'
    }
  ]
  const toolsSource = bundle.data.pathways.sources.onet_tools
  const toolsSourceNumber = fundingSourceNumber + 2
  if (role.tools.length)
    sources.push({
      n: toolsSourceNumber,
      name: toolsSource.source_name,
      detail: `${toolsSource.geo_or_layer} · ${toolsSource.vintage_date}`,
      href: toolsSource.source_url
    })
  // A regulated role the user isn't qualified for puts the qualification before every skill step (#284).
  const planAccess = accessFor(role.onet_code, session.profile, bundle.data.pathways, session.role_code)
  const qualificationNeeded = needsQualification(planAccess)
  const planFit = checkup.roles.find((entry) => entry.onet_code === role.onet_code)

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
    ? readyPoint.week === 0
      ? t.fit.already
      : t.fit.byWeek(readyPoint.week)
    : readinessPoints.length > 0
      ? t.fit.belowWithin(planWeeks)
      : t.fit.noEstimate
  const reasonStep = steps[0]
  const reasonCorner = reasonStep && checkup.corners.find((corner) => corner.corner_id === reasonStep.id.split(':')[0])
  const reasonNumbers = reasonCorner ? (sourceRefs.cornerNumbers.get(reasonCorner.corner_id) ?? []) : []
  const reasonText =
    reasonCorner && reasonNumbers.length > 0
      ? buildRoadmapReason(reasonCorner.verdict, scenario, reasonNumbers, t, common)
      : ''
  const paceNoteKey =
    pace.note === 'Faster than typical: your experience should shorten the hours. A stated estimate.'
      ? 'faster'
      : pace.note === 'Typical pace. A stated estimate.'
        ? 'typical'
        : pace.note ===
            'Needs more practice time: the hours are lengthened to fit your starting point. A stated estimate.'
          ? 'morePractice'
          : null
  const paceNote = paceNoteKey ? t.pace.notes[paceNoteKey] : pace.note

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

  // On desktop the right column sticks, and when it is taller than the screen the browser's own jump stops where See
  // the Maths sits while stuck, below the fold. Scroll to where the column's end has pushed the card up instead.
  function showPaceMaths(event: MouseEvent<HTMLAnchorElement>) {
    const card = document.getElementById('pace-maths')
    const column = card?.parentElement
    const columns = column?.parentElement
    if (!card || !column || !columns || getComputedStyle(column).position !== 'sticky') return
    event.preventDefault()
    const columnsEnd = columns.getBoundingClientRect().bottom + window.scrollY
    const top = columnsEnd - column.offsetHeight + card.offsetTop - parseFloat(getComputedStyle(card).scrollMarginTop)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' })
    card.focus({ preventScroll: true })
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
        <Stepper step={5} className="roadmap-print-actions" />

        <CatDialogue
          pose="happy"
          speech={
            steps.length > 0
              ? readyPoint?.week === 0
                ? t.fit.speechReady(planWeeks, formatEstimate(checkup.roadmap.weekly_hours))
                : t.fit.speechPlanned(planWeeks, formatEstimate(checkup.roadmap.weekly_hours), readyCopy)
              : t.fit.speechNoSteps
          }
        />

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-title-m text-text-primary lg:text-title-l">
              {steps.length > 0 ? t.fit.roadmapTitle(planWeeks) : t.fit.roadmapTitleShort}
            </h1>
            <p className="text-body-s text-text-muted">
              {t.fit.summary(
                role.title,
                readyCopy,
                formatEstimate(checkup.roadmap.weekly_hours),
                formatDate(checkup.roadmap.start_date)
              )}
            </p>
          </div>
          <div className="roadmap-print-actions hidden shrink-0 items-center gap-3 lg:flex">
            <Button variant="secondary" onClick={printPlan}>
              {t.controls.exportPdf}
            </Button>
          </div>
        </header>

        <ScenarioControl scenario={scenario} onChange={setScenario} className="roadmap-print-actions" />

        {planAccess.status !== 'open' && (
          <div className="space-y-2">
            <AccessNotice
              access={planAccess}
              roleTitle={role.title}
              fit={
                planFit
                  ? { percent: Math.round(planFit.fit.score), estimated: planFit.levels.some(isEstimatedLevel) }
                  : undefined
              }
            />
            {qualificationNeeded && <p className="text-body-s text-text-muted">{t.qualification}</p>}
          </div>
        )}

        <section
          aria-label={t.controls.planControls}
          className="grid gap-6 rounded-md border border-border-subtle bg-bg-panel p-5 lg:grid-cols-2"
        >
          <div className="space-y-2">
            <Slider
              label={t.controls.hoursPerWeek}
              min={MIN_WEEKLY_HOURS}
              max={MAX_WEEKLY_HOURS}
              step={1}
              value={session.custom_weekly_hours ?? checkup.roadmap.weekly_hours}
              onChange={(value) => updateGuestSession({ custom_weekly_hours: value })}
              unit="h"
              formatValue={formatEstimate}
            />
          </div>
          <DatePicker
            label={t.controls.planStartDate}
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
                {t.controls.impactArea}
              </h2>
              <p className="text-body-s text-text-muted">{t.controls.highlightStepsBySdg}</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t.controls.filterStepsByImpact}>
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
                {t.controls.showAll}
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

        <PathContributionCard steps={timelineSteps} impactArea={selectedImpactArea} />

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
            className="space-y-4 rounded-md border border-border-subtle bg-bg-default p-5 max-[479px]:border-0 max-[479px]:bg-transparent max-[479px]:p-0"
          >
            <h2 id="step-details-title" className="text-title-s text-text-primary">
              {t.controls.stepDetails}
            </h2>
            <div className="flex gap-3 rounded-md border border-border-subtle bg-bg-panel px-4 py-3 text-body-s text-text-primary">
              <Gauge className="mt-0.5 h-[18px] w-[18px] shrink-0 stroke-current" aria-hidden="true" />
              <p>
                <b>{t.stepDetails.paceSet}</b> {paceNote}{' '}
                <a
                  href="#pace-maths"
                  onClick={showPaceMaths}
                  className="font-semibold underline underline-offset-[3px]"
                >
                  {t.stepDetails.seeMaths}
                </a>
              </p>
            </div>
            {listSteps.length > 0 ? (
              <div className="space-y-0">
                {listSteps.map((step, index) => (
                  <RoadmapStepCard
                    key={step.id}
                    step={{ ...step, when: formatStepWhen(step.when, t.stepCard.estimated) }}
                    index={refresherStep ? index - 1 : index}
                    last={index === listSteps.length - 1}
                    totalHours={step.id === REFRESHER_ID ? pace.refresher?.hours : stepHours.get(step.id)}
                    highlighted={selectedImpactArea !== null && step.sdgs.includes(selectedImpactArea)}
                    selected={selectedStepId === step.id}
                    onSelect={() => selectStep(step.id)}
                    stepRef={recordRef(step.id)}
                    onToggle={(checked) => toggleMilestone(step.id, checked)}
                    toggleDisabled={partialIds.has(step.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-border-subtle bg-bg-panel p-4 text-body-s text-text-muted">
                {t.stepDetails.noLearningSteps}
              </p>
            )}
            {later.length > 0 && (
              <div className="space-y-2 text-body-s text-text-muted">
                <h3 className="text-label-l text-text-primary">{t.stepDetails.afterWeek(planWeeks)}</h3>
                <p>{t.stepDetails.remaining(formatEstimate(remainingHours), Math.ceil(checkup.roadmap.weeks))}</p>
                <ul className="list-disc pl-5">
                  {later.map((step) => (
                    <li key={step.id}>
                      {partialIds.has(step.id) ? `${t.controls.continue} ` : ''}
                      {step.title || step.skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <div className="roadmap-sticky-column space-y-4 lg:sticky lg:top-24 lg:self-start">
            <EmployerFundingCard sourceNumber={fundingSourceNumber} />
            {reasonText && (
              <section aria-label={t.controls.stepDetailsAria} className="[&>section>p:first-of-type]:text-body-s">
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
                    <p className="min-w-0 text-body-s text-text-primary [overflow-wrap:anywhere]">
                      {renderCited(item.text)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-border-subtle bg-bg-default p-3">
                  <p className="text-body-s text-text-muted">{t.stepDetails.noLessImportant}</p>
                </div>
              )}
            </div>
            <PaceMathsCard pace={pace} scenarioAnchors={scenarioAnchors} profile={session.profile} />
          </div>
        </div>

        <ToolsCard role={role} sourceNumber={toolsSourceNumber} heading={t.tools.learnWith} />

        <SourceList sources={sources} label={common.sources} />

        {/* One print action per screen: the header button on desktop, this sticky bar on phones. The plan already stays on
            this device, so nothing here claims to save it. */}
        <div className="roadmap-print-actions surface-glass sticky bottom-(--ask-kopi-clearance) z-10 rounded-md p-3 lg:hidden">
          <Button variant="primary" size="lg" fullWidth onClick={printPlan}>
            {t.controls.exportPdf}
          </Button>
        </div>
      </div>
    </>
  )
}
