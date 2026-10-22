import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react'
import { cn } from './cn'

export interface RadioOption {
  value: string
  label: string
  description?: string
}

export interface RadioGroupProps extends Omit<ComponentPropsWithoutRef<'fieldset'>, 'onChange' | 'value'> {
  label: string
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  name?: string
  disabled?: boolean
}

export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(
  { label, options, value, onChange, name, disabled, className, 'aria-invalid': ariaInvalid, ...props },
  ref
) {
  const groupId = useId()
  const groupName = name ?? groupId

  return (
    <fieldset
      {...props}
      ref={ref}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      className={cn('min-w-0 space-y-3', className)}
    >
      <legend className="text-label-m text-text-primary">{label}</legend>
      <div className="space-y-2">
        {options.map((option, index) => {
          const id = groupId + '-' + index
          const descriptionId = option.description ? id + '-description' : undefined

          return (
            <div key={option.value} className="flex min-h-11 items-center gap-3">
              <span className="relative inline-flex h-5 w-5 shrink-0">
                <input
                  id={id}
                  type="radio"
                  name={groupName}
                  value={option.value}
                  checked={value === option.value}
                  disabled={disabled}
                  aria-describedby={descriptionId}
                  onChange={(event) => onChange(event.currentTarget.value)}
                  className="absolute inset-0 h-5 w-5 appearance-none rounded-full border border-border-control bg-bg-default checked:border-text-primary focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 focus-visible:outline-bg-default disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-panel"
                />
                {value === option.value && (
                  <span
                    className={cn(
                      'pointer-events-none absolute inset-0 m-auto h-2.5 w-2.5 rounded-full',
                      disabled ? 'bg-text-muted' : 'bg-text-primary'
                    )}
                  />
                )}
              </span>
              <div className="min-w-0">
                <label
                  htmlFor={id}
                  className={cn(
                    'cursor-pointer text-body-m text-text-primary',
                    disabled && 'cursor-not-allowed text-text-muted'
                  )}
                >
                  {option.label}
                </label>
                {option.description && (
                  <p id={descriptionId} className="text-body-s text-text-muted">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
})
