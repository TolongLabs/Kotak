import { describe, expect, test } from 'bun:test'
import sample from '../../fixtures/sample-scenarios.json'
import { ScenarioQuestionSchema, ScenariosFileSchema } from './scenarios'

const scenario = sample.roles['23-1011.00']['legal-research'].advanced
const withScores = (scores: number[]) => ({
  ...scenario,
  options: scenario.options.map((option, i) => ({ ...option, score: scores[i] }))
})

describe('ScenariosFileSchema', () => {
  test('accepts the sample file', () => {
    expect(ScenariosFileSchema.safeParse(sample).success).toBe(true)
  })

  test('rejects a slot whose scores are not exactly 1, 2, 3 and 4', () => {
    expect(ScenarioQuestionSchema.safeParse(withScores([4, 3, 2, 1])).success).toBe(true)
    for (const scores of [
      [1, 2, 3, 3],
      [4, 4, 4, 4],
      [0, 1, 2, 3],
      [1, 2, 3, 5]
    ])
      expect(ScenarioQuestionSchema.safeParse(withScores(scores)).success).toBe(false)
    expect(ScenarioQuestionSchema.safeParse({ ...scenario, options: scenario.options.slice(0, 3) }).success).toBe(false)
    const roles = { '23-1011.00': { 'legal-research': { advanced: withScores([1, 2, 3, 3]) } } }
    expect(ScenariosFileSchema.safeParse({ ...sample, roles }).success).toBe(false)
  })

  test('rejects repeated option ids', () => {
    const options = scenario.options.map((option) => ({ ...option, id: 'a' }))
    expect(ScenarioQuestionSchema.safeParse({ ...scenario, options }).success).toBe(false)
  })
})
