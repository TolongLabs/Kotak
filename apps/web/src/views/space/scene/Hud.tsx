import type { Scenario, SnapshotId } from '@kotak/shared'
import { ArrowLeft, ArrowRight, ExternalLink, X } from 'lucide-react'
import { Fragment, useCallback, useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'
import type { SourceRef } from '../../../demo/types'
import { Link } from '../../../app/router'
import { jobPath, routes } from '../../../app/routes'
import { ButtonLink } from '../../../components/ui/Button'
import { citationClassName } from '../../../components/ui/Citation'
import { cn } from '../../../components/ui/cn'
import { IconButton } from '../../../components/ui/IconButton'
import { Kbd, KbdGroup } from '../../../components/ui/Kbd'
import { Modal } from '../../../components/ui/Modal'
import { formatFitPercent } from '../../roles/fit'
import { formatChange, hasNoEstimate, NO_ESTIMATE, snapshotSources, VERDICT_MARKS, ZONE_LABEL } from '../format'
import type { CheckUpLink, SpaceJob, SpaceModel } from '../model'
import { ringLabels } from './layout'
import { Ruler } from './Ruler'
import { Switcher } from './Switcher'
import { usePhoneLayout } from './usePhoneLayout'
import type { HudBoxes } from './World'

// The HTML over the canvas, an editorial HUD: the world's name and one line top left, plain links and Back to Dashboard
// top right, Malaysia's AI usage index as a ruler down the right edge, the corner numbers bottom left, and the future's
// two words above the month bottom right, leaving the foot's middle to the box; a phone stacks it all above and below
// the scene, the ruler lying flat at the foot. All of it is type and lines straight on the render, with nothing behind
// it: the scene keeps its bright parts away from where the HUD sits. Numbers swap at once on a switch; only shapes move.

export const WORLD_NAME: Record<Scenario, string> = { slow: 'Slow AI Uptake', fast: 'Fast AI Uptake' }
const WORLD_LINE: Record<Scenario, string> = {
  slow: 'Malaysia keeps today’s AI pace.',
  fast: 'Malaysia’s AI usage index moves halfway to Singapore’s.'
}

/** What a snapshot can say about AI use: one dated point per skill (no trend) or two. */
export function monthNote(model: SpaceModel, snapshotId: SnapshotId): string {
  const known = model.medianGrowth[snapshotId].slow !== null || model.medianGrowth[snapshotId].fast !== null
  return known
    ? 'Two dated points: a trend for every skill.'
    : 'Unknown: one dated point per skill, so Kotak won’t guess.'
}

/** A numbered citation that opens the Sources popover; a button, since it opens a panel here rather than a page. */
function cite(n: number, onCite: (n: number) => void) {
  return (
    <button
      key={n}
      type="button"
      aria-label={`Source ${n}`}
      aria-haspopup="dialog"
      onClick={() => onCite(n)}
      className={cn(citationClassName(true), 'pointer-events-auto touch-manipulation')}
    >
      [{n}]
    </button>
  )
}

/** Kotak's name kept whole by page translators. */
function brand(text: string): ReactNode {
  return text.split(/(Kotak)/).map((part, i) =>
    part === 'Kotak' ? (
      <span key={i} translate="no">
        Kotak
      </span>
    ) : (
      part
    )
  )
}

/** A plain text action with its key beside it, for the top right. */
function HudLink({ keys, onClick, children }: { keys: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-keyshortcuts={keys}
      onClick={onClick}
      className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-sm text-label-m text-text-primary underline decoration-border-control underline-offset-4 transition-colors duration-150 ease-out hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      {children}
      <Kbd bare className="not-any-pointer-fine:hidden">
        {keys}
      </Kbd>
    </button>
  )
}

interface CardProps {
  model: SpaceModel
  job: SpaceJob
  scenario: Scenario
  snapshotId: SnapshotId
  onCite: (n: number) => void
  onClose: () => void
  closeLabel: string
  /**
   * 'full' docks under the title on a tall screen; 'compact', about 140 px tall, docks there on a shorter one or opens
   * along the foot of a phone; 'line' takes the title's place on a short landscape screen, in as few lines as the dark
   * sky there holds.
   */
  form?: 'full' | 'compact' | 'line'
  className?: string
  style?: CSSProperties
}

/** One job's card: fit (or its Job Zone in Look Around) and AI-use change in both futures, its verdicts, borrowed
 * data, source, and its page. */
export function JobCard({
  model,
  job,
  scenario,
  snapshotId,
  onCite,
  onClose,
  closeLabel,
  form = 'full',
  className,
  style
}: CardProps) {
  const compact = form === 'compact'
  const snapshot = model.snapshots.find((s) => s.id === snapshotId)!
  const { anchorN, zoneN } = snapshotSources(model, snapshot)
  const anchors = model.anchors[snapshot.id]
  const noEstimate = hasNoEstimate(job)
  const borrowed = job.skills.filter((skill) => skill.borrowed[snapshotId]).length
  const counts = job.verdicts[snapshotId][scenario]
  const shown = VERDICT_MARKS.filter(({ verdict }) => counts[verdict] > 0)
  const futures: Scenario[] = ['slow', 'fast']
  // Both forms share their rows and lines; the short form packs them tighter, and each of its lines hugs its text, so
  // the card covers no more of the render than its type does.
  const pad = compact ? undefined : 'py-1.5'
  const cell = (s: Scenario) =>
    cn('whitespace-nowrap pl-4 text-right align-top', pad, s === scenario ? 'text-text-primary' : 'text-text-muted')
  const rowHead = cn('pr-2 text-left align-top font-sans text-label-m text-text-primary', pad)
  const headCell = compact ? 'pb-0.5' : 'pb-1 pt-2.5'
  const close = (
    <IconButton
      label={closeLabel}
      icon={X}
      variant="bare"
      tooltip={false}
      className={form === 'full' ? '-mr-2 -mt-2' : '-my-3 -mr-2'}
      onClick={onClose}
    />
  )

  // Fit (or, in the short form, the Job Zone) and the AI-use change, in both futures, the one on show in ink.
  const numbers = (
    <table className={cn('w-full', !compact && 'border-t border-border-subtle')}>
      <caption className="sr-only">
        {job.fit === null ? 'AI-use change in both AI futures' : 'Fit and AI-use change in both AI futures'}
      </caption>
      <thead>
        <tr className="text-label-s text-text-muted">
          <th scope="col" className={cn('text-left font-medium', headCell)}>
            <span className="sr-only">Measure</span>
            {/* The short form names the group here, the full one under its title. */}
            {compact && (
              <span aria-hidden="true" className="inline-flex items-center gap-1.5">
                {job.kind === 'yours' && (
                  <span className="size-2.5 rounded-full border border-text-primary bg-accent-box" />
                )}
                {job.kind === 'related' && <span className="size-2.5 rounded-full bg-map-suggested" />}
                {job.kind === 'yours' && <span className="text-text-primary">Your Job ·</span>}
                {job.kind === 'related' && 'Related ·'} {job.groupName}
              </span>
            )}
          </th>
          {futures.map((s) => (
            <th
              key={s}
              scope="col"
              className={cn('pl-4 text-right font-medium', headCell, s === scenario && 'text-text-primary')}
            >
              {s === 'slow' ? 'Slow' : 'Fast'}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="font-mono text-mono-m">
        {job.fit === null ? (
          compact && (
            <tr>
              <th scope="row" className={rowHead}>
                Job Zone
              </th>
              <td colSpan={2} className="whitespace-nowrap text-right font-sans text-label-m text-text-primary">
                {job.zone}: {ZONE_LABEL[job.zone].toLowerCase()} {zoneN !== null && cite(zoneN, onCite)}
              </td>
            </tr>
          )
        ) : (
          <tr>
            <th scope="row" className={rowHead}>
              {job.kind === 'yours' || noEstimate ? 'Fit' : 'Fit (est.)'}
            </th>
            {noEstimate ? (
              <td colSpan={2} className={cn('text-right font-sans text-label-m text-text-muted', pad)}>
                {NO_ESTIMATE}
              </td>
            ) : (
              futures.map((s) => (
                <td key={s} className={cell(s)}>
                  {formatFitPercent(job.fit![snapshotId][s])}
                </td>
              ))
            )}
          </tr>
        )}
        <tr>
          <th scope="row" className={rowHead}>
            AI use, 12-month change (est.){compact && ' '}
            <span className={cn('text-label-s font-medium text-text-muted', !compact && 'block')}>
              {compact ? 'median skill' : 'Median skill'}
            </span>
          </th>
          {futures.map((s) => {
            const change = job.growth[snapshotId][s]
            return (
              <td key={s} className={cell(s)}>
                {change === null ? 'Unknown' : formatChange(change)}
              </td>
            )
          })}
        </tr>
      </tbody>
    </table>
  )
  const marks = (
    <>
      <span aria-hidden="true" className="inline-flex gap-2.5 align-[-2px] font-mono text-mono-s">
        {shown.map(({ verdict, icon: Icon, tone }) => (
          <span key={verdict} className={cn('inline-flex items-center gap-0.5', tone)}>
            <Icon className="size-3.5 shrink-0 stroke-current" />
            {counts[verdict]}
          </span>
        ))}
      </span>
      <span className="sr-only">{shown.map(({ verdict }) => `${counts[verdict]} ${verdict}`).join(', ')}</span>
    </>
  )
  const verdictsLabel = `Skill verdicts, ${scenario === 'slow' ? 'Slow' : 'Fast'}:`
  const borrowedText = borrowed > 0 && `AI-use data borrowed for ${borrowed} of ${job.skills.length} skills`
  // The data's month and its source's full name, wrapping; its last word keeps the citation on its line.
  const words = anchors?.source.split(' ') ?? []
  const sourceText = anchors && anchorN !== null && (
    <span className="font-mono text-mono-s">
      {snapshot.label} data · {words.slice(0, -1).join(' ')}{' '}
      <span className="whitespace-nowrap">
        {words.at(-1)} {cite(anchorN, onCite)}
      </span>
    </span>
  )

  // The line form: the title, which links to the job's page, cut short if it must be; the group, which gives way first
  // on a screen too short for it; one row of both futures' numbers, the live one in ink; then the verdicts and the
  // source.
  if (form === 'line') {
    const pair = (values: (number | null)[], format: (v: number) => string) =>
      futures.map((s, i) => (
        <Fragment key={s}>
          {i > 0 && '/'}
          <span className={s === scenario ? 'text-text-primary' : undefined}>
            {values[i] === null ? 'Unknown' : format(values[i]!)}
          </span>
        </Fragment>
      ))
    const fitValues = job.fit && futures.map((s) => job.fit![snapshotId][s])
    const changes = futures.map((s) => job.growth[snapshotId][s])
    return (
      <section
        aria-label={`${job.title}, job card`}
        className={cn('flex w-[min(18rem,34vw)] flex-col gap-0.5 text-text-primary', className)}
        style={style}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 text-label-l text-text-primary">
            <Link
              to={jobPath(job.code)}
              title={job.title}
              className="block truncate rounded-sm underline decoration-current underline-offset-2 hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {job.title}
              <span className="sr-only">: Open the Job Page</span>
            </Link>
            <span className="sr-only">
              , {job.kind === 'yours' ? 'your job, ' : job.kind === 'related' ? 'related, ' : ''}
              {job.groupName}
            </span>
          </h2>
          {close}
        </div>
        <p aria-hidden="true" className="truncate text-label-s text-text-muted [@media(max-height:410px)]:hidden">
          {job.kind === 'yours' && 'Your Job · '}
          {job.kind === 'related' && 'Related · '}
          {job.groupName}
        </p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-label-s text-text-muted">
          <span aria-hidden="true" className="contents">
            {fitValues ? (
              <>
                Fit, Slow/Fast
                <span className="font-mono text-mono-s">
                  {noEstimate ? NO_ESTIMATE : pair(fitValues, formatFitPercent)}
                </span>
                · AI use
              </>
            ) : (
              <>
                Job Zone {job.zone}
                {zoneN !== null && cite(zoneN, onCite)}· AI use, Slow/Fast
              </>
            )}
            <span className="font-mono text-mono-s">{pair(changes, formatChange)}</span>
          </span>
          <span className="sr-only">
            {fitValues &&
              (noEstimate
                ? `Fit: ${NO_ESTIMATE}. `
                : `Fit${job.kind === 'yours' ? '' : ' (est.)'}: ${formatFitPercent(fitValues[0]!)} in Slow AI Uptake, ${formatFitPercent(fitValues[1]!)} in Fast. `)}
            {!fitValues && `Job Zone ${job.zone}: ${ZONE_LABEL[job.zone].toLowerCase()}. `}
            AI use, 12-month change (est.), median skill:{' '}
            {changes
              .map(
                (c, i) =>
                  `${c === null ? 'Unknown' : formatChange(c)} in ${futures[i] === 'slow' ? 'Slow AI Uptake' : 'Fast'}`
              )
              .join(', ')}
            .{borrowedText && ` ${borrowedText}.`}
          </span>
        </p>
        <p className="text-label-s text-text-muted">
          <span className="sr-only">{verdictsLabel} </span>
          {marks}
          {sourceText && <> · {sourceText}</>}
        </p>
      </section>
    )
  }

  // The short form: the title, which links to the job's page, then the numbers under a line naming the group, the
  // verdicts and the source.
  if (compact)
    return (
      <section
        aria-label={`${job.title}, job card`}
        className={cn(
          'flex max-h-full w-[26rem] max-w-[calc(100vw-1.5rem)] flex-col gap-0.5 overflow-y-auto overscroll-contain text-text-primary',
          className
        )}
        style={style}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-balance text-label-l text-text-primary">
            <Link
              to={jobPath(job.code)}
              className="rounded-sm underline decoration-current underline-offset-2 hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {job.title}
              <span className="sr-only">: Open the Job Page</span>
              <ArrowRight className="ml-1 inline size-4 stroke-current align-[-2px]" aria-hidden="true" />
            </Link>
            <span className="sr-only">
              , {job.kind === 'yours' ? 'your job, ' : job.kind === 'related' ? 'related, ' : ''}
              {job.groupName}
            </span>
          </h2>
          {close}
        </div>
        {numbers}
        {/* The rest runs on as one paragraph, so the short form stays in the dark sky above the horizon. */}
        <p className="w-fit text-label-s text-text-muted">
          {verdictsLabel} {marks}
          {borrowedText && ` · ${borrowedText}`}
          {sourceText && <> · {sourceText}</>}
        </p>
      </section>
    )

  return (
    <section
      aria-label={`${job.title}, job card`}
      className={cn(
        'flex max-h-full w-[22rem] max-w-[calc(100vw-1.5rem)] flex-col gap-3 overflow-y-auto overscroll-contain text-text-primary',
        className
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {job.kind === 'yours' && (
            <span className="inline-flex items-center gap-1.5 text-label-s text-text-primary">
              <span aria-hidden="true" className="size-2.5 rounded-full border border-text-primary bg-accent-box" />
              Your Job
            </span>
          )}
          {job.kind === 'related' && (
            <span className="inline-flex items-center gap-1.5 text-label-s text-text-muted">
              <span aria-hidden="true" className="size-2.5 rounded-full bg-map-suggested" />
              Related
            </span>
          )}
          <h2 className="text-balance text-title-s text-text-primary">{job.title}</h2>
          <p className="text-body-s text-text-muted">{job.groupName}</p>
          {job.fit === null && (
            <p className="flex flex-wrap items-center gap-1.5 text-body-s text-text-primary">
              Job Zone {job.zone}: {ZONE_LABEL[job.zone].toLowerCase()}
              {zoneN !== null && cite(zoneN, onCite)}
            </p>
          )}
        </div>
        {close}
      </div>
      {numbers}
      <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-label-s text-text-muted">
          {verdictsLabel}
          {marks}
        </p>
        {borrowedText && <p className="text-label-s text-text-muted">{borrowedText}</p>}
        {sourceText && <p className="text-text-muted">{sourceText}</p>}
      </div>
      <Link
        to={jobPath(job.code)}
        className="-mb-2 inline-flex min-h-11 items-center gap-1.5 self-start rounded-sm text-label-m text-text-primary underline decoration-current underline-offset-2 hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        Open the Job Page
        <ArrowRight className="size-4 stroke-current" aria-hidden="true" />
      </Link>
    </section>
  )
}

export function HowToRead({ open, onClose, model }: { open: boolean; onClose: () => void; model: SpaceModel }) {
  const rings = ringLabels(model)
  const strong = 'font-semibold'
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How to Read the Space"
      closeTooltip={false}
      closeVariant="bare"
      backdrop="none"
      body="scroll"
      widthClass="w-[min(38rem,calc(100vw-2rem))]"
    >
      <div className="flex flex-col gap-5 text-body-s">
        <ul className="flex list-none flex-col gap-3">
          <li>
            <strong className={strong}>Each tuft is one job</strong>, {model.jobs.length} in all, and each blade is one
            of its skills.
          </li>
          {model.answers ? (
            <li>
              <strong className={strong}>Distance from the box</strong> is 100 minus your fit: the nearer a job, the
              more of its needed levels your answers already meet. The rings mark {rings.join(', ')}. Hollow tufts at
              the far edge are jobs no answer reaches, so they have no estimate yet.
            </li>
          ) : (
            <li>
              <strong className={strong}>Distance from the box</strong> is the job’s O*NET Job Zone, 1 to 5: how much
              preparation it needs, from Job Zone 1 ({ZONE_LABEL[1].toLowerCase()}), nearest, to Job Zone 5 (
              {ZONE_LABEL[5].toLowerCase()}), farthest. Each zone is a band with a ring at its inner edge. There are no
              answers yet; take the check-up and distance becomes your fit instead.
            </li>
          )}
          <li>
            <strong className={strong}>The angle</strong> is the job’s SOC major group.{' '}
            {model.answers
              ? 'Within a group, jobs sit in alphabetical order.'
              : 'Within a group and a zone, jobs sit in alphabetical order in columns, from left to right, each column running from the box outward.'}{' '}
            It means only the group.
          </li>
          <li>
            <strong className={strong}>A blade’s height</strong> is that skill’s AI use, 12-month change (est.). The
            base height is no change. Rising AI use climbs on a log scale: each doubling adds the same height. Falling
            use shrinks in a straight line, from the base height at 0% to a short stub at −100%.
          </li>
          <li>
            <strong className={strong}>Colour:</strong>{' '}
            {model.answers ? (
              <>
                yellow is your job, blue the related roles <span translate="no">Kotak</span> ranks against it, warm
                light every other job.
              </>
            ) : (
              'every job is warm light, since there is no job of yours yet.'
            )}{' '}
            Grey blades are Unknown: one dated point, so <span translate="no">Kotak</span> won’t guess.
          </li>
          <li>
            <strong className={strong}>The ring</strong> stands at Malaysia’s AI usage index. In Fast AI Uptake it rises
            halfway to Singapore’s. The ruler reads the same index in numbers, Singapore’s too.
          </li>
          <li>
            <strong className={strong}>Atmosphere:</strong> the sky, haze, glow, dust and the ground’s shimmer are not
            data.
          </li>
        </ul>
        <section aria-labelledby="space-camera" className="flex flex-col gap-2 border-t border-border-subtle pt-4">
          <h3 id="space-camera" className="text-label-m text-text-primary">
            Moving Around
          </h3>
          <ul className="flex list-none flex-col gap-1.5">
            <li>Drag (one finger on touch) to look around the field; the horizon stays ahead.</li>
            <li>Scroll or pinch to zoom.</li>
            <li>Right-drag, Shift-drag or a two-finger drag pans along the ground.</li>
            <li>Double-click or double-tap a tuft to fly to it and pin its card.</li>
            <li>
              <Kbd aria-hidden={false}>R</Kbd> flies back to the opening view and lets the camera drift again; any other
              key below holds it still.
            </li>
          </ul>
        </section>
        <section
          aria-labelledby="space-keys"
          className="flex flex-col gap-2 border-t border-border-subtle pt-4 not-any-pointer-fine:hidden"
        >
          <h3 id="space-keys" className="text-label-m text-text-primary">
            Keys
          </h3>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-text-muted">
            <dt>
              <KbdGroup>
                <Kbd aria-hidden={false}>F</Kbd>
                <Kbd aria-hidden={false}>1</Kbd>
                <Kbd aria-hidden={false}>2</Kbd>
              </KbdGroup>
            </dt>
            <dd>The AI future: flip, Slow, Fast</dd>
            <dt>
              <Kbd aria-hidden={false}>M</Kbd>
            </dt>
            <dd>The data month</dd>
            <dt>
              <KbdGroup>
                <Kbd aria-hidden={false}>←</Kbd>
                <Kbd aria-hidden={false}>→</Kbd>
              </KbdGroup>
            </dt>
            <dd>Step through the jobs across the fan</dd>
            <dt>
              <Kbd aria-hidden={false}>D</Kbd>
            </dt>
            <dd>The table, with the same numbers</dd>
            <dt>
              <Kbd aria-hidden={false}>H</Kbd>
            </dt>
            <dd>This guide</dd>
            <dt>
              <Kbd aria-hidden={false}>Esc</Kbd>
            </dt>
            <dd>Close a card or the sources</dd>
          </dl>
        </section>
      </div>
    </Modal>
  )
}

interface HudProps {
  model: SpaceModel
  scenario: Scenario
  snapshotId: SnapshotId
  onScenario: (scenario: Scenario) => void
  onSnapshot: (snapshotId: SnapshotId) => void
  show2D: () => void
  announcement: string | null
  /** The first-visit hint, until the user first moves the camera. */
  hint: boolean
  hud: RefObject<HudBoxes>
  sourcesOpen: number | null
  setSourcesOpen: (n: number | null) => void
  onHelp: () => void
  pinned: boolean
  onPin: () => void
  /** The check-up's next step, Look Around's one primary action. */
  checkUp: CheckUpLink
  /** Focus the title on mount (SpaceSceneProps.focusTitle). */
  focusTitle: boolean
  /** The h1, where focus goes when a card closes with no opener to return to. */
  title: RefObject<HTMLHeadingElement | null>
  /** A card is open in the foot's place (a phone or a short screen): the foot gives way to it. */
  sheet: boolean
  /** On a phone or a short screen the cards and the sources open in the foot's place. */
  bottomSheets: boolean
  /** A card is docked under the title: Look Around's note gives way to it, so it stays in the dark sky. */
  docked: boolean
  /**
   * A landscape screen under SpaceScene's SHORT: the desktop layout, compacted. The title is smaller and stands alone
   * (Look Around keeps only its action under it), the links stay top right, the numbers give way, and the ruler lies
   * flat at the foot beside the month, the switch below them on a narrow one.
   */
  short: boolean
  /** The cards docked under the header. */
  children?: ReactNode
  /** A card in its line form, which takes the title block's place on a short screen while it is open. */
  headerCard?: ReactNode
}

/**
 * The numbered sources, opened from a citation, as type straight on the render above the bottom right corner's month
 * (on a phone or a short screen, in the foot's place), the cited one marked by a rule: focus moves to its close button
 * on open and back to the citation on close; Esc closes it (SpaceScene). It scrolls when the screen is short.
 */
function SourcesPopover({
  title,
  sources,
  open,
  onClose,
  className
}: {
  title: string
  sources: SourceRef[]
  open: number
  onClose: () => void
  className: string
}) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    close.current?.focus()
    return () => {
      if (opener?.isConnected) opener.focus()
    }
  }, [])
  return (
    <div
      role="dialog"
      aria-label={title}
      className={cn(
        'pointer-events-auto visible z-40 flex flex-col gap-2 overflow-y-auto overscroll-contain text-left',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-label-l text-text-primary">{title}</h2>
        <IconButton
          ref={close}
          label="Close Sources"
          icon={X}
          variant="bare"
          tooltip={false}
          className="-mr-2"
          onClick={onClose}
        />
      </div>
      <ol className="flex flex-col gap-2">
        {sources.map((source) => (
          <li
            key={source.n}
            aria-current={source.n === open || undefined}
            className={cn(
              'flex items-start gap-3 border-l-2 pl-3',
              source.n === open ? 'border-focus-ring' : 'border-transparent'
            )}
          >
            <span className="font-mono text-mono-s text-text-primary">[{source.n}]</span>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-label-m text-text-primary">{source.name}</p>
              <p className="font-mono text-mono-s text-text-muted">{source.detail}</p>
            </div>
            <a
              href={source.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${source.name}`}
              className="-my-3 inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-text-primary transition-colors duration-150 ease-out hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <ExternalLink className="size-5 stroke-current" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * One of the corner numbers: a grid of a label row and a value row of a fixed height, centred, so every number's label
 * shares one top line and every value one baseline, whatever sits beside it, such as a citation's taller box.
 */
function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 grid-rows-[auto_1.5rem] gap-0.5">
      <span className="truncate text-label-s text-text-muted">{label}</span>
      <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-mono-m text-text-primary max-sm:portrait:justify-center">
        {children}
      </span>
    </div>
  )
}

/**
 * Look Around's note: what distance means without answers, and the one action. It sits under the world's line, and on a
 * phone above the switch, where the frame is dark.
 */
function LookAroundNote({
  zoneN,
  onCite,
  checkUp,
  actionOnly = false,
  className
}: {
  zoneN: number | null
  onCite: (n: number) => void
  checkUp: CheckUpLink
  /** A short landscape screen keeps only the action; How to Read says the rest. */
  actionOnly?: boolean
  className?: string
}) {
  return (
    <div className={cn('pointer-events-auto flex flex-col gap-3', className)}>
      {!actionOnly && (
        <p className="text-body-s text-text-primary">
          Distance shows the preparation each job needs, its O*NET Job Zone
          {zoneN !== null && <> {cite(zoneN, onCite)}</>}. Take the check-up to place every job by your fit.
        </p>
      )}
      <ButtonLink to={checkUp.route} variant="outline-accent" className="touch-manipulation">
        {checkUp.label}
      </ButtonLink>
    </div>
  )
}

export function Hud(props: HudProps) {
  const { model, scenario, snapshotId, onScenario, onSnapshot, show2D, announcement, hint, hud } = props
  const { sourcesOpen, setSourcesOpen, onHelp, pinned, onPin, checkUp, focusTitle, sheet, bottomSheets, docked } = props
  const { short, title, children, headerCard } = props
  const phone = usePhoneLayout()
  const snapshot = model.snapshots.find((s) => s.id === snapshotId)!
  const { sources, anchorN, zoneN } = snapshotSources(model, snapshot)
  const anchors = model.anchors[snapshot.id]
  // One scale for every month, so a month switch moves the marks, not the scale.
  const rulerMax = Math.ceil(Math.max(1, ...Object.values(model.anchors).map((a) => a?.sgp ?? 0)))
  const yours = model.jobs.find((job) => job.kind === 'yours')
  const moved = model.moved?.[snapshot.id] ?? null
  const onCite = (n: number) => setSourcesOpen(n)
  // The sky keeps its stars out from under the HUD's text: the ruler's box, kept current here on a resize, so the scene
  // reads no layout per frame.
  const rulerRef = useCallback(
    (figure: HTMLElement | null) => {
      if (!figure) return
      const update = () => {
        const r = figure.getBoundingClientRect()
        if (hud.current) hud.current.avoid = new DOMRect(r.x - 24, r.y - 24, r.width + 48, r.height + 48)
      }
      update()
      const observer = new ResizeObserver(update)
      observer.observe(figure)
      window.addEventListener('resize', update)
      return () => {
        observer.disconnect()
        window.removeEventListener('resize', update)
        if (hud.current) hud.current.avoid = null
      }
    },
    [hud]
  )
  // And the header's blocks, the docked cards and the foot row, kept current the same way.
  const header = useRef<HTMLElement>(null)
  const dock = useRef<HTMLDivElement>(null)
  const foot = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const top = header.current
    const cards = dock.current
    const bottom = foot.current
    if (!top || !cards || !bottom) return
    let blocks: Element[] = []
    const measure = () => {
      if (hud.current)
        hud.current.text = blocks.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0)
    }
    const sizes = new ResizeObserver(measure)
    // A card opening or closing changes the blocks to watch.
    const watch = () => {
      blocks = [...top.children, ...cards.children, bottom]
      sizes.disconnect()
      for (const el of blocks) sizes.observe(el)
      measure()
    }
    watch()
    const children = new MutationObserver(watch)
    children.observe(cards, { childList: true })
    window.addEventListener('resize', measure)
    return () => {
      sizes.disconnect()
      children.disconnect()
      window.removeEventListener('resize', measure)
      if (hud.current) hud.current.text = null
    }
  }, [hud])
  // The table dialog can close in the same commit that mounts the HUD, and the title stays inert behind it until it
  // has, so the focus waits a frame.
  useEffect(() => {
    if (!focusTitle) return
    const frame = requestAnimationFrame(() => title.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [focusTitle, title])

  // A phone stacks the HUD above and below the scene: Look Around's note sits above the switch, and the ruler lies flat
  // at the foot, where the frame is dark. Elsewhere the note sits under the world's line and the ruler stands down the
  // right edge, hanging from a fixed height whatever the title block holds, so it reads the same in every mode, and
  // ending above the opening shot's horizon (38.9% down the frame), clear of the field.
  const note = !model.answers && (
    <LookAroundNote
      zoneN={zoneN}
      onCite={onCite}
      checkUp={checkUp}
      actionOnly={short}
      className={
        phone
          ? 'order-first items-center text-center'
          : cn('max-w-[18rem] items-start 2xl:max-w-[26rem]', short ? 'mt-1' : 'mt-3')
      }
    />
  )
  const flat = phone || short
  const ruler = anchors && (
    <Ruler
      ref={flat ? undefined : rulerRef}
      orientation={flat ? 'horizontal' : 'vertical'}
      anchors={anchors}
      max={rulerMax}
      scenario={scenario}
      month={snapshot.label}
      cite={anchorN !== null && cite(anchorN, onCite)}
      className={
        phone
          ? 'order-last w-full'
          : short
            ? 'w-[min(18rem,38%)]'
            : 'absolute right-8 top-24 h-[min(26rem,calc(38.9dvh-7.25rem))] lg:right-10'
      }
    />
  )

  // The switch's line and the first-visit hint, with room for the line's two rows, so nothing moves when it shows:
  // above the numbers bottom left, clear of the field's lines; on a short screen under the title, in the dark sky; on a
  // phone under the switch.
  const line = (
    <div
      className={cn(
        'grid min-h-10',
        phone
          ? 'w-[calc(100vw-2.5rem)] content-start text-center'
          : short
            ? 'w-[min(14rem,100%)] content-start text-left'
            : 'w-[min(22rem,100%)] content-end text-left',
        // An open card holds the short screen's title block; the line still speaks.
        short && headerCard ? 'sr-only' : undefined
      )}
    >
      <p
        aria-live="polite"
        className={cn(
          'text-balance text-label-m text-text-primary transition-opacity duration-200 ease-out [grid-area:1/1]',
          announcement ? 'opacity-100' : 'opacity-0'
        )}
      >
        {announcement ? brand(announcement) : ''}
      </p>
      <p
        aria-hidden={!hint || announcement !== null}
        className={cn(
          'text-label-m text-text-muted transition-opacity duration-500 ease-out [grid-area:1/1]',
          hint && !announcement ? 'opacity-100' : 'opacity-0'
        )}
      >
        <span className="not-any-pointer-fine:hidden">Drag to look around · R resets</span>
        <span className="any-pointer-fine:hidden">Drag to look around · double-tap a job</span>
      </p>
    </div>
  )

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col overflow-clip">
      <header
        ref={header}
        className={cn(
          'relative flex items-start justify-between px-5 sm:px-8 lg:px-10',
          short ? 'gap-4 pt-4' : 'gap-6 pt-5 sm:pt-7 lg:pt-9'
        )}
      >
        {/* On a short screen an open card takes the title block's place, as the sky there is the only dark part of the
            frame that holds it; the title stays for screen readers, and comes back when the card closes. */}
        <div className="flex min-w-0 max-w-[30rem] flex-col gap-1.5">
          {headerCard}
          <h1
            ref={title}
            tabIndex={-1}
            className={cn(
              'text-balance text-text-primary outline-none',
              short ? 'text-title-m' : 'text-title-l sm:text-display',
              headerCard ? 'sr-only' : undefined
            )}
          >
            <span className="sr-only">The 3D Space: </span>
            {WORLD_NAME[scenario]}
          </h1>
          {/* A short screen's switch announces the line. */}
          {!short && <p className="text-body-m text-text-primary max-sm:text-body-s">{WORLD_LINE[scenario]}</p>}
          {phone && (
            <nav aria-label="Space" className="pointer-events-auto -mb-2 flex items-center gap-5">
              <HudLink keys="H" onClick={onHelp}>
                How to Read
              </HudLink>
              <HudLink keys="D" onClick={show2D}>
                Show the Table
              </HudLink>
            </nav>
          )}
          {!phone && !docked && !headerCard && note}
          {short && line}
        </div>
        <nav
          aria-label="Space"
          className={cn('pointer-events-auto flex shrink-0 items-center', short ? 'gap-4' : 'gap-6', phone && 'hidden')}
        >
          <HudLink keys="H" onClick={onHelp}>
            How to Read
          </HudLink>
          <HudLink keys="D" onClick={show2D}>
            Show the Table
          </HudLink>
          {!short && (
            <ButtonLink
              to={routes.home}
              variant="outline"
              iconStart={<ArrowLeft className="size-5 stroke-current" aria-hidden="true" />}
              className="touch-manipulation max-sm:hidden"
            >
              Back to Dashboard
            </ButtonLink>
          )}
        </nav>
        {/* Its arrow alone on a phone, and on a short screen, where the title row has room for little else. */}
        <ButtonLink
          to={routes.home}
          variant="outline"
          aria-label="Back to Dashboard"
          iconStart={<ArrowLeft className="size-5 stroke-current" aria-hidden="true" />}
          className={cn('pointer-events-auto -mr-2 w-11 touch-manipulation !px-0', !short && 'sm:hidden')}
        />
      </header>

      {!flat && ruler}
      {/* The cards' band: each card keeps to its height and scrolls inside it on a short screen. */}
      <div className="relative min-h-0 flex-1 px-5 pb-4 pt-2 sm:px-8 lg:px-10">
        <div ref={dock} className="flex h-full items-start gap-8 max-sm:portrait:hidden">
          {children}
        </div>
      </div>

      {/* The foot: the numbers bottom left, the switches bottom right, and between them nothing, as the box stands
          there; on a short screen the ruler lies flat in the numbers' place, and on a phone it all stacks under the
          scene, the box standing above it. */}
      <div
        ref={foot}
        className={cn(
          'relative flex items-end justify-between px-5 sm:px-8 lg:px-10 max-sm:portrait:flex-col max-sm:portrait:items-center max-sm:portrait:gap-3',
          short ? 'gap-x-4 pb-2' : 'gap-6 pb-5 sm:pb-7 lg:pb-9',
          // Nothing sits behind the HUD's type, so the foot steps aside for a card's sheet, and on a phone for the
          // sources, rather than show through them.
          (sheet || (bottomSheets && sourcesOpen !== null)) && 'invisible'
        )}
      >
        {phone && note}
        {flat && ruler}
        <div className="flex max-w-[38%] flex-col items-start gap-2 max-sm:portrait:contents">
          {!flat && line}
          {/* On a phone, Look Around's note above says what distance is, with its source, so the row gives way to the
              scene. */}
          <div
            className={cn(
              'pointer-events-auto flex flex-wrap items-start gap-x-8 gap-y-3 max-sm:portrait:order-3 max-sm:portrait:justify-center max-sm:portrait:gap-x-6 max-sm:portrait:text-center',
              !model.answers && 'max-sm:portrait:hidden',
              short && 'hidden'
            )}
          >
            <Metric label="Jobs">{model.jobs.length}</Metric>
            {yours?.fit && (
              <Metric label={`Fit, ${yours.title}`}>
                <button
                  type="button"
                  aria-pressed={pinned}
                  aria-label={`${formatFitPercent(yours.fit[snapshot.id][scenario])} fit, ${yours.title}: Pin Your Card`}
                  onClick={onPin}
                  className="-my-3 inline-flex min-h-11 items-center rounded-sm underline decoration-current underline-offset-2 hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {formatFitPercent(yours.fit[snapshot.id][scenario])}
                </button>
              </Metric>
            )}
            {moved && (
              <Metric label="Fit Changed, Slow to Fast">
                {moved.count} {moved.count === 1 ? 'job' : 'jobs'}
                <span className="text-text-muted">· at most {moved.max}&nbsp;pts</span>
              </Metric>
            )}
            {!model.answers && <Metric label="Distance">Job Zone 1 to 5{zoneN !== null && cite(zoneN, onCite)}</Metric>}
          </div>
        </div>

        <div className={cn('relative flex max-w-[38%] flex-col items-end gap-0.5 text-right max-sm:portrait:contents')}>
          {sourcesOpen !== null && (
            <SourcesPopover
              title={`Sources, ${snapshot.label}`}
              sources={sources}
              open={sourcesOpen}
              onClose={() => setSourcesOpen(null)}
              className={
                // Clear of the box, which stands at the foot's middle.
                !bottomSheets
                  ? 'absolute bottom-full right-0 mb-4 max-h-[calc(100dvh-10rem)] w-[min(34rem,calc(40vw-2.5rem))]'
                  : phone
                    ? 'fixed inset-x-3 bottom-3 max-h-[45dvh]'
                    : 'fixed bottom-5 right-5 max-h-[calc(100dvh-2.5rem)] w-[min(34rem,calc(40vw-2.5rem))] sm:bottom-7 sm:right-8 lg:bottom-9 lg:right-10'
              }
            />
          )}
          <div className="flex flex-col items-end gap-1 max-sm:portrait:order-1 max-sm:portrait:flex-col-reverse max-sm:portrait:items-center">
            {phone && line}
            <div className="pointer-events-auto flex items-center gap-3">
              <Switcher
                label="AI Uptake Scenario"
                keyshortcuts="F 1 2"
                size="lg"
                value={scenario}
                onChange={onScenario}
                options={[
                  { value: 'slow', label: 'Slow', name: WORLD_NAME.slow },
                  { value: 'fast', label: 'Fast', name: WORLD_NAME.fast }
                ]}
              />
              <Kbd bare className="not-any-pointer-fine:hidden">
                F
              </Kbd>
            </div>
          </div>
          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1 max-sm:portrait:order-2 max-sm:portrait:justify-center">
            <span className="flex items-center gap-1.5 text-label-s text-text-muted">
              Data
              {sources.filter((s) => s.n !== anchorN && s.n !== zoneN).map((s) => cite(s.n, onCite))}
            </span>
            <Switcher
              label="Data Month"
              keyshortcuts="M"
              value={snapshot.id}
              onChange={onSnapshot}
              options={model.snapshots.map((s) => ({ value: s.id, label: s.label }))}
            />
            <Kbd bare className="not-any-pointer-fine:hidden">
              M
            </Kbd>
          </div>
          {/* A phone has no height for it; the switch announces it and How to Read says it too. */}
          <p className="max-w-[22rem] text-balance text-label-s text-text-muted max-sm:hidden [@media(max-height:480px)]:hidden">
            {brand(monthNote(model, snapshot.id))}
          </p>
        </div>
      </div>
    </div>
  )
}
