import type { Occupation, RoleMatchResponse } from '@kotak/shared'
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../components/ui/cn'
import { checkupText } from '../../i18n/messages/checkup'
import { textNow } from '../../i18n/text'
import { getRoleCodeLine, getRoleDisplayTitle, type RoleSuggestion } from './roleSearch'

// The suggestion list under the job and target-role fields and the top-bar search, an ARIA combobox: focus stays in
// the field, the arrow keys move the highlight, Enter picks it and one Tab leaves the field (#319, #320, #372).

export type SuggestionOption = { key: string; title: string; detail: string; pick: () => void }

type Role = Pick<Occupation, 'onet_code' | 'title'>

// Kopi's match first, then the local titles, then the "No match yet" picks.
export function roleOptions(
  match: { role: Role; source: RoleMatchResponse['match_source'] } | null,
  suggestions: RoleSuggestion[],
  picks: Role[],
  pick: (role: Role, label?: string) => void
): SuggestionOption[] {
  const t = textNow(checkupText)
  return [
    ...(match
      ? [
          {
            key: 'kopi',
            title: t.roleSearch.match(getRoleDisplayTitle(match.role)),
            detail:
              getRoleCodeLine(match.role) +
              (match.source === 'claude' ? t.roleSearch.matchedByClaude : '') +
              (match.source === 'title_search' ? t.roleSearch.matchedByTitleSearch : ''),
            pick: () => pick(match.role)
          }
        ]
      : []),
    ...suggestions.map((suggestion) => ({
      key: suggestion.key,
      title: suggestion.label,
      detail: suggestion.codeLine,
      pick: () => pick(suggestion.role, suggestion.label)
    })),
    ...picks.map((role) => ({
      key: role.onet_code,
      title: getRoleDisplayTitle(role),
      detail: getRoleCodeLine(role),
      pick: () => pick(role)
    }))
  ]
}

export function useSuggestionList(options: SuggestionOption[], open: boolean, query: string, reopen: () => void) {
  const id = useId()
  // The highlight follows an option rather than a row, so Kopi's match landing on top doesn't move it; typing resets it.
  const [highlight, setHighlight] = useState<{ query: string; key: string } | null>(null)
  const found = highlight?.query === query ? options.findIndex((option) => option.key === highlight.key) : -1
  const active = Math.max(found, 0)
  const shown = open && options.length > 0

  const highlightAt = (index: number) => setHighlight({ query, key: options[index]!.key })

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Keys while an input method is composing belong to it, not the list; Safari sends its confirming Enter as 229.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (!shown) {
      // ArrowDown reopens a list closed with Escape.
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        reopen()
      }
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const next = (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
      highlightAt(next)
      document.getElementById(`${id}-${next}`)?.scrollIntoView({ block: 'nearest' })
    } else if (event.key === 'Enter') {
      event.preventDefault()
      options[active]!.pick()
    }
  }

  return {
    id,
    options,
    active,
    shown,
    highlightAt,
    onKeyDown,
    inputProps: {
      role: 'combobox',
      'aria-autocomplete': 'list' as const,
      'aria-expanded': shown,
      'aria-controls': shown ? id : undefined,
      'aria-activedescendant': shown ? `${id}-${active}` : undefined
    }
  }
}

// The popup: a status line above the options (matching, or "No match yet"), the options, then an optional footnote.
// `inline` puts each option's detail beside its title, as the top-bar search has since #319.
export function SuggestionList({
  list,
  label,
  status,
  footnote,
  inline = false
}: {
  list: ReturnType<typeof useSuggestionList>
  label: string
  status?: ReactNode
  footnote?: ReactNode
  inline?: boolean
}) {
  return (
    <div
      // Picking an option keeps focus in the field, so Safari does not blur and drop the click.
      onMouseDown={(event) => event.preventDefault()}
      // A scroll box with nothing focusable inside is a Tab stop in Chrome and Firefox; Tab must leave the field at once.
      tabIndex={-1}
      className="absolute inset-x-0 top-full z-20 mt-1 max-h-[60vh] space-y-0.5 overflow-y-auto rounded-md border border-border-subtle bg-bg-default p-1 shadow-popover"
    >
      {status && (
        <p aria-live="polite" className="px-3 py-2 text-body-s text-text-muted">
          {status}
        </p>
      )}
      {list.shown && (
        <ul id={list.id} role="listbox" aria-label={label} className="space-y-0.5">
          {list.options.map((option, index) => (
            <li
              key={option.key}
              id={`${list.id}-${index}`}
              role="option"
              aria-selected={index === list.active}
              // Mouse moves, not mouse enters, so a list scrolled by the arrow keys under a still pointer keeps its row.
              onMouseMove={() => index !== list.active && list.highlightAt(index)}
              onClick={option.pick}
              className={cn(
                // The scroll margin keeps the highlighted row clear of the floating Ask Kopi button.
                'flex min-h-11 w-full min-w-0 scroll-mb-(--ask-kopi-clearance) cursor-pointer rounded-sm border-[1.5px] px-3 py-2 text-left text-text-primary transition-colors duration-150 ease-out',
                inline ? 'items-center justify-between gap-3' : 'flex-col items-start justify-center gap-1',
                // Yellow on white gets an ink outline (DESIGN.md colour rules), so the highlight doesn't rely on colour alone.
                index === list.active ? 'on-accent border-text-primary bg-accent-box' : 'border-transparent'
              )}
            >
              <span className="w-full break-words text-label-l">{option.title}</span>
              <span className={cn('font-mono text-mono-s', inline ? 'shrink-0' : 'text-text-muted')}>
                {option.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
      {footnote && <p className="px-2 py-1 text-body-s text-text-muted">{footnote}</p>}
    </div>
  )
}
