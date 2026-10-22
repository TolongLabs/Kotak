import type { Corner, SourceRef } from '../../demo/types'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { VerdictChip } from '../../components/ui/VerdictChip'
import { CatDialogue } from '../../components/kotak/CatDialogue'
import { FutureSkillsRadar } from '../../components/kotak/FutureSkillsRadar'
import { Reasoning } from '../../components/kotak/Reasoning'
import { SourceReference } from '../../components/kotak/SourceReference'
import { routes } from '../../app/routes'
import { LandingActionLink } from './LandingActionLink'
import { LandingNav } from './LandingNav'
import { useLandingExample } from './landingExample'
import { neededByLabel } from '../../engine/viewModel'

function CitationMarks({ numbers }: { numbers: number[] }) {
  if (numbers.length === 0) return null

  return (
    <span className="inline-flex items-center gap-1 font-mono text-mono-s text-text-muted" aria-label="Sources">
      {numbers.map((number) => (
        <a key={number} href={`#source-${number}`} className="underline underline-offset-2">
          [{number}]
        </a>
      ))}
    </span>
  )
}

function LevelMeter({ corner, maxSkillLevel }: { corner: Corner; maxSkillLevel: number }) {
  const levels = [
    { label: 'Example Answer', value: corner.you, text: String(corner.you), filledClass: 'bg-accent-box' },
    {
      label: 'Needed Estimate',
      value: corner.neededSlow,
      text: `About ${corner.neededSlow}`,
      filledClass: 'bg-text-primary'
    }
  ]

  return (
    <div
      role="img"
      className="space-y-2"
      aria-label={`${corner.name}: Example answer ${corner.you} of ${maxSkillLevel}; estimated need about ${corner.neededSlow} of ${maxSkillLevel}`}
    >
      {levels.map((level) => (
        <div key={level.label} className="flex items-center justify-between gap-3">
          <span className="text-label-s text-text-muted">{level.label}</span>
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="font-mono text-mono-s text-text-primary">{level.text}</span>
            <span className="flex items-center gap-1">
              {Array.from({ length: maxSkillLevel }, (_, index) => (
                <span
                  key={index}
                  className={`h-3 w-8 rounded-sm border border-text-primary ${index < level.value ? level.filledClass : 'bg-bg-panel'}`}
                />
              ))}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function GapPreview({
  corner,
  citedSources,
  citationNumbers,
  maxSkillLevel,
  neededLabel
}: {
  corner: Corner
  citedSources: SourceRef[]
  citationNumbers: number[]
  maxSkillLevel: number
  neededLabel: string
}) {
  return (
    <article className="min-w-0 space-y-4 rounded-md border border-border-subtle bg-bg-default p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="min-w-0 flex-1 text-title-s text-text-primary">{corner.name}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <VerdictChip verdict={corner.verdict} size="sm" />
          <CitationMarks numbers={citationNumbers} />
        </div>
      </div>
      <LevelMeter corner={corner} maxSkillLevel={maxSkillLevel} />
      <p className="font-mono text-mono-s text-text-muted">{neededLabel}</p>
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
  const loaded = useLandingExample()

  const exampleState =
    loaded.status === 'idle' ? (
      <div className="flex w-full max-w-2xl flex-col items-center gap-4">
        <CatDialogue pose="idle" speech="Choose a job to open your check-up." />
        <LandingActionLink to={routes.checkUp} variant="primary">
          Choose A Job
        </LandingActionLink>
      </div>
    ) : loaded.status === 'loading' ? (
      <CatDialogue pose="thinking" speech="Kopi is opening the Web Developers example…" />
    ) : loaded.status === 'error' ? (
      <div className="flex w-full max-w-2xl flex-col items-center gap-4">
        <Banner
          type="error"
          title="Example Not Available"
          body="Kopi could not open the Web Developers check-up. Try again."
        />
        <Button variant="secondary" onClick={loaded.retry}>
          Try Again
        </Button>
      </div>
    ) : null

  const example = loaded.status === 'ready' ? loaded.data : null
  const featuredCorner = example?.corners[0]
  const maxSkillLevel =
    example?.corners.reduce(
      (maximum, corner) => Math.max(maximum, corner.you, corner.neededSlow, corner.neededFast),
      0
    ) ?? 0
  const neededLabel = example ? `Estimated need by ${neededByLabel(example.checkup).replace('Needed by ', '')}` : ''
  const speech = featuredCorner
    ? `${featuredCorner.name} is ${featuredCorner.verdict}. Want to see why?`
    : 'Kopi will open the example check-up soon.'

  return (
    <section className="bg-bg-panel px-6 pb-12 pt-3 lg:px-10 lg:pb-16 lg:pt-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6">
        <LandingNav />

        <div className="flex w-full flex-col items-center gap-4 pt-2 text-center">
          <h1 className="max-w-5xl text-balance text-display-l text-text-primary lg:text-display-xl">
            Open the Box on Your Job.
          </h1>
          <p className="max-w-3xl text-body-m text-text-muted lg:text-body-l">
            Kotak tracks how AI is changing Malaysian work, shows which of your skills are rising or fading, and builds
            your next plan. Every verdict cites its source.
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

        {example ? (
          <>
            {example.role.quality === 'auto-generated' ? (
              <Banner
                type="info"
                title="AI-Drafted Skills"
                body="Kopi drafted these skills from the job’s O*NET tasks. The team has not checked them by hand yet."
                className="max-w-2xl"
              />
            ) : null}

            <p className="font-mono text-mono-s text-text-muted">Example: {example.role.title} Check-Up</p>

            {featuredCorner ? (
              <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-6 bg-bg-panel lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_360px_260px] lg:gap-8 lg:rounded-lg lg:border lg:border-border-subtle lg:bg-bg-default lg:p-10">
                <div className="order-1 flex min-w-0 flex-col items-center justify-center lg:order-1">
                  <div className="w-full lg:hidden">
                    <FutureSkillsRadar
                      corners={example.corners}
                      scenario={example.checkup.scenario}
                      size="sm"
                      className="mx-auto w-full max-w-sm"
                      neededLabel={neededLabel}
                    />
                  </div>
                  <div className="hidden w-full lg:block">
                    <FutureSkillsRadar
                      corners={example.corners}
                      scenario={example.checkup.scenario}
                      size="lg"
                      className="mx-auto w-full max-w-md"
                      neededLabel={neededLabel}
                    />
                  </div>
                  <ul
                    className="sr-only"
                    aria-label={`Example radar values for the ${example.checkup.scenario} scenario`}
                  >
                    {example.corners.map((corner) => {
                      const citations = example.numbers.get(corner.id) ?? []
                      return (
                        <li key={corner.id}>
                          {corner.name}: Example answer {corner.you} of {maxSkillLevel}; estimated need about{' '}
                          {corner.neededSlow} of {maxSkillLevel}. Sources{' '}
                          {citations.map((number) => `[${number}]`).join(', ')}.
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <div className="order-3 min-w-0 lg:order-2">
                  <GapPreview
                    corner={featuredCorner}
                    citedSources={example.sources}
                    citationNumbers={example.numbers.get(featuredCorner.id) ?? []}
                    maxSkillLevel={maxSkillLevel}
                    neededLabel={neededLabel}
                  />
                </div>

                <div className="order-2 min-w-0 lg:order-3">
                  <HeroKopi speech={speech} />
                </div>
              </div>
            ) : (
              <Banner
                type="error"
                title="Example Not Available"
                body="This Web Developers bundle has no skill corners to display."
                className="max-w-2xl"
              />
            )}
          </>
        ) : (
          <div className="flex w-full justify-center">{exampleState}</div>
        )}

        <p className="rounded-full border border-border-subtle bg-bg-default px-4 py-2 text-label-s text-text-muted">
          Keep scrolling. Kopi is opening the box.
        </p>
      </div>
    </section>
  )
}
