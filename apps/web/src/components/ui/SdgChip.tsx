import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from './cn'

export type SdgGoal = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17

export interface SdgChipProps extends ComponentPropsWithoutRef<'span'> {
  goal: SdgGoal | number
  /** Shows this target of the goal, such as `4.4`, in place of the goal number. */
  target?: string
  compact?: boolean
}

export const SDG_NAMES: Record<number, string> = {
  1: 'No Poverty',
  2: 'Zero Hunger',
  3: 'Good Health',
  4: 'Quality Education',
  5: 'Gender Equality',
  6: 'Clean Water',
  7: 'Clean Energy',
  8: 'Decent Work',
  9: 'Industry and Innovation',
  10: 'Reduced Inequalities',
  11: 'Sustainable Cities',
  12: 'Responsible Consumption',
  13: 'Climate Action',
  14: 'Life Below Water',
  15: 'Life on Land',
  16: 'Peace and Justice',
  17: 'Partnerships'
}

export const SdgChip = forwardRef<HTMLSpanElement, SdgChipProps>(function SdgChip(
  { goal, target, compact = false, className, style, children, ...props },
  ref
) {
  const name = SDG_NAMES[goal] ?? `Goal ${goal}`
  const fullLabel = `SDG ${target ?? goal}: ${name}`
  const known = Number.isInteger(goal) && goal >= 1 && goal <= 17

  return (
    <span
      ref={ref}
      title={compact ? fullLabel : undefined}
      aria-label={compact ? fullLabel : undefined}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-sans text-label-s transition-opacity',
        !known && 'border border-border-control bg-bg-panel text-text-primary',
        className
      )}
      style={
        known
          ? { backgroundColor: `var(--color-sdg-${goal})`, color: `var(--color-sdg-${goal}-text)`, ...style }
          : style
      }
      {...props}
    >
      <strong className="font-bold">SDG {target ?? goal}</strong>
      {!compact && <span>{name}</span>}
      {children}
    </span>
  )
})
