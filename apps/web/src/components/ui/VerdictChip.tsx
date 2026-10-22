import { CircleHelp, MoveRight, Split, TrendingDown, TrendingUp } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from './cn'

export type VerdictType = 'rising' | 'steady' | 'declining' | 'split' | 'unknown'

export interface VerdictChipProps extends ComponentPropsWithoutRef<'span'> {
  verdict: VerdictType
  size?: 'sm' | 'md'
}

const verdictConfig = {
  rising: {
    label: 'Rising',
    icon: TrendingUp,
    borderStyle: 'border-solid'
  },
  steady: {
    label: 'Steady',
    icon: MoveRight,
    borderStyle: 'border-solid'
  },
  declining: {
    label: 'Declining',
    icon: TrendingDown,
    borderStyle: 'border-solid'
  },
  split: {
    label: 'Split',
    icon: Split,
    borderStyle: 'border-solid'
  },
  unknown: {
    label: 'Unknown',
    icon: CircleHelp,
    borderStyle: 'border-dashed'
  }
}

const sizeClasses = {
  sm: 'text-label-s px-2.5 py-0.5 gap-1.5',
  md: 'text-label-m px-3 py-1 gap-2'
}

const iconSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4'
}

export const VerdictChip = forwardRef<HTMLSpanElement, VerdictChipProps>(function VerdictChip(
  { verdict, size = 'md', className, ...props },
  ref
) {
  const config = verdictConfig[verdict]
  const Icon = config.icon

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full bg-bg-default font-sans font-semibold text-text-primary border-[1.5px] border-text-primary',
        config.borderStyle,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <Icon className={cn('shrink-0 stroke-current', iconSizes[size])} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  )
})
