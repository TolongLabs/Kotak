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
}

export const ChoiceCard = forwardRef<HTMLLabelElement, ChoiceCardProps>(function ChoiceCard(
  { title, description, icon: Icon, selected, onSelect, name, value, className, ...props },
  ref
) {
  return (
    <label
      ref={ref}
      className={cn(
        'has-[:focus-visible]:outline-focus-ring flex cursor-pointer items-start gap-3 rounded-md p-4 text-text-primary transition-colors duration-150 ease-out has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
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
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-label-l">{title}</span>
        <span className="text-body-s text-text-muted">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]',
          selected ? 'border-text-primary' : 'border-border-control'
        )}
      >
        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-text-primary" /> : null}
      </span>
    </label>
  )
})
