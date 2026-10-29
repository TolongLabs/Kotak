import type { BundleRoleIndexEntry, Occupation, RoleMatchResponse } from '@kotak/shared'
import { useEffect, useRef, useState } from 'react'
import { SearchField } from '../../components/ui/SearchField'
import { fetchRoleMatch, type ApiResult, type RoleAlias } from '../../engine/api'
import {
  closestRoles,
  getRoleDisplayTitle,
  getSuggestedRoles,
  hasExactMatch,
  looksLikeSituation,
  normalizeJobQuery,
  searchRoles
} from './roleSearch'
import { SuggestionList, roleOptions, useSuggestionList } from './SuggestionList'

// The user's job title on the check-up start: local O*NET and market titles as they type, then Kopi's match through
// /api/roles/match for any other title. The list stays folded until they type (#225), and an unknown title shows
// "No match yet" with three picks inside the list instead of replacing the page (#226).

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

  const options = roleOptions(
    remoteRole && remote?.status === 'available' ? { role: remoteRole, source: remote.data.match_source } : null,
    suggestions,
    picks,
    accept
  )
  const list = useSuggestionList(options, listOpen, key, () => setOpen(true))

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
            list.onKeyDown(event)
            if (event.defaultPrevented || event.key !== 'Enter') return
            event.preventDefault()
            if (key && !exact && !accepted) setSubmitted({ key, version: (submitted?.version ?? 0) + 1 })
          }}
          onFocus={() => setOpen(true)}
          {...list.inputProps}
        />
        {listOpen && (
          <SuggestionList
            list={list}
            label={`${label} Suggestions`}
            status={
              waiting ? 'Kopi is matching your title…' : noMatch && 'No match yet. Try a simpler title, or pick one:'
            }
            footnote={suggestions.length > 0 && 'Can’t find it? Type any title and Kopi will match it.'}
          />
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
