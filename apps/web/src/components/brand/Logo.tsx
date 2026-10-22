import lockupUrl from '../../assets/brand/kotak-lockup.svg'
import markUrl from '../../assets/brand/kotak-mark.svg'
import { cn } from '../ui/cn'

export interface LogoProps {
  variant?: 'lockup' | 'mark'
  className?: string
}

// DESIGN.md: never recolour the cat, so the logo ships as fixed-colour SVG files.
export function Logo({ variant = 'lockup', className }: LogoProps) {
  const lockup = variant === 'lockup'

  return (
    <img
      src={lockup ? lockupUrl : markUrl}
      alt="Kotak"
      width={lockup ? 202 : 128}
      height={lockup ? 64 : 128}
      className={cn(lockup ? 'h-8 w-auto' : 'h-10 w-10', className)}
    />
  )
}
