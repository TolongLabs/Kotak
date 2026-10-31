import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react'
import { commonText } from '../../i18n/common'
import { useText } from '../../i18n/text'
import { cn } from './cn'

export type ScenarioValue = 'slow' | 'fast'

export interface ScenarioSwitchProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
  value: ScenarioValue
  onChange?: (value: ScenarioValue) => void
  /** One plain line under each option's name, saying what that future means. */
  descriptions?: Record<ScenarioValue, string>
}

// The option labels live in commonText and are read while rendering, so they follow a language switch.
const values: ScenarioValue[] = ['slow', 'fast']

export const ScenarioSwitch = forwardRef<HTMLDivElement, ScenarioSwitchProps>(function ScenarioSwitch(
  { value, onChange, descriptions, className, ...props },
  ref
) {
  const baseId = useId()
  const t = useText(commonText)
  return (
    <div
      ref={ref}
      role="radiogroup"
      className={cn(
        'items-stretch border border-border-subtle p-1',
        descriptions ? 'grid grid-cols-2 gap-1 rounded-md bg-bg-default' : 'inline-flex rounded-full bg-bg-panel',
        className
      )}
      {...props}
    >
      {values.map((optionValue) => {
        const selected = value === optionValue
        return (
          <label
            key={optionValue}
            className={cn(
              'has-[:focus-visible]:outline-focus-ring flex min-h-[44px] cursor-pointer border-[1.5px] transition-colors duration-150 ease-out has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
              descriptions
                ? 'min-w-0 flex-col justify-center rounded-sm px-3 py-1.5 text-left'
                : 'items-center whitespace-nowrap rounded-full px-5',
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
            {descriptions ? (
              <>
                <span className="text-label-m text-text-primary">{t.scenarios[optionValue]}</span>
                <span className="text-label-s text-text-muted">{descriptions[optionValue]}</span>
              </>
            ) : (
              t.scenarios[optionValue]
            )}
          </label>
        )
      })}
    </div>
  )
})
