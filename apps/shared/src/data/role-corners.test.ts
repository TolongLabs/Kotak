import { describe, expect, test } from 'bun:test'
import { ONET_LICENCE, ONET_LICENCE_URL, ONET_MODIFICATION_NOTICE, onetCredit } from './onet'
import { OccupationCornersSchema, RoleCornerSchema, RoleCornersSchema } from './role-corners'

const corner = {
  corner_id: 'code-review',
  name: 'Code Review',
  task_ids: [16363, 16364],
  iwa_ids: ['4.A.3.b.1.I01'],
  statements: {
    basic: 'I can read a short function and say what it does.',
    working: 'I have reviewed and fixed AI-written code before merging it.',
    advanced: 'I have set review rules that a team follows.'
  },
  hours: { basic: 4, working: 12, advanced: 30 },
  sdg_targets: ['8.2', '4.4'],
  resources: [
    {
      title: 'Search: code review guide',
      url: 'https://www.google.com/search?q=code+review+guide',
      kind: 'search',
      verified: false
    }
  ]
}

const role = {
  onet_code: '15-1252.00',
  quality: 'auto-generated',
  generated_by: 'runpod',
  model: 'sample-model',
  generated_date: '2026-10-23',
  corners: [corner, { ...corner, corner_id: 'testing', name: 'Testing', task_ids: [16365] }]
}

const file = {
  meta: {
    licence: ONET_LICENCE,
    licence_url: ONET_LICENCE_URL,
    credit: onetCredit('30.1'),
    modification_notice: ONET_MODIFICATION_NOTICE,
    onet_version: '30.1'
  },
  roles: [role]
}

describe('RoleCornersSchema', () => {
  test('accepts a sample batch file', () => {
    expect(RoleCornersSchema.safeParse(file).success).toBe(true)
  })

  test('rejects more than 6 corners or none', () => {
    const corners = Array.from({ length: 7 }, (_, i) => ({ ...corner, corner_id: `c-${i}`, task_ids: [i + 1] }))
    expect(OccupationCornersSchema.safeParse({ ...role, corners }).success).toBe(false)
    expect(OccupationCornersSchema.safeParse({ ...role, corners: corners.slice(0, 6) }).success).toBe(true)
    expect(OccupationCornersSchema.safeParse({ ...role, corners: [] }).success).toBe(false)
  })

  test('rejects a corner without three statements, an SDG tag, hours or its own tasks', () => {
    const { advanced: _advanced, ...twoStatements } = corner.statements
    expect(RoleCornerSchema.safeParse({ ...corner, statements: twoStatements }).success).toBe(false)
    const same = { basic: 'Same.', working: 'Same.', advanced: 'Other.' }
    expect(RoleCornerSchema.safeParse({ ...corner, statements: same }).success).toBe(false)
    expect(RoleCornerSchema.safeParse({ ...corner, sdg_targets: [] }).success).toBe(false)
    expect(RoleCornerSchema.safeParse({ ...corner, sdg_targets: ['18.1'] }).success).toBe(false)
    expect(RoleCornerSchema.safeParse({ ...corner, hours: { basic: 4, working: 0, advanced: 30 } }).success).toBe(false)
    expect(RoleCornerSchema.safeParse({ ...corner, task_ids: [] }).success).toBe(false)
    expect(RoleCornerSchema.safeParse({ ...corner, iwa_ids: ['4.A.3.b.1'] }).success).toBe(false)
    expect(RoleCornerSchema.safeParse({ ...corner, task_ids: [16363, 16363] }).success).toBe(false)
  })

  test('rejects a task shared between corners and duplicate corner IDs', () => {
    expect(
      OccupationCornersSchema.safeParse({ ...role, corners: [corner, { ...corner, corner_id: 'b' }] }).success
    ).toBe(false)
    expect(
      OccupationCornersSchema.safeParse({ ...role, corners: [corner, { ...corner, task_ids: [9] }] }).success
    ).toBe(false)
  })

  test('rejects unsafe or unverified resources on human-checked roles', () => {
    const http = { ...corner.resources[0], url: 'http://example.com/guide' }
    expect(RoleCornerSchema.safeParse({ ...corner, resources: [http] }).success).toBe(false)
    const script = { ...corner.resources[0], url: 'javascript:alert(1)' }
    expect(RoleCornerSchema.safeParse({ ...corner, resources: [script] }).success).toBe(false)
    expect(OccupationCornersSchema.safeParse({ ...role, quality: 'human-checked' }).success).toBe(false)
    expect(OccupationCornersSchema.safeParse({ ...role, quality: 'checked' }).success).toBe(false)
  })

  test('rejects duplicate roles and a credit for another O*NET version', () => {
    expect(RoleCornersSchema.safeParse({ ...file, roles: [role, role] }).success).toBe(false)
    expect(RoleCornersSchema.safeParse({ ...file, meta: { ...file.meta, credit: onetCredit('31.0') } }).success).toBe(
      false
    )
  })
})
