import { AlertTriangle, Eye, EyeOff, KeyRound, Lock, type LucideIcon } from 'lucide-react'
import { forwardRef, useId, useState, type ComponentPropsWithoutRef } from 'react'
import { uiText } from '../../i18n/messages/ui'
import { useText } from '../../i18n/text'
import { cn } from './cn'

export interface PasswordFieldProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type'> {
  label: string
  helper?: string
  error?: string
  icon?: LucideIcon
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  {
    label,
    helper,
    error,
    icon: Icon = KeyRound,
    id: providedId,
    className,
    disabled,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref
) {
  const t = useText(uiText)
  const generatedId = useId()
  const id = providedId ?? generatedId
  const [visible, setVisible] = useState(false)
  const message = error || helper
  const messageId = message ? id + (error ? '-error' : '-helper') : undefined
  const invalid = error ? true : ariaInvalid === true || ariaInvalid === 'true'
  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-label-m text-text-primary">
        {label}
      </label>
      <div
        className={cn(
          'flex h-11 w-full items-center gap-3 rounded-sm border px-3 transition-colors duration-150 ease-out focus-within:border-text-primary focus-within:outline focus-within:outline-2 focus-within:outline-focus-ring focus-within:outline-offset-2 focus-within:outline-bg-default',
          invalid ? 'border-state-error' : 'border-border-control',
          disabled ? 'cursor-not-allowed border-border-subtle bg-bg-panel' : 'bg-bg-default'
        )}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0 stroke-current text-text-muted" aria-hidden="true" />}
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(
            'h-full min-w-0 flex-1 bg-bg-default font-sans text-body-m text-text-primary placeholder:text-text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-bg-panel disabled:text-text-muted',
            className
          )}
          {...props}
        />
        {disabled ? (
          <Lock className="h-5 w-5 shrink-0 stroke-current text-text-muted" aria-hidden="true" />
        ) : (
          <button
            type="button"
            aria-label={visible ? t.hidePassword : t.showPassword}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
            className="-mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-bg-default text-text-muted transition-colors duration-150 ease-out hover:bg-bg-panel hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            {visible ? (
              <EyeOff className="h-5 w-5 stroke-current" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5 stroke-current" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
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
