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
// On dark surfaces the black cat and ink wordmark disappear, so the lockup and mark swap to
// the app icon's yellow plate (plus a live wordmark) through the .logo-light / .logo-dark rules.
export function Logo({ variant = 'lockup', className }: LogoProps) {
  const file = files[variant]
  const image = <img src={file.src} alt="Kotak" width={file.width} height={file.height} className={file.size} />

  if (variant === 'icon')
    return (
      <img src={file.src} alt="Kotak" width={file.width} height={file.height} className={cn(file.size, className)} />
    )

  return (
    <span className={className}>
      <span className="logo-light">{image}</span>
      <span role="img" aria-label="Kotak" className="logo-dark items-center gap-2">
        <img
          src={appIconUrl}
          alt=""
          width={128}
          height={128}
          className={variant === 'mark' ? 'h-10 w-10' : 'h-8 w-8'}
        />
        {variant === 'lockup' && <span className="text-title-m font-extrabold lowercase text-text-primary">kotak</span>}
      </span>
    </span>
  )
}
