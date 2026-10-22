import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent
} from 'react'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { cn } from './cn'

export interface DatePickerProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'type' | 'value' | 'onChange' | 'children'
> {
  label: string
  value: Date
  onChange: (value: Date) => void
  min?: Date
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function dateKey(date: Date): string {
  return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function isBeforeDay(date: Date, min?: Date): boolean {
  return !!min && startOfDay(date).getTime() < startOfDay(min).getTime()
}

function getMonthDays(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const firstGridDay = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    return new Date(firstGridDay.getFullYear(), firstGridDay.getMonth(), firstGridDay.getDate() + index)
  })
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
    .format(date)
    .replace(',', '')
}

function formatPlanDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(date)
    .replace(',', '')
}

function getPopoverStyle(trigger: HTMLButtonElement): CSSProperties {
  const rect = trigger.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const width = Math.max(0, Math.min(Math.max(rect.width, 336), viewportWidth - 24))
  const height = Math.max(140, Math.min(408, viewportHeight - 24))
  const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12))
  const placeAbove = rect.bottom + height + 8 > viewportHeight - 12 && rect.top > height + 20
  const top = placeAbove ? rect.top - height - 8 : Math.min(rect.bottom + 8, viewportHeight - height - 12)

  return { position: 'fixed', top, left, width, maxHeight: viewportHeight - 24 }
}

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(
  { label, value, onChange, min, id: providedId, className, disabled, 'aria-invalid': ariaInvalid, ...props },
  forwardedRef
) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const labelId = id + '-label'
  const titleId = id + '-month'
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const setDateRef = useRef<HTMLButtonElement | null>(null)
  const dayRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [open, setOpen] = useState(false)
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(value))
  const [draftDate, setDraftDate] = useState(value)
  const [focusedDate, setFocusedDate] = useState(value)
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({ position: 'fixed', top: 0, left: 0 })
  const invalid = ariaInvalid === true || ariaInvalid === 'true'
  const monthDays = getMonthDays(displayMonth)
  const monthName = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(displayMonth)
  const today = new Date()

  const setTriggerRef = (node: HTMLButtonElement | null) => {
    triggerRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  const close = (returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  const openCalendar = () => {
    if (triggerRef.current) setPopoverStyle(getPopoverStyle(triggerRef.current))
    setDisplayMonth(startOfMonth(value))
    setDraftDate(value)
    setFocusedDate(value)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return

    const updatePosition = () => {
      if (triggerRef.current) setPopoverStyle(getPopoverStyle(triggerRef.current))
    }
    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && rootRef.current?.contains(target)) return
      setOpen(false)
      window.setTimeout(() => triggerRef.current?.focus(), 0)
    }
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }

    updatePosition()
    document.addEventListener('pointerdown', handleOutsidePointer, true)
    document.addEventListener('keydown', handleEscape, true)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer, true)
      document.removeEventListener('keydown', handleEscape, true)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (open) dayRefs.current.get(dateKey(focusedDate))?.focus()
  }, [displayMonth, focusedDate, open])

  const moveMonth = (amount: number) => {
    const nextMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + amount, 1)
    const day = Math.min(
      focusedDate.getDate(),
      new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()
    )
    const candidate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day)
    const nextFocused = isBeforeDay(candidate, min) ? startOfDay(min as Date) : candidate
    setDisplayMonth(nextMonth)
    setFocusedDate(nextFocused)
  }

  const moveFocusedDate = (amount: number) => {
    const candidate = new Date(focusedDate.getFullYear(), focusedDate.getMonth(), focusedDate.getDate() + amount)
    const nextDate = isBeforeDay(candidate, min) ? startOfDay(min as Date) : candidate
    setFocusedDate(nextDate)
    if (nextDate.getMonth() !== displayMonth.getMonth() || nextDate.getFullYear() !== displayMonth.getFullYear()) {
      setDisplayMonth(startOfMonth(nextDate))
    }
  }

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) openCalendar()
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) close(true)
      else openCalendar()
    }
  }

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: Date) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveFocusedDate(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveFocusedDate(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveFocusedDate(-7)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveFocusedDate(7)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      setDraftDate(day)
      setDateRef.current?.focus()
    }
  }

  const selectDate = () => {
    onChange(new Date(draftDate.getFullYear(), draftDate.getMonth(), draftDate.getDate()))
    close(true)
  }

  return (
    <div
      ref={rootRef}
      className="min-w-0 space-y-2"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          close(true)
        }
      }}
    >
      <label id={labelId} htmlFor={id} className="block text-label-m text-text-primary">
        {label}
      </label>
      <button
        {...props}
        ref={setTriggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id + '-dialog'}
        aria-invalid={ariaInvalid}
        onClick={() => (open ? close(false) : openCalendar())}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-3 rounded-sm border px-3 text-left font-sans text-body-m transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 focus-visible:outline-bg-default disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-panel disabled:text-text-muted',
          invalid
            ? 'border-state-error bg-bg-default text-text-primary'
            : 'border-border-control bg-bg-default text-text-primary',
          className
        )}
      >
        <span className="min-w-0 truncate">{formatDate(value)}</span>
        <Calendar className="h-5 w-5 shrink-0 stroke-current text-text-muted" aria-hidden="true" />
      </button>
      {open && (
        <div
          id={id + '-dialog'}
          role="dialog"
          aria-labelledby={titleId}
          aria-modal="false"
          style={popoverStyle}
          className="z-50 max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-sm border border-border-subtle bg-bg-default p-4 shadow-[var(--shadow-popover)]"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <IconButton
              label="Previous Month"
              icon={ChevronLeft}
              disabled={Boolean(
                min && displayMonth.getFullYear() === min.getFullYear() && displayMonth.getMonth() <= min.getMonth()
              )}
              onClick={() => moveMonth(-1)}
            />
            <h2 id={titleId} className="text-label-l text-text-primary">
              {monthName}
            </h2>
            <IconButton label="Next Month" icon={ChevronRight} onClick={() => moveMonth(1)} />
          </div>
          <div role="grid" aria-labelledby={titleId}>
            <div role="row" className="grid grid-cols-7">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((weekday) => (
                <div
                  key={weekday}
                  role="columnheader"
                  className="flex h-8 items-center justify-center font-mono text-mono-s text-text-muted"
                >
                  {weekday}
                </div>
              ))}
            </div>
            {Array.from({ length: 6 }, (_, week) => (
              <div key={week} role="row" className="grid grid-cols-7">
                {monthDays.slice(week * 7, week * 7 + 7).map((day) => {
                  const inCurrentMonth = day.getMonth() === displayMonth.getMonth()
                  const selected = isSameDay(day, draftDate)
                  const isToday = isSameDay(day, today)
                  const beforeMin = isBeforeDay(day, min)
                  const dayId = dateKey(day)

                  return (
                    <button
                      key={dayId}
                      ref={(node) => {
                        if (node) dayRefs.current.set(dayId, node)
                        else dayRefs.current.delete(dayId)
                      }}
                      type="button"
                      role="gridcell"
                      aria-label={formatDate(day)}
                      aria-selected={selected}
                      tabIndex={isSameDay(day, focusedDate) ? 0 : -1}
                      disabled={!inCurrentMonth || beforeMin}
                      onFocus={() => setFocusedDate(day)}
                      onClick={() => {
                        setDraftDate(day)
                        setFocusedDate(day)
                      }}
                      onKeyDown={(event) => handleDayKeyDown(event, day)}
                      className={cn(
                        'flex h-11 w-full items-center justify-center rounded-sm border text-body-m text-text-primary focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 focus-visible:outline-bg-default disabled:cursor-not-allowed disabled:text-text-muted',
                        selected
                          ? 'on-accent border-[1.5px] border-text-primary bg-accent-box'
                          : isToday
                            ? 'border border-text-primary bg-bg-default'
                            : 'border border-transparent bg-bg-default',
                        isToday && 'outline outline-1 outline-text-primary outline-offset-1',
                        (!inCurrentMonth || beforeMin) && 'bg-bg-panel text-text-muted'
                      )}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
            <p className="text-body-s text-text-muted">Plan Starts {formatPlanDate(draftDate)}</p>
            <Button ref={setDateRef} variant="primary" size="md" onClick={selectDate}>
              Set Date
            </Button>
          </div>
        </div>
      )}
    </div>
  )
})
