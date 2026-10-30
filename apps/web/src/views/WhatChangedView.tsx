import { diffSnapshots, engineInputs, transferAnswers, type SnapshotId } from '@kotak/shared'
import { RefreshCw } from 'lucide-react'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { SourceList } from '../components/kotak/SourceList'
import { WhatChangedCard } from '../components/kotak/WhatChangedCard'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { useCheckupBundle } from '../engine/bundle'
import { answeredLevels, assessedRoleCode, computeCheckup } from '../engine/checkup'
import { sourceRefs, toCorners } from '../engine/viewModel'
import { hasAnswers, useGuestSession } from '../session/store'
import { useScenario } from '../session/scenario'
import { useActiveSnapshot } from '../session/snapshot'
import { whatChangedItems } from './changes/whatMoved'
import { dateLocale } from '../i18n/locale'
import { changesText } from '../i18n/messages/changes'
import { textNow, useText } from '../i18n/text'
import { WhatChangedRadar } from './changes/WhatChangedRadar'
import { startAgain } from './checkup/startAgain'

const beforeSnapshot: SnapshotId = '2026-04'
const afterSnapshot: SnapshotId = '2026-05'

function snapshotMonthLabel(snapshotId: SnapshotId) {
  const date = new Date(`${snapshotId}-01T00:00:00Z`)
  return date.toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function changeSpeech(
  cornerCount: number,
  roleCount: number,
  beforeLabel: string,
  afterLabel: string,
  roadmapMoved: boolean
) {
  const t = textNow(changesText)
  if (cornerCount === 0 && roleCount === 0) return t.speechNone(beforeLabel, afterLabel)
  const countStr = t.countWord(cornerCount)
  if (roadmapMoved) {
    return t.speechRoadmap(countStr, cornerCount)
  }
  if (cornerCount > 0) {
    return t.speechSkills(countStr, cornerCount, beforeLabel, afterLabel)
  }
  return t.speechRoles(beforeLabel, afterLabel)
}

export function WhatChangedView() {
  const t = useText(changesText)
  const session = useGuestSession()
  const bundle = useCheckupBundle(session)
  const [scenario] = useScenario()
  const [activeSnapshot, setActiveSnapshot] = useActiveSnapshot()
  const isMay = activeSnapshot === afterSnapshot
  const beforeLabel = snapshotMonthLabel(beforeSnapshot)
  const afterLabel = snapshotMonthLabel(afterSnapshot)

  if (!assessedRoleCode(session) || !hasAnswers(session)) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <h1 className="text-title-m text-text-primary lg:text-title-l">{t.title}</h1>
        <CatDialogue pose="worried" speech={`${startAgain(session).speech}, then I can compare its snapshots.`} />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(startAgain(session).route)}>
          {startAgain(session).label}
        </Button>
      </div>
    )
  }

  if (bundle.status !== 'ready') {
    return (
      <div className="space-y-5 lg:space-y-6">
        <h1 className="text-title-m text-text-primary lg:text-title-l">{t.title}</h1>
        {bundle.status === 'error' ? (
          <Banner type="error" title={t.bannerTitle} body={t.bannerBody} />
        ) : (
          <CatDialogue pose="thinking" speech={t.comparing} />
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
    scenario,
    weeklyHours: session.custom_weekly_hours,
    profile: session.profile,
    startDate: today
  })
  const after = computeCheckup({
    role,
    related,
    answers,
    snapshotId: afterSnapshot,
    scenario,
    weeklyHours: session.custom_weekly_hours,
    profile: session.profile,
    startDate: today
  })
  const engine = engineInputs(role, [role, ...related])
  const transferredAnswers = transferAnswers(role, answeredLevels(role, answers))
  const diff = diffSnapshots(
    engine.role,
    transferredAnswers,
    engine.snapshots[beforeSnapshot],
    engine.snapshots[afterSnapshot],
    scenario
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

  return (
    <div className="space-y-5 lg:space-y-6">
      <CatDialogue pose={isMay ? 'explaining' : 'idle'} speech={isMay ? speech : t.viewingApril} size="md" />

      <h1 className="text-title-m text-text-primary lg:text-title-l">{t.title}</h1>

      <div className="flex min-w-0 flex-col gap-3 rounded-md border border-border-subtle bg-bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <RefreshCw className="h-5 w-5 shrink-0 stroke-current text-text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-label-m text-text-primary">{t.liveDemo}</p>
            <p className="text-body-s text-text-muted" aria-live="polite">
              {isMay ? t.activeMay(afterLabel) : t.activeApril(beforeLabel)}
            </p>
          </div>
        </div>
        <div
          role="group"
          aria-label={t.snapshotChoice}
          className="grid w-full shrink-0 grid-cols-2 gap-1 rounded-sm border border-border-control bg-bg-default p-1 sm:w-auto"
        >
          <button
            type="button"
            aria-pressed={!isMay}
            onClick={() => setActiveSnapshot(beforeSnapshot)}
            className={`inline-flex min-h-11 min-w-0 items-center justify-center rounded-sm border-[1.5px] px-3 text-label-m focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
              !isMay
                ? 'border-text-primary bg-accent-box text-accent-on-box'
                : 'border-transparent bg-bg-default text-text-primary hover:bg-bg-panel'
            }`}
          >
            {t.beforeApril}
          </button>
          <button
            type="button"
            aria-pressed={isMay}
            onClick={() => setActiveSnapshot(afterSnapshot)}
            className={`inline-flex min-h-11 min-w-0 items-center justify-center rounded-sm border-[1.5px] px-3 text-label-m focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
              isMay
                ? 'border-text-primary bg-accent-box text-accent-on-box'
                : 'border-transparent bg-bg-default text-text-primary hover:bg-bg-panel'
            }`}
          >
            {t.afterMay}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section className="flex min-w-0 flex-1 flex-col gap-4" aria-labelledby="changes-title">
          <h2 id="changes-title" className="text-title-s text-text-primary">
            {t.aprilToMay}
          </h2>
          <div className="flex flex-col gap-4">
            {changes.length > 0 ? (
              changes.map((item) => <WhatChangedCard key={item.skill} item={item} />)
            ) : (
              <div className="surface-card rounded-md border border-border-subtle bg-bg-default p-6 text-center">
                <p className="text-body-m text-text-primary">{t.noChanges}</p>
              </div>
            )}
          </div>
        </section>

        <section
          className="flex min-w-0 flex-1 flex-col gap-4 lg:sticky lg:top-24 lg:self-start"
          aria-labelledby="radar-title"
        >
          <h2 id="radar-title" className="text-title-s text-text-primary">
            {t.dashedLine}
          </h2>
          <WhatChangedRadar
            beforeCorners={beforeCorners}
            afterCorners={afterCorners}
            scenario={after.scenario}
            neededNowLabel={t.neededNowMay}
            beforeLabel={t.beforeApril}
          />
          <SourceList sources={comparisonSources} />
        </section>
      </div>

      <div className="hidden lg:block">
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          className="h-12"
          onClick={() => navigate(routes.roadmap)}
        >
          {isMay ? t.roadmapUpdated : t.roadmapApril}
        </Button>
      </div>

      <div className="rounded-md border border-border-subtle bg-surface-glass p-3 backdrop-blur-[24px] lg:hidden">
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          className="h-[52px]"
          onClick={() => navigate(routes.roadmap)}
        >
          {isMay ? t.roadmapUpdated : t.roadmapApril}
        </Button>
      </div>
    </div>
  )
}
