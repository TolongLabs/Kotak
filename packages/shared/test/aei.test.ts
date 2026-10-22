import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { SignalSchema } from '../src/engine'
import {
  AEI_METRICS,
  AEI_UNITS,
  AeiGeoSchema,
  AeiLevelSchema,
  AeiSnapshotSchema,
  aeiSignal,
  type AeiSnapshot
} from '../src/data/aei'

const SNAPSHOT_DIR = join(import.meta.dir, '../../../data/snapshots/aei')

const IDS = {
  task: '2408',
  dwa: '4.A.4.b.6.I05.D10',
  iwa: '4.A.3.b.6.I01',
  gwa: '4.A.1.a.1',
  occupation: '43-4051.00',
  major_group: '43'
}

function sample(): AeiSnapshot {
  const source = (layer: string) => ({
    source_name: 'Anthropic Economic Index, release 2026-06-26 (Claude.ai)',
    source_url: 'https://huggingface.co/datasets/Anthropic/EconomicIndex',
    vintage_date: '2026-05-01',
    geo_or_layer: layer
  })
  const geo = (id: string, row: (number | null)[]) => ({
    overall: {
      ...source(`${id}/overall`),
      usage_pct: 0.51,
      usage_per_capita_index: 0.87,
      collaboration_bucket_automation_pct: 47.2,
      collaboration_bucket_augmentation_pct: 52.8,
      human_only_time_mean: 5.1,
      human_with_ai_time_mean: 41.25
    },
    levels: Object.fromEntries(
      AeiLevelSchema.options.map((level) => [level, { ...source(`${id}/${level}`), rows: { [IDS[level]]: row } }])
    )
  })
  return AeiSnapshotSchema.parse({
    snapshot_id: '2026-05',
    period: { date_start: '2026-05-01', date_end: '2026-06-01' },
    release: {
      repo: 'Anthropic/EconomicIndex',
      revision: '4e5f69fab13a9c3f7d0dcc31a6f893a9818738f6',
      path: 'release_2026_06_26/data/aei_claude_ai_2026-06-26.csv',
      release_date: '2026-06-26',
      sha256: 'f974b358bce0e5a8417510c61da4342234cd0de9d9d0b62acf4c6dbcf8ec7b68',
      retrieved_on: '2026-10-22',
      licence: 'CC-BY (data), MIT (code)'
    },
    metrics: AEI_METRICS,
    units: AEI_UNITS,
    labels: Object.fromEntries(AeiLevelSchema.options.map((level) => [level, { [IDS[level]]: `${level} label` }])),
    geos: {
      MYS: geo('MYS', [0.68, null, null, null, null]),
      SGP: geo('SGP', [0.71, null, null, null, null]),
      GLOBAL: geo('GLOBAL', [0.4, 41.2, 58.8, 1.5, 12.3])
    }
  })
}

// Applies one change to a fresh sample and reports whether the schema still accepts it.
function accepts(change: (snapshot: any) => void): boolean {
  const snapshot = structuredClone(sample())
  change(snapshot)
  return AeiSnapshotSchema.safeParse(snapshot).success
}

describe('AeiSnapshotSchema', () => {
  test.each(['2026-04', '2026-05'])('accepts the committed %s snapshot, under 2 MB', async (id) => {
    const file = Bun.file(join(SNAPSHOT_DIR, `${id}.json`))
    expect(file.size).toBeLessThan(2 * 1024 * 1024)
    const snapshot = AeiSnapshotSchema.parse(await file.json())
    expect(snapshot.snapshot_id).toBe(id)
    for (const geo of AeiGeoSchema.options) {
      for (const level of AeiLevelSchema.options) {
        expect(Object.keys(snapshot.geos[geo].levels[level].rows).length).toBeGreaterThan(0)
      }
    }
  })

  test('accepts a valid sample', () => {
    expect(accepts(() => {})).toBe(true)
  })

  test('rejects undated records', () => {
    expect(accepts((s) => delete s.geos.MYS.levels.task.vintage_date)).toBe(false)
    expect(accepts((s) => delete s.geos.SGP.overall.vintage_date)).toBe(false)
    expect(accepts((s) => (s.geos.MYS.levels.gwa.vintage_date = 'May 2026'))).toBe(false)
    expect(accepts((s) => (s.geos.MYS.levels.gwa.vintage_date = '2026-04-01'))).toBe(false)
    expect(accepts((s) => (s.period.date_start = '2026-04-01'))).toBe(false)
    expect(accepts((s) => (s.period.date_end = '2026-05-31'))).toBe(false)
  })

  test('rejects records without full provenance', () => {
    expect(accepts((s) => delete s.geos.GLOBAL.levels.occupation.source_name)).toBe(false)
    expect(accepts((s) => (s.geos.GLOBAL.levels.occupation.source_url = 'not a url'))).toBe(false)
    expect(accepts((s) => delete s.geos.MYS.levels.major_group.geo_or_layer)).toBe(false)
    expect(accepts((s) => (s.geos.MYS.levels.major_group.geo_or_layer = 'GLOBAL/major_group'))).toBe(false)
  })

  test('rejects malformed rows', () => {
    expect(accepts((s) => (s.geos.MYS.levels.task.rows['2408'] = [0.68]))).toBe(false)
    expect(accepts((s) => (s.geos.MYS.levels.task.rows['2408'][0] = '0.68'))).toBe(false)
    expect(accepts((s) => (s.geos.MYS.levels.task.rows['2408'][0] = 140))).toBe(false)
    expect(accepts((s) => (s.geos.MYS.levels.task.rows['2408'][3] = -1))).toBe(false)
    const addRow = (level: string, id: string, label?: string) => (s: any) => {
      if (label) s.labels[level][id] = label
      s.geos.MYS.levels[level].rows[id] = [1, null, null, null, null]
    }
    expect(accepts(addRow('task', '9999', 'A task'))).toBe(true)
    expect(accepts(addRow('task', '9999'))).toBe(false)
    expect(accepts(addRow('task', '4.A.1.a.1', 'A work activity'))).toBe(false)
    expect(accepts(addRow('occupation', '43-4051', 'A SOC code without the O*NET suffix'))).toBe(false)
  })

  test('rejects a wrong shape', () => {
    expect(accepts((s) => delete s.geos.SGP)).toBe(false)
    expect(accepts((s) => (s.geos.IDN = s.geos.SGP))).toBe(false)
    expect(accepts((s) => delete s.geos.MYS.levels.dwa)).toBe(false)
    expect(accepts((s) => (s.geos.MYS.levels.task.extra = 1))).toBe(false)
    expect(accepts((s) => s.metrics.reverse())).toBe(false)
    expect(accepts((s) => (s.units.human_with_ai_time_mean = 'hours'))).toBe(false)
    expect(accepts((s) => (s.snapshot_id = '2026-06'))).toBe(false)
  })
})

describe('aeiSignal', () => {
  test('carries the provenance of its table', () => {
    const signal = aeiSignal(sample(), 'MYS', 'task', '2408', 'pct')
    expect(SignalSchema.parse(signal)).toEqual({
      metric: 'pct',
      value: 0.68,
      source_name: 'Anthropic Economic Index, release 2026-06-26 (Claude.ai)',
      source_url: 'https://huggingface.co/datasets/Anthropic/EconomicIndex',
      vintage_date: '2026-05-01',
      geo_or_layer: 'MYS/task'
    })
  })

  test('returns null, not 0, for suppressed and unpublished cells', () => {
    expect(aeiSignal(sample(), 'MYS', 'task', '2408', 'collaboration_bucket_automation_pct').value).toBeNull()
    expect(aeiSignal(sample(), 'MYS', 'task', '9999', 'pct').value).toBeNull()
    expect(aeiSignal(sample(), 'GLOBAL', 'task', '2408', 'human_with_ai_time_mean').value).toBe(12.3)
  })
})
