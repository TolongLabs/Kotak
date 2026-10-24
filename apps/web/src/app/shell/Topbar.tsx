import { CalendarDays, Menu, UserRound } from 'lucide-react'
import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { cn } from '../../components/ui/cn'
import { useRoleIndex } from '../../engine/bundle'
import { assessedRoleCode, planRoleCodeOf } from '../../engine/checkup'
import { useGuestSession } from '../../session/store'
import { Brand } from './Sidebar'
import { TopbarSearch } from './TopbarSearch'

const listFormat = new Intl.ListFormat('en', { type: 'conjunction' })

/** Each role in play (the assessed role and, if different, the one the roadmap plans for) and whether its skills are
 * AI-drafted. */
function useSkillProvenance() {
  const session = useGuestSession()
  const index = useRoleIndex()
  const codes = [...new Set([assessedRoleCode(session), planRoleCodeOf(session)])].filter(Boolean)
  // A failed lookup must not read as "checked", so it says so instead of hiding the row.
  const failed = codes.length > 0 && index.status === 'error'
  if (index.status !== 'ready') return { roles: [], failed }
  const roles = codes.flatMap((code) => {
    const role = index.data.roles.find((entry) => entry.onet_code === code)
    return role ? [{ title: role.title, drafted: role.quality === 'auto-generated' }] : []
  })
  return { roles, failed }
}

// The data chip opens About This Data: the active snapshot and how each role's skills were made (DESIGN.md "Layout").
// A dot marks the chip while any of those skills are AI-drafted.
export function DataChip({
  snapshot,
  compact = false,
  className
}: {
  snapshot: string
  compact?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const { roles, failed } = useSkillProvenance()
  const draftedTitles = roles.filter((role) => role.drafted).map((role) => role.title)
  const checkedTitles = roles.filter((role) => !role.drafted).map((role) => role.title)
  const drafted = draftedTitles.length > 0

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node) || !wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      // Only pull focus back when it was on the chip or nowhere, not from a field the user moved to.
      const active = document.activeElement
      if (active === document.body || wrapperRef.current?.contains(active)) buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div
      ref={wrapperRef}
      className={cn('relative shrink-0', className)}
      onBlur={(event) => {
        // Tabbing to anything outside closes the popover; a click inside its text moves focus nowhere and keeps it.
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          // The pseudo-element stretches the 28 px chip to a 44 px touch target.
          "relative inline-flex h-7 items-center gap-2 rounded-full border border-border-subtle bg-bg-default px-3 font-mono text-mono-s text-text-muted transition-colors duration-150 ease-out after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] hover:border-border-control hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
          compact && 'gap-1 px-2'
        )}
      >
        <CalendarDays
          className={cn('shrink-0 stroke-current', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')}
          aria-hidden="true"
        />
        {compact ? snapshot : `Data ${snapshot}`}
        {drafted && (
          <>
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-text-primary" />
            <span className="sr-only">, AI-drafted skills</span>
          </>
        )}
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] space-y-3 rounded-md border border-border-subtle bg-bg-default p-4 text-left shadow-popover"
        >
          <p className="text-label-m text-text-primary">About This Data</p>
          <dl className="space-y-3">
            <div className="space-y-0.5">
              <dt className="font-mono text-mono-s text-text-muted">Snapshot</dt>
              <dd className="text-body-s text-text-primary">{snapshot}</dd>
            </div>
            {failed && (
              <div className="space-y-0.5">
                <dt className="font-mono text-mono-s text-text-muted">Skills</dt>
                <dd className="text-body-s text-text-primary">Kotak couldn’t load how this job’s skills were made.</dd>
              </div>
            )}
            {roles.length > 0 && (
              <div className="space-y-0.5">
                <dt className="font-mono text-mono-s text-text-muted">Skills</dt>
                {draftedTitles.length > 0 && (
                  <dd className="text-body-s text-text-primary">
                    {listFormat.format(draftedTitles)}: Kopi drafted these skills from{' '}
                    {draftedTitles.length > 1 ? 'each job’s' : 'the job’s'} O*NET tasks. The team has not checked them
                    by hand yet.
                  </dd>
                )}
                {checkedTitles.length > 0 && (
                  <dd className="text-body-s text-text-primary">
                    {listFormat.format(checkedTitles)}: checked by hand by the Kotak team.
                  </dd>
                )}
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
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
      <TopbarSearch ref={searchRef} />
      <div className="ml-auto flex items-center gap-3">
        <DataChip snapshot={dataLabel} />
        <div className="inline-flex shrink-0 items-center gap-2 text-label-m text-text-primary">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-text-primary bg-accent-box text-accent-on-box">
            <UserRound className="h-5 w-5 stroke-current" aria-hidden="true" />
          </span>
          Guest
        </div>
        <ThemeToggle />
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
      <DataChip snapshot={dataLabel} compact className="ml-auto" />
    </header>
  )
}
