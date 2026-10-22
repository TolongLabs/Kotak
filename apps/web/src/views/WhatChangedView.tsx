import { DEFAULT_SCENARIO, diffSnapshots, engineInputs, transferAnswers, type SnapshotId } from '@kotak/shared'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { FutureSkillsRadar } from '../components/kotak/FutureSkillsRadar'
import { SourceReference } from '../components/kotak/SourceReference'
import { WhatChangedCard } from '../components/kotak/WhatChangedCard'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { useRoleBundle } from '../engine/bundle'
import { answeredLevels, computeCheckup } from '../engine/checkup'
import { neededByLabel, sourceRefs, toCorners } from '../engine/viewModel'
import { useGuestSession } from '../session/store'
import { useActiveSnapshot } from '../session/snapshot'
import { WhatMovedList } from './changes/WhatMovedList'
import { whatChangedItems, whatMovedRows } from './changes/whatMoved'

const beforeSnapshot: SnapshotId = '2026-04'
const afterSnapshot: SnapshotId = '2026-05'

function snapshotLabel(snapshotId: SnapshotId) {
  return new Date(`${snapshotId}-01T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

function changeSpeech(cornerCount: number, roleCount: number, beforeLabel: string, afterLabel: string) {
  if (cornerCount === 0 && roleCount === 0) return `Nothing moved between ${beforeLabel} and ${afterLabel}.`
  const changes = []
  if (cornerCount > 0) changes.push(`${cornerCount} skill${cornerCount === 1 ? '' : 's'}`)
  if (roleCount > 0) changes.push(`${roleCount} role fit${roleCount === 1 ? '' : 's'}`)
  return `${changes.join(' and ')} changed between ${beforeLabel} and ${afterLabel}.`
}

export function WhatChangedView() {
  const session = useGuestSession()
  const bundle = useRoleBundle(session.role_code)
  const [activeSnapshot, setActiveSnapshot] = useActiveSnapshot()
  const isMay = activeSnapshot === '2026-05'
  const aprilLabel = snapshotLabel(beforeSnapshot)
  const mayLabel = snapshotLabel(afterSnapshot)

  if (!session.role_code) {
    return (
      <div className="mx-auto w-full max-w-[45rem] space-y-6">
        <h1 className="sr-only">What Changed</h1>
        <CatDialogue pose="worried" speech="Tell me your job first, then I can compare its snapshots." />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Choose Your Job
        </Button>
      </div>
    )
  }

  if (bundle.status !== 'ready') {
    return (
      <div className="mx-auto w-full max-w-[45rem] space-y-6">
        <h1 className="sr-only">What Changed</h1>
        {bundle.status === 'error' ? (
          <Banner type="error" title="Kopi Could Not Open This Job" body="Reload the page, or choose your job again." />
        ) : (
          <CatDialogue pose="thinking" speech="Comparing the dated job data…" />
        )}
      </div>
    )
  }

  const { role, related } = bundle.data
  const answers = session.answers
  const today = new Date().toISOString().slice(0, 10)
  const before = computeCheckup({
    role,
    related,
    answers,
    snapshotId: beforeSnapshot,
    scenario: DEFAULT_SCENARIO,
    weeklyHours: session.custom_weekly_hours,
    startDate: today
  })
  const after = computeCheckup({
    role,
    related,
    answers,
    snapshotId: afterSnapshot,
    scenario: DEFAULT_SCENARIO,
    weeklyHours: session.custom_weekly_hours,
    startDate: today
  })
  const engine = engineInputs(role, [role, ...related])
  const transferredAnswers = transferAnswers(role, answeredLevels(role, answers))
  const diff = diffSnapshots(
    engine.role,
    transferredAnswers,
    engine.snapshots[beforeSnapshot],
    engine.snapshots[afterSnapshot],
    DEFAULT_SCENARIO
  )
  const beforeSources = sourceRefs(before)
  const afterSources = sourceRefs(after)
  const afterOffset = beforeSources.sources.length
  const changes = whatChangedItems(diff, beforeSources.sources, afterSources.sources, afterOffset)
  const movedRows = whatMovedRows(diff)
  const beforeCorners = toCorners(before, beforeSources.numbers)
  const afterNumbers = new Map(
    [...afterSources.numbers].map(([cornerId, numbers]) => [cornerId, numbers.map((number) => number + afterOffset)])
  )
  const afterCorners = toCorners(after, afterNumbers)
  const comparisonSources = [
    ...beforeSources.sources,
    ...afterSources.sources.map((source) => ({ ...source, n: source.n + afterOffset }))
  ]
  const speech = changeSpeech(diff.corners.length, diff.roles.length, aprilLabel, mayLabel)

  function switchSnapshot() {
    const next: SnapshotId = isMay ? '2026-04' : '2026-05'
    setActiveSnapshot(next)
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {role.quality === 'auto-generated' && (
        <Banner
          type="info"
          title="AI-Drafted Skills"
          body="Kopi drafted these skills from the job’s O*NET tasks. The team has not checked them by hand yet."
        />
      )}

      <CatDialogue
        pose={isMay ? 'explaining' : 'idle'}
        speech={isMay ? speech : `Nothing new yet. Load ${mayLabel} to compare both snapshots.`}
        size="lg"
      />

      <header className="space-y-1.5">
        <h1 className="text-title-m text-text-primary lg:text-title-l">What Changed</h1>
        <p className="text-body-s text-text-muted">New data arrives; Kopi shows what moved and why.</p>
      </header>

      <div className="space-y-2">
        <Button
          type="button"
          variant={isMay ? 'secondary' : 'primary'}
          size="lg"
          className="w-full lg:w-auto"
          onClick={switchSnapshot}
        >
          {isMay ? `Back to ${aprilLabel}` : `Load ${mayLabel} Snapshot`}
        </Button>
        <p className="text-body-s text-text-muted">Showing: {isMay ? mayLabel : aprilLabel} data</p>
      </div>

      {isMay ? (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            <section className="surface-card space-y-3 p-4" aria-labelledby="april-radar-title">
              <h2 id="april-radar-title" className="text-title-s text-text-primary">
                {aprilLabel} Radar
              </h2>
              <FutureSkillsRadar
                corners={beforeCorners}
                scenario={before.scenario}
                size="md"
                neededLabel={neededByLabel(before)}
              />
            </section>
            <section className="surface-card space-y-3 p-4" aria-labelledby="may-radar-title">
              <h2 id="may-radar-title" className="text-title-s text-text-primary">
                {mayLabel} Radar
              </h2>
              <FutureSkillsRadar
                corners={afterCorners}
                scenario={after.scenario}
                size="md"
                neededLabel={neededByLabel(after)}
              />
            </section>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            {changes.length > 0 ? (
              changes.map((item) => <WhatChangedCard key={item.skill} item={item} />)
            ) : (
              <section className="surface-card p-6 text-center lg:col-span-2">
                <p className="text-body-m text-text-primary">No skill changes were found between these snapshots.</p>
              </section>
            )}
          </div>
          <section className="space-y-3" aria-labelledby="comparison-sources-title">
            <h2 id="comparison-sources-title" className="text-title-m text-text-primary">
              Sources
            </h2>
            <ul className="space-y-2">
              {comparisonSources.map((source) => (
                <li key={source.n}>
                  <SourceReference source={source} />
                </li>
              ))}
            </ul>
          </section>
          <WhatMovedList rows={movedRows} />
        </>
      ) : (
        <section className="surface-card p-6 text-center">
          <p className="text-body-m text-text-primary">
            You&apos;re on {aprilLabel} data. Load {mayLabel} to compare skill and role changes.
          </p>
        </section>
      )}
    </div>
  )
}
