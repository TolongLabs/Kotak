import { BookOpen, Clock3, Sparkles } from 'lucide-react'
import { CatDialogue } from '../../components/kotak/CatDialogue'
import { SdgChip } from '../../components/ui/SdgChip'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { TextLink } from '../../components/ui/TextLink'
import { VerdictChip } from '../../components/ui/VerdictChip'
import { routes } from '../../app/routes'
import { neededByLabel } from '../../engine/viewModel'
import { LandingActionLink } from './LandingActionLink'
import { getLandingExampleQuestions, useLandingExample, type LandingExample } from './landingExample'

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children: string }) {
  return (
    <header className="mx-auto flex max-w-4xl flex-col gap-4 text-center">
      <p className="font-mono text-mono-s text-text-muted">{eyebrow}</p>
      <h2 className="text-balance text-display text-text-primary lg:text-display-l">{title}</h2>
      <p className="text-body-m text-text-muted lg:text-body-l">{children}</p>
    </header>
  )
}

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

function BoxSection({ example }: { example: LandingExample }) {
  const questions = getLandingExampleQuestions(example).slice(0, 3)

  return (
    <section className="px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <SectionHeading eyebrow="Why the Name" title="Every Skill Is in a Box.">
          Kotak is Malay for box. Like Schrödinger’s cat, a skill is both rising and fading until someone checks the
          evidence. Kotak opens the box with dated public data.
        </SectionHeading>

        {questions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
            {questions.map((question) => {
              const corner = example.corners.find((item) => item.id === question.cornerId)
              if (!corner) return null

              return (
                <article key={question.cornerId} className="surface-card flex min-w-0 flex-col gap-4 p-5 lg:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono text-mono-s text-text-muted">
                      {example.role.title} · {question.name}
                    </p>
                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-panel text-text-primary"
                      aria-hidden="true"
                    >
                      <span className="text-label-m">□</span>
                    </span>
                  </div>
                  <h3 className="text-title-s text-text-primary">“{question.statement}”</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-label-s text-text-muted">
                      Example Answer: {question.workingAnswer ? 'Yes' : 'Not Yet'}
                    </p>
                    <VerdictChip verdict={corner.verdict} size="sm" />
                    <CitationMarks numbers={example.numbers.get(corner.id) ?? []} />
                  </div>
                  {corner.reasoning ? <p className="text-body-s text-text-muted">{corner.reasoning}</p> : null}
                </article>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-body-s text-text-muted">Questions are not available for this example yet.</p>
        )}

        <p className="text-center font-mono text-mono-s text-text-muted">
          These questions and verdicts use one fixed Web Developers example.
        </p>
      </div>
    </section>
  )
}

function StepOneDialogue({ example }: { example: LandingExample }) {
  const firstQuestion = getLandingExampleQuestions(example)[0]

  if (!firstQuestion) {
    return <p className="text-body-s text-text-muted">Kopi has no question statement for this example yet.</p>
  }

  return <CatDialogue pose="asking" speech={`Example question: “${firstQuestion.statement}”`} size="md" />
}

function ExampleSkillSummary({ example }: { example: LandingExample }) {
  return (
    <section className="surface-card space-y-3 p-3" aria-label="Example skill levels">
      <p className="text-body-s text-text-muted">The fixed example answers, compared with estimated need.</p>
      <ul className="space-y-3">
        {example.checkup.corners.map((checkupCorner) => {
          const corner = example.corners.find((item) => item.id === checkupCorner.corner_id)
          if (!corner) return null

          return (
            <li key={corner.id} className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-label-m text-text-primary">{corner.name}</p>
                <VerdictChip verdict={corner.verdict} size="sm" />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-mono text-mono-s text-text-muted">
                  You {corner.you} · Needed about {corner.neededSlow}
                </span>
                <CitationMarks numbers={example.numbers.get(corner.id) ?? []} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

function MiniRoadmap({ example }: { example: LandingExample }) {
  const { checkup, role, numbers } = example
  const step = checkup.roadmap.items[0]

  if (!checkup.questionsReady) {
    return <p className="text-body-s text-text-muted">Plan estimates are unavailable until questions are ready.</p>
  }

  if (!step) {
    return <p className="text-body-s text-text-muted">Kopi has no next step estimate for this example yet.</p>
  }

  const skill = role.corners.find((corner) => corner.corner_id === step.corner_id)
  const statement = skill?.statements?.[step.statement]
  const resource = skill?.resources.find((item) => item.verified)
  const sdgGoals = [
    ...new Set(
      (skill?.sdg_targets ?? [])
        .map((target) => Number.parseInt(target.split('.')[0] ?? '', 10))
        .filter((goal) => Number.isInteger(goal))
    )
  ]

  return (
    <div className="flex h-full flex-col gap-3 rounded-md border-[1.5px] border-text-primary bg-bg-default p-4">
      <p className="font-mono text-mono-s text-text-muted">Plan Step {step.rank} · Estimate</p>
      <h4 className="text-title-s text-text-primary">{skill?.name ?? step.corner_id}</h4>
      {statement ? <p className="text-body-s text-text-muted">{statement}</p> : null}
      <p className="flex items-start gap-2 text-label-s text-text-primary">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Aim for about level {step.to_level}.</span>
        <CitationMarks numbers={numbers.get(step.corner_id) ?? []} />
      </p>
      {step.hours > 0 ? (
        <p className="flex items-center gap-2 font-mono text-mono-s text-text-muted">
          <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
          About {step.hours} hours
        </p>
      ) : null}
      {checkup.roadmap.weeks > 0 ? (
        <p className="font-mono text-mono-s text-text-muted">About {checkup.roadmap.weeks} weeks for this plan</p>
      ) : null}
      {checkup.roadmap.finish_date ? (
        <p className="font-mono text-mono-s text-text-muted">
          Estimated finish: about {formatDate(checkup.roadmap.finish_date)}
        </p>
      ) : null}
      {resource ? (
        <p className="flex items-start gap-2 text-body-s">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          <TextLink href={resource.url} external>
            {resource.title}
          </TextLink>
        </p>
      ) : null}
      {sdgGoals.map((goal) => (
        <SdgChip key={goal} goal={goal} />
      ))}
    </div>
  )
}

function HowItWorksSection({ example }: { example: LandingExample }) {
  const questionCount = example.checkup.questionsReady ? example.checkup.questionOrder.length * 2 : null
  const needDate = neededByLabel(example.checkup).replace('Needed by ', 'about ')

  return (
    <section id="how-it-works" className="bg-bg-panel px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <SectionHeading eyebrow="How It Works" title="A Check-Up That Ends With a Plan.">
          {`No CV and no sign-up. Kopi asks, fixed rules decide, and you leave with a plan you can start this week. This example estimates skill needs through ${needDate}.`}
        </SectionHeading>

        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3 lg:gap-6">
          <article className="surface-card flex min-w-0 flex-col gap-4 p-5 lg:p-6">
            <p className="font-mono text-mono-s text-text-muted">Step 1</p>
            <h3 className="text-title-s text-text-primary">
              {questionCount ? `Answer ${questionCount} Questions` : 'Read Example Questions'}
            </h3>
            <p className="text-body-s text-text-muted">
              Kopi asks yes or no can-do questions about your job, out loud if you like.
            </p>
            <div className="mt-auto pt-2">
              <StepOneDialogue example={example} />
            </div>
          </article>

          <article className="surface-card flex min-w-0 flex-col gap-4 p-5 lg:p-6">
            <p className="font-mono text-mono-s text-text-muted">Step 2</p>
            <h3 className="text-title-s text-text-primary">See Where You Stand</h3>
            <ExampleSkillSummary example={example} />
          </article>

          <article className="surface-card flex min-w-0 flex-col gap-4 p-5 lg:p-6">
            <p className="font-mono text-mono-s text-text-muted">Step 3</p>
            <h3 className="text-title-s text-text-primary">Follow Your Plan</h3>
            <p className="text-body-s text-text-muted">
              See estimated steps, time and learning targets based on the example answers.
            </p>
            <MiniRoadmap example={example} />
          </article>
        </div>
      </div>
    </section>
  )
}

function LiveDataSection({ example }: { example: LandingExample }) {
  return (
    <section className="bg-text-primary px-6 py-16 text-bg-default dark:bg-bg-default dark:text-text-primary lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-4">
          <p className="font-mono text-mono-s text-bg-default dark:text-text-muted">Example Snapshot</p>
          <h2 className="text-balance text-display text-bg-default dark:text-text-primary lg:text-display-l">
            When the Data Moves, Your Plan Moves.
          </h2>
          <p className="text-body-m text-bg-default dark:text-text-muted lg:text-body-l">
            Kotak applies fixed rules to dated role data. This {example.checkup.scenario} scenario uses the{' '}
            {example.checkup.snapshotId} snapshot for {example.role.title}; the verdicts and roadmap come from the same
            check-up.
          </p>
        </div>

        <div className="grid min-w-0 gap-4">
          {example.corners.slice(0, 3).map((corner) => (
            <article
              key={corner.id}
              className="flex min-w-0 flex-col gap-3 rounded-md border border-border-control bg-text-primary p-5 text-bg-default dark:bg-bg-panel dark:text-text-primary"
            >
              <p className="font-mono text-mono-s text-bg-default dark:text-text-muted">{example.role.title}</p>
              <h3 className="text-title-s text-bg-default dark:text-text-primary">{corner.name}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <VerdictChip verdict={corner.verdict} size="sm" />
                <CitationMarks numbers={example.numbers.get(corner.id) ?? []} />
              </div>
              {corner.reasoning ? (
                <p className="text-body-s text-bg-default dark:text-text-muted">{corner.reasoning}</p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ExampleState({ loaded }: { loaded: Exclude<ReturnType<typeof useLandingExample>, { status: 'ready' }> }) {
  return (
    <section className="px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6">
        {loaded.status === 'idle' ? (
          <>
            <CatDialogue pose="idle" speech="Choose a job before opening a check-up." />
            <LandingActionLink to={routes.checkUp} variant="primary">
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
      <BoxSection example={loaded.data} />
      <HowItWorksSection example={loaded.data} />
      <LiveDataSection example={loaded.data} />
    </>
  )
}
