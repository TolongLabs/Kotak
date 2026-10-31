import { ArrowUpRight, Info, Orbit } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { jobMarketLevelForYears, yearsOfWork } from '@kotak/shared'
import { AccessChip, AccessNotice } from '../components/kotak/AccessNotice'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { payLabel, popularityLabel } from '../components/kotak/JobMarketCard'
import { Reasoning } from '../components/kotak/Reasoning'
import { RoleCard } from '../components/kotak/RoleCard'
import { ScenarioControl } from '../components/kotak/ScenarioControl'
import { ScenarioMathsNote } from '../components/kotak/ScenarioMathsNote'
import { SdgTargetChip } from '../components/kotak/SdgReasonChip'
import { SourceList } from '../components/kotak/SourceList'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { Citation } from '../components/ui/Citation'
import { Disclosure } from '../components/ui/Disclosure'
import { Stepper } from '../components/ui/Stepper'
import { Link, navigate } from '../app/router'
import { routes, spacePath } from '../app/routes'
import { assessedRoleCode, useCheckup } from '../engine/checkup'
import { occupationSdgs } from '../engine/occupationSdg'
import { biggestFitMove } from '../engine/futureDiff'
import { useJobMarkets } from '../engine/useJobMarkets'
import { toRoles } from '../engine/viewModel'
import { useScenario } from '../session/scenario'
import { hasAnswers, updateGuestSession, useGuestSession } from '../session/store'
import {
  deriveRoleEvidence,
  kopiRoleSpeech,
  pickDisplayRoles,
  selectionNote,
  sessionHeading,
  translateRoleReasons,
  type SelectionReason
} from './roles/derived'
import { estimatedCorners, formatFitPercent, formatLevel } from './roles/fit'
import type { SourceRef } from '../demo/types'
import { startAgain } from './checkup/startAgain'
import { changesText } from '../i18n/messages/changes'
import { rolesText } from '../i18n/messages/roles'
import { useText } from '../i18n/text'

interface FitRow {
  name: string
  you: string
  needed: string
  counts: string
  estimated: boolean
  youLevel: number
  neededLevel: number
}

function FitChart({ rows, allEstimated, title }: { rows: FitRow[]; allEstimated: boolean; title: string }) {
  const t = useText(rolesText)
  const skillLabel = (row: FitRow) => (row.estimated && !allEstimated ? t.rolesView.estimatedSkill(row.name) : row.name)
  const data = rows.map((row) => ({
    skill: skillLabel(row),
    You: row.youLevel,
    Needed: row.neededLevel
  }))
  return (
    <div>
      <div role="img" aria-label={t.rolesView.chartLabel(title)} style={{ height: rows.length * 64 + 56 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }} barGap={2}>
            <CartesianGrid horizontal={false} stroke="var(--color-border-subtle)" />
            <XAxis
              type="number"
              domain={[0, 3]}
              ticks={[0, 1, 2, 3]}
              allowDecimals={false}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="skill"
              width={112}
              tick={{ fill: 'var(--color-text-primary)', fontSize: 12 }}
            />
            {/* Recharts lists Needed first for this layout, and tints the You label yellow on white: draw the legend by hand. */}
            <Legend
              content={() => (
                <ul className="flex justify-center gap-4 text-label-m text-text-primary">
                  {[
                    { label: t.rolesView.chartYou, color: 'var(--color-radar-you)' },
                    { label: t.rolesView.chartNeeded, color: 'var(--color-text-primary)' }
                  ].map(({ label, color }) => (
                    <li key={label} className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 border border-text-primary"
                        style={{ background: color }}
                      />
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            />
            <Bar
              dataKey="You"
              fill="var(--color-radar-you)"
              stroke="var(--color-text-primary)"
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            <Bar dataKey="Needed" fill="var(--color-text-primary)" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only">
        {rows.map((row) => (
          <li key={row.name}>{t.rolesView.chartRow(skillLabel(row), row.you, row.needed)}</li>
        ))}
      </ul>
    </div>
  )
}

export function RolesView() {
  const t = useText(rolesText)
  const session = useGuestSession()
  const [scenario, setScenario] = useScenario()
  const loaded = useCheckup({ scenario })
  // The other AI future, so the switch can say which fit it moves.
  const other = useCheckup({ scenario: scenario === 'slow' ? 'fast' : 'slow' })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const futures = useText(changesText).receipts
  const checkup = loaded.status === 'ready' ? loaded.data.checkup : null
  const aiOff = new URLSearchParams(window.location.search).get('ai') === 'off'
  // Active ads, estimated JobStreet ads and median pay per ranked role (#272), from JobStreet ads Kotak's admins
  // approved.
  const markets = useJobMarkets(checkup?.roles.map((candidate) => candidate.onet_code) ?? [])
  // Pay for the user's level, from their years of work, where enough ads at that level state it.
  const level = jobMarketLevelForYears(yearsOfWork(session.profile))

  if (!assessedRoleCode(session) || !hasAnswers(session)) {
    const restart = startAgain(session)
    const restartCopy =
      restart.route === routes.questions
        ? t.rolesView.restart.questions
        : restart.route === routes.choose
          ? t.rolesView.restart.role
          : t.rolesView.restart.job
    return (
      <div className="space-y-5 lg:space-y-6">
        <h1 className="sr-only">{t.rolesView.matched}</h1>
        <Stepper step={4} />
        <CatDialogue pose="worried" speech={restartCopy.speech} />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(restart.route)}>
          {restartCopy.label}
        </Button>
      </div>
    )
  }

  if (loaded.status !== 'ready' || !checkup) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <h1 className="sr-only">{t.rolesView.matched}</h1>
        <Stepper step={4} />
        {loaded.status === 'error' ? (
          <Banner type="error" title={t.rolesView.errorTitle} body={t.rolesView.errorBody} />
        ) : (
          <CatDialogue pose="thinking" speech={t.rolesView.loading} />
        )}
      </div>
    )
  }

  const pool = loaded.data.bundle
  const { role, related } = pool
  // The fast future's multiplier, quoted from the data in See the Maths (#389).
  const scenarioAnchors = role.signals[checkup.snapshotId]?.anchors
  const bundleRoles = [role, ...related]
  const ranked = toRoles(checkup, bundleRoles, session.role_code, { bundle: pool, session })

  const widened = pool.candidates.length > 0
  const {
    roles: displayRoles,
    defaultId,
    defaultReason
  } = pickDisplayRoles(session.goal, session.target_role_code, ranked, {
    widened,
    targets: session.profile.target_role_codes
  })
  // The visitor's own pick, else the role their roadmap is for, else Kopi's pick; the card says which.
  const shown = (id: string | null) => (id ? displayRoles.find((candidate) => candidate.id === id) : undefined)
  const userPick = shown(selectedId)
  const planPick = shown(session.plan_role_code)
  const selected = userPick ?? planPick ?? shown(defaultId)
  const selectionReason: SelectionReason | null = userPick
    ? { kind: 'picked' }
    : planPick
      ? { kind: 'plan' }
      : defaultReason

  const detailCheckupRole = checkup.roles.find((candidate) => candidate.onet_code === selected?.id)
  const detailBundleRole = bundleRoles.find((candidate) => candidate.onet_code === selected?.id)

  const kopiPick = shown(defaultId)
  const speech = kopiRoleSpeech(
    widened ? displayRoles : ranked,
    session.goal === 'explore' ? undefined : kopiPick,
    kopiPick && defaultReason ? { role: kopiPick, reason: defaultReason } : undefined
  )
  const heading = sessionHeading(session.goal)

  const otherRanked =
    other.status === 'ready'
      ? toRoles(other.data.checkup, bundleRoles, session.role_code, { bundle: pool, session })
      : []
  const fitMap = (roles: typeof ranked) => new Map(roles.map((candidate) => [candidate.id, candidate.fit]))
  const [slowFits, fastFits] =
    scenario === 'slow' ? [fitMap(ranked), fitMap(otherRanked)] : [fitMap(otherRanked), fitMap(ranked)]
  const fitMove = biggestFitMove(displayRoles, slowFits, fastFits)
  const futureReceipt = fitMove
    ? {
        slow: futures.rolesPreview(fitMove.title, fitMove.from, fitMove.to),
        fast: futures.rolesDone(fitMove.title, fitMove.from, fitMove.to)
      }
    : { slow: futures.rolesSame, fast: futures.rolesSame }

  const selectedSdgs = selected ? occupationSdgs(selected.id) : null
  const roleEvidence = selected ? deriveRoleEvidence(detailCheckupRole, detailBundleRole, checkup.snapshotId) : null
  // Only the sources the visible rows cite; the first two when no row cites one.
  const citedNumbers = new Set(roleEvidence?.rows.map((row) => row.citation).filter((n) => n !== null))
  const allSources = roleEvidence?.sources ?? []
  const evidenceSources =
    citedNumbers.size > 0 ? allSources.filter((source) => citedNumbers.has(source.n)) : allSources.slice(0, 2)
  // The job-ad source, numbered after the role evidence's sources, when any card shows ad figures.
  const shownMarkets = displayRoles.flatMap((displayRole) => {
    const market = markets.get(displayRole.id)
    return market ? [market] : []
  })
  const marketSource: SourceRef | null = shownMarkets.length
    ? {
        n: allSources.length + 1,
        name: shownMarkets[0].source.source_name,
        detail: `${shownMarkets[0].source.geo_or_layer} · ${shownMarkets
          .map((market) => market.source.vintage_date)
          .sort()
          .at(-1)}`,
        href: shownMarkets[0].source.source_url
      }
    : null
  const displaySources = marketSource ? [...evidenceSources, marketSource] : evidenceSources

  const reasoningText = roleEvidence?.summary ?? ''

  const cornerName = new Map(detailBundleRole?.corners.map((corner) => [corner.corner_id, corner.name]) ?? [])
  const carryOver = detailCheckupRole ? estimatedCorners(detailCheckupRole) : new Set<string>()
  const fitRows = detailCheckupRole
    ? detailCheckupRole.fit.terms.map((term) => ({
        name: cornerName.get(term.corner_id) ?? term.corner_id,
        you: formatLevel(term.user_level),
        needed: formatLevel(term.target_level),
        counts: formatLevel(term.term),
        estimated: carryOver.has(term.corner_id),
        youLevel: term.user_level,
        neededLevel: term.target_level
      }))
    : []
  // When every level is carried over, one caption replaces a badge on every row.
  const allEstimated = fitRows.length > 0 && fitRows.every((fitRow) => fitRow.estimated)
  const mathsFormula = detailCheckupRole
    ? t.rolesView.fitFormula(
        formatLevel(detailCheckupRole.fit.numerator),
        formatLevel(detailCheckupRole.fit.denominator),
        formatFitPercent(detailCheckupRole.fit.score)
      )
    : ''
  const mathsAnswer = (
    <>
      <p className="pb-3">{mathsFormula}</p>
      {scenarioAnchors && (
        <div className="pb-3">
          <ScenarioMathsNote anchors={scenarioAnchors} />
        </div>
      )}
      <div role="region" tabIndex={0} aria-label={t.rolesView.fitBySkill} className="overflow-x-auto">
        <table className="w-full text-body-s text-text-primary">
          <caption className="sr-only">{t.rolesView.fitTableCaption}</caption>
          <thead>
            <tr className="bg-bg-panel text-left text-label-m">
              <th scope="col" className="px-2 py-1.5">
                {t.rolesView.skills}
              </th>
              <th scope="col" className="px-2 py-1.5 text-right">
                {t.rolesView.chartYou}
              </th>
              <th scope="col" className="px-2 py-1.5 text-right">
                {t.rolesView.chartNeeded}
              </th>
              <th scope="col" className="px-2 py-1.5 text-right">
                {t.rolesView.counts}
              </th>
            </tr>
          </thead>
          <tbody>
            {fitRows.map((fitRow) => (
              <tr key={fitRow.name} className="border-t border-border-subtle">
                <th scope="row" className="px-2 py-1.5 text-left font-normal">
                  {fitRow.name}
                </th>
                <td className="whitespace-nowrap px-2 py-1.5 text-right font-mono text-mono-m">
                  {/* On phones the badge drops under the level, so all four columns fit. */}
                  <span className="inline-flex flex-col items-end gap-1 sm:flex-row sm:items-center">
                    {fitRow.you}
                    {fitRow.estimated && !allEstimated && (
                      <span className="rounded-full border border-border-control px-1.5 py-0.5 font-sans text-label-s text-text-muted">
                        {t.rolesView.estimated}
                      </span>
                    )}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-right font-mono text-mono-m">{fitRow.needed}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-right font-mono text-mono-m">{fitRow.counts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
  function pick() {
    updateGuestSession({
      plan_role_code: selected ? selected.id : null
    })
    navigate(routes.roadmap)
  }

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <Stepper step={4} />

      <CatDialogue pose="explaining" speech={speech} />

      <header className="flex flex-col gap-1.5">
        <h1 className="text-title-m font-bold text-text-primary lg:text-title-l">{heading}</h1>
        {/* One sentence up front; where the outlook and ad figures come from is one tap away. */}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-s text-text-muted">
          {t.rolesView.intro.fit}
          <button
            type="button"
            aria-expanded={aboutOpen}
            aria-controls="roles-about"
            onClick={() => setAboutOpen((value) => !value)}
            className="inline-flex min-h-6 items-center gap-1 rounded-sm text-label-s text-text-primary underline underline-offset-2 hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Info className="h-3.5 w-3.5 shrink-0 stroke-current" aria-hidden="true" />
            {t.rolesView.intro.about}
          </button>
        </p>
        <p id="roles-about" hidden={!aboutOpen} className="max-w-[65ch] text-body-s text-text-muted">
          {t.rolesView.intro.outlook}
          {widened && t.rolesView.intro.widened} {t.rolesView.intro.cardSelection}
          {marketSource && (
            <>
              {' '}
              {t.rolesView.intro.marketSource} <Citation n={marketSource.n} />.
            </>
          )}
        </p>
      </header>

      <ScenarioControl
        scenario={scenario}
        onChange={setScenario}
        receipt={futureReceipt}
        anchors={scenarioAnchors}
        trailing={
          // The highlighted card's role opens pinned; the other cards' roles are the space's related tufts.
          <Link
            to={spacePath(selected?.id)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-text-primary px-3.5 text-label-m text-bg-default transition-colors duration-150 ease-out hover:bg-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Orbit className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
            {t.rolesView.seeInSpace}
            <ArrowUpRight className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
          </Link>
        }
      />

      <section role="radiogroup" aria-label={heading} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {displayRoles.map((displayRole) => {
          const market = markets.get(displayRole.id)
          return (
            <RoleCard
              key={displayRole.id}
              role={displayRole}
              name="role"
              selected={displayRole.id === selected?.id}
              note={displayRole.id === selected?.id && selectionReason ? selectionNote(selectionReason) : undefined}
              tag={displayRole.isCurrentJob ? t.card.yourJob : undefined}
              onSelect={() => setSelectedId(displayRole.id)}
              footer={
                (market || displayRole.access || displayRole.reasons?.length) && (
                  <span className="flex flex-col gap-2">
                    {displayRole.access && displayRole.access.status !== 'open' && (
                      <AccessChip access={displayRole.access} className="self-start" />
                    )}
                    {displayRole.reasons && displayRole.reasons.length > 0 && (
                      <span className="text-body-s text-text-muted">
                        {translateRoleReasons(displayRole.reasonCodes, displayRole.reasons).join(' · ')}
                      </span>
                    )}
                    {market && (
                      <span className="text-body-s text-text-primary">
                        {t.market.activeAdsCount(market.ads.active)}
                        {popularityLabel(market) && ` · ${popularityLabel(market)}`}
                        {payLabel(market, level) && ` · ${payLabel(market, level)}`}
                      </span>
                    )}
                  </span>
                )
              }
            />
          )
        })}
      </section>

      {selected?.access && (
        <AccessNotice
          access={selected.access}
          roleTitle={selected.title}
          fit={{ percent: selected.fit, estimated: Boolean(selected.fitEstimated) }}
        />
      )}

      {selected && (
        <section aria-labelledby="role-detail-title" className="surface-card space-y-4 p-4 lg:p-5">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="role-detail-title" className="text-title-s text-text-primary">
              {selected.title}
            </h2>
            {selectedSdgs && selectedSdgs.targets.length > 0 && (
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-mono-s text-text-muted">{t.rolesView.linkedSdgTargets}</span>
                {selectedSdgs.targets.slice(0, 3).map((target) => (
                  <SdgTargetChip key={target} target={target} workReason={selectedSdgs.reason} />
                ))}
              </span>
            )}
          </header>

          {/* Why first, beside How Fit Is Worked Out, both one height. */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 [&>*]:min-w-0">
            <div className="flex flex-col [&>section]:h-full" aria-label={t.rolesView.whyRole}>
              <Reasoning text={reasoningText} source="template" paused={aiOff} rows={roleEvidence?.rows ?? []} />
            </div>
            <section aria-labelledby="fit-maths-title" className="flex flex-col gap-3">
              <h3 id="fit-maths-title" className="text-label-l text-text-primary">
                {t.rolesView.fitMaths}
              </h3>
              <p className="text-body-s text-text-primary">
                {detailCheckupRole
                  ? t.rolesView.fitDetail(
                      formatLevel(detailCheckupRole.fit.numerator),
                      formatLevel(detailCheckupRole.fit.denominator),
                      selected.title,
                      formatFitPercent(detailCheckupRole.fit.score)
                    )
                  : t.rolesView.fitNotReady(selected.title)}
              </p>
              {fitRows.length > 0 && <FitChart rows={fitRows} allEstimated={allEstimated} title={selected.title} />}
              {allEstimated && <p className="text-body-s text-text-muted">{t.rolesView.estimatedFrom(role.title)}</p>}
            </section>
          </div>

          <div className="border-b border-border-subtle">
            {detailCheckupRole && mathsFormula && (
              <Disclosure title={t.rolesView.seeMaths}>
                <div className="text-body-m text-text-muted">{mathsAnswer}</div>
              </Disclosure>
            )}
            <SourceList sources={displaySources} variant="rule" />
          </div>
        </section>
      )}

      {/* Action CTA */}
      <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 rounded-md p-3 lg:static lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <Button variant="primary" size="lg" fullWidth onClick={pick}>
          {t.rolesView.buildRoadmap}
        </Button>
      </div>
    </div>
  )
}
