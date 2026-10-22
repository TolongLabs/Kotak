import { forwardRef, type ComponentPropsWithoutRef, type ComponentType, type ReactNode } from 'react'
import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cn } from './cn'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  type: ToastType
  title: string
  body?: string
  action?: ReactNode
}

export interface ToastItemProps extends ToastProps {
  id: string
}

export interface ToastRegionProps extends ComponentPropsWithoutRef<'div'> {
  toasts: ToastItemProps[]
}

const iconByType: Record<
  ToastType,
  ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
> = {
  success: CircleCheck,
  error: TriangleAlert,
  info: Info
}

const cardClassesByType: Record<ToastType, string> = {
  success: 'bg-text-primary text-bg-default',
  error: 'border-[1.5px] border-state-error bg-bg-default text-text-primary',
  info: 'border border-border-subtle bg-bg-panel text-text-primary'
}

const iconClassesByType: Record<ToastType, string> = {
  success: 'text-accent-box',
  error: 'text-state-error',
  info: 'text-text-primary'
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { type, title, body, action, className, ...props },
  ref
) {
  const Icon = iconByType[type]
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 rounded-md px-4 py-3 text-body-s shadow-[var(--shadow-popover)]',
        cardClassesByType[type],
        className
      )}
      {...props}
    >
      <Icon className={cn('h-5 w-5 shrink-0', iconClassesByType[type])} aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-label-m">{title}</span>
        {body ? <span className="text-body-s">{body}</span> : null}
      </div>
      {action ? <div className="ml-auto shrink-0 pl-3">{action}</div> : null}
    </div>
  )
})

export const ToastRegion = forwardRef<HTMLDivElement, ToastRegionProps>(function ToastRegion(
  { toasts, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      aria-live="polite"
      className={cn('fixed inset-x-0 bottom-0 z-50 flex flex-col items-end px-4 pb-4 sm:px-6 sm:pb-6', className)}
      {...props}
    >
      <div className="flex w-full max-w-md flex-col gap-3">
        {toasts.map(({ id, ...toastProps }) => (
          <Toast key={id} {...toastProps} />
        ))}
      </div>
    </div>
  )
})
