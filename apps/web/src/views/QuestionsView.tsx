import {
  DEFAULT_SCENARIO,
  questionOrder,
  REVERSED_SLOTS,
  reversedRating,
  roleVerdicts,
  type BundleRole,
  type Rating
} from '@kotak/shared'
import { Check } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { PageTransition } from '../components/kotak/PageTransition'
import { useReducedMotion } from '../components/kopi/motion'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { checkUpSteps, Stepper } from '../components/ui/Stepper'
import { cn } from '../components/ui/cn'
import { checkupBundleKey, loadCheckupBundleFor, useRoleBundle } from '../engine/bundle'
import { assessedRoleCode } from '../engine/checkup'
import { updateGuestSession, useGuestSession } from '../session/store'
import { KopiAside } from './checkup/KopiDialogue'
import { QuestionInfo } from './checkup/QuestionInfo'
import { startAgain } from './checkup/startAgain'
import { AnswerKeys } from './checkup/useAnswerKeys'

// Answers arrive in asking order (rising corners first); the session stores them by the corner's place in the
// role's batch order: [2i] is corner i's basic rating, [2i + 1] its advanced rating (see engine/checkup.ts).
function toSessionAnswers(role: BundleRole, order: string[], asked: Rating[]) {
  const answers = Array<Rating | null>(12).fill(null)
  role.corners.forEach((corner, i) => {
    const k = order.indexOf(corner.corner_id)
    answers[2 * i] = asked[2 * k] ?? null
    answers[2 * i + 1] = asked[2 * k + 1] ?? null
  })
  return answers
}

const RATINGS: { value: Rating; caption: string }[] = [
  { value: 1, caption: 'Not yet' },
  { value: 2, caption: 'A little' },
  { value: 3, caption: 'Mostly' },
  { value: 4, caption: 'Yes, on my own' }
]

export function QuestionsView() {
  const session = useGuestSession()
  const assessedCode = assessedRoleCode(session)
  const bundle = useRoleBundle(assessedCode)
  // The effective ratings so far: a reversed question's click is already flipped (see onAnswer).
  const [asked, setAsked] = useState<Rating[]>([])
  // The rating just clicked, held for the 300 ms pause before the next question; null otherwise.
  const [chosen, setChosen] = useState<Rating | null>(null)
  const thinkingTimer = useRef<number | null>(null)
  const { reduced } = useReducedMotion()

  useEffect(
    () => () => {
      if (thinkingTimer.current !== null) window.clearTimeout(thinkingTimer.current)
    },
    []
  )

  if (!assessedCode) {
    return (
      <QuestionsFrame>
        <KopiAside pose="worried" speech={`${startAgain(session).speech}, then I can ask about it.`} />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(startAgain(session).route)}>
          {startAgain(session).label}
        </Button>
      </QuestionsFrame>
    )
  }

  if (bundle.status !== 'ready') {
    return (
      <QuestionsFrame>
        {bundle.status === 'error' ? (
          <Banner type="error" title="Kopi Could Not Open This Job" body="Reload the page, or choose your job again." />
        ) : (
          <KopiAside pose="thinking" speech="Opening the box on your job…" />
        )}
      </QuestionsFrame>
    )
  }

  const { role } = bundle.data
  // Rising corners first, as the check-up asks them (computeCheckup's questionOrder).
  const order = questionOrder(roleVerdicts(role.signals[session.active_snapshot_id]).corners, DEFAULT_SCENARIO)
  const totalQuestions = order.length * 2

  if (!role.questions_ready) {
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
  if (asked.length >= totalQuestions) {
    // The box opens while the roles the results rank against load.
    const key = checkupBundleKey(session)
    return (
      <PageTransition
        load={() => (key ? loadCheckupBundleFor(key) : Promise.resolve(null))}
        onDone={() => navigate(routes.radar)}
      />
    )
  }

  const questionIndex = asked.length
  const cornerId = order[Math.floor(questionIndex / 2)]!
  const corner = role.corners.find((item) => item.corner_id === cornerId)!
  const level = questionIndex % 2 === 0 ? 'basic' : 'advanced'
  // A reversed slot shows the reversed wording once the corner has it; until then it reads and scores as normal.
  const reversedText = REVERSED_SLOTS.includes(questionIndex) ? corner.reversed_statements?.[level] : undefined
  const statement = reversedText ?? corner.statements![level]

  const onAnswer = (rating: Rating) => {
    if (chosen !== null) return
    const advance = () => {
      const next = [...asked, reversedText ? reversedRating(rating) : rating]
      if (next.length === totalQuestions) updateGuestSession({ answers: toSessionAnswers(role, order, next) })
      setAsked(next)
    }
    // Reduced motion: no pause, answer at once.
    if (reduced) return advance()
    setChosen(rating)
    thinkingTimer.current = window.setTimeout(() => {
      thinkingTimer.current = null
      setChosen(null)
      advance()
    }, 300)
  }

  return (
    <QuestionsFrame>
      <AnswerKeys onAnswer={onAnswer} />
      <h2 className="text-title-s text-text-primary">Testing You Against {role.title}</h2>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1" aria-live="polite">
        <span className="font-mono text-mono-s text-text-muted">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-mono-s text-text-primary">
          {corner.name}
          <QuestionInfo
            key={questionIndex}
            cornerName={corner.name}
            explainer={corner.explainers?.[level]}
            tasks={corner.task_ids.flatMap((id) => role.tasks.find((task) => task.task_id === id)?.statement ?? [])}
          />
        </span>
      </div>

      <section className="space-y-3" aria-label="Question Card">
        <KopiAside pose={chosen !== null ? 'happy' : 'asking'} speech={statement} hop={chosen !== null} centred />

        <p className="text-center text-body-s text-text-muted">
          Answer for real work, not tutorials. Not sure? Choose 1 or 2.
        </p>

        <div className="grid grid-cols-4 gap-3">
          {RATINGS.map(({ value, caption }) => (
            <Button
              key={value}
              variant={chosen === value ? 'primary' : 'secondary'}
              size="lg"
              fullWidth
              className={cn(
                'h-auto min-h-[56px] px-1 py-2 !transition-[scale,background-color,color] !duration-[120ms]',
                chosen === value && !reduced && 'scale-[0.96]'
              )}
              aria-label={`${value} ${caption}`}
              aria-pressed={chosen === value}
              onClick={() => onAnswer(value)}
            >
              <span className="flex flex-col items-center gap-1">
                <span className="flex items-center gap-1">
                  {value}
                  {chosen === value && <Check className="h-4 w-4" aria-hidden="true" />}
                </span>
                <span className="hidden text-label-s font-normal sm:block">{caption}</span>
              </span>
            </Button>
          ))}
        </div>
        <div className="flex justify-between text-body-s text-text-muted sm:hidden">
          <span>Not yet</span>
          <span>Yes, on my own</span>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <button
          type="button"
          disabled={asked.length === 0 || chosen !== null}
          onClick={() => setAsked((current) => current.slice(0, -1))}
          className="inline-flex h-12 items-center justify-center rounded-sm px-2 text-label-l font-semibold text-text-primary underline underline-offset-4 transition-colors duration-150 ease-out hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:text-text-muted disabled:no-underline"
        >
          Previous Question
        </button>
        <span className="hidden font-mono text-mono-s text-text-muted lg:block">Press 1 to 4</span>
      </div>
    </QuestionsFrame>
  )
}

function QuestionsFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[45rem] flex-col gap-5 lg:gap-6">
      <h1 className="sr-only">Check-Up Questions</h1>
      <Stepper step={2} labels={checkUpSteps} />
      {children}
    </div>
  )
}
