import { LogOut, PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react'
import { useId } from 'react'
import { Logo } from '../../components/brand/Logo'
import { Button } from '../../components/ui/Button'
import { Tooltip } from '../../components/ui/Tooltip'
import { cn } from '../../components/ui/cn'
import { resetGuestSession } from '../../session/store'
import { Link, navigate } from '../router'
import { routes } from '../routes'
import { navItems } from './nav'

interface BrandProps {
  onNavigate?: () => void
}

export function Brand({ onNavigate }: BrandProps) {
  return (
    <Link
      to={routes.home}
      onClick={onNavigate}
      aria-label="Kotak Home"
      className="inline-flex items-center gap-2 rounded-sm"
    >
      <Logo variant="lockup" />
    </Link>
  )
}

function SidebarBrand({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const ActionIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <button
      type="button"
      aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      aria-expanded={!collapsed}
      aria-controls="sidebar-navigation"
      onClick={onToggle}
      className={cn(
        'group relative inline-flex h-8 w-full items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel',
        collapsed ? 'justify-center' : 'justify-start px-2'
      )}
    >
      <span
        aria-hidden="true"
        className="transition-opacity duration-150 group-hover:opacity-0 group-focus-visible:opacity-0"
      >
        <Logo variant={collapsed ? 'icon' : 'lockup'} />
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-0 flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100',
          collapsed ? 'justify-center' : 'justify-start px-2'
        )}
      >
        <ActionIcon className="h-5 w-5 stroke-current" />
      </span>
    </button>
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

const GUEST_NOTE = 'Your check-up stays on this device.'

function signOut() {
  resetGuestSession()
  navigate(routes.landing)
}

export function GuestCard({ collapsed = false }: { collapsed?: boolean }) {
  const titleId = useId()

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Tooltip content={`Guest: ${GUEST_NOTE}`}>
          <span tabIndex={0} className="surface-card inline-flex h-11 w-11 items-center justify-center">
            <UserRound className="h-5 w-5 stroke-current" aria-hidden="true" />
            <span className="sr-only">Guest</span>
          </span>
        </Tooltip>
        <Tooltip content="Sign Out">
          <button
            type="button"
            aria-label="Sign Out"
            onClick={signOut}
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-text-primary transition-colors hover:bg-bg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <LogOut className="h-5 w-5 stroke-current" aria-hidden="true" />
          </button>
        </Tooltip>
      </div>
    )
  }

  return (
    <section aria-labelledby={titleId} className="surface-card space-y-2 p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-text-primary bg-accent-box text-accent-on-box">
          <UserRound className="h-5 w-5 stroke-current" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 id={titleId} className="text-label-l text-text-primary">
            Guest
          </h2>
          <p className="text-body-s text-text-muted">{GUEST_NOTE}</p>
        </div>
      </div>
      <Button
        variant="secondary"
        fullWidth
        iconStart={<LogOut className="h-5 w-5 stroke-current" aria-hidden="true" />}
        onClick={signOut}
      >
        Sign Out
      </Button>
    </section>
  )
}

interface SidebarProps {
  path: string
  collapsed?: boolean
  onToggleCollapsed: () => void
  className?: string
}

export function Sidebar({ path, collapsed = false, onToggleCollapsed, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 h-dvh shrink-0 flex-col gap-7 border-r border-border-subtle bg-bg-panel py-6',
        collapsed ? 'w-18 items-center px-3' : 'w-64 px-4',
        className
      )}
    >
      <SidebarBrand collapsed={collapsed} onToggle={onToggleCollapsed} />
      <nav id="sidebar-navigation" aria-label="Main">
        <NavList path={path} collapsed={collapsed} />
      </nav>
      <div className="mt-auto">
        <GuestCard collapsed={collapsed} />
      </div>
    </aside>
  )
}
