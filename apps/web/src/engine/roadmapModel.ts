import { roadmapSchedule } from '@kotak/sdk'
import { addDays, fitScore, uniqueSources, type BundleRole, type Source } from '@kotak/shared'
import type { RoadmapStep, SourceRef } from '../demo/types'
import type { Checkup } from './checkup'
import { commonText } from '../i18n/common'
import { dateLocale } from '../i18n/locale'
import { roadmapText } from '../i18n/messages/roadmap'
import { textNow } from '../i18n/text'

export const ROADMAP_WEEKS = 12

const round1 = (hours: number) => Math.round(hours * 10) / 10 // scaled hours drift in floats; show and compare at 0.1

type RoleFit = Checkup['roles'][number]
type PlanReadinessPoint = { week: number; plan: number }
type ScenarioReadinessPoint = PlanReadinessPoint & { fast: number }

const sourceKey = (source: Source) => [source.source_url, source.vintage_date, source.geo_or_layer].join('|')

function formatDayMonth(date: string) {
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
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
  const t = textNow(roadmapText)
  const common = textNow(commonText)
  const corners = new Map(role.corners.map((corner) => [corner.corner_id, corner]))
  const tickedIds = new Set(ticked)
  const weeklyHours = checkup.roadmap.weekly_hours
  let nextAssigned = false

  // The weeks and their dates come from @kotak/sdk, as the SDK's roadmap report's do.
  return roadmapSchedule(checkup.roadmap).map(
    ({ item, weeks, start_date: startDate, end_date: endDate }): RoadmapStep => {
      const [startWeek, endWeek] = weeks
      const corner = corners.get(item.corner_id)
      const id = `${item.corner_id}:${item.statement}`
      const state = tickedIds.has(id) ? 'done' : nextAssigned ? 'todo' : 'next'
      if (state === 'next') nextAssigned = true

      const conditional = item.status === 'Split' ? 'Split' : undefined
      const resource = corner?.resources[0]

      return {
        id,
        state,
        weeks,
        when: `${t.stepCard.estimated} · ${t.stepCard.weekSpan(startWeek, endWeek)} · ${formatDateRange(startDate, endDate)}${conditional ? ` · ${common.verdicts[conditional]}` : ''}`,
        skill: corner?.name ?? item.corner_id,
        title: corner?.statements?.[item.statement] ?? '',
        description: resource ? t.stepCard.useResource : '',
        gain: t.stepCard.aboutLevel(item.to_level, corner?.name ?? item.corner_id, t.stepCard.levels[item.statement]),
        hoursPerWeek: weeklyHours,
        resource: resource
          ? {
              label:
                resource.kind === 'search' && !resource.title.startsWith('Search:')
                  ? t.stepCard.searchResource(resource.title)
                  : resource.title,
              href: resource.url,
              kind: resource.kind
            }
          : { label: '', href: '' },
        sdgs: [
          ...new Set(
            (corner?.sdg_targets ?? [])
              .map((target) => Number(target.split('.')[0]))
              .filter((goal) => Number.isFinite(goal))
          )
        ],
        sdgTargets: corner?.sdg_targets ?? [],
        ...(conditional ? { conditional } : {})
      }
    }
  )
}

/** Weeks the web roadmap shows: at least ROADMAP_WEEKS, and on to the week the plan first reaches 80% fit. */
export function planWeeksFor<T extends { week: number }>(points: T[], fit: (point: T) => number): number {
  const ready = points.find((point) => fit(point) >= 80) ?? points[points.length - 1]
  return Math.max(ROADMAP_WEEKS, ready?.week ?? 0)
}

/** The first `weeks` weeks of the full SDK path. Partial milestones earn no level gain. */
export function toRoadmapWindow(checkup: Checkup, role: BundleRole, ticked: string[], weeks = ROADMAP_WEEKS) {
  const t = textNow(roadmapText)
  const common = textNow(commonText)
  const fullSteps = toRoadmapSteps(checkup, role, ticked)
  const budget = weeks * checkup.roadmap.weekly_hours
  const hoursById = new Map(checkup.roadmap.items.map((item) => [`${item.corner_id}:${item.statement}`, item.hours]))
  const partialIds = new Set<string>()
  const stepHours = new Map<string, number>()
  const later: RoadmapStep[] = []
  const steps: RoadmapStep[] = []
  let used = checkup.roadmap.pace.refresher?.hours ?? 0 // a returner's refresher takes the first hours (#356)
  for (const step of fullSteps) {
    const hours = hoursById.get(step.id)!
    const allocated = round1(Math.max(0, Math.min(hours, budget - used)))
    used = round1(used + hours)
    if (allocated < hours) later.push(step)
    if (allocated === 0) continue
    stepHours.set(step.id, allocated)
    if (allocated === hours) {
      steps.push(step)
      continue
    }
    partialIds.add(step.id)
    const start = addDays(checkup.roadmap.start_date, (step.weeks[0] - 1) * 7)
    const end = addDays(checkup.roadmap.start_date, weeks * 7 - 1)
    steps.push({
      ...step,
      weeks: [step.weeks[0], weeks],
      when: `${t.stepCard.estimated} · ${t.stepCard.weekSpan(step.weeks[0], weeks)} · ${formatDateRange(start, end)}${step.conditional ? ` · ${step.conditional === 'Split' ? common.verdicts.Split : step.conditional}` : ''}`,
      description: t.stepCard.partialDescription(step.description, String(allocated), String(hours), weeks).trim(),
      gain: t.stepCard.fullTarget(step.gain)
    })
  }
  return {
    steps,
    stepHours,
    partialIds,
    later,
    remainingHours: round1(Math.max(0, checkup.roadmap.total_hours - budget))
  }
}

/** Carry the last completed milestone's fit to the window's last week; never credit a clipped milestone. */
export function toReadinessWindow<T extends PlanReadinessPoint>(points: T[], weeks = ROADMAP_WEEKS): T[] {
  const visible = points.filter((point) => point.week <= weeks)
  const last = visible[visible.length - 1]
  return last && last.week < weeks ? [...visible, { ...last, week: weeks }] : visible
}

export function toReadinessPoints(checkup: Checkup, role: BundleRole): PlanReadinessPoint[]
export function toReadinessPoints(slow: Checkup, fast: Checkup, role: BundleRole): ScenarioReadinessPoint[]
export function toReadinessPoints(
  planCheckup: Checkup,
  fastCheckupOrRole: Checkup | BundleRole,
  maybeRole?: BundleRole
): PlanReadinessPoint[] | ScenarioReadinessPoint[] {
  const role = maybeRole ?? (fastCheckupOrRole as BundleRole)
  const fastCheckup = maybeRole ? (fastCheckupOrRole as Checkup) : null
  const planRole = planCheckup.roles.find((item) => item.onet_code === role.onet_code)
  const fastRole = fastCheckup?.roles.find((item) => item.onet_code === role.onet_code)
  if (!planRole || (fastCheckup && !fastRole)) return []

  const schedule = (checkup: Checkup) => {
    const endWeekById = new Map(toRoadmapSteps(checkup, role, []).map((step) => [step.id, step.weeks[1]]))
    return checkup.roadmap.items.map((item) => ({
      item,
      endWeek: endWeekById.get(`${item.corner_id}:${item.statement}`) ?? 0
    }))
  }
  const planSchedule = schedule(planCheckup)
  const fastSchedule = fastCheckup ? schedule(fastCheckup) : null
  const weeks = [
    ...new Set([0, ...planSchedule.map((step) => step.endWeek), ...(fastSchedule?.map((step) => step.endWeek) ?? [])])
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

  return weeks.map((week) => {
    const point = { week, plan: scoreAt(planRole, planSchedule, week) }
    return fastRole && fastSchedule ? { ...point, fast: scoreAt(fastRole, fastSchedule, week) } : point
  })
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
