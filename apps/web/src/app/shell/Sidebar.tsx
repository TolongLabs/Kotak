import { Lock } from 'lucide-react'
import { useId } from 'react'
import { Logo } from '../../components/brand/Logo'
import { Tooltip } from '../../components/ui/Tooltip'
import { cn } from '../../components/ui/cn'
import { Link } from '../router'
import { routes } from '../routes'
import { navItems } from './nav'

interface BrandProps {
  compact?: boolean
  onNavigate?: () => void
}

export function Brand({ compact = false, onNavigate }: BrandProps) {
  return (
    <Link
      to={routes.home}
      onClick={onNavigate}
      aria-label="Kotak Home"
      className="inline-flex items-center gap-2 rounded-sm"
    >
      <Logo variant="icon" />
      {!compact && (
        <span aria-hidden="true" className="text-title-m font-extrabold lowercase">
          kotak
        </span>
      )}
    </Link>
  )
}

interface NavListProps {
  path: string
  collapsed?: boolean
  onNavigate?: () => void
}

export function NavList({ path, collapsed = false, onNavigate }: NavListProps) {
  return (
    <ul className={cn('flex flex-col gap-2', collapsed && 'items-center')}>
      {navItems.map(({ label, to, icon: Icon, match }) => {
        const active = match.includes(path)
        const link = (
          <Link
            to={to}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            aria-label={collapsed ? label : undefined}
            className={cn(
              'flex h-11 items-center gap-3 rounded-sm border-[1.5px] text-label-l transition-colors duration-150 ease-out',
              collapsed ? 'w-11 justify-center' : 'px-3',
              active
                ? 'border-text-primary bg-accent-box text-accent-on-box'
                : 'border-transparent bg-bg-panel text-text-primary hover:border-border-control hover:bg-bg-default'
            )}
          >
            <Icon className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
            {!collapsed && label}
          </Link>
        )

        return <li key={to}>{collapsed ? <Tooltip content={label}>{link}</Tooltip> : link}</li>
      })}
    </ul>
  )
}

const GUEST_NOTE = 'Your check-up stays on this device. Accounts open after the pilot.'

export function GuestCard({ collapsed = false }: { collapsed?: boolean }) {
  const titleId = useId()

  if (collapsed) {
    return (
      <Tooltip content={`Guest Mode: ${GUEST_NOTE}`}>
        <span tabIndex={0} className="surface-card inline-flex h-11 w-11 items-center justify-center">
          <Lock className="h-5 w-5 stroke-current" aria-hidden="true" />
          <span className="sr-only">Guest Mode</span>
        </span>
      </Tooltip>
    )
  }

  return (
    <section aria-labelledby={titleId} className="surface-card space-y-2 p-4">
      <h2 id={titleId} className="flex items-center gap-2 text-label-l text-text-primary">
        <Lock className="h-4 w-4 stroke-current" aria-hidden="true" />
        Guest Mode
      </h2>
      <p className="text-body-s text-text-muted">{GUEST_NOTE}</p>
    </section>
  )
}

interface SidebarProps {
  path: string
  collapsed?: boolean
  className?: string
}

export function Sidebar({ path, collapsed = false, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 h-dvh shrink-0 flex-col gap-8 border-r border-border-subtle bg-bg-panel py-6',
        collapsed ? 'w-18 items-center px-3' : 'w-64 px-4',
        className
      )}
    >
      <Brand compact={collapsed} />
      <nav aria-label="Main">
        <NavList path={path} collapsed={collapsed} />
      </nav>
      <div className="mt-auto">
        <GuestCard collapsed={collapsed} />
      </div>
    </aside>
  )
}
