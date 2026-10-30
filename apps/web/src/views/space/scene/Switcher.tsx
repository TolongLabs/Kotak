import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../../components/ui/cn'

// The space's two switches (the AI future and the data month) as one option set each, after shadcn/ui's single
// ToggleGroup (https://ui.shadcn.com/docs/components/toggle-group): one group, one tab stop, and the arrow keys move
// the choice, as radios do. Each choice is a word over the canvas; the chosen one is ink with a bar under it.

interface SwitcherOption<T extends string> {
  value: T
  label: ReactNode
  /** The accessible name when the label is shorter than the choice, such as "Slow" for Slow AI Uptake. */
  name?: string
}

interface SwitcherProps<T extends string> {
  label: string
  options: SwitcherOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'lg' | 'md'
  /** The keys that also work the switch, as aria-keyshortcuts names them, such as "F 1 2". */
  keyshortcuts?: string
  className?: string
}

export function Switcher<T extends string>({
  label,
  options,
  value,
  onChange,
  size = 'md',
  keyshortcuts,
  className
}: SwitcherProps<T>) {
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (event: KeyboardEvent, i: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const next = (i + step + options.length) % options.length
    onChange(options[next]!.value)
    items.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-keyshortcuts={keyshortcuts}
      data-slot="toggle-group"
      className={cn('flex items-center', size === 'lg' ? 'gap-6' : 'gap-4', className)}
    >
      {options.map((option, i) => {
        const checked = option.value === value
        return (
          <button
            key={option.value}
            ref={(el) => {
              items.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.name}
            tabIndex={checked ? 0 : -1}
            data-slot="toggle-group-item"
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, i)}
            className={cn(
              'relative inline-flex min-h-11 touch-manipulation items-center whitespace-nowrap rounded-sm px-1 transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
              'after:absolute after:inset-x-1 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-accent-box after:transition-opacity after:duration-200 after:ease-out',
              size === 'lg' ? 'text-title-s' : 'text-label-m',
              checked
                ? 'text-text-primary after:opacity-100'
                : 'text-text-muted after:opacity-0 hover:text-text-primary'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
