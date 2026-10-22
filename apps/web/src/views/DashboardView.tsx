import { ArrowRight, Briefcase, CircleCheck, Target, TriangleAlert } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Link, navigate } from '../app/router'
import { routes } from '../app/routes'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { StatCard } from '../components/kotak/StatCard'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { VerdictChip } from '../components/ui/VerdictChip'
import { deriveSwot } from '../demo/swot'
import type { Swot, SwotItem } from '../demo/types'
import { useRoleBundle } from '../engine/bundle'
import { DEFAULT_SCENARIO, roleVerdicts } from '@kotak/shared'
import { useCheckup } from '../engine/checkup'
import { sourceRefs, toCorners, toRoles } from '../engine/viewModel'
import { toRoadmapSteps } from '../engine/roadmapModel'
import { useGuestSession } from '../session/store'

const quadrantDetails = [
  {
    title: 'Strengths',
    hint: 'Lead With These',
    key: 'strengths',
    icon: CircleCheck,
    surface: 'border-[1.5px] border-text-primary bg-radar-you-fill'
  },
  {
    title: 'Weaknesses',
    hint: 'Close These Next',
    key: 'weaknesses',
    icon: Target,
    surface: 'border-[1.5px] border-text-primary bg-bg-default'
  },
  {
    title: 'Opportunities',
    hint: 'Roles Within Reach',
    key: 'opportunities',
    icon: Briefcase,
    surface: 'border border-border-subtle bg-bg-default'
  },
  {
    title: 'Threats',
    hint: 'Let AI Draft These',
    key: 'threats',
    icon: TriangleAlert,
    surface: 'border-[1.5px] border-text-primary bg-bg-panel'
  }
] as const

function DashboardSwot({ swot }: { swot: Swot }) {
  return (
    <section className="surface-card space-y-4 p-4 lg:p-5" aria-labelledby="dashboard-swot-title">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 id="dashboard-swot-title" className="text-title-s text-text-primary">
            Your Skills SWOT
          </h2>
          <p className="text-body-s text-text-muted">
            Your skills, sorted by your level and where the market is heading.
          </p>
        </div>
        <Link
          to={routes.radar}
          className="inline-flex min-h-11 shrink-0 items-center bg-bg-default px-1 text-label-m text-text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Open Radar
        </Link>
      </header>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {quadrantDetails.map(({ title, hint, key, icon: Icon, surface }) => {
          const items = swot[key] as SwotItem[]
          return (
            <section key={key} aria-label={title} className={`min-w-0 space-y-2 rounded-md p-3 lg:p-4 ${surface}`}>
              <div className="flex items-center gap-2">
                <Icon className="h-[18px] w-[18px] shrink-0 stroke-current" aria-hidden="true" />
                <h3 className="text-label-m text-text-primary">{title}</h3>
              </div>
              <p className="text-body-s text-text-muted">{hint}</p>
              {items.length > 0 ? (
                <ul className="space-y-2.5">
                  {items.map((item, index) => (
                    <li key={`${item.label}-${index}`} className="min-w-0 space-y-1">
                      <p className="break-words text-label-m text-text-primary">{item.label}</p>
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <VerdictChip verdict={item.verdict} size="sm" />
                        <span className="font-mono text-mono-s text-text-muted">{item.detail}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-s text-text-muted">No items from the current role data.</p>
              )}
            </section>
          )
        })}
      </div>
      <p className="font-mono text-mono-s text-text-muted">
        Fixed rules sort the skills. Each verdict cites its sources on the Radar page.
      </p>
    </section>
  )
}

function DashboardState({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[45rem] space-y-6">{children}</div>
}

function formatEstimate(value: number) {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(value)
}

export function DashboardView() {
  const session = useGuestSession()
  const bundle = useRoleBundle(session.role_code)
  const checkup = useCheckup({ scenario: DEFAULT_SCENARIO })

  useEffect(() => {
    if (session.is_guest) return
    // Replace, not push, so the Back button does not return here and loop.
    window.history.replaceState(null, '', routes.signIn)
    // Must match NAVIGATE_EVENT in app/router.tsx.
    window.dispatchEvent(new Event('kotak:navigate'))
  }, [session.is_guest])

  if (!session.is_guest) return null

  if (!session.role_code) {
    return (
      <DashboardState>
        <CatDialogue pose="worried" speech="Tell me your job first, then I can show how it is changing." />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Choose Your Job
        </Button>
      </DashboardState>
    )
  }

  if (bundle.status === 'error' || checkup.status === 'error') {
    const retry = () => {
      if (bundle.status === 'error') bundle.retry()
      if (checkup.status === 'error') checkup.retry()
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

  if (bundle.status !== 'ready' || checkup.status !== 'ready') {
    return (
      <DashboardState>
        <CatDialogue pose="thinking" speech="Opening the box on your job…" />
      </DashboardState>
    )
  }

  const { role } = bundle.data
  const currentCheckup = checkup.data.checkup

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

  const currentFit = currentCheckup.roles.find((entry) => entry.onet_code === session.role_code)
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
  const roles = toRoles(currentCheckup, [role, ...bundle.data.related], session.role_code)
  const swot = deriveSwot(corners, roles, currentCheckup.scenario)
  const steps = toRoadmapSteps(currentCheckup, role, session.ticked_milestones)
  const nextStep = steps.find((step) => step.state === 'next')
  const biggestRisingGap = currentCheckup.corners
    .filter((corner) => corner.verdict.status === 'Rising' && corner.target > corner.level.level)
    .sort((left, right) => right.target - right.level.level - (left.target - left.level.level))[0]
  const aprilStatuses = new Map(
    roleVerdicts(role.signals['2026-04']).corners.map((corner) => [corner.corner_id, corner.status])
  )
  const mayStatuses = new Map(
    roleVerdicts(role.signals['2026-05']).corners.map((corner) => [corner.corner_id, corner.status])
  )
  const changedSkills = role.corners.filter(
    (corner) => aprilStatuses.get(corner.corner_id) !== mayStatuses.get(corner.corner_id)
  ).length
  const nextStepDescription = nextStep
    ? `Weeks ${nextStep.weeks[0]}–${nextStep.weeks[1]} · ${nextStep.hoursPerWeek} h a week${nextStep.resource.label ? ` · ${nextStep.resource.label}` : ''}`
    : steps.length > 0
      ? 'All roadmap steps are ticked.'
      : 'No learning steps are available for this snapshot.'
  const kopiSpeech = biggestRisingGap
    ? `Your biggest rising gap is ${biggestRisingGap.name}. ${nextStep ? `Start with ${nextStep.title}.` : 'Your roadmap can help you choose a next step.'}`
    : nextStep
      ? `No rising skill gap stands out in this snapshot. ${nextStep.title} is ready when you are.`
      : 'No rising skill gap or roadmap step is available in this snapshot.'
  const tiles = [
    {
      id: 'fit',
      label: 'Your Job Fit',
      value: `${Math.round(currentFit.fit.score)}%`,
      caption: 'Estimate based on your answers and the current job data.'
    },
    {
      id: 'rising-gap',
      label: 'Biggest Rising Gap',
      value: biggestRisingGap?.name ?? 'No Rising Gap',
      caption: biggestRisingGap
        ? `About ${formatEstimate(biggestRisingGap.target - biggestRisingGap.level.level)} levels to the target.`
        : 'No rising skill gap in this snapshot.'
    },
    {
      id: 'next-step',
      label: 'Next Roadmap Step',
      value: nextStep?.title || nextStep?.skill || (steps.length > 0 ? 'Plan Complete' : 'No Roadmap Steps'),
      caption: nextStepDescription
    },
    {
      id: 'changed',
      label: 'What Changed',
      value: `${changedSkills} ${changedSkills === 1 ? 'Update' : 'Updates'} Waiting`,
      caption: 'Role verdicts that changed between the available data snapshots.'
    }
  ]

  return (
    <div className="space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-title-m text-text-primary lg:text-title-l">Good Morning, Guest</h1>
        <p className="text-body-s text-text-muted">{role.title}</p>
      </header>

      {role.quality === 'auto-generated' && (
        <Banner
          type="info"
          title="AI-Drafted Skills"
          body="Kopi drafted these skills from the job’s O*NET tasks. The team has not checked them by hand yet."
        />
      )}

      <section aria-label="Your Progress" className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        {tiles.map((tile) => (
          <div key={tile.id} className="flex h-full flex-col [&>section]:flex-1">
            <StatCard label={tile.label} value={tile.value} caption={tile.caption}>
              {tile.id === 'changed' && (
                <Link
                  to={routes.changes}
                  className="inline-flex items-center gap-1 font-sans font-medium text-text-primary underline decoration-current underline-offset-2 transition-colors duration-150 ease-out hover:text-text-muted"
                >
                  Open What Changed <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </StatCard>
          </div>
        ))}
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.08fr_1fr]">
        <DashboardSwot swot={swot} />

        <div className="flex min-w-0 flex-col gap-4 xl:h-full">
          <div className="min-w-0 [&>div]:!flex-row [&>div]:!items-end [&>div]:!gap-4 [&>div>div:first-child]:!h-28">
            <CatDialogue pose="explaining" speech={kopiSpeech} />
          </div>

          <section className="flex min-h-[216px] flex-1 flex-col justify-between gap-6 rounded-md border border-border-subtle bg-bg-panel p-5">
            <div className="space-y-2">
              <p className="text-label-m text-text-muted">Next Step</p>
              <h2 className="break-words text-title-s text-text-primary">
                {nextStep?.title || nextStep?.skill || (steps.length > 0 ? 'Plan Complete' : 'No Roadmap Steps')}
              </h2>
              <p className="text-body-s text-text-muted">{nextStepDescription}</p>
            </div>
            <Button variant="primary" size="lg" className="w-full" onClick={() => navigate(routes.roadmap)}>
              {nextStep ? 'Continue My Plan' : 'Open Your Roadmap'}
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
