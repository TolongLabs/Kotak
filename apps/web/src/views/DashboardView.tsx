import { ArrowRight } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { DEFAULT_SCENARIO, diffSnapshots, engineInputs, transferAnswers, type SnapshotId } from '@kotak/shared'
import { Link, navigate } from '../app/router'
import { routes } from '../app/routes'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { SkillsSwot } from '../components/kotak/SkillsSwot'
import { StatCard } from '../components/kotak/StatCard'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { SdgChip } from '../components/ui/SdgChip'
import { VerdictChip } from '../components/ui/VerdictChip'
import { deriveSwot } from '../demo/swot'
import { useCheckupBundle } from '../engine/bundle'
import { answeredLevels, assessedRoleCode, planRoleCodeOf, useCheckup, type Checkup } from '../engine/checkup'
import { occupationSdgs } from '../engine/occupationSdg'
import { sourceRefs, toCorners, toRoles, verdictId } from '../engine/viewModel'
import { ROADMAP_WEEKS, toReadinessPoints, toReadinessWindow, toRoadmapSteps } from '../engine/roadmapModel'
import { useGuestSession } from '../session/store'
import { startAgain } from './checkup/startAgain'

const beforeSnapshot: SnapshotId = '2026-04'
const afterSnapshot: SnapshotId = '2026-05'

function DashboardState({ children }: { children: ReactNode }) {
  return <div className="space-y-5 lg:space-y-6">{children}</div>
}

function formatEstimate(value: number) {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(value)
}

function formatSnapshotMonth(snapshotId: SnapshotId) {
  return new Date(`${snapshotId}-01T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

function formatVintageDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

function currentPlanWeek(startDate: string, totalWeeks: number) {
  if (totalWeeks < 1) return 0

  const start = Date.parse(`${startDate}T00:00:00Z`)
  const today = new Date()
  const current = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const week = Math.floor((current - start) / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.min(totalWeeks, Math.max(1, week))
}

function completedHoursForWeek(checkup: Checkup, steps: ReturnType<typeof toRoadmapSteps>, week: number) {
  if (week < 1) return 0

  const completedIds = new Set(steps.filter((step) => step.state === 'done').map((step) => step.id))
  const weeklyHours = checkup.roadmap.weekly_hours
  const weekStart = (week - 1) * weeklyHours
  const weekEnd = week * weeklyHours
  let plannedHours = 0
  let completedHours = 0

  for (const item of [...checkup.roadmap.items].sort((left, right) => left.rank - right.rank)) {
    const itemStart = plannedHours
    const itemEnd = itemStart + item.hours
    const hoursInWeek = Math.max(0, Math.min(itemEnd, weekEnd) - Math.max(itemStart, weekStart))

    if (completedIds.has(`${item.corner_id}:${item.statement}`)) completedHours += hoursInWeek
    plannedHours = itemEnd
  }

  return completedHours
}

function ReadinessSparkline({ points }: { points: { week: number; value: number }[] }) {
  if (points.length === 0) {
    return <p className="text-body-s text-text-muted">No readiness estimate yet.</p>
  }

  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? 105 : 4 + (index / (points.length - 1)) * 202
    const y = 32 - (Math.min(100, Math.max(0, point.value)) / 100) * 28
    return `${x},${y}`
  })
  const description = points.map((point) => `Week ${point.week}: ${Math.round(point.value)}%`).join(', ')

  return (
    <svg
      className="block h-4 w-full text-text-primary lg:h-9"
      viewBox="0 0 210 36"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Readiness by week: ${description}`}
    >
      {points.length === 1 ? (
        <circle cx={coordinates[0].split(',')[0]} cy={coordinates[0].split(',')[1]} r="2" fill="currentColor" />
      ) : (
        <polyline
          points={coordinates.join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function greeting(hour: number) {
  return hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'
}

function withoutEndingPunctuation(value: string) {
  return value.trim().replace(/[.!?]+$/u, '')
}

export function DashboardView() {
  const session = useGuestSession()
  const bundle = useCheckupBundle(session)
  const checkup = useCheckup({ scenario: DEFAULT_SCENARIO })
  const otherScenario = useCheckup({ scenario: DEFAULT_SCENARIO === 'slow' ? 'fast' : 'slow' })

  useEffect(() => {
    if (session.is_guest) return
    // Replace, not push, so the Back button does not return here and loop.
    window.history.replaceState(null, '', routes.signIn)
    // Must match NAVIGATE_EVENT in app/router.tsx.
    window.dispatchEvent(new Event('kotak:navigate'))
  }, [session.is_guest])

  if (!session.is_guest) return null

  if (!assessedRoleCode(session)) {
    return (
      <DashboardState>
        <CatDialogue pose="worried" speech={`${startAgain(session).speech}, then I can show how it is changing.`} />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(startAgain(session).route)}>
          {startAgain(session).label}
        </Button>
      </DashboardState>
    )
  }

  if (bundle.status === 'error' || checkup.status === 'error' || otherScenario.status === 'error') {
    const retry = () => {
      if (bundle.status === 'error') bundle.retry()
      if (checkup.status === 'error') checkup.retry()
      if (otherScenario.status === 'error') otherScenario.retry()
    }

    return (
      <DashboardState>
        <Banner type="error" title="Kopi Could Not Open This Job" body="Reload the page, or choose your job again." />
        <Button variant="secondary" size="lg" fullWidth onClick={retry}>
          Try Again
        </Button>
      </DashboardState>
    )
  }

  if (bundle.status !== 'ready' || checkup.status !== 'ready' || otherScenario.status !== 'ready') {
    return (
      <DashboardState>
        <CatDialogue pose="thinking" speech="Opening the box on your job…" />
      </DashboardState>
    )
  }

  const { role } = bundle.data
  const currentCheckup = checkup.data.checkup
  const slowCheckup = DEFAULT_SCENARIO === 'slow' ? currentCheckup : otherScenario.data.checkup
  const fastCheckup = DEFAULT_SCENARIO === 'fast' ? currentCheckup : otherScenario.data.checkup

  if (!currentCheckup.questionsReady) {
    return (
      <DashboardState>
        <Banner
          type="info"
          title="Skills Are Not Ready"
          body="Kopi has no can-do statements for this job yet. Choose a related job for now."
        />
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Choose Another Job
        </Button>
      </DashboardState>
    )
  }

  const currentFit = currentCheckup.roles.find((entry) => entry.onet_code === assessedRoleCode(session))
  if (!currentFit) {
    return (
      <DashboardState>
        <Banner
          type="info"
          title="Job Fit Is Unavailable"
          body="Kopi could not calculate a fit score for this role yet."
        />
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Choose Another Job
        </Button>
      </DashboardState>
    )
  }

  const corners = toCorners(currentCheckup, sourceRefs(currentCheckup).numbers)
  const roles = toRoles(currentCheckup, [role, ...bundle.data.related], session.role_code, {
    bundle: bundle.data,
    session
  })
  const swot = deriveSwot(corners, roles, currentCheckup.scenario)
  const planBundleRole =
    [role, ...bundle.data.related].find((entry) => entry.onet_code === currentCheckup.planRoleCode) ?? role
  const steps = toRoadmapSteps(currentCheckup, planBundleRole, session.ticked_milestones)
  const nextStep = steps.find((step) => step.state === 'next')
  const nextStepGoals = (nextStep?.sdgs ?? []).slice(0, 2)
  const sdgCounts = new Map<number, number>()
  for (const step of steps) {
    for (const goal of new Set(step.sdgs)) sdgCounts.set(goal, (sdgCounts.get(goal) ?? 0) + 1)
  }
  const topPlanGoals = [...sdgCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0] - right[0])
    .slice(0, 3)
    .map(([goal]) => goal)
  const workSdgs = occupationSdgs(planRoleCodeOf(session))
  const workGoals = workSdgs?.goals ?? []
  const workGoalSet = new Set(workGoals)
  const planGoals = topPlanGoals.filter((goal) => !workGoalSet.has(goal))
  const fitRoleCode = planRoleCodeOf(session)
  const fitRole = currentCheckup.roles.find((entry) => entry.onet_code === fitRoleCode)
  const fitBundleRole = [role, ...bundle.data.related].find((entry) => entry.onet_code === fitRoleCode) ?? role
  const readinessPoints = toReadinessWindow(toReadinessPoints(slowCheckup, fastCheckup, fitBundleRole))
  const readinessKey = DEFAULT_SCENARIO === 'fast' ? 'fast' : 'plan'
  const readinessSeries = readinessPoints.map((point) => ({ week: point.week, value: point[readinessKey] }))
  const readyPoint = readinessPoints.find((point) => point[readinessKey] >= 80)
  const readinessCaption = readyPoint
    ? readyPoint.week === 0
      ? 'Already at least 80% fit.'
      : `80% fit by Week ${readyPoint.week} at ${formatEstimate(currentCheckup.roadmap.weekly_hours)} h a week`
    : readinessPoints.length > 1
      ? `Below 80% fit within ${ROADMAP_WEEKS} weeks at ${formatEstimate(currentCheckup.roadmap.weekly_hours)} h a week`
      : 'No readiness estimate yet.'

  const totalWeeks = Math.ceil(currentCheckup.roadmap.weeks)
  const planWeek = currentPlanWeek(currentCheckup.roadmap.start_date, totalWeeks)
  const doneHours = completedHoursForWeek(currentCheckup, steps, planWeek)
  const weeklyHours = currentCheckup.roadmap.weekly_hours
  const weekProgress = Math.min(100, Math.round((doneHours / weeklyHours) * 100))
  const weekCaption =
    nextStep?.title ?? (steps.length > 0 ? 'All roadmap steps are ticked.' : 'No learning steps are available.')

  const engine = engineInputs(role, [role, ...bundle.data.related])
  const answers = transferAnswers(role, answeredLevels(role, session.answers))
  const aprilSnapshot = engine.snapshots[beforeSnapshot]
  const maySnapshot = engine.snapshots[afterSnapshot]
  const snapshotDiff =
    aprilSnapshot && maySnapshot
      ? diffSnapshots(engine.role, answers, aprilSnapshot, maySnapshot, DEFAULT_SCENARIO)
      : null
  const changedSkills = snapshotDiff?.corners.length ?? 0
  const exampleChange =
    snapshotDiff?.corners.find((item) => item.changes.includes('verdict')) ?? snapshotDiff?.corners[0]

  const sourceVintages = [
    ...currentCheckup.corners.flatMap((corner) => corner.verdict.sources.map((source) => source.vintage_date)),
    ...currentCheckup.roadmap.dividend.sources.map((source) => source.vintage_date)
  ].sort((left, right) => left.localeCompare(right))
  const latestVintage = sourceVintages[sourceVintages.length - 1]
  const freshnessCaption = latestVintage
    ? `Latest source vintage: ${formatVintageDate(latestVintage)}`
    : 'Latest source vintage unavailable.'

  const biggestRisingGap = currentCheckup.corners
    .filter((corner) => corner.verdict.status === 'Rising' && corner.target > corner.level.level)
    .sort((left, right) => right.target - right.level.level - (left.target - left.level.level))[0]
  const risingGapStep = biggestRisingGap
    ? steps.find((step) => step.id.startsWith(`${biggestRisingGap.corner_id}:`))
    : undefined
  const risingGapStatement =
    risingGapStep?.title ??
    (biggestRisingGap
      ? role.corners.find((corner) => corner.corner_id === biggestRisingGap.corner_id)?.statements?.working
      : undefined)
  const nextStepDescription = nextStep
    ? `Weeks ${nextStep.weeks[0]}–${nextStep.weeks[1]} · ${formatEstimate(nextStep.hoursPerWeek)} h a week${nextStep.resource.label ? ` · ${nextStep.resource.label}` : ''}`
    : steps.length > 0
      ? 'All roadmap steps are ticked.'
      : 'No learning steps are available for this snapshot.'
  // The Next Step card sits right under Kopi, so Kopi points at it instead of repeating its title.
  const kopiSpeech =
    biggestRisingGap && risingGapStep && risingGapStep.id === nextStep?.id
      ? `Your biggest rising gap is ${biggestRisingGap.name}. Start with the next step below.`
      : biggestRisingGap && risingGapStatement
        ? `Your biggest rising gap is ${biggestRisingGap.name}. Start here: “${withoutEndingPunctuation(risingGapStatement)}.”`
        : biggestRisingGap
          ? `Your biggest rising gap is ${biggestRisingGap.name}. I don’t have a step for that gap yet.`
          : nextStep
            ? `No rising gap stands out in this snapshot. Your next step is “${withoutEndingPunctuation(nextStep.title)}.”`
            : steps.length > 0
              ? 'No rising gap stands out in this snapshot. You’ve ticked all your roadmap steps.'
              : 'No rising gap or roadmap steps stand out in this snapshot.'

  return (
    <div className="space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-title-m text-text-primary lg:text-title-l">{greeting(new Date().getHours())}, Guest</h1>
        <p className="text-body-s text-text-muted">{role.title}</p>
        {(workGoals.length > 0 || planGoals.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {workGoals.length > 0 && (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span className="text-label-s text-text-muted">Your Work Supports</span>
                {workGoals.map((goal) => (
                  <SdgChip key={goal} goal={goal} title={workSdgs?.reason} />
                ))}
              </span>
            )}
            {planGoals.length > 0 && (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span className="text-label-s text-text-muted">Your Plan Supports</span>
                {planGoals.map((goal) => (
                  <SdgChip key={goal} goal={goal} />
                ))}
              </span>
            )}
          </div>
        )}
      </header>

      <CatDialogue pose="explaining" speech={kopiSpeech} />

      <section
        aria-labelledby="next-step-title"
        className="flex flex-col gap-4 rounded-md border border-border-subtle bg-bg-panel p-5 md:flex-row md:items-center md:justify-between md:gap-6"
      >
        <div className="min-w-0 space-y-2">
          <p className="text-label-m text-text-muted">Next Step</p>
          <h2 id="next-step-title" className="break-words text-title-s text-text-primary">
            {nextStep?.title || nextStep?.skill || (steps.length > 0 ? 'Plan Complete' : 'No Roadmap Steps')}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {nextStepGoals.map((goal) => (
              <SdgChip key={goal} goal={goal} />
            ))}
            <p className="text-body-s text-text-muted">{nextStepDescription}</p>
          </div>
        </div>
        <Link
          to={routes.roadmap}
          className="inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-sm border-[1.5px] border-text-primary bg-accent-box px-6 text-label-l text-accent-on-box transition-colors duration-150 ease-out hover:bg-accent-box-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:w-auto"
        >
          {nextStep ? 'Continue My Plan' : 'Open Your Roadmap'}
        </Link>
      </section>

      <section aria-label="Your Progress" className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <div className="flex h-full flex-col [&>section]:flex-1">
          <StatCard
            label={`Fit for ${fitBundleRole.title}`}
            value={fitRole ? `${Math.round(fitRole.fit.score)}%` : 'Fit unavailable'}
            caption={readinessCaption}
          >
            <ReadinessSparkline points={readinessSeries} />
          </StatCard>
        </div>
        <div className="flex h-full flex-col [&>section]:flex-1">
          <StatCard
            label="This Week"
            value={`${formatEstimate(doneHours)} of ${formatEstimate(weeklyHours)} h`}
            caption={weekCaption}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-label-m text-text-primary">
                  {totalWeeks > 0 ? `Week ${planWeek} of ${totalWeeks}` : 'No planned weeks'}
                </span>
                <span className="font-mono text-mono-s text-text-muted">{weekProgress}%</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-border-subtle"
                role="progressbar"
                aria-label="This week’s completed roadmap hours"
                aria-valuenow={weekProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${weekProgress}% of weekly hours completed`}
              >
                <div className="h-full rounded-full bg-text-primary" style={{ width: `${weekProgress}%` }} />
              </div>
            </div>
          </StatCard>
        </div>
        <div className="flex h-full flex-col [&>section]:flex-1">
          <StatCard
            label="What Changed in May"
            value={snapshotDiff ? `${changedSkills} Skill${changedSkills === 1 ? '' : 's'}` : 'Not Available'}
          >
            {exampleChange ? (
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                <span className="sr-only">{exampleChange.name}:</span>
                <VerdictChip verdict={verdictId(exampleChange.before.status)} size="sm" />
                <span className="inline-flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4 shrink-0 stroke-current text-text-primary" aria-hidden="true" />
                  <VerdictChip verdict={verdictId(exampleChange.after.status)} size="sm" />
                </span>
              </div>
            ) : (
              <p className="text-body-s text-text-muted">
                {snapshotDiff
                  ? 'No skill changes between April and May.'
                  : 'April and May data are not both available yet.'}
              </p>
            )}
            <p className="text-body-s text-text-muted">
              <Link
                to={routes.changes}
                className="font-medium text-text-primary underline decoration-current underline-offset-2 transition-colors hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Open What Changed
              </Link>{' '}
              to review April and May.
            </p>
          </StatCard>
        </div>
        <div className="flex h-full flex-col [&>section]:flex-1">
          <StatCard
            label="Data Freshness"
            value={formatSnapshotMonth(currentCheckup.snapshotId)}
            caption={freshnessCaption}
          />
        </div>
      </section>

      <SkillsSwot swot={swot} radarLink />
    </div>
  )
}
