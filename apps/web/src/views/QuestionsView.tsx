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

// The question counter and topic row, shown once and hidden once per topic to hold the tallest topic's height.
const TOPIC_ROW = 'col-start-1 row-start-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1'

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

  const slot = (index: number) => {
    const corner = role.corners.find((item) => item.corner_id === order[Math.floor(index / 2)])!
    const level = index % 2 === 0 ? ('basic' as const) : ('advanced' as const)
    // A reversed slot shows the reversed wording once the corner has it; until then it reads and scores as normal.
    const reversedText = REVERSED_SLOTS.includes(index) ? corner.reversed_statements?.[level] : undefined
    return { corner, level, reversedText, statement: reversedText ?? corner.statements![level] }
  }
  const questionIndex = asked.length
  const { corner, level, reversedText, statement } = slot(questionIndex)
  // Kopi's speech box keeps room for the longest of this session's lines, so the answers never move (#350).
  const statements = Array.from({ length: totalQuestions }, (_, index) => slot(index).statement)

  const onAnswer = (rating: Rating) => {
    if (chosen !== null) return
    const advance = () => {
      const next = [...asked, reversedText ? reversedRating(rating) : rating]
      if (next.length === totalQuestions) updateGuestSession({ answers: toSessionAnswers(role, order, next) })
      setAsked(next)
    }
    // The pink and tick show for the pause with or without motion (#351); only the movement follows reduced motion.
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

      {/* Every topic's row sits hidden in one grid cell with the shown row, so a long topic that wraps on a phone can't
          move the answers (#350). The hidden rows keep the counter's and the info button's footprints. */}
      <div className="grid">
        {role.corners.map(({ corner_id, name }) => (
          <div key={corner_id} aria-hidden="true" className={cn(TOPIC_ROW, 'invisible')}>
            {/* The widest counter's footprint without its text (mono glyphs are 1ch each), so only the shown row reads. */}
            <span
              className="inline-block h-4 font-mono text-mono-s"
              style={{ width: `${`Question ${totalQuestions} of ${totalQuestions}`.length}ch` }}
            />
            <span className="inline-flex items-center gap-2 font-mono text-mono-s">
              {name}
              <span className="-my-1.5 inline-flex h-7 w-7" />
            </span>
          </div>
        ))}
        {/* The counter, and the corner when it changes, rise in with each new question (CSS .question-enter). */}
        <div className={cn(TOPIC_ROW, 'self-start')} aria-live="polite">
          <span
            key={questionIndex}
            className={cn('font-mono text-mono-s text-text-muted', !reduced && 'question-enter')}
          >
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <span className="inline-flex items-center gap-2 font-mono text-mono-s text-text-primary">
            {/* Only the name rises in: a transform around the (i) would pin its fixed popover to this span meanwhile. */}
            <span key={corner.corner_id} className={cn(!reduced && 'question-enter')}>
              {corner.name}
            </span>
            <QuestionInfo
              key={questionIndex}
              cornerName={corner.name}
              explainer={corner.explainers?.[level]}
              tasks={corner.task_ids.flatMap((id) => role.tasks.find((task) => task.task_id === id)?.statement ?? [])}
            />
          </span>
        </div>
      </div>

      <section className="space-y-2 sm:space-y-3" aria-label="Question Card">
        <KopiAside
          pose={chosen !== null ? 'happy' : 'asking'}
          speech={statement}
          reserve={statements}
          react={chosen !== null}
          centred
        />

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
                chosen === value && '!bg-accent-chosen',
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

// Phones get tighter gaps here and in the question card, so the tallest sessions (long titles and lines, held at full
// size by #350) still fit one screen at 390x844 (#230).
function QuestionsFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[45rem] flex-col gap-4 sm:gap-5 lg:gap-6">
      <h1 className="sr-only">Check-Up Questions</h1>
      <Stepper step={2} labels={checkUpSteps} />
      {children}
    </div>
  )
}
