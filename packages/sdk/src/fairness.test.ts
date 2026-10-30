import { afterAll, describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { DemoRolesFileSchema, EDUCATION_ORDER, ProfileSchema, type ProfileInput } from '@kotak/shared'
import { createKotak } from './kotak'
import { CheckupParamsSchema } from './schemas'

// Paired profiles (#379) on the built bundle: each pair differs in one field only, and the same answers are run for
// each demo role. Verdicts and fit must match for every pair; the ranking must match for situation pairs (years and
// qualification move it by design, see docs/algorithm-card.md). Pace differs by design (#356). Skipped when the bundle
// hasn't been built.

const ROOT = join(import.meta.dir, '../../..')
const PUBLIC = join(ROOT, 'apps/web/public')
const built = existsSync(join(PUBLIC, 'data/pathways.json'))
const kotak = createKotak({ source: { read: (path) => Bun.file(join(PUBLIC, path)).json(), trusted: true } })
const START = '2026-10-25'
const PROTECTED = ['gender', 'race', 'religion', 'name', 'age'] as const

const demo = DemoRolesFileSchema.parse(await Bun.file(join(ROOT, 'data/demo-roles.json')).json())

// Two base profiles; each pair changes one field of its base and keeps the rest.
const BASES: ProfileInput[] = [
  { situation: 'working', education_level: 'bachelor', years_experience: 6 },
  { situation: 'graduated', education_level: 'diploma', years_experience: 1, field_of_study: 'computer-science' }
]

interface Pair {
  kind: 'situation' | 'years' | 'education'
  label: string
  a: ProfileInput
  b: ProfileInput
}

function pairsOf(base: ProfileInput): Pair[] {
  const [lowest, highest] = [EDUCATION_ORDER[0]!, EDUCATION_ORDER.at(-1)!]
  return [
    {
      kind: 'situation',
      label: 'working, returning',
      a: { ...base, situation: 'working' },
      b: { ...base, situation: 'returning' }
    },
    {
      kind: 'situation',
      label: 'working, between_jobs',
      a: { ...base, situation: 'working' },
      b: { ...base, situation: 'between_jobs' }
    },
    {
      kind: 'situation',
      label: 'returning, between_jobs',
      a: { ...base, situation: 'returning' },
      b: { ...base, situation: 'between_jobs' }
    },
    { kind: 'years', label: '0, 12 years', a: { ...base, years_experience: 0 }, b: { ...base, years_experience: 12 } },
    {
      kind: 'education',
      label: `${lowest}, ${highest}`,
      a: { ...base, education_level: lowest },
      b: { ...base, education_level: highest }
    }
  ]
}

const cases = demo.roles.flatMap(({ onet_code }) =>
  BASES.flatMap((base, i) =>
    pairsOf(base).map((pair) => ({ ...pair, onet_code, title: `${onet_code} base ${i + 1}: ${pair.label}` }))
  )
)

const tally = { pairs: 0, identical: 0, rankingDiffers: 0, paceDiffers: 0 }

afterAll(() => {
  if (tally.pairs === 0) return
  console.info(
    `Fairness: ${tally.pairs} paired profiles on ${demo.roles.length} demo roles: verdicts and each role's fit identical in ${tally.identical} of ${tally.pairs}; ranking differs by design (seniority and qualification rules) in ${tally.rankingDiffers}; pace differs by design in ${tally.paceDiffers}; name, gender, race, religion and age are rejected as inputs.`
  )
})

describe.skipIf(!built)('paired profiles (#379)', () => {
  for (const c of cases) {
    test(c.title, async () => {
      const questions = await kotak.questions(c.onet_code)
      const answers = questions.corners.map((corner) => ({
        corner_id: corner.corner_id,
        basic: 3 as const,
        advanced: 1 as const
      }))
      const run = (profile: ProfileInput) =>
        kotak.checkup({
          role_code: c.onet_code,
          goal: 'explore',
          answers,
          profile,
          weekly_hours: null,
          start_date: START
        })
      const [a, b] = [await run(c.a), await run(c.b)]

      expect(
        b.corners.map(({ corner_id, verdict, verdict_label, row }) => ({ corner_id, verdict, verdict_label, row }))
      ).toEqual(
        a.corners.map(({ corner_id, verdict, verdict_label, row }) => ({ corner_id, verdict, verdict_label, row }))
      )
      const fitA = new Map(a.roles.map((role) => [role.onet_code, role.fit_score]))
      const fitB = new Map(b.roles.map((role) => [role.onet_code, role.fit_score]))
      expect(fitA.has(c.onet_code) && fitB.has(c.onet_code)).toBe(true)
      for (const [code, score] of fitA) if (fitB.has(code)) expect(fitB.get(code)).toBe(score)

      const rankA = a.roles.map((role) => role.onet_code)
      const rankB = b.roles.map((role) => role.onet_code)
      const rankingDiffers = rankA.join() !== rankB.join()
      if (c.kind === 'situation') expect(rankB).toEqual(rankA)

      const paceDiffers =
        a.roadmap.pace.factor !== b.roadmap.pace.factor || a.roadmap.total_hours !== b.roadmap.total_hours

      tally.pairs++
      tally.identical++
      if (rankingDiffers) tally.rankingDiffers++
      if (paceDiffers) tally.paceDiffers++
    })
  }

  test('pace or roadmap hours differ for a returning worker, by design (#356)', () => {
    const returning = cases.filter((c) => c.a.situation === 'returning' || c.b.situation === 'returning')
    expect(returning.length).toBeGreaterThan(0)
    expect(tally.paceDiffers).toBeGreaterThan(0)
  })
})

describe('protected traits are not inputs', () => {
  const valid = { role_code: '15-1254.00', goal: 'explore', answers: [], weekly_hours: null, start_date: START }

  test('the check-up rejects a top-level protected trait', () => {
    expect(CheckupParamsSchema.safeParse(valid).success).toBe(true)
    for (const key of PROTECTED) expect(CheckupParamsSchema.safeParse({ ...valid, [key]: 'x' }).success).toBe(false)
  })

  test('the profile rejects a protected trait', () => {
    expect(ProfileSchema.safeParse({}).success).toBe(true)
    for (const key of PROTECTED) expect(ProfileSchema.safeParse({ [key]: 'x' }).success).toBe(false)
  })
})
