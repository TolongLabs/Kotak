import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { errorMessage, isHandledError, jobstreetJobUrl, type RequestScraper } from './scraper'

type Listing = {
  job_id: string
  title: string | null
  company: string | null
  location: string | null
  salary: string | null
  listed: string | null
  verdict: 'match' | 'other' | 'unsure' | null
  verdict_source: 'search_title' | 'claude' | null
  // The listing's current decision under the occupation, and which batch made it.
  approved: boolean | null
  decided_in: 'this' | 'older' | 'newer' | null
  // The admin's earlier call on this exact title, when it was the same for every listing with it.
  title_decision: 'approved' | 'excluded' | null
}

type ReviewData = {
  // seen_through: the batch's last observation shown; approving decides only listings up to it.
  run: {
    id: string
    status: string
    source: string
    created_at: string
    jobs_saved: number | null
    seen_through: string | null
  }
  career: { slug: string; title: string; onet_code: string | null; occupation_title: string | null }
  review: {
    status: 'approved' | 'rejected'
    approved_count: number
    excluded_count: number
    reviewed_at: string
    reviewed_by: string | null
  } | null
  // Titles sorting can still answer, as the classify endpoint counts them.
  unsorted_titles: number
  listings: Listing[]
}

type GroupId = 'match' | 'other' | 'unsure'

// A sorting pass sends at most 40 titles, and a batch has at most 5,000 listings.
const MAX_SORT_REQUESTS = 150
// Keeps a focused row clear of the sticky footer, which wraps to about 120 px on a phone (WCAG 2.4.11).
const CLEAR_OF_FOOTER = 'scroll-mb-40'

const plural = (count: number, one: string, many: string) => `${count.toLocaleString()} ${count === 1 ? one : many}`

const groupOf = (listing: Listing): GroupId =>
  listing.verdict === 'match' ? 'match' : listing.verdict === 'other' ? 'other' : 'unsure'

// A newer batch's decision stands, so this batch cannot change it.
const isLocked = (listing: Listing) => listing.decided_in === 'newer'

// A listing starts ticked if it is approved now; never decided, if the admin approved its title before; otherwise if
// its title matched the occupation.
const ticksByDefault = (listing: Listing) =>
  listing.approved ??
  (listing.title_decision ? listing.title_decision === 'approved' : null) ??
  listing.verdict === 'match'

function decisionNote(listing: Listing) {
  const word = listing.approved ? 'Approved' : 'Excluded'
  if (listing.decided_in === 'this') return `${word} in this batch`
  if (listing.decided_in === 'older') return `${word} in an older batch`
  if (listing.decided_in === 'newer') return `${word} in a newer batch, which stands`
  if (listing.title_decision === 'approved') return 'You approved this title before'
  if (listing.title_decision === 'excluded') return 'You excluded this title before'
  return null
}

// An occupation in the O*NET list: a code the list does not know cannot be sorted against or approved.
const hasOccupation = (data: ReviewData) => !!data.career.onet_code && !!data.career.occupation_title

function isClearReply(value: unknown): value is { cleared: number } {
  if (!value || typeof value !== 'object') return false
  const { cleared } = value as Record<string, unknown>
  return typeof cleared === 'number' && Number.isSafeInteger(cleared) && cleared >= 0
}

function isSortReply(value: unknown): value is { sorted: number; remaining: number } {
  if (!value || typeof value !== 'object') return false
  const { sorted, remaining } = value as Record<string, unknown>
  const isCount = (count: unknown) => typeof count === 'number' && Number.isSafeInteger(count) && count >= 0
  return isCount(sorted) && isCount(remaining)
}

const ListingRow = memo(function ListingRow({
  listing,
  checked,
  disabled,
  onToggle
}: {
  listing: Listing
  checked: boolean
  disabled: boolean
  onToggle: (jobId: string, checked: boolean) => void
}) {
  const url = jobstreetJobUrl(listing.job_id)
  const title = listing.title ?? `Job ${listing.job_id}`
  const note = decisionNote(listing)
  // Many ads share a title, so each row's checkbox is described by its company, place and status.
  const detailsId = useId()
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-3 py-2">
      <div className="min-w-0 flex-1">
        <Checkbox
          label={title}
          checked={checked}
          disabled={disabled || isLocked(listing)}
          aria-describedby={`${detailsId}-place ${detailsId}-status`}
          className={CLEAR_OF_FOOTER}
          onChange={(next) => onToggle(listing.job_id, next)}
        />
        <p id={`${detailsId}-place`} className="pl-8 text-body-s text-text-muted">
          {[listing.company, listing.location, listing.salary, listing.listed].filter(Boolean).join(' · ')}
        </p>
        <p id={`${detailsId}-status`} className="pl-8 text-body-s text-text-muted">
          {listing.verdict_source === 'search_title'
            ? 'Same as the search title'
            : listing.verdict_source === 'claude'
              ? 'Sorted by Kopi'
              : 'Not sorted'}
          {note && ` · ${note}`}
        </p>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open Ad for “${title}”${listing.company ? ` at ${listing.company}` : ''} on JobStreet`}
          className={`inline-flex min-h-11 items-center text-body-s text-text-primary underline underline-offset-4 hover:text-text-muted ${CLEAR_OF_FOOTER}`}
        >
          Open Ad
        </a>
      )}
    </li>
  )
})

// One breadth batch: sort its listings against the search title's occupation, then approve the ticked ones.
export const BatchReview = memo(function BatchReview({
  runId,
  request,
  onClose,
  onReviewed
}: {
  runId: string
  request: RequestScraper
  onClose: () => void
  onReviewed: () => Promise<void>
}) {
  const [data, setData] = useState<ReviewData | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<{ done: number; total: number | null } | null>(null)
  const [sortError, setSortError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmingResort, setConfirmingResort] = useState(false)
  const [resortNotice, setResortNotice] = useState<string | null>(null)
  const [resortError, setResortError] = useState<string | null>(null)
  const mounted = useRef(true)
  // The confirmation takes Re-Sort Titles' place, as on the Settings page. Focus moves into it when it opens, back to
  // Re-Sort Titles on Cancel, and to the result once the admin confirms, so it is not lost with the disabled buttons.
  const resortButtonRef = useRef<HTMLButtonElement>(null)
  const cancelResortRef = useRef<HTMLButtonElement>(null)
  const resortResultRef = useRef<HTMLDivElement>(null)
  const resortQuestionId = useId()
  const isMounted = useCallback(() => mounted.current, [])
  // Gets focus after a review is saved, so the result is read out and focus is not lost with the disabled buttons.
  const resultRef = useRef<HTMLDivElement>(null)
  // Listings the admin ticked or unticked by hand keep that choice when the batch reloads.
  const touched = useRef(new Set<string>())
  const loadSeq = useRef(0)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // isActive is false once the work is stale (unmounted or superseded), and only the latest load's answer is used.
  const load = useCallback(
    async (isActive: () => boolean) => {
      const seq = ++loadSeq.current
      const next = (await request(`/runs/${encodeURIComponent(runId)}/review`)) as ReviewData
      if (!isActive() || seq !== loadSeq.current) return null
      setData(next)
      setSelected((current) => {
        const ticked = new Set<string>()
        for (const listing of next.listings) {
          const keep = touched.current.has(listing.job_id) && !isLocked(listing)
          if (keep ? current.has(listing.job_id) : ticksByDefault(listing)) ticked.add(listing.job_id)
        }
        return ticked
      })
      return next
    },
    [request, runId]
  )

  // Ask the API to sort the batch's unsorted titles, 40 at a time, until none remain or no progress is made. The
  // caller clears the sorting state once the batch has reloaded. True when every title was sorted.
  const sort = useCallback(
    async (isActive: () => boolean) => {
      setSortError(null)
      let total: number | null = null
      let done = 0
      let finished = false
      try {
        for (let requests = 0; isActive(); requests++) {
          if (requests >= MAX_SORT_REQUESTS) {
            setSortError('Sorting stopped after too many requests. Check the rest yourself, or try again.')
            break
          }
          const result: unknown = await request(`/runs/${encodeURIComponent(runId)}/classify`, {
            method: 'POST',
            body: '{}'
          })
          if (!isActive()) break
          if (!isSortReply(result)) {
            setSortError('Kopi sent an unexpected reply. Check the titles yourself, or try again.')
            break
          }
          total ??= result.sorted + result.remaining
          done = Math.min(total, done + result.sorted)
          setSorting({ done, total })
          if (result.remaining === 0) {
            finished = true
            break
          }
          if (result.sorted === 0) {
            setSortError('Kopi could not sort the remaining titles. Check them yourself, or try again later.')
            break
          }
        }
      } catch (cause) {
        if (!isHandledError(cause) && isActive()) setSortError(errorMessage(cause))
      }
      return finished
    },
    [request, runId]
  )

  // Sorting and the reload after it count as one busy spell, so nothing can be approved against the old groups.
  const sortAndReload = useCallback(
    async (isActive: () => boolean) => {
      setSorting({ done: 0, total: null })
      try {
        const finished = await sort(isActive)
        await load(isActive)
        return finished
      } finally {
        if (isActive()) setSorting(null)
      }
    },
    [load, sort]
  )

  useEffect(() => {
    let current = true
    const isActive = () => current
    setData(null)
    setLoadError(null)
    setNotice(null)
    void (async () => {
      try {
        const loaded = await load(isActive)
        if (loaded && hasOccupation(loaded) && loaded.unsorted_titles > 0) await sortAndReload(isActive)
      } catch (cause) {
        if (!isHandledError(cause) && isActive()) setLoadError(errorMessage(cause))
      }
    })()
    return () => {
      current = false
    }
  }, [load, sortAndReload])

  const groups = useMemo(() => {
    const byGroup: Record<GroupId, Listing[]> = { match: [], other: [], unsure: [] }
    for (const listing of data?.listings ?? []) byGroup[groupOf(listing)].push(listing)
    for (const listings of Object.values(byGroup))
      listings.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '') || a.job_id.localeCompare(b.job_id))
    return byGroup
  }, [data])

  const editable = useMemo(() => (data?.listings ?? []).filter((listing) => !isLocked(listing)), [data])
  const lockedCount = (data?.listings.length ?? 0) - editable.length
  const tickedIds = useMemo(
    () => editable.filter((listing) => selected.has(listing.job_id)).map((listing) => listing.job_id),
    [editable, selected]
  )

  const toggle = useCallback((jobId: string, checked: boolean) => {
    touched.current.add(jobId)
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(jobId)
      else next.delete(jobId)
      return next
    })
  }, [])

  const setGroup = (listings: Listing[], checked: boolean) => {
    for (const listing of listings) touched.current.add(listing.job_id)
    setSelected((current) => {
      const next = new Set(current)
      for (const listing of listings) {
        if (checked) next.add(listing.job_id)
        else next.delete(listing.job_id)
      }
      return next
    })
  }

  const focusLater = (target: { current: HTMLElement | null }) =>
    window.requestAnimationFrame(() => target.current?.focus())

  // Clear the stored answers for every listing title under the search title, then sort this batch again (#265).
  // Saved decisions stay, and so do the ticks the admin changed on this page.
  async function resort() {
    if (!data || sorting !== null || submitting !== null) return
    const { slug, title } = data.career
    setConfirmingResort(false)
    setResortError(null)
    setResortNotice(null)
    setSortError(null)
    setNotice(null)
    setSorting({ done: 0, total: null })
    focusLater(resortResultRef)
    let cleared: number
    try {
      const result: unknown = await request(`/careers/${encodeURIComponent(slug)}/verdicts/clear`, {
        method: 'POST',
        body: '{}'
      })
      if (!isClearReply(result)) throw new Error('Kopi sent an unexpected reply. Reload the batch and try again.')
      cleared = result.cleared
    } catch (cause) {
      if (!isHandledError(cause) && mounted.current) setResortError(errorMessage(cause))
      if (mounted.current) setSorting(null)
      return
    }
    const answers = plural(cleared, 'stored answer', 'stored answers')
    try {
      const finished = await sortAndReload(isMounted)
      if (!mounted.current) return
      setResortNotice(
        finished
          ? `Cleared ${answers} for “${title}” and sorted this batch again. Other batches of this title are sorted again when you open them.`
          : `Cleared ${answers} for “${title}”, but sorting this batch again stopped before the end.`
      )
    } catch (cause) {
      if (!isHandledError(cause) && mounted.current)
        setResortError(`Cleared ${answers}, but the batch could not be reloaded: ${errorMessage(cause)}`)
    }
  }

  async function decide(decision: 'approve' | 'reject') {
    if (!data || submitting) return
    setSubmitting(decision)
    setSubmitError(null)
    setLoadError(null)
    setNotice(null)
    let result: { review: { approved_count: number; excluded_count: number }; in_checkup: boolean }
    const focusResult = () => window.requestAnimationFrame(() => resultRef.current?.focus())
    try {
      const body =
        decision === 'approve'
          ? { decision, approved_job_ids: tickedIds, seen_through: data.run.seen_through }
          : { decision }
      result = (await request(`/runs/${encodeURIComponent(runId)}/review`, {
        method: 'POST',
        body: JSON.stringify(body)
      })) as typeof result
    } catch (cause) {
      if (!isHandledError(cause) && mounted.current) setSubmitError(errorMessage(cause))
      if (mounted.current) {
        setSubmitting(null)
        focusResult()
      }
      return
    }
    if (!mounted.current) return
    touched.current.clear()
    const { approved_count: approved, excluded_count: excluded } = result.review
    const checkup =
      decision === 'reject'
        ? result.in_checkup
          ? ` “${data.career.title}” stays in the check-up through listings approved in other batches.`
          : ''
        : result.in_checkup
          ? ` “${data.career.title}” is in the check-up’s job titles.`
          : approved > 0
            ? ' The title is hidden from the check-up. Turn on Show in Check-Up to add it.'
            : ''
    setNotice(
      decision === 'approve'
        ? `Approved ${plural(approved, 'listing', 'listings')} and excluded ${excluded.toLocaleString()}.${checkup}`
        : `Rejected this batch. Its listings no longer count as approved.${checkup}`
    )
    // The review is saved; a failed reload is reported on its own.
    try {
      await load(isMounted)
      await onReviewed()
    } catch (cause) {
      if (!isHandledError(cause) && mounted.current)
        setLoadError(`The review is saved, but the batch could not be reloaded: ${errorMessage(cause)}`)
    } finally {
      if (mounted.current) {
        setSubmitting(null)
        focusResult()
      }
    }
  }

  const busy = sorting !== null || submitting !== null
  const occupationSet = data !== null && hasOccupation(data)
  // Sorting needs the occupation, and a batch without listings has nothing to sort.
  const canResort = data !== null && occupationSet && data.listings.length > 0
  const occupationName = data?.career.occupation_title ?? 'the Occupation'
  const groupDetails: Array<{ id: GroupId; title: string; hint: string }> = [
    { id: 'match', title: `Matches ${occupationName}`, hint: 'Ticked unless you excluded them before.' },
    { id: 'other', title: 'A Different Occupation', hint: 'Left unticked unless you approved them before.' },
    { id: 'unsure', title: 'Unsure or Not Sorted Yet', hint: 'Check these yourself.' }
  ]

  return (
    <section className="surface-card space-y-5 p-5" aria-labelledby="batch-review-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 id="batch-review-heading" tabIndex={-1} className="text-title-s focus:outline-none">
            Review Batch{data ? `: ${data.career.title}` : ''}
          </h2>
          {data && (
            <p className="text-body-s text-text-muted">
              {new Date(data.run.created_at).toLocaleString()} · {plural(data.listings.length, 'listing', 'listings')} ·{' '}
              {occupationSet ? (
                <>
                  for {data.career.occupation_title} <span className="font-mono">{data.career.onet_code}</span>
                </>
              ) : (
                'no occupation set'
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canResort && !confirmingResort && (
            <Button
              ref={resortButtonRef}
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setConfirmingResort(true)
                focusLater(cancelResortRef)
              }}
            >
              Re-Sort Titles
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close Review
          </Button>
        </div>
      </div>

      {canResort && confirmingResort && (
        <div
          className="space-y-4 rounded-md border border-border-subtle bg-bg-panel p-4"
          role="group"
          aria-label="Confirm Re-Sort Titles"
          aria-describedby={resortQuestionId}
          aria-live="polite"
        >
          <p id={resortQuestionId} className="text-body-s text-text-primary">
            Clear Kopi’s stored answers for every listing title under “{data.career.title}”, then sort this batch again?
            Do this after the sorting prompt changes, or when Kopi sorted titles wrongly. Saved decisions and the ticks
            you changed here stay. Other batches of this title are sorted again when you open them.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              ref={cancelResortRef}
              variant="secondary"
              fullWidth
              className={`sm:w-auto ${CLEAR_OF_FOOTER}`}
              onClick={() => {
                setConfirmingResort(false)
                focusLater(resortButtonRef)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              className={`sm:w-auto ${CLEAR_OF_FOOTER}`}
              disabled={busy}
              onClick={() => void resort()}
            >
              Re-Sort Titles
            </Button>
          </div>
        </div>
      )}
      <div
        ref={resortResultRef}
        tabIndex={-1}
        className={resortNotice || resortError ? 'space-y-3 focus:outline-none' : 'sr-only focus:outline-none'}
      >
        {/* Mounted before any result, so screen readers announce the notice when it appears. Out of the layout while
            empty, so it adds no gap under the heading. */}
        <p role="status" className={resortNotice ? 'text-body-s text-text-muted' : 'sr-only'}>
          {resortNotice}
        </p>
        {resortError && <Banner type="error" title="Could Not Re-Sort the Titles" body={resortError} role="alert" />}
      </div>

      {loadError && <Banner type="error" title="Could Not Load This Batch" body={loadError} role="alert" />}
      {!data && !loadError && (
        <p role="status" className="text-body-s text-text-muted">
          Loading the batch…
        </p>
      )}

      {data && !occupationSet && (
        <Banner
          type="info"
          title="Set an Occupation First"
          body={`Choose the O*NET occupation for “${data.career.title}” under Search Titles. Kopi sorts listings against it, and approval needs it.`}
        />
      )}

      {data?.review && (
        <p className="text-body-s text-text-muted">
          {data.review.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
          {new Date(data.review.reviewed_at).toLocaleString()}
          {data.review.reviewed_by ? ` by ${data.review.reviewed_by}` : ''}.
          {data.review.status === 'approved' &&
            ` Its decisions that still stand: ${data.review.approved_count.toLocaleString()} approved, ${data.review.excluded_count.toLocaleString()} excluded.`}{' '}
          You can review it again.
        </p>
      )}

      {sorting &&
        (sorting.total === null ? (
          <p role="status" className="text-body-s text-text-muted">
            Kopi is starting to sort the titles…
          </p>
        ) : (
          <ProgressBar
            label="Kopi Is Sorting Titles"
            value={sorting.done}
            max={Math.max(sorting.total, 1)}
            valueText={`${sorting.done.toLocaleString()} of ${plural(sorting.total, 'title', 'titles')}`}
          />
        ))}
      {sortError && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-body-s text-state-error">
            {sortError}
          </p>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              void sortAndReload(isMounted).catch((cause) => {
                if (!isHandledError(cause) && mounted.current) setLoadError(errorMessage(cause))
              })
            }
          >
            Try Sorting Again
          </Button>
        </div>
      )}

      {data && (
        <>
          {groupDetails.map((group) => {
            const listings = groups[group.id]
            if (!listings.length) return null
            const open = listings.filter((listing) => !isLocked(listing))
            const ticked = open.filter((listing) => selected.has(listing.job_id)).length
            return (
              <fieldset key={group.id} className="min-w-0 space-y-2">
                <legend className="text-label-l">
                  {group.title} <span className="text-text-muted">({listings.length.toLocaleString()})</span>
                </legend>
                <p className="text-body-s text-text-muted">{group.hint}</p>
                {open.length > 0 && (
                  <Checkbox
                    label={`Tick All ${open.length.toLocaleString()} in This Group`}
                    checked={ticked === open.length}
                    indeterminate={ticked > 0 && ticked < open.length}
                    disabled={busy}
                    className={CLEAR_OF_FOOTER}
                    onChange={(checked) => setGroup(open, checked)}
                  />
                )}
                <ul className="divide-y divide-border-subtle rounded-md border border-border-subtle">
                  {listings.map((listing) => (
                    <ListingRow
                      key={listing.job_id}
                      listing={listing}
                      checked={selected.has(listing.job_id)}
                      disabled={busy}
                      onToggle={toggle}
                    />
                  ))}
                </ul>
              </fieldset>
            )
          })}

          {!data.listings.length && (
            <p className="text-body-s text-text-muted">This run saved no listings, so there is nothing to approve.</p>
          )}

          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-bg-default pt-4">
            <p className="text-body-s" role="status">
              {tickedIds.length.toLocaleString()} of {plural(editable.length, 'listing', 'listings')} ticked
              {lockedCount > 0 && ` · ${plural(lockedCount, 'listing', 'listings')} decided in a newer batch`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                loading={submitting === 'reject'}
                disabled={busy}
                onClick={() => void decide('reject')}
              >
                Reject Batch
              </Button>
              <Button
                variant="primary"
                loading={submitting === 'approve'}
                disabled={!occupationSet || !editable.length || !data.run.seen_through || busy}
                onClick={() => void decide('approve')}
              >
                Approve {plural(tickedIds.length, 'Listing', 'Listings')}
              </Button>
            </div>
          </div>
          <div ref={resultRef} tabIndex={-1} className="space-y-3 focus:outline-none">
            {/* Mounted before any result, so screen readers announce the notice when it appears. */}
            <p role="status" className={notice ? 'text-body-s text-text-muted' : 'sr-only'}>
              {notice}
            </p>
            {submitError && <Banner type="error" title="Could Not Save the Review" body={submitError} role="alert" />}
          </div>
        </>
      )}
    </section>
  )
})
