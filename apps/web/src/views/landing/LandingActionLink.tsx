import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, type LinkProps } from '../../app/router'
import { cn } from '../../components/ui/cn'

interface LandingActionLinkProps extends LinkProps {
  variant: 'primary' | 'secondary'
  showArrow?: boolean
  children: ReactNode
}

const variantClasses = {
  primary:
    'border-[1.5px] border-text-primary bg-accent-box text-accent-on-box hover:bg-accent-box-hover active:bg-accent-box-hover',
  secondary: 'border-[1.5px] border-text-primary bg-bg-default text-text-primary hover:bg-bg-panel active:bg-bg-panel'
}

export function LandingActionLink({
  variant,
  showArrow = false,
  className,
  children,
  ...props
}: LandingActionLinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        'inline-flex min-h-14 items-center justify-center gap-2 rounded-sm px-6 text-center text-label-l font-semibold transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default',
        variantClasses[variant],
        className
      )}
    >
      <span>{children}</span>
      {showArrow ? <ArrowRight className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" /> : null}
    </Link>
  )
}
