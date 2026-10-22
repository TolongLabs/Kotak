import { forwardRef, useId, useRef, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from './cn'

export interface Tab {
  id: string
  label: string
}

export interface TabsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
  tabs: Tab[]
  value: string
  onChange: (id: string) => void
  children: ReactNode
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { tabs, value, onChange, children, className, ...props },
  ref
) {
  const baseId = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeIndex = tabs.findIndex((tab) => tab.id === value)

  const selectAt = (index: number) => {
    const next = tabs[index]
    if (!next) return
    if (tabRefs.current[index]) tabRefs.current[index]?.focus()
    if (next.id !== value) onChange(next.id)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = tabs.length - 1
    let next: number | null = null
    if (event.key === 'ArrowRight') next = activeIndex >= last ? 0 : activeIndex + 1
    else if (event.key === 'ArrowLeft') next = activeIndex <= 0 ? last : activeIndex - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    else return
    event.preventDefault()
    selectAt(next)
  }

  return (
    <div ref={ref} className={cn('flex flex-col', className)} {...props}>
      {/* Scrolls sideways when the tabs outgrow a phone. The baseline is an inset shadow, not a border, so the
          selected tab’s underline still covers it inside the scroll box, and the focus ring sits inside each tab. */}
      <div
        role="tablist"
        onKeyDown={handleKeyDown}
        className="flex w-full items-end overflow-x-auto shadow-[inset_0_-1px_0_var(--color-border-subtle)]"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === value
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-tabpanel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                'inline-flex h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-4 text-label-l transition-colors duration-150 ease-out focus-visible:-outline-offset-2',
                selected
                  ? 'border-text-primary font-bold text-text-primary'
                  : 'border-transparent text-text-muted hover:border-border-control hover:text-text-primary'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-tabpanel`}
        aria-labelledby={`${baseId}-tab-${value}`}
        tabIndex={0}
        className="rounded-sm pt-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {children}
      </div>
    </div>
  )
})
