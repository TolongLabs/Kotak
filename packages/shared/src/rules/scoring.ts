// User levels, question order and fit scores (#83). Pure and deterministic.

import { DEFAULT_SCENARIO } from './constants'
import type { CornerVerdict, FitScore, MilestoneStatement, Scenario } from './schemas'
import { rowStatus } from './verdicts'

/** The second question for a corner: yes to the working statement leads to the advanced one, no to the basic one. */
export function followUpStatement(working: boolean): Exclude<MilestoneStatement, 'working'> {
  return working ? 'advanced' : 'basic'
}

/** Level 0 to 3 from the working answer and the follow-up answer. */
export function cornerLevel(working: boolean, followUp: boolean): 0 | 1 | 2 | 3 {
  if (working) return followUp ? 3 : 2
  return followUp ? 1 : 0
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
