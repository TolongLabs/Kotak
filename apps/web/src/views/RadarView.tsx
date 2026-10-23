import { accessFor } from '@kotak/sdk'
import { DEFAULT_SCENARIO, needsQualification } from '@kotak/shared'
import { Info } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, navigate } from '../app/router'
import { routes } from '../app/routes'
import { AccessNotice } from '../components/kotak/AccessNotice'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { FutureSkillsRadar } from '../components/kotak/FutureSkillsRadar'
import { GapCard } from '../components/kotak/GapCard'
import { JobMarketCard } from '../components/kotak/JobMarketCard'
import { ExplanationSourceProvider } from '../components/kotak/Reasoning'
import { SkillsSwot } from '../components/kotak/SkillsSwot'
import { SourceList } from '../components/kotak/SourceList'
import { ToolsCard } from '../components/kotak/ToolsCard'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { SdgChip } from '../components/ui/SdgChip'
import { checkUpSteps, Stepper } from '../components/ui/Stepper'
import { Tooltip } from '../components/ui/Tooltip'
import { isEstimatedLevel, toCorners, toRoles, neededByLabel, sourceRefs } from '../engine/viewModel'
import { assessedRoleCode, computeCheckup, type Checkup } from '../engine/checkup'
import { occupationSdgs } from '../engine/occupationSdg'
import { useCheckupBundle } from '../engine/bundle'
import { fetchExplanations } from '../engine/api'
import { useJobMarkets } from '../engine/useJobMarkets'
import { useGuestSession } from '../session/store'
import type { Corner, Scenario, SourceRef } from '../demo/types'
import { deriveSwot } from '../demo/swot'
import type { ExplanationResponse } from '@kotak/shared'
import { buildExplanationRequest } from './roles/derived'
import { startAgain } from './checkup/startAgain'

function sdgGoals(targets: string[] | undefined, limit: number) {
  const goals = (targets ?? []).flatMap((target) => {
    const goal = Number(target.split('.')[0])
    return Number.isInteger(goal) && goal >= 1 && goal <= 17 ? [goal] : []
  })
  return [...new Set(goals)].slice(0, limit)
}

function gapFor(corner: Corner, scenario: Scenario) {
  const needed = scenario === 'slow' ? corner.neededSlow : corner.neededFast
  return needed - corner.you
}

function snapshotMonth(snapshotId: string) {
  const [year, month] = snapshotId.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function latestSourceVintageDate(checkup: Checkup): string | null {
  const dates = checkup.corners
    .flatMap((corner) => corner.verdict.sources)
    .map((source) => source.vintage_date)
    .filter(Boolean)
  if (dates.length === 0) return null
  return [...dates].sort().reverse()[0]
}

export function RadarView() {
  const session = useGuestSession()
  const bundle = useCheckupBundle(session)
  const roleData = bundle.status === 'ready' ? bundle.data : null
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const checkup = useMemo(
    () =>
      roleData
        ? computeCheckup({
            role: roleData.role,
            related: roleData.related,
            answers: session.answers,
            snapshotId: '2026-05',
            scenario: DEFAULT_SCENARIO,
            weeklyHours: session.custom_weekly_hours,
            startDate: today
          })
        : null,
    [roleData, session.answers, session.custom_weekly_hours, today]
  )
  const scenario = DEFAULT_SCENARIO
  // Explanations come from the AI route (#43). Until it exists, ?ai=off shows the paused state for demos.
  const [explanationsPaused, setExplanationsPaused] = useState(
    () => new URLSearchParams(window.location.search).get('ai') === 'off'
  )
  const [explanationState, setExplanationState] = useState<{
    roleCode: string
    snapshotId: string
    explanations: ExplanationResponse['explanations']
  } | null>(null)
  const activeRoleCheckup = checkup?.roles.find((candidate) => candidate.onet_code === roleData?.role.onet_code)
  // What Malaysian job ads say about the role (#272), shown beside the verdicts when admins have reviewed any.
  const roleCode = roleData?.role.onet_code ?? null
  const jobMarket = useJobMarkets(roleCode ? [roleCode] : []).get(roleCode ?? '') ?? null

  useEffect(() => {
    if (explanationsPaused || !roleData || !checkup || !activeRoleCheckup) return
    const request = buildExplanationRequest(roleData.role, activeRoleCheckup, checkup.snapshotId, scenario)
    if (!request) return

    let current = true
    void fetchExplanations(roleData.role.onet_code, request).then((result) => {
      if (current && result.status === 'available') {
        setExplanationState({
          roleCode: roleData.role.onet_code,
          snapshotId: checkup.snapshotId,
          explanations: result.data.explanations
        })
      }
    })

    return () => {
      current = false
    }
  }, [activeRoleCheckup, checkup, explanationsPaused, roleData, scenario])

  const retryExplanations = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('ai')
    window.history.replaceState(null, '', url)
    setExplanationsPaused(false)
  }

  if (!assessedRoleCode(session)) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <h1 className="sr-only">Future Skills Radar</h1>
        <Stepper step={3} labels={checkUpSteps} />
        <CatDialogue pose="worried" speech={`${startAgain(session).speech}, then I can map its skills.`} />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(startAgain(session).route)}>
          {startAgain(session).label}
        </Button>
      </div>
    )
  }

  if (bundle.status !== 'ready' || !checkup) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <h1 className="sr-only">Future Skills Radar</h1>
        <Stepper step={3} labels={checkUpSteps} />
        {bundle.status === 'error' ? (
          <Banner type="error" title="Kopi Could Not Open This Job" body="Reload the page, or choose your job again." />
        ) : (
          <CatDialogue pose="thinking" speech="Opening the box on your job…" />
        )}
      </div>
    )
  }

  const { role, related } = bundle.data
  const workSdgs = occupationSdgs(assessedRoleCode(session))
  const { sources: verdictSources, numbers } = sourceRefs(checkup)
  // The job-ad source is numbered after the verdicts' sources, so their citation numbers stay as they are.
  const jobMarketSource: SourceRef | null =
    jobMarket?.onet_code === role.onet_code
      ? {
          n: verdictSources.length + 1,
          name: jobMarket.source.source_name,
          detail: `${jobMarket.source.geo_or_layer} · ${jobMarket.source.vintage_date}`,
          href: jobMarket.source.source_url
        }
      : null
  const pathways = bundle.data.pathways
  // The O*NET tools source comes last, after the verdicts' and the job ads'.
  const toolsSource: SourceRef | null = role.tools.length
    ? {
        n: verdictSources.length + (jobMarketSource ? 2 : 1),
        name: pathways.sources.onet_tools.source_name,
        detail: `${pathways.sources.onet_tools.geo_or_layer} · ${pathways.sources.onet_tools.vintage_date}`,
        href: pathways.sources.onet_tools.source_url
      }
    : null
  const sources = [
    ...verdictSources,
    ...(jobMarketSource ? [jobMarketSource] : []),
    ...(toolsSource ? [toolsSource] : [])
  ]
  const access = accessFor(role.onet_code, session.profile, pathways, session.role_code)
  const explanationByCorner = new Map(
    explanationState?.roleCode === role.onet_code && explanationState.snapshotId === checkup.snapshotId
      ? explanationState.explanations.map((explanation) => [explanation.corner_id, explanation] as const)
      : []
  )
  const corners = toCorners(checkup, numbers).map((corner) => {
    const explanation = explanationByCorner.get(corner.id)
    return explanation ? { ...corner, reasoning: explanation.sentences.join(' ') } : corner
  })
  const roles = toRoles(checkup, [role, ...related], session.role_code, { bundle: bundle.data, session })
  const swot = deriveSwot(corners, roles, scenario)
  const neededLabel = neededByLabel(checkup)
  const activeMonth = snapshotMonth(checkup.snapshotId)
  const latestVintage = latestSourceVintageDate(checkup)

  const biggestRisingGap = corners
    .filter((corner) => corner.verdict === 'rising' && gapFor(corner, scenario) > 0)
    .sort((left, right) => gapFor(right, scenario) - gapFor(left, scenario))[0]
  const firstRoadmapItem = checkup.roadmap.items[0]
  const firstRoadmapCorner = firstRoadmapItem
    ? role.corners.find((corner) => corner.corner_id === firstRoadmapItem.corner_id)
    : undefined
  const firstRoadmapStatement =
    firstRoadmapItem && firstRoadmapCorner?.statements
      ? firstRoadmapCorner.statements[firstRoadmapItem.statement]
      : null
  const speech =
    access.profession && needsQualification(access)
      ? access.status === 'qualify'
        ? `${role.title} also needs a set qualification in Malaysia. Your fit shows whether the work suits you, so weigh it before you enrol.`
        : `${role.title} is regulated in Malaysia: see the steps below. Your fit shows whether the work suits you.`
      : biggestRisingGap
        ? firstRoadmapStatement
          ? `Your biggest rising gap is ${biggestRisingGap.name}. Try this: ${firstRoadmapStatement}`
          : 'I don’t have a ready skill statement for your first step yet.'
        : 'No rising skill gap stands out for this job yet.'

  const weaknessNames = new Set(swot.weaknesses.map((item) => item.label))
  const weaknessCorners = corners
    .filter((corner) => weaknessNames.has(corner.name))
    .sort((left, right) => gapFor(right, scenario) - gapFor(left, scenario))
  const sourceByNumber = new Map(sources.map((source) => [source.n, source]))
  const sdgByCorner = new Map(role.corners.map((corner) => [corner.corner_id, corner.sdg_targets]))
  const pausedGapCorners = weaknessCorners.filter(
    (corner) => corner.verdict === 'rising' && gapFor(corner, scenario) > 0
  )

  const renderGapCard = (corner: Corner) => {
    const cornerSources: SourceRef[] = (corner.sources ?? []).flatMap((number) => {
      const source = sourceByNumber.get(number)
      return source ? [source] : []
    })
    const explanationSource = explanationByCorner.get(corner.id)?.source ?? 'template'
    const goals = sdgGoals(sdgByCorner.get(corner.id), 2)

    return (
      <ExplanationSourceProvider key={corner.id} source={explanationSource}>
        <div className="surface-card space-y-3 p-4 [&>article]:rounded-none [&>article]:border-0 [&>article]:bg-transparent [&>article]:p-0">
          <GapCard
            corner={corner}
            sources={cornerSources}
            scenario={scenario}
            neededLabel={neededLabel}
            paused={explanationsPaused}
          />
          {goals.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-label-s text-text-muted">Closing This Supports</span>
              {goals.map((goal) => (
                <SdgChip key={goal} goal={goal} />
              ))}
            </div>
          )}
        </div>
      </ExplanationSourceProvider>
    )
  }

  if (explanationsPaused) {
    return (
      <div className="mx-auto w-full max-w-[45rem] space-y-6">
        <Banner
          type="error"
          title="Explanations Are Paused"
          body="We couldn't reach the AI. Your verdicts, roles and plan still work."
        />
        <CatDialogue
          pose="worried"
          speech="The AI is resting. Your verdicts still stand. I’ll explain them when it’s back."
        />

        {pausedGapCorners.map(renderGapCard)}

        <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 grid grid-cols-1 gap-3 rounded-md p-3 sm:grid-cols-2 lg:static lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
          <Button variant="secondary" size="lg" fullWidth onClick={retryExplanations}>
            Try the Explanations Again
          </Button>
          <Link
            to={routes.roles}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-sm border-[1.5px] border-text-primary bg-accent-box px-6 text-label-l text-accent-on-box transition-colors duration-150 ease-out hover:bg-accent-box-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            See Roles That Fit
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <Stepper step={3} labels={checkUpSteps} />

      <CatDialogue pose="explaining" speech={speech} />

      <header className="space-y-1.5">
        <div className="flex items-start gap-1">
          <h1 className="text-title-m text-text-primary lg:text-title-l">
            {role.title}, {neededLabel}
          </h1>
          <Tooltip
            content="The needed level is an estimate from AI-use and job-ad trends 12 months ahead."
            className="mt-0.5 lg:mt-1 [&_[role=tooltip]]:left-auto [&_[role=tooltip]]:right-0 [&_[role=tooltip]]:translate-x-0 [&_[role=tooltip]]:max-w-[calc(100vw-3rem)] [&_[role=tooltip]]:whitespace-normal [&_[role=tooltip]]:text-left"
          >
            <button
              type="button"
              aria-label="About Needed By"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg-panel hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <Info className="h-4 w-4 stroke-current" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
        {workSdgs && workSdgs.goals.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-label-s text-text-muted">This Work Supports</span>
            {workSdgs.goals.map((goal) => (
              <SdgChip key={goal} goal={goal} title={workSdgs.reason} />
            ))}
          </div>
        )}
        <p className="text-body-s text-text-muted">
          Where the job is heading, and where you stand. Targets and dates are estimates; every verdict comes from fixed
          rules over dated public data.
        </p>
      </header>

      <AccessNotice
        access={access}
        roleTitle={role.title}
        fit={
          activeRoleCheckup
            ? {
                percent: Math.round(activeRoleCheckup.fit.score),
                estimated: activeRoleCheckup.levels.some(isEstimatedLevel)
              }
            : undefined
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <section className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="Future Skills Radar">
          <FutureSkillsRadar corners={corners} scenario={scenario} size="lg" neededLabel={neededLabel} />
          <Banner
            type="info"
            title={`Data as of ${activeMonth}`}
            body={latestVintage ? `Latest source vintage date: ${latestVintage}` : undefined}
          />
        </section>

        <div className="space-y-4">
          <SkillsSwot swot={swot} size="desktop" />

          <section className="space-y-4" aria-labelledby="gaps-title">
            <header className="flex items-center justify-between gap-3">
              <h2 id="gaps-title" className="text-title-s text-text-primary">
                Your Gaps
              </h2>
              <span className="shrink-0 font-mono text-mono-s text-text-muted">
                {weaknessCorners.length} of {corners.length} Skills
              </span>
            </header>

            {weaknessCorners.map(renderGapCard)}
          </section>

          {jobMarket && jobMarketSource && (
            <JobMarketCard market={jobMarket} roleTitle={role.title} sourceNumber={jobMarketSource.n} />
          )}

          {toolsSource && <ToolsCard role={role} sourceNumber={toolsSource.n} />}

          <SourceList sources={sources} label="All Sources" />

          <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 rounded-md p-3 lg:static lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
            <Link
              to={routes.roles}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-sm border-[1.5px] border-text-primary bg-accent-box px-6 text-label-l text-accent-on-box transition-colors duration-150 ease-out hover:bg-accent-box-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              See Roles That Fit
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
