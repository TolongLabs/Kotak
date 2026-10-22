import type { BundleRole, CornerDiffItem, SnapshotDiff } from '@kotak/shared'
import type { ChangeItem, SourceRef } from '../../demo/types'
import { verdictId } from '../../engine/viewModel'
import type { Checkup } from '../../engine/checkup'
import { toRoadmapSteps } from '../../engine/roadmapModel'

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
    const month = date.getUTCMonth()
    const year = date.getUTCFullYear()
    if (title === 'DOSM') {
      const q = Math.floor(month / 3) + 1
      dateText = `Q${q} ${year}`
    } else {
      dateText = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    }
  }
  return `New data · ${title}${title === 'DOSM' ? ` ${dateText}` : `, ${dateText}`}`
}

function storyWhyFor(item: CornerDiffItem, afterCheckup: Checkup | undefined, citations: number[]): string {
  const corner = afterCheckup?.corners.find((c) => c.corner_id === item.corner_id)
  const citationStr = citations.map((n) => `[${n}]`).join(' ')

  if (!corner) {
    const details: string[] = []
    if (item.changes.includes('verdict')) {
      details.push(`the verdict changed from ${item.before.label} to ${item.after.label}`)
    }
    if (item.changes.includes('target')) {
      details.push(`the estimated target moved from about ${item.before.target} to about ${item.after.target}`)
    }
    if (item.changes.includes('ai_use')) details.push('the latest AI-use reading or projection changed')
    if (item.changes.includes('roadmap')) {
      details.push(
        `the suggested roadmap position moved from ${item.before.roadmap_rank ?? 'not planned'} to ${item.after.roadmap_rank ?? 'not planned'}`
      )
    }
    return `Between snapshots, ${details.join(' and ')}.${citationStr ? ` ${citationStr}` : ''}`
  }

  const scenario = afterCheckup?.scenario ?? 'slow'
  const outcome = corner.verdict.scenarios[scenario]
  const c1 = citations[0] ? ` [${citations[0]}]` : ''
  const c2 = citations[1] ? ` [${citations[1]}]` : c1

  const name = item.name.toLowerCase()
  if (outcome.collaboration_mode === 'augmentation') {
    const demandPart = outcome.demand === 'flat' ? `demand held up${c1}` : `demand rose${c1}`
    return `More ${name} work now runs through AI tools${c2}, and ${demandPart}.`
  }

  if (outcome.demand === 'up') {
    return `Job ads asking for ${name} rose in Q3${c1}, and AI use in ${name} kept climbing${c2}.`
  }

  if (outcome.demand === 'flat') {
    return `Demand for ${name} held up${c1}, while AI use kept climbing${c2}.`
  }

  return `Job ads and AI use signals moved for ${name}.${citationStr ? ` ${citationStr}` : ''}`
}

function storyEffectFor(
  item: CornerDiffItem,
  role: BundleRole | undefined,
  beforeCheckup: Checkup | undefined,
  afterCheckup: Checkup | undefined
): string {
  if (afterCheckup && role) {
    const steps = toRoadmapSteps(afterCheckup, role, [])
    const step = steps.find((s) => s.id.startsWith(item.corner_id + ':'))

    if (step && item.changes.includes('roadmap')) {
      if (item.before.roadmap_rank === null) {
        return `Your roadmap: “${step.title}” joined weeks ${step.weeks[0]}–${step.weeks[1]}.`
      }
      return `Your roadmap: “${step.title}” moved to step ${item.after.roadmap_rank}.`
    }

    const topRole = afterCheckup.roles[0]
    const prevTopRole = beforeCheckup?.roles[0]
    if (topRole && (!prevTopRole || prevTopRole.onet_code !== topRole.onet_code || !item.changes.includes('roadmap'))) {
      const matchPct = Math.round(topRole.fit.score * 100)
      return `${topRole.title} is now your top match at ${matchPct}%.`
    }
  }

  const effects: string[] = []
  if (item.changes.includes('target')) effects.push(`Estimated target: about ${item.after.target}.`)
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
    const rawCitations = [
      ...item.sources.before.map((source) => sourceNumber(source, beforeSources)),
      ...item.sources.after.map((source) => sourceNumber(source, afterSources, afterOffset))
    ].filter((n): n is number => n !== null)
    const citations = [...new Set(rawCitations)]

    return {
      source: formatStorySource(item.sources.after),
      skill: item.name,
      from: verdictId(item.before.status),
      to: verdictId(item.after.status),
      why: storyWhyFor(item, afterCheckup, citations),
      effect: storyEffectFor(item, role, beforeCheckup, afterCheckup)
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
