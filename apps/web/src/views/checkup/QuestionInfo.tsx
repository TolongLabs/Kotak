import { Info } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../components/ui/cn'

interface QuestionInfoProps {
  cornerName: string
  /** Plain-English explainer for this statement level, when one was written. */
  explainer?: string
  tasks: string[]
}

/** The (i) beside a question: a popover from sm up, a bottom sheet below. Key it on the question so it closes on change. */
export function QuestionInfo({ cornerName, explainer, tasks }: QuestionInfoProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLSpanElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    dialog.current?.focus()
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <span ref={root} className="relative -my-1.5 inline-flex">
      <button
        ref={button}
        type="button"
        aria-label="About this question"
        aria-expanded={open}
        aria-controls={open ? 'question-info' : undefined}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-text-primary hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={dialog}
          id="question-info"
          tabIndex={-1}
          role="dialog"
          aria-label="About this question"
          className={cn(
            'z-50 max-h-[40svh] overflow-y-auto border-[1.5px] border-text-primary bg-bg-default p-4 text-left shadow-popover focus:outline-none sm:max-h-[70svh]',
            'fixed inset-x-0 bottom-0 rounded-t-md',
            'sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(24rem,80vw)] sm:rounded-md'
          )}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              button.current?.focus()
            }}
            className="float-right -mr-2 -mt-2 inline-flex h-10 items-center rounded-sm px-2 text-label-m font-semibold text-text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:hidden"
          >
            Close
          </button>
          <p className="font-mono text-mono-s text-text-muted">Skill area</p>
          <p className="text-label-l font-semibold text-text-primary">{cornerName}</p>
          {explainer && (
            <>
              <p className="mt-3 font-mono text-mono-s text-text-muted">This question is about</p>
              <p className="text-body-s text-text-primary">{explainer}</p>
            </>
          )}
          {tasks.length > 0 ? (
            <>
              <p className="mt-3 font-mono text-mono-s text-text-muted">Real job tasks in this area</p>
              <ul className="list-disc space-y-1 pl-4 text-body-s text-text-primary">
                {tasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </>
          ) : (
            !explainer && (
              <p className="mt-3 text-body-s text-text-primary">Kopi has no task list for this skill yet.</p>
            )
          )}
        </div>
      )}
    </span>
  )
}
