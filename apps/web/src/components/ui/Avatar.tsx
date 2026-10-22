import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from './cn'

export interface AvatarProps extends ComponentPropsWithoutRef<'div'> {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const circleSizes = {
  sm: 'h-8 w-8 text-label-s',
  md: 'h-10 w-10 text-label-m',
  lg: 'h-11 w-11 text-label-l'
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  { name, size = 'md', className, ...props },
  ref
) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div ref={ref} className={cn('inline-flex shrink-0 items-center gap-2.5', className)} {...props}>
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full on-accent border-[1.5px] border-text-primary bg-accent-box font-sans font-bold text-accent-on-box',
          circleSizes[size]
        )}
        aria-hidden="true"
      >
        {initial}
      </span>
      <span className="font-sans text-label-m font-semibold text-text-primary">{name}</span>
    </div>
  )
})
