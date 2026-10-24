import { MAX_TARGETS, type BundleRoleIndexEntry, type Occupation, type RoleMatchResponse } from '@kotak/shared'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { SearchField } from '../../components/ui/SearchField'
import { cn } from '../../components/ui/cn'
import { fetchRoleMatch, type ApiResult, type RoleAlias } from '../../engine/api'
import {
  closestRoles,
  getRoleCodeLine,
  getRoleDisplayTitle,
  getSuggestedRoles,
  hasExactMatch,
  normalizeJobQuery,
  searchRoles
} from './roleSearch'

// Up to three roles the user wants (#284). The first is the one the 12 questions test them against; Roles That Fit
// compares the others beside it. Like the job field, a title in any language that the local list doesn't know goes
// to Kopi's match, and a title nobody can match shows "No match yet" with three picks.

type Role = Pick<Occupation, 'onet_code' | 'title'>

const optionClass =
  'flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-1 rounded-sm px-3 py-2 text-left text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2'

export function TargetPicker({
  roles,
  aliases,
  targets,
  currentCode,
  onChange
}: {
  roles: BundleRoleIndexEntry[]
  aliases: RoleAlias[]
  targets: Role[]
  currentCode: string | null
  onChange: (targets: Role[]) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [match, setMatch] = useState<{ key: string; result: ApiResult<RoleMatchResponse> | null } | null>(null)
  const listId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const key = normalizeJobQuery(query)
  const chosen = new Set(targets.map((target) => target.onet_code))
  const allowed = (code: string) => !chosen.has(code) && code !== currentCode
  const suggestions = searchRoles(roles, aliases, key).filter((suggestion) => allowed(suggestion.role.onet_code))
  const needsMatch = key.length > 0 && suggestions.length === 0 && !hasExactMatch(roles, aliases, key)
  const settled = match?.key === key ? match.result : undefined
  const remote =
    settled?.status === 'available' && !settled.data.fallback_reason && settled.data.match_source !== 'none'
      ? settled.data.occupation
      : null
  const waiting = needsMatch && settled === undefined
  const noMatch = needsMatch && settled !== undefined && (!remote || !allowed(remote.onet_code))
  const picks = noMatch
    ? (closestRoles(roles, key).length ? closestRoles(roles, key) : getSuggestedRoles(roles)).filter((role) =>
        allowed(role.onet_code)
      )
    : []
  const full = targets.length >= MAX_TARGETS
  const listOpen = open && !full && (suggestions.length > 0 || waiting || remote !== null || noMatch)

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  // A title the local list doesn't know goes to Kopi's match after a pause, as in the job field.
  useEffect(() => {
    if (!needsMatch) return
    let live = true
    const timer = window.setTimeout(() => {
      void fetchRoleMatch(query.trim()).then((result) => {
        if (live) setMatch({ key, result })
      })
    }, 600)
    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [key, needsMatch, query])

  // Focus stays in the field after adding or removing a role, so the keyboard never drops to the page.
  const add = (role: Role) => {
    onChange([...targets, { onet_code: role.onet_code, title: role.title }])
    setQuery('')
    setOpen(false)
    requestAnimationFrame(() => inputRef.current?.focus())
  }
  const remove = (role: Role) => {
    onChange(targets.filter((other) => other.onet_code !== role.onet_code))
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div
      ref={wrapperRef}
      className="w-full min-w-0 max-w-[532px] space-y-2"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
      onKeyDown={(event) => {
        // Escape closes an open list and keeps the typed text, so the native clear is cancelled here.
        if (event.key !== 'Escape' || !listOpen) return
        event.preventDefault()
        // Focus first: the input's onFocus opens the list, so closing must come after it.
        inputRef.current?.focus()
        setOpen(false)
      }}
    >
      {targets.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Roles You Picked">
          {targets.map((target, index) => (
            <li
              key={target.onet_code}
              className={cn(
                'inline-flex max-w-full items-center gap-1 rounded-full border-[1.5px] py-1 pl-3 pr-1 text-body-s text-text-primary',
                index === 0
                  ? 'border-text-primary bg-accent-box text-accent-on-box'
                  : 'border-border-control bg-bg-default'
              )}
            >
              <span className="min-w-0 break-words">
                {getRoleDisplayTitle(target)}
                {index === 0 && targets.length > 1 && (
                  <span className="sr-only"> (the questions test you on this)</span>
                )}
              </span>
              <button
                type="button"
                aria-label={`Remove ${getRoleDisplayTitle(target)}`}
                onClick={() => remove(target)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {!full && (
        <div className="relative">
          <SearchField
            ref={inputRef}
            label="Target Role"
            hideLabel
            placeholder={targets.length ? 'Add Another Role (Optional)' : 'Type the Role You Want'}
            shortcutHint=""
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            aria-controls={listOpen ? listId : undefined}
            aria-expanded={listOpen}
          />
          {listOpen && (
            <ul
              id={listId}
              aria-label="Target Role Suggestions"
              // Picking an option keeps focus in the field, so Safari does not blur and drop the click.
              onMouseDown={(event) => event.preventDefault()}
              className="absolute inset-x-0 top-full z-20 mt-1 max-h-[60vh] space-y-0.5 overflow-y-auto rounded-md border border-border-subtle bg-bg-default p-1 shadow-popover"
            >
              {waiting && (
                <li aria-live="polite" className="px-3 py-2 text-body-s text-text-muted">
                  Kopi is matching your title…
                </li>
              )}
              {remote && allowed(remote.onet_code) && settled?.status === 'available' && (
                <li>
                  <button type="button" onClick={() => add(remote)} className={cn(optionClass, 'bg-bg-panel')}>
                    <span className="w-full break-words text-label-l">
                      Kopi thinks you mean {getRoleDisplayTitle(remote)}
                    </span>
                    <span className="font-mono text-mono-s text-text-muted">
                      {getRoleCodeLine(remote)}
                      {settled.data.match_source === 'claude' && ' · Matched by Claude'}
                      {settled.data.match_source === 'title_search' && ' · Matched by Title Search'}
                    </span>
                  </button>
                </li>
              )}
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.key}>
                  <button
                    type="button"
                    onClick={() => add(suggestion.role)}
                    className={cn(optionClass, index === 0 && 'bg-bg-panel')}
                  >
                    <span className="w-full break-words text-label-l">{suggestion.label}</span>
                    <span className="font-mono text-mono-s text-text-muted">{suggestion.codeLine}</span>
                  </button>
                </li>
              ))}
              {noMatch && (
                <>
                  <li aria-live="polite" className="px-3 py-2 text-body-s text-text-muted">
                    No match yet. Try a simpler title, or pick one:
                  </li>
                  {picks.map((role) => (
                    <li key={role.onet_code}>
                      <button type="button" onClick={() => add(role)} className={optionClass}>
                        <span className="w-full break-words text-label-l">{getRoleDisplayTitle(role)}</span>
                        <span className="font-mono text-mono-s text-text-muted">{getRoleCodeLine(role)}</span>
                      </button>
                    </li>
                  ))}
                </>
              )}
            </ul>
          )}
        </div>
      )}
      {targets.length > 1 && (
        <p className="text-body-s text-text-muted">
          The questions test you on {getRoleDisplayTitle(targets[0]!)}; Roles That Fit compares the others beside it.
        </p>
      )}
    </div>
  )
}
