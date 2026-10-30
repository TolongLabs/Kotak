import { VerdictSchema, type Verdict } from '@kotak/shared'
import type { LucideIcon } from 'lucide-react'
import { verdictConfig, type VerdictType } from '../../components/ui/VerdictChip'
import type { SourceRef } from '../../demo/types'
import type { SpaceJob, SpaceModel, SpaceSnapshot } from './model'

// The space's shared wording and marks, so its table and its 3D view say every number the same way.

const percent = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  maximumFractionDigits: 0,
  signDisplay: 'exceptZero'
})

/** A 12-month change in AI use, signed and whole: 0.42 is "+42%". */
export const formatChange = (change: number) => percent.format(change)

const index = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** An AI usage index to 2 decimals, the data's own precision: 0.8 is "0.80". */
export const formatIndex = (value: number) => index.format(value)

/** What a job's fit says when no answer reaches its skills (hasNoEstimate), as the job card says it. */
export const NO_ESTIMATE = 'No estimate yet'

/**
 * A job other than the user's that no answer reaches: every level "not asked yet", so its fit of 0 is no estimate.
 * Never in Look Around, which has no fit at all.
 */
export const hasNoEstimate = (job: Pick<SpaceJob, 'kind' | 'fit' | 'fitEstimated'>) =>
  job.fit !== null && job.kind !== 'yours' && !job.fitEstimated

/**
 * Each O*NET Job Zone's preparation, shortened from O*NET's own names ("Job Zone One: Little or No Preparation
 * Needed"), in sentence case. Source: O*NET 30.1 Job Zone Reference,
 * https://www.onetcenter.org/dictionary/30.1/excel/job_zone_reference.html (read 30 October 2026).
 */
export const ZONE_LABEL: Record<SpaceJob['zone'], string> = {
  1: 'Little or no preparation',
  2: 'Some preparation',
  3: 'Medium preparation',
  4: 'Considerable preparation',
  5: 'Extensive preparation'
}

/** The O*NET release behind the Job Zones as the Source Reference numbered `n`. */
const zoneSourceRef = (model: Pick<SpaceModel, 'zoneSource'>, n: number): SourceRef => ({
  n,
  name: model.zoneSource.source_name,
  detail: `${model.zoneSource.geo_or_layer} · ${model.zoneSource.vintage_date}`,
  href: model.zoneSource.source_url
})

/** The "est." after an estimate; `hidden` keeps the space without the mark, so a self-reported fit lines up. */
export function Est({ hidden = false }: { hidden?: boolean }) {
  if (hidden)
    return (
      <span aria-hidden="true" className="invisible font-mono text-mono-s">
        {' '}
        est.
      </span>
    )
  return (
    <span className="font-mono text-mono-s text-text-muted">
      {' '}
      <span aria-hidden="true">est.</span>
      <span className="sr-only">estimated</span>
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
        detail: `MYS and SGP · ${anchors.date}`,
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
