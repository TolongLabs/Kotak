import { REFRESHER_ID } from '@kotak/shared'
import { BookOpen, Check, Clock3, ExternalLink, Lock, RefreshCw, Sparkles } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import type { RoadmapStep } from '../../demo/types'
import { fmt } from '../../views/roadmap/planSupport'
import { Citation } from '../ui/Citation'
import { SdgChip } from '../ui/SdgChip'

export interface RoadmapStepCardProps {
  step: RoadmapStep
  index: number
  last: boolean
  /** The step's own hours, as the timeline counts them; leave out to show the hours a week. */
  totalHours?: number
  highlighted?: boolean
  selected?: boolean
  onSelect?: () => void
  stepRef?: (element: HTMLElement | null) => void
  /** Shows the Done tick in the header strip; leave out for a read-only card. */
  onToggle?: (checked: boolean) => void
  /** A clipped step cannot be ticked. */
  toggleDisabled?: boolean
}

// On phones the Done tick drops below the Next card's yellow strip, so it takes the theme's ink back; on the strip
// itself, a dark-mode yellow focus ring would vanish, so it takes the strip's ink.
const NEXT_DONE_COLOURS =
  '[--color-focus-ring:var(--k-color-accent-on-box)] max-[479px]:[--color-text-primary:var(--k-color-text-primary)] max-[479px]:[--color-text-muted:var(--k-color-text-muted)] max-[479px]:[--color-bg-default:var(--k-color-bg-default)] max-[479px]:[--color-focus-ring:var(--k-color-focus-ring)]'

export function RoadmapStepCard({
  step,
  index,
  last,
  totalHours,
  highlighted = false,
  selected = false,
  onSelect,
  stepRef,
  onToggle,
  toggleDisabled = false
}: RoadmapStepCardProps) {
  // The refresher carries no level, SDG or resource.
  const refresher = step.id === REFRESHER_ID
  const next = step.state === 'next'
  const done = step.state === 'done'
  const hasResource = Boolean(step.resource.href && step.resource.label)
  const [weeksLabel, ...dateParts] = step.when.split(' · ')
  const [firstWeek, lastWeek] = step.weeks
  const weeksName = firstWeek === lastWeek ? `week ${firstWeek}` : `weeks ${firstWeek} to ${lastWeek}`
  // The header names the skill, so the level pill drops the gain's trailing " · <skill>".
  const skillSuffix = ` · ${step.skill}`
  const level = step.gain.endsWith(skillSuffix) ? step.gain.slice(0, -skillSuffix.length) : step.gain
  const statement = step.title || step.skill
  const detailId = `roadmap-step-${step.id}-detail`

  // Long statements fold to a few lines behind Show More; measured while folded, so the toggle stays once opened.
  const statementRef = useRef<HTMLHeadingElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [foldable, setFoldable] = useState(false)
  useLayoutEffect(() => {
    if (expanded) return
    const elements = [statementRef.current, descriptionRef.current].filter((element) => element !== null)
    const measure = () => setFoldable(elements.some((element) => element.scrollHeight > element.clientHeight + 1))
    measure()
    const observer = new ResizeObserver(measure)
    for (const element of elements) observer.observe(element)
    return () => observer.disconnect()
  }, [expanded, statement, step.description])

  const cardBorder =
    refresher || step.conditional
      ? 'border-[1.5px] border-dashed border-border-control bg-bg-panel'
      : next
        ? 'border-[1.5px] border-text-primary bg-bg-default'
        : done
          ? 'border border-state-success bg-bg-default'
          : 'border border-border-subtle bg-bg-default'

  const renderNode = (extra: string) => (
    <span
      className={`${extra} h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] font-mono text-mono-s ${
        done
          ? 'border-state-success bg-state-success text-bg-default'
          : next
            ? 'on-accent border-text-primary bg-accent-box text-text-primary'
            : refresher
              ? 'border-dashed border-text-primary bg-bg-default text-text-primary'
              : 'border-border-control bg-bg-default text-text-primary'
      }`}
      aria-hidden="true"
    >
      {done ? (
        <Check className="h-4 w-4 stroke-current" />
      ) : refresher ? (
        <RefreshCw className="h-4 w-4 stroke-current" />
      ) : (
        index + 1
      )}
    </span>
  )

  return (
    <div className={`relative flex gap-3 sm:gap-4 max-[479px]:gap-0 ${last ? '' : 'pb-3'}`}>
      <div className="relative flex w-7 shrink-0 justify-center max-[479px]:hidden">
        {!last && <span className="absolute bottom-0 top-7 w-px bg-border-subtle" aria-hidden="true" />}
        {renderNode('relative z-10 inline-flex')}
      </div>

      <article
        ref={stepRef}
        aria-labelledby={`roadmap-step-${step.id}`}
        aria-current={selected ? 'true' : undefined}
        onClick={onSelect}
        className={`relative min-w-0 flex-1 cursor-pointer overflow-hidden rounded-md ${cardBorder} ${onToggle ? 'max-[479px]:pb-11' : ''} ${
          highlighted ? 'ring-2 ring-offset-2 ring-offset-bg-default ring-text-primary' : ''
        } ${selected ? 'outline outline-2 outline-offset-2 outline-text-primary' : ''}`}
      >
        <div
          className={`flex items-center justify-between gap-3 border-b px-4 py-2.5 ${
            next ? 'on-accent border-text-primary bg-accent-box' : 'border-border-subtle'
          }`}
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {renderNode('hidden max-[479px]:inline-flex')}
            <div className="min-w-0 flex-1 space-y-0.5">
              {step.skill !== statement && (
                <p className="text-label-m text-text-primary [overflow-wrap:anywhere]">{step.skill}</p>
              )}
              <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-mono-s text-text-muted">
                <b className="font-medium text-text-primary max-[479px]:font-sans max-[479px]:font-semibold">
                  {weeksLabel}
                </b>
                {(next || refresher || step.state === 'todo') && (
                  <span
                    className={`max-[479px]:ml-auto max-[479px]:rounded-full max-[479px]:border max-[479px]:border-text-primary max-[479px]:px-2 max-[479px]:text-text-primary ${
                      next || refresher ? '' : 'hidden max-[479px]:inline'
                    }`}
                  >
                    {refresher ? 'Refresher' : next ? 'Next' : 'Later'}
                  </span>
                )}
                {dateParts.length > 0 && (
                  <span className="max-[479px]:order-last max-[479px]:basis-full">{dateParts.join(' · ')}</span>
                )}
              </p>
            </div>
          </div>
          {onToggle && (
            <label
              onClick={(event) => event.stopPropagation()}
              className={`${toggleDisabled ? 'cursor-not-allowed text-text-muted' : 'cursor-pointer text-text-primary'} ${next ? NEXT_DONE_COLOURS : ''} relative inline-flex min-h-6 shrink-0 items-center gap-2 text-label-s max-[479px]:absolute max-[479px]:inset-x-0 max-[479px]:bottom-0 max-[479px]:min-h-11 max-[479px]:border-t max-[479px]:border-border-subtle max-[479px]:px-4`}
            >
              <input
                type="checkbox"
                disabled={toggleDisabled}
                checked={done}
                aria-label={`Done: ${step.skill}, ${weeksName}`}
                onChange={(event) => onToggle(event.currentTarget.checked)}
                className="peer absolute inset-0 h-full w-full cursor-[inherit] opacity-0"
              />
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-sm border-[1.5px] border-border-control bg-bg-default text-bg-default peer-disabled:border-text-muted peer-checked:border-state-success peer-checked:bg-state-success peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring"
                aria-hidden="true"
              >
                <Check className="h-3.5 w-3.5 stroke-current" />
              </span>
              Done
              {toggleDisabled && <Lock className="h-3.5 w-3.5 stroke-current" aria-hidden="true" />}
            </label>
          )}
        </div>

        <div className="space-y-3 px-4 pb-4 pt-3.5 max-[479px]:px-3.5">
          <div className="space-y-1">
            <div id={detailId} className="space-y-1">
              <h3
                ref={statementRef}
                id={`roadmap-step-${step.id}`}
                className={`text-title-s text-text-primary [overflow-wrap:anywhere] ${expanded ? '' : 'line-clamp-4'}`}
              >
                {statement}
              </h3>
              {step.description && (
                <p
                  ref={descriptionRef}
                  className={`text-body-s text-text-muted [overflow-wrap:anywhere] ${expanded ? '' : 'line-clamp-3'}`}
                >
                  {step.description}
                </p>
              )}
            </div>
            {foldable && (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={detailId}
                onClick={(event) => {
                  event.stopPropagation()
                  setExpanded(!expanded)
                }}
                className="inline-flex min-h-6 items-center rounded-sm text-label-s text-text-primary underline underline-offset-2 hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {expanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>

          <dl className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
            <div className="flex items-center">
              <dt className="sr-only">Time</dt>
              <dd className="inline-flex items-center gap-1.5 text-label-s text-text-primary">
                <Clock3 className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
                {totalHours !== undefined ? `About ${fmt(totalHours)} h total` : `${fmt(step.hoursPerWeek)} h a week`}
              </dd>
            </div>
            {!refresher && level && (
              <div className="flex min-w-0 items-center">
                <dt className="sr-only">Builds</dt>
                <dd className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border-control px-2.5 py-0.5 text-label-s text-text-primary">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 stroke-current" aria-hidden="true" />
                  <span className="min-w-0 [overflow-wrap:anywhere]">{level}</span>
                </dd>
              </div>
            )}
            {step.sdgs.length > 0 && (
              <div className="flex items-center">
                <dt className="sr-only">Goals</dt>
                <dd className="flex flex-wrap gap-2">
                  {step.sdgs.map((goal) => (
                    <SdgChip key={goal} goal={goal} />
                  ))}
                </dd>
              </div>
            )}
          </dl>

          {hasResource && (
            <div className="space-y-1">
              <a
                href={step.resource.href}
                target="_blank"
                rel="noreferrer noopener"
                className="flex min-h-11 w-full items-start gap-2 rounded-sm border-[1.5px] border-text-primary bg-bg-default px-3 py-2.5 text-label-m text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{step.resource.label}</span>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <p className="flex flex-wrap items-center gap-x-2 text-label-s text-text-muted">
                {step.resource.kind === 'search' ? 'Search suggestion, not checked' : 'Free'}
                {step.resource.citation !== undefined && <Citation n={step.resource.citation} />}
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
