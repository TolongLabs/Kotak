import type { SdgReasonsFile } from '@kotak/shared'
import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useSdgReasons } from '../../engine/bundle'
import { SDG_NAMES, SdgChip } from '../ui/SdgChip'
import { TextLink } from '../ui/TextLink'

// An SDG chip that opens why it is there (#391): a button, so the reason is one tap, click or Enter away and never
// hover-only. The panel is a native popover, so it sits above sticky columns and scroll boxes, closes on Escape or a
// click outside, and stays next to its chip in the reading order.

const EDGE = 12
const GAP = 8
const WIDTH = 320

const readDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`)
  )

/** Below the chip, or above it when only that fits; when neither does, as close as fits on screen. */
function place(button: HTMLElement, panel: HTMLElement) {
  const rect = button.getBoundingClientRect()
  const viewportWidth = document.documentElement.clientWidth
  const width = Math.min(WIDTH, viewportWidth - 2 * EDGE)
  const height = panel.offsetHeight
  const below = rect.bottom + GAP
  const above = rect.top - GAP - height
  const top =
    below + height <= window.innerHeight - EDGE ? below : above >= EDGE ? above : window.innerHeight - EDGE - height
  panel.style.left = `${Math.max(EDGE, Math.min(rect.left, viewportWidth - width - EDGE))}px`
  panel.style.top = `${Math.max(EDGE, top)}px`
}

interface SdgReasonChipProps {
  /** The target, such as `4.4`. */
  target: string
  compact?: boolean
  reason: string
  /** "Why It Counts" for a skill's tag; a job chip gives its own reason and says so. */
  reasonLabel: string
  /** The UN's official text of the target and where it came from. */
  un: { text: string; meta: SdgReasonsFile['meta'] }
}

const goalOf = (target: string) => Number(target.split('.')[0])

function SdgReasonChip({ target, compact = false, reason, reasonLabel, un }: SdgReasonChipProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const goal = goalOf(target)
  const name = SDG_NAMES[goal] ?? `Goal ${goal}`

  useEffect(() => {
    if (!open) return
    const follow = () => place(buttonRef.current!, panelRef.current!)
    window.addEventListener('scroll', follow, { capture: true, passive: true })
    window.addEventListener('resize', follow)
    return () => {
      window.removeEventListener('scroll', follow, { capture: true })
      window.removeEventListener('resize', follow)
    }
  }, [open])

  return (
    // A press on the chip or its panel opens the reason only; it doesn't also select a roadmap step around it.
    <span className="inline-flex" onClick={(event) => event.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={panelId}
        aria-label={`SDG ${target}: ${name}`}
        aria-expanded={open}
        className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <SdgChip goal={goal} target={target} compact={compact} aria-hidden="true" className="cursor-pointer">
          {!compact && (
            <ChevronDown
              className={`-mr-1 h-4 w-4 shrink-0 stroke-current transition-transform ${open ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          )}
        </SdgChip>
      </button>
      <div
        ref={panelRef}
        id={panelId}
        popover="auto"
        // Its height is known only once it shows, so it stays hidden until the toggle event places it.
        onBeforeToggle={(event) => {
          setOpen(event.newState === 'open')
          if (event.newState === 'open') event.currentTarget.style.visibility = 'hidden'
        }}
        onToggle={(event) => {
          if (event.newState !== 'open') return
          place(buttonRef.current!, event.currentTarget)
          event.currentTarget.style.visibility = ''
        }}
        className="inset-auto m-0 max-h-[calc(100vh-1.5rem)] w-[min(20rem,calc(100vw-1.5rem))] space-y-3 overflow-y-auto rounded-md border border-border-subtle bg-bg-default p-4 text-left font-sans text-text-primary shadow-popover"
      >
        <p className="text-label-m">
          SDG {target} · {name}
        </p>
        <dl className="space-y-3">
          <div className="space-y-0.5">
            <dt className="font-mono text-mono-s text-text-muted">{reasonLabel}</dt>
            <dd className="text-body-s">{reason}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="font-mono text-mono-s text-text-muted">UN Target {target}</dt>
            <dd className="text-body-s">{un.text}</dd>
          </div>
        </dl>
        <p className="text-label-s text-text-muted">
          Target text from the{' '}
          <TextLink href={un.meta.source_url} external className="text-label-s">
            UN SDG API
          </TextLink>
          , read {readDate(un.meta.retrieved_date)}. The reason is Kotak’s.
        </p>
      </div>
    </span>
  )
}

/**
 * An SDG target chip with its UN text and reason: the table's reason for a skill's tag, or `workReason`, the job's own
 * reason, for a job chip. A plain chip of the same size until the table loads.
 */
export function SdgTargetChip({
  target,
  compact = false,
  workReason
}: {
  target: string
  compact?: boolean
  workReason?: string
}) {
  const reasons = useSdgReasons()
  const row = reasons.status === 'ready' ? reasons.data.targets[target] : undefined
  if (reasons.status !== 'ready' || !row)
    return (
      <SdgChip goal={goalOf(target)} target={target} compact={compact}>
        {!compact && <span className="-mr-1 h-4 w-4 shrink-0" aria-hidden="true" />}
      </SdgChip>
    )
  return (
    <SdgReasonChip
      target={target}
      compact={compact}
      reason={workReason ?? row.reason}
      reasonLabel={workReason ? 'Why This Work Counts' : 'Why It Counts'}
      un={{ text: row.text, meta: reasons.data.meta }}
    />
  )
}
