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
  { title: 'Strengths', hint: 'Lead With These', key: 'strengths', icon: CircleCheck, style: 'bg-radar-you-fill' },
  { title: 'Weaknesses', hint: 'Close These Next', key: 'weaknesses', icon: Target, style: 'bg-bg-default' },
  { title: 'Opportunities', hint: 'Roles Within Reach', key: 'opportunities', icon: Briefcase, style: 'bg-bg-default' },
  { title: 'Threats', hint: 'Let AI Draft These', key: 'threats', icon: TriangleAlert, style: 'bg-bg-panel' }
] as const

function DashboardSwot({ swot }: { swot: Swot }) {
  return (
    <section className="surface-card space-y-4 p-4 lg:p-5" aria-labelledby="dashboard-swot-title">
      <header className="space-y-1">
        <h2 id="dashboard-swot-title" className="text-title-s text-text-primary">
          Your Skills SWOT
        </h2>
        <p className="text-body-s text-text-muted">
          Current levels come from your answers. Target levels and role fits are estimates.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {quadrantDetails.map(({ title, hint, key, icon: Icon, style }) => {
          const items = swot[key] as SwotItem[]
          return (
            <section
              key={key}
              aria-label={title}
              className={`min-w-0 space-y-2 rounded-md border border-border-subtle p-3 lg:p-4 ${style}`}
            >
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
        Fixed rules sort these skills. Each verdict cites its sources on the Radar page.
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
      caption: nextStep
        ? 'Open your roadmap for step details.'
        : steps.length > 0
          ? 'All roadmap steps are ticked.'
          : 'No learning steps are available for this snapshot.'
    },
    {
      id: 'changed',
      label: 'Changed Skills',
      value: String(changedSkills),
      caption: 'Role verdicts that differ between the two bundle snapshots.'
    }
  ]

  return (
    <div className="space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-title-m text-text-primary lg:text-title-l">Your Dashboard</h1>
        <p className="text-body-s text-text-muted">{role.title}</p>
      </header>

      {role.quality === 'auto-generated' && (
        <Banner
          type="info"
          title="AI-Drafted Skills"
          body="Kopi drafted these skills from the job’s O*NET tasks. The team has not checked them by hand yet."
        />
      )}

      <section aria-label="Your Progress" className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {tiles.map((tile) => (
          <div key={tile.id} className="flex h-full flex-col [&>section]:flex-1">
            <StatCard label={tile.label} value={tile.value} caption={tile.caption}>
              {tile.id === 'changed' && (
                <Link
                  to={routes.changes}
                  className="inline-flex items-center gap-1 font-sans font-medium text-text-primary underline decoration-current underline-offset-2 transition-colors duration-150 ease-out hover:text-text-muted"
                >
                  See What Changed <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </StatCard>
          </div>
        ))}
      </section>

      <DashboardSwot swot={swot} />

      <div className="flex flex-col gap-3 lg:flex-row">
        <Button variant="primary" size="md" className="w-full lg:w-auto" onClick={() => navigate(routes.checkUp)}>
          Start Check-Up
        </Button>
        <Button variant="secondary" size="md" className="w-full lg:w-auto" onClick={() => navigate(routes.roadmap)}>
          Open Roadmap
        </Button>
      </div>
    </div>
  )
}
