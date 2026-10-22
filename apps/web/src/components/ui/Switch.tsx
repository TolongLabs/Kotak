import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react'
import { cn } from './cn'

export interface SwitchProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'role' | 'checked' | 'defaultChecked' | 'onChange'
> {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, checked, onChange, id: providedId, className, disabled, 'aria-invalid': ariaInvalid, ...props },
  ref
) {
  const generatedId = useId()
  const id = providedId ?? generatedId

  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex min-h-11 cursor-pointer items-center gap-3 text-body-m text-text-primary',
        disabled && 'cursor-not-allowed text-text-muted'
      )}
    >
      <span className="relative inline-flex h-11 w-11 shrink-0 items-center">
        <input
          {...props}
          ref={ref}
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-checked={checked}
          aria-invalid={ariaInvalid}
          onChange={(event) => onChange(event.currentTarget.checked)}
          className={cn(
            'peer h-6 w-11 appearance-none rounded-full border border-border-control bg-bg-panel checked:border-text-primary checked:bg-text-primary focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 focus-visible:outline-bg-default disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-panel aria-invalid:border-state-error',
            className
          )}
        />
        <span className="pointer-events-none absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-text-primary bg-bg-default peer-checked:translate-x-5 peer-disabled:border-border-subtle peer-disabled:bg-bg-panel" />
      </span>
      <span>{label}</span>
    </label>
  )
})
