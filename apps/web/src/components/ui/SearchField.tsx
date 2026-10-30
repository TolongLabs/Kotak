import { Lock, Search } from 'lucide-react'
import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react'
import { uiText } from '../../i18n/messages/ui'
import { useText } from '../../i18n/text'
import { cn } from './cn'

export interface SearchFieldProps extends ComponentPropsWithoutRef<'input'> {
  placeholder: string
  shortcutHint?: string
  label?: string
  // Keeps the label for screen readers only, for search bars with no visible label.
  hideLabel?: boolean
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  {
    label,
    hideLabel = false,
    placeholder,
    shortcutHint = '/',
    id: providedId,
    className,
    disabled,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref
) {
  const t = useText(uiText)
  const resolvedLabel = label ?? t.search
  const generatedId = useId()
  const id = providedId ?? generatedId
  const invalid = ariaInvalid === true || ariaInvalid === 'true'

  return (
    <div className="space-y-2">
      <label htmlFor={id} className={cn('block text-label-m text-text-primary', hideLabel && 'sr-only')}>
        {resolvedLabel}
      </label>
      <div
        className={cn(
          'flex h-11 w-full items-center gap-3 rounded-sm border px-3 transition-colors duration-150 ease-out focus-within:border-text-primary focus-within:outline focus-within:outline-2 focus-within:outline-focus-ring focus-within:outline-offset-2 focus-within:outline-bg-default',
          invalid ? 'border-state-error' : 'border-border-control',
          disabled ? 'cursor-not-allowed border-border-subtle bg-bg-panel' : 'bg-bg-default'
        )}
      >
        <Search className="h-5 w-5 shrink-0 stroke-current text-text-muted" aria-hidden="true" />
        <input
          ref={ref}
          id={id}
          type="search"
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            'h-full min-w-0 flex-1 bg-bg-default font-sans text-body-m text-text-primary placeholder:text-text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-bg-panel disabled:text-text-muted',
            className
          )}
          {...props}
        />
        {disabled ? (
          <Lock className="h-5 w-5 shrink-0 stroke-current text-text-muted" aria-hidden="true" />
        ) : (
          shortcutHint && (
            <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-border-subtle bg-bg-panel px-1.5 font-mono text-mono-s text-text-muted">
              {shortcutHint}
            </kbd>
          )
        )}
      </div>
    </div>
  )
})
