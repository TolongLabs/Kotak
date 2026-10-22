import type { CheckupRole } from '../../engine/checkup'

/** Percentages are whole numbers; levels show at most 1 decimal and never an unrounded float. */
export const formatFitPercent = (score: number) => `${Math.round(score)}%`

/** Whole levels stay "2"; estimates get one decimal ("2.3"), with a value near a whole level shown as that level. */
export function formatLevel(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1)
}

/** Corner ids whose levels were carried over from the user's own job; they carry the "Estimated" tag. */
export function carriedOverCorners(checkupRole: CheckupRole, jobCode: string | null, isJob: boolean): Set<string> {
  if (isJob || !jobCode) return new Set()
  return new Set(
    checkupRole.levels
      .filter((level) => level.basis.from.some((answer) => answer.onet_code === jobCode))
      .map((level) => level.corner_id)
  )
}
