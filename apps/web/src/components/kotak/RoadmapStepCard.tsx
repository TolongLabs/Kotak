import { REFRESHER_ID } from '@kotak/shared'
import {
  BadgeCheck,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  Lock,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  Upload
} from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import type { RoadmapStep } from '../../demo/types'
import type { StepProof } from '../../engine/evidence'
import { dateLocale } from '../../i18n/locale'
import { fmt } from '../../views/roadmap/planSupport'
import { Citation } from '../ui/Citation'
import { Spinner } from '../ui/Spinner'
import { SdgTargetChip } from './SdgReasonChip'
import { commonText } from '../../i18n/common'
import { evidenceText } from '../../i18n/messages/evidence'
import { roadmapText } from '../../i18n/messages/roadmap'
import { useText } from '../../i18n/text'

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
  /** A clipped step cannot be proven until the plan window reaches its remaining hours. */
  toggleDisabled?: boolean
  /** How the step stands on proof (#457); leave out for a read-only card. */
  proof?: StepProof
  /** Opens the proof sheet. */
  onProve?: () => void
  /** Removes a proven step's proof and its tick. */
  onUndo?: () => void
  /** Folded, the card keeps its header strip and one line of its statement; printing shows every card in full. */
  open?: boolean
  onToggleOpen?: () => void
}

// On phones the proof action drops below the Next card's yellow strip, so it takes the theme's ink back; on the strip
// itself, a dark-mode yellow focus ring would vanish, so it takes the strip's ink.
const NEXT_DONE_COLOURS =
  '[--color-focus-ring:var(--k-color-accent-on-box)] max-[479px]:[--color-text-primary:var(--k-color-text-primary)] max-[479px]:[--color-text-muted:var(--k-color-text-muted)] max-[479px]:[--color-bg-default:var(--k-color-bg-default)] max-[479px]:[--color-focus-ring:var(--k-color-focus-ring)]'

// Below 480 px the proof action becomes a bar along the card's foot, as the Done tick was.
const PHONE_BAR =
  'max-[479px]:absolute max-[479px]:inset-x-0 max-[479px]:bottom-0 max-[479px]:min-h-11 max-[479px]:rounded-none max-[479px]:border-0 max-[479px]:border-t max-[479px]:border-border-subtle max-[479px]:px-4'

// Prove This Step is always a solid button: ink on the next step's yellow strip, the panel fill on the others.
const PROVE_NEXT =
  'border-[1.5px] border-text-primary bg-text-primary text-bg-default hover:border-text-muted hover:bg-text-muted'
const PROVE_LATER =
  'border-[1.5px] border-border-subtle bg-bg-panel text-text-primary hover:border-border-control hover:bg-bg-default'

// The style of the card's own text buttons, such as Undo; the article's onClick selects the step, so
// these stop the click.
const TEXT_BUTTON_CLASSES =
  'inline-flex min-h-6 items-center rounded-sm text-label-s text-text-primary underline underline-offset-2 hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

/** The completion date the judge read, such as "12 Oct 2026". */
function formatCompletionDate(value: string) {
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${value}T00:00:00Z`))
}

export function RoadmapStepCard({
  step,
  index,
  last,
  totalHours,
  highlighted = false,
  selected = false,
  onSelect,
  stepRef,
  toggleDisabled = false,
  proof,
  onProve,
  onUndo,
  open = true,
  onToggleOpen
}: RoadmapStepCardProps) {
  const t = useText(roadmapText)
  const proofText = useText(evidenceText).card
  const common = useText(commonText)
  // The refresher carries no level, SDG or resource.
  const refresher = step.id === REFRESHER_ID
  const next = step.state === 'next'
  const done = step.state === 'done'
  const hasResource = Boolean(step.resource.href && step.resource.label)
  const [weeksLabel, ...dateParts] = step.when.split(' · ')
  const [firstWeek, lastWeek] = step.weeks
  const weeksName = t.stepCard.weekName(firstWeek, lastWeek)
  // The header names the skill, so the level pill drops the gain's trailing " · <skill>".
  const skillSuffix = ` · ${step.skill}`
  const level = step.gain.endsWith(skillSuffix) ? step.gain.slice(0, -skillSuffix.length) : step.gain
  const statement = step.title || step.skill
  const detailId = `roadmap-step-${step.id}-detail`
  const bodyId = `roadmap-step-${step.id}-body`
  const hoursLabel =
    totalHours !== undefined ? t.stepCard.aboutTotal(fmt(totalHours)) : t.stepCard.perWeek(fmt(step.hoursPerWeek))

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

  // One quiet line under the header strip: what the judge read, or why the step is still open. The header holds the
  // one action, so the line carries no button of its own.
  const stop = (event: { stopPropagation: () => void }) => event.stopPropagation()
  const proofLine = (() => {
    if (!proof) return null
    if (proof.status === 'proven') {
      const { course, provider, completion_date: completed } = proof.evidence
      const parts = [course, provider, completed && proofText.completedOn(formatCompletionDate(completed))]
      return <span className="text-text-muted">{parts.filter(Boolean).join(' · ')}</span>
    }
    if (proof.status === 'unproven') return <span className="text-text-muted">{proofText.notProven}</span>
    if (proof.status !== 'fail' && proof.status !== 'unclear' && proof.status !== 'error') return null
    const [title, body, tone] =
      proof.status === 'fail'
        ? [proofText.failed, proof.reason, 'text-state-error']
        : proof.status === 'unclear'
          ? [proofText.unclear, proof.hint ?? proofText.unclearHint, 'text-state-warning']
          : [proofText.errorTitle, '', 'text-state-error']
    return (
      <>
        <TriangleAlert className={`mt-0.5 h-4 w-4 shrink-0 stroke-current ${tone}`} aria-hidden="true" />
        <span className="min-w-0 text-text-primary">
          {body ? (
            <>
              <span className="sr-only">{title}: </span>
              {body}
            </>
          ) : (
            title
          )}
        </span>
      </>
    )
  })()
  // The header's one action: prove, or try again after a fail, an unclear verdict or an error.
  const actionLabel =
    proof?.status === 'fail'
      ? proofText.tryAnother
      : proof?.status === 'unclear' || proof?.status === 'error'
        ? proofText.tryAgain
        : proofText.prove
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
        className={`relative min-w-0 flex-1 scroll-mt-56 cursor-pointer overflow-hidden rounded-md ${cardBorder} ${proof ? 'max-[479px]:pb-11' : ''} ${
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
                    {refresher ? t.stepCard.refresher : next ? common.next : t.stepCard.later}
                  </span>
                )}
                {dateParts.length > 0 && (
                  <span className="max-[479px]:order-last max-[479px]:basis-full">{dateParts.join(' · ')}</span>
                )}
              </p>
            </div>
          </div>
          {proof?.status === 'proven' && (
            <div
              className={`flex shrink-0 items-center gap-3 text-label-s text-text-primary ${next ? NEXT_DONE_COLOURS : ''} ${PHONE_BAR} max-[479px]:bg-bg-default`}
            >
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 shrink-0 stroke-current text-state-success" aria-hidden="true" />
                {proofText.proven}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  stop(event)
                  onUndo?.()
                }}
                aria-label={proofText.undoLabel(step.skill)}
                className={`${TEXT_BUTTON_CLASSES} max-[479px]:min-h-11`}
              >
                {proofText.undo}
              </button>
            </div>
          )}
          {proof?.status === 'judging' && (
            <div
              className={`flex shrink-0 items-center gap-2 text-label-s text-text-primary ${next ? NEXT_DONE_COLOURS : ''} ${PHONE_BAR} max-[479px]:bg-bg-default`}
            >
              <Spinner size="sm" label={proofText.judging} />
              {proofText.judging}
            </div>
          )}
          {proof && proof.status !== 'proven' && proof.status !== 'judging' && (
            <button
              type="button"
              disabled={toggleDisabled}
              title={toggleDisabled ? proofText.lockedLabel : undefined}
              onClick={(event) => {
                stop(event)
                onProve?.()
              }}
              className={`inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-sm px-3 text-label-s transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-panel disabled:text-text-muted ${
                next ? `${PROVE_NEXT} ${NEXT_DONE_COLOURS}` : PROVE_LATER
              } ${PHONE_BAR}`}
            >
              {toggleDisabled ? (
                <Lock className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
              ) : (
                <Upload className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
              )}
              {actionLabel}
              <span className="sr-only">
                {toggleDisabled ? `. ${proofText.lockedLabel}` : ` · ${step.skill}, ${weeksName}`}
              </span>
            </button>
          )}
          {onToggleOpen && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={bodyId}
              aria-label={open ? t.stepCard.foldStep(step.skill) : t.stepCard.openStep(step.skill)}
              onClick={(event) => {
                event.stopPropagation()
                onToggleOpen()
              }}
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-text-primary hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${next ? NEXT_DONE_COLOURS : ''}`}
            >
              <ChevronDown
                className={`h-4 w-4 stroke-current transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        {proofLine && (
          <p className="flex items-start gap-2 px-4 pt-2.5 text-body-s [overflow-wrap:anywhere] max-[479px]:px-3.5">
            {proofLine}
          </p>
        )}

        {!open && (
          <p className="flex items-center justify-between gap-3 px-4 py-2.5 text-body-s text-text-muted max-[479px]:px-3.5 print:hidden">
            <span className="line-clamp-1 min-w-0">{statement}</span>
            <span className="shrink-0 font-mono text-mono-s">{hoursLabel}</span>
          </p>
        )}

        {/* Folded bodies stay in the page, so Export as PDF prints every step in full. */}
        <div
          id={bodyId}
          className={`space-y-3 px-4 pb-4 pt-3.5 max-[479px]:px-3.5 print:block ${open ? '' : 'hidden'}`}
        >
          <div className="space-y-1">
            <div id={detailId} className="space-y-1">
              <h3
                ref={statementRef}
                id={`roadmap-step-${step.id}`}
                className={`text-title-s text-text-primary [overflow-wrap:anywhere] print:line-clamp-none ${expanded ? '' : 'line-clamp-4'}`}
              >
                {statement}
              </h3>
              {step.description && (
                <p
                  ref={descriptionRef}
                  className={`text-body-s text-text-muted [overflow-wrap:anywhere] print:line-clamp-none ${expanded ? '' : 'line-clamp-3'}`}
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
                className="inline-flex min-h-6 items-center rounded-sm text-label-s text-text-primary underline underline-offset-2 hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring print:hidden"
              >
                {expanded ? t.stepCard.showLess : t.stepCard.showMore}
              </button>
            )}
          </div>

          <dl className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
            <div className="flex items-center">
              <dt className="sr-only">{t.stepCard.time}</dt>
              <dd className="inline-flex items-center gap-1.5 text-label-s text-text-primary">
                <Clock3 className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
                {hoursLabel}
              </dd>
            </div>
            {!refresher && level && (
              <div className="flex min-w-0 items-center">
                <dt className="sr-only">{t.stepCard.builds}</dt>
                <dd className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border-control px-2.5 py-0.5 text-label-s text-text-primary">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 stroke-current" aria-hidden="true" />
                  <span className="min-w-0 [overflow-wrap:anywhere]">{level}</span>
                </dd>
              </div>
            )}
            {(step.sdgTargets ?? []).length > 0 && (
              <div className="flex items-center">
                <dt className="sr-only">{t.stepCard.sdgTargets}</dt>
                <dd className="flex flex-wrap gap-2">
                  {step.sdgTargets!.map((target) => (
                    <SdgTargetChip key={target} target={target} />
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
                <span className="sr-only">{t.stepCard.opensInNewTab}</span>
              </a>
              <p className="flex flex-wrap items-center gap-x-2 text-label-s text-text-muted">
                {step.resource.kind === 'search' ? t.timeline.searchSuggestion : t.timeline.free}
                {step.resource.citation !== undefined && <Citation n={step.resource.citation} />}
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
