import { forwardRef, type ComponentPropsWithoutRef, type ComponentType } from 'react'
import { Tooltip } from './Tooltip'
import { cn } from './cn'

export interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  label: string
  icon: ComponentType<{
    className?: string
    'aria-hidden'?: boolean | 'true' | 'false'
  }>
  /** `bare` is the icon alone, with no fill and no line, even on hover; only the keyboard's focus ring shows, for a button
   * drawn straight on a picture, such as the 3D space. */
  variant?: 'outline' | 'plain' | 'bare'
  /** Show the label as a hover and focus tooltip. The label stays the accessible name either way. */
  tooltip?: boolean
}

const variantClasses = {
  outline: 'bg-bg-default text-text-primary border-[1.5px] border-text-primary hover:bg-bg-panel active:bg-bg-panel',
  plain:
    'bg-bg-panel text-text-primary border-[1.5px] border-transparent hover:border-border-control hover:bg-bg-default active:bg-bg-default',
  bare: 'bg-transparent text-text-primary border-[1.5px] border-transparent'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon: Icon, variant = 'outline', tooltip = true, className, type = 'button', disabled, ...props },
  ref
) {
  const button = (
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
  )
  return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button
})
