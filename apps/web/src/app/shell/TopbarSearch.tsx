import { forwardRef, useEffect, useRef, useState } from 'react'
import { SearchField } from '../../components/ui/SearchField'
import { useRoleIndex } from '../../engine/bundle'
import { shellText } from '../../i18n/messages/shell'
import { useText } from '../../i18n/text'
import { normalizeJobQuery, searchRoles } from '../../views/checkup/roleSearch'
import { SuggestionList, useSuggestionList } from '../../views/checkup/SuggestionList'
import { navigate } from '../router'
import { jobPath, routes } from '../routes'

// The top-bar job search: matching jobs float under the field as you type, and a pick opens that job's page (#303).
// Enter on a typed title with no match still goes to the check-up, as before.
export const TopbarSearch = forwardRef<HTMLInputElement>(function TopbarSearch(_, ref) {
  const index = useRoleIndex()
  const t = useText(shellText)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const key = normalizeJobQuery(query)
  const matches = index.status === 'ready' ? searchRoles(index.data.roles, [], key) : []
  const listOpen = open && key.length > 0 && index.status === 'ready'
  const list = useSuggestionList(
    matches.map((match) => ({
      key: match.key,
      title: match.label,
      detail: match.role.onet_code,
      pick: () => pick(match.role.onet_code)
    })),
    listOpen,
    key,
    () => setOpen(true)
  )

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
        // Enter on a shown option picks it in the list's key handler, so a submit is a title with no option.
        event.preventDefault()
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
        label={t.topbar.searchJobs}
        hideLabel
        placeholder={t.topbar.searchJobsPlaceholder}
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.currentTarget.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          // Tab away closes the list; a press inside it is handled by the click, so keep it open for that.
          if (!wrapperRef.current?.contains(event.relatedTarget)) setOpen(false)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
          list.onKeyDown(event)
        }}
        {...list.inputProps}
        shortcutHint="/"
      />
      {listOpen && (
        <SuggestionList
          list={list}
          label={t.topbar.jobSuggestions}
          status={matches.length === 0 && t.topbar.noMatchYet}
          inline
        />
      )}
    </form>
  )
})
