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
const MAX_WIDTH = 384
/** Narrowest side column worth reading; with less room on both sides the popover opens above the (i). */
const MIN_SIDE = 240
/** With less room than this above the (i), opening scrolls the page back first so the popover is readable. */
const MIN_ROOM = 160

/** The screen box the popover sits in, and the flex of the spacer above the popover inside it. */
interface Frame {
  box: CSSProperties
  spacer: string
  above: boolean
}

/** Keeps the popover off the question column, so it never covers the question or its answers (#323). Beside the
 * column when a side is wide enough: both sides get the full screen height, so the one next to the (i) goes first,
 * and the popover stays level with the (i) until long text needs the room above. Otherwise above the (i), as tall as
 * the room there: the answers always sit below the (i). */
function frameFor(trigger: HTMLElement): Frame {
  const i = trigger.getBoundingClientRect()
  // The (i) sits in the question's header row, which spans the question column.
  const column = trigger.closest('div')!.getBoundingClientRect()
  const viewportWidth = document.documentElement.clientWidth
  const right = viewportWidth - EDGE - column.right - GAP
  const left = column.left - GAP - EDGE
  if (right >= MIN_SIDE || left >= MIN_SIDE) {
    const width = Math.min(MAX_WIDTH, right >= MIN_SIDE ? right : left)
    return {
      box: { top: EDGE, bottom: EDGE, width, left: right >= MIN_SIDE ? column.right + GAP : column.left - GAP - width },
      spacer: `0 1 ${Math.max(0, i.top - EDGE)}px`,
      above: false
    }
  }
  const width = Math.min(MAX_WIDTH, viewportWidth - 2 * EDGE)
  return {
    box: {
      top: EDGE,
      height: Math.max(0, i.top - GAP - EDGE),
      width,
      left: Math.max(EDGE, Math.min(i.right - width, viewportWidth - width - EDGE))
    },
    spacer: '1',
    above: true
  }
}

/** The (i) beside a question and its popover. Key it on the question so it closes on change. */
export function QuestionInfo({ cornerName, explainer, tasks }: QuestionInfoProps) {
  const [open, setOpen] = useState(false)
  const [frame, setFrame] = useState<Frame>()
  const root = useRef<HTMLSpanElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)

  // Placed before it renders, so it is never focused or painted out of place.
  const toggle = () => {
    if (!open) {
      let next = frameFor(button.current!)
      const room = button.current!.getBoundingClientRect().top - GAP - EDGE
      if (next.above && room < MIN_ROOM) {
        window.scrollBy(0, room - MIN_ROOM)
        next = frameFor(button.current!)
      }
      setFrame(next)
    }
    setOpen(!open)
  }

  useEffect(() => {
    if (!open) return
    // It is always placed on screen, so focusing it must not scroll the page.
    dialog.current?.focus({ preventScroll: true })
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    // Stays on the (i) when the page scrolls or resizes.
    const place = () => setFrame(frameFor(button.current!))
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
      {open && frame && (
        // The box passes clicks through; the spacer shrinks first, so the popover moves up only when it needs to.
        <div style={frame.box} className="pointer-events-none fixed z-50 flex flex-col">
          <div style={{ flex: frame.spacer }} />
          <div
            ref={dialog}
            id="question-info"
            tabIndex={-1}
            role="dialog"
            aria-label="About this question"
            className="pointer-events-auto max-h-full shrink-0 overflow-y-auto overscroll-contain rounded-md border-[1.5px] border-text-primary bg-bg-default p-4 text-left shadow-popover focus:outline-none"
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
        </div>
      )}
    </span>
  )
}
