import { DEFAULT_SCENARIO, followUpStatement, type BundleRole } from '@kotak/shared'
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { PageTransition } from '../components/kotak/PageTransition'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { Stepper } from '../components/ui/Stepper'
import { useRoleBundle } from '../engine/bundle'
import { assessedRoleCode, useCheckup } from '../engine/checkup'
import { updateGuestSession, useGuestSession } from '../session/store'
import { KopiAside, KopiStage } from './checkup/KopiDialogue'

const stepLabels: [string, string, string, string, string] = ['Start', 'Questions', 'Radar', 'Roles', 'Plan']

// Answers arrive in asking order (rising corners first); the session stores them by the corner's place in the
// role's batch order: [2i] is corner i's working answer, [2i + 1] its follow-up (see engine/checkup.ts).
function toSessionAnswers(role: BundleRole, order: string[], asked: boolean[]) {
  const answers = Array<boolean | null>(12).fill(null)
  role.corners.forEach((corner, i) => {
    const k = order.indexOf(corner.corner_id)
    answers[2 * i] = asked[2 * k] ?? null
    answers[2 * i + 1] = asked[2 * k + 1] ?? null
  })
  return answers
}

export function QuestionsView() {
  const session = useGuestSession()
  const assessedCode = assessedRoleCode(session)
  const bundle = useRoleBundle(assessedCode)
  const loaded = useCheckup({ onetCode: assessedCode, scenario: DEFAULT_SCENARIO })
  const [asked, setAsked] = useState<boolean[]>([])
  const [thinking, setThinking] = useState(false)
  const thinkingTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (thinkingTimer.current !== null) window.clearTimeout(thinkingTimer.current)
    },
    []
  )

  if (!assessedCode) {
    return (
      <QuestionsFrame>
        <KopiAside pose="worried" speech="Tell me your job first, then I can ask about it." />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Choose Your Job
        </Button>
      </QuestionsFrame>
    )
  }

  if (loaded.status !== 'ready' || bundle.status !== 'ready') {
    return (
      <QuestionsFrame>
        {loaded.status === 'error' || bundle.status === 'error' ? (
          <Banner type="error" title="Kopi Could Not Open This Job" body="Reload the page, or choose your job again." />
        ) : (
          <KopiAside pose="thinking" speech="Opening the box on your job…" />
        )}
      </QuestionsFrame>
    )
  }

  const { checkup } = loaded.data
  const { role } = bundle.data
  const order = checkup.questionOrder.map((corner) => corner.corner_id)
  const totalQuestions = order.length * 2

  if (!checkup.questionsReady) {
    return (
      <QuestionsFrame>
        <Banner
          type="info"
          title="Questions Not Written Yet"
          body="Kopi has no questions for this job yet. Choose a related job for now."
        />
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Choose Another Job
        </Button>
      </QuestionsFrame>
    )
  }

  // After the last answer the box opens, then the results load.
  if (asked.length >= totalQuestions) return <PageTransition onDone={() => navigate(routes.radar)} />

  const questionIndex = asked.length
  const cornerId = order[Math.floor(questionIndex / 2)]!
  const corner = role.corners.find((item) => item.corner_id === cornerId)!
  const level = questionIndex % 2 === 0 ? 'working' : followUpStatement(asked[questionIndex - 1]!)
  const statement = corner.statements![level]

  const saveAnswer = (answer: boolean) => {
    const next = [...asked, answer]
    if (next.length === totalQuestions) updateGuestSession({ answers: toSessionAnswers(role, order, next) })
    setAsked(next)
  }

  const answerQuestion = (answer: boolean) => {
    if (thinking) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      saveAnswer(answer)
      return
    }

    setThinking(true)
    thinkingTimer.current = window.setTimeout(() => {
      thinkingTimer.current = null
      setThinking(false)
      saveAnswer(answer)
    }, 300)
  }

  const handleQuestionKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (thinking || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return

    const key = event.key.toLocaleLowerCase()
    if (key === 'y') {
      event.preventDefault()
      answerQuestion(true)
    } else if (key === 'n') {
      event.preventDefault()
      answerQuestion(false)
    }
  }

  return (
    <QuestionsFrame>
      <h2 className="text-title-s text-text-primary">Testing You Against {role.title}</h2>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1" aria-live="polite">
        <span className="font-mono text-mono-s text-text-muted">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        <span className="font-mono text-mono-s text-text-primary">{corner.name}</span>
      </div>

      <section className="space-y-4 pb-2 pt-2 lg:pt-6" aria-label="Question Card" onKeyDown={handleQuestionKeyDown}>
        <KopiStage pose={thinking ? 'thinking' : 'asking'} speech={statement} />

        <p className="text-center text-body-s text-text-muted">
          Answer for real work, not tutorials. Not sure? Choose Not Yet.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" fullWidth disabled={thinking} onClick={() => answerQuestion(true)}>
            Yes
          </Button>
          <Button variant="secondary" size="lg" fullWidth disabled={thinking} onClick={() => answerQuestion(false)}>
            Not Yet
          </Button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <button
          type="button"
          disabled={asked.length === 0 || thinking}
          onClick={() => setAsked((current) => current.slice(0, -1))}
          className="inline-flex h-12 items-center justify-center rounded-sm px-2 text-label-l font-semibold text-text-primary underline underline-offset-4 transition-colors duration-150 ease-out hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:text-text-muted disabled:no-underline"
        >
          Previous Question
        </button>
        <span className="hidden font-mono text-mono-s text-text-muted lg:block">Press Y or N</span>
      </div>
    </QuestionsFrame>
  )
}

function QuestionsFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[45rem] flex-col gap-5 lg:gap-6">
      <h1 className="sr-only">Check-Up Questions</h1>
      <Stepper step={2} labels={stepLabels} />
      {children}
    </div>
  )
}
