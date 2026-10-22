// Four-layer hierarchy resolver (#71): maps dated sources onto the engine's per-corner inputs. Pure: the caller
// loads the files. The verdict reads only AI use, how AI is used and demand; the other layers are context.

import { aeiSignal, type AeiGeo, type AeiLevel, type AeiMetric, type AeiSnapshot } from '../data/aei'
import type { DosmDemand, DosmFigure, JmiLatest } from '../data/dosm-jmi'
import type { OnetOccupation } from '../data/onet'
import type { MyCol } from '../data/sources'
import type { Signal, Source } from '../engine'
import type {
  AiUsageSeries,
  CornerCollaboration,
  CornerDemandReading,
  CornerSignals,
  CornerTimeSaving,
  RoleSignals,
  TransferLinks
} from './schemas'

export type ResolveRoleInput = {
  occupation: Pick<OnetOccupation, 'onet_code' | 'masco_2020' | 'isco08'>
  corners: { corner_id: string; task_ids: (string | number)[] }[]
  links: TransferLinks
  aei: AeiSnapshot[] // the Economic Index months in this snapshot, any order; the latest one names it
  jmi?: DosmDemand
  mycol?: MyCol
  context?: { sector?: Signal[]; occupation_group?: Signal[]; ai_advancement?: Signal[] } // picked for this role
}

const LEVELS: AeiLevel[] = ['task', 'dwa', 'iwa', 'gwa', 'occupation', 'major_group']
// Malaysia at every level before any GLOBAL row: TRD's "MYS first, then GLOBAL", and the split's "work activity,
// then major group, then GLOBAL" falls out of it because Malaysia publishes the split at no other level.
const CHAIN = (['MYS', 'GLOBAL'] as const).flatMap((geo) => LEVELS.map((level) => [geo, level] as const))

const LEVEL_NAME: Record<AeiLevel, string> = {
  task: 'task',
  dwa: 'detailed work activity',
  iwa: 'intermediate work activity',
  gwa: 'work activity',
  occupation: 'occupation',
  major_group: 'major group'
}

const unique = <T>(values: T[]) => [...new Set(values)]
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
const sourceOf = ({ source_name, source_url, vintage_date, geo_or_layer }: Source): Source => ({
  source_name,
  source_url,
  vintage_date,
  geo_or_layer
})

/** Null for a Malaysian task, DWA or IWA row; otherwise what was borrowed (TRD: label any higher layer used). */
function borrowedLabel(geo: AeiGeo, level: AeiLevel, majorGroup: string): string | null {
  if (geo === 'GLOBAL') return `Global ${LEVEL_NAME[level]} rows: no Malaysian row is published`
  if (level === 'gwa')
    return 'Borrowed from the Malaysian rows for its broader work activities, which other corners may share'
  if (level === 'occupation') return 'Borrowed from the Malaysian row for the whole occupation'
  if (level === 'major_group') return `Borrowed from the Malaysian row for major group ${majorGroup}`
  return null
}

function aeiResolver(input: ResolveRoleInput, taskIds: (string | number)[]) {
  const code = input.occupation.onet_code
  const tasks = taskIds.map(String)
  const iwas = unique(tasks.flatMap((t) => input.links.task_iwas[t] ?? []))
  const nodes: Record<AeiLevel, string[]> = {
    task: tasks,
    dwa: unique(tasks.flatMap((t) => input.links.task_dwas?.[t] ?? [])),
    iwa: iwas,
    gwa: unique(iwas.flatMap((i) => input.links.iwa_broad[i] ?? [])),
    occupation: [code],
    major_group: [code.slice(0, 2)]
  }
  const value = (month: AeiSnapshot, geo: AeiGeo, level: AeiLevel, id: string, metric: AeiMetric) =>
    aeiSignal(month, geo, level, id, metric).value
  const tableSource = (month: AeiSnapshot, geo: AeiGeo, level: AeiLevel) => sourceOf(month.geos[geo].levels[level])
  const label = (geo: AeiGeo, level: AeiLevel) => borrowedLabel(geo, level, code.slice(0, 2))

  /** The corner's usage share each month: the summed `pct` of its nodes at the finest step where at least one node
   * is published in every month, so every point sums the same nodes. */
  function usage(months: AeiSnapshot[]): AiUsageSeries {
    for (const [geo, level] of CHAIN) {
      const ids = nodes[level].filter((id) => months.every((m) => value(m, geo, level, id, 'pct') !== null))
      if (ids.length === 0) continue
      const points = months.map((m) => ({
        ...tableSource(m, geo, level),
        value: Math.round(sum(ids.map((id) => value(m, geo, level, id, 'pct')!)) * 100) / 100
      }))
      return { points, fallback_label: label(geo, level) }
    }
    return { points: [], fallback_label: null }
  }

  /** Usage-weighted means of `metrics` at the finest step where a node publishes all of them. */
  function means(month: AeiSnapshot, metrics: AeiMetric[]) {
    for (const [geo, level] of CHAIN) {
      const rows = nodes[level]
        .map((id) => ({
          weight: value(month, geo, level, id, 'pct') ?? 0,
          values: metrics.map((m) => value(month, geo, level, id, m))
        }))
        .filter((r): r is { weight: number; values: number[] } => r.values.every((v) => v !== null))
      if (rows.length === 0) continue
      const total = sum(rows.map((r) => r.weight))
      const share = (weight: number) => (total > 0 ? weight / total : 1 / rows.length)
      const result = metrics.map((_, i) => sum(rows.map((r) => share(r.weight) * r.values[i]!)))
      return { values: result, source: tableSource(month, geo, level), fallback_label: label(geo, level) }
    }
    return null
  }

  return { usage, means }
}

function collaboration(found: ReturnType<ReturnType<typeof aeiResolver>['means']>): CornerCollaboration | null {
  if (!found) return null
  const [automation_pct, augmentation_pct] = found.values as [number, number]
  return { ...found.source, automation_pct, augmentation_pct, fallback_label: found.fallback_label }
}

function timeSaving(found: ReturnType<ReturnType<typeof aeiResolver>['means']>): CornerTimeSaving | null {
  if (!found || found.values[0]! <= 0) return null
  // human_only_time_mean is in hours, human_with_ai_time_mean in minutes.
  const [human_hours, withAiMinutes] = found.values as [number, number]
  return { ...found.source, human_hours, with_ai_hours: withAiMinutes / 60, fallback_label: found.fallback_label }
}

const figureSignal = (f: DosmFigure): Signal => ({ metric: f.metric, value: f.value, ...sourceOf(f) })

// MASCO major groups follow ISCO-08 major groups, so a role without a hand-checked MASCO code uses the first digit
// of its main ISCO-08 link.
const mascoMajorGroup = (o: ResolveRoleInput['occupation']) => (o.masco_2020 ?? o.isco08[0]?.isco08 ?? '').slice(0, 1)
const namedRole = (input: ResolveRoleInput) =>
  input.jmi?.named_roles.find((r) => r.onet_soc_code === input.occupation.onet_code)
const groupSeries = (input: ResolveRoleInput) =>
  input.jmi?.major_groups.find((g) => g.masco_major_group === mascoMajorGroup(input.occupation))

/** A JMI series' `latest` counts only when it has a direction from DOSM's newest quarter. */
function jmiReading(series: { points: DosmFigure[]; latest: JmiLatest }, jmi: DosmDemand) {
  const { direction, quarter } = series.latest
  if (!direction || quarter !== jmi.last_quarter) return null
  return { ...sourceOf(series.points.find((p) => p.quarter === quarter)!), direction }
}

/**
 * Demand readings in fallback order: the role's own count among JMI's named roles; its MyCOL presence (on the latest
 * edition is up, only on earlier ones is flat); its MASCO major group's JMI series; none means Unknown. Each reading's
 * label says what it borrowed and which earlier steps had nothing.
 */
function demand(input: ResolveRoleInput) {
  const { jmi, mycol, occupation } = input
  const readings: CornerDemandReading[] = []
  const skipped: string[] = []
  const step = (reading: Omit<CornerDemandReading, 'fallback_label'> | null, label: string | null, why: string) => {
    if (!reading) return void skipped.push(why)
    const note = [label, ...unique(skipped)].filter((s): s is string => !!s).join('; ')
    readings.push({ ...reading, fallback_label: note || null })
  }

  const named = namedRole(input)
  step(
    named && jmi ? jmiReading(named, jmi) : null,
    null,
    !jmi
      ? 'DOSM Job Market Insights not loaded'
      : !named
        ? 'not among Job Market Insights named roles'
        : `no Job Market Insights direction for this role in ${jmi.last_quarter}`
  )

  const listed = mycol?.occupations.find((o) => o.onet_codes.includes(occupation.onet_code))
  const latestEdition = mycol
    ? mycol.editions
        .map((e) => e.edition)
        .sort()
        .at(-1)!
    : null
  const edition =
    mycol?.editions.find((e) => e.edition === latestEdition && e.list === 'national') ??
    mycol?.editions.find((e) => e.edition === latestEdition)
  const onLatest = !!listed && listed.editions.includes(latestEdition!)
  step(
    listed && edition ? { ...sourceOf(edition), direction: onLatest ? 'up' : 'flat' } : null,
    `From TalentCorp MyCOL ${latestEdition}${onLatest ? '' : ': listed only in earlier editions'}`,
    !mycol ? 'TalentCorp MyCOL not loaded' : 'not on any MyCOL list'
  )

  const group = mascoMajorGroup(occupation)
  const series = groupSeries(input)
  step(
    series && jmi ? jmiReading(series, jmi) : null,
    series
      ? `Borrowed from the Job Market Insights series for MASCO major group ${group}, ${series.name}` +
          (occupation.masco_2020 ? '' : ', matched through ISCO-08')
      : null,
    !jmi ? 'DOSM Job Market Insights not loaded' : `no Job Market Insights direction for major group ${group || 'none'}`
  )
  return readings
}

/** The engine inputs for one role in one snapshot, with every borrowed value labelled. */
export function resolveRoleSignals(input: ResolveRoleInput): RoleSignals {
  const months = [...input.aei].sort((a, b) => a.snapshot_id.localeCompare(b.snapshot_id))
  const latest = months.at(-1)!
  const code = input.occupation.onet_code
  const readings = demand(input)

  const corners: CornerSignals[] = input.corners.map((corner) => {
    const aei = aeiResolver(input, corner.task_ids)
    return {
      corner_id: corner.corner_id,
      ai_usage: aei.usage(months),
      collaboration: collaboration(
        aei.means(latest, ['collaboration_bucket_automation_pct', 'collaboration_bucket_augmentation_pct'])
      ),
      demand: readings,
      time_saving: timeSaving(aei.means(latest, ['human_only_time_mean', 'human_with_ai_time_mean']))
    }
  })

  const anchor = (geo: 'MYS' | 'SGP') => {
    const overall = latest.geos[geo].overall
    if (overall.usage_per_capita_index === null) throw new Error(`${latest.snapshot_id}: no ${geo} usage index`)
    return { ...sourceOf(overall), value: overall.usage_per_capita_index }
  }
  const aeiRows = (level: AeiLevel, id: string) =>
    (['MYS', 'GLOBAL'] as const).map((geo) => aeiSignal(latest, geo, level, id, 'pct')).filter((s) => s.value !== null)
  const named = namedRole(input)
  const group = groupSeries(input)
  const missing = [
    !input.jmi && 'DOSM Job Market Insights (#52)',
    !input.mycol && 'TalentCorp MyCOL (#60)',
    !input.context?.sector?.length && 'Layer 1 sector context: DOSM QES (#55), OpenDOSM employment_sector (#63)',
    !input.context?.occupation_group?.length && 'Layer 2 group context: OpenDOSM wages_occupation (#63)',
    !input.context?.ai_advancement?.length && 'Epoch AI context (#66)'
  ].filter((m): m is string => !!m)

  return {
    snapshot_id: latest.snapshot_id,
    onet_code: code,
    anchors: { mys: anchor('MYS'), sgp: anchor('SGP') },
    corners,
    context: {
      sector: input.context?.sector ?? [],
      occupation_group: [
        ...aeiRows('major_group', code.slice(0, 2)),
        ...(group ? [figureSignal(group.points.at(-1)!)] : []),
        ...(input.context?.occupation_group ?? [])
      ],
      role: [...aeiRows('occupation', code), ...(named ? [figureSignal(named.points.at(-1)!)] : [])],
      ai_advancement: input.context?.ai_advancement ?? [],
      missing
    }
  }
}
