import { Info } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

interface QuestionInfoProps {
  cornerName: string
  /** Plain-English explainer for this statement level, when one was written. */
  explainer?: string
  tasks: string[]
}

const GAP = 8
const EDGE = 12
/** With less room than this above the (i), opening scrolls the page back first so the popover is readable. */
const MIN_ROOM = 160

/** Opens above the (i), right-aligned to it and as tall as the room there. The answers always sit below the (i), so
 * the popover never covers them (#323). */
function placeAbove(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect()
  const viewportWidth = document.documentElement.clientWidth
  const width = Math.min(384, viewportWidth - 2 * EDGE)
  // `-translate-y-full` lifts the popover by its own height, so `top` is where its bottom edge sits.
  return {
    top: rect.top - GAP,
    left: Math.max(EDGE, Math.min(rect.right - width, viewportWidth - width - EDGE)),
    width,
    maxHeight: Math.max(0, rect.top - GAP - EDGE)
  }
}

/** The (i) beside a question and its popover. Key it on the question so it closes on change. */
export function QuestionInfo({ cornerName, explainer, tasks }: QuestionInfoProps) {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<CSSProperties>()
  const root = useRef<HTMLSpanElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)

  // Placed before it renders, so it is never focused or painted out of place.
  const toggle = () => {
    if (!open) {
      const room = button.current!.getBoundingClientRect().top - GAP - EDGE
      if (room < MIN_ROOM) window.scrollBy(0, room - MIN_ROOM)
      setPlacement(placeAbove(button.current!))
    }
    setOpen(!open)
  }

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
    // Stays on the (i) when the page scrolls or resizes.
    const place = () => setPlacement(placeAbove(button.current!))
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', place, { passive: true })
    window.addEventListener('resize', place)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', place)
      window.removeEventListener('resize', place)
    }
  }, [open])

  return (
    <span ref={root} className="-my-1.5 inline-flex">
      <button
        ref={button}
        type="button"
        aria-label="About this question"
        aria-expanded={open}
        aria-controls={open ? 'question-info' : undefined}
        onClick={toggle}
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
          style={placement}
          className="fixed z-50 -translate-y-full overflow-y-auto overscroll-contain rounded-md border-[1.5px] border-text-primary bg-bg-default p-4 text-left shadow-popover focus:outline-none"
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
