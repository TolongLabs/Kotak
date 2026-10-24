import { describe, expect, test } from 'bun:test'
import {
  buildRoadmap,
  cornerLevel,
  cornerVerdict,
  CornerVerdictSchema,
  fitScore,
  REVERSED_SLOTS,
  reversedRating,
  roleVerdicts,
  RoleVerdictsSchema,
  transferLevels,
  type CornerSignals,
  type TransferLinks,
  type UsageAnchors
} from '.'

const aei = {
  source_name: 'Anthropic Economic Index',
  source_url: 'https://huggingface.co/datasets/Anthropic/EconomicIndex',
  vintage_date: '2026-05-01',
  geo_or_layer: 'MYS/gwa'
}
const jmi = {
  source_name: 'DOSM Job Market Insights',
  source_url: 'https://www.dosm.gov.my/portal-main/release-content/big-data-analytics-job-market-insights-q22026',
  vintage_date: '2026-08-13',
  geo_or_layer: 'MYS major group'
}
const indexes = (date: string, mys: number, sgp: number): UsageAnchors => ({
  mys: { ...aei, vintage_date: date, geo_or_layer: 'MYS/overall', value: mys },
  sgp: { ...aei, vintage_date: date, geo_or_layer: 'SGP/overall', value: sgp }
})
const anchors = indexes('2026-05-01', 0.87, 5.81)

function corner(
  id: string,
  usage: [string, number | null][],
  how: 'augmentation' | 'automation',
  demand: ('up' | 'flat' | 'down')[]
): CornerSignals {
  return {
    corner_id: id,
    ai_usage: { points: usage.map(([vintage_date, value]) => ({ ...aei, vintage_date, value })), fallback_label: null },
    collaboration: {
      ...aei,
      automation_pct: how === 'automation' ? 70 : 20,
      augmentation_pct: how === 'automation' ? 20 : 70,
      fallback_label: null
    },
    demand: demand.map((direction) => ({ ...jmi, direction, fallback_label: null }))
  }
}

// Projected 12-month change of a two-point series a -> b one month apart: 12 * (b - a) / b.
const growing: [string, number][] = [
  ['2026-04-01', 1.0],
  ['2026-05-01', 1.1]
] // +109%, rising in both scenarios
const shrinking: [string, number][] = [
  ['2026-04-01', 1.0],
  ['2026-05-01', 0.98]
] // -24%, not rising in either
const edging: [string, number][] = [
  ['2026-04-01', 1.0],
  ['2026-05-01', 1.003]
] // +3.6% slow, +13.8% fast
const surging: [string, number][] = [
  ['2026-04-01', 1.0],
  ['2026-05-01', 2.0]
] // +600%

describe('#81 verdict rules', () => {
  test.each([
    ['Rising: AI helps it scale', 'Rising', growing, 'augmentation', 'flat'],
    ['Declining because of AI', 'Declining', growing, 'automation', 'flat'],
    ["Rising: AI can't do it yet", 'Rising', shrinking, 'augmentation', 'up'],
    ['Steady', 'Steady', shrinking, 'automation', 'flat'],
    ['Declining for other reasons', 'Declining', shrinking, 'augmentation', 'down']
  ] as const)('row %s', (label, status, usage, how, demand) => {
    const v = cornerVerdict(corner('c', [...usage], how, [demand]), anchors)
    expect(CornerVerdictSchema.parse(v)).toEqual(v)
    expect(v).toMatchObject({ label, status, reason: 'table', futures: [] })
    expect(v.scenarios.slow.row).toBe(label)
    expect(v.scenarios.fast.row).toBe(label)
  })

  test('Split when slow and fast give different verdicts, with both futures', () => {
    const v = cornerVerdict(corner('c', edging, 'augmentation', ['flat']), anchors)
    expect(v.scenarios.slow.ai_trend).toBe('not_rising')
    expect(v.scenarios.fast.ai_trend).toBe('rising')
    expect(v).toMatchObject({ status: 'Split', label: 'Split', reason: 'scenarios_disagree' })
    expect(v.futures.map((f) => [f.scenario, f.row, f.status])).toEqual([
      ['slow', 'Steady', 'Steady'],
      ['fast', 'Rising: AI helps it scale', 'Rising']
    ])
    // Different rows are different verdicts even when both chips would read Rising.
    const rising = cornerVerdict(corner('c', edging, 'augmentation', ['up']), anchors)
    expect(rising).toMatchObject({ status: 'Split', reason: 'scenarios_disagree' })
    expect(rising.futures.map((f) => f.row)).toEqual(["Rising: AI can't do it yet", 'Rising: AI helps it scale'])
  })

  test('Unknown with fewer than 2 dated points', () => {
    for (const usage of [
      [['2026-05-01', 1.2]],
      [
        ['2026-04-01', null],
        ['2026-05-01', 1.2]
      ]
    ] as [string, number | null][][]) {
      const v = cornerVerdict(corner('c', usage, 'augmentation', ['up']), anchors)
      expect(v).toMatchObject({ status: 'Unknown', label: 'Unknown', reason: 'too_few_points', futures: [] })
      expect(v.scenarios.slow.projection).toBeNull()
    }
  })

  test('targets clamp at 3.0 and 1.0', () => {
    const high = cornerVerdict(corner('c', surging, 'augmentation', ['up']), anchors)
    const low = cornerVerdict(corner('c', surging, 'automation', ['down']), anchors)
    // The unclamped sum 2.0 + ai_effect + demand_effect lies outside [1, 3], so the clamp is what sets the target.
    const unclamped = ({ ai_effect, demand_effect }: { ai_effect: number; demand_effect: number }) =>
      2 + ai_effect + demand_effect
    for (const scenario of ['slow', 'fast'] as const) {
      expect(high.scenarios[scenario].target.value).toBe(3)
      expect(low.scenarios[scenario].target.value).toBe(1)
      expect(unclamped(high.scenarios[scenario].target)).toBeGreaterThan(3)
      expect(unclamped(low.scenarios[scenario].target)).toBeLessThan(1)
    }
  })

  test('switching scenario or snapshot changes the targets', () => {
    const april = roleVerdicts({
      snapshot_id: '2026-04',
      onet_code: '15-1254.00',
      anchors: indexes('2026-04-01', 0.8, 6.44),
      corners: [
        corner(
          'c',
          [
            ['2026-03-01', 1.0],
            ['2026-04-01', 1.02]
          ],
          'augmentation',
          ['flat']
        )
      ]
    })
    const may = roleVerdicts({
      snapshot_id: '2026-05',
      onet_code: '15-1254.00',
      anchors,
      corners: [
        corner(
          'c',
          [
            ['2026-03-01', 1.0],
            ['2026-04-01', 1.02],
            ['2026-05-01', 1.08]
          ],
          'augmentation',
          ['flat']
        )
      ]
    })
    expect(RoleVerdictsSchema.parse(may)).toEqual(may)
    const [a, m] = [april.corners[0]!, may.corners[0]!]
    expect(a.scenarios.fast.target.value).toBeGreaterThan(a.scenarios.slow.target.value)
    expect(m.scenarios.fast.target.value).toBeGreaterThan(m.scenarios.slow.target.value)
    expect(m.scenarios.slow.target.value).not.toBe(a.scenarios.slow.target.value)
    expect(m.scenarios.fast.target.value).not.toBe(a.scenarios.fast.target.value)
  })
})

describe('#83 scoring', () => {
  test.each([
    [4, 4, 3],
    [4, 2, 2],
    [3, 1, 1],
    [1, 1, 0],
    [2, 1, 0.5]
  ] as const)('basic %d and advanced %d rate level %d', (basic, advanced, level) => {
    expect(cornerLevel(basic, advanced)).toBe(level)
  })

  test('the reversed slots are questions 2, 4, 7, 10 and 12, never two in a row', () => {
    expect(REVERSED_SLOTS.map((slot) => slot + 1)).toEqual([2, 4, 7, 10, 12])
    expect(REVERSED_SLOTS.some((slot, i) => REVERSED_SLOTS[i + 1] === slot + 1)).toBe(false)
  })

  test('a reversed answer is saved as 5 minus the rating', () => {
    expect(reversedRating(4)).toBe(1)
    expect(reversedRating(1)).toBe(4)
  })

  test('fit score is sum(min(user, target)) / sum(target) * 100, with its terms', () => {
    const fit = fitScore([
      { corner_id: 'a', user_level: 3, target_level: 2.5 },
      { corner_id: 'b', user_level: 1, target_level: 2 },
      { corner_id: 'c', user_level: 0, target_level: 1.5 }
    ])
    expect(fit.terms.map((t) => t.term)).toEqual([2.5, 1, 0])
    expect(fit.numerator).toBe(3.5)
    expect(fit.denominator).toBe(6)
    expect(fit.score).toBeCloseTo(58.333, 3)
  })

  test('transfer tries the shared IWA, then the shared broad activity, then 0', () => {
    const links: TransferLinks = {
      task_iwas: { 1: ['I1'], 2: ['I2'], 3: ['I3'], 11: ['I1', 'I1'], 12: ['I2'], 13: ['I4'], 14: ['I9'] },
      iwa_broad: { I1: 'G1', I2: 'G1', I3: 'G2', I4: 'G2', I9: 'G9' }
    }
    const answers = [
      { onet_code: 'A', corner_id: 'a1', level: 3, task_ids: [1] },
      { onet_code: 'A', corner_id: 'a2', level: 1, task_ids: [2] },
      { onet_code: 'A', corner_id: 'a3', level: 2, task_ids: [3] }
    ]
    const role = {
      onet_code: 'R',
      corners: [
        { corner_id: 'iwa', task_ids: [11, 12] },
        { corner_id: 'mixed', task_ids: [11, 13] },
        { corner_id: 'broad', task_ids: [13] },
        { corner_id: 'none', task_ids: [14] }
      ]
    }
    const [iwa, mixed, broad, none] = transferLevels(role, answers, links)
    // 2 links share I1 with a1 (level 3), 1 shares I2 with a2 (level 1): (3*2 + 1*1) / 3 = 2.33, rounded down.
    expect(iwa).toMatchObject({ label: 'estimated from your answers', level: 2 })
    expect(iwa!.basis.weighted_level).toBeCloseTo(7 / 3)
    expect(mixed).toMatchObject({
      label: 'estimated from your answers',
      level: 3,
      basis: { iwa_links: 2, broad_links: 1 }
    })
    expect(broad).toMatchObject({ label: 'rough estimate', level: 2, basis: { iwa_links: 0, broad_links: 1 } })
    expect(none).toMatchObject({ label: 'not asked yet', level: 0, basis: { iwa_links: 0, broad_links: 0 } })
    const own = transferLevels({ onet_code: 'A', corners: [{ corner_id: 'a2', task_ids: [2] }] }, answers, links)
    expect(own[0]).toMatchObject({ label: 'self-reported', level: 1 })
  })

  test('roadmap: most fit per hour first, each corner in level order, ties by tier and gap size, Declining last and tagged', () => {
    const signals = [
      corner('rise-small', growing, 'augmentation', ['flat']),
      corner('decline', shrinking, 'augmentation', ['down']),
      corner('steady', shrinking, 'augmentation', ['flat']),
      corner('unknown', [['2026-05-01', 1.0]], 'augmentation', ['flat']),
      corner('split', edging, 'augmentation', ['flat']),
      corner('rise-big', growing, 'augmentation', ['up'])
    ]
    const verdicts = signals.map((s) => cornerVerdict(s, anchors))
    expect(verdicts.map((v) => v.status)).toEqual(['Rising', 'Declining', 'Steady', 'Unknown', 'Split', 'Rising'])
    const levels = { 'rise-small': 2, decline: 0, steady: 1, unknown: 1, split: 0, 'rise-big': 0 }
    const roadmap = buildRoadmap({
      verdicts,
      corners: signals.map((s) => ({
        corner_id: s.corner_id,
        user_level: levels[s.corner_id as keyof typeof levels],
        milestone_hours: { basic: 4, working: 6, advanced: 10 },
        time_saving: null
      })),
      start_date: '2026-10-22'
    })
    const steps = roadmap.items.map((i) => `${i.corner_id}:${i.to_level}`)
    expect(steps).toEqual([
      'rise-big:1',
      'split:1',
      'rise-big:2',
      'split:2',
      'steady:2',
      'unknown:2',
      'rise-big:3',
      'rise-small:3',
      'split:3',
      'decline:1',
      'decline:2'
    ])
    expect(roadmap.items.map((i) => i.rank)).toEqual(roadmap.items.map((_, i) => i + 1))
    expect(roadmap.items.filter((i) => i.tag === 'less important by 2027').map((i) => i.corner_id)).toEqual([
      'decline',
      'decline'
    ])
  })
})
