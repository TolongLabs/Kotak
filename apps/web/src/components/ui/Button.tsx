import { forwardRef, isValidElement, type ComponentPropsWithoutRef, type ComponentType, type ReactNode } from 'react'
import { uiText } from '../../i18n/messages/ui'
import { useText } from '../../i18n/text'
import { Spinner } from './Spinner'
import { cn } from './cn'

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant: 'primary' | 'secondary' | 'ghost' | 'inverse'
  size?: 'md' | 'lg'
  iconStart?: ReactNode
  iconEnd?: ReactNode
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses = {
  primary:
    'bg-accent-box text-accent-on-box border-[1.5px] border-text-primary hover:bg-accent-box-hover active:bg-accent-box-hover',
  secondary: 'bg-bg-default text-text-primary border-[1.5px] border-text-primary hover:bg-bg-panel active:bg-bg-panel',
  ghost:
    'bg-bg-panel text-text-primary border-[1.5px] border-border-subtle hover:border-border-control hover:bg-bg-default active:bg-bg-default',
  inverse:
    'bg-text-primary text-bg-default border-[1.5px] border-text-primary hover:bg-text-muted hover:border-text-muted active:bg-text-muted'
}

const sizeClasses = {
  md: 'h-11 min-h-[44px] px-4 text-label-l',
  lg: 'h-12 min-h-[48px] px-6 text-label-l'
}

function renderIcon(icon?: ReactNode) {
  if (!icon) return null
  if (isValidElement(icon)) return icon
  if (typeof icon === 'function') {
    const IconComponent = icon as ComponentType<{
      className?: string
      'aria-hidden'?: boolean | 'true' | 'false'
    }>
    return <IconComponent className="h-5 w-5 shrink-0" aria-hidden="true" />
  }
  return icon
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size = 'md',
    iconStart,
    iconEnd,
    loading = false,
    fullWidth = false,
    disabled,
    className,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  const t = useText(uiText)
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? true : undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-sm font-sans font-semibold transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-panel disabled:text-text-muted',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : 'w-auto',
        className
      )}
      {...props}
    >
      {loading ? <Spinner label={t.loading} size="sm" /> : renderIcon(iconStart)}
      {children}
      {renderIcon(iconEnd)}
    </button>
  )
})
