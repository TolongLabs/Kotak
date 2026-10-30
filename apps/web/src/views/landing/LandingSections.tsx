import { MoveRight } from 'lucide-react'
import type { ChangeItem, RoadmapStep } from '../../demo/types'
import { CatDialogue } from '../../components/kotak/CatDialogue'
import { RoadmapStepCard } from '../../components/kotak/RoadmapStepCard'
import { VerdictChip } from '../../components/ui/VerdictChip'
import { WhatChangedCard } from '../../components/kotak/WhatChangedCard'
import { landingText } from '../../i18n/messages/landing'
import { useText } from '../../i18n/text'
import { LandingSection, SectionHeading } from './LandingSection'

const boxQuestionVerdicts = [
  {
    from: 'unknown' as const,
    to: 'declining' as const
  },
  {
    from: 'unknown' as const,
    to: 'split' as const
  },
  {
    from: 'unknown' as const,
    to: 'rising' as const
  }
]

function BoxSection() {
  const t = useText(landingText)

  return (
    <LandingSection tone="default">
      <SectionHeading title={t.boxSection.title} note={t.boxSection.note}>
        {t.boxSection.lede}
      </SectionHeading>

      {/* After mkdir.directory: the worries set large, one ruled row each. */}
      <ul className="border-b border-border-subtle">
        {t.boxSection.questions.map((q, index) => {
          const verdicts = boxQuestionVerdicts[index]!
          return (
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
                <VerdictChip verdict={verdicts.from} />
                <MoveRight
                  className="h-[18px] w-[18px] stroke-current text-text-primary"
                  aria-label={t.boxSection.movesTo}
                />
                <VerdictChip verdict={verdicts.to} />
              </div>
            </li>
          )
        })}
      </ul>
    </LandingSection>
  )
}

// Each step is numbered in a small ink box, the way Kopi opens one box at a time.
function StepBox({ n }: { n: number }) {
  const t = useText(landingText)

  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-text-primary bg-bg-default text-label-l text-text-primary">
      <span className="sr-only">{t.howItWorks.stepPrefix}</span>
      {n}
    </span>
  )
}

function HowItWorksSection() {
  const t = useText(landingText)

  const roadmapStepExample: RoadmapStep = {
    id: 'step-1',
    state: 'next',
    weeks: [1, 4],
    when: t.howItWorks.step3.stepExample.when,
    skill: t.howItWorks.step3.stepExample.skill,
    title: t.howItWorks.step3.stepExample.title,
    description: t.howItWorks.step3.stepExample.description,
    gain: t.howItWorks.step3.stepExample.gain,
    hoursPerWeek: 3,
    resource: {
      label: t.howItWorks.step3.stepExample.resourceLabel,
      href: 'https://skills.github.com'
    },
    sdgs: [8],
    sdgTargets: ['8.2']
  }

  return (
    <LandingSection id="how-it-works" tone="panel">
      <SectionHeading title={t.howItWorks.title}>{t.howItWorks.lede}</SectionHeading>

      {/* Ruled columns rather than cards; the three artifacts share a floor. */}
      <ol className="grid grid-cols-1 border-t border-border-subtle lg:grid-cols-3">
        <li className="flex min-w-0 flex-col gap-4 border-b border-border-subtle py-8 lg:border-b-0 lg:pr-8">
          <h3 className="flex items-center gap-3 text-title-m text-text-primary">
            <StepBox n={1} />
            {t.howItWorks.step1.title}
          </h3>
          <p className="text-body-m text-text-muted">{t.howItWorks.step1.body}</p>
          <div className="mt-auto pt-6">
            <CatDialogue pose="asking" speech={t.howItWorks.step1.dialogue} size="md" />
          </div>
        </li>

        <li className="flex min-w-0 flex-col gap-4 border-b border-border-subtle py-8 lg:border-b-0 lg:border-l lg:px-8">
          <h3 className="flex items-center gap-3 text-title-m text-text-primary">
            <StepBox n={2} />
            {t.howItWorks.step2.title}
          </h3>
          <p className="text-body-m text-text-muted">{t.howItWorks.step2.body}</p>
          <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
            <div className="on-accent on-you-fill flex flex-col gap-1 rounded-md border-[1.5px] border-text-primary bg-radar-you-fill p-3">
              <span className="text-label-m text-text-primary">{t.howItWorks.step2.strengths}</span>
              <span className="font-mono text-mono-s text-text-muted">{t.howItWorks.step2.skillsCount(2)}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-md border-[1.5px] border-text-primary bg-bg-default p-3">
              <span className="text-label-m text-text-primary">{t.howItWorks.step2.weaknesses}</span>
              <span className="font-mono text-mono-s text-text-muted">{t.howItWorks.step2.skillsCount(3)}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-md border border-border-subtle bg-bg-default p-3">
              <span className="text-label-m text-text-primary">{t.howItWorks.step2.opportunities}</span>
              <span className="font-mono text-mono-s text-text-muted">{t.howItWorks.step2.rolesCount(1)}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-md border-[1.5px] border-text-primary bg-bg-panel p-3">
              <span className="text-label-m text-text-primary">{t.howItWorks.step2.threats}</span>
              <span className="font-mono text-mono-s text-text-muted">{t.howItWorks.step2.skillsCount(1)}</span>
            </div>
          </div>
        </li>

        <li className="flex min-w-0 flex-col gap-4 border-border-subtle py-8 lg:border-l lg:pl-8">
          <h3 className="flex items-center gap-3 text-title-m text-text-primary">
            <StepBox n={3} />
            {t.howItWorks.step3.title}
          </h3>
          <p className="text-body-m text-text-muted">{t.howItWorks.step3.body}</p>
          <div className="mt-auto pt-6">
            <RoadmapStepCard step={roadmapStepExample} index={0} last={true} />
          </div>
        </li>
      </ol>
    </LandingSection>
  )
}

function LiveDataSection() {
  const t = useText(landingText)

  const liveDataChanges: ChangeItem[] = [
    {
      source: t.liveData.changes[0]!.source,
      skill: t.liveData.changes[0]!.skill,
      from: 'split',
      to: 'rising',
      why: t.liveData.changes[0]!.why,
      effect: t.liveData.changes[0]!.effect
    },
    {
      source: t.liveData.changes[1]!.source,
      skill: t.liveData.changes[1]!.skill,
      from: 'steady',
      to: 'rising',
      why: t.liveData.changes[1]!.why,
      effect: t.liveData.changes[1]!.effect
    }
  ]

  return (
    <LandingSection tone="dark">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-6">
        <div className="flex flex-col gap-6 lg:col-span-6">
          <h2 className="text-balance font-extrabold text-display-l text-text-primary lg:text-display-xl">
            {t.liveData.title}
          </h2>
          <p className="max-w-[560px] text-body-m text-text-muted lg:text-body-l">{t.liveData.lede}</p>
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
