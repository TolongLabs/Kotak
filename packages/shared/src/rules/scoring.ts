// User levels, question order and fit scores (#83). Pure and deterministic.

import { DEFAULT_SCENARIO } from './constants'
import type { Rating } from '../session'
import type { CornerVerdict, FitScore, Scenario } from './schemas'
import { rowStatus } from './verdicts'

/** Asking-order positions (0-based) of the reversed questions: questions 2, 4, 7, 10 and 12. */
export const REVERSED_SLOTS: readonly number[] = [1, 3, 6, 9, 11]

/** The effective rating of a reversed question: agreeing (4) means the least skill (1). */
export const reversedRating = (rating: Rating): Rating => (5 - rating) as Rating

/** Level 0 to 3 in steps of 0.5, from the ratings of the basic and the advanced statement. */
export function cornerLevel(basic: Rating, advanced: Rating): number {
  return (1.5 * (basic - 1)) / 3 + (1.5 * (advanced - 1)) / 3
}

/** Corner IDs in asking order: corners whose row is Rising in the scenario come first; otherwise the batch's order. */
export function questionOrder(corners: CornerVerdict[], scenario: Scenario = DEFAULT_SCENARIO): string[] {
  const rising = (c: CornerVerdict) => {
    const row = c.scenarios[scenario].row
    return row !== null && rowStatus(row) === 'Rising'
  }
  return [...corners.filter(rising), ...corners.filter((c) => !rising(c))].map((c) => c.corner_id)
}

/** fit_score = sum(min(user_level, target_level)) / sum(target_level) * 100, with the maths exposed. */
export function fitScore(corners: { corner_id: string; user_level: number; target_level: number }[]): FitScore {
  const terms = corners.map((c) => ({ ...c, term: Math.min(c.user_level, c.target_level) }))
  const numerator = terms.reduce((sum, t) => sum + t.term, 0)
  const denominator = terms.reduce((sum, t) => sum + t.target_level, 0)
  return { score: (numerator / denominator) * 100, numerator, denominator, terms, is_estimate: true }
}
