import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { PageTransition } from '../components/kotak/PageTransition'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { Stepper } from '../components/ui/Stepper'
import { corners } from '../demo/data'
import { questions } from '../demo/questions'
import type { Question } from '../demo/types'

const stepLabels: [string, string, string, string, string] = ['Start', 'Questions', 'Radar', 'Roles', 'Plan']
const totalQuestions = corners.length * 2

export function QuestionsView() {
  const [answers, setAnswers] = useState<boolean[]>([])
  const [muted, setMuted] = useState(true)
  const [thinking, setThinking] = useState(false)
  const thinkingTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (thinkingTimer.current !== null) window.clearTimeout(thinkingTimer.current)
    },
    []
  )

  // After the 12th answer the box opens, then the results load.
  if (answers.length >= totalQuestions) return <PageTransition onDone={() => navigate(routes.radar)} />

  const questionIndex = answers.length
  const questionNumber = questionIndex + 1
  const corner = corners[Math.floor(questionIndex / 2)]!
  const isWorkingQuestion = questionIndex % 2 === 0
  const followUpLevel: Question['level'] = answers[questionIndex - 1] ? 'advanced' : 'basic'
  const questionLevel = isWorkingQuestion ? 'working' : followUpLevel
  const question = questions.find((item) => item.cornerId === corner.id && item.level === questionLevel)!

  const saveAnswer = (answer: boolean) => {
    setAnswers((current) => [...current, answer])
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
    <div className="mx-auto w-full max-w-[45rem] space-y-6">
      <h1 className="sr-only">Check-Up Questions</h1>
      <Stepper step={2} labels={stepLabels} />
      <Banner type="sample" />

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1" aria-live="polite">
        <span className="font-mono text-mono-s text-text-muted">
          Question {questionNumber} of {totalQuestions}
        </span>
        <span className="font-mono text-mono-s text-text-primary">{corner.name}</span>
      </div>

      <section className="space-y-4" aria-label="Question Card" onKeyDown={handleQuestionKeyDown}>
        <CatDialogue
          pose={thinking ? 'thinking' : 'asking'}
          speech={question.text}
          muted={muted}
          onToggleVoice={() => setMuted((value) => !value)}
          size="lg"
        />

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
        <Button
          variant="ghost"
          size="lg"
          disabled={answers.length === 0 || thinking}
          onClick={() => setAnswers((current) => current.slice(0, -1))}
        >
          Previous Question
        </Button>
        <span className="hidden font-mono text-mono-s text-text-muted lg:block">Press Y or N</span>
      </div>
    </div>
  )
}
