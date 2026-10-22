import { AlertTriangle } from 'lucide-react'
import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react'
import { cn } from './cn'

export interface TextareaProps extends ComponentPropsWithoutRef<'textarea'> {
  label: string
  helper?: string
  error?: string
  rows?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    helper,
    error,
    rows = 4,
    id: providedId,
    className,
    disabled,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const message = error || helper
  const messageId = message ? id + (error ? '-error' : '-helper') : undefined
  const invalid = error ? true : ariaInvalid === true || ariaInvalid === 'true'
  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-label-m text-text-primary">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={cn(
          'block min-h-28 w-full rounded-sm border px-3 py-2.5 bg-bg-default font-sans text-body-m text-text-primary placeholder:text-text-muted transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 focus-visible:outline-bg-default disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-panel disabled:text-text-muted',
          invalid ? 'border-state-error' : 'border-border-control',
          className
        )}
        {...props}
      />
      {message && (
        <p
          id={messageId}
          className={cn('flex items-start gap-2 text-body-s', error ? 'text-state-error' : 'text-text-muted')}
        >
          {error && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />}
          {message}
        </p>
      )}
    </div>
  )
})
