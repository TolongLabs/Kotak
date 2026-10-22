import { forwardRef, type ComponentPropsWithoutRef, type ComponentType } from 'react'
import { Tooltip } from './Tooltip'
import { cn } from './cn'

export interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  label: string
  icon: ComponentType<{
    className?: string
    'aria-hidden'?: boolean | 'true' | 'false'
  }>
  variant?: 'outline' | 'plain'
}

const variantClasses = {
  outline: 'bg-bg-default text-text-primary border-[1.5px] border-text-primary hover:bg-bg-panel active:bg-bg-panel',
  plain:
    'bg-bg-panel text-text-primary border-[1.5px] border-transparent hover:border-border-control hover:bg-bg-default active:bg-bg-default'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon: Icon, variant = 'outline', className, type = 'button', disabled, ...props },
  ref
) {
  return (
    <Tooltip content={label}>
      <button
        ref={ref}
        type={type}
        aria-label={label}
        disabled={disabled}
        className={cn(
          'inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-sm transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-panel disabled:text-text-muted',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <Icon className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
      </button>
    </Tooltip>
  )
})
