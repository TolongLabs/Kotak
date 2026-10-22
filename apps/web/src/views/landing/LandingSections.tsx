import { MoveRight } from 'lucide-react'
import type { ChangeItem, RoadmapStep } from '../../demo/types'
import { CatDialogue } from '../../components/kotak/CatDialogue'
import { RoadmapStepCard } from '../../components/kotak/RoadmapStepCard'
import { VerdictChip } from '../../components/ui/VerdictChip'
import { WhatChangedCard } from '../../components/kotak/WhatChangedCard'
import { LandingSection, SectionHeading } from './LandingSection'

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

function BoxSection() {
  return (
    <LandingSection tone="default">
      <SectionHeading title="Every Skill Is in a Box." note="Sample verdicts for three jobs, from Q2 2026 data.">
        Kotak is Malay for box. Like Schrödinger’s cat, a skill is both rising and fading until someone checks the
        evidence. Kotak opens the box with dated public data.
      </SectionHeading>

      {/* After mkdir.directory: the worries set large, one ruled row each. */}
      <ul className="border-b border-border-subtle">
        {boxQuestions.map((q) => (
          <li
            key={q.role}
            className="grid grid-cols-1 gap-3 border-t border-border-subtle py-6 lg:grid-cols-12 lg:items-center lg:gap-6 lg:py-8"
          >
            <p className="text-label-m text-text-muted lg:col-span-2">{q.role}</p>
            <div className="flex min-w-0 flex-col gap-2 lg:col-span-7">
              <h3 className="text-balance text-title-l text-text-primary lg:text-display">{q.title}</h3>
              <p className="text-body-m text-text-muted">{q.body}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:col-span-3 lg:justify-end">
              <VerdictChip verdict={q.from} />
              <MoveRight className="h-[18px] w-[18px] stroke-current text-text-primary" aria-label="moves to" />
              <VerdictChip verdict={q.to} />
            </div>
          </li>
        ))}
      </ul>
    </LandingSection>
  )
}

// Each step is numbered in a small ink box, the way Kopi opens one box at a time.
function StepBox({ n }: { n: number }) {
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-text-primary bg-bg-default text-label-l text-text-primary">
      <span className="sr-only">Step </span>
      {n}
    </span>
  )
}

function HowItWorksSection() {
  return (
    <LandingSection id="how-it-works" tone="panel">
      <SectionHeading title="Three Minutes to Open Yours.">
        No CV and no sign-up. Kopi asks, fixed rules decide, and you leave with a plan you can start this week.
      </SectionHeading>

      {/* Ruled columns rather than cards; the three artifacts share a floor. */}
      <ol className="grid grid-cols-1 border-t border-border-subtle lg:grid-cols-3">
        <li className="flex min-w-0 flex-col gap-4 border-b border-border-subtle py-8 lg:border-b-0 lg:pr-8">
          <h3 className="flex items-center gap-3 text-title-m text-text-primary">
            <StepBox n={1} />
            Answer 12 Questions
          </h3>
          <p className="text-body-m text-text-muted">
            Kopi asks yes or no can-do questions about your job, out loud if you like.
          </p>
          <div className="mt-auto pt-6">
            <CatDialogue pose="asking" speech="Have you reviewed AI-written code before merging it?" size="md" />
          </div>
        </li>

        <li className="flex min-w-0 flex-col gap-4 border-b border-border-subtle py-8 lg:border-b-0 lg:border-l lg:px-8">
          <h3 className="flex items-center gap-3 text-title-m text-text-primary">
            <StepBox n={2} />
            See Where You Stand
          </h3>
          <p className="text-body-m text-text-muted">
            Your skills against what your job needs by 2027, sorted into a Skills SWOT.
          </p>
          <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
            <div className="on-accent on-you-fill flex flex-col gap-1 rounded-md border-[1.5px] border-text-primary bg-radar-you-fill p-3">
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
        </li>

        <li className="flex min-w-0 flex-col gap-4 border-border-subtle py-8 lg:border-l lg:pl-8">
          <h3 className="flex items-center gap-3 text-title-m text-text-primary">
            <StepBox n={3} />
            Follow Your 12 Weeks
          </h3>
          <p className="text-body-m text-text-muted">
            Free resources in order, sized to your hours, each tied to an SDG.
          </p>
          <div className="mt-auto pt-6">
            <RoadmapStepCard step={roadmapStepExample} index={0} last={true} />
          </div>
        </li>
      </ol>
    </LandingSection>
  )
}

function LiveDataSection() {
  return (
    <LandingSection tone="dark">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-6">
        <div className="flex flex-col gap-6 lg:col-span-6">
          <h2 className="text-balance font-extrabold text-display-l text-text-primary lg:text-display-xl">
            When the Data Moves, Your Plan Moves.
          </h2>
          <p className="max-w-[560px] text-body-m text-text-muted lg:text-body-l">
            Every quarter brings new DOSM job-ad counts and AI use data. Kotak reruns the rules, then shows what changed
            and why. You see the radar shift and the roadmap reorder.
          </p>
        </div>

        <div className="grid min-w-0 gap-4 lg:col-span-5 lg:col-start-8">
          {liveDataChanges.map((change) => (
            <WhatChangedCard key={change.skill} item={change} />
          ))}
        </div>
      </div>
    </LandingSection>
  )
}

export function LandingSections() {
  return (
    <>
      <BoxSection />
      <HowItWorksSection />
      <LiveDataSection />
    </>
  )
}
