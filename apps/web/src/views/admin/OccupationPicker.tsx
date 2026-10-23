import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { TextField } from '../../components/ui/TextField'
import { fetchRoleMatch } from '../../engine/api'
import { errorMessage, isHandledError, type Occupation, type RequestScraper } from './scraper'

// How the check-up's own title matcher found its occupation: Claude's pick, an exact O*NET title or alternate title,
// or the closest title search hit when Claude could not help, which most needs checking.
type Suggestion = 'kopi' | 'exact' | 'closest'
type Choice = Occupation & { suggestion: Suggestion | null }

const suggestionNote: Record<Suggestion, string> = {
  kopi: 'Kopi’s match',
  exact: 'Exact O*NET title',
  closest: 'Closest title search match, check it'
}

// Picks the O*NET occupation a search title is for. The check-up's title matcher comes first, then O*NET title search
// hits; the admin can search again with other words. Nothing is chosen until the admin picks one.
export function OccupationPicker({
  request,
  initialQuery,
  value,
  onChange
}: {
  request: RequestScraper
  initialQuery: string
  value: Occupation | null
  onChange: (occupation: Occupation | null) => void
}) {
  const [query, setQuery] = useState(initialQuery)
  const [choices, setChoices] = useState<Choice[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchId = useRef(0)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const search = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (trimmed.length < 2) {
        setError('Type at least 2 characters.')
        return
      }
      const id = ++searchId.current
      setSearching(true)
      setError(null)
      onChangeRef.current(null)
      try {
        const [found, match] = await Promise.all([
          request(`/occupations?q=${encodeURIComponent(trimmed)}`) as Promise<{ occupations: Occupation[] }>,
          fetchRoleMatch(trimmed)
        ])
        if (id !== searchId.current) return
        const matched = match.status === 'available' && match.data.occupation ? match.data : null
        const suggestion: Choice | null = matched?.occupation
          ? {
              onet_code: matched.occupation.onet_code,
              title: matched.occupation.title,
              suggestion: matched.fallback_reason ? 'closest' : matched.match_source === 'claude' ? 'kopi' : 'exact'
            }
          : null
        setChoices([
          ...(suggestion ? [suggestion] : []),
          ...found.occupations
            .filter((occupation) => occupation.onet_code !== suggestion?.onet_code)
            .map((occupation) => ({ ...occupation, suggestion: null }))
        ])
        setSearched(true)
      } catch (cause) {
        if (id !== searchId.current || isHandledError(cause)) return
        setError(errorMessage(cause))
      } finally {
        if (id === searchId.current) setSearching(false)
      }
    },
    [request]
  )

  useEffect(() => {
    if (initialQuery.trim().length >= 2) void search(initialQuery)
    return () => {
      searchId.current += 1
    }
  }, [initialQuery, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <TextField
            label="Search O*NET Occupations"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void search(query)
              }
            }}
          />
        </div>
        <Button variant="secondary" loading={searching} onClick={() => void search(query)}>
          Search
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-body-s text-state-error">
          {error}
        </p>
      )}
      {searched && !choices.length && !searching && (
        <p role="status" className="text-body-s text-text-muted">
          No occupation matched. Try a broader title, such as “designer” or “accountant”.
        </p>
      )}
      {choices.length > 0 && (
        <RadioGroup
          label="O*NET Occupation"
          value={value?.onet_code ?? ''}
          onChange={(code) => {
            const choice = choices.find((item) => item.onet_code === code)
            onChange(choice ? { onet_code: choice.onet_code, title: choice.title } : null)
          }}
          options={choices.map((choice) => ({
            value: choice.onet_code,
            label: choice.title,
            description: choice.suggestion
              ? `${choice.onet_code} · ${suggestionNote[choice.suggestion]}`
              : choice.onet_code
          }))}
        />
      )}
    </div>
  )
}
