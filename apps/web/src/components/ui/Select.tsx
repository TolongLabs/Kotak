import { Check, ChevronDown } from 'lucide-react'
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
import { cn } from './cn'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'type' | 'value' | 'onChange' | 'children'
> {
  label: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
}

function getPopoverStyle(trigger: HTMLButtonElement): CSSProperties {
  const rect = trigger.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const width = Math.max(0, Math.min(Math.max(rect.width, 240), viewportWidth - 24))
  const height = Math.max(120, Math.min(288, viewportHeight - 24))
  const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12))
  const placeAbove = rect.bottom + height + 8 > viewportHeight - 12 && rect.top > height + 20
  const top = placeAbove ? rect.top - height - 8 : Math.min(rect.bottom + 8, viewportHeight - height - 12)

  return { position: 'fixed', top, left, width, maxHeight: viewportHeight - 24 }
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { label, options, value, onChange, id: providedId, className, disabled, 'aria-invalid': ariaInvalid, ...props },
  forwardedRef
) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const labelId = id + '-label'
  const listboxId = id + '-listbox'
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const optionRefs = useRef<Array<HTMLDivElement | null>>([])
  const typeahead = useRef({ value: '', time: 0 })
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({ position: 'fixed', top: 0, left: 0 })
  const selectedOption = options.find((option) => option.value === value)
  const invalid = ariaInvalid === true || ariaInvalid === 'true'

  const setTriggerRef = (node: HTMLButtonElement | null) => {
    triggerRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  const close = (returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  const openListbox = (index = selectedIndex) => {
    if (triggerRef.current) setPopoverStyle(getPopoverStyle(triggerRef.current))
    setActiveIndex(index)
    setOpen(true)
  }

  const selectOption = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    close(true)
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
    if (open) optionRefs.current[activeIndex]?.focus()
  }, [activeIndex, open])

  const focusMatch = (text: string) => {
    if (!text || !options.length) return
    const now = Date.now()
    const query = now - typeahead.current.time < 700 ? typeahead.current.value + text : text
    typeahead.current = { value: query, time: now }
    const start = open ? activeIndex : selectedIndex
    const order = Array.from({ length: options.length }, (_, index) => (start + index + 1) % options.length)
    const match = order.find((index) => options[index].label.toLocaleLowerCase().startsWith(query.toLocaleLowerCase()))
    if (match === undefined) return
    if (!open) setOpen(true)
    setActiveIndex(match)
  }

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const first = event.key === 'ArrowDown' ? selectedIndex : Math.max(options.length - 1, 0)
      openListbox(first)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) close(true)
      else openListbox()
    }
  }

  const handleListboxKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close(true)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => (current + direction + options.length) % options.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(Math.max(options.length - 1, 0))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectOption(activeIndex)
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      focusMatch(event.key)
    }
  }

  return (
    <div ref={rootRef} className="min-w-0 space-y-2">
      <label id={labelId} htmlFor={id} className="block text-label-m text-text-primary">
        {label}
      </label>
      <button
        {...props}
        ref={setTriggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-invalid={ariaInvalid}
        onClick={() => (open ? close(false) : openListbox())}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-3 rounded-sm border px-3 text-left font-sans text-body-m transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 focus-visible:outline-bg-default disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-panel disabled:text-text-muted',
          invalid
            ? 'border-state-error bg-bg-default text-text-primary'
            : 'border-border-control bg-bg-default text-text-primary',
          className
        )}
      >
        <span className="min-w-0 truncate">{selectedOption?.label ?? ''}</span>
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 stroke-current text-text-muted', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          onKeyDown={handleListboxKeyDown}
          style={popoverStyle}
          className="z-50 overflow-y-auto rounded-sm border border-border-subtle bg-bg-default p-1 shadow-[var(--shadow-popover)]"
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              ref={(node) => {
                optionRefs.current[index] = node
              }}
              id={id + '-option-' + index}
              role="option"
              aria-selected={option.value === value}
              tabIndex={-1}
              onFocus={() => setActiveIndex(index)}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => selectOption(index)}
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-sm px-3 text-body-m text-text-primary',
                activeIndex === index ? 'bg-bg-panel' : 'bg-bg-default',
                option.value === value && 'font-semibold'
              )}
            >
              <span className="min-w-0 truncate">{option.label}</span>
              {option.value === value && <Check className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
