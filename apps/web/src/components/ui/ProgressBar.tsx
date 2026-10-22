import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from './cn'

export interface ProgressBarProps extends ComponentPropsWithoutRef<'div'> {
  value: number
  max?: number
  label: string
  valueText?: string
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar(
  { value, max = 100, label, valueText, className, ...props },
  ref
) {
  const clampedMax = max > 0 ? max : 100
  const clampedValue = Math.min(clampedMax, Math.max(0, value))
  const percentage = Math.round((clampedValue / clampedMax) * 100)
  const displayValue = valueText ?? `${percentage}%`

  return (
    <div ref={ref} className={cn('w-full space-y-1.5', className)} {...props}>
      <div className="flex items-center justify-between text-label-s text-text-primary">
        <span className="font-sans font-medium">{label}</span>
        <span className="font-mono text-mono-s text-text-muted">{displayValue}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={clampedMax}
        aria-valuetext={displayValue}
        className="h-2.5 w-full overflow-hidden rounded-full border border-border-subtle bg-bg-panel"
      >
        <div
          className="h-full bg-text-primary transition-[width] duration-150 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
})
