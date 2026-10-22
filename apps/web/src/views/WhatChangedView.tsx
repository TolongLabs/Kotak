import { DEFAULT_SCENARIO, diffSnapshots, engineInputs, transferAnswers, type SnapshotId } from '@kotak/shared'
import { RefreshCw } from 'lucide-react'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { SourceReference } from '../components/kotak/SourceReference'
import { WhatChangedCard } from '../components/kotak/WhatChangedCard'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { Toast } from '../components/ui/Toast'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { useRoleBundle } from '../engine/bundle'
import { answeredLevels, computeCheckup } from '../engine/checkup'
import { sourceRefs, toCorners } from '../engine/viewModel'
import { useGuestSession } from '../session/store'
import { useActiveSnapshot } from '../session/snapshot'
import { whatChangedItems } from './changes/whatMoved'
import { WhatChangedRadar } from './changes/WhatChangedRadar'

const beforeSnapshot: SnapshotId = '2026-04'
const afterSnapshot: SnapshotId = '2026-05'

function snapshotQuarterLabel(snapshotId: SnapshotId) {
  if (snapshotId === '2026-04') return 'Q2 2026'
  if (snapshotId === '2026-05') return 'Q3 2026'
  const date = new Date(`${snapshotId}-01T00:00:00Z`)
  const month = date.getUTCMonth()
  const q = Math.floor(month / 3) + 1
  return `Q${q} ${date.getUTCFullYear()}`
}

function quarterOnly(snapshotId: SnapshotId) {
  return snapshotQuarterLabel(snapshotId).split(' ')[0]
}

const countWords: Record<number, string> = {
  1: 'One',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six'
}

function changeSpeech(
  cornerCount: number,
  roleCount: number,
  beforeLabel: string,
  afterLabel: string,
  roadmapMoved: boolean
) {
  if (cornerCount === 0 && roleCount === 0) return `Nothing moved between ${beforeLabel} and ${afterLabel}.`
  const countStr = countWords[cornerCount] ?? String(cornerCount)
  if (roadmapMoved) {
    return `New data landed. ${countStr} skills moved, and your roadmap moved with them.`
  }
  return `New data landed. ${countStr} skills changed between ${beforeLabel} and ${afterLabel}.`
}

export function WhatChangedView() {
  const session = useGuestSession()
  const bundle = useRoleBundle(session.role_code)
  const [activeSnapshot, setActiveSnapshot] = useActiveSnapshot()
  const isMay = activeSnapshot === afterSnapshot
  const beforeLabel = snapshotQuarterLabel(beforeSnapshot)
  const afterLabel = snapshotQuarterLabel(afterSnapshot)

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
  const changes = whatChangedItems(diff, beforeSources.sources, afterSources.sources, afterOffset, role, before, after)
  const beforeCorners = toCorners(before, beforeSources.numbers)
  const afterNumbers = new Map(
    [...afterSources.numbers].map(([cornerId, numbers]) => [cornerId, numbers.map((number) => number + afterOffset)])
  )
  const afterCorners = toCorners(after, afterNumbers)
  const comparisonSources = [
    ...beforeSources.sources,
    ...afterSources.sources.map((source) => ({ ...source, n: source.n + afterOffset }))
  ]
  const speech = changeSpeech(diff.corners.length, diff.roles.length, beforeLabel, afterLabel, diff.roadmap_reordered)

  function switchSnapshot() {
    const next: SnapshotId = isMay ? beforeSnapshot : afterSnapshot
    setActiveSnapshot(next)
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <h1 className="sr-only">What Changed</h1>

      {role.quality === 'auto-generated' && (
        <Banner
          type="info"
          title="AI-Drafted Skills"
          body="Kopi drafted these skills from the job’s O*NET tasks. The team has not checked them by hand yet."
        />
      )}

      {/* Demo control */}
      <div className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-bg-panel px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <RefreshCw className="h-5 w-5 shrink-0 stroke-current text-text-primary" aria-hidden="true" />
          <span className="text-label-m text-text-primary">
            Live Demo: {isMay ? `${afterLabel} Data Loaded` : `${beforeLabel} Data Loaded`}
          </span>
        </div>
        <Button type="button" variant="secondary" size="lg" className="h-12 shrink-0" onClick={switchSnapshot}>
          {isMay ? `Back to ${beforeLabel}` : `Load May 2026 Snapshot`}
        </Button>
      </div>

      {/* Toast */}
      {isMay && (
        <Toast
          type="info"
          title={`New Data Landed: ${afterLabel}`}
          action={
            <a
              href="#what-changed-changes"
              className="text-label-m font-semibold text-text-primary underline decoration-current underline-offset-2 transition-colors hover:text-text-muted"
            >
              See What Changed
            </a>
          }
          className="w-full sm:max-w-[360px]"
        />
      )}

      {/* Cat Dialogue */}
      <CatDialogue
        pose={isMay ? 'explaining' : 'idle'}
        speech={isMay ? speech : `Nothing new yet. Load May 2026 Snapshot to compare both snapshots.`}
        size="md"
      />

      {isMay ? (
        <>
          {/* Main 2-column on desktop, single column on phone */}
          <div id="what-changed-changes" className="flex flex-col gap-8 lg:flex-row lg:gap-8">
            {/* Left Column: Changes */}
            <section className="flex flex-1 min-w-0 flex-col gap-4" aria-labelledby="changes-title">
              <h2 id="changes-title" className="text-title-s text-text-primary">
                What Changed Since {beforeLabel}
              </h2>
              <div className="flex flex-col gap-4">
                {changes.length > 0 ? (
                  changes.map((item) => <WhatChangedCard key={item.skill} item={item} />)
                ) : (
                  <div className="surface-card rounded-md border border-border-subtle bg-bg-default p-6 text-center">
                    <p className="text-body-m text-text-primary">
                      No skill changes were found between these snapshots.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Right Column: Radar and Sources */}
            <section className="flex flex-1 min-w-0 flex-col gap-4" aria-labelledby="radar-title">
              <h2 id="radar-title" className="text-title-s text-text-primary">
                The Dashed Line Moved
              </h2>
              <WhatChangedRadar
                beforeCorners={beforeCorners}
                afterCorners={afterCorners}
                scenario={after.scenario}
                neededNowLabel={`Needed Now (${quarterOnly(afterSnapshot)})`}
                beforeLabel={`Before (${quarterOnly(beforeSnapshot)})`}
              />
              <div className="space-y-2 rounded-md border border-border-subtle bg-bg-default p-4">
                {comparisonSources.map((source) => (
                  <SourceReference key={source.n} source={source} />
                ))}
              </div>
            </section>
          </div>

          {/* Desktop primary button */}
          <div className="hidden lg:block">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              className="h-12"
              onClick={() => navigate(routes.roadmap)}
            >
              See My Updated Roadmap
            </Button>
          </div>

          {/* Phone action island */}
          <div className="rounded-md border border-border-subtle bg-surface-glass p-3 backdrop-blur-[24px] lg:hidden">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              className="h-[52px]"
              onClick={() => navigate(routes.roadmap)}
            >
              See My Updated Roadmap
            </Button>
          </div>
        </>
      ) : (
        <div className="surface-card rounded-md border border-border-subtle bg-bg-panel p-6 text-center">
          <p className="text-body-m text-text-primary">
            You&apos;re on {beforeLabel} data. Load May 2026 Snapshot to compare skill and role changes.
          </p>
        </div>
      )}
    </div>
  )
}
