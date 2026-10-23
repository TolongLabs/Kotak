// Gaps, roadmap order, the AI dividend and the finish date (#83). Pure and deterministic: the caller passes the date.

import type { Verdict } from '../engine'
import { uniqueSources } from './citations'
import { DEFAULT_SCENARIO, DIVIDEND_SHARE, LESS_IMPORTANT_TAG, MIN_WEEKLY_HOURS, WORK_WEEK_HOURS } from './constants'
import { addDays } from './dates'
import type {
  AiDividend,
  CornerGap,
  CornerVerdict,
  MilestoneStatement,
  Roadmap,
  RoadmapCorner,
  RoadmapItem,
  Scenario
} from './schemas'

const TIER: Record<Verdict, RoadmapItem['tier']> = {
  Rising: 'rising',
  Steady: 'middle',
  Split: 'middle',
  Unknown: 'middle',
  Declining: 'declining'
}
const TIER_RANK: Record<RoadmapItem['tier'], number> = { rising: 0, middle: 1, declining: 2 }
const STATEMENT: Record<number, MilestoneStatement> = { 1: 'basic', 2: 'working', 3: 'advanced' }

/** Corners where the user is below the scenario's target. A corner with no level counts as 0, "not asked yet". */
export function cornerGaps(
  verdicts: CornerVerdict[],
  levels: { corner_id: string; user_level: number }[],
  scenario: Scenario = DEFAULT_SCENARIO
): CornerGap[] {
  const level = new Map(levels.map((l) => [l.corner_id, l.user_level]))
  return verdicts.flatMap((v) => {
    const user_level = level.get(v.corner_id) ?? 0
    const target_level = v.scenarios[scenario].target.value
    if (user_level >= target_level) return []
    return [{ corner_id: v.corner_id, status: v.status, user_level, target_level, size: target_level - user_level }]
  })
}

/**
 * Hours a week AI could save the user on declining corners. The week splits evenly across the role's corners; each
 * declining corner saves the share of its time AI cuts. The default learning time is DIVIDEND_SHARE of that.
 */
export function aiDividend(verdicts: CornerVerdict[], corners: RoadmapCorner[]): AiDividend {
  const saving = new Map(corners.map((c) => [c.corner_id, c.time_saving]))
  const weekly_hours = WORK_WEEK_HOURS / verdicts.length
  const rows = verdicts
    .filter((v) => v.status === 'Declining')
    .map((v) => {
      const s = saving.get(v.corner_id)
      const saved_fraction = s ? Math.min(1, Math.max(0, 1 - s.with_ai_hours / s.human_hours)) : 0
      return { corner_id: v.corner_id, weekly_hours, saved_fraction, weekly_hours_saved: weekly_hours * saved_fraction }
    })
  const weekly_hours_saved = rows.reduce((sum, r) => sum + r.weekly_hours_saved, 0)
  return {
    share: DIVIDEND_SHARE,
    weekly_hours_saved,
    default_weekly_hours: Math.max(MIN_WEEKLY_HOURS, DIVIDEND_SHARE * weekly_hours_saved),
    corners: rows,
    sources: uniqueSources(rows.flatMap((r) => saving.get(r.corner_id) ?? [])),
    is_estimate: true
  }
}

/**
 * The ordered milestones: Rising gaps first, then Steady, Split and Unknown, then Declining tagged LESS_IMPORTANT_TAG;
 * bigger gaps first within each tier, then the batch's corner order. Each gap gets one milestone per can-do statement
 * between the user's level and the target, rounded up.
 */
export function roadmapItems(
  verdicts: CornerVerdict[],
  corners: Pick<RoadmapCorner, 'corner_id' | 'user_level' | 'milestone_hours'>[],
  scenario: Scenario = DEFAULT_SCENARIO
): RoadmapItem[] {
  const byId = new Map(corners.map((c) => [c.corner_id, c]))
  const gaps = cornerGaps(verdicts, corners, scenario)
  const ordered = [...gaps].sort((a, b) => TIER_RANK[TIER[a.status]] - TIER_RANK[TIER[b.status]] || b.size - a.size)

  return ordered
    .flatMap((gap) => {
      const tier = TIER[gap.status]
      const done = Math.floor(gap.user_level) // a half step (2.5) has not reached the next whole statement
      const levels = Array.from({ length: Math.ceil(gap.target_level) - done }, (_, i) => done + 1 + i)
      return levels.map((to_level): Omit<RoadmapItem, 'rank'> => {
        const statement = STATEMENT[to_level]!
        return {
          corner_id: gap.corner_id,
          status: gap.status,
          tier,
          gap_size: gap.size,
          to_level,
          statement,
          hours: byId.get(gap.corner_id)!.milestone_hours[statement],
          tag: tier === 'declining' ? LESS_IMPORTANT_TAG : null,
          is_estimate: true
        }
      })
    })
    .map((item, i) => ({ rank: i + 1, ...item }))
}

/** The roadmap with its AI-dividend weekly hours. Finish date = start + total_hours / weekly_hours weeks. */
export function buildRoadmap(input: {
  verdicts: CornerVerdict[]
  corners: RoadmapCorner[]
  start_date: string
  scenario?: Scenario
  weekly_hours?: number | null // the user's own figure; null or absent uses the AI dividend
}): Roadmap {
  const scenario = input.scenario ?? DEFAULT_SCENARIO
  const gaps = cornerGaps(input.verdicts, input.corners, scenario)
  const items = roadmapItems(input.verdicts, input.corners, scenario)
  const dividend = aiDividend(input.verdicts, input.corners)
  const userHours = input.weekly_hours ?? null
  const weekly_hours = userHours ?? dividend.default_weekly_hours
  const weekly_hours_from =
    userHours !== null
      ? 'user'
      : DIVIDEND_SHARE * dividend.weekly_hours_saved >= MIN_WEEKLY_HOURS
        ? 'ai_dividend'
        : 'minimum'
  const total_hours = items.reduce((sum, item) => sum + item.hours, 0)
  const weeks = total_hours / weekly_hours
  return {
    scenario,
    gaps,
    items,
    total_hours,
    dividend,
    weekly_hours,
    weekly_hours_from,
    weeks,
    start_date: input.start_date,
    finish_date: addDays(input.start_date, Math.ceil(weeks * 7)),
    is_estimate: true
  }
}
