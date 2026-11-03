import { describe, expect, test } from 'bun:test'
import {
  ONET_LICENCE,
  ONET_LICENCE_URL,
  ONET_MODIFICATION_NOTICE,
  OnetMascoMatchSchema,
  OnetMetaSchema,
  OnetOccupationSchema,
  OnetTaskSchema,
  OnetTitleIndexSchema,
  OnetWorkActivitiesFileSchema,
  onetCredit
} from './onet'

const meta = {
  source_name: 'O*NET 30.1 Database',
  source_url: 'https://www.onetcenter.org/db_releases.html',
  vintage_date: '2025-12-01',
  geo_or_layer: 'US O*NET-SOC 2019 taxonomy',
  licence: ONET_LICENCE,
  licence_url: ONET_LICENCE_URL,
  credit: onetCredit('30.1'),
  modification_notice: ONET_MODIFICATION_NOTICE,
  version: '30.1',
  release_label: 'December 2025',
  download_url: 'https://www.onetcenter.org/dl_files/database/db_30_1_text/',
  retrieved_date: '2026-10-22',
  modifications: ['Kept only occupations with task statements.'],
  crosswalks: [
    {
      source_name: 'ESCO to O*NET-SOC 2019 crosswalk',
      source_url: 'https://www.onetcenter.org/crosswalks/esco/ESCO_to_ONET-SOC.xlsx',
      vintage_date: null,
      retrieved_date: '2026-10-22',
      licence: 'CC BY 4.0',
      method: 'ISCO-08 group from the first digits of each ESCO code.'
    }
  ]
}

const occupation = {
  onet_code: '15-1252.00',
  title: 'Software Developers',
  description: 'Research, design, and develop computer and network software or specialized utility programs.',
  masco_2020: '2512',
  masco_unmatched: false,
  isco08: [
    { isco08: '2512', esco_links: 5 },
    { isco08: '2514', esco_links: 4 }
  ],
  related: [{ onet_code: '15-1253.00', tier: 'Primary-Short', index: 1 }]
}

const task = {
  task_id: 16363,
  statement: 'Modify existing software to correct errors.',
  task_type: 'Core',
  dwa_ids: ['4.A.3.b.1.I01.D02', '4.A.3.b.1.I01.D03', '4.A.2.b.2.I07.D01'],
  iwa_ids: ['4.A.2.b.2.I07', '4.A.3.b.1.I01']
}

describe('O*NET schemas', () => {
  test('accept sample payloads', () => {
    expect(OnetMetaSchema.safeParse(meta).success).toBe(true)
    expect(OnetOccupationSchema.safeParse(occupation).success).toBe(true)
    expect(OnetTaskSchema.safeParse(task).success).toBe(true)
    expect(OnetTaskSchema.safeParse({ ...task, task_type: null }).success).toBe(true)
    expect(
      OnetMascoMatchSchema.safeParse({ onet_code: '15-1252.00', masco_2020: '2512', masco_pdf_page: 30 }).success
    ).toBe(true)
  })

  test('reject an undated or unsourced header', () => {
    const { vintage_date: _vintage, ...undated } = meta
    expect(OnetMetaSchema.safeParse(undated).success).toBe(false)
    const { source_url: _url, ...unsourced } = meta
    expect(OnetMetaSchema.safeParse(unsourced).success).toBe(false)
    expect(OnetMetaSchema.safeParse({ ...meta, vintage_date: 'December 2025' }).success).toBe(false)
  })

  test('reject a credit line that names another version', () => {
    expect(OnetMetaSchema.safeParse({ ...meta, credit: onetCredit('31.0') }).success).toBe(false)
    expect(OnetMetaSchema.safeParse({ ...meta, modification_notice: 'Changed.' }).success).toBe(false)
  })

  test('reject a guessed or inconsistent MASCO match', () => {
    expect(OnetOccupationSchema.safeParse({ ...occupation, masco_unmatched: true }).success).toBe(false)
    expect(OnetOccupationSchema.safeParse({ ...occupation, masco_2020: null }).success).toBe(false)
    expect(OnetOccupationSchema.safeParse({ ...occupation, masco_2020: null, masco_unmatched: true }).success).toBe(
      true
    )
    expect(OnetOccupationSchema.safeParse({ ...occupation, masco_2020: '2511' }).success).toBe(false)
    expect(OnetOccupationSchema.safeParse({ ...occupation, masco_2020: '251' }).success).toBe(false)
  })

  test('reject malformed codes and extra fields', () => {
    expect(OnetOccupationSchema.safeParse({ ...occupation, onet_code: '15-1252' }).success).toBe(false)
    expect(OnetOccupationSchema.safeParse({ ...occupation, masco_title: 'SOFTWARE DEVELOPERS' }).success).toBe(false)
    expect(OnetTaskSchema.safeParse({ ...task, task_id: '16363' }).success).toBe(false)
    expect(OnetTaskSchema.safeParse({ ...task, task_type: 'n/a' }).success).toBe(false)
    expect(OnetTaskSchema.safeParse({ ...task, dwa_ids: ['4.A.3.b.1.I01'] }).success).toBe(false)
  })

  test('reject task IWAs that disagree with its DWAs', () => {
    expect(OnetTaskSchema.safeParse({ ...task, iwa_ids: ['4.A.3.b.1.I01'] }).success).toBe(false)
    expect(OnetTaskSchema.safeParse({ ...task, iwa_ids: [...task.iwa_ids].reverse() }).success).toBe(false)
  })

  test('reject work activities with a missing parent', () => {
    const file = {
      meta,
      gwas: [{ gwa_id: '4.A.3.b.1', title: 'Working with Computers' }],
      iwas: [
        { iwa_id: '4.A.3.b.1.I01', gwa_id: '4.A.3.b.1', title: 'Program computer systems or production equipment.' }
      ],
      dwas: [{ dwa_id: '4.A.3.b.1.I01.D02', iwa_id: '4.A.3.b.1.I01', title: 'Modify software programs.' }]
    }
    expect(OnetWorkActivitiesFileSchema.safeParse(file).success).toBe(true)
    expect(
      OnetWorkActivitiesFileSchema.safeParse({ ...file, gwas: [{ gwa_id: '4.A.1.a.1', title: 'X' }] }).success
    ).toBe(false)
    const misfiled = { ...file, iwas: [{ ...file.iwas[0], gwa_id: '4.A.1.a.1' }] }
    expect(OnetWorkActivitiesFileSchema.safeParse(misfiled).success).toBe(false)
  })

  test('reject an unsorted title index or an unknown code', () => {
    const index = {
      meta,
      key_version: 1,
      occupations: [['15-1252.00', 'Software Developers', '2512']],
      entries: [
        ['application developer', '15-1252.00', 'Application Developer', 'alternate'],
        ['software developer', '15-1252.00', 'Software Developers', 'title']
      ]
    }
    expect(OnetTitleIndexSchema.safeParse(index).success).toBe(true)
    expect(OnetTitleIndexSchema.safeParse({ ...index, entries: [...index.entries].reverse() }).success).toBe(false)
    const unknown = { ...index, entries: [['coder', '15-1251.00', 'Coder', 'alternate']] }
    expect(OnetTitleIndexSchema.safeParse(unknown).success).toBe(false)
  })
})
