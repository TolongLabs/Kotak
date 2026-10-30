import { describe, expect, test } from 'bun:test'
import { resolve } from 'node:path'
import sample from '../../fixtures/sample-scenarios.json'
import { BundleRoleSchema, type BundleRole } from '../bundle/schemas'
import { RoleCornersSchema } from '../data/role-corners'
import { ScenariosFileSchema } from '../data/scenarios'
import type { CornerScenarios } from '../data/scenarios'
import { slotQuestion, usesScenarios, type QuestionLevel } from './scenario-questions'
import { REVERSED_SLOTS, questionOrder } from './scoring'
import { DEFAULT_SCENARIO } from './constants'
import { roleVerdicts } from './verdicts'

const scenarios: Record<string, CornerScenarios> = sample.roles['23-1011.00'] as Record<string, CornerScenarios>
const corners = Object.entries(scenarios).map(([corner_id, cornerScenarios]) => ({
  corner_id,
  statements: { basic: `${corner_id} basic`, working: `${corner_id} working`, advanced: `${corner_id} advanced` },
  reversed_statements: { basic: `${corner_id} reversed basic`, advanced: `${corner_id} reversed advanced` },
  scenarios: cornerScenarios
}))
// An asking order unlike the corners' own order, as when Rising corners come first.
const order = corners.map((c) => c.corner_id).reverse()
// The 12 questions in asking order: each corner's basic question, then its advanced one.
const asked = order.flatMap((corner_id) =>
  (['basic', 'advanced'] as QuestionLevel[]).map((level) => ({ order, corner_id, level, seed: 7 }))
)

const ROOT = resolve(import.meta.dir, '../../../..')
const SUPERVISION_PHRASE =
  /\bwith\b[^.!?]{0,40}\b(?:guidance|help|supervision|assistance|support)\b|\bunder\s+(?:(?:close|direct)\s+)?(?:supervision|the\s+direction\s+of)\b|\b(?:as|when)\s+directed\s+by\b|\bwhen\s+instructed\b|\b(?:someone|a\s+senior|a\s+supervisor)\s+to\s+walk\s+me\s+through\b|\b(?:still\s+)?need\s+(?:(?:step-by-step\s+)?guidance|help)\s+to\b|\bfor\s+approval\b|\b(?:checked|reviewed|approved)\s+by\s+(?:a\s+)?(?:senior|supervisor|manager)\b|\b(?:a\s+senior|a\s+supervisor|a\s+manager)\s+(?:checks|reviews|approves)\b/i

async function fallbackBundleRoles(): Promise<BundleRole[]> {
  const roleCorners = RoleCornersSchema.parse(await Bun.file(resolve(ROOT, 'data/generated/role-corners.json')).json())
  const scenarios = ScenariosFileSchema.parse(await Bun.file(resolve(ROOT, 'data/generated/scenarios.json')).json())
  const fallback = roleCorners.roles.filter(
    (role) =>
      !role.corners.every((corner) => {
        const slots = scenarios.roles[role.onet_code]?.[corner.corner_id]
        return slots?.basic !== undefined && slots.advanced !== undefined
      })
  )

  expect(fallback).toHaveLength(21)
  return Promise.all(
    fallback.map(async ({ onet_code }) =>
      BundleRoleSchema.parse(await Bun.file(resolve(ROOT, 'apps/web/public/data/roles', `${onet_code}.json`)).json())
    )
  )
}

function shownStatements(role: BundleRole) {
  const order = questionOrder(roleVerdicts(role.signals['2026-05']).corners, DEFAULT_SCENARIO)
  return order.flatMap((corner_id, i) =>
    (['basic', 'advanced'] as const).map((level, j) => ({
      index: 2 * i + j,
      order,
      corner_id,
      level,
      seed: 0
    }))
  )
}

describe('slotQuestion', () => {
  test('a role with no scenarios, or one missing a slot, asks the statements', () => {
    const none = { corners: corners.map((c) => ({ ...c, scenarios: undefined })) }
    const partial = {
      corners: corners.map((c, i) => (i === 0 ? { ...c, scenarios: { basic: c.scenarios.basic } } : c))
    }
    expect(usesScenarios({ corners })).toBe(true)
    for (const role of [none, partial]) {
      expect(usesScenarios(role)).toBe(false)
      asked.forEach((slot, index) => {
        const reversed = REVERSED_SLOTS.includes(index)
        expect(slotQuestion(role, slot)).toMatchObject({
          kind: 'statement',
          statement: `${slot.corner_id} ${reversed ? 'reversed ' : ''}${slot.level}`,
          reversed
        })
      })
    }
  })

  test('experienced wording removes supervision phrases from the 21 statement-only bundle roles', async () => {
    for (const role of await fallbackBundleRoles()) {
      for (const slot of shownStatements(role)) {
        const question = slotQuestion(role, slot, 10)
        expect(question.kind).toBe('statement')
        if (question.kind === 'statement') expect(question.statement).not.toMatch(SUPERVISION_PHRASE)
      }
    }
  })

  test('a missing experience answer keeps every statement as it is today', async () => {
    for (const role of await fallbackBundleRoles()) {
      for (const slot of shownStatements(role)) {
        const question = slotQuestion(role, slot, null)
        const corner = role.corners.find((item) => item.corner_id === slot.corner_id)!
        const reversed = REVERSED_SLOTS.includes(slot.index)
        const expected = reversed
          ? (corner.reversed_statements?.[slot.level] ?? corner.statements![slot.level])
          : corner.statements![slot.level]
        expect(question).toMatchObject({ kind: 'statement', statement: expected })
      }
    }
  })
})
