import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode
} from 'react'
import { cn } from './cn'

export interface TooltipProps {
  content: string
  placement?: 'top' | 'bottom' | 'right'
  /** A sentence rather than a label: it wraps at about 16rem. */
  multiline?: boolean
  children: ReactNode
  className?: string
}

// The space between the trigger and the tooltip, in px.
const GAP = 8
// The least space between the tooltip and the edge of the screen, in px.
const EDGE = 8

export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
  { content, placement = 'top', multiline = false, children, className },
  ref
) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const anchorRef = useRef<HTMLSpanElement | null>(null)
  const tipRef = useRef<HTMLSpanElement | null>(null)
  const id = useId()

  // The tooltip sits in the browser's top layer as a manual popover, placed from its trigger, so a modal dialog, a
  // scrolling box that clips or a sticky island can't cover or cut it. It follows the trigger while anything scrolls.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    const place = () => {
      const rect = anchorRef.current?.getBoundingClientRect()
      if (!rect) return
      // Centred over the trigger, but kept on screen: a chip by the right edge shifts its tooltip left.
      const half = (tipRef.current?.offsetWidth ?? 0) / 2
      const viewport = document.documentElement.clientWidth
      const centre = Math.min(Math.max(rect.left + rect.width / 2, half + EDGE), viewport - half - EDGE)
      setPosition(
        placement === 'right'
          ? { left: rect.right + GAP, top: rect.top + rect.height / 2 }
          : placement === 'bottom'
            ? { left: centre, top: rect.bottom + GAP }
            : { left: centre, top: rect.top - GAP }
      )
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, placement])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const setRef = (element: HTMLSpanElement | null) => {
    anchorRef.current = element
    if (typeof ref === 'function') ref(element)
    else if (ref) ref.current = element
  }

  // A browser without the popover API keeps it in place, still fixed to the screen.
  const showInTopLayer = (element: HTMLSpanElement | null) => {
    tipRef.current = element
    if (element && typeof element.showPopover === 'function' && !element.matches(':popover-open')) {
      element.showPopover()
    }
  }

  const childElement = isValidElement(children)
    ? (children as ReactElement<{
        'aria-describedby'?: string
      }>)
    : null

  const trigger = childElement
    ? cloneElement(childElement, {
        'aria-describedby': open
          ? [childElement.props['aria-describedby'], id].filter(Boolean).join(' ')
          : childElement.props['aria-describedby']
      })
    : children

  return (
    <span
      ref={setRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
      onKeyDown={handleKeyDown}
    >
      {trigger}
      {open && (
        <span
          ref={showInTopLayer}
          popover="manual"
          role="tooltip"
          id={id}
          style={position ?? { visibility: 'hidden' }}
          className={cn(
            'pointer-events-none fixed inset-auto m-0 overflow-visible rounded-sm border-0 bg-text-primary px-2.5 py-1 text-label-s text-bg-default shadow-[var(--shadow-popover)]',
            multiline ? 'w-max max-w-64 whitespace-normal py-1.5 font-normal' : 'whitespace-nowrap',
            placement === 'right'
              ? '-translate-y-1/2'
              : placement === 'bottom'
                ? '-translate-x-1/2'
                : '-translate-x-1/2 -translate-y-full'
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
})
