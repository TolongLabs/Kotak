import { describe, expect, test } from 'bun:test'
import {
  AEI_METRICS,
  AEI_UNITS,
  AeiLevelSchema,
  cornerVerdict,
  DOSM_JMI_ATTRIBUTION,
  DOSM_JMI_SOURCE_NAME,
  resolveRoleSignals,
  RoleSignalsSchema,
  type AeiGeo,
  type AeiLevel,
  type AeiSnapshot,
  type DosmDemand,
  type JmiDirection,
  type MyCol,
  type ResolveRoleInput,
  type TransferLinks
} from '..'

type Row = [number | null, number | null, number | null, number | null, number | null]
type Rows = Partial<Record<AeiGeo, Partial<Record<AeiLevel, Record<string, Row>>>>>

// pct, automation %, augmentation %, hours without AI, minutes with AI
const usage = (pct: number): Row => [pct, null, null, null, null]
const full = (pct: number): Row => [pct, 60, 30, 2, 30]

function month(id: '2026-04' | '2026-05', rows: Rows): AeiSnapshot {
  const date = `${id}-01`
  const source = (layer: string) => ({
    source_name: 'Anthropic Economic Index',
    source_url: 'https://huggingface.co/datasets/Anthropic/EconomicIndex',
    vintage_date: date,
    geo_or_layer: layer
  })
  const geo = (g: AeiGeo, index: number) => ({
    overall: {
      ...source(`${g}/overall`),
      usage_pct: null,
      usage_per_capita_index: index,
      collaboration_bucket_automation_pct: null,
      collaboration_bucket_augmentation_pct: null,
      human_only_time_mean: null,
      human_with_ai_time_mean: null
    },
    levels: Object.fromEntries(
      AeiLevelSchema.options.map((l) => [l, { ...source(`${g}/${l}`), rows: rows[g]?.[l] ?? {} }])
    ) as AeiSnapshot['geos']['MYS']['levels']
  })
  return {
    snapshot_id: id,
    period: { date_start: date, date_end: id === '2026-04' ? '2026-05-01' : '2026-06-01' },
    release: {
      repo: 'Anthropic/EconomicIndex',
      revision: '0'.repeat(40),
      path: 'fixture.csv',
      release_date: '2026-06-26',
      sha256: '0'.repeat(64),
      retrieved_on: '2026-10-22',
      licence: 'CC-BY'
    },
    metrics: [...AEI_METRICS],
    units: { ...AEI_UNITS },
    labels: { task: {}, dwa: {}, iwa: {}, gwa: {}, occupation: {}, major_group: {} },
    geos: { MYS: geo('MYS', 0.87), SGP: geo('SGP', 5.81), GLOBAL: geo('GLOBAL', 1) }
  }
}

// Task 1 sits under IWA ...I01 in GWA 4.A.2.a.4; task 3 under 4.A.3.a.1, which Malaysia does not publish.
const links: TransferLinks = {
  task_iwas: { 1: ['4.A.2.a.4.I01'], 3: ['4.A.3.a.1.I01'] },
  task_dwas: { 1: ['4.A.2.a.4.I01.D01'], 3: ['4.A.3.a.1.I01.D01'] },
  iwa_broad: { '4.A.2.a.4.I01': '4.A.2.a.4', '4.A.3.a.1.I01': '4.A.3.a.1' }
}
const occupation = (onet_code: string, masco_2020: string | null = null) => ({
  onet_code,
  masco_2020,
  isco08: [{ isco08: masco_2020 ?? '2512', esco_links: 1 }]
})
const corners = [
  { corner_id: 'skills', task_ids: [1] },
  { corner_id: 'hands-on', task_ids: [3] }
]
const resolve = (input: Partial<ResolveRoleInput> & Pick<ResolveRoleInput, 'aei' | 'occupation'>) =>
  RoleSignalsSchema.parse(resolveRoleSignals({ corners, links, ...input }))

describe('#71 AI-use fallback', () => {
  const both = (rows: Rows) => [month('2026-04', rows), month('2026-05', rows)]

  test('a role with Malaysian detailed data uses its L4 task and L3 occupation rows', () => {
    const rows: Rows = {
      MYS: {
        task: { 1: usage(0.5) },
        gwa: { '4.A.2.a.4': full(3) },
        occupation: { '15-1252.00': usage(1.2) },
        major_group: { 15: full(20) }
      }
    }
    const signals = resolve({ occupation: occupation('15-1252.00'), aei: both(rows) })
    const [skills, handsOn] = signals.corners
    expect(skills!.ai_usage.points.map((p) => [p.geo_or_layer, p.vintage_date])).toEqual([
      ['MYS/task', '2026-04-01'],
      ['MYS/task', '2026-05-01']
    ])
    expect(skills!.ai_usage.fallback_label).toBeNull()
    // Malaysia publishes the split only for work activities, which are broader than the corner, so it is labelled.
    expect(skills!.collaboration).toMatchObject({
      geo_or_layer: 'MYS/gwa',
      automation_pct: 60,
      fallback_label: 'Borrowed from the Malaysian rows for its broader work activities, which other corners may share'
    })
    expect(handsOn!.ai_usage.points.map((p) => p.geo_or_layer)).toEqual(['MYS/occupation', 'MYS/occupation'])
    expect(handsOn!.ai_usage.fallback_label).toBe('Borrowed from the Malaysian row for the whole occupation')
    expect(signals.context!.role.map((s) => s.geo_or_layer)).toEqual(['MYS/occupation'])
  })

  test('a suppressed role borrows its major group, or GLOBAL rows, with a provenance label', () => {
    // Malaysia suppresses this occupation's row, so it is absent; only its major group is published.
    const suppressed = resolve({
      occupation: occupation('15-1299.00'),
      aei: both({ MYS: { occupation: { '15-1252.00': usage(1.2) }, major_group: { 15: full(20) } } })
    })
    expect(suppressed.corners[1]!.ai_usage.points.map((p) => p.geo_or_layer)).toEqual([
      'MYS/major_group',
      'MYS/major_group'
    ])
    expect(suppressed.corners[1]!.ai_usage.fallback_label).toBe('Borrowed from the Malaysian row for major group 15')
    expect(suppressed.corners[1]!.collaboration).toMatchObject({
      geo_or_layer: 'MYS/major_group',
      fallback_label: 'Borrowed from the Malaysian row for major group 15'
    })

    const global = resolve({
      occupation: occupation('45-2091.00'),
      aei: both({ MYS: { major_group: { 15: full(20) } }, GLOBAL: { task: { 3: full(0.02) } } })
    })
    expect(global.corners[1]!.ai_usage.points.map((p) => p.geo_or_layer)).toEqual(['GLOBAL/task', 'GLOBAL/task'])
    expect(global.corners[1]!.ai_usage.fallback_label).toBe('Global task rows: no Malaysian row is published')
    expect(global.corners[1]!.collaboration?.fallback_label).toBe('Global task rows: no Malaysian row is published')
  })
})

describe('#71 demand fallback', () => {
  const figure = (layer: 'MYS/L2' | 'MYS/L3') => ({
    metric: 'online_job_offerings' as const,
    value: 100,
    quarter: '2026-Q2',
    quarter_label: 'Q2 2026',
    source_name: DOSM_JMI_SOURCE_NAME,
    source_url: 'https://www.dosm.gov.my/portal-main/release-content/big-data-analytics-job-market-insights-q22026',
    release_title: 'Big Data Analytics: Job Market Insights, Second Quarter of 2026',
    vintage_date: '2026-08-18',
    geo_or_layer: layer,
    attribution: DOSM_JMI_ATTRIBUTION,
    qoq: null,
    yoy: null
  })
  const latest = (quarter: string, direction: JmiDirection) => ({ quarter, direction, basis: 'qoq-only' as const })
  function jmi(role: { quarter: string; direction: JmiDirection } | null, group: JmiDirection): DosmDemand {
    return {
      dataset: 'dosm-jmi',
      source_name: DOSM_JMI_SOURCE_NAME,
      publisher: 'Department of Statistics Malaysia (DOSM)',
      licence: 'DOSM copyright',
      attribution: DOSM_JMI_ATTRIBUTION,
      retrieved_date: '2026-10-22',
      first_quarter: '2026-Q2',
      last_quarter: '2026-Q2',
      direction_rule: { threshold_pct: 5, comparisons: ['qoq', 'yoy'], verdict_input: 'latest' },
      releases: [],
      totals: [],
      missing: [],
      notes: [],
      major_groups: [
        { masco_major_group: '2', name: 'Professionals', points: [figure('MYS/L2')], latest: latest('2026-Q2', group) }
      ],
      named_roles: role
        ? [
            {
              name: 'Software Developers',
              masco_code: '2512',
              masco_major_group: '2',
              masco_source: null,
              onet_soc_code: '15-1252.00',
              onet_title: 'Software Developers',
              onet_match: 'occupation-title',
              onet_note: 'The DOSM title equals an O*NET 30.1 occupation title.',
              points: [{ ...figure('MYS/L3'), quarter: role.quarter, rank: 1 }],
              latest: latest(role.quarter, role.direction)
            }
          ]
        : []
    }
  }
  const edition = (id: string) => ({
    source_name: 'TalentCorp Malaysia Critical Occupations List',
    source_url: 'https://www.talentcorp.com.my/mycol',
    vintage_date: id === '2024/25' ? '2026-03-13' : '2023-09-21',
    geo_or_layer: 'MYS/L3',
    edition: id,
    list: 'national' as const,
    masco_version: 'MASCO 2020' as const,
    occupation_count: null,
    sector_count: null,
    scope_note: 'Fixture edition'
  })
  const mycol = (listedIn: string[]): MyCol => ({
    meta: {
      dataset: 'mycol',
      retrieved_date: '2026-10-22',
      licence: 'All rights reserved',
      licence_url: null,
      attribution: 'TalentCorp'
    },
    editions: [edition('2022/23'), edition('2024/25')],
    occupations: [
      { masco_code: '2512', editions: listedIn, in_all_editions: listedIn.length === 2, onet_codes: ['15-1252.00'] }
    ]
  })
  const aei = [month('2026-05', { MYS: { task: { 1: full(0.5) }, major_group: { 15: full(20) } } })]
  const developer = occupation('15-1252.00', '2512')
  const readings = (input: Partial<ResolveRoleInput>) =>
    resolve({ occupation: developer, aei, ...input }).corners[0]!.demand.map((d) => [
      d.geo_or_layer,
      d.direction,
      d.fallback_label
    ])

  test('1: the role count in Job Market Insights comes first, then MyCOL, then the group series', () => {
    expect(readings({ jmi: jmi({ quarter: '2026-Q2', direction: 'up' }, 'down'), mycol: mycol(['2024/25']) })).toEqual([
      ['MYS/L3', 'up', null],
      ['MYS/L3', 'up', 'From TalentCorp MyCOL 2024/25'],
      ['MYS/L2', 'down', 'Borrowed from the Job Market Insights series for MASCO major group 2, Professionals']
    ])
  })

  test('2: MyCOL presence when the role has no current count', () => {
    const [first] = readings({ jmi: jmi({ quarter: '2025-Q4', direction: 'up' }, 'flat'), mycol: mycol(['2022/23']) })
    expect(first).toEqual([
      'MYS/L3',
      'flat',
      'From TalentCorp MyCOL 2024/25: listed only in earlier editions; no Job Market Insights direction for this role in 2026-Q2'
    ])
  })

  test('3: the occupation group series when the role has no count and no MyCOL listing', () => {
    expect(readings({ jmi: jmi(null, 'up') })).toEqual([
      [
        'MYS/L2',
        'up',
        'Borrowed from the Job Market Insights series for MASCO major group 2, Professionals; not among Job Market Insights named roles; TalentCorp MyCOL not loaded'
      ]
    ])
  })

  test('4: Unknown when no source has a direction, which adds 0 to the target', () => {
    const signals = resolve({ occupation: developer, aei })
    expect(signals.corners[0]!.demand).toEqual([])
    expect(signals.context!.missing).toContain('DOSM Job Market Insights (#52)')
    const verdict = cornerVerdict(signals.corners[0]!, signals.anchors)
    for (const scenario of ['slow', 'fast'] as const) {
      const outcome = verdict.scenarios[scenario]
      expect(outcome.demand).toBe('unknown')
      expect(outcome.target.demand_effect).toBe(0)
      expect(outcome.target.value).toBe(2 + outcome.target.ai_effect)
    }
  })
})
