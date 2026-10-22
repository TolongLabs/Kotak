import type { CheckupRole } from '../../engine/checkup'
import { isEstimatedLevel } from '../../engine/viewModel'

/** Percentages are whole numbers; levels show at most 1 decimal and never an unrounded float. */
export const formatFitPercent = (score: number) => `${Math.round(score)}%`

export { formatLevel } from '@kotak/sdk'

/** Corner ids whose levels are estimated from the user's answers rather than answered directly; they carry the
 * "Estimated" tag. */
export function estimatedCorners(checkupRole: CheckupRole): Set<string> {
  return new Set(checkupRole.levels.filter(isEstimatedLevel).map((level) => level.corner_id))
}
