import { useEffect, useId, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Switch } from '../../components/ui/Switch'
import { TextField } from '../../components/ui/TextField'
import { OccupationPicker } from './OccupationPicker'
import {
  errorMessage,
  isHandledError,
  jobstreetSearchPreview,
  type Career,
  type Occupation,
  type RequestScraper
} from './scraper'

type CareerChange = Partial<Pick<Career, 'onet_code' | 'daily_refresh' | 'enabled' | 'hidden'>>

// Where a search title stands with the check-up's job-title suggestions.
function checkupStatus(career: Career) {
  if (career.in_checkup) return 'In the check-up’s job titles now.'
  if (career.hidden) return 'Hidden from the check-up.'
  if (!career.onet_code) return 'Set its occupation, then approve listings to add it to the check-up.'
  if (career.approved_count === 0) return 'Joins the check-up once you approve a listing for it.'
  return 'Its occupation is not in the O*NET list, so it stays out of the check-up.'
}

// Search titles: what JobStreet is searched for, which O*NET occupation each search is for, and whether the title
// appears in the check-up's job-title suggestions.
export function SearchTitles({
  careers,
  request,
  onChanged
}: {
  careers: Career[]
  request: RequestScraper
  onChanged: () => Promise<void>
}) {
  const [saving, setSaving] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editOccupation, setEditOccupation] = useState<Occupation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const idPrefix = useId()

  // One change at a time. The switches stay enabled while one saves, so the toggled switch keeps keyboard focus;
  // a change made meanwhile is ignored and the switch shows the saved state.
  async function update(slug: string, change: CareerChange, key: string) {
    if (saving !== null) return false
    setSaving(key)
    setError(null)
    try {
      await request(`/careers/${slug}`, { method: 'PATCH', body: JSON.stringify(change) })
      await onChanged()
      return true
    } catch (cause) {
      if (!isHandledError(cause)) setError(errorMessage(cause))
      return false
    } finally {
      setSaving(null)
    }
  }

  return (
    <section className="surface-card space-y-6 p-5" aria-labelledby="search-titles-heading">
      <div className="space-y-1">
        <h2 id="search-titles-heading" className="text-title-s">
          Search Titles
        </h2>
        <p className="max-w-3xl text-body-s text-text-muted">
          Each title runs one JobStreet keyword search for one O*NET occupation. Use the title Malaysian ads use, not
          the O*NET name. Approving listings from a batch adds the title to the check-up’s job-title suggestions.
        </p>
      </div>

      <AddSearchTitle request={request} onAdded={onChanged} />

      {error && (
        <p role="alert" className="text-body-s text-state-error">
          {error}
        </p>
      )}

      <ul className="grid gap-4 lg:grid-cols-2" aria-label="Search Titles">
        {careers.map((career) => {
          const isEditing = editing === career.slug
          const headingId = `${idPrefix}-${career.slug}`
          const statusId = `${headingId}-checkup`
          return (
            <li key={career.slug} className="min-w-0 space-y-3 rounded-md border border-border-subtle p-4">
              <div className="space-y-1">
                <h3 id={headingId} className="text-label-l">
                  {career.title}
                </h3>
                <a
                  href={career.search_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-body-s text-text-muted underline underline-offset-4 hover:text-text-primary"
                >
                  {career.search_url.replace('https://', '')}
                </a>
              </div>

              <div className="space-y-1 text-body-s">
                <p>
                  <span className="text-text-muted">Occupation: </span>
                  {career.onet_code ? (
                    <>
                      {career.occupation_title ?? 'Unknown'} <span className="font-mono">{career.onet_code}</span>
                    </>
                  ) : (
                    <strong className="font-semibold text-state-error">Not set, needed to sort and approve</strong>
                  )}
                </p>
                <p className="text-text-muted">
                  {career.listing_count.toLocaleString()} {career.listing_count === 1 ? 'listing' : 'listings'} ·{' '}
                  {career.approved_count.toLocaleString()} approved · {career.described_count.toLocaleString()}{' '}
                  {career.described_count === 1 ? 'description' : 'descriptions'}
                </p>
              </div>

              {isEditing ? (
                <div className="space-y-3 rounded-md bg-bg-panel p-3">
                  <OccupationPicker
                    request={request}
                    initialQuery={career.title}
                    value={editOccupation}
                    onChange={setEditOccupation}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      disabled={!editOccupation}
                      loading={saving === `${career.slug}:occupation`}
                      onClick={async () => {
                        if (!editOccupation) return
                        const saved = await update(
                          career.slug,
                          { onet_code: editOccupation.onet_code },
                          `${career.slug}:occupation`
                        )
                        if (saved) setEditing(null)
                      }}
                    >
                      Save Occupation
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : career.approved_count > 0 ? (
                <p className="text-body-s text-text-muted">
                  The occupation is fixed now that listings are approved under it. Add a new search title to use
                  another.
                </p>
              ) : (
                <Button
                  variant="secondary"
                  aria-describedby={headingId}
                  onClick={() => {
                    setEditOccupation(null)
                    setEditing(career.slug)
                  }}
                >
                  {career.onet_code ? 'Change Occupation' : 'Set Occupation'}
                </Button>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap gap-x-6">
                  <Switch
                    label="Show in Check-Up"
                    aria-describedby={`${headingId} ${statusId}`}
                    checked={!career.hidden}
                    onChange={(checked) => void update(career.slug, { hidden: !checked }, `${career.slug}:hidden`)}
                  />
                  <Switch
                    label="Nightly Refresh"
                    aria-describedby={headingId}
                    checked={career.daily_refresh}
                    onChange={(checked) =>
                      void update(career.slug, { daily_refresh: checked }, `${career.slug}:daily_refresh`)
                    }
                  />
                  <Switch
                    label="Active"
                    aria-describedby={headingId}
                    checked={career.enabled}
                    onChange={(checked) => void update(career.slug, { enabled: checked }, `${career.slug}:enabled`)}
                  />
                </div>
                <p id={statusId} className="text-body-s text-text-muted">
                  {checkupStatus(career)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function AddSearchTitle({ request, onAdded }: { request: RequestScraper; onAdded: () => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [pickerQuery, setPickerQuery] = useState<string | null>(null)
  const [occupation, setOccupation] = useState<Occupation | null>(null)
  const [otherTitles, setOtherTitles] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const previewId = useId()
  // The API's own title rules, so the preview and its error match what saving would say.
  const preview = title.trim() ? jobstreetSearchPreview(title) : null
  const searchUrl = preview && 'url' in preview ? preview.url : null
  const occupationCode = occupation?.onet_code ?? null

  // Other names O*NET publishes for the chosen occupation, as starting points for more search titles.
  useEffect(() => {
    setOtherTitles([])
    if (!occupationCode) return
    let current = true
    void (request(`/occupations/${occupationCode}/titles`) as Promise<{ titles: string[] }>)
      .then((data) => {
        if (current) setOtherTitles(data.titles)
      })
      .catch(() => {})
    return () => {
      current = false
    }
  }, [occupationCode, request])

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!occupation || adding) return
    setAdding(true)
    setError(null)
    setNotice(null)
    try {
      const result = (await request('/careers', {
        method: 'POST',
        body: JSON.stringify({ title, onet_code: occupation.onet_code })
      })) as { career: { title: string } }
      setTitle('')
      setPickerQuery(null)
      setOccupation(null)
      await onAdded()
      setNotice(`Added “${result.career.title}”. Queue a breadth run for it above.`)
    } catch (cause) {
      if (!isHandledError(cause)) setError(errorMessage(cause))
    } finally {
      setAdding(false)
    }
  }

  return (
    <form
      onSubmit={add}
      className="space-y-4 rounded-md border border-border-subtle p-4"
      aria-labelledby={`${previewId}-heading`}
    >
      <h3 id={`${previewId}-heading`} className="text-label-l">
        Add a Search Title
      </h3>
      <div className="space-y-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <TextField
              label="Job Title"
              placeholder="UI/UX Designer"
              value={title}
              maxLength={80}
              aria-describedby={previewId}
              aria-invalid={!!preview && !searchUrl}
              onChange={(event) => setTitle(event.currentTarget.value)}
            />
          </div>
          <Button
            variant="secondary"
            disabled={title.trim().length < 2}
            onClick={() => {
              setOccupation(null)
              setPickerQuery(title.trim())
            }}
          >
            Find Occupation
          </Button>
        </div>
        <p
          id={previewId}
          className={`break-words text-body-s ${preview && !searchUrl ? 'text-state-error' : 'text-text-muted'}`}
        >
          {!preview
            ? 'Write the title the way Malaysian job ads do. Its JobStreet search appears here.'
            : 'url' in preview
              ? `JobStreet search: ${preview.url.replace('https://', '')}`
              : preview.error}
        </p>
      </div>

      {pickerQuery !== null && (
        <OccupationPicker
          key={pickerQuery}
          request={request}
          initialQuery={pickerQuery}
          value={occupation}
          onChange={setOccupation}
        />
      )}

      {otherTitles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-label-m">Other O*NET Titles for This Occupation</h4>
          <div className="flex flex-wrap gap-2">
            {otherTitles.map((other) => (
              <button
                key={other}
                type="button"
                onClick={() => setTitle(other)}
                className="min-h-11 rounded-sm border border-border-control px-3 py-1 text-body-s text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
              >
                {other}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button variant="primary" type="submit" disabled={!occupation || !searchUrl} loading={adding}>
        Add Search Title
      </Button>
      {notice && (
        <p role="status" className="text-body-s text-text-muted">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="text-body-s text-state-error">
          {error}
        </p>
      )}
    </form>
  )
}
