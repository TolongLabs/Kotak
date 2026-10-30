import type { BundleRole, CornerDiffItem, SnapshotDiff } from '@kotak/shared'
import type { ChangeItem, SourceRef } from '../../demo/types'
import { verdictId } from '../../engine/viewModel'
import type { Checkup } from '../../engine/checkup'
import { toRoadmapSteps } from '../../engine/roadmapModel'
import { fmt } from '../roadmap/planSupport'
import { commonText } from '../../i18n/common'
import { dateLocale } from '../../i18n/locale'
import { changesText } from '../../i18n/messages/changes'
import { textNow } from '../../i18n/text'

export type MovedRow = { label: string; effect: string }

// Verdict enum words travel inside translated sentences; anything unmapped falls back to the English word.
function verdictWord(label: string): string {
  const words: Record<string, string> = textNow(commonText).verdicts
  return words[label] ?? label
}

function sourceNumber(source: CornerDiffItem['sources']['before'][number], refs: SourceRef[], offset = 0) {
  const reference = refs.find(
    (item) => item.href === source.source_url && item.detail === `${source.geo_or_layer} · ${source.vintage_date}`
  )
  return reference ? reference.n + offset : null
}

function formatStorySource(sources: CornerDiffItem['sources']['after']): string {
  const t = textNow(changesText)
  if (sources.length === 0) return t.newData
  // A verdict's sources list the AI-use trend from its first point, so the first is April's. The card names the newest
  // Economic Index point, the May data that moved it, or the newest source when no Economic Index row is cited (#325).
  const newest = (list: typeof sources) => [...list].sort((a, b) => b.vintage_date.localeCompare(a.vintage_date))[0]
  const primary = newest(sources.filter((source) => source.source_name.includes('Economic Index'))) ?? newest(sources)!
  let title = primary.source_name
  if (title.includes('DOSM')) {
    title = 'DOSM'
  } else if (title.includes('Economic Index')) {
    title = 'Economic Index'
  }
  let dateText = primary.vintage_date
  const date = new Date(primary.vintage_date)
  if (!isNaN(date.getTime())) {
    dateText = date.toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric', timeZone: 'UTC' })
  }
  return t.storySource(title, dateText)
}

// One decimal, or two when one would print the same number before and after ("about 2 to about 2").
function formatTargets(before: number, after: number): [string, string] {
  if (fmt(before) !== fmt(after)) return [fmt(before), fmt(after)]
  const precise = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })
  return [precise.format(before), precise.format(after)]
}

function citationSuffix(citations: number[]) {
  return citations.length > 0 ? ` ${citations.map((number) => `[${number}]`).join(' ')}` : ''
}

function splitReasoning(corner: Checkup['corners'][number]) {
  const t = textNow(changesText)
  const [first, second] = corner.verdict.futures
  if (!first || !second) return ''

  if (corner.verdict.reason === 'scenarios_disagree') {
    const observed = corner.verdict.futures.find((future) => future.scenario === 'slow')
    const faster = corner.verdict.futures.find((future) => future.scenario === 'fast')
    if (observed && faster) {
      return t.splitPace(verdictWord(observed.status), verdictWord(faster.status))
    }
  }

  const firstSource = first.demand_source?.source_name ?? t.oneSource
  const secondSource = second.demand_source?.source_name ?? t.anotherSource
  return t.splitSources(firstSource, verdictWord(first.status), secondSource, verdictWord(second.status))
}

function storyWhyFor(
  item: CornerDiffItem,
  beforeCheckup: Checkup | undefined,
  afterCheckup: Checkup | undefined,
  beforeCitations: number[],
  afterCitations: number[]
): string {
  const details: string[] = []
  const t = textNow(changesText)
  const beforeRefs = citationSuffix(beforeCitations)
  const afterRefs = citationSuffix(afterCitations)
  // The verdict and target sentences always cite; the follow-on sentences cite only when nothing above did, so the
  // same chips do not repeat after every sentence.
  let cited = false

  if (item.changes.includes('verdict')) {
    details.push(t.verdictChange(verdictWord(item.before.label), verdictWord(item.after.label), beforeRefs, afterRefs))
    cited = true
  }
  if (item.changes.includes('target')) {
    const [before, after] = formatTargets(item.before.target, item.after.target)
    details.push(t.targetChange(before, after, beforeRefs, afterRefs))
    cited = true
  }
  if (item.changes.includes('ai_use')) {
    details.push(t.aiUseChange(cited ? '' : beforeRefs, cited ? '' : afterRefs))
    cited = true
  }
  if (item.changes.includes('roadmap')) {
    details.push(
      t.roadmapChange(
        String(item.before.roadmap_rank ?? t.notPlanned),
        String(item.after.roadmap_rank ?? t.notPlanned),
        cited ? '' : beforeRefs,
        cited ? '' : afterRefs
      )
    )
  }

  const splitCheckup =
    item.after.label === 'Split' ? afterCheckup : item.before.label === 'Split' ? beforeCheckup : undefined
  const splitCorner = splitCheckup?.corners.find((corner) => corner.corner_id === item.corner_id)
  if (splitCorner) details.push(splitReasoning(splitCorner))

  return details.join(' ') || t.fallbackWhy
}

function storyEffectFor(item: CornerDiffItem, role: BundleRole | undefined, afterCheckup: Checkup | undefined): string {
  const t = textNow(changesText)
  if (afterCheckup && role) {
    const steps = toRoadmapSteps(afterCheckup, role, [])
    const step = steps.find((s) => s.id.startsWith(item.corner_id + ':'))

    if (step && item.changes.includes('roadmap')) {
      if (item.before.roadmap_rank === null) {
        return t.roadmapJoined(step.title, step.weeks[0], step.weeks[1])
      }
      return t.roadmapMovedStep(step.title, item.after.roadmap_rank)
    }
  }

  const effects: string[] = []
  if (item.changes.includes('target')) effects.push(t.estimatedTarget(fmt(item.after.target)))
  if (item.changes.includes('roadmap')) {
    effects.push(t.roadmapPosition(String(item.after.roadmap_rank ?? t.notPlanned)))
  }
  if (item.changes.includes('verdict')) effects.push(t.kopiLabels(verdictWord(item.after.label)))
  if (item.changes.includes('ai_use')) effects.push(t.kopiSignal)
  return effects.join(' ')
}

export function whatChangedItems(
  diff: SnapshotDiff,
  beforeSources: SourceRef[],
  afterSources: SourceRef[],
  afterOffset: number,
  role?: BundleRole,
  beforeCheckup?: Checkup,
  afterCheckup?: Checkup
): ChangeItem[] {
  return diff.corners.map((item) => {
    const beforeCitations = [
      ...new Set(
        item.sources.before.map((source) => sourceNumber(source, beforeSources)).filter((n): n is number => n !== null)
      )
    ]
    const afterCitations = [
      ...new Set(
        item.sources.after
          .map((source) => sourceNumber(source, afterSources, afterOffset))
          .filter((n): n is number => n !== null)
      )
    ]

    return {
      source: formatStorySource(item.sources.after),
      skill: item.name,
      from: verdictId(item.before.status),
      to: verdictId(item.after.status),
      why: storyWhyFor(item, beforeCheckup, afterCheckup, beforeCitations, afterCitations),
      effect: storyEffectFor(item, role, afterCheckup)
    }
  })
}

export function whatMovedRows(diff: SnapshotDiff): MovedRow[] {
  const t = textNow(changesText)
  const targetChanges = diff.corners.filter((item) => item.changes.includes('target'))
  const changedFitRoles = diff.roles.filter((item) => item.changes.includes('fit_score'))

  const targetsEffect =
    targetChanges.length === 0
      ? t.movedTargetNone
      : t.movedTargets(targetChanges.length, targetChanges.map((item) => item.name).join(', '))

  const rolesEffect = diff.roles_reordered
    ? t.movedRolesReordered
    : changedFitRoles.length > 0
      ? t.movedFitChanged(changedFitRoles.map((item) => item.title).join(', '))
      : t.movedRolesSame

  return [
    { label: t.labelTargets, effect: targetsEffect },
    { label: t.labelRoles, effect: rolesEffect },
    {
      label: t.labelRoadmap,
      effect: diff.roadmap_reordered ? t.roadmapOrderChanged : t.roadmapOrderSame
    }
  ]
}
