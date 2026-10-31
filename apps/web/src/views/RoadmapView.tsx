import { accessFor } from '@kotak/sdk'
import { addDays, MAX_WEEKLY_HOURS, MIN_WEEKLY_HOURS, needsQualification, REFRESHER_ID } from '@kotak/shared'
import { Gauge } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { AccessNotice } from '../components/kotak/AccessNotice'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { ProofSheet } from '../components/kotak/ProofSheet'
import { Reasoning } from '../components/kotak/Reasoning'
import { RoadmapStepCard } from '../components/kotak/RoadmapStepCard'
import { ScenarioControl } from '../components/kotak/ScenarioControl'
import { SourceList } from '../components/kotak/SourceList'
import { ToolsCard } from '../components/kotak/ToolsCard'
import { UntranslatedNote } from '../components/kotak/UntranslatedNote'
import { renderCited } from '../components/kotak/renderCited'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { cn } from '../components/ui/cn'
import { DatePicker } from '../components/ui/DatePicker'
import { Slider } from '../components/ui/Slider'
import { Stepper } from '../components/ui/Stepper'
import { VerdictChip, type VerdictType } from '../components/ui/VerdictChip'
import { useCheckupBundle } from '../engine/bundle'
import { assessedRoleCode, computeCheckup, type Checkup } from '../engine/checkup'
import { toIsoDate } from '../engine/dates'
import { judgeEvidence, type EvidenceFile, type StepProof } from '../engine/evidence'
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
import { getGuestSession, hasAnswers, updateGuestSession, useGuestSession } from '../session/store'
import { EmployerFundingCard } from './roadmap/EmployerFundingCard'
import { PathContributionCard } from './roadmap/PathContributionCard'
import { ReadinessChart } from './roadmap/ReadinessChart'
import { PaceMathsCard } from './roadmap/PaceMathsCard'
import { RoadmapTimeline } from './roadmap/RoadmapTimeline'
import { type TimelineStep } from './roadmap/planSupport'
import { startAgain } from './checkup/startAgain'
import { commonText } from '../i18n/common'
import { dateLocale, useLocale } from '../i18n/locale'
import { changesText } from '../i18n/messages/changes'
import { evidenceText } from '../i18n/messages/evidence'
import { roadmapText } from '../i18n/messages/roadmap'
import { useText } from '../i18n/text'

/** The plan island fades out over this much scroll before Step Details reaches it. */
const ISLAND_FADE_PX = 96

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
  const proofText = useText(evidenceText).card
  const session = useGuestSession()
  const bundle = useCheckupBundle(session)
  const [scenario, setScenario] = useScenario()
  const [today] = useState(() => toIsoDate(new Date()))
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  // Counts selections, so picking the same step again still scrolls back to it.
  const [selectionCount, setSelectionCount] = useState(0)
  // Steps the user opened or folded; any other step is open only when it is the next one.
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({})
  // This session's proof attempts, by step id: a verdict that is not saved to the session, such as a fail. The sheet
  // reads and writes the step it was opened for.
  const [proofs, setProofs] = useState<Record<string, StepProof>>({})
  const [provingStepId, setProvingStepId] = useState<string | null>(null)
  // Read out on the live region below, so a screen reader hears the verdict.
  const [announcement, setAnnouncement] = useState('')
  const [paceOpen, setPaceOpen] = useState(false)
  // The plan island's controls on phones and narrow desktops, where it folds to one line.
  const [controlsOpen, setControlsOpen] = useState(false)
  const futuresText = useText(changesText)
  const futures = futuresText.receipts
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

  // The plan island sticks only over the plan it reshapes (the impact card, chart and timeline), then fades out over
  // its last ISLAND_FADE_PX before Step Details reaches it, so it never covers the steps.
  const planZoneRef = useRef<HTMLDivElement>(null)
  const islandRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const zone = planZoneRef.current
    const island = islandRef.current
    if (!zone || !island) return
    let frame = 0
    const update = () => {
      frame = 0
      // A sticky box stops with its margin inside its container, so the room left ends at the island's margin.
      const margin = parseFloat(getComputedStyle(island).marginBottom) || 0
      const room = zone.getBoundingClientRect().bottom - island.getBoundingClientRect().bottom - margin
      const opacity = Math.min(1, Math.max(0, room / ISLAND_FADE_PX))
      island.style.opacity = String(opacity)
      island.style.visibility = opacity === 0 ? 'hidden' : ''
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [checkup])

  // Clicking a step bar or a readiness point scrolls its Step Details card into view.
  useEffect(() => {
    if (!selectedStepId) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    cardRefs.current
      .get(selectedStepId)
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' })
  }, [selectedStepId, selectionCount])

  // The other AI future, so the plan island can say what switching changes.
  const otherCheckup = useMemo(() => {
    if (bundle.status !== 'ready') return null
    return computeCheckup({
      role: bundle.data.role,
      related: bundle.data.related,
      answers: session.answers,
      snapshotId: session.active_snapshot_id,
      scenario: scenario === 'slow' ? 'fast' : 'slow',
      weeklyHours: session.custom_weekly_hours,
      profile: session.profile,
      startDate,
      planRoleCode: session.plan_role_code
    })
  }, [
    bundle,
    session.answers,
    session.custom_weekly_hours,
    session.active_snapshot_id,
    session.plan_role_code,
    session.profile,
    startDate,
    scenario
  ])

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
  const sgfSource = bundle.data.pathways.sources.sgf
  if (Object.keys(role.sgf.corners).length > 0)
    sources.push({
      n: sources.length + 1,
      name: sgfSource.source_name,
      detail: `${sgfSource.geo_or_layer} · ${sgfSource.vintage_date}`,
      href: sgfSource.source_url
    })
  // A regulated role the user isn't qualified for puts the qualification before every skill step (#284).
  const planAccess = accessFor(role.onet_code, session.profile, bundle.data.pathways, session.role_code)
  const qualificationNeeded = needsQualification(planAccess)
  const planFit = checkup.roles.find((entry) => entry.onet_code === role.onet_code)

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
  // What the other AI future changes in this plan: its total hours (refresher included), else its steps or their
  // order, else the fit you start from. "Same" is said only when all three match.
  const stepOrder = (result: Checkup) =>
    result.roadmap.items.map((item) => `${item.corner_id}:${item.statement}`).join()
  const startFit = (result: Checkup) =>
    Math.round(result.roles.find((entry) => entry.onet_code === role.onet_code)?.fit.score ?? Number.NaN)
  const [slowPlan, fastPlan] = scenario === 'slow' ? [checkup, otherCheckup] : [otherCheckup, checkup]
  const futureReceipt =
    slowPlan && fastPlan
      ? Math.abs(slowPlan.roadmap.total_hours - fastPlan.roadmap.total_hours) >= 0.05
        ? {
            slow: futures.planHours(formatEstimate(fastPlan.roadmap.total_hours)),
            fast: futures.planHoursDone(formatEstimate(slowPlan.roadmap.total_hours))
          }
        : stepOrder(slowPlan) !== stepOrder(fastPlan)
          ? { slow: futures.planOrder, fast: futures.planOrderDone }
          : startFit(slowPlan) !== startFit(fastPlan)
            ? {
                slow: futures.planStart(startFit(slowPlan), startFit(fastPlan)),
                fast: futures.planStartDone(startFit(slowPlan), startFit(fastPlan))
              }
            : { slow: futures.planSame, fast: futures.planSame }
      : null
  const nextStepId = listSteps.find((step) => step.state === 'next')?.id
  const provingStep = listSteps.find((step) => step.id === provingStepId)
  const stepOpen = (stepId: string) => openSteps[stepId] ?? stepId === nextStepId
  const weeklyHours = session.custom_weekly_hours ?? checkup.roadmap.weekly_hours

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

  /** How a step stands on proof (#457): a saved pass, this session's latest attempt, a pre-proof tick, else open. */
  function proofFor(step: RoadmapStep): StepProof {
    const evidence = session.milestone_evidence[step.id]
    if (evidence) return { status: 'proven', evidence }
    if (proofs[step.id]) return proofs[step.id]!
    // A tick saved before proof existed has no evidence: it shows as not proven yet.
    if (step.state === 'done') return { status: 'unproven' }
    return { status: 'open' }
  }

  /** Reads one uploaded file, judges it, and marks the step done only on a pass. Every other verdict leaves it open. */
  async function submitProof(step: RoadmapStep, file: EvidenceFile) {
    setProvingStepId(null)
    setProofs((current) => ({ ...current, [step.id]: { status: 'judging' } }))

    const href = step.resource.href
    let host: string | null = null
    try {
      host = new URL(href).hostname.replace(/^www\./, '')
    } catch {
      host = null
    }
    const result = await judgeEvidence({
      step_id: step.id,
      step_title: step.title || step.skill,
      skill: step.skill,
      target_level: step.gain,
      resource:
        href && step.resource.label
          ? {
              title: step.resource.label,
              provider: host,
              url: href,
              checked: step.resource.verified === true && step.resource.kind !== 'search'
            }
          : null,
      today: toIsoDate(new Date()),
      file: { media_type: file.media_type, data: file.data }
    })
    // The file was read once: its preview is no longer needed, whatever the verdict.
    if (file.previewUrl) URL.revokeObjectURL(file.previewUrl)

    if (result.status === 'judged' && result.data.verdict === 'pass') {
      const { course, provider, completion_date } = result.data
      // The session may have changed while the judge was running, so read it again before writing.
      const current = getGuestSession()
      updateGuestSession({
        ticked_milestones: [...new Set([...current.ticked_milestones, step.id])],
        milestone_evidence: {
          ...current.milestone_evidence,
          [step.id]: {
            verdict: 'pass',
            course,
            provider,
            completion_date,
            judged_at: new Date().toISOString()
          }
        }
      })
      setProofs((current) => {
        const next = { ...current }
        delete next[step.id]
        return next
      })
      // Fold the proven step so the next one, open by default through stepOpen, is the one showing.
      setOpenSteps((open) => ({ ...open, [step.id]: false }))
      setAnnouncement(proofText.announcePass(step.skill))
      return
    }

    if (result.status === 'error') {
      setProofs((current) => ({ ...current, [step.id]: { status: 'error' } }))
      setAnnouncement(proofText.announceError)
      return
    }

    const { verdict, reason, fix_hint } = result.data
    if (verdict === 'fail') {
      setProofs((current) => ({ ...current, [step.id]: { status: 'fail', reason } }))
      setAnnouncement(proofText.announceFail(reason))
    } else {
      setProofs((current) => ({ ...current, [step.id]: { status: 'unclear', hint: fix_hint } }))
      setAnnouncement(proofText.announceUnclear(fix_hint ?? proofText.unclearHint))
    }
  }

  /** Removes a proven step's proof and its tick in one write. */
  function undoProof(stepId: string) {
    const current = getGuestSession()
    const evidence = { ...current.milestone_evidence }
    delete evidence[stepId]
    updateGuestSession({
      ticked_milestones: current.ticked_milestones.filter((id) => id !== stepId),
      milestone_evidence: evidence
    })
    setProofs((current) => {
      const next = { ...current }
      delete next[stepId]
      return next
    })
  }

  function selectImpactArea(goal: number | null) {
    updateGuestSession({ impact_area: goal === null ? null : String(goal) })
  }

  function selectStep(stepId: string) {
    setSelectedStepId(stepId)
    setSelectionCount((count) => count + 1)
    setOpenSteps((current) => ({ ...current, [stepId]: true }))
    // An open island stacks its controls below 1280 px; fold it so it cannot cover the step it scrolls to.
    setControlsOpen(false)
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
            <UntranslatedNote onetCode={role.onet_code} />
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

        <div ref={planZoneRef} className="space-y-5 lg:space-y-6">
          {/* The plan island: the three controls that reshape the plan stay in view with their result, so dragging the
            hours moves the chart and timeline under it. Phones and narrow desktops fold it to one line. */}
          <section
            ref={islandRef}
            aria-label={t.controls.planControls}
            className="roadmap-print-actions surface-glass sticky top-20 z-20 rounded-md p-3 lg:top-24 xl:p-4"
          >
            <div className="flex items-center justify-between gap-3 xl:hidden">
              <div className="min-w-0">
                <p className="truncate font-mono text-mono-s text-text-muted">
                  {t.controls.islandSummary(
                    formatEstimate(weeklyHours),
                    formatDayMonth(checkup.roadmap.start_date),
                    futuresText.scenarioShort[scenario]
                  )}
                </p>
                <p className="text-label-l text-text-primary">{readyCopy}</p>
              </div>
              <button
                type="button"
                aria-expanded={controlsOpen}
                aria-controls="plan-controls"
                onClick={() => setControlsOpen((value) => !value)}
                className="inline-flex min-h-11 shrink-0 items-center rounded-sm px-2 text-label-m text-text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {controlsOpen ? t.controls.done : t.controls.change}
              </button>
            </div>
            <div
              id="plan-controls"
              className={cn(
                'gap-4 xl:grid xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,12rem)_minmax(0,14rem)] xl:items-center xl:gap-5',
                controlsOpen ? 'mt-3 grid xl:mt-0' : 'hidden'
              )}
            >
              <ScenarioControl compact scenario={scenario} onChange={setScenario} />
              <Slider
                label={t.controls.hoursPerWeek}
                min={MIN_WEEKLY_HOURS}
                max={MAX_WEEKLY_HOURS}
                step={1}
                value={weeklyHours}
                onChange={(value) => updateGuestSession({ custom_weekly_hours: value })}
                unit="h"
                formatValue={formatEstimate}
              />
              <DatePicker
                label={t.controls.planStartDate}
                value={fromIsoDate(checkup.roadmap.start_date)}
                onChange={(date) => setSelectedStartDate(toIsoDate(date))}
                className="w-full"
              />
              <div role="status" className="space-y-0.5 xl:border-l xl:border-border-subtle xl:pl-4">
                <p className="hidden font-mono text-mono-s text-text-muted xl:block">{t.controls.yourPlan}</p>
                <p className="hidden text-title-s text-text-primary xl:block">{readyCopy}</p>
                {futureReceipt && <p className="text-label-s text-text-muted">{futureReceipt[scenario]}</p>}
              </div>
            </div>
          </section>

          <PathContributionCard
            steps={timelineSteps}
            impactArea={selectedImpactArea}
            goals={impactAreaGoals}
            onSelectGoal={selectImpactArea}
          />

          <ReadinessChart
            points={readinessPoints}
            roleTitle={role.title}
            startIso={checkup.roadmap.start_date}
            todayIso={today}
            steps={timelineSteps}
            onSelectStep={selectStep}
          />

          <RoadmapTimeline
            steps={timelineSteps}
            startDate={fromIsoDate(checkup.roadmap.start_date)}
            today={fromIsoDate(today)}
            impactArea={selectedImpactArea}
            selectedStepId={selectedStepId}
            onSelectStep={selectStep}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-6">
          <section
            aria-labelledby="step-details-title"
            className="space-y-4 rounded-md border border-border-subtle bg-bg-default p-5 max-[479px]:border-0 max-[479px]:bg-transparent max-[479px]:p-0"
          >
            {/* One proof sheet for the page: it judges the file for the step the user opened it from. */}
            <ProofSheet
              open={provingStep !== undefined}
              skill={provingStep?.skill ?? ''}
              onClose={() => setProvingStepId(null)}
              onSubmit={(file) => provingStep && void submitProof(provingStep, file)}
            />
            <h2 id="step-details-title" className="text-title-s text-text-primary">
              {t.controls.stepDetails}
            </h2>
            <div className="flex gap-3 rounded-md border border-border-subtle bg-bg-panel px-4 py-3 text-body-s text-text-primary">
              <Gauge className="mt-0.5 h-[18px] w-[18px] shrink-0 stroke-current" aria-hidden="true" />
              <p>
                <b>{t.stepDetails.paceSet}</b> {paceNote}{' '}
                <button
                  type="button"
                  aria-expanded={paceOpen}
                  aria-controls="pace-maths"
                  onClick={() => setPaceOpen((value) => !value)}
                  className="rounded-sm font-semibold underline underline-offset-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {t.stepDetails.seeMaths}
                </button>
              </p>
            </div>
            {paceOpen && <PaceMathsCard pace={pace} scenarioAnchors={scenarioAnchors} profile={session.profile} />}
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
                    proof={proofFor(step)}
                    onProve={() => setProvingStepId(step.id)}
                    onUndo={() => undoProof(step.id)}
                    toggleDisabled={partialIds.has(step.id)}
                    open={stepOpen(step.id)}
                    onToggleOpen={() => setOpenSteps((current) => ({ ...current, [step.id]: !stepOpen(step.id) }))}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-border-subtle bg-bg-panel p-4 text-body-s text-text-muted">
                {t.stepDetails.noLearningSteps}
              </p>
            )}
            {/* Screen readers hear the verdict even though the card's own wording changes silently. */}
            <p className="sr-only" aria-live="polite" role="status">
              {announcement}
            </p>
            {later.length > 0 && (
              <div className="space-y-2 rounded-md border border-dashed border-border-control bg-bg-panel p-4 text-body-s text-text-muted">
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

          {/* The plan island has gone by the time this column sticks, so it sits just under the top bar. */}
          <div className="roadmap-sticky-column space-y-4 lg:sticky lg:top-24 lg:self-start">
            {reasonText && (
              <section aria-label={t.controls.stepDetailsAria} className="[&>section>p:first-of-type]:text-body-s">
                <Reasoning text={reasonText} />
              </section>
            )}
            <EmployerFundingCard sourceNumber={fundingSourceNumber} />
          </div>
        </div>

        {lessImportant.length > 0 && (
          <section aria-labelledby="less-important-title" className="space-y-3">
            <div className="space-y-1">
              <h2 id="less-important-title" className="text-title-s text-text-primary">
                {t.stepDetails.lessImportantTitle}
              </h2>
              <p className="text-body-s text-text-muted">{t.stepDetails.lessImportantHint}</p>
            </div>
            <div className="space-y-2">
              {lessImportant.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 rounded-md border border-border-subtle bg-bg-default px-4 py-3"
                >
                  {item.verdict && <VerdictChip verdict={item.verdict} size="sm" />}
                  <p className="min-w-0 text-body-s text-text-primary [overflow-wrap:anywhere]">
                    {renderCited(item.text)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <ToolsCard role={role} sourceNumber={toolsSourceNumber} heading={t.tools.learnWith} folded />

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
