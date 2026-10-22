import { CalendarDays, Menu, UserRound } from 'lucide-react'
import { useEffect, useRef, type RefObject } from 'react'
import { SearchField } from '../../components/ui/SearchField'
import { cn } from '../../components/ui/cn'
import { navigate } from '../router'
import { routes } from '../routes'
import { Brand } from './Sidebar'

export function DataChip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-border-subtle bg-bg-default px-3 font-mono text-mono-s text-text-muted',
        className
      )}
    >
      <CalendarDays className="h-4 w-4 stroke-current" aria-hidden="true" />
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

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      event.preventDefault()
      searchRef.current?.focus()
    }

    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  return (
    <header className={cn('surface-glass h-16 items-center gap-4 rounded-md px-4', className)}>
      <form
        role="search"
        className="w-full max-w-sm"
        onSubmit={(event) => {
          event.preventDefault()
          const job = String(new FormData(event.currentTarget).get('job') ?? '').trim()
          navigate(job ? `${routes.checkUp}?job=${encodeURIComponent(job)}` : routes.checkUp)
        }}
      >
        <SearchField ref={searchRef} name="job" label="Search Jobs" hideLabel placeholder="Search 900 Jobs" />
      </form>
      <div className="ml-auto flex items-center gap-4">
        <DataChip label={`Data ${dataLabel}`} />
        <span className="inline-flex items-center gap-2 text-label-l text-text-primary">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-text-primary bg-accent-box text-accent-on-box">
            <UserRound className="h-5 w-5 stroke-current" aria-hidden="true" />
          </span>
          Guest
        </span>
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
      <DataChip label={dataLabel} className="ml-auto" />
    </header>
  )
}
