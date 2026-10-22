import type { BundleRole, CornerDiffItem, SnapshotDiff } from '@kotak/shared'
import type { ChangeItem, SourceRef } from '../../demo/types'
import { verdictId } from '../../engine/viewModel'
import type { Checkup } from '../../engine/checkup'
import { toRoadmapSteps } from '../../engine/roadmapModel'
import { fmt } from '../roadmap/planSupport'

export type MovedRow = { label: string; effect: string }

function sourceNumber(source: CornerDiffItem['sources']['before'][number], refs: SourceRef[], offset = 0) {
  const reference = refs.find(
    (item) => item.href === source.source_url && item.detail === `${source.geo_or_layer} · ${source.vintage_date}`
  )
  return reference ? reference.n + offset : null
}

function formatStorySource(sources: CornerDiffItem['sources']['after']): string {
  if (sources.length === 0) return 'New data'
  const primary = sources[0]
  let title = primary.source_name
  if (title.includes('DOSM')) {
    title = 'DOSM'
  } else if (title.includes('Economic Index')) {
    title = 'Economic Index'
  }
  let dateText = primary.vintage_date
  const date = new Date(primary.vintage_date)
  if (!isNaN(date.getTime())) {
    dateText = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  }
  return `May data · ${title}, ${dateText}`
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
  const [first, second] = corner.verdict.futures
  if (!first || !second) return ''

  if (corner.verdict.reason === 'scenarios_disagree') {
    const observed = corner.verdict.futures.find((future) => future.scenario === 'slow')
    const faster = corner.verdict.futures.find((future) => future.scenario === 'fast')
    if (observed && faster) {
      return `At the observed AI-use pace, this points to ${observed.status}; with faster uptake, it points to ${faster.status}.`
    }
  }

  const firstSource = first.demand_source?.source_name ?? 'One source'
  const secondSource = second.demand_source?.source_name ?? 'Another source'
  return `The sources disagree: ${firstSource} points to ${first.status}, while ${secondSource} points to ${second.status}.`
}

function storyWhyFor(
  item: CornerDiffItem,
  beforeCheckup: Checkup | undefined,
  afterCheckup: Checkup | undefined,
  beforeCitations: number[],
  afterCitations: number[]
): string {
  const details: string[] = []
  const beforeRefs = citationSuffix(beforeCitations)
  const afterRefs = citationSuffix(afterCitations)
  // The verdict and target sentences always cite; the follow-on sentences cite only when nothing above did, so the
  // same chips do not repeat after every sentence.
  let cited = false

  if (item.changes.includes('verdict')) {
    details.push(
      `April's verdict was ${item.before.label}${beforeRefs}, and May's verdict is ${item.after.label}${afterRefs}.`
    )
    cited = true
  }
  if (item.changes.includes('target')) {
    const [before, after] = formatTargets(item.before.target, item.after.target)
    details.push(
      `The estimated target moved from about ${before} in April${beforeRefs} to about ${after} in May${afterRefs}.`
    )
    cited = true
  }
  if (item.changes.includes('ai_use')) {
    details.push(
      `The AI-use reading or its projection changed between April${cited ? '' : beforeRefs} and May${cited ? '' : afterRefs}.`
    )
    cited = true
  }
  if (item.changes.includes('roadmap')) {
    details.push(
      `The roadmap position moved from ${item.before.roadmap_rank ?? 'not planned'} in April${cited ? '' : beforeRefs} to ${item.after.roadmap_rank ?? 'not planned'} in May${cited ? '' : afterRefs}.`
    )
  }

  const splitCheckup =
    item.after.label === 'Split' ? afterCheckup : item.before.label === 'Split' ? beforeCheckup : undefined
  const splitCorner = splitCheckup?.corners.find((corner) => corner.corner_id === item.corner_id)
  if (splitCorner) details.push(splitReasoning(splitCorner))

  return details.join(' ') || 'The skill data changed between April and May.'
}

function storyEffectFor(item: CornerDiffItem, role: BundleRole | undefined, afterCheckup: Checkup | undefined): string {
  if (afterCheckup && role) {
    const steps = toRoadmapSteps(afterCheckup, role, [])
    const step = steps.find((s) => s.id.startsWith(item.corner_id + ':'))

    if (step && item.changes.includes('roadmap')) {
      if (item.before.roadmap_rank === null) {
        return `Your roadmap: “${step.title}” joined weeks ${step.weeks[0]}–${step.weeks[1]}.`
      }
      return `Your roadmap: “${step.title}” moved to step ${item.after.roadmap_rank}.`
    }
  }

  const effects: string[] = []
  if (item.changes.includes('target')) effects.push(`Estimated target: about ${fmt(item.after.target)}.`)
  if (item.changes.includes('roadmap')) {
    effects.push(`Roadmap position: ${item.after.roadmap_rank ?? 'not planned'}.`)
  }
  if (item.changes.includes('verdict')) effects.push(`Kopi now labels this skill ${item.after.label}.`)
  if (item.changes.includes('ai_use')) effects.push('Kopi uses the changed AI-use signal.')
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
  const targetChanges = diff.corners.filter((item) => item.changes.includes('target'))
  const changedFitRoles = diff.roles.filter((item) => item.changes.includes('fit_score'))

  const targetsEffect =
    targetChanges.length === 0
      ? 'No estimated skill targets changed between snapshots.'
      : `${targetChanges.length} estimated skill target${targetChanges.length === 1 ? '' : 's'} changed: ${targetChanges.map((item) => item.name).join(', ')}.`

  const rolesEffect = diff.roles_reordered
    ? 'Matched roles changed order between snapshots.'
    : changedFitRoles.length > 0
      ? `Fit scores changed for ${changedFitRoles.map((item) => item.title).join(', ')}, while the rank order stayed the same.`
      : 'Matched role fits and order stayed the same.'

  return [
    { label: 'Target Levels', effect: targetsEffect },
    { label: 'Role Ranking', effect: rolesEffect },
    {
      label: 'Roadmap Order',
      effect: diff.roadmap_reordered
        ? 'The suggested learning order changed between snapshots.'
        : 'The suggested learning order stayed the same.'
    }
  ]
}
