import { describe, expect, test } from 'bun:test'
import sample from '../../fixtures/sample-scenarios.json'
import type { CornerScenarios } from '../data/scenarios'
import { slotQuestion, usesScenarios, type QuestionLevel } from './scenario-questions'
import { REVERSED_SLOTS } from './scoring'

const scenarios: Record<string, CornerScenarios> = sample.roles['23-1011.00'] as Record<string, CornerScenarios>
const corners = Object.entries(scenarios).map(([corner_id, cornerScenarios]) => ({
  corner_id,
  statements: { basic: `${corner_id} basic`, working: `${corner_id} working`, advanced: `${corner_id} advanced` },
  reversed_statements: { basic: `${corner_id} reversed basic`, advanced: `${corner_id} reversed advanced` },
  scenarios: cornerScenarios
}))
// The 12 slots in asking order: each corner's basic question, then its advanced one.
const slots = corners.flatMap(({ corner_id }, i) =>
  (['basic', 'advanced'] as QuestionLevel[]).map((level, k) => ({ corner_id, level, index: 2 * i + k, seed: 7 }))
)

describe('slotQuestion', () => {
  test('a role with no scenarios, or one missing a slot, asks the statements', () => {
    const none = { corners: corners.map((c) => ({ ...c, scenarios: undefined })) }
    const partial = {
      corners: corners.map((c, i) => (i === 0 ? { ...c, scenarios: { basic: c.scenarios.basic } } : c))
    }
    expect(usesScenarios({ corners })).toBe(true)
    for (const role of [none, partial]) {
      expect(usesScenarios(role)).toBe(false)
      for (const slot of slots) {
        const reversed = REVERSED_SLOTS.includes(slot.index)
        expect(slotQuestion(role, slot)).toMatchObject({
          kind: 'statement',
          statement: `${slot.corner_id} ${reversed ? 'reversed ' : ''}${slot.level}`,
          reversed
        })
      }
    }
  })
})
