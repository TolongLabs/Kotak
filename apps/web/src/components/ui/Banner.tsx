import { forwardRef, type ComponentPropsWithoutRef, type ComponentType } from 'react'
import { FlaskConical, Info, TriangleAlert } from 'lucide-react'
import { cn } from './cn'

export type BannerType = 'info' | 'error' | 'sample'

interface BannerBaseProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  body?: string
}

export type BannerProps = BannerBaseProps &
  (
    | {
        type: 'info' | 'error'
        title: string
      }
    | {
        type: 'sample'
        title?: string
      }
  )

const iconByType: Record<
  BannerType,
  ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
> = {
  info: Info,
  error: TriangleAlert,
  sample: FlaskConical
}

const cardClassesByType: Record<BannerType, string> = {
  info: 'border border-border-subtle bg-bg-panel text-text-primary',
  error: 'border-[1.5px] border-state-error bg-bg-default text-text-primary',
  sample: 'border border-border-subtle bg-bg-panel text-text-primary'
}

const iconClassesByType: Record<BannerType, string> = {
  info: 'text-text-primary',
  error: 'text-state-error',
  sample: 'text-text-primary'
}

export const Banner = forwardRef<HTMLDivElement, BannerProps>(function Banner(
  { type, title, body, className, ...props },
  ref
) {
  const Icon = iconByType[type]
  const label = title ?? (type === 'sample' ? 'Sample Data' : undefined)
  return (
    <div
      ref={ref}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-4 py-3 text-body-s',
        cardClassesByType[type],
        className
      )}
      {...props}
    >
      <Icon className={cn('h-5 w-5 shrink-0', iconClassesByType[type])} aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-0.5">
        {label ? <span className="text-label-m">{label}</span> : null}
        {body ? <span className="text-body-s text-text-muted">{body}</span> : null}
      </div>
    </div>
  )
})
