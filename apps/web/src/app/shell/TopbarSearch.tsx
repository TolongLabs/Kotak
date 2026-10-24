import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { SearchField } from '../../components/ui/SearchField'
import { cn } from '../../components/ui/cn'
import { useRoleIndex } from '../../engine/bundle'
import { normalizeJobQuery, searchRoles } from '../../views/checkup/roleSearch'
import { navigate } from '../router'
import { jobPath, routes } from '../routes'

// The top-bar job search: matching jobs float under the field as you type, and a pick opens that job's page (#303).
// Enter on a typed title with no match still goes to the check-up, as before.
export const TopbarSearch = forwardRef<HTMLInputElement>(function TopbarSearch(_, ref) {
  const index = useRoleIndex()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()
  const wrapperRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const key = normalizeJobQuery(query)
  const matches = index.status === 'ready' ? searchRoles(index.data.roles, [], key) : []
  const listOpen = open && key.length > 0 && index.status === 'ready'

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  function pick(code: string) {
    setOpen(false)
    setQuery('')
    navigate(jobPath(code))
  }

  return (
    <form
      ref={wrapperRef}
      role="search"
      className="relative w-full min-w-0 max-w-[360px]"
      onSubmit={(event) => {
        event.preventDefault()
        const match = matches[active]
        if (listOpen && match) return pick(match.role.onet_code)
        const job = query.trim()
        setOpen(false)
        navigate(job ? `${routes.checkUp}?job=${encodeURIComponent(job)}` : routes.checkUp)
      }}
    >
      <SearchField
        ref={(node) => {
          inputRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        name="job"
        label="Search Jobs"
        hideLabel
        placeholder="Search 900 Jobs"
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.currentTarget.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          // Tab away closes the list; a press inside it is handled by the click, so keep it open for that.
          if (!wrapperRef.current?.contains(event.relatedTarget)) setOpen(false)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
          if (!listOpen || matches.length === 0) return
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            const step = event.key === 'ArrowDown' ? 1 : -1
            setActive((current) => (current + step + matches.length) % matches.length)
          }
        }}
        role="combobox"
        aria-expanded={listOpen}
        aria-controls={listOpen ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={listOpen && matches.length ? `${listId}-${active}` : undefined}
        shortcutHint="/"
      />
      {listOpen && (
        <ul
          id={listId}
          aria-label="Job Suggestions"
          className="absolute left-0 right-0 top-full z-30 mt-2 space-y-0.5 rounded-md border border-border-subtle bg-bg-default p-1 shadow-popover"
        >
          {matches.length === 0 && <li className="px-3 py-2 text-body-s text-text-muted">No match yet</li>}
          {matches.map((match, i) => (
            <li
              key={match.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // The input keeps focus, so a mouse press must not blur it before the click lands.
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(match.role.onet_code)}
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2 text-body-s text-text-primary',
                i === active ? 'bg-accent-box text-accent-on-box' : 'hover:bg-bg-panel'
              )}
            >
              <span className="min-w-0 break-words text-label-l">{match.label}</span>
              <span className="shrink-0 font-mono text-mono-s">{match.role.onet_code}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
})
