import { MoveRight, PackageOpen } from 'lucide-react'
import type { ChangeItem, RoadmapStep } from '../../demo/types'
import { CatDialogue } from '../../components/kotak/CatDialogue'
import { RoadmapStepCard } from '../../components/kotak/RoadmapStepCard'
import { VerdictChip } from '../../components/ui/VerdictChip'
import { WhatChangedCard } from '../../components/kotak/WhatChangedCard'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { LandingActionLink } from './LandingActionLink'
import { routes } from '../../app/routes'
import { useLandingExample } from './landingExample'

const boxQuestions = [
  {
    role: 'Front-End Developer',
    title: 'Will Hand-Coded Layouts Still Pay?',
    from: 'unknown' as const,
    to: 'declining' as const,
    body: 'Ads asking for them are falling, and AI now drafts most layouts.'
  },
  {
    role: 'Legal Executive',
    title: 'Is Contract Drafting Still Worth My Hours?',
    from: 'unknown' as const,
    to: 'split' as const,
    body: 'The sources disagree, so Kotak shows two plans instead of a guess.'
  },
  {
    role: 'Graphic Designer',
    title: 'Should I Learn to Direct AI Image Tools?',
    from: 'unknown' as const,
    to: 'rising' as const,
    body: 'More design work now runs through AI tools, and clients still need a human eye.'
  }
]

const liveDataChanges: ChangeItem[] = [
  {
    source: 'New data · DOSM Q3 2026',
    skill: 'Testing',
    from: 'split',
    to: 'rising',
    why: 'Job ads asking for testing rose 9% in Q3, and AI use in testing kept climbing.',
    effect: 'Your roadmap: “Write Tests for AI-Written Code” joined weeks 9–12.'
  },
  {
    source: 'New data · Economic Index, Aug 2026',
    skill: 'Design Systems',
    from: 'steady',
    to: 'rising',
    why: 'More design-system work now runs through AI tools, and demand held up.',
    effect: 'Design Systems Developer is now your top match at 74%.'
  }
]

const roadmapStepExample: RoadmapStep = {
  id: 'step-1',
  state: 'next',
  weeks: [1, 4],
  when: 'Weeks 1–4 · 2–29 Nov',
  skill: 'Reviewing AI-Written Code',
  title: 'Review AI-Written Pull Requests',
  description: 'Review three AI-written pull requests and fix what they get wrong.',
  gain: '+2 Levels · Reviewing AI-Written Code',
  hoursPerWeek: 3,
  resource: {
    label: 'GitHub Skills: Review Pull Requests',
    href: 'https://skills.github.com'
  },
  sdgs: [8]
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children: string }) {
  return (
    <header className="mx-auto flex max-w-4xl flex-col gap-4 text-center">
      <p className="font-mono text-mono-s text-text-muted">{eyebrow}</p>
      <h2 className="text-balance font-extrabold text-display text-text-primary lg:text-display-l">{title}</h2>
      <p className="max-w-[700px] text-body-m text-text-muted lg:text-body-l">{children}</p>
    </header>
  )
}

function BoxSection() {
  return (
    <section className="bg-bg-default px-6 py-16 lg:px-[120px] lg:py-24">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 lg:gap-10">
        <SectionHeading eyebrow="Why the Name" title="Every Skill Is in a Box.">
          Kotak is Malay for box. Like Schrödinger’s cat, a skill is both rising and fading until someone checks the
          evidence. Kotak opens the box with dated public data.
        </SectionHeading>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
          {boxQuestions.map((q) => (
            <article
              key={q.role}
              className="flex min-w-0 flex-col gap-4 rounded-md border border-border-subtle bg-bg-default p-6"
            >
              <PackageOpen className="h-6 w-6 stroke-current text-text-primary" aria-hidden="true" />
              <p className="font-mono text-mono-s text-text-muted">{q.role}</p>
              <h3 className="text-title-s text-text-primary">{q.title}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <VerdictChip verdict={q.from} />
                <MoveRight className="h-[18px] w-[18px] stroke-current text-text-primary" aria-label="moves to" />
                <VerdictChip verdict={q.to} />
              </div>
              <p className="text-body-s text-text-muted">{q.body}</p>
            </article>
          ))}
        </div>

        <p className="text-center font-mono text-mono-s text-text-muted">
          Sample verdicts for three jobs, from Q2 2026 data.
        </p>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-bg-panel px-6 py-16 lg:px-[120px] lg:py-24">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 lg:gap-10">
        <SectionHeading eyebrow="How It Works" title="Three Minutes to Open Yours.">
          No CV and no sign-up. Kopi asks, fixed rules decide, and you leave with a plan you can start this week.
        </SectionHeading>

        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3 lg:gap-6">
          {/* Step 1 */}
          <article className="flex min-w-0 flex-col gap-4 rounded-md border border-border-subtle bg-bg-default p-6">
            <p className="font-mono text-mono-s text-text-muted">Step 1</p>
            <h3 className="text-title-s text-text-primary">Answer 12 Questions</h3>
            <p className="text-body-s text-text-muted">
              Kopi asks yes or no can-do questions about your job, out loud if you like.
            </p>
            <div className="mt-auto pt-2">
              <CatDialogue pose="asking" speech="Have you reviewed AI-written code before merging it?" size="md" />
            </div>
          </article>

          {/* Step 2 */}
          <article className="flex min-w-0 flex-col gap-4 rounded-md border border-border-subtle bg-bg-default p-6">
            <p className="font-mono text-mono-s text-text-muted">Step 2</p>
            <h3 className="text-title-s text-text-primary">See Where You Stand</h3>
            <p className="text-body-s text-text-muted">
              Your skills against what your job needs by 2027, sorted into a Skills SWOT.
            </p>
            <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
              <div className="flex flex-col gap-1 rounded-md border-[1.5px] border-text-primary bg-radar-you-fill p-3">
                <span className="text-label-m text-text-primary">Strengths</span>
                <span className="font-mono text-mono-s text-text-muted">2 Skills</span>
              </div>
              <div className="flex flex-col gap-1 rounded-md border-[1.5px] border-text-primary bg-bg-default p-3">
                <span className="text-label-m text-text-primary">Weaknesses</span>
                <span className="font-mono text-mono-s text-text-muted">3 Skills</span>
              </div>
              <div className="flex flex-col gap-1 rounded-md border border-border-subtle bg-bg-default p-3">
                <span className="text-label-m text-text-primary">Opportunities</span>
                <span className="font-mono text-mono-s text-text-muted">1 Role</span>
              </div>
              <div className="flex flex-col gap-1 rounded-md border-[1.5px] border-text-primary bg-bg-panel p-3">
                <span className="text-label-m text-text-primary">Threats</span>
                <span className="font-mono text-mono-s text-text-muted">1 Skill</span>
              </div>
            </div>
          </article>

          {/* Step 3 */}
          <article className="flex min-w-0 flex-col gap-4 rounded-md border border-border-subtle bg-bg-default p-6">
            <p className="font-mono text-mono-s text-text-muted">Step 3</p>
            <h3 className="text-title-s text-text-primary">Follow Your 12 Weeks</h3>
            <p className="text-body-s text-text-muted">
              Free resources in order, sized to your hours, each tied to an SDG.
            </p>
            <div className="mt-auto pt-2">
              <RoadmapStepCard step={roadmapStepExample} index={0} last={true} />
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function LiveDataSection() {
  return (
    <section
      style={
        {
          '--color-bg-default': '#10100b',
          '--color-bg-panel': '#1b1a13',
          '--color-text-primary': '#f3f2ed',
          '--color-text-muted': '#acaba3',
          '--color-border-subtle': '#37362f',
          '--color-border-control': '#6a6961',
          colorScheme: 'dark'
        } as React.CSSProperties
      }
      className="bg-bg-default px-6 py-16 text-text-primary lg:px-[120px] lg:py-24"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-4">
          <p className="font-mono text-mono-s text-text-muted">Live Data</p>
          <h2 className="text-balance font-extrabold text-display text-text-primary lg:text-display-l">
            When the Data Moves, Your Plan Moves.
          </h2>
          <p className="text-body-m text-text-muted lg:text-body-l">
            Every quarter brings new DOSM job-ad counts and AI use data. Kotak reruns the rules, then shows what changed
            and why. You see the radar shift and the roadmap reorder.
          </p>
        </div>

        <div className="grid min-w-0 gap-4">
          {liveDataChanges.map((change) => (
            <WhatChangedCard key={change.skill} item={change} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ExampleState({ loaded }: { loaded: Exclude<ReturnType<typeof useLandingExample>, { status: 'ready' }> }) {
  return (
    <section className="px-6 py-16 lg:px-[120px] lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6">
        {loaded.status === 'idle' ? (
          <>
            <CatDialogue pose="idle" speech="Choose a job before opening a check-up." />
            <LandingActionLink to={routes.checkUp} variant="primary" showArrow>
              Choose A Job
            </LandingActionLink>
          </>
        ) : loaded.status === 'loading' ? (
          <CatDialogue pose="thinking" speech="Kopi is opening the Web Developers example…" />
        ) : (
          <>
            <Banner
              type="error"
              title="Example Not Available"
              body="Kopi could not open the Web Developers check-up. Try again."
            />
            <Button variant="secondary" onClick={loaded.retry}>
              Try Again
            </Button>
          </>
        )}
      </div>
    </section>
  )
}

export function LandingSections() {
  const loaded = useLandingExample()
  if (loaded.status !== 'ready') return <ExampleState loaded={loaded} />

  return (
    <>
      <BoxSection />
      <HowItWorksSection />
      <LiveDataSection />
    </>
  )
}
