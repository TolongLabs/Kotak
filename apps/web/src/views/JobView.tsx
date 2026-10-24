import { assessedRoleCode, computeCheckup, roleOutlook } from '@kotak/sdk'
import {
  addMonths,
  DEFAULT_SCENARIO,
  HORIZON_MONTHS,
  roleVerdicts,
  type BundleRole,
  type SnapshotId
} from '@kotak/shared'
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, navigate } from '../app/router'
import { jobPath, routes } from '../app/routes'
import { FutureSkillsRadar } from '../components/kotak/FutureSkillsRadar'
import { QuadrantMap } from '../components/kotak/QuadrantMap'
import { Button } from '../components/ui/Button'
import { VerdictChip } from '../components/ui/VerdictChip'
import { cn } from '../components/ui/cn'
import type { Corner } from '../demo/types'
import { loadRoleBundle, useRoleBundle } from '../engine/bundle'
import { trendOf, type QuadrantPoint } from '../engine/quadrant'
import { verdictId } from '../engine/viewModel'
import { useGuestSession } from '../session/store'
import { NotFoundView } from './NotFoundView'

/** Related roles that have a file, in O*NET's order, each once and never the job itself. */
export function relatedRoles<T extends { onet_code: string }>(self: string, related: T[], limit = 5): T[] {
  const seen = new Set([self])
  return related.filter((role) => !seen.has(role.onet_code) && seen.add(role.onet_code)).slice(0, limit)
}

const outlookOf = (role: BundleRole, snapshotId: SnapshotId) => roleOutlook(role, snapshotId)

const monthLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })

const formatNeeded = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1))

/**
 * The user's fit for each code, from the answers in their session, or null while they have no check-up (no assessed
 * job or no answer yet) or the roles are still loading. A job outside the check-up's own list is scored the same way
 * as the check-up does, by asking for it as an extra role.
 */
function useSavedFits(codes: string[]): Map<string, number> | null {
  const session = useGuestSession()
  const assessed = assessedRoleCode(session)
  const answered = session.answers.some((answer) => answer !== null)
  const key = assessed && answered ? JSON.stringify([assessed, codes]) : null
  const [state, setState] = useState<{ key: string; fits: Map<string, number> } | null>(null)

  useEffect(() => {
    if (!key) return
    let current = true
    const [code, extra] = JSON.parse(key) as [string, string[]]
    loadRoleBundle(code, extra).then(
      (bundle) => {
        const checkup = computeCheckup({
          role: bundle.role,
          related: bundle.related,
          answers: session.answers,
          snapshotId: session.active_snapshot_id,
          scenario: DEFAULT_SCENARIO,
          weeklyHours: session.custom_weekly_hours,
          startDate: new Date().toISOString().slice(0, 10)
        })
        const fits = new Map(checkup.roles.map((role) => [role.onet_code, Math.round(role.fit.score)]))
        if (current) setState({ key, fits })
      },
      () => {
        // A failed load leaves the page in its no-check-up view rather than showing a wrong fit.
      }
    )
    return () => {
      current = false
    }
  }, [key, session.answers, session.active_snapshot_id, session.custom_weekly_hours])

  return state && state.key === key ? state.fits : null
}

const cardClass = 'surface-card min-w-0 space-y-4 p-4 sm:p-6'

function NeedsCard({ role, snapshotId }: { role: BundleRole; snapshotId: SnapshotId }) {
  const names = new Map(role.corners.map((corner) => [corner.corner_id, corner.name]))
  const rows = roleVerdicts(role.signals[snapshotId]).corners.map((corner) => ({
    id: corner.corner_id,
    name: names.get(corner.corner_id) ?? corner.corner_id,
    verdict: verdictId(corner.status),
    needed: corner.scenarios[DEFAULT_SCENARIO].target.value
  }))
  return (
    <section aria-labelledby="job-needs" className={cardClass}>
      <div className="space-y-1">
        <h2 id="job-needs" className="text-title-m text-text-primary">
          What This Job Needs
        </h2>
        <p className="text-body-s text-text-muted">{rows.length} skills and the level each needs, out of 3.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="font-mono text-mono-s text-text-muted">
              <th scope="col" className="py-2 pr-3 font-normal">
                Skill
              </th>
              <th scope="col" className="py-2 pr-3 font-normal">
                Trend
              </th>
              <th scope="col" className="py-2 font-normal">
                Needed level
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const whole = Math.min(3, Math.max(1, Math.round(row.needed)))
              return (
                <tr key={row.id} className="border-t border-border-subtle">
                  <th scope="row" className="py-3 pr-3 text-label-m text-text-primary">
                    {row.name}
                  </th>
                  <td className="py-3 pr-3">
                    <VerdictChip verdict={row.verdict} size="sm" />
                  </td>
                  <td className="py-3">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="hidden items-center gap-1 sm:flex">
                        {[1, 2, 3].map((level) => (
                          <span
                            key={level}
                            className={cn(
                              'h-2 w-6 rounded-full border',
                              level <= whole ? 'border-text-primary bg-accent-box' : 'border-border-subtle bg-bg-panel'
                            )}
                          />
                        ))}
                      </span>
                      <span className="font-mono text-mono-s text-text-primary">{formatNeeded(row.needed)} of 3</span>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)')
    const update = () => setNarrow(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return narrow
}

export function JobView({ code }: { code: string }) {
  const session = useGuestSession()
  const narrow = useNarrow()
  const bundle = useRoleBundle(code)
  const related = useMemo(
    () => (bundle.status === 'ready' ? relatedRoles(code, bundle.data.related) : []),
    [bundle, code]
  )
  const fits = useSavedFits(useMemo(() => [code, ...related.map((role) => role.onet_code)], [code, related]))

  if (bundle.status === 'error') return <NotFoundView />
  if (bundle.status !== 'ready')
    return (
      <p role="status" className="text-body-m text-text-muted">
        Opening this job…
      </p>
    )

  const { role } = bundle.data
  const snapshotId = session.active_snapshot_id
  const outlook = outlookOf(role, snapshotId)
  const neededBy = `Needed by ${monthLabel(addMonths(`${snapshotId}-01`, HORIZON_MONTHS))}`
  const corners: Corner[] = roleVerdicts(role.signals[snapshotId]).corners.map((corner) => {
    const needed = Math.min(3, Math.max(1, Math.round(corner.scenarios[DEFAULT_SCENARIO].target.value))) as 1 | 2 | 3
    return {
      id: corner.corner_id,
      name: role.corners.find((c) => c.corner_id === corner.corner_id)?.name ?? corner.corner_id,
      verdict: verdictId(corner.status),
      you: 0,
      neededSlow: needed,
      neededFast: needed,
      reasoning: '',
      sources: []
    }
  })

  const points: QuadrantPoint[] = [
    { id: code, label: role.title, fit: fits?.get(code) ?? null, trend: trendOf(outlook), kind: 'job' },
    ...related.map((other) => ({
      id: other.onet_code,
      label: other.title,
      fit: fits?.get(other.onet_code) ?? null,
      trend: trendOf(outlookOf(other, snapshotId)),
      kind: 'suggested' as const
    }))
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-body-s text-text-muted">Jobs / {role.title}</p>
          <h1 className="break-words text-title-l text-text-primary">{role.title}</h1>
          <p className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-mono-s text-text-muted">O*NET {role.onet_code}</span>
            <VerdictChip verdict={outlook} size="sm" />
            <span className="text-body-s text-text-muted">{neededBy}</span>
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          iconEnd={<ArrowUpRight className="h-5 w-5" aria-hidden="true" />}
          onClick={() => navigate(`${routes.checkUp}?job=${encodeURIComponent(role.title)}`)}
        >
          Check My Fit
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-6">
          <NeedsCard role={role} snapshotId={snapshotId} />
          <section aria-labelledby="job-radar" className={cardClass}>
            <div className="space-y-1">
              <h2 id="job-radar" className="text-title-m text-text-primary">
                Radar, Needed Levels
              </h2>
              <p className="text-body-s text-text-muted">What the job asks for. No personal data on this chart.</p>
            </div>
            <FutureSkillsRadar
              corners={corners}
              scenario={DEFAULT_SCENARIO}
              neededLabel={neededBy}
              showYou={false}
              outerRadius={narrow ? '44%' : '62%'}
            />
          </section>
        </div>

        <section aria-labelledby="job-map" className={cardClass}>
          <div className="space-y-1">
            <h2 id="job-map" className="text-title-m text-text-primary">
              Where This Job Sits
            </h2>
            <p className="text-body-s text-text-muted">
              {fits
                ? 'Across: how ready you are for it, from your saved check-up. Up: the job is growing.'
                : 'Up: the job is growing. We cannot place it across until you do the check-up.'}
            </p>
          </div>
          <QuadrantMap bare points={points} />
          {!fits && (
            <div className="space-y-3 rounded-md border-[1.5px] border-dashed border-border-control p-4">
              <p className="text-label-m text-text-primary">Do the check-up to see how ready you are.</p>
              <Button variant="secondary" onClick={() => navigate(routes.checkUp)}>
                Start The Check-Up
              </Button>
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="job-related" className={cardClass}>
        <div className="space-y-1">
          <h2 id="job-related" className="text-title-m text-text-primary">
            Related Roles
          </h2>
          <p className="text-body-s text-text-muted">From O*NET, in its order. Fewer than five is fine.</p>
        </div>
        {related.length === 0 ? (
          <p className="text-body-s text-text-muted">O*NET lists no related roles with data for this job.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {related.map((other) => {
              const verdict = outlookOf(other, snapshotId)
              const fit = fits?.get(other.onet_code)
              return (
                <li key={other.onet_code} className="min-w-0">
                  <Link
                    to={jobPath(other.onet_code)}
                    className="flex h-full min-h-11 flex-col gap-2 rounded-md border-[1.5px] border-border-control bg-bg-default p-3 transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <VerdictChip verdict={verdict} size="sm" />
                    <span className="break-words text-label-l text-text-primary">{other.title}</span>
                    <span className="text-body-s text-text-muted">
                      {fit !== undefined ? `Your fit ${fit}%` : 'Open job page'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
