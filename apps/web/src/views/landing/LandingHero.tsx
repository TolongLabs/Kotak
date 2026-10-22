import type { Corner, SourceRef } from '../../demo/types'
import { corners, sources } from '../../demo/data'
import { Banner } from '../../components/ui/Banner'
import { VerdictChip } from '../../components/ui/VerdictChip'
import { CatDialogue } from '../../components/kotak/CatDialogue'
import { FutureSkillsRadar } from '../../components/kotak/FutureSkillsRadar'
import { Reasoning } from '../../components/kotak/Reasoning'
import { SourceReference } from '../../components/kotak/SourceReference'
import { routes } from '../../app/routes'
import { LandingActionLink } from './LandingActionLink'
import { LandingNav } from './LandingNav'

const accessibilityCorner = corners.find((corner) => corner.id === 'accessibility')
const maxSkillLevel = corners.reduce(
  (maximum, corner) => Math.max(maximum, corner.you, corner.neededSlow, corner.neededFast),
  0
)

function LevelMeter({ corner }: { corner: Corner }) {
  const needed = corner.neededSlow
  const levels = [
    { label: 'You', value: corner.you, filledClass: 'bg-accent-box' },
    { label: 'Needed by 2027', value: needed, filledClass: 'bg-text-primary' }
  ]

  return (
    <div
      className="space-y-2"
      aria-label={`${corner.name}: You ${corner.you} of ${maxSkillLevel}; Needed ${needed} of ${maxSkillLevel}`}
    >
      {levels.map((level) => (
        <div key={level.label} className="flex items-center justify-between gap-3">
          <span className="text-label-s text-text-muted">{level.label}</span>
          <div className="flex items-center gap-1" aria-hidden="true">
            {Array.from({ length: maxSkillLevel }, (_, index) => (
              <span
                key={index}
                className={`h-3 w-8 rounded-sm border border-text-primary ${index < level.value ? level.filledClass : 'bg-bg-panel'}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function GapPreview({ corner, citedSources }: { corner: Corner; citedSources: SourceRef[] }) {
  return (
    <article className="min-w-0 space-y-4 rounded-md border border-border-subtle bg-bg-default p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="min-w-0 flex-1 text-title-s text-text-primary">{corner.name}</h2>
        <VerdictChip verdict={corner.verdict} size="sm" />
      </div>
      <LevelMeter corner={corner} />
      {corner.reasoning ? <Reasoning text={corner.reasoning} /> : null}
      <div className="space-y-2">
        {citedSources.map((source) => (
          <SourceReference key={source.n} source={source} />
        ))}
      </div>
    </article>
  )
}

function HeroKopi({ speech }: { speech: string }) {
  return <CatDialogue pose="explaining" speech={speech} size="lg" stacked />
}

export function LandingHero() {
  if (!accessibilityCorner) return null

  const citedSources = sources.filter((source) => accessibilityCorner.sources?.includes(source.n))
  const speech = `${accessibilityCorner.name} is ${accessibilityCorner.verdict}. Want to see why?`

  return (
    <section className="bg-bg-panel px-6 pb-12 pt-3 lg:px-10 lg:pb-16 lg:pt-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6">
        <LandingNav />

        <Banner type="sample" body="Figures and verdicts on this page use sample data." className="max-w-2xl" />

        <div className="flex w-full flex-col items-center gap-4 pt-2 text-center">
          <h1 className="max-w-5xl text-balance text-display-l text-text-primary lg:text-display-xl">
            Open the Box on Your Job.
          </h1>
          <p className="max-w-3xl text-body-m text-text-muted lg:text-body-l">
            Kotak tracks how AI is changing Malaysian work, shows which of your skills are rising or fading, and builds
            your next 12 weeks. Every verdict cites its source.
          </p>
          <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <LandingActionLink to={routes.checkUp} variant="primary" className="w-full sm:w-auto">
              Start Your Check-Up
            </LandingActionLink>
            <a
              href="#how-it-works"
              className="inline-flex min-h-14 items-center justify-center rounded-sm border-[1.5px] border-text-primary bg-bg-default px-6 text-label-l text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel sm:w-auto"
            >
              See How It Works
            </a>
          </div>
        </div>

        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-6 bg-bg-panel lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_360px_260px] lg:gap-8 lg:rounded-lg lg:border lg:border-border-subtle lg:bg-bg-default lg:p-10">
          <div className="order-1 flex min-w-0 flex-col items-center justify-center lg:order-1">
            <div className="w-full lg:hidden">
              <FutureSkillsRadar corners={corners} scenario="slow" size="sm" className="mx-auto w-full max-w-sm" />
            </div>
            <div className="hidden w-full lg:block">
              <FutureSkillsRadar corners={corners} scenario="slow" size="lg" className="mx-auto w-full max-w-md" />
            </div>
            <ul className="sr-only" aria-label="Sample radar values for the slow scenario">
              {corners.map((corner) => (
                <li key={corner.id}>
                  {corner.name}: You {corner.you} of {maxSkillLevel}; Needed {corner.neededSlow} of {maxSkillLevel}.
                </li>
              ))}
            </ul>
          </div>

          <div className="order-3 min-w-0 lg:order-2">
            <GapPreview corner={accessibilityCorner} citedSources={citedSources} />
          </div>

          <div className="order-2 min-w-0 lg:order-3">
            <HeroKopi speech={speech} />
          </div>
        </div>

        <p className="rounded-full border border-border-subtle bg-bg-default px-4 py-2 text-label-s text-text-muted">
          Keep scrolling. Kopi is opening the box.
        </p>
      </div>
    </section>
  )
}
