import appIconUrl from '../../assets/brand/kotak-app-icon.svg'
import lockupUrl from '../../assets/brand/kotak-lockup.svg'
import markUrl from '../../assets/brand/kotak-mark.svg'
import { cn } from '../ui/cn'

export interface LogoProps {
  variant?: 'lockup' | 'mark' | 'icon'
  className?: string
}

const files = {
  lockup: { src: lockupUrl, width: 202, height: 64, size: 'h-8 w-auto' },
  mark: { src: markUrl, width: 128, height: 128, size: 'h-10 w-10' },
  icon: { src: appIconUrl, width: 128, height: 128, size: 'h-8 w-8' }
}

// DESIGN.md: never recolour the cat, so the logo ships as fixed-colour SVG files.
export function Logo({ variant = 'lockup', className }: LogoProps) {
  const file = files[variant]

  return <img src={file.src} alt="Kotak" width={file.width} height={file.height} className={cn(file.size, className)} />
}
