import { biggestGaps } from '@kotak/sdk'
import type { VerdictId } from '../demo/types'
import { rolesText } from '../i18n/messages/roles'
import { textNow } from '../i18n/text'

export type Trend = 'rising' | 'steady' | 'declining'
export type PointKind = 'you' | 'target' | 'suggested'
export type BoxId = 'best' | 'plan' | 'push' | 'rethink'

export interface QuadrantPoint {
  /** O*NET code; points with the same id are merged. */
  id: string
  label: string
  /** Fit % 0-100, or null when unknown (never placed at 0). */
  fit: number | null
  trend: Trend | null
  kind: PointKind
  /** The skill with the biggest gap for this role, with the levels; shown when the dot is opened. */
  gap?: string
}

export interface Placed extends QuadrantPoint {
  /** 0-100 from the left; null when the fit is unknown (the job page shows a trend-only row). */
  x: number | null
  /** 0-100 from the bottom: rising 62, steady 50 (the middle line), declining 38; the rest is room for box names; null when no trend. */
  y: number | null
  box: BoxId | null
}

const KIND_RANK: Record<PointKind, number> = { you: 0, target: 1, suggested: 2 }
const TREND_Y: Record<Trend, number> = { rising: 62, steady: 50, declining: 38 }

/** The engine's outlook as a trend; split and unknown have none. */
export const trendOf = (outlook: VerdictId): Trend | null =>
  outlook === 'rising' || outlook === 'steady' || outlook === 'declining' ? outlook : null

/** The box a point sits in. Fit 50 counts as ready; a steady job sits on the middle line, in no box. */
export function boxOf(fit: number | null, trend: Trend | null): BoxId | null {
  if (fit === null || trend === null || trend === 'steady') return null
  const ready = fit >= 50
  const growing = trend === 'rising'
  return ready ? (growing ? 'best' : 'push') : growing ? 'plan' : 'rethink'
}

/** Places each point once by id (You wins over target over suggested) and gives it x, y and a box. */
export function placePoints(points: QuadrantPoint[]): Placed[] {
  const byId = new Map<string, QuadrantPoint>()
  for (const point of points) {
    const kept = byId.get(point.id)
    if (!kept || KIND_RANK[point.kind] < KIND_RANK[kept.kind]) byId.set(point.id, point)
  }
  return [...byId.values()].map((point) => {
    const fit = point.fit === null ? null : Math.min(100, Math.max(0, point.fit))
    return {
      ...point,
      x: fit,
      y: point.trend ? TREND_Y[point.trend] : null,
      box: boxOf(fit, point.trend)
    }
  })
}

/** The role's biggest gap, named from its corners with its levels. */
export function topGapLabel(gap: { name: string; you: number; needed: number }): string
export function topGapLabel(
  fit: Parameters<typeof biggestGaps>[0],
  corners: { corner_id: string; name: string }[]
): string | undefined
export function topGapLabel(
  source: { name: string; you: number; needed: number } | Parameters<typeof biggestGaps>[0],
  corners?: { corner_id: string; name: string }[]
): string | undefined {
  const gap =
    'terms' in source
      ? (() => {
          const term = biggestGaps(source)[0]
          return term
            ? {
                name: corners?.find((corner) => corner.corner_id === term.corner_id)?.name ?? term.corner_id,
                you: term.user_level,
                needed: term.target_level
              }
            : undefined
        })()
      : source
  return gap ? textNow(rolesText).quadrant.gapLabel(gap.name, gap.you.toFixed(1), gap.needed.toFixed(1)) : undefined
}
