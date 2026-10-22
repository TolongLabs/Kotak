import type { CheckupRole } from '../../engine/checkup'
import { isEstimatedLevel } from '../../engine/viewModel'

/** Percentages are whole numbers; levels show at most 1 decimal and never an unrounded float. */
export const formatFitPercent = (score: number) => `${Math.round(score)}%`

/** Whole levels stay "2"; estimates get one decimal ("2.3"), with a value near a whole level shown as that level. */
export function formatLevel(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1)
}

/** Corner ids whose levels are estimated from the user's answers rather than answered directly; they carry the
 * "Estimated" tag. */
export function estimatedCorners(checkupRole: CheckupRole): Set<string> {
  return new Set(checkupRole.levels.filter(isEstimatedLevel).map((level) => level.corner_id))
}
