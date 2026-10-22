import { describe, expect, test } from 'bun:test'
import snapshot from '../../../data/snapshots/dosm-jmi.json'
import {
  combineJmiDirections,
  DOSM_JMI_ATTRIBUTION,
  DOSM_JMI_SOURCE_NAME,
  DosmDemandSchema,
  jmiDirection,
  type DosmDemand,
  type DosmFigure
} from '../src/data/dosm-jmi'

const release = {
  source_url: 'https://www.dosm.gov.my/portal-main/release-content/big-data-analytics-job-market-insights-q22026',
  release_title: 'Big Data Analytics: Job Market Insights, Second Quarter of 2026',
  vintage_date: '2026-08-18'
}

function figure(quarter: string, value: number | null, layer: DosmFigure['geo_or_layer']): DosmFigure {
  const [year, q] = quarter.split('-')
  return {
    metric: 'online_job_offerings',
    value,
    quarter,
    quarter_label: `${q} ${year}`,
    source_name: DOSM_JMI_SOURCE_NAME,
    ...release,
    geo_or_layer: layer,
    attribution: DOSM_JMI_ATTRIBUTION,
    qoq: null,
    yoy: null
  }
}

function sample(): DosmDemand {
  const q1 = figure('2026-Q1', 20089, 'MYS/L3')
  const q2 = {
    ...figure('2026-Q2', 19899, 'MYS/L3'),
    qoq: { from_quarter: '2026-Q1', change_pct: -0.9, direction: 'flat' as const }
  }
  return {
    dataset: 'dosm-jmi',
    source_name: DOSM_JMI_SOURCE_NAME,
    publisher: 'Department of Statistics Malaysia (DOSM)',
    licence: 'DOSM copyright.',
    attribution: DOSM_JMI_ATTRIBUTION,
    retrieved_date: '2026-10-22',
    first_quarter: '2026-Q1',
    last_quarter: '2026-Q2',
    direction_rule: { threshold_pct: 5, comparisons: ['qoq', 'yoy'], verdict_input: 'qoq and yoy agree' },
    releases: [
      {
        title: release.release_title,
        url: release.source_url,
        pdf_url: 'https://www.dosm.gov.my/site/downloadrelease?id=big-data-analytics-job-market-insights-q22026',
        release_date: '2026-08-18',
        quarters: ['2026-Q2'],
        named_roles: 'with-counts',
        total_in_release_text: true
      }
    ],
    totals: [figure('2026-Q1', 626861, 'MYS/total'), figure('2026-Q2', 555509, 'MYS/total')],
    major_groups: [
      {
        masco_major_group: '2',
        name: 'Professionals',
        points: [figure('2026-Q1', 315768, 'MYS/L2'), figure('2026-Q2', 285907, 'MYS/L2')],
        latest: { quarter: '2026-Q2', direction: null, basis: 'no-comparison' }
      }
    ],
    named_roles: [
      {
        name: 'Software Developers',
        masco_code: '2512',
        masco_major_group: '2',
        masco_source: { release_title: release.release_title, source_url: release.source_url, quarter: '2023-Q2' },
        onet_soc_code: '15-1252.00',
        onet_title: 'Software Developers',
        onet_match: 'occupation-title',
        onet_note: 'Exact title match.',
        points: [
          { ...q1, rank: 5 },
          { ...q2, rank: 5 }
        ],
        latest: { quarter: '2026-Q2', direction: 'flat', basis: 'qoq-only' }
      }
    ],
    missing: [],
    notes: []
  }
}

describe('DosmDemandSchema', () => {
  test('accepts a valid sample', () => {
    expect(DosmDemandSchema.safeParse(sample()).success).toBe(true)
  })

  test('accepts the emitted snapshot', () => {
    const result = DosmDemandSchema.safeParse(snapshot)
    expect(result.error?.issues ?? []).toEqual([])
  })

  test('rejects an undated figure', () => {
    const payload = sample()
    delete (payload.totals[0] as Partial<DosmFigure>).vintage_date
    expect(DosmDemandSchema.safeParse(payload).success).toBe(false)
  })

  test('rejects a figure without a quarter', () => {
    const payload = sample()
    delete (payload.major_groups[0].points[1] as Partial<DosmFigure>).quarter
    expect(DosmDemandSchema.safeParse(payload).success).toBe(false)
  })

  test('rejects a malformed quarter, value or source URL', () => {
    const badQuarter = sample()
    badQuarter.totals[1] = { ...badQuarter.totals[1], quarter: 'Q2 2026' }
    const badValue = sample()
    badValue.totals[1] = { ...badValue.totals[1], value: -1 }
    const badUrl = sample()
    badUrl.totals[1] = { ...badUrl.totals[1], source_url: 'dosm.gov.my' }
    for (const payload of [badQuarter, badValue, badUrl])
      expect(DosmDemandSchema.safeParse(payload).success).toBe(false)
  })

  test('rejects a figure without the DOSM attribution', () => {
    const payload = sample()
    payload.totals[0] = { ...payload.totals[0], attribution: 'Source: online job ads' }
    expect(DosmDemandSchema.safeParse(payload).success).toBe(false)
  })

  test('rejects a direction that breaks the 5% rule', () => {
    const payload = sample()
    const point = payload.named_roles[0].points[1]
    payload.named_roles[0].points[1] = { ...point, qoq: { ...point.qoq!, direction: 'down' } }
    expect(DosmDemandSchema.safeParse(payload).success).toBe(false)
  })

  test('rejects a latest direction that does not follow from the latest point', () => {
    const payload = sample()
    payload.named_roles[0].latest = { quarter: '2026-Q2', direction: 'up', basis: 'qoq-only' }
    expect(DosmDemandSchema.safeParse(payload).success).toBe(false)
  })

  test('rejects totals with a missing quarter', () => {
    const payload = sample()
    payload.totals.pop()
    expect(DosmDemandSchema.safeParse(payload).success).toBe(false)
  })
})

describe('JMI directions', () => {
  test('more than +5% is up, less than -5% is down, otherwise flat', () => {
    expect([5.1, 5, -5, -5.1].map(jmiDirection)).toEqual(['up', 'flat', 'flat', 'down'])
  })

  test('qoq and yoy must agree, otherwise flat', () => {
    expect(combineJmiDirections('up', 'up')).toEqual({ direction: 'up', basis: 'qoq-and-yoy-agree' })
    expect(combineJmiDirections('down', 'up')).toEqual({ direction: 'flat', basis: 'qoq-and-yoy-disagree' })
    expect(combineJmiDirections(null, 'down')).toEqual({ direction: 'down', basis: 'yoy-only' })
    expect(combineJmiDirections(null, null)).toEqual({ direction: null, basis: 'no-comparison' })
  })
})
