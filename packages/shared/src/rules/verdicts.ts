// Verdict rules, projections and targets (#81). Pure and deterministic: no I/O, no AI, no clock.

import type { Source, Verdict } from '../engine'
import {
  AI_EFFECT_HALF_GROWTH,
  DEFAULT_SCENARIO,
  DEMAND_EFFECT,
  FAST_CONVERGENCE,
  HORIZON_MONTHS,
  RISING_THRESHOLD,
  TARGET_BASE,
  TARGET_MAX,
  TARGET_MIN
} from './constants'
import { uniqueSources } from './citations'
import { addMonths, monthIndex } from './dates'
import type {
  AiProjection,
  AiUsageSeries,
  CornerCollaboration,
  CornerDemandReading,
  CornerSignals,
  CornerVerdict,
  DemandState,
  RoleSignals,
  RoleVerdicts,
  Scenario,
  ScenarioOutcome,
  TargetBreakdown,
  UsageAnchors,
  VerdictFuture,
  VerdictRow
} from './schemas'

type AiTrend = ScenarioOutcome['ai_trend']
type CollaborationMode = ScenarioOutcome['collaboration_mode']

const ROW_STATUS: Record<VerdictRow, Verdict> = {
  'Rising: AI helps it scale': 'Rising',
  'Declining because of AI': 'Declining',
  "Rising: AI can't do it yet": 'Rising',
  Steady: 'Steady',
  'Declining for other reasons': 'Declining'
}

const OTHER_SCENARIO: Record<Scenario, Scenario> = { slow: 'fast', fast: 'slow' }

/** The status chip of a verdict-table row. */
export const rowStatus = (row: VerdictRow): Verdict => ROW_STATUS[row]

/** How many times faster AI use grows in the fast scenario: Malaysia's index moved halfway to Singapore's, over today's. */
export function fastGrowthMultiplier(anchors: UsageAnchors): number {
  const { mys, sgp } = anchors
  return Math.max(1, (mys.value + FAST_CONVERGENCE * (sgp.value - mys.value)) / mys.value)
}

/**
 * Projects a corner's AI use HORIZON_MONTHS past its latest data month. Slow keeps the observed pace, a least-squares
 * line through the dated points. Fast raises every corner's growth (TRD.md, #146): growing use grows `fastGrowthMultiplier`
 * times faster and shrinking use shrinks that many times slower, so it never changes a shrinking corner's verdict.
 * The change is relative to the latest value; a latest value of 0 gives no relative change and counts as not rising.
 * Returns null with fewer than 2 dated points (published values with distinct vintage dates).
 */
export function projectAiUsage(series: AiUsageSeries, anchors: UsageAnchors, scenario: Scenario): AiProjection | null {
  const points = series.points.flatMap((p) =>
    p.value === null ? [] : [{ t: monthIndex(p.vintage_date), date: p.vintage_date, value: p.value }]
  )
  if (new Set(points.map((p) => p.date)).size < 2) return null

  const meanT = points.reduce((sum, p) => sum + p.t, 0) / points.length
  const meanV = points.reduce((sum, p) => sum + p.value, 0) / points.length
  const slope =
    points.reduce((sum, p) => sum + (p.t - meanT) * (p.value - meanV), 0) /
    points.reduce((sum, p) => sum + (p.t - meanT) ** 2, 0)
  const latest = points.reduce((a, b) => (b.t >= a.t ? b : a))

  const observed = latest.value > 0 ? Math.max(-1, (slope * HORIZON_MONTHS) / latest.value) : 0
  const multiplier = scenario === 'fast' ? fastGrowthMultiplier(anchors) : 1
  const change = observed > 0 ? observed * multiplier : observed / multiplier
  return {
    latest_date: latest.date,
    latest_value: latest.value,
    slope_per_month: slope,
    growth_multiplier: multiplier,
    projected_to: addMonths(latest.date, HORIZON_MONTHS),
    projected_value: latest.value * (1 + change),
    change,
    is_estimate: true
  }
}

export function collaborationMode(split: CornerCollaboration | null): CollaborationMode {
  if (!split) return 'unknown'
  return split.automation_pct > split.augmentation_pct ? 'automation' : 'augmentation'
}

/** The 5-row verdict table. Null when the row depends on an input that is missing. */
export function verdictRow(trend: AiTrend, mode: CollaborationMode, demand: DemandState): VerdictRow | null {
  if (trend === 'unknown') return null
  if (trend === 'rising') {
    if (mode === 'unknown') return null
    return mode === 'augmentation' ? 'Rising: AI helps it scale' : 'Declining because of AI'
  }
  if (demand === 'up') return "Rising: AI can't do it yet"
  if (demand === 'flat') return 'Steady'
  if (demand === 'down') return 'Declining for other reasons'
  return null
}

/** target = clamp(2.0 + ai_effect + demand_effect, 1.0, 3.0). Shrinking or unknown AI use adds no AI effect. */
export function targetLevel(
  projection: AiProjection | null,
  mode: CollaborationMode,
  demand: DemandState
): TargetBreakdown {
  const growth = Math.max(0, projection?.change ?? 0)
  const size = growth / (growth + AI_EFFECT_HALF_GROWTH)
  const ai_effect = mode === 'unknown' || size === 0 ? 0 : mode === 'augmentation' ? size : -size
  const demand_effect = DEMAND_EFFECT[demand]
  const value = Math.min(TARGET_MAX, Math.max(TARGET_MIN, TARGET_BASE + ai_effect + demand_effect))
  return { value, ai_effect, demand_effect, is_estimate: true }
}

function outcome(
  corner: CornerSignals,
  anchors: UsageAnchors,
  scenario: Scenario,
  demand: CornerDemandReading | undefined
): ScenarioOutcome {
  const projection = projectAiUsage(corner.ai_usage, anchors, scenario)
  const ai_trend: AiTrend = !projection ? 'unknown' : projection.change > RISING_THRESHOLD ? 'rising' : 'not_rising'
  const collaboration_mode = collaborationMode(corner.collaboration)
  const demandState: DemandState = demand?.direction ?? 'unknown'
  return {
    scenario,
    projection,
    ai_trend,
    collaboration_mode,
    demand: demandState,
    row: verdictRow(ai_trend, collaboration_mode, demandState),
    target: targetLevel(projection, collaboration_mode, demandState)
  }
}

function future(o: ScenarioOutcome, demand: CornerDemandReading | undefined): VerdictFuture {
  return {
    scenario: o.scenario,
    demand_source: demand ? uniqueSources([demand])[0]! : null,
    row: o.row!,
    status: ROW_STATUS[o.row!],
    target: o.target
  }
}

/**
 * One corner's verdict. Precedence: Unknown (fewer than 2 dated points, or a missing input the row needs), then Split
 * when the slow and fast scenarios give different verdict rows (#81: "different verdicts", so two different Rising
 * rows are a Split too), then Split when demand sources point opposite ways (one up, one down) and that changes the
 * row, else the row both scenarios agree on.
 */
export function cornerVerdict(corner: CornerSignals, anchors: UsageAnchors): CornerVerdict {
  const primary = corner.demand[0]
  const scenarios = {
    slow: outcome(corner, anchors, 'slow', primary),
    fast: outcome(corner, anchors, 'fast', primary)
  }
  const used: Source[] = [
    ...corner.ai_usage.points.filter((p) => p.value !== null),
    ...(corner.collaboration ? [corner.collaboration] : []),
    ...(primary ? [primary] : []),
    anchors.mys,
    anchors.sgp
  ]
  const labels = [corner.ai_usage.fallback_label, corner.collaboration?.fallback_label, primary?.fallback_label]
  const result = (fields: Pick<CornerVerdict, 'status' | 'label' | 'reason' | 'futures'>): CornerVerdict => ({
    corner_id: corner.corner_id,
    ...fields,
    scenarios,
    sources: uniqueSources(used),
    fallback_labels: [...new Set(labels.filter((l): l is string => !!l))]
  })

  const base = scenarios[DEFAULT_SCENARIO]
  const other = scenarios[OTHER_SCENARIO[DEFAULT_SCENARIO]]
  if (base.ai_trend === 'unknown')
    return result({ status: 'Unknown', label: 'Unknown', reason: 'too_few_points', futures: [] })
  for (const o of [base, other]) {
    if (o.row) continue
    const reason = o.ai_trend === 'rising' ? 'no_collaboration_split' : 'no_demand'
    return result({ status: 'Unknown', label: 'Unknown', reason, futures: [] })
  }
  if (scenarios.slow.row !== scenarios.fast.row) {
    const futures = [future(scenarios.slow, primary), future(scenarios.fast, primary)]
    return result({ status: 'Split', label: 'Split', reason: 'scenarios_disagree', futures })
  }

  const up = corner.demand.find((d) => d.direction === 'up')
  const down = corner.demand.find((d) => d.direction === 'down')
  if (up && down) {
    for (const o of [base, other]) {
      const withUp = outcome(corner, anchors, o.scenario, up)
      const withDown = outcome(corner, anchors, o.scenario, down)
      if (withUp.row === withDown.row) continue
      used.push(up, down)
      labels.push(up.fallback_label, down.fallback_label)
      const futures = [future(withUp, up), future(withDown, down)]
      return result({ status: 'Split', label: 'Split', reason: 'sources_disagree', futures })
    }
  }

  return result({ status: ROW_STATUS[base.row!], label: base.row!, reason: 'table', futures: [] })
}

/** Verdicts for every corner of one role in one snapshot. */
export function roleVerdicts(role: RoleSignals): RoleVerdicts {
  return {
    snapshot_id: role.snapshot_id,
    onet_code: role.onet_code,
    default_scenario: DEFAULT_SCENARIO,
    corners: role.corners.map((corner) => cornerVerdict(corner, role.anchors))
  }
}
