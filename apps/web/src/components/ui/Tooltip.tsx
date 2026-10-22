import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode
} from 'react'
import { cn } from './cn'

export interface TooltipProps {
  content: string
  placement?: 'top' | 'bottom'
  children: ReactNode
  className?: string
}

export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
  { content, placement = 'top', children, className },
  ref
) {
  const [open, setOpen] = useState(false)
  const id = useId()

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
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
      ref={ref}
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
          role="tooltip"
          id={id}
          className={cn(
            'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm bg-text-primary px-2.5 py-1 text-label-s text-bg-default shadow-[var(--shadow-popover)]',
            placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
})
