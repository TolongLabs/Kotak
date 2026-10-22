import { ArrowRight } from 'lucide-react'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { CatDialogue } from '../../components/kotak/CatDialogue'
import { FutureSkillsRadar } from '../../components/kotak/FutureSkillsRadar'
import { GapCard } from '../../components/kotak/GapCard'
import { KopiFigure } from '../../components/kopi/KopiFigure'
import { KopiSpeechBox } from '../../components/kopi/KopiSpeechBox'
import { routes } from '../../app/routes'
import { LandingActionLink } from './LandingActionLink'
import { LandingNav } from './LandingNav'
import { useLandingExample } from './landingExample'

export function LandingHero() {
  const loaded = useLandingExample()

  const exampleState =
    loaded.status === 'idle' ? (
      <div className="flex w-full max-w-2xl flex-col items-center gap-4">
        <CatDialogue pose="idle" speech="Choose a job to open your check-up." />
        <LandingActionLink to={routes.checkUp} variant="primary" showArrow>
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
  const cornerCitations = (featuredCorner ? example?.numbers.get(featuredCorner.id) : undefined) ?? []
  const cornerSources = example ? example.sources.filter((source) => cornerCitations.includes(source.n)) : []
  const speech = featuredCorner
    ? `${featuredCorner.name} is ${featuredCorner.verdict}. Want to see why?`
    : 'Kopi will open the example check-up soon.'

  return (
    <section className="bg-bg-panel px-6 pb-12 pt-3 lg:px-[120px] lg:pb-16 lg:pt-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 lg:gap-8">
        <LandingNav />

        <div className="flex w-full flex-col items-center gap-4 pt-2 text-center">
          <h1 className="max-w-[900px] text-balance font-extrabold text-display-l text-text-primary lg:text-display-xl">
            Open the Box on Your Job.
          </h1>
          <p className="max-w-[660px] text-body-m text-text-muted lg:text-body-l">
            Kotak tracks how AI is changing Malaysian work, shows which of your skills are rising or fading, and builds
            your next 12 weeks. Every verdict cites its source.
          </p>
          <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <LandingActionLink to={routes.checkUp} variant="primary" showArrow className="w-full sm:w-auto">
              Start
            </LandingActionLink>
            <a
              href="#how-it-works"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-sm border-[1.5px] border-text-primary bg-bg-default px-6 text-label-l font-semibold text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel sm:w-auto"
            >
              <span>See How It Works</span>
              <ArrowRight className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
            </a>
          </div>
        </div>

        {example && featuredCorner ? (
          <>
            {/* Desktop Stage Card (1440px): Radar, GapCard, and Kopi side by side */}
            <div className="hidden min-h-[520px] w-full max-w-[1134px] items-center justify-center gap-10 rounded-[24px] border border-border-subtle bg-bg-default p-8 xl:flex xl:p-12">
              <div className="flex w-[393px] shrink-0 items-center justify-center">
                <FutureSkillsRadar
                  corners={example.corners}
                  scenario={example.checkup.scenario}
                  size="md"
                  neededLabel="Needed by 2027"
                  className="w-full [&_ul]:hidden"
                />
              </div>

              <div className="w-[360px] shrink-0">
                <GapCard
                  corner={featuredCorner}
                  sources={cornerSources}
                  scenario={example.checkup.scenario}
                  neededLabel="Needed by 2027"
                />
              </div>

              <div className="flex w-[260px] shrink-0 flex-col items-center gap-2">
                <KopiFigure pose="explaining" className="h-[208px] w-[160px]" />
                <KopiSpeechBox speech={speech} className="w-[260px]" />
              </div>
            </div>

            {/* Phone composition (390px / below xl): Radar, CatDialogue, and GapCard stacked */}
            <div className="flex w-full max-w-[342px] flex-col items-center gap-5 xl:hidden">
              <FutureSkillsRadar
                corners={example.corners}
                scenario={example.checkup.scenario}
                size="sm"
                neededLabel="Needed by Oct 2027"
                className="w-full"
              />

              <div className="w-full">
                <CatDialogue pose="explaining" speech={speech} size="md" />
              </div>

              <div className="w-full">
                <GapCard
                  corner={featuredCorner}
                  sources={cornerSources}
                  scenario={example.checkup.scenario}
                  neededLabel="Needed by 2027"
                />
              </div>
            </div>

            <ul className="sr-only" aria-label={`Example radar values for the ${example.checkup.scenario} scenario`}>
              {example.corners.map((corner) => {
                const citations = example.numbers.get(corner.id) ?? []
                return (
                  <li key={corner.id}>
                    {corner.name}: Example answer {corner.you}; estimated need about {corner.neededSlow}. Sources{' '}
                    {citations.map((number) => `[${number}]`).join(', ')}.
                  </li>
                )
              })}
            </ul>
          </>
        ) : example && !featuredCorner ? (
          <Banner
            type="error"
            title="Example Not Available"
            body="This Web Developers bundle has no skill corners to display."
            className="max-w-2xl"
          />
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
