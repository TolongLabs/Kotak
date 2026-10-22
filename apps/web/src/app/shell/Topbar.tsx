import { CalendarDays, ChevronDown, Menu, UserRound } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { SearchField } from '../../components/ui/SearchField'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { cn } from '../../components/ui/cn'
import { navigate } from '../router'
import { routes } from '../routes'
import { Brand } from './Sidebar'

export function DataChip({
  label,
  compact = false,
  className
}: {
  label: string
  compact?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-2 rounded-full border border-border-subtle bg-bg-default px-3 font-mono text-mono-s text-text-muted',
        compact && 'gap-1 px-2',
        className
      )}
    >
      <CalendarDays className={cn('shrink-0 stroke-current', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} aria-hidden="true" />
      {label}
    </span>
  )
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

export function Topbar({ dataLabel, className }: { dataLabel: string; className?: string }) {
  const searchRef = useRef<HTMLInputElement>(null)
  const guestMenuRef = useRef<HTMLDivElement>(null)
  const guestMenuButtonRef = useRef<HTMLButtonElement>(null)
  const [guestMenuOpen, setGuestMenuOpen] = useState(false)

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      event.preventDefault()
      searchRef.current?.focus()
    }

    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  useEffect(() => {
    if (!guestMenuOpen) return

    function closeMenu(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setGuestMenuOpen(false)
      guestMenuButtonRef.current?.focus()
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (guestMenuRef.current && !guestMenuRef.current.contains(event.target as Node)) setGuestMenuOpen(false)
    }

    window.addEventListener('keydown', closeMenu)
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => {
      window.removeEventListener('keydown', closeMenu)
      document.removeEventListener('pointerdown', closeOnOutsideClick)
    }
  }, [guestMenuOpen])

  return (
    <header className={cn('surface-glass h-16 items-center gap-4 rounded-md px-4', className)}>
      <form
        role="search"
        className="w-full max-w-[360px]"
        onSubmit={(event) => {
          event.preventDefault()
          const job = String(new FormData(event.currentTarget).get('job') ?? '').trim()
          navigate(job ? `${routes.checkUp}?job=${encodeURIComponent(job)}` : routes.checkUp)
        }}
      >
        <SearchField ref={searchRef} name="job" label="Search Jobs" hideLabel placeholder="Search 900 Jobs" />
      </form>
      <div className="ml-auto flex items-center gap-6">
        <DataChip label={`Data ${dataLabel}`} />
        <div className="relative shrink-0" ref={guestMenuRef}>
          <button
            ref={guestMenuButtonRef}
            type="button"
            aria-label="Guest Menu"
            aria-expanded={guestMenuOpen}
            aria-controls="guest-menu"
            onClick={() => setGuestMenuOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-sm text-label-m text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-text-primary bg-accent-box text-accent-on-box">
              <UserRound className="h-5 w-5 stroke-current" aria-hidden="true" />
            </span>
            Guest
            <ChevronDown className="h-4 w-4 stroke-current" aria-hidden="true" />
          </button>
          <div
            id="guest-menu"
            className={cn(
              'surface-card absolute right-0 top-full z-30 mt-2 min-w-48 items-center justify-between gap-4 p-3 shadow-popover',
              guestMenuOpen ? 'flex' : 'hidden'
            )}
          >
            <span className="text-label-m text-text-primary">Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

interface PhoneTopBarProps {
  dataLabel: string
  onOpenMenu: () => void
  menuButtonRef: RefObject<HTMLButtonElement | null>
  className?: string
}

export function PhoneTopBar({ dataLabel, onOpenMenu, menuButtonRef, className }: PhoneTopBarProps) {
  return (
    <header className={cn('surface-glass h-14 items-center gap-2 rounded-full pl-1 pr-2', className)}>
      <button
        ref={menuButtonRef}
        type="button"
        aria-label="Open Menu"
        onClick={onOpenMenu}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-default text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel"
      >
        <Menu className="h-5 w-5 stroke-current" aria-hidden="true" />
      </button>
      <Brand />
      <DataChip label={dataLabel} compact className="ml-auto" />
    </header>
  )
}
