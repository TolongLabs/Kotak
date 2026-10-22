import type { CornerDiffItem, SnapshotDiff } from '@kotak/shared'
import type { ChangeItem, SourceRef } from '../../demo/types'
import { verdictId } from '../../engine/viewModel'

export type MovedRow = { label: string; effect: string }

function sourceText(sources: CornerDiffItem['sources']['before']) {
  return sources.map((source) => `${source.source_name} · ${source.vintage_date}`).join('; ')
}

function sourceNumber(source: CornerDiffItem['sources']['before'][number], refs: SourceRef[], offset = 0) {
  const reference = refs.find(
    (item) => item.href === source.source_url && item.detail === `${source.geo_or_layer} · ${source.vintage_date}`
  )
  return reference ? reference.n + offset : null
}

function effectFor(item: CornerDiffItem) {
  const effects: string[] = []
  if (item.changes.includes('target')) effects.push(`Estimated target: about ${item.after.target}.`)
  if (item.changes.includes('roadmap')) {
    effects.push(`Roadmap position: ${item.after.roadmap_rank ?? 'not planned'}.`)
  }
  if (item.changes.includes('verdict')) effects.push(`Kopi now labels this skill ${item.after.label}.`)
  if (item.changes.includes('ai_use')) effects.push('Kopi uses the changed AI-use signal.')
  return effects.join(' ')
}

function whyFor(item: CornerDiffItem) {
  const details: string[] = []
  if (item.changes.includes('verdict'))
    details.push(`the verdict changed from ${item.before.label} to ${item.after.label}`)
  if (item.changes.includes('target')) {
    details.push(`the estimated target moved from about ${item.before.target} to about ${item.after.target}`)
  }
  if (item.changes.includes('ai_use')) details.push('the latest AI-use reading or projection changed')
  if (item.changes.includes('roadmap')) {
    details.push(
      `the suggested roadmap position moved from ${item.before.roadmap_rank ?? 'not planned'} to ${item.after.roadmap_rank ?? 'not planned'}`
    )
  }
  return `Between snapshots, ${details.join(' and ')}.`
}

export function whatChangedItems(
  diff: SnapshotDiff,
  beforeSources: SourceRef[],
  afterSources: SourceRef[],
  afterOffset: number
): ChangeItem[] {
  return diff.corners.map((item) => ({
    source: `Before: ${sourceText(item.sources.before)} · After: ${sourceText(item.sources.after)}`,
    skill: item.name,
    from: verdictId(item.before.status),
    to: verdictId(item.after.status),
    why: `${whyFor(item)} ${[
      ...item.sources.before.map((source) => sourceNumber(source, beforeSources)),
      ...item.sources.after.map((source) => sourceNumber(source, afterSources, afterOffset))
    ]
      .filter((number): number is number => number !== null)
      .map((number) => `[${number}]`)
      .join(' ')}`,
    effect: effectFor(item)
  }))
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
