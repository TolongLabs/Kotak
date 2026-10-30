import { CircleHelp, MoveRight, Split, TrendingDown, TrendingUp } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { commonText } from '../../i18n/common'
import { useText } from '../../i18n/text'
import { cn } from './cn'

export type VerdictType = 'rising' | 'steady' | 'declining' | 'split' | 'unknown'

export interface VerdictChipProps extends ComponentPropsWithoutRef<'span'> {
  verdict: VerdictType
  size?: 'sm' | 'md'
}

const VERDICT_KEYS = {
  rising: 'Rising',
  steady: 'Steady',
  declining: 'Declining',
  split: 'Split',
  unknown: 'Unknown'
} as const

const verdictConfig = {
  rising: {
    icon: TrendingUp,
    borderStyle: 'border-solid',
    tone: 'border-state-success text-state-success bg-[color-mix(in_srgb,var(--color-state-success)_6%,var(--color-bg-default))]'
  },
  steady: {
    icon: MoveRight,
    borderStyle: 'border-solid'
  },
  declining: {
    icon: TrendingDown,
    borderStyle: 'border-solid',
    tone: 'border-state-error text-state-error bg-[color-mix(in_srgb,var(--color-state-error)_6%,var(--color-bg-default))]'
  },
  split: {
    icon: Split,
    borderStyle: 'border-solid'
  },
  unknown: {
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
  const common = useText(commonText)
  const config = verdictConfig[verdict]
  const Icon = config.icon
  const label = common.verdicts[VERDICT_KEYS[verdict]]

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full font-sans font-semibold border-[1.5px]',
        'tone' in config ? config.tone : 'bg-bg-default text-text-primary border-text-primary',
        config.borderStyle,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <Icon className={cn('shrink-0 stroke-current', iconSizes[size])} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
})
