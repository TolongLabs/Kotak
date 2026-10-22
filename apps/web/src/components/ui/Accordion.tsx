import { forwardRef, useId, useState, type ComponentPropsWithoutRef } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from './cn'

export interface AccordionItem {
  id: string
  question: string
  answer: string
}

export interface AccordionProps extends ComponentPropsWithoutRef<'div'> {
  items: AccordionItem[]
  defaultOpenIds?: string[]
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  { items, defaultOpenIds, className, ...props },
  ref
) {
  const baseId = useId()
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set(defaultOpenIds))

  const toggle = (id: string) => {
    setOpenIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div ref={ref} className={cn('border-t border-border-subtle', className)} {...props}>
      {items.map((item) => {
        const buttonId = `${baseId}-button-${item.id}`
        const panelId = `${baseId}-panel-${item.id}`
        const isOpen = openIds.has(item.id)
        const ToggleIcon = isOpen ? Minus : Plus
        return (
          <div key={item.id} className="border-b border-border-subtle">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex min-h-[44px] w-full items-center justify-between gap-4 py-3 text-left text-label-l text-text-primary transition-colors duration-150 ease-out hover:text-text-muted"
              >
                {item.question}
                <ToggleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen}>
              <p className="pb-4 text-body-m text-text-muted">{item.answer}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
})
