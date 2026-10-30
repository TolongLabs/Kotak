import { commonText } from '../../i18n/common'
import { useText } from '../../i18n/text'
import { cn } from './cn'

// A solid placeholder block that pulses while content loads (static under reduced motion).
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-bg-panel', className)} />
}

// Page-level loading state: the shape of a view's heading and first cards.
export function ViewLoading({ label }: { label?: string }) {
  const common = useText(commonText)
  const resolvedLabel = label ?? common.loading
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">{resolvedLabel}</span>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  )
}
