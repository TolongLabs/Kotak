import { useId, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from '../../app/router'
import { routes } from '../../app/routes'
import { Logo } from '../../components/brand/Logo'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { LandingActionLink } from './LandingActionLink'

const anchorClass =
  'inline-flex min-h-11 items-center justify-center rounded-sm px-3 text-label-m text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default'

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl justify-center lg:px-10">
      <nav
        aria-label="Main Navigation"
        className="surface-glass flex w-full items-center justify-between gap-2 rounded-full p-1.5 pl-3 lg:w-auto lg:gap-3 lg:px-3"
      >
        <Link
          to="/"
          aria-label="Kotak Home"
          className="flex min-h-11 items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default"
        >
          <Logo variant="icon" className="h-8 w-8 lg:hidden" />
          <span className="text-title-s font-extrabold lowercase text-text-primary lg:hidden">kotak</span>
          <Logo variant="lockup" className="hidden h-8 w-auto lg:block" />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <a href="#how-it-works" className={anchorClass}>
            How It Works
          </a>
          <a href="#data-sources" className={anchorClass}>
            Data Sources
          </a>
          <Link to={routes.signIn} className={anchorClass}>
            Sign In
          </Link>
          <LandingActionLink
            to={routes.checkUp}
            variant="primary"
            showArrow={false}
            className="min-h-11 px-4 text-label-m"
          >
            Start
          </LandingActionLink>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            aria-label={menuOpen ? 'Close Navigation' : 'Open Navigation'}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-default text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div
          id={menuId}
          className="surface-card absolute right-0 top-full mt-3 flex w-full max-w-sm flex-col gap-2 rounded-md p-3 shadow-[var(--shadow-popover)] lg:hidden"
        >
          <a href="#how-it-works" className={anchorClass} onClick={closeMenu}>
            How It Works
          </a>
          <a href="#data-sources" className={anchorClass} onClick={closeMenu}>
            Data Sources
          </a>
          <Link to={routes.signIn} className={anchorClass} onClick={closeMenu}>
            Sign In
          </Link>
          <LandingActionLink to={routes.checkUp} variant="primary" className="w-full" onClick={closeMenu}>
            Start
          </LandingActionLink>
        </div>
      ) : null}
    </header>
  )
}
