import type { BundleRoleIndexEntry, Occupation, RoleMatchResponse } from '@kotak/shared'
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
  looksLikeSituation,
  normalizeJobQuery,
  searchRoles
} from './roleSearch'

// The user's job title on the check-up start: local O*NET and market titles as they type, then Kopi's match through
// /api/roles/match for any other title. The list stays folded until they type (#225), and an unknown title shows
// "No match yet" with three picks inside the list instead of replacing the page (#226).

const optionClass =
  'flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-1 rounded-sm px-3 py-2 text-left text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2'

export function JobSearch({
  roles,
  aliases,
  ready,
  label,
  placeholder,
  accepted,
  onAccept,
  initialQuery
}: {
  roles: BundleRoleIndexEntry[]
  aliases: RoleAlias[]
  ready: boolean
  label: string
  placeholder: string
  accepted: Occupation | null
  onAccept: (role: Pick<Occupation, 'onet_code' | 'title'> | null) => void
  initialQuery: string
}) {
  const [query, setQuery] = useState(initialQuery)
  const [open, setOpen] = useState(initialQuery.length > 0)
  const [matchState, setMatchState] = useState<
    { key: string; status: 'loading' } | { key: string; status: 'settled'; result: ApiResult<RoleMatchResponse> } | null
  >(null)
  const [submitted, setSubmitted] = useState<{ key: string; version: number } | null>(null)
  const listId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // A press outside the field and its list closes the list (#247).
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const key = normalizeJobQuery(query)
  const situation = looksLikeSituation(key)
  const exact = hasExactMatch(roles, aliases, key)
  const suggestions = searchRoles(roles, aliases, key)
  const current = matchState?.key === key ? matchState : null
  const remote = current?.status === 'settled' ? current.result : null
  const remoteRole =
    remote?.status === 'available' && !remote.data.fallback_reason && remote.data.match_source !== 'none'
      ? remote.data.occupation
      : null
  const waiting = ready && key.length > 0 && !exact && !accepted && current?.status !== 'settled'
  const noMatch =
    ready &&
    key.length > 0 &&
    !accepted &&
    suggestions.length === 0 &&
    !remoteRole &&
    (current?.status === 'settled' || !waiting)
  const picks = noMatch ? (closestRoles(roles, key).length ? closestRoles(roles, key) : getSuggestedRoles(roles)) : []
  const listOpen = open && !accepted && (suggestions.length > 0 || waiting || remoteRole !== null || noMatch)

  useEffect(() => {
    if (!ready || !key || exact || accepted) return
    let live = true
    const timer = window.setTimeout(
      () => {
        setMatchState({ key, status: 'loading' })
        void fetchRoleMatch(query.trim()).then((result) => {
          if (live) setMatchState({ key, status: 'settled', result })
        })
      },
      submitted?.key === key ? 0 : 600
    )
    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [accepted, exact, key, query, ready, situation, submitted])

  const accept = (role: Pick<Occupation, 'onet_code' | 'title'>, text = getRoleDisplayTitle(role)) => {
    setQuery(text)
    setOpen(false)
    onAccept(role)
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
      <div className="relative">
        <SearchField
          ref={inputRef}
          label={label}
          placeholder={placeholder}
          shortcutHint=""
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value)
            setOpen(true)
            if (accepted) onAccept(null)
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            if (key && !exact && !accepted) setSubmitted({ key, version: (submitted?.version ?? 0) + 1 })
          }}
          onFocus={() => setOpen(true)}
          aria-controls={listOpen ? listId : undefined}
          aria-expanded={listOpen}
        />
        {listOpen && (
          <ul
            id={listId}
            aria-label={`${label} Suggestions`}
            // Picking an option keeps focus in the field, so Safari does not blur and drop the click.
            onMouseDown={(event) => event.preventDefault()}
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-[60vh] space-y-0.5 overflow-y-auto rounded-md border border-border-subtle bg-bg-default p-1 shadow-popover"
          >
            {waiting && (
              <li aria-live="polite" className="px-3 py-2 text-body-s text-text-muted">
                Kopi is matching your title…
              </li>
            )}
            {remoteRole && remote?.status === 'available' && (
              <li>
                <button type="button" onClick={() => accept(remoteRole)} className={cn(optionClass, 'bg-bg-panel')}>
                  <span className="w-full break-words text-label-l">
                    Kopi thinks you mean {getRoleDisplayTitle(remoteRole)}
                  </span>
                  <span className="font-mono text-mono-s text-text-muted">
                    {getRoleCodeLine(remoteRole)}
                    {remote.data.match_source === 'claude' && ' · Matched by Claude'}
                    {remote.data.match_source === 'title_search' && ' · Matched by Title Search'}
                  </span>
                </button>
              </li>
            )}
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.key}>
                <button
                  type="button"
                  onClick={() => accept(suggestion.role, suggestion.label)}
                  className={cn(optionClass, index === 0 && !remoteRole && 'bg-bg-panel')}
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
                    <button type="button" onClick={() => accept(role)} className={optionClass}>
                      <span className="w-full break-words text-label-l">{getRoleDisplayTitle(role)}</span>
                      <span className="font-mono text-mono-s text-text-muted">{getRoleCodeLine(role)}</span>
                    </button>
                  </li>
                ))}
              </>
            )}
            {suggestions.length > 0 && (
              <li className="px-2 py-1 text-body-s text-text-muted">
                Can’t find it? Type any title and Kopi will match it.
              </li>
            )}
          </ul>
        )}
      </div>
      {situation && !accepted && (
        <p className="text-body-s text-text-muted" role="status">
          That sounds like where you are as well as a job. Pick it under Right Now, I’m, and choose the closest job
          below if you’ve had one.
        </p>
      )}
    </div>
  )
}
