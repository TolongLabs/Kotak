import { assessedRoleCode, biggestGaps, computeCheckup, roleOutlook } from '@kotak/sdk'
import { addMonths, HORIZON_MONTHS, roleVerdicts, type BundleRole, type Scenario, type SnapshotId } from '@kotak/shared'
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, navigate } from '../app/router'
import { jobPath, routes, spacePath } from '../app/routes'
import { FutureSkillsRadar } from '../components/kotak/FutureSkillsRadar'
import { QuadrantMap } from '../components/kotak/QuadrantMap'
import { ScenarioControl } from '../components/kotak/ScenarioControl'
import { UntranslatedNote } from '../components/kotak/UntranslatedNote'
import { Button } from '../components/ui/Button'
import { routeLinkClassName } from '../components/ui/TextLink'
import { VerdictChip } from '../components/ui/VerdictChip'
import { cn } from '../components/ui/cn'
import type { Corner } from '../demo/types'
import { loadRoleBundle, useRoleBundle, useRoleIndex } from '../engine/bundle'
import { topGapLabel, trendOf, type QuadrantPoint } from '../engine/quadrant'
import { verdictId } from '../engine/viewModel'
import { hasAnswers, useGuestSession } from '../session/store'
import { useScenario } from '../session/scenario'
import { NotFoundView } from './NotFoundView'
import { dateLocale } from '../i18n/locale'
import { rolesText } from '../i18n/messages/roles'
import { useText } from '../i18n/text'

/** Related roles that have a file, in O*NET's order, each once and never the job itself. */
export function relatedRoles<T extends { onet_code: string }>(self: string, related: T[], limit = 5): T[] {
  const seen = new Set([self])
  return related.filter((role) => !seen.has(role.onet_code) && seen.add(role.onet_code)).slice(0, limit)
}

const outlookOf = (role: BundleRole, snapshotId: SnapshotId) => roleOutlook(role, snapshotId)

const monthLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString(dateLocale(), { month: 'short', year: 'numeric', timeZone: 'UTC' })

const formatNeeded = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1))

/**
 * The user's fit for each code, from the answers in their session, or null while they have no check-up (no assessed
 * job or no answer yet) or the roles are still loading. A job outside the check-up's own list is scored the same way
 * as the check-up does, by asking for it as an extra role.
 */
interface SavedFit {
  fit: number
  gap?: { name: string; you: number; needed: number }
}

function useSavedFits(codes: string[]): Map<string, SavedFit> | null {
  const session = useGuestSession()
  const [scenario] = useScenario()
  const assessed = assessedRoleCode(session)
  const answered = session.answers.some((answer) => answer !== null)
  const key = assessed && answered ? JSON.stringify([assessed, codes, scenario]) : null
  const [state, setState] = useState<{ key: string; fits: Map<string, SavedFit> } | null>(null)

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
          scenario,
          weeklyHours: session.custom_weekly_hours,
          profile: session.profile,
          startDate: new Date().toISOString().slice(0, 10)
        })
        const fits = new Map<string, SavedFit>(
          checkup.roles.map((role) => {
            const corners =
              [bundle.role, ...bundle.related].find((other) => other.onet_code === role.onet_code)?.corners ?? []
            const gap = biggestGaps(role.fit)[0]
            return [
              role.onet_code,
              {
                fit: Math.round(role.fit.score),
                gap: gap
                  ? {
                      name: corners.find((corner) => corner.corner_id === gap.corner_id)?.name ?? gap.corner_id,
                      you: gap.user_level,
                      needed: gap.target_level
                    }
                  : undefined
              }
            ] as const
          })
        )
        if (current) setState({ key, fits })
      },
      () => {
        // A failed load leaves the page in its no-check-up view rather than showing a wrong fit.
      }
    )
    return () => {
      current = false
    }
  }, [key, session.answers, session.active_snapshot_id, session.custom_weekly_hours, scenario])

  return state && state.key === key ? state.fits : null
}

const cardClass = 'surface-card min-w-0 space-y-4 p-4 sm:p-6'

function NeedsCard({ role, snapshotId, scenario }: { role: BundleRole; snapshotId: SnapshotId; scenario: Scenario }) {
  const t = useText(rolesText)
  const names = new Map(role.corners.map((corner) => [corner.corner_id, corner.name]))
  const rows = roleVerdicts(role.signals[snapshotId]).corners.map((corner) => ({
    id: corner.corner_id,
    name: names.get(corner.corner_id) ?? corner.corner_id,
    verdict: verdictId(corner.status),
    needed: corner.scenarios[scenario].target.value
  }))
  return (
    <section aria-labelledby="job-needs" className={cardClass}>
      <div className="space-y-1">
        <h2 id="job-needs" className="text-title-m text-text-primary">
          {t.jobView.needsTitle}
        </h2>
        <p className="text-body-s text-text-muted">{t.jobView.needsCount(rows.length)}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="font-mono text-mono-s text-text-muted">
              <th scope="col" className="py-2 pr-3 font-normal">
                {t.jobView.skill}
              </th>
              <th scope="col" className="py-2 pr-3 font-normal">
                {t.jobView.trend}
              </th>
              <th scope="col" className="py-2 font-normal">
                {t.jobView.neededLevel}
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
                      <span className="font-mono text-mono-s text-text-primary">
                        {t.jobView.ofThree(formatNeeded(row.needed))}
                      </span>
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
  const t = useText(rolesText)
  const session = useGuestSession()
  const [scenario, setScenario] = useScenario()
  const narrow = useNarrow()
  const bundle = useRoleBundle(code)
  // The check-up finds a job by its English title, so the link sends that one in every language (#449).
  const roleIndex = useRoleIndex()
  const englishTitle =
    (roleIndex.status === 'ready' && roleIndex.data.roles.find((r) => r.onet_code === code)?.title) || null
  const related = useMemo(
    () => (bundle.status === 'ready' ? relatedRoles(code, bundle.data.related) : []),
    [bundle, code]
  )
  const fits = useSavedFits(useMemo(() => [code, ...related.map((role) => role.onet_code)], [code, related]))

  if (bundle.status === 'error') return <NotFoundView />
  if (bundle.status !== 'ready')
    return (
      <p role="status" className="text-body-m text-text-muted">
        {t.jobView.opening}
      </p>
    )

  const { role } = bundle.data
  const snapshotId = session.active_snapshot_id
  const outlook = outlookOf(role, snapshotId)
  const neededBy = t.jobView.neededBy(monthLabel(addMonths(`${snapshotId}-01`, HORIZON_MONTHS)))
  const corners: Corner[] = roleVerdicts(role.signals[snapshotId]).corners.map((corner) => {
    const needed = Math.min(3, Math.max(1, Math.round(corner.scenarios[scenario].target.value))) as 1 | 2 | 3
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
    {
      id: code,
      label: role.title,
      fit: fits?.get(code)?.fit ?? null,
      gap: fits?.get(code)?.gap ? topGapLabel(fits.get(code)!.gap!) : undefined,
      trend: trendOf(outlook),
      kind: code === session.role_code ? 'you' : 'suggested'
    },
    ...related.map((other) => ({
      id: other.onet_code,
      label: other.title,
      fit: fits?.get(other.onet_code)?.fit ?? null,
      gap: fits?.get(other.onet_code)?.gap ? topGapLabel(fits.get(other.onet_code)!.gap!) : undefined,
      trend: trendOf(outlookOf(other, snapshotId)),
      kind: 'suggested' as const
    }))
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-body-s text-text-muted">
            {t.jobView.jobs} / {role.title}
          </p>
          <h1 className="break-words text-title-l text-text-primary">{role.title}</h1>
          <UntranslatedNote onetCode={role.onet_code} />
          <p className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-mono-s text-text-muted">O*NET {role.onet_code}</span>
            <VerdictChip verdict={outlook} size="sm" />
            <span className="text-body-s text-text-muted">{neededBy}</span>
            {/* Without a check-up the space has no fit to place jobs by, so it opens in Look Around. */}
            <Link
              to={spacePath(role.onet_code, !(assessedRoleCode(session) && hasAnswers(session)))}
              className={routeLinkClassName}
            >
              {t.jobView.findInSpace}
            </Link>
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          iconEnd={<ArrowUpRight className="h-5 w-5" aria-hidden="true" />}
          onClick={() => navigate(`${routes.checkUp}?job=${encodeURIComponent(englishTitle ?? role.title)}`)}
        >
          {t.jobView.checkFit}
        </Button>
        <ScenarioControl scenario={scenario} onChange={setScenario} />
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-6">
          <NeedsCard role={role} snapshotId={snapshotId} scenario={scenario} />
          <section aria-labelledby="job-radar" className={cardClass}>
            <div className="space-y-1">
              <h2 id="job-radar" className="text-title-m text-text-primary">
                {t.jobView.radarTitle}
              </h2>
              <p className="text-body-s text-text-muted">{t.jobView.radarDescription}</p>
            </div>
            <FutureSkillsRadar
              corners={corners}
              scenario={scenario}
              neededLabel={neededBy}
              showYou={false}
              outerRadius={narrow ? '44%' : '62%'}
            />
          </section>
        </div>

        <section aria-labelledby="job-map" className={cardClass}>
          <div className="space-y-1">
            <h2 id="job-map" className="text-title-m text-text-primary">
              {t.jobView.mapTitle}
            </h2>
            <p className="text-body-s text-text-muted">{fits ? t.jobView.mapWithFit : t.jobView.mapWithoutFit}</p>
          </div>
          <QuadrantMap bare points={points} focusId={code} />
          {!fits && (
            <div className="space-y-3 rounded-md border-[1.5px] border-dashed border-border-control p-4">
              <p className="text-label-m text-text-primary">{t.jobView.checkupPrompt}</p>
              <Button variant="secondary" onClick={() => navigate(routes.checkUp)}>
                {t.jobView.startCheckup}
              </Button>
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="job-related" className={cardClass}>
        <div className="space-y-1">
          <h2 id="job-related" className="text-title-m text-text-primary">
            {t.jobView.relatedTitle}
          </h2>
          <p className="text-body-s text-text-muted">{t.jobView.relatedDescription}</p>
        </div>
        {related.length === 0 ? (
          <p className="text-body-s text-text-muted">{t.jobView.noRelated}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {related.map((other) => {
              const verdict = outlookOf(other, snapshotId)
              const fit = fits?.get(other.onet_code)?.fit
              return (
                <li key={other.onet_code} className="min-w-0">
                  <Link
                    to={jobPath(other.onet_code)}
                    className="flex h-full min-h-11 flex-col gap-2 rounded-md border-[1.5px] border-border-control bg-bg-default p-3 transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <VerdictChip verdict={verdict} size="sm" />
                    <span className="break-words text-label-l text-text-primary">{other.title}</span>
                    <span className="text-body-s text-text-muted">
                      {fit !== undefined ? t.jobView.yourFit(fit) : t.jobView.openJob}
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
