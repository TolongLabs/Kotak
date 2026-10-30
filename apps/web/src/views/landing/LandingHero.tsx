import { ArrowRight } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { CatDialogue } from '../../components/kotak/CatDialogue'
import { FutureSkillsRadar } from '../../components/kotak/FutureSkillsRadar'
import { KopiFigure } from '../../components/kopi/KopiFigure'
import { KopiSpeechBox } from '../../components/kopi/KopiSpeechBox'
import { hasAnswers, useGuestSession } from '../../session/store'
import { routes } from '../../app/routes'
import { commonText } from '../../i18n/common'
import { landingText } from '../../i18n/messages/landing'
import { useText } from '../../i18n/text'
import { LandingActionLink } from './LandingActionLink'
import { LandingExampleCard } from './LandingExampleCard'
import { LandingNav } from './LandingNav'
import { useLandingExample } from './landingExample'

// Tailwind's xl breakpoint. Only the hero variant that fits is mounted: a CSS-hidden radar measures 0 × 0, which
// Recharts warns about on every load.
const WIDE_QUERY = '(min-width: 80rem)'

function subscribeWide(listener: () => void) {
  const media = window.matchMedia(WIDE_QUERY)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

export function LandingHero() {
  const loaded = useLandingExample()
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE_QUERY).matches)
  const session = useGuestSession()
  const t = useText(landingText)
  const common = useText(commonText)
  // Signed-in visitors skip sign-in (to the radar once the check-up is answered); everyone else signs in first.
  const signedInTo = hasAnswers(session) ? routes.radar : routes.checkUp
  const startTo = session.is_guest ? signedInTo : `${routes.signIn}?next=${routes.checkUp}`

  const exampleState =
    loaded.status === 'idle' ? (
      <div className="flex w-full max-w-2xl flex-col items-center gap-4">
        <CatDialogue pose="idle" speech={t.hero.idleSpeech} />
        <LandingActionLink to={startTo} variant="primary" showArrow>
          {t.hero.chooseAJob}
        </LandingActionLink>
      </div>
    ) : loaded.status === 'loading' ? (
      <CatDialogue pose="thinking" speech={t.hero.loadingSpeech} />
    ) : loaded.status === 'error' ? (
      <div className="flex w-full max-w-2xl flex-col items-center gap-4">
        <Banner type="error" title={t.hero.exampleErrorTitle} body={t.hero.exampleErrorBody} />
        <Button variant="secondary" onClick={loaded.retry}>
          {common.tryAgain}
        </Button>
      </div>
    ) : null

  const example = loaded.status === 'ready' ? loaded.data : null
  const featuredCorner = example?.corners[0]
  const cornerCitations = (featuredCorner ? example?.numbers.get(featuredCorner.id) : undefined) ?? []
  const cornerSources = example ? example.sources.filter((source) => cornerCitations.includes(source.n)) : []
  const verdictText = featuredCorner ? t.hero.verdictSpeech[featuredCorner.verdict] : ''
  const speech = featuredCorner ? t.hero.speech(featuredCorner.name, verdictText) : t.hero.speechFallback

  return (
    <section className="flex min-h-svh flex-col bg-bg-panel px-6 pb-6 pt-3 lg:px-16 lg:pt-6">
      <div className="mx-auto flex w-full max-w-[1312px] flex-1 flex-col items-center gap-6">
        <LandingNav />

        {/* Below xl the headline centres over the stacked example; at xl it sets a masthead over the stage. */}
        <div className="flex w-full flex-col items-center gap-4 pt-2 text-center xl:grid xl:grid-cols-12 xl:items-end xl:gap-x-6 xl:gap-y-4 xl:pt-2 xl:text-left">
          <h1 className="max-w-[900px] text-balance font-extrabold text-display-l text-text-primary lg:text-display-xl xl:col-span-12 xl:max-w-none">
            {t.hero.title}
          </h1>
          <p className="max-w-[660px] text-body-m text-text-muted lg:text-body-l xl:col-span-7">{t.hero.subtitle}</p>
          <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4 xl:col-span-5 xl:justify-end">
            <LandingActionLink to={startTo} variant="primary" showArrow className="w-full sm:w-auto">
              {t.hero.start}
            </LandingActionLink>
            <a
              href="#how-it-works"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-sm border-[1.5px] border-text-primary bg-bg-default px-6 text-label-l font-semibold text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel sm:w-auto"
            >
              <span>{t.hero.seeHowItWorks}</span>
              <ArrowRight className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
            </a>
          </div>
        </div>

        {example && featuredCorner ? (
          <>
            {/* Desktop Stage Card (1440px): Radar, GapCard, and Kopi side by side */}
            {wide ? (
              <div className="relative flex w-full flex-1 items-center justify-between gap-10 rounded-[24px] border border-border-subtle bg-bg-default px-12 pb-10 pt-6">
                <div className="flex w-[393px] shrink-0 items-center justify-center">
                  <FutureSkillsRadar
                    corners={example.corners}
                    scenario={example.checkup.scenario}
                    size="md"
                    neededLabel={t.hero.neededBy2027}
                    className="w-full [&_ul]:hidden"
                  />
                </div>

                <div className="min-w-0 max-w-[440px] flex-1">
                  <LandingExampleCard
                    corner={featuredCorner}
                    sources={cornerSources}
                    maxSources={1}
                    scenario={example.checkup.scenario}
                    neededLabel={t.hero.neededBy2027}
                  />
                </div>

                <div className="flex w-[260px] shrink-0 flex-col items-center gap-2">
                  <KopiFigure pose="explaining" className="h-[208px] w-[160px]" />
                  <KopiSpeechBox speech={speech} className="w-[260px]" />
                </div>
              </div>
            ) : (
              /* Phone composition (390px / below xl): Radar, CatDialogue, and LandingExampleCard stacked */
              <div className="flex w-full max-w-[342px] flex-col items-center gap-5">
                <FutureSkillsRadar
                  corners={example.corners}
                  scenario={example.checkup.scenario}
                  size="sm"
                  neededLabel={t.hero.neededByMay2027}
                  className="w-full"
                />

                <div className="w-full">
                  <CatDialogue pose="explaining" speech={speech} size="md" />
                </div>

                <div className="w-full">
                  <LandingExampleCard
                    corner={featuredCorner}
                    sources={cornerSources}
                    scenario={example.checkup.scenario}
                    neededLabel={t.hero.neededBy2027}
                  />
                </div>
              </div>
            )}

            <ul className="sr-only" aria-label={t.hero.radarAriaLabel(t.hero.radarScenario[example.checkup.scenario])}>
              {example.corners.map((corner) => {
                const citations = example.numbers.get(corner.id) ?? []
                return (
                  <li key={corner.id}>
                    {t.hero.cornerSummary(
                      corner.name,
                      corner.you,
                      corner.neededSlow,
                      citations.map((number) => `[${number}]`).join(', ')
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        ) : example && !featuredCorner ? (
          <Banner type="error" title={t.hero.exampleErrorTitle} body={t.hero.noCornersBody} className="max-w-2xl" />
        ) : (
          <div className="flex w-full justify-center">{exampleState}</div>
        )}

        {/* At xl the cue sits on the stage's bottom edge. */}
        <p className="relative mt-auto rounded-full border border-border-subtle bg-bg-default px-4 py-2 text-label-s text-text-muted xl:-mt-10">
          {t.hero.scrollCue}
        </p>
      </div>
    </section>
  )
}
