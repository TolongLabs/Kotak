import { useCallback, useEffect, useState } from 'react'

type Career = { slug: string; title: string; search_url: string; listing_count: number; described_count: number }
type ScrapeRun = {
  id: string
  career_slug: string
  career_title: string
  mode: 'breadth' | 'depth'
  status: string
  source: string
  created_at: string
  started_at: string | null
  finished_at: string | null
  report: Record<string, unknown> | null
  error: string | null
}

const TOKEN_KEY = 'kotak:scraper-admin-token'

export function AdminScrapingView() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '')
  const [draftToken, setDraftToken] = useState(token)
  const [careers, setCareers] = useState<Career[]>([])
  const [runs, setRuns] = useState<ScrapeRun[]>([])
  const [careerSlug, setCareerSlug] = useState('software-engineer')
  const [mode, setMode] = useState<'breadth' | 'depth'>('breadth')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const request = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const response = await fetch(`/api/admin/scraper${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...init.headers
        }
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`)
      return data
    },
    [token]
  )

  const refresh = useCallback(async () => {
    if (!token) return
    try {
      const [careerData, runData] = await Promise.all([request('/careers'), request('/runs')])
      setCareers(careerData.careers)
      setRuns(runData.runs)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [request, token])

  useEffect(() => {
    void refresh()
    if (!token) return
    const timer = window.setInterval(() => void refresh(), 10_000)
    return () => window.clearInterval(timer)
  }, [refresh, token])

  async function connect(event: React.FormEvent) {
    event.preventDefault()
    setToken(draftToken.trim())
    sessionStorage.setItem(TOKEN_KEY, draftToken.trim())
  }

  async function startRun(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const result = await request('/runs', {
        method: 'POST',
        body: JSON.stringify({ career_slug: careerSlug, mode })
      })
      setNotice(`Queued ${mode} run ${result.run.id}.`)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setLoading(false)
    }
  }

  function disconnect() {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
    setDraftToken('')
    setCareers([])
    setRuns([])
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-6xl space-y-8 px-5 py-10 text-text-primary lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-label-s uppercase tracking-wide text-text-muted">Kotak admin</p>
          <h1 className="text-title-m lg:text-title-l">JobStreet scraping</h1>
          <p className="max-w-2xl text-body-m text-text-muted">
            Queue a breadth discovery run or a depth description run. Jobs execute on the connected scraper runner.
          </p>
        </div>
        {token && (
          <button className="text-label-m underline" type="button" onClick={disconnect}>
            Disconnect
          </button>
        )}
      </header>

      {!token ? (
        <form onSubmit={connect} className="surface-card flex max-w-xl flex-col gap-4 p-5">
          <label className="space-y-2 text-label-m">
            <span>Admin access token</span>
            <input
              autoComplete="off"
              className="w-full rounded-md border border-border-control bg-bg-default px-3 py-2 text-body-m"
              type="password"
              value={draftToken}
              onChange={(event) => setDraftToken(event.target.value)}
            />
          </label>
          <button className="w-fit rounded-md bg-accent-box px-4 py-2 text-label-m text-accent-on-box" type="submit">
            Connect
          </button>
        </form>
      ) : (
        <>
          <form onSubmit={startRun} className="surface-card grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="space-y-2 text-label-m">
              <span>Career search</span>
              <select
                className="w-full rounded-md border border-border-control bg-bg-default px-3 py-2"
                value={careerSlug}
                onChange={(event) => setCareerSlug(event.target.value)}
              >
                {careers.map((career) => (
                  <option key={career.slug} value={career.slug}>
                    {career.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-label-m">
              <span>Mode</span>
              <select
                className="w-full rounded-md border border-border-control bg-bg-default px-3 py-2"
                value={mode}
                onChange={(event) => setMode(event.target.value as 'breadth' | 'depth')}
              >
                <option value="breadth">Breadth · find listings</option>
                <option value="depth">Depth · fetch descriptions</option>
              </select>
            </label>
            <button
              disabled={loading || !careers.length}
              className="h-10 rounded-md bg-accent-box px-4 text-label-m text-accent-on-box disabled:opacity-50"
              type="submit"
            >
              {loading ? 'Queueing…' : 'Start run'}
            </button>
          </form>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Career listing totals">
            {careers.map((career) => (
              <article className="surface-card space-y-1 p-4" key={career.slug}>
                <h2 className="text-label-m">{career.title}</h2>
                <p className="text-body-s text-text-muted">
                  {career.listing_count.toLocaleString()} listings · {career.described_count.toLocaleString()}{' '}
                  descriptions
                </p>
              </article>
            ))}
          </section>

          <section className="surface-card overflow-hidden" aria-labelledby="runs-title">
            <div className="flex items-center justify-between border-b border-border-subtle p-4">
              <h2 id="runs-title" className="text-title-s">
                Recent runs
              </h2>
              <button className="text-label-s underline" type="button" onClick={() => void refresh()}>
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-body-s">
                <thead className="bg-bg-panel text-label-s text-text-muted">
                  <tr>
                    <th className="p-3">Career</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Results</th>
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
                      <td className="p-3">{String(run.report?.jobs_saved ?? run.report?.jobs_fetched ?? '—')}</td>
                    </tr>
                  ))}
                  {!runs.length && (
                    <tr>
                      <td className="p-4 text-text-muted" colSpan={6}>
                        No runs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {notice && (
        <p role="status" className="text-body-s text-text-muted">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-body-s text-red-800">
          {error}
        </p>
      )}
    </main>
  )
}
