import { describe, expect, test } from 'bun:test'
import {
  DOSM_ATTRIBUTION,
  DosmQesRowSchema,
  DosmQesSnapshotSchema,
  EpochContextSchema,
  MyColSchema,
  OpenDosmSeriesSchema,
  OpenDosmSnapshotSchema
} from './sources'

const meta = {
  dataset: 'DOSM Quarterly Employment Statistics',
  retrieved_date: '2026-10-22',
  licence: 'DOSM terms of use',
  licence_url: 'https://www.dosm.gov.my/portal-main/article/term-of-use',
  attribution: DOSM_ATTRIBUTION
}

const qesRow = {
  source_name: 'DOSM Employment Statistics, Second Quarter 2026',
  source_url: 'https://www.dosm.gov.my/portal-main/release-content/employment-statistics-Q22026',
  vintage_date: '2026-08-13',
  geo_or_layer: 'MYS / sector',
  attribution: DOSM_ATTRIBUTION,
  quarter: '2026-Q2',
  sector: 'all',
  skill_category: 'all',
  unit: 'thousand',
  jobs: null,
  filled_jobs: null,
  vacancies: 195.7,
  jobs_created: 31.5,
  vacancy_trend_qoq: 'unknown',
  vacancy_trend_yoy: 'unknown'
}

const sruSeries = {
  source_name: 'OpenDOSM lfs_qtr_sru_sex',
  source_url: 'https://open.dosm.gov.my/data-catalogue/lfs_qtr_sru_sex',
  vintage_date: '2026-08-11',
  geo_or_layer: 'MYS / skill category',
  dataset_id: 'lfs_qtr_sru_sex',
  frequency: 'quarterly',
  units: { sru: 'percent' },
  rows: [{ date: '2026-04-01', dimensions: { sex: 'overall', variable: 'rate' }, values: { sru: 35.2 } }]
}

const mycol = {
  meta: {
    ...meta,
    dataset: 'TalentCorp MyCOL',
    licence: 'All rights reserved',
    licence_url: null,
    attribution: 'TalentCorp'
  },
  editions: [
    {
      source_name: 'MyCOL 2022/2023',
      source_url: 'https://www.talentcorp.com.my/mycol',
      vintage_date: '2023-09-21',
      geo_or_layer: 'MYS / role',
      edition: '2022/23',
      list: 'national',
      masco_version: 'MASCO 2020',
      occupation_count: 37,
      sector_count: 3,
      scope_note: 'Three pilot sectors.'
    },
    {
      source_name: 'MyCOL 2024/2025',
      source_url: 'https://www.talentcorp.com.my/mycol',
      vintage_date: '2026-03-13',
      geo_or_layer: 'MYS / role',
      edition: '2024/25',
      list: 'national',
      masco_version: 'MASCO 2020',
      occupation_count: 66,
      sector_count: 18,
      scope_note: '18 sectors.'
    }
  ],
  occupations: [
    { masco_code: '2512', editions: ['2022/23', '2024/25'], in_all_editions: true, onet_codes: ['15-1252.00'] },
    { masco_code: '1121', editions: ['2024/25'], in_all_editions: false, onet_codes: [] }
  ]
}

const epoch = {
  meta: { ...meta, dataset: 'Epoch AI data', licence: 'CC BY', licence_url: null, attribution: 'Epoch AI' },
  headline: {
    source_name: 'Epoch AI benchmarks',
    source_url: 'https://epoch.ai/data',
    vintage_date: '2026-10-19',
    geo_or_layer: 'GLOBAL',
    text: 'Sample headline.'
  },
  signals: [
    {
      metric: 'frontier_benchmark_score',
      value: null,
      source_name: 'Epoch AI benchmarks',
      source_url: 'https://epoch.ai/data',
      vintage_date: '2026-10-19',
      geo_or_layer: 'GLOBAL'
    }
  ],
  frontier_models: [{ model: 'Sample model', organization: null, release_date: '2026-10-01' }]
}

describe('dated source schemas', () => {
  test('accept sample payloads, with suppressed values as null', () => {
    expect(DosmQesSnapshotSchema.safeParse({ meta, rows: [qesRow] }).success).toBe(true)
    expect(OpenDosmSnapshotSchema.safeParse({ meta, series: [sruSeries] }).success).toBe(true)
    const suppressed = { ...sruSeries, rows: [{ ...sruSeries.rows[0], values: { sru: null } }] }
    expect(OpenDosmSeriesSchema.safeParse(suppressed).success).toBe(true)
    expect(MyColSchema.safeParse(mycol).success).toBe(true)
    expect(EpochContextSchema.safeParse(epoch).success).toBe(true)
  })

  test('reject undated or unsourced numeric records', () => {
    for (const field of ['source_name', 'source_url', 'vintage_date', 'geo_or_layer'] as const) {
      const { [field]: _dropped, ...rest } = qesRow
      expect(DosmQesRowSchema.safeParse(rest).success).toBe(false)
      const { [field]: _gone, ...series } = sruSeries
      expect(OpenDosmSeriesSchema.safeParse(series).success).toBe(false)
    }
    expect(DosmQesRowSchema.safeParse({ ...qesRow, vintage_date: 'Q2 2026' }).success).toBe(false)
    const { vintage_date: _vintage, ...undatedHeadline } = epoch.headline
    expect(EpochContextSchema.safeParse({ ...epoch, headline: undatedHeadline }).success).toBe(false)
    const { vintage_date: _date, ...undatedSignal } = epoch.signals[0]
    expect(EpochContextSchema.safeParse({ ...epoch, signals: [undatedSignal] }).success).toBe(false)
  })

  test('reject malformed QES rows', () => {
    expect(DosmQesRowSchema.safeParse({ ...qesRow, attribution: 'DOSM' }).success).toBe(false)
    expect(DosmQesRowSchema.safeParse({ ...qesRow, quarter: '2026Q2' }).success).toBe(false)
    expect(DosmQesRowSchema.safeParse({ ...qesRow, vacancies: -1 }).success).toBe(false)
    expect(DosmQesRowSchema.safeParse({ ...qesRow, vacancies: '195.7' }).success).toBe(false)
    expect(DosmQesSnapshotSchema.safeParse({ meta, rows: [qesRow, qesRow] }).success).toBe(false)
  })

  test('reject OpenDOSM values without a unit', () => {
    const noUnit = { ...sruSeries, units: {} }
    expect(OpenDosmSeriesSchema.safeParse(noUnit).success).toBe(false)
    expect(OpenDosmSeriesSchema.safeParse({ ...sruSeries, dataset_id: 'lfs_week' }).success).toBe(false)
  })

  test('reject MyCOL titles and wrong edition flags', () => {
    const titled = { ...mycol, occupations: [{ ...mycol.occupations[0], title: 'Software Developers' }] }
    expect(MyColSchema.safeParse(titled).success).toBe(false)
    const wrongFlag = { ...mycol, occupations: [{ ...mycol.occupations[1], in_all_editions: true }] }
    expect(MyColSchema.safeParse(wrongFlag).success).toBe(false)
    const unknownEdition = { ...mycol, occupations: [{ ...mycol.occupations[1], editions: ['2025/26'] }] }
    expect(MyColSchema.safeParse(unknownEdition).success).toBe(false)
    const badEdition = { ...mycol, editions: [{ ...mycol.editions[0], edition: '2022/24' }] }
    expect(MyColSchema.safeParse(badEdition).success).toBe(false)
  })
})
