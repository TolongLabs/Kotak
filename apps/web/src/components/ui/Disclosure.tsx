import { Minus, Plus } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from './cn'

export interface DisclosureProps {
  title: ReactNode
  /** Muted text after the title, such as what the fold holds. */
  meta?: ReactNode
  defaultOpen?: boolean
  /** card: a bordered box of its own. rule: a ruled row inside another card. */
  variant?: 'card' | 'rule'
  className?: string
  children: ReactNode
}

/** Evidence one tap away: a folded section that starts closed, so a page shows its answer before its sources. */
export function Disclosure({
  title,
  meta,
  defaultOpen = false,
  variant = 'rule',
  className,
  children
}: DisclosureProps) {
  const panelId = useId()
  const [open, setOpen] = useState(defaultOpen)
  const ToggleIcon = open ? Minus : Plus

  return (
    <div
      className={cn(variant === 'card' ? 'surface-card rounded-md px-4' : 'border-t border-border-subtle', className)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex min-h-11 w-full items-center justify-between gap-4 py-3 text-left text-text-primary transition-colors duration-150 ease-out hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
          variant === 'card' ? 'text-label-l' : 'text-label-m'
        )}
      >
        <span className="min-w-0">
          {title}
          {meta ? <span className="ml-2 text-body-s font-normal text-text-muted">{meta}</span> : null}
        </span>
        <ToggleIcon className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
      </button>
      <div id={panelId} hidden={!open} data-disclosure-panel="" className="pb-4">
        {children}
      </div>
    </div>
  )
}
