import { addDays, fitScore, uniqueSources, type BundleRole, type Source } from '@kotak/shared'
import type { RoadmapStep, SourceRef } from '../demo/types'
import type { Checkup } from './checkup'

type RoleFit = Checkup['roles'][number]

const sourceKey = (source: Source) => [source.source_url, source.vintage_date, source.geo_or_layer].join('|')

function formatDayMonth(date: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`)
  )
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00Z`)
  const endDate = new Date(`${end}T00:00:00Z`)
  const sameMonth =
    startDate.getUTCFullYear() === endDate.getUTCFullYear() && startDate.getUTCMonth() === endDate.getUTCMonth()
  const startLabel = sameMonth ? String(startDate.getUTCDate()) : formatDayMonth(start)
  return `${startLabel}–${formatDayMonth(end)}`
}

export function toRoadmapSteps(checkup: Checkup, role: BundleRole, ticked: string[]): RoadmapStep[] {
  const corners = new Map(role.corners.map((corner) => [corner.corner_id, corner]))
  const tickedIds = new Set(ticked)
  const items = [...checkup.roadmap.items].sort((left, right) => left.rank - right.rank)
  const weeklyHours = checkup.roadmap.weekly_hours
  let cumulativeHours = 0
  let nextAssigned = false

  return items.map((item): RoadmapStep => {
    const previousHours = cumulativeHours
    cumulativeHours += item.hours
    const startWeek = Math.floor(previousHours / weeklyHours) + 1
    const endWeek = Math.max(startWeek, Math.ceil(cumulativeHours / weeklyHours))
    const corner = corners.get(item.corner_id)
    const id = `${item.corner_id}:${item.statement}`
    const state = tickedIds.has(id) ? 'done' : nextAssigned ? 'todo' : 'next'
    if (state === 'next') nextAssigned = true

    const startDate = addDays(checkup.roadmap.start_date, (startWeek - 1) * 7)
    const endDate = addDays(checkup.roadmap.start_date, endWeek * 7 - 1)
    const conditional = item.status === 'Split' ? 'Split' : undefined
    const resource = corner?.resources[0]

    return {
      id,
      state,
      weeks: [startWeek, endWeek],
      when: `Estimated · Weeks ${startWeek}–${endWeek} · ${formatDateRange(startDate, endDate)}${conditional ? ` · ${conditional}` : ''}`,
      skill: corner?.name ?? item.corner_id,
      title: corner?.statements?.[item.statement] ?? '',
      description: resource ? 'Use the linked resource to practise this skill.' : '',
      gain: `About Level ${item.to_level} · ${corner?.name ?? item.corner_id}`,
      hoursPerWeek: weeklyHours,
      resource: resource
        ? {
            label: resource.kind === 'search' ? `Search: ${resource.title}` : resource.title,
            href: resource.url
          }
        : { label: '', href: '' },
      sdgs: [
        ...new Set(
          (corner?.sdg_targets ?? [])
            .map((target) => Number(target.split('.')[0]))
            .filter((goal) => Number.isFinite(goal))
        )
      ],
      ...(conditional ? { conditional } : {})
    }
  })
}

export function toReadinessPoints(slow: Checkup, fast: Checkup, role: BundleRole) {
  const slowRole = slow.roles.find((item) => item.onet_code === role.onet_code)
  const fastRole = fast.roles.find((item) => item.onet_code === role.onet_code)
  if (!slowRole || !fastRole) return []

  const schedule = (checkup: Checkup) => {
    const endWeekById = new Map(toRoadmapSteps(checkup, role, []).map((step) => [step.id, step.weeks[1]]))
    return checkup.roadmap.items.map((item) => ({
      item,
      endWeek: endWeekById.get(`${item.corner_id}:${item.statement}`) ?? 0
    }))
  }

  const slowSchedule = schedule(slow)
  const fastSchedule = schedule(fast)
  const weeks = [
    ...new Set([0, ...slowSchedule.map((step) => step.endWeek), ...fastSchedule.map((step) => step.endWeek)])
  ].sort((left, right) => left - right)

  const scoreAt = (roleFit: RoleFit, steps: ReturnType<typeof schedule>, week: number) => {
    const raisedLevels = new Map<string, number>()
    for (const { item, endWeek } of steps) {
      if (endWeek <= week)
        raisedLevels.set(item.corner_id, Math.max(raisedLevels.get(item.corner_id) ?? 0, item.to_level))
    }

    return fitScore(
      roleFit.fit.terms.map((term) => ({
        corner_id: term.corner_id,
        user_level: Math.max(term.user_level, raisedLevels.get(term.corner_id) ?? term.user_level),
        target_level: term.target_level
      }))
    ).score
  }

  return weeks.map((week) => ({
    week,
    plan: scoreAt(slowRole, slowSchedule, week),
    fast: scoreAt(fastRole, fastSchedule, week)
  }))
}

export function toRoadmapSources(checkup: Checkup): {
  sources: SourceRef[]
  cornerNumbers: Map<string, number[]>
  dividendNumbers: number[]
} {
  const all = uniqueSources([
    ...checkup.corners.flatMap((corner) => corner.verdict.sources),
    ...checkup.roadmap.dividend.sources
  ])
  const numberOf = new Map(all.map((source, index) => [sourceKey(source), index + 1]))
  const sources: SourceRef[] = all.map((source, index) => ({
    n: index + 1,
    name: source.source_name,
    detail: `${source.geo_or_layer} · ${source.vintage_date}`,
    href: source.source_url
  }))

  return {
    sources,
    cornerNumbers: new Map(
      checkup.corners.map((corner) => [
        corner.corner_id,
        [...new Set(corner.verdict.sources.map((source) => numberOf.get(sourceKey(source))!))]
      ])
    ),
    dividendNumbers: [...new Set(checkup.roadmap.dividend.sources.map((source) => numberOf.get(sourceKey(source))!))]
  }
}
