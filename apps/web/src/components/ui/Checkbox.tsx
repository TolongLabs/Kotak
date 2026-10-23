import { Check, Minus } from 'lucide-react'
import { forwardRef, useEffect, useId, useRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from './cn'

export interface CheckboxProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'checked' | 'defaultChecked' | 'onChange'
> {
  label: string
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    checked,
    indeterminate = false,
    onChange,
    id: providedId,
    className,
    disabled,
    'aria-invalid': ariaInvalid,
    ...props
  },
  forwardedRef
) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  const setRef = (node: HTMLInputElement | null) => {
    inputRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex min-h-11 cursor-pointer items-center gap-3 text-body-m text-text-primary',
        disabled && 'cursor-not-allowed text-text-muted'
      )}
    >
      <span className="relative inline-flex h-5 w-5 shrink-0">
        <input
          {...props}
          ref={setRef}
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-checked={indeterminate ? 'mixed' : checked}
          aria-invalid={ariaInvalid}
          onChange={(event) => onChange(event.currentTarget.checked)}
          // The fill follows the props, not :checked or :disabled, so a mixed box is filled like a ticked one and a
          // disabled ticked box still shows its mark. Pass disabled here rather than relying on a disabled fieldset.
          className={cn(
            'peer absolute inset-0 h-5 w-5 appearance-none rounded-sm border focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 focus-visible:outline-bg-default disabled:cursor-not-allowed aria-invalid:border-state-error',
            checked || indeterminate
              ? disabled
                ? 'border-text-muted bg-text-muted'
                : 'border-text-primary bg-text-primary'
              : disabled
                ? 'border-border-subtle bg-bg-panel'
                : 'border-border-control bg-bg-default',
            className
          )}
        />
        {indeterminate ? (
          <Minus
            className="pointer-events-none absolute inset-0 m-auto h-4 w-4 stroke-current text-bg-default"
            aria-hidden="true"
          />
        ) : (
          checked && (
            <Check
              className="pointer-events-none absolute inset-0 m-auto h-4 w-4 stroke-current text-bg-default"
              aria-hidden="true"
            />
          )
        )}
      </span>
      <span>{label}</span>
    </label>
  )
})
