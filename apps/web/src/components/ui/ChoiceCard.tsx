import { forwardRef, type ComponentPropsWithoutRef, type ComponentType } from 'react'
import { cn } from './cn'

export interface ChoiceCardProps extends Omit<ComponentPropsWithoutRef<'label'>, 'onSelect'> {
  title: string
  description: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  selected: boolean
  onSelect?: (value: string) => void
  name: string
  value: string
  /** In a wide @container (several narrow columns), icon and radio share a row and the words take the full width. */
  stacked?: boolean
}

export const ChoiceCard = forwardRef<HTMLLabelElement, ChoiceCardProps>(function ChoiceCard(
  { title, description, icon: Icon, selected, onSelect, name, value, stacked = false, className, ...props },
  ref
) {
  return (
    <label
      ref={ref}
      className={cn(
        'has-[:focus-visible]:outline-focus-ring flex cursor-pointer items-start rounded-md p-4 text-text-primary transition-colors duration-150 ease-out has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
        'gap-3',
        stacked && '@2xl:flex-wrap @2xl:content-start @2xl:gap-y-2',
        selected
          ? 'on-accent border-[1.5px] border-text-primary bg-accent-box'
          : 'border border-border-subtle bg-bg-default hover:border-border-control',
        className
      )}
      {...props}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={() => onSelect?.(value)}
        className="peer sr-only"
      />
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', stacked && '@2xl:order-1 @2xl:mr-auto')} aria-hidden="true" />
      <span className={cn('flex min-w-0 flex-1 flex-col gap-1', stacked && '@2xl:order-3 @2xl:basis-full')}>
        <span className="text-label-l">{title}</span>
        <span className="text-body-s text-text-muted">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]',
          stacked && '@2xl:order-2',
          selected ? 'border-text-primary' : 'border-border-control'
        )}
      >
        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-text-primary" /> : null}
      </span>
    </label>
  )
})
