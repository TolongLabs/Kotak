import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from './cn'

export interface SpinnerProps extends ComponentPropsWithoutRef<'span'> {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { label = 'Loading', size = 'md', className, ...props },
  ref
) {
  return (
    <span
      ref={ref}
      role="status"
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      {...props}
    >
      <svg
        className={cn('animate-spin text-text-primary', sizeClasses[size])}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path
          className="opacity-100"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  )
})
