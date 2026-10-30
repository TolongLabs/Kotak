import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react'
import { commonText } from '../../i18n/common'
import { useText } from '../../i18n/text'
import { cn } from './cn'

export type ScenarioValue = 'slow' | 'fast'

export interface ScenarioSwitchProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
  value: ScenarioValue
  onChange?: (value: ScenarioValue) => void
}

// The option labels live in commonText and are read while rendering, so they follow a language switch.
const values: ScenarioValue[] = ['slow', 'fast']

export const ScenarioSwitch = forwardRef<HTMLDivElement, ScenarioSwitchProps>(function ScenarioSwitch(
  { value, onChange, className, ...props },
  ref
) {
  const baseId = useId()
  const t = useText(commonText)
  return (
    <div
      ref={ref}
      role="radiogroup"
      className={cn('inline-flex items-stretch rounded-full border border-border-subtle bg-bg-panel p-1', className)}
      {...props}
    >
      {values.map((optionValue) => {
        const selected = value === optionValue
        return (
          <label
            key={optionValue}
            className={cn(
              'has-[:focus-visible]:outline-focus-ring flex min-h-[44px] cursor-pointer items-center whitespace-nowrap rounded-full border-[1.5px] px-5 transition-colors duration-150 ease-out has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
              selected
                ? 'on-accent border-text-primary bg-accent-box text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            )}
          >
            <input
              type="radio"
              name={baseId}
              value={optionValue}
              checked={selected}
              onChange={() => onChange?.(optionValue)}
              className="sr-only"
            />
            {t.scenarios[optionValue]}
          </label>
        )
      })}
    </div>
  )
})
