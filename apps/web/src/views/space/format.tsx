import { VerdictSchema, type Verdict } from '@kotak/shared'
import type { LucideIcon } from 'lucide-react'
import { useCallback } from 'react'
import { verdictConfig, type VerdictType } from '../../components/ui/VerdictChip'
import type { SourceRef } from '../../demo/types'
import { useLocaleIndex } from '../../engine/bundle'
import { roleTitle } from '../../i18n/content/overlay'
import { dateLocale, getLocale, type Locale } from '../../i18n/locale'
import { spaceText, type SpaceText } from '../../i18n/messages/space'
import { textNow, useText } from '../../i18n/text'
import type { SpaceJob, SpaceModel, SpaceSkill, SpaceSnapshot } from './model'

// The space's shared wording and marks, so its table and its 3D view say every number the same way, in the language
// on show. Each formatter reads the language when called, so call them while rendering.

const formats = new Map<Locale, { percent: Intl.NumberFormat; index: Intl.NumberFormat; month: Intl.DateTimeFormat }>()
function formatsFor(locale: Locale) {
  let found = formats.get(locale)
  if (!found) {
    const tag = dateLocale(locale)
    found = {
      percent: new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' }),
      index: new Intl.NumberFormat(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      month: new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    }
    formats.set(locale, found)
  }
  return found
}

/** A 12-month change in AI use, signed and whole: 0.42 is "+42%". */
export const formatChange = (change: number) => formatsFor(getLocale()).percent.format(change)

/** An AI usage index to 2 decimals, the data's own precision: 0.8 is "0.80". */
export const formatIndex = (value: number) => formatsFor(getLocale()).index.format(value)

/** A snapshot's data month, such as "May 2026", "Mei 2026" or "2026年5月". */
export const monthLabel = (snapshot: Pick<SpaceSnapshot, 'date'>) =>
  formatsFor(getLocale()).month.format(new Date(`${snapshot.date}T00:00:00Z`))

/** A job's SOC major group, named in the language on show. */
export const groupName = (t: SpaceText, job: Pick<SpaceJob, 'group'>) => t.groups[job.group] ?? job.group

/** A Job Zone's word as it sits inside a sentence ("some preparation"). */
export const zoneWord = (t: SpaceText, zone: SpaceJob['zone']) => t.zones[zone].toLowerCase()

/** The space's text, and the job titles and skill names from the same content overlay Radar and Roles read, so a job
 * and a skill read the same everywhere; anything without an entry keeps its English. */
export function useSpaceText() {
  const t = useText(spaceText)
  const index = useLocaleIndex()
  const skillName = (job: Pick<SpaceJob, 'code'>, skill: Pick<SpaceSkill, 'corner_id' | 'name'>) =>
    index?.skill_names[job.code]?.[skill.corner_id] ?? skill.name
  // Stable while the index is, so a sorted table keeps its rows until the titles change.
  const jobTitle = useCallback(
    (job: Pick<SpaceJob, 'code' | 'title'>) => roleTitle(index, job.code, job.title),
    [index]
  )
  return { t, skillName, jobTitle }
}

/**
 * A job other than the user's that no answer reaches: every level "not asked yet", so its fit of 0 is no estimate.
 * Never in Look Around, which has no fit at all.
 */
export const hasNoEstimate = (job: Pick<SpaceJob, 'kind' | 'fit' | 'fitEstimated'>) =>
  job.fit !== null && job.kind !== 'yours' && !job.fitEstimated

/** The O*NET release behind the Job Zones as the Source Reference numbered `n`. */
const zoneSourceRef = (model: Pick<SpaceModel, 'zoneSource'>, n: number): SourceRef => ({
  n,
  name: model.zoneSource.source_name,
  detail: `${model.zoneSource.geo_or_layer} · ${model.zoneSource.vintage_date}`,
  href: model.zoneSource.source_url
})

/** The "est." after an estimate; `hidden` keeps the space without the mark, so a self-reported fit lines up. */
export function Est({ hidden = false }: { hidden?: boolean }) {
  const t = useText(spaceText)
  if (hidden)
    return (
      <span aria-hidden="true" className="invisible font-mono text-mono-s">
        {' '}
        {t.est}
      </span>
    )
  return (
    <span className="font-mono text-mono-s text-text-muted">
      {' '}
      <span aria-hidden="true">{t.est}</span>
      <span className="sr-only">{t.estimated}</span>
    </span>
  )
}

/** Each verdict's icon, from VerdictChip, and its text colour: Rising green, Declining red, the rest ink. */
export const VERDICT_MARKS: { verdict: Verdict; icon: LucideIcon; tone: string }[] = VerdictSchema.options.map(
  (verdict) => ({
    verdict,
    icon: verdictConfig[verdict.toLowerCase() as VerdictType].icon,
    tone:
      verdict === 'Rising' ? 'text-state-success' : verdict === 'Declining' ? 'text-state-error' : 'text-text-primary'
  })
)

/** A snapshot's dated sources as numbered Source References, [1] first, as the rest of the app shows them. */
const sourceRefs = (snapshot: SpaceSnapshot): SourceRef[] =>
  snapshot.sources.map((source, i) => ({
    n: i + 1,
    name: source.source_name,
    detail: `${source.geo_or_layer} · ${source.vintage_date}`,
    href: source.source_url
  }))

/**
 * The space's numbered sources for a snapshot, the same in the table and the 3D view: the snapshot's own, then the AI
 * usage indexes' release if the snapshot doesn't list it, then, in Look Around, the Job Zones'. `anchorN` and `zoneN`
 * are their numbers, null where there are none.
 */
export function snapshotSources(
  model: Pick<SpaceModel, 'anchors' | 'answers' | 'zoneSource'>,
  snapshot: SpaceSnapshot
) {
  const sources = sourceRefs(snapshot)
  const anchors = model.anchors[snapshot.id]
  let anchorN: number | null = null
  if (anchors) {
    const i = snapshot.sources.findIndex((s) => s.source_url === anchors.sourceUrl && s.vintage_date === anchors.date)
    if (i >= 0) anchorN = i + 1
    else {
      anchorN = sources.length + 1
      sources.push({
        n: anchorN,
        name: anchors.source,
        detail: textNow(spaceText).anchorDetail(anchors.date),
        href: anchors.sourceUrl
      })
    }
  }
  let zoneN: number | null = null
  if (!model.answers) {
    zoneN = sources.length + 1
    sources.push(zoneSourceRef(model, zoneN))
  }
  return { sources, anchorN, zoneN }
}
