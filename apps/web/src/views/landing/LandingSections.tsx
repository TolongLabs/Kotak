import { useState } from 'react'
import { ArrowRight, BookOpen, Clock3, Sparkles } from 'lucide-react'
import { corners, changes, landingExamples, roadmap, roles } from '../../demo/data'
import { questions } from '../../demo/questions'
import type { RoadmapStep } from '../../demo/types'
import { deriveSwot } from '../../demo/swot'
import { CatDialogue } from '../../components/kotak/CatDialogue'
import { SkillsSwot } from '../../components/kotak/SkillsSwot'
import { renderCited } from '../../components/kotak/renderCited'
import { SdgChip } from '../../components/ui/SdgChip'
import { TextLink } from '../../components/ui/TextLink'
import { VerdictChip } from '../../components/ui/VerdictChip'

const skillSwot = deriveSwot(corners, roles, 'slow')
const reviewQuestion = questions.find(
  (question) => question.cornerId === 'reviewing-ai-written-code' && question.level === 'working'
)
const firstRoadmapStep = roadmap[0]

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children: string }) {
  return (
    <header className="mx-auto flex max-w-4xl flex-col gap-4 text-center">
      <p className="font-mono text-mono-s text-text-muted">{eyebrow}</p>
      <h2 className="text-balance text-display text-text-primary lg:text-display-l">{title}</h2>
      <p className="text-body-m text-text-muted lg:text-body-l">{children}</p>
    </header>
  )
}

function BoxSection() {
  return (
    <section className="px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <SectionHeading eyebrow="Why the Name" title="Every Skill Is in a Box.">
          Kotak is Malay for box. Like Schrödinger’s cat, a skill is both rising and fading until someone checks the
          evidence. Kotak opens the box with dated public data.
        </SectionHeading>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
          {landingExamples.map((example) => (
            <article key={example.job} className="surface-card flex min-w-0 flex-col gap-4 p-5 lg:p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-mono-s text-text-muted">{example.job}</p>
                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-panel text-text-primary"
                  aria-hidden="true"
                >
                  <span className="text-label-m">□</span>
                </span>
              </div>
              <h3 className="text-title-s text-text-primary">{example.question}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <VerdictChip verdict="unknown" size="sm" />
                <ArrowRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
                <VerdictChip verdict={example.verdict} size="sm" />
              </div>
              <p className="text-body-s text-text-muted">{example.note}</p>
            </article>
          ))}
        </div>

        <p className="text-center font-mono text-mono-s text-text-muted">Sample verdicts for three jobs.</p>
      </div>
    </section>
  )
}

function StepOneDialogue() {
  const [muted, setMuted] = useState(true)

  return (
    <CatDialogue
      pose="asking"
      speech={reviewQuestion?.text ?? ''}
      muted={muted}
      onToggleVoice={() => setMuted((value) => !value)}
      size="md"
    />
  )
}

function MiniRoadmap({ step }: { step: RoadmapStep }) {
  const goal = step.sdgs[0]

  return (
    <div className="flex h-full flex-col gap-3 rounded-md border-[1.5px] border-text-primary bg-bg-default p-4">
      <p className="font-mono text-mono-s text-text-muted">{step.when}</p>
      <h4 className="text-title-s text-text-primary">{step.title}</h4>
      <p className="text-body-s text-text-muted">{step.description}</p>
      <p className="flex items-start gap-2 text-label-s text-text-primary">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{step.gain}</span>
      </p>
      <p className="flex items-center gap-2 font-mono text-mono-s text-text-muted">
        <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
        {step.hoursPerWeek} h a Week
      </p>
      <p className="flex items-start gap-2 text-body-s">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
        <TextLink href={step.resource.href} external>
          {step.resource.label}
        </TextLink>
      </p>
      {goal ? <SdgChip goal={goal} /> : null}
    </div>
  )
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-bg-panel px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <SectionHeading eyebrow="How It Works" title="Three Minutes to Open Yours.">
          No CV and no sign-up. Kopi asks, fixed rules decide, and you leave with a plan you can start this week.
        </SectionHeading>

        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3 lg:gap-6">
          <article className="surface-card flex min-w-0 flex-col gap-4 p-5 lg:p-6">
            <p className="font-mono text-mono-s text-text-muted">Step 1</p>
            <h3 className="text-title-s text-text-primary">Answer 12 Questions</h3>
            <p className="text-body-s text-text-muted">
              Kopi asks yes or no can-do questions about your job, out loud if you like.
            </p>
            <div className="mt-auto pt-2">
              <StepOneDialogue />
            </div>
          </article>

          <article className="surface-card flex min-w-0 flex-col gap-4 p-5 lg:p-6">
            <p className="font-mono text-mono-s text-text-muted">Step 2</p>
            <h3 className="text-title-s text-text-primary">See Where You Stand</h3>
            <p className="text-body-s text-text-muted">
              Your skills against what your job needs by 2027, sorted into a Skills SWOT.
            </p>
            <SkillsSwot swot={skillSwot} size="phone" />
          </article>

          <article className="surface-card flex min-w-0 flex-col gap-4 p-5 lg:p-6">
            <p className="font-mono text-mono-s text-text-muted">Step 3</p>
            <h3 className="text-title-s text-text-primary">Follow Your 12 Weeks</h3>
            <p className="text-body-s text-text-muted">
              Free resources in order, sized to your hours, each tied to an SDG.
            </p>
            {firstRoadmapStep ? <MiniRoadmap step={firstRoadmapStep} /> : null}
          </article>
        </div>
      </div>
    </section>
  )
}

function LiveDataSection() {
  return (
    <section className="bg-text-primary px-6 py-16 text-bg-default dark:bg-bg-default dark:text-text-primary lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-4">
          <p className="font-mono text-mono-s text-bg-default dark:text-text-muted">Live Data</p>
          <h2 className="text-balance text-display text-bg-default dark:text-text-primary lg:text-display-l">
            When the Data Moves, Your Plan Moves.
          </h2>
          <p className="text-body-m text-bg-default dark:text-text-muted lg:text-body-l">
            Every quarter brings new DOSM job-ad counts and AI use data. Kotak reruns the rules, then shows what changed
            and why. You see the radar shift and the roadmap reorder.
          </p>
        </div>

        <div className="grid min-w-0 gap-4">
          {changes.map((change) => (
            <article
              key={`${change.source}-${change.skill}`}
              className="flex min-w-0 flex-col gap-3 rounded-md border border-border-control bg-text-primary p-5 text-bg-default dark:bg-bg-panel dark:text-text-primary"
            >
              <p className="font-mono text-mono-s text-bg-default dark:text-text-muted">{change.source}</p>
              <h3 className="text-title-s text-bg-default dark:text-text-primary">{change.skill}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <VerdictChip verdict={change.from} size="sm" />
                <ArrowRight className="h-4 w-4 text-bg-default dark:text-text-muted" aria-hidden="true" />
                <VerdictChip verdict={change.to} size="sm" />
              </div>
              <p className="text-body-s text-bg-default dark:text-text-muted">{renderCited(change.why)}</p>
              <p className="text-label-m text-bg-default dark:text-text-primary">{change.effect}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
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
