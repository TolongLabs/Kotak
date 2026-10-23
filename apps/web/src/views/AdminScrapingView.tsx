import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { BatchReview } from './admin/BatchReview'
import { SearchTitles } from './admin/SearchTitles'
import { AdminSessionExpiredError, isAbortError, isReviewable, type Career, type ScrapeRun } from './admin/scraper'

type AdminUser = { id: string; username: string }
type AuthStatus = 'checking' | 'authenticated' | 'error'

const LEGACY_TOKEN_KEY = 'kotak:scraper-admin-token'

function getApiError(data: unknown, fallback: string) {
  if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') {
    return data.error
  }
  return fallback
}

export function AdminScrapingView() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking')
  const [user, setUser] = useState<AdminUser | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [careers, setCareers] = useState<Career[]>([])
  const [runs, setRuns] = useState<ScrapeRun[]>([])
  const [careerSlug, setCareerSlug] = useState('software-engineer')
  const [mode, setMode] = useState<'breadth' | 'depth'>('breadth')
  const [loading, setLoading] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [review, setReview] = useState<{ runId: string; careerSlug: string } | null>(null)
  const reviewRef = useRef<HTMLDivElement>(null)
  // The Review button that opened the batch, which gets focus back when the review closes.
  const reviewOpenerRef = useRef<HTMLButtonElement | null>(null)
  const controllersRef = useRef(new Set<AbortController>())
  const generationRef = useRef(0)
  const refreshIdRef = useRef(0)
  const mountedRef = useRef(true)

  const abortRequests = useCallback(() => {
    for (const controller of controllersRef.current) controller.abort()
    controllersRef.current.clear()
  }, [])

  const leaveSession = useCallback(() => {
    generationRef.current += 1
    refreshIdRef.current += 1
    abortRequests()
    setUser(null)
    setCareers([])
    setRuns([])
    setReview(null)
    setNotice(null)
    setError(null)
    navigate(routes.adminSignIn)
  }, [abortRequests])

  const performFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    const controller = new AbortController()
    controllersRef.current.add(controller)
    const headers = new Headers(init.headers)
    if (init.body) headers.set('Content-Type', 'application/json')

    try {
      return await fetch(path, {
        ...init,
        credentials: 'same-origin',
        headers,
        signal: controller.signal
      })
    } finally {
      controllersRef.current.delete(controller)
    }
  }, [])

  const requestScraper = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const generation = generationRef.current
      const response = await performFetch(`/api/admin/scraper${path}`, init)
      const data: unknown = await response.json().catch(() => ({}))
      if (!mountedRef.current || generation !== generationRef.current)
        throw new DOMException('Request is no longer active', 'AbortError')

      if (response.status === 401) {
        leaveSession()
        throw new AdminSessionExpiredError('Admin session expired')
      }
      if (!response.ok) throw new Error(getApiError(data, `Request failed (${response.status})`))

      return data
    },
    [leaveSession, performFetch]
  )

  const refresh = useCallback(async () => {
    const generation = generationRef.current
    const refreshId = ++refreshIdRef.current

    try {
      const [careerData, runData] = (await Promise.all([requestScraper('/careers'), requestScraper('/runs')])) as [
        { careers: Career[] },
        { runs: ScrapeRun[] }
      ]

      if (!mountedRef.current || generation !== generationRef.current || refreshId !== refreshIdRef.current) return
      setCareers(careerData.careers)
      setRuns(runData.runs)
      setError(null)
    } catch (cause) {
      if (
        !mountedRef.current ||
        generation !== generationRef.current ||
        cause instanceof AdminSessionExpiredError ||
        isAbortError(cause)
      ) {
        return
      }
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [requestScraper])

  const checkSession = useCallback(async () => {
    const generation = generationRef.current
    setAuthStatus('checking')
    setSessionError(null)

    try {
      const response = await performFetch('/api/admin/auth/session')
      const data: unknown = await response.json().catch(() => ({}))
      if (!mountedRef.current || generation !== generationRef.current) return

      if (response.status === 401) {
        leaveSession()
        return
      }
      if (!response.ok) throw new Error(`Session check failed (${response.status})`)

      const sessionUser =
        typeof data === 'object' &&
        data !== null &&
        'user' in data &&
        typeof data.user === 'object' &&
        data.user !== null &&
        'id' in data.user &&
        typeof data.user.id === 'string' &&
        'username' in data.user &&
        typeof data.user.username === 'string'
          ? { id: data.user.id, username: data.user.username }
          : null

      if (!sessionUser) throw new Error('Session response was invalid')
      if (!mountedRef.current || generation !== generationRef.current) return

      setUser(sessionUser)
      setAuthStatus('authenticated')
    } catch (cause) {
      if (!mountedRef.current || generation !== generationRef.current || isAbortError(cause)) return
      setAuthStatus('error')
      setSessionError('Kotak could not verify your admin session. Check your connection and try again.')
    }
  }, [leaveSession, performFetch])

  useEffect(() => {
    mountedRef.current = true
    try {
      sessionStorage.removeItem(LEGACY_TOKEN_KEY)
      localStorage.removeItem(LEGACY_TOKEN_KEY)
    } catch {
      // Browser storage can be blocked; admin authentication uses its HttpOnly cookie.
    }
    void checkSession()

    return () => {
      mountedRef.current = false
      generationRef.current += 1
      refreshIdRef.current += 1
      abortRequests()
    }
  }, [abortRequests, checkSession])

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10_000)
    return () => window.clearInterval(timer)
  }, [authStatus, refresh])

  // Only active search titles can be queued; keep the choice valid as titles are added or switched off.
  const activeCareers = careers.filter((career) => career.enabled)
  const selectedSlug = activeCareers.some((career) => career.slug === careerSlug)
    ? careerSlug
    : (activeCareers[0]?.slug ?? '')

  const openReview = (run: ScrapeRun, opener: HTMLButtonElement) => {
    reviewOpenerRef.current = opener
    setReview({ runId: run.id, careerSlug: run.career_slug })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Focus moves to the review only when the admin opens it, not when it remounts for a changed occupation.
    window.requestAnimationFrame(() => {
      reviewRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      document.getElementById('batch-review-heading')?.focus({ preventScroll: true })
    })
  }

  const closeReview = useCallback(() => {
    setReview(null)
    const opener = reviewOpenerRef.current
    window.requestAnimationFrame(() => {
      if (opener?.isConnected) opener.focus()
      else document.getElementById('runs-title')?.focus()
    })
  }, [])

  // A changed occupation remounts the review, so its listings are sorted and ticked against the new one.
  const reviewOccupation = review ? (careers.find((career) => career.slug === review.careerSlug)?.onet_code ?? '') : ''

  async function startRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading || !selectedSlug) return

    const generation = generationRef.current
    setLoading(true)
    setError(null)
    setNotice(null)

    try {
      const result = (await requestScraper('/runs', {
        method: 'POST',
        body: JSON.stringify({ career_slug: selectedSlug, mode })
      })) as { run: ScrapeRun }

      if (!mountedRef.current || generation !== generationRef.current) return
      setNotice(`Queued ${mode} run ${result.run.id}.`)
      await refresh()
    } catch (cause) {
      if (
        !mountedRef.current ||
        generation !== generationRef.current ||
        cause instanceof AdminSessionExpiredError ||
        isAbortError(cause)
      ) {
        return
      }
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      if (mountedRef.current && generation === generationRef.current) setLoading(false)
    }
  }

  async function signOut() {
    if (signingOut) return

    const generation = generationRef.current
    setSigningOut(true)
    setError(null)

    try {
      const response = await performFetch('/api/admin/auth/logout', { method: 'POST', body: '{}' })
      if (!mountedRef.current || generation !== generationRef.current) return
      if (response.status === 401) {
        leaveSession()
        return
      }
      if (!response.ok) throw new Error('Unable to sign out. Try again.')
      if (!mountedRef.current || generation !== generationRef.current) return
      leaveSession()
    } catch (cause) {
      if (!mountedRef.current || generation !== generationRef.current || isAbortError(cause)) return
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      if (mountedRef.current && generation === generationRef.current) setSigningOut(false)
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-6xl space-y-8 px-5 py-10 text-text-primary lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-title-m lg:text-title-l">JobStreet Scraping</h1>
          <p className="max-w-2xl text-body-m text-text-muted">
            Queue a breadth run to find listings or a depth run to fetch their descriptions, then review each breadth
            batch. Runs execute on the connected scraper runner.
          </p>
        </div>
        {authStatus === 'authenticated' && user && (
          <div className="flex min-w-0 items-center gap-3">
            <span className="max-w-48 truncate text-body-s text-text-muted" title={user.username}>
              Signed in as <strong className="font-semibold text-text-primary">{user.username}</strong>
            </span>
            <Button variant="secondary" size="md" loading={signingOut} onClick={() => void signOut()}>
              Sign Out
            </Button>
          </div>
        )}
      </header>

      {authStatus === 'checking' && (
        <p role="status" className="surface-card max-w-xl p-5 text-body-m text-text-muted">
          Checking your admin session…
        </p>
      )}

      {authStatus === 'error' && (
        <div className="max-w-xl space-y-4">
          <Banner
            type="error"
            title="Session Check Failed"
            body={sessionError ?? 'Kotak could not verify your admin session.'}
            role="alert"
          />
          <Button variant="secondary" onClick={() => void checkSession()}>
            Try Again
          </Button>
        </div>
      )}

      {authStatus === 'authenticated' && (
        <>
          <form onSubmit={startRun} className="surface-card grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="space-y-2 text-label-m">
              <span>Search Title</span>
              <select
                className="min-h-11 w-full rounded-md border border-border-control bg-bg-default px-3 py-2 text-body-m"
                value={selectedSlug}
                onChange={(event) => setCareerSlug(event.target.value)}
              >
                {activeCareers.map((career) => (
                  <option key={career.slug} value={career.slug}>
                    {career.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-label-m">
              <span>Mode</span>
              <select
                className="min-h-11 w-full rounded-md border border-border-control bg-bg-default px-3 py-2 text-body-m"
                value={mode}
                onChange={(event) => setMode(event.target.value as 'breadth' | 'depth')}
              >
                <option value="breadth">Breadth · find listings</option>
                <option value="depth">Depth · fetch descriptions</option>
              </select>
            </label>
            <Button variant="primary" disabled={!selectedSlug} loading={loading} type="submit">
              {loading ? 'Queueing…' : 'Start Run'}
            </Button>
          </form>

          <SearchTitles careers={careers} request={requestScraper} onChanged={refresh} />

          <section className="surface-card overflow-hidden" aria-labelledby="runs-title">
            <div className="flex items-center justify-between gap-4 border-b border-border-subtle p-4">
              <h2 id="runs-title" tabIndex={-1} className="text-title-s focus:outline-none">
                Recent Runs
              </h2>
              <Button variant="ghost" size="md" onClick={() => void refresh()}>
                Refresh
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-body-s">
                <thead className="bg-bg-panel text-label-s text-text-muted">
                  <tr>
                    <th className="p-3">Search Title</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Results</th>
                    <th className="p-3">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr className="border-t border-border-subtle" key={run.id}>
                      <td className="p-3">{run.career_title}</td>
                      <td className="p-3 capitalize">{run.mode}</td>
                      <td className="p-3 capitalize">{run.status}</td>
                      <td className="p-3 capitalize">{run.source.replace('_', ' ')}</td>
                      <td className="p-3">{new Date(run.created_at).toLocaleString()}</td>
                      <td className="p-3 font-mono tabular-nums">
                        {String(run.report?.jobs_saved ?? run.report?.jobs_fetched ?? '—')}
                      </td>
                      <td className="p-3">
                        {isReviewable(run) ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-text-muted">
                              {run.review_status === 'approved'
                                ? `${(run.approved_count ?? 0).toLocaleString()} approved`
                                : run.review_status === 'rejected'
                                  ? 'Rejected'
                                  : 'Not reviewed'}
                            </span>
                            <Button
                              variant="secondary"
                              aria-label={`Review the ${run.career_title} batch from ${new Date(run.created_at).toLocaleString()}`}
                              onClick={(event) => openReview(run, event.currentTarget)}
                            >
                              Review
                            </Button>
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!runs.length && (
                    <tr>
                      <td className="p-4 text-text-muted" colSpan={7}>
                        No runs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {review && (
            <div ref={reviewRef} className="scroll-mt-6">
              <BatchReview
                key={`${review.runId}:${reviewOccupation}`}
                runId={review.runId}
                request={requestScraper}
                onClose={closeReview}
                onReviewed={refresh}
              />
            </div>
          )}

          {notice && (
            <p role="status" className="text-body-s text-text-muted">
              {notice}
            </p>
          )}
          {error && <Banner type="error" title="Admin Request Failed" body={error} role="alert" />}
        </>
      )}
    </main>
  )
}
