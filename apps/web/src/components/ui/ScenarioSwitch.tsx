import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react'
import { cn } from './cn'

export type ScenarioValue = 'slow' | 'fast'

export interface ScenarioSwitchProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
  value: ScenarioValue
  onChange?: (value: ScenarioValue) => void
}

const options: Array<{ value: ScenarioValue; label: string }> = [
  { value: 'slow', label: 'Slow AI Uptake' },
  { value: 'fast', label: 'Fast AI Uptake' }
]

export const ScenarioSwitch = forwardRef<HTMLDivElement, ScenarioSwitchProps>(function ScenarioSwitch(
  { value, onChange, className, ...props },
  ref
) {
  const baseId = useId()
  return (
    <div
      ref={ref}
      role="radiogroup"
      className={cn('inline-flex items-stretch rounded-full border border-border-subtle bg-bg-panel p-1', className)}
      {...props}
    >
      {options.map((option) => {
        const selected = value === option.value
        return (
          <label
            key={option.value}
            className={cn(
              'has-[:focus-visible]:outline-focus-ring flex min-h-[44px] cursor-pointer items-center whitespace-nowrap rounded-full border-[1.5px] px-5 transition-colors duration-150 ease-out has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
              selected
                ? 'border-text-primary bg-accent-box text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            )}
          >
            <input
              type="radio"
              name={baseId}
              value={option.value}
              checked={selected}
              onChange={() => onChange?.(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        )
      })}
    </div>
  )
})
