import { useState } from 'react'
import { Link, navigate } from '../app/router'
import { routes } from '../app/routes'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { FutureSkillsRadar } from '../components/kotak/FutureSkillsRadar'
import { GapCard } from '../components/kotak/GapCard'
import { SourceReference } from '../components/kotak/SourceReference'
import { SkillsSwot } from '../components/kotak/SkillsSwot'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { ScenarioSwitch } from '../components/ui/ScenarioSwitch'
import { Stepper } from '../components/ui/Stepper'
import { toCorners, toRoles, neededByLabel, sourceRefs } from '../engine/viewModel'
import { useCheckup, type Checkup } from '../engine/checkup'
import { useRoleBundle } from '../engine/bundle'
import { useGuestSession } from '../session/store'
import type { Corner, Scenario, SourceRef } from '../demo/types'
import { deriveSwot } from '../demo/swot'

const stepLabels: [string, string, string, string, string] = ['Home', 'Check-Up', 'Radar', 'Roles', 'Roadmap']

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

function RadarCatDialogue({ pose, speech }: { pose: 'explaining' | 'worried'; speech: string }) {
  return (
    <div className="[&>div]:flex-row [&>div]:items-end [&>div]:gap-3 [&>div>div:first-child]:h-28 [&>div>div:first-child]:self-end">
      <CatDialogue pose={pose} speech={speech} size="md" />
    </div>
  )
}

export function RadarView() {
  const [scenario, setScenario] = useState<Scenario>('slow')
  const session = useGuestSession()
  const loaded = useCheckup({ scenario })
  const bundle = useRoleBundle(session.role_code)
  // Explanations come from the AI route (#43). Until it exists, ?ai=off shows the paused state for demos.
  const [explanationsPaused, setExplanationsPaused] = useState(
    () => new URLSearchParams(window.location.search).get('ai') === 'off'
  )

  const retryExplanations = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('ai')
    window.history.replaceState(null, '', url)
    setExplanationsPaused(false)
  }

  if (!session.role_code) {
    return (
      <div className="mx-auto w-full max-w-[45rem] space-y-6">
        <h1 className="sr-only">Future Skills Radar</h1>
        <Stepper step={3} labels={stepLabels} />
        <CatDialogue pose="worried" speech="Tell me your job first, then I can map its skills." />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Choose Your Job
        </Button>
      </div>
    )
  }

  if (loaded.status !== 'ready' || bundle.status !== 'ready') {
    return (
      <div className="mx-auto w-full max-w-[45rem] space-y-6">
        <h1 className="sr-only">Future Skills Radar</h1>
        <Stepper step={3} labels={stepLabels} />
        {loaded.status === 'error' || bundle.status === 'error' ? (
          <Banner type="error" title="Kopi Could Not Open This Job" body="Reload the page, or choose your job again." />
        ) : (
          <CatDialogue pose="thinking" speech="Opening the box on your job…" />
        )}
      </div>
    )
  }

  const { checkup } = loaded.data
  const { role, related } = bundle.data
  const { sources, numbers } = sourceRefs(checkup)
  const corners = toCorners(checkup, numbers)
  const roles = toRoles(checkup, [role, ...related], session.role_code)
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
  const speech = biggestRisingGap
    ? firstRoadmapStatement
      ? `Your biggest rising gap is ${biggestRisingGap.name}. Try this: ${firstRoadmapStatement}`
      : 'I don’t have a ready skill statement for your first step yet.'
    : 'No rising skill gap stands out for this job yet.'

  const weaknessNames = new Set(swot.weaknesses.map((item) => item.label))
  const weaknessCorners = corners
    .filter((corner) => weaknessNames.has(corner.name))
    .sort((left, right) => gapFor(right, scenario) - gapFor(left, scenario))
  const sourceByNumber = new Map(sources.map((source) => [source.n, source]))
  const pausedGapCorners = weaknessCorners.filter(
    (corner) => corner.verdict === 'rising' && gapFor(corner, scenario) > 0
  )

  const renderGapCard = (corner: Corner) => {
    const cornerSources: SourceRef[] = (corner.sources ?? []).flatMap((number) => {
      const source = sourceByNumber.get(number)
      return source ? [source] : []
    })

    return (
      <GapCard
        key={corner.id}
        corner={corner}
        sources={cornerSources}
        scenario={scenario}
        neededLabel={neededLabel}
        paused={explanationsPaused}
      />
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
        {role.quality === 'auto-generated' && (
          <Banner
            type="info"
            title="AI-Drafted Skills"
            body="Kopi drafted these skills from the job’s O*NET tasks. The team has not checked them by hand yet."
          />
        )}
        <RadarCatDialogue
          pose="worried"
          speech="The AI is resting. Your verdicts still stand. I’ll explain them when it’s back."
        />

        {pausedGapCorners.map(renderGapCard)}

        <div className="surface-glass sticky bottom-3 z-10 grid grid-cols-1 gap-3 rounded-md p-3 sm:grid-cols-2 lg:static lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
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
      <Stepper step={3} labels={stepLabels} />
      {role.quality === 'auto-generated' && (
        <Banner
          type="info"
          title="AI-Drafted Skills"
          body="Kopi drafted these skills from the job’s O*NET tasks. The team has not checked them by hand yet."
        />
      )}

      <RadarCatDialogue pose="explaining" speech={speech} />

      <header className="space-y-1.5">
        <h1 className="text-title-m text-text-primary lg:text-title-l">
          {role.title}, {neededLabel.replace(/^Needed by /, '')}
        </h1>
        <p className="text-body-s text-text-muted">
          Where the job is heading, and where you stand. Targets and dates are estimates; every verdict comes from fixed
          rules over dated public data.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-8">
        <section className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="Future Skills Radar">
          <div className="flex justify-center">
            <ScenarioSwitch value={scenario} onChange={setScenario} aria-label="AI Uptake Scenario" />
          </div>
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

          {sources.length > 0 && (
            <section className="space-y-3" aria-labelledby="all-sources-title">
              <h2 id="all-sources-title" className="text-title-s text-text-primary">
                All Sources
              </h2>
              <ul className="surface-card space-y-2 p-3">
                {sources.map((source) => (
                  <li key={source.n}>
                    <SourceReference source={source} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="surface-glass sticky bottom-3 z-10 rounded-md p-3 lg:static lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
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
