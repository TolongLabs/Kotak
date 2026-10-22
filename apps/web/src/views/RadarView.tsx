import { useMemo, useState } from 'react'
import { Link } from '../app/router'
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
import { cn } from '../components/ui/cn'
import { corners, roadmap, roles, sources, user } from '../demo/data'
import type { Corner, Scenario, SourceRef } from '../demo/types'
import { deriveSwot } from '../demo/swot'

const stepLabels: [string, string, string, string, string] = ['Home', 'Check-Up', 'Radar', 'Roles', 'Roadmap']

function gapFor(corner: Corner, scenario: Scenario) {
  const needed = scenario === 'slow' ? corner.neededSlow : corner.neededFast
  return needed - corner.you
}

function getTargetDateLabel(lastCheckUp: string) {
  const [, , month, year] = lastCheckUp.split(' ')
  return `${month} ${Number(year) + 1}`
}

export function RadarView() {
  const [scenario, setScenario] = useState<Scenario>('slow')
  // Explanations come from the AI route (#43). Until it exists, ?ai=off shows the paused state for demos.
  const [explanationsPaused, setExplanationsPaused] = useState(
    () => new URLSearchParams(window.location.search).get('ai') === 'off'
  )
  const swot = useMemo(() => deriveSwot(corners, roles, scenario), [scenario])
  const targetDate = getTargetDateLabel(user.lastCheckUp)
  const targetYear = targetDate.split(' ').slice(-1)[0] ?? ''
  const neededDateLabel = `Needed by ${targetDate}`
  const neededYearLabel = `Needed by ${targetYear}`

  const biggestRisingGap = corners
    .filter((corner) => corner.verdict === 'rising')
    .sort((left, right) => {
      const gapDifference = gapFor(right, scenario) - gapFor(left, scenario)
      return gapDifference || corners.indexOf(right) - corners.indexOf(left)
    })[0]
  const firstRoadmapStepTitle = roadmap[0]?.title
  const speech =
    biggestRisingGap && firstRoadmapStepTitle
      ? `Your biggest rising gap is ${biggestRisingGap.name}. Your first roadmap step is ${firstRoadmapStepTitle}.`
      : ''

  const weaknessNames = new Set(swot.weaknesses.map((item) => item.label))
  const weaknessCorners = corners
    .filter((corner) => weaknessNames.has(corner.name))
    .sort((left, right) => {
      const gapDifference = gapFor(right, scenario) - gapFor(left, scenario)
      return gapDifference || corners.indexOf(right) - corners.indexOf(left)
    })
  const sourceByNumber = new Map(sources.map((source) => [source.n, source]))
  const citedSourceNumbers = [...new Set(weaknessCorners.flatMap((corner) => corner.sources ?? []))].sort(
    (left, right) => left - right
  )
  const citedSources: SourceRef[] = citedSourceNumbers.flatMap((number) => {
    const source = sourceByNumber.get(number)
    return source ? [source] : []
  })

  const retryExplanations = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('ai')
    window.history.replaceState(null, '', url)
    setExplanationsPaused(false)
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <Stepper step={3} labels={stepLabels} />
      {explanationsPaused && (
        <Banner
          type="error"
          title="Explanations Are Paused"
          body="We couldn't reach the AI. Your verdicts, roles and plan still work."
        />
      )}
      <Banner type="sample" />

      <CatDialogue
        pose={explanationsPaused ? 'worried' : 'explaining'}
        speech={
          explanationsPaused
            ? 'The AI is resting. Your verdicts still stand. I’ll explain them when it’s back.'
            : speech
        }
        size="lg"
      />

      <header className="space-y-1.5">
        <h1 className="text-title-m text-text-primary lg:text-title-l">
          {user.jobTitle}, {targetDate}
        </h1>
        <p className="text-body-s text-text-muted">
          Where the job is heading, and where you stand. Every verdict comes from fixed rules over dated public data.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-8">
        <section className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="Future Skills Radar">
          <div className="flex justify-center">
            <ScenarioSwitch value={scenario} onChange={setScenario} aria-label="AI Uptake Scenario" />
          </div>
          <FutureSkillsRadar corners={corners} scenario={scenario} size="lg" neededLabel={neededDateLabel} />
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

            {weaknessCorners.map((corner) => {
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
                  neededLabel={neededYearLabel}
                  paused={explanationsPaused}
                />
              )
            })}
          </section>

          <section className="space-y-3" aria-labelledby="all-sources-title">
            <h2 id="all-sources-title" className="text-title-s text-text-primary">
              All Sources
            </h2>
            <ul className="surface-card space-y-2 p-3">
              {citedSources.map((source) => (
                <li key={source.n}>
                  <SourceReference source={source} />
                </li>
              ))}
            </ul>
          </section>

          <div
            className={cn(
              'surface-glass sticky bottom-3 z-10 rounded-md p-3 lg:static lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none',
              explanationsPaused && 'grid grid-cols-1 gap-3 sm:grid-cols-2'
            )}
          >
            {explanationsPaused && (
              <Button variant="secondary" fullWidth onClick={retryExplanations}>
                Try the Explanations Again
              </Button>
            )}
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
