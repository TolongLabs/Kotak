// What each check-up slot asks (#352): a "what would you do" scenario when the role has one for every slot, otherwise
// today's can-do statement. Pure: the same session seed and slot always give the same option order.

import type { BundleCorner } from '../bundle/schemas'
import type { Rating } from '../session'
import { REVERSED_SLOTS, reversedRating } from './scoring'

export type QuestionLevel = 'basic' | 'advanced'

type AskedCorner = Pick<
  BundleCorner,
  'corner_id' | 'statements' | 'reversed_statements' | 'statement_variants' | 'scenarios'
>

export type SlotQuestion =
  | {
      kind: 'scenario'
      situation: string
      /** The options' texts in this session's order for the slot; label them by position. No ids, no scores. */
      options: string[]
      /** The rating to store for the option at `position` in `options`: its hidden score, never reversed. */
      rate: (position: number) => Rating
    }
  | {
      kind: 'statement'
      /** The reversed wording in a reversed slot once the corner has it, otherwise the can-do statement. */
      statement: string
      reversed: boolean
      /** The rating to store for the clicked rating: flipped when `reversed`. */
      rate: (rating: Rating) => Rating
    }

/** True when every corner has both its scenarios, so every slot asks one; otherwise every slot asks a statement. */
export function usesScenarios(role: { corners: Pick<BundleCorner, 'scenarios'>[] }): boolean {
  return role.corners.every((c) => c.scenarios?.basic !== undefined && c.scenarios?.advanced !== undefined)
}

/**
 * The question for a corner's basic or advanced statement. `order` is the asking order of the corner IDs, as
 * `questionOrder` gives it, which places the question among the 12 for the reversed wording. `seed` is the session's
 * scenario seed; the options' order depends only on it, the corner and the level, so a reload keeps it.
 */
export function slotQuestion(
  role: { corners: AskedCorner[] },
  slot: { order: readonly string[]; corner_id: string; level: QuestionLevel; seed: number },
  yearsExperience?: number | null
): SlotQuestion {
  const asked = slot.order.indexOf(slot.corner_id)
  const corner = role.corners.find((c) => c.corner_id === slot.corner_id)
  if (asked < 0 || !corner) throw new Error(`${slot.corner_id} is not in the asking order and the role's corners`)
  const scenario = usesScenarios(role) ? corner.scenarios![slot.level]! : undefined
  if (scenario) {
    const random = seededRandom(`${slot.seed}:${slot.corner_id}:${slot.level}`)
    const options = [...scenario.options]
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[options[i], options[j]] = [options[j]!, options[i]!]
    }
    return {
      kind: 'scenario',
      situation: scenario.situation,
      options: options.map((o) => o.text),
      rate: (position) => options[position]!.score
    }
  }
  const index = 2 * asked + (slot.level === 'advanced' ? 1 : 0)
  const variants = yearsExperience != null && yearsExperience >= 4 ? corner.statement_variants : undefined
  const reversedText = REVERSED_SLOTS.includes(index)
    ? (variants?.reversed_statements?.[slot.level] ?? corner.reversed_statements?.[slot.level])
    : undefined
  return {
    kind: 'statement',
    statement: reversedText ?? variants?.statements?.[slot.level] ?? corner.statements![slot.level],
    reversed: reversedText !== undefined,
    rate: (rating) => (reversedText ? reversedRating(rating) : rating)
  }
}

// FNV-1a hash of the key seeding mulberry32: a small deterministic generator, so the order needs no stored state.
function seededRandom(key: string): () => number {
  let state = 2166136261
  for (let i = 0; i < key.length; i++) state = Math.imul(state ^ key.charCodeAt(i), 16777619)
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
