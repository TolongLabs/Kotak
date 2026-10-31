import type { Scenario, SnapshotId } from '@kotak/shared'
import { ArrowLeft, ArrowRight, ExternalLink, X } from 'lucide-react'
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
  type RefObject
} from 'react'
import type { SourceRef } from '../../../demo/types'
import { Link } from '../../../app/router'
import { jobPath, routes } from '../../../app/routes'
import { ASK_KOPI_PANEL_ID } from '../../../app/shell/AskKopi'
import { ButtonLink } from '../../../components/ui/Button'
import { citationClassName } from '../../../components/ui/Citation'
import { cn } from '../../../components/ui/cn'
import { IconButton } from '../../../components/ui/IconButton'
import { Kbd, KbdGroup } from '../../../components/ui/Kbd'
import { LanguageToggle } from '../../../components/ui/LanguageToggle'
import { Modal } from '../../../components/ui/Modal'
import { commonText } from '../../../i18n/common'
import { spaceText } from '../../../i18n/messages/space'
import { uiText } from '../../../i18n/messages/ui'
import { textNow, useText } from '../../../i18n/text'
import { formatFitPercent } from '../../roles/fit'
import {
  formatChange,
  groupName,
  hasNoEstimate,
  monthLabel,
  snapshotSources,
  useSpaceText,
  VERDICT_MARKS,
  zoneWord
} from '../format'
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

/** What a snapshot can say about AI use: one dated point per skill (no trend) or two. Call it while rendering. */
export function monthNote(model: SpaceModel, snapshotId: SnapshotId): string {
  const t = textNow(spaceText)
  const known = model.medianGrowth[snapshotId].slow !== null || model.medianGrowth[snapshotId].fast !== null
  return known ? t.hud.monthKnown : t.hud.monthUnknown
}

/** A numbered citation that opens the Sources popover; a button, since it opens a panel here rather than a page. */
function cite(n: number, onCite: (n: number) => void) {
  return (
    <button
      key={n}
      type="button"
      aria-label={textNow(uiText).sourceNumber(n)}
      aria-haspopup="dialog"
      onClick={() => onCite(n)}
      className={cn(citationClassName(true), 'pointer-events-auto touch-manipulation')}
    >
      [{n}]
    </button>
  )
}

/** Kotak's and Kopi's names kept whole by page translators. */
function brand(text: string): ReactNode {
  return text.split(/(Kotak|Kopi)/).map((part, i) =>
    part === 'Kotak' || part === 'Kopi' ? (
      <span key={i} translate="no">
        {part}
      </span>
    ) : (
      part
    )
  )
}

/** The top right's plain text actions: underlined type, nothing behind it. */
const HUD_LINK =
  'inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-sm text-label-m text-text-primary underline decoration-border-control underline-offset-4 transition-colors duration-150 ease-out hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

/** A plain text action with its key beside it, for the top right; a phone's row has no room for the key. */
function HudLink({
  keys,
  onClick,
  showKey = true,
  children
}: {
  keys: string
  onClick: () => void
  showKey?: boolean
  children: ReactNode
}) {
  return (
    <button type="button" aria-keyshortcuts={keys} onClick={onClick} className={HUD_LINK}>
      {children}
      {showKey && (
        <Kbd bare className="not-any-pointer-fine:hidden">
          {keys}
        </Kbd>
      )}
    </button>
  )
}

/** Opens and closes the app's Ask Kopi chat window, as its floating button does elsewhere; the window keeps its own
 * panel, so nothing of the HUD sits behind type. */
function AskKopiLink({ open, onClick, ref }: { open: boolean; onClick: () => void; ref: Ref<HTMLButtonElement> }) {
  const c = useText(commonText)
  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={ASK_KOPI_PANEL_ID}
      onClick={onClick}
      className={HUD_LINK}
    >
      <span>{brand(c.askKopi)}</span>
    </button>
  )
}

/** The app's language toggle as HUD type, without its fill, underlined like the links beside it. */
function HudLanguage() {
  return (
    <LanguageToggle className="!rounded-sm !bg-transparent underline decoration-border-control underline-offset-4 hover:!bg-transparent hover:decoration-current" />
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
  const t = useText(spaceText)
  const c = useText(commonText)
  const { jobTitle } = useSpaceText()
  const compact = form === 'compact'
  const group = groupName(t, job)
  const snapshot = model.snapshots.find((s) => s.id === snapshotId)!
  const month = monthLabel(snapshot)
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
      <caption className="sr-only">{job.fit === null ? t.card.captionChange : t.card.captionFit}</caption>
      <thead>
        <tr className="text-label-s text-text-muted">
          <th scope="col" className={cn('text-left font-medium', headCell)}>
            <span className="sr-only">{t.card.measure}</span>
            {/* The short form names the group here, the full one under its title. */}
            {compact && (
              <span aria-hidden="true" className="inline-flex items-center gap-1.5">
                {job.kind === 'yours' && (
                  <span className="size-2.5 rounded-full border border-text-primary bg-accent-box" />
                )}
                {job.kind === 'related' && <span className="size-2.5 rounded-full bg-map-suggested" />}
                {job.kind === 'yours' && <span className="text-text-primary">{`${t.yourJob} · `}</span>}
                {job.kind === 'related' && `${t.related} · `}
                {group}
              </span>
            )}
          </th>
          {futures.map((s) => (
            <th
              key={s}
              scope="col"
              className={cn('pl-4 text-right font-medium', headCell, s === scenario && 'text-text-primary')}
            >
              {t.futureShort[s]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="font-mono text-mono-m">
        {job.fit === null ? (
          compact && (
            <tr>
              <th scope="row" className={rowHead}>
                {t.table.jobZone}
              </th>
              <td colSpan={2} className="whitespace-nowrap text-right font-sans text-label-m text-text-primary">
                {t.card.zoneValue(job.zone, zoneWord(t, job.zone))} {zoneN !== null && cite(zoneN, onCite)}
              </td>
            </tr>
          )
        ) : (
          <tr>
            <th scope="row" className={rowHead}>
              {job.kind === 'yours' || noEstimate ? t.fit : t.fitEst}
            </th>
            {noEstimate ? (
              <td colSpan={2} className={cn('text-right font-sans text-label-m text-text-muted', pad)}>
                {t.noEstimate}
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
          {/* The measure runs on into "median skill", which wraps whole, so a longer language takes no extra line. */}
          <th scope="row" className={rowHead}>
            {t.card.change}{' '}
            <span className="whitespace-nowrap text-label-s font-medium text-text-muted">{t.card.medianSkill}</span>
          </th>
          {futures.map((s) => {
            const change = job.growth[snapshotId][s]
            return (
              <td key={s} className={cell(s)}>
                {/* A longer language's word for it may wrap, rather than push the card wider. */}
                {change === null ? (
                  <span className="whitespace-normal">{c.verdicts.Unknown}</span>
                ) : (
                  formatChange(change)
                )}
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
      <span className="sr-only">
        {shown.map(({ verdict }) => `${counts[verdict]} ${c.verdicts[verdict]}`).join(', ')}
      </span>
    </>
  )
  const verdictsLabel = t.card.verdicts(t.futureShort[scenario])
  const borrowedText = borrowed > 0 && t.card.borrowed(borrowed, job.skills.length)
  // The data's month and its source's full name, wrapping; its last word keeps the citation on its line.
  const words = anchors?.source.split(' ') ?? []
  const sourceText = anchors && anchorN !== null && (
    <span className="font-mono text-mono-s">
      {t.dataOf(month)} · {words.slice(0, -1).join(' ')}{' '}
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
            {values[i] === null ? c.verdicts.Unknown : format(values[i]!)}
          </span>
        </Fragment>
      ))
    const fitValues = job.fit && futures.map((s) => job.fit![snapshotId][s])
    const changes = futures.map((s) => job.growth[snapshotId][s])
    return (
      <section
        aria-label={t.card.label(jobTitle(job))}
        className={cn('flex w-[min(18rem,34vw)] flex-col gap-0.5 text-text-primary', className)}
        style={style}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 text-label-l text-text-primary">
            <Link
              to={jobPath(job.code)}
              lang="en"
              title={jobTitle(job)}
              className="block truncate rounded-sm underline decoration-current underline-offset-2 hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {jobTitle(job)}
              <span className="sr-only">{t.card.openJobPageSr}</span>
            </Link>
            <span className="sr-only">{t.card.kindSr(job.kind, group)}</span>
          </h2>
          {close}
        </div>
        <p aria-hidden="true" className="truncate text-label-s text-text-muted [@media(max-height:410px)]:hidden">
          {job.kind !== 'other' && `${job.kind === 'yours' ? t.yourJob : t.related} · `}
          {group}
        </p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-label-s text-text-muted">
          <span aria-hidden="true" className="contents">
            {fitValues ? (
              <>
                {t.card.fitPair}
                <span className="font-mono text-mono-s">
                  {noEstimate ? t.noEstimate : pair(fitValues, formatFitPercent)}
                </span>
                {t.card.aiUse}
              </>
            ) : (
              <>
                {t.jobZone(job.zone)}
                {zoneN !== null && cite(zoneN, onCite)}
                {t.card.aiUsePair}
              </>
            )}
            <span className="font-mono text-mono-s">{pair(changes, formatChange)}</span>
          </span>
          <span className="sr-only">
            {fitValues &&
              (noEstimate
                ? t.card.noEstimateSr(t.noEstimate)
                : t.card.fitSr(formatFitPercent(fitValues[0]!), formatFitPercent(fitValues[1]!), job.kind !== 'yours'))}
            {!fitValues && t.card.zoneSr(job.zone, zoneWord(t, job.zone))}
            {t.card.changeSr(
              ...(changes.map((change) => (change === null ? c.verdicts.Unknown : formatChange(change))) as [
                string,
                string
              ])
            )}
            {borrowedText && ` ${borrowedText}.`}
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
        aria-label={t.card.label(jobTitle(job))}
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
              lang="en"
              className="rounded-sm underline decoration-current underline-offset-2 hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {jobTitle(job)}
              <span className="sr-only">{t.card.openJobPageSr}</span>
              <ArrowRight className="ml-1 inline size-4 stroke-current align-[-2px]" aria-hidden="true" />
            </Link>
            <span className="sr-only">{t.card.kindSr(job.kind, group)}</span>
          </h2>
          {close}
        </div>
        {numbers}
        {/* The rest runs on as one paragraph, so the short form stays in the dark sky above the horizon: the data's month
            and its citation, whose popover names the source. */}
        <p className="w-fit text-label-s text-text-muted">
          {verdictsLabel} {marks}
          {borrowedText && ` · ${borrowedText}`}
          {anchors && anchorN !== null && (
            <>
              {' · '}
              <span className="whitespace-nowrap font-mono text-mono-s">
                {t.dataOf(month)} {cite(anchorN, onCite)}
              </span>
            </>
          )}
        </p>
      </section>
    )

  return (
    <section
      aria-label={t.card.label(jobTitle(job))}
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
              {t.yourJob}
            </span>
          )}
          {job.kind === 'related' && (
            <span className="inline-flex items-center gap-1.5 text-label-s text-text-muted">
              <span aria-hidden="true" className="size-2.5 rounded-full bg-map-suggested" />
              {t.related}
            </span>
          )}
          <h2 lang="en" className="text-balance text-title-s text-text-primary">
            {jobTitle(job)}
          </h2>
          <p className="text-body-s text-text-muted">{group}</p>
          {job.fit === null && (
            <p className="flex flex-wrap items-center gap-1.5 text-body-s text-text-primary">
              {t.card.zoneLine(job.zone, zoneWord(t, job.zone))}
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
        {t.card.openJobPage}
        <ArrowRight className="size-4 stroke-current" aria-hidden="true" />
      </Link>
    </section>
  )
}

export function HowToRead({ open, onClose, model }: { open: boolean; onClose: () => void; model: SpaceModel }) {
  const t = useText(spaceText)
  const h = t.howTo
  const rings = t.list(ringLabels(model, t))
  const strong = 'font-semibold'
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={h.title}
      closeTooltip={false}
      closeVariant="bare"
      backdrop="none"
      body="scroll"
      widthClass="w-[min(38rem,calc(100vw-2rem))]"
    >
      <div className="flex flex-col gap-5 text-body-s">
        <ul className="flex list-none flex-col gap-3">
          <li>
            <strong className={strong}>{h.tuft.lead}</strong>
            {h.tuft.rest(model.jobs.length)}
          </li>
          <li>
            <strong className={strong}>{h.distance}</strong>
            {model.answers ? h.distanceFit(rings) : h.distanceZone(zoneWord(t, 1), zoneWord(t, 5))}
          </li>
          <li>
            <strong className={strong}>{h.angle}</strong>
            {h.angleRest(model.answers)}
          </li>
          <li>
            <strong className={strong}>{h.blade}</strong>
            {h.bladeRest}
          </li>
          <li>
            <strong className={strong}>{h.colour}</strong>
            {brand(h.colourRest(model.answers))}
          </li>
          <li>
            <strong className={strong}>{h.ring}</strong>
            {h.ringRest}
          </li>
          <li>
            <strong className={strong}>{h.atmosphere}</strong>
            {h.atmosphereRest}
          </li>
        </ul>
        <section aria-labelledby="space-camera" className="flex flex-col gap-2 border-t border-border-subtle pt-4">
          <h3 id="space-camera" className="text-label-m text-text-primary">
            {h.moving}
          </h3>
          <ul className="flex list-none flex-col gap-1.5">
            <li>{h.drag}</li>
            <li>{h.zoom}</li>
            <li>{h.pan}</li>
            <li>{h.doubleClick}</li>
            <li>
              <Kbd aria-hidden={false}>R</Kbd>
              {h.reset}
            </li>
          </ul>
        </section>
        <section
          aria-labelledby="space-keys"
          className="flex flex-col gap-2 border-t border-border-subtle pt-4 not-any-pointer-fine:hidden"
        >
          <h3 id="space-keys" className="text-label-m text-text-primary">
            {h.keys}
          </h3>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-text-muted">
            <dt>
              <KbdGroup>
                <Kbd aria-hidden={false}>F</Kbd>
                <Kbd aria-hidden={false}>1</Kbd>
                <Kbd aria-hidden={false}>2</Kbd>
              </KbdGroup>
            </dt>
            <dd>{h.keyFuture}</dd>
            <dt>
              <Kbd aria-hidden={false}>M</Kbd>
            </dt>
            <dd>{h.keyMonth}</dd>
            <dt>
              <KbdGroup>
                <Kbd aria-hidden={false}>←</Kbd>
                <Kbd aria-hidden={false}>→</Kbd>
              </KbdGroup>
            </dt>
            <dd>{h.keyArrows}</dd>
            <dt>
              <Kbd aria-hidden={false}>D</Kbd>
            </dt>
            <dd>{h.keyTable}</dd>
            <dt>
              <Kbd aria-hidden={false}>H</Kbd>
            </dt>
            <dd>{h.keyGuide}</dd>
            <dt>
              <Kbd aria-hidden={false}>Esc</Kbd>
            </dt>
            <dd>{h.keyEscape}</dd>
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
  /** Whether the Ask Kopi chat window is open; the HUD's Ask Kopi link toggles it and takes focus back on close. */
  kopiOpen: boolean
  onKopi: () => void
  kopiLink: Ref<HTMLButtonElement>
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
  const t = useText(spaceText)
  const ui = useText(uiText)
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
          label={t.hud.closeSources}
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
              aria-label={ui.openSource(source.name)}
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
  const [before, after] = useText(spaceText).hud.lookAroundNote
  return (
    <div className={cn('pointer-events-auto flex flex-col gap-3', className)}>
      {!actionOnly && (
        <p className="text-body-s text-text-primary">
          {before}
          {zoneN !== null && <> {cite(zoneN, onCite)}</>}
          {after}
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
  const { short, title, children, headerCard, kopiOpen, onKopi, kopiLink } = props
  const t = useText(spaceText)
  const c = useText(commonText)
  const { jobTitle } = useSpaceText()
  const phone = usePhoneLayout()
  const snapshot = model.snapshots.find((s) => s.id === snapshotId)!
  const month = monthLabel(snapshot)
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
      month={month}
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
        <span className="not-any-pointer-fine:hidden">{t.hud.hintPointer}</span>
        <span className="any-pointer-fine:hidden">{t.hud.hintTouch}</span>
      </p>
    </div>
  )

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col overflow-clip">
      <header
        ref={header}
        className={cn(
          'relative flex items-start justify-between px-5 sm:px-8 lg:px-10',
          short ? 'gap-4 pt-4' : phone ? 'flex-wrap gap-x-6 gap-y-1.5 pt-5' : 'gap-6 pt-5 sm:pt-7 lg:pt-9'
        )}
      >
        {/* On a short screen an open card takes the title block's place, as the sky there is the only dark part of the
            frame that holds it; the title stays for screen readers, and comes back when the card closes. The card keeps
            its width, and the links beside it wrap onto a second row instead, right-aligned, where the frame is narrow. */}
        <div
          className={cn(
            'flex min-w-0 max-w-[30rem] flex-col gap-1.5',
            phone && 'flex-1 basis-0',
            headerCard ? 'shrink-0' : undefined
          )}
        >
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
            <span className="sr-only">{t.hud.titlePrefix}</span>
            {c.scenarios[scenario]}
          </h1>
          {/* A short screen's switch announces the line. */}
          {!short && (
            <p className="text-balance text-body-m text-text-primary max-sm:text-body-s">{t.hud.worldLine[scenario]}</p>
          )}
          {!phone && !docked && !headerCard && note}
          {short && line}
        </div>
        <nav
          aria-label={c.nav.space}
          className={cn(
            'pointer-events-auto flex items-center',
            short ? 'min-w-0 flex-wrap justify-end gap-x-4' : 'ml-auto shrink-0 gap-4 2xl:gap-6',
            phone && 'hidden'
          )}
        >
          <HudLink keys="H" onClick={onHelp}>
            {t.hud.howToRead}
          </HudLink>
          <HudLink keys="D" onClick={show2D}>
            {t.hud.showTable}
          </HudLink>
          {!phone && <AskKopiLink ref={kopiLink} open={kopiOpen} onClick={onKopi} />}
          {!phone && <HudLanguage />}
          {!short && (
            <ButtonLink
              to={routes.home}
              variant="outline"
              iconStart={<ArrowLeft className="size-5 stroke-current" aria-hidden="true" />}
              className="touch-manipulation max-2xl:hidden"
            >
              {t.backToDashboard}
            </ButtonLink>
          )}
        </nav>
        {/* Its arrow alone on a phone, on a short screen, where the title row has room for little else, and under 2xl, so
            the links keep clear of the ring as it rises in the fast future; a phone keeps the language beside it. */}
        <div className={cn('pointer-events-auto -mr-2 flex shrink-0 items-center gap-2', !short && '2xl:hidden')}>
          {phone && <HudLanguage />}
          <ButtonLink
            to={routes.home}
            variant="outline"
            aria-label={t.backToDashboard}
            iconStart={<ArrowLeft className="size-5 stroke-current" aria-hidden="true" />}
            className="w-11 touch-manipulation !px-0"
          />
        </div>
        {/* A phone's links take a row of their own under the title, the width of the screen. */}
        {phone && (
          <nav
            aria-label={c.nav.space}
            className="pointer-events-auto -mb-2 flex basis-full flex-wrap items-center gap-x-5"
          >
            <HudLink keys="H" onClick={onHelp} showKey={false}>
              {t.hud.howToRead}
            </HudLink>
            <HudLink keys="D" onClick={show2D} showKey={false}>
              {t.hud.showTable}
            </HudLink>
            <AskKopiLink ref={kopiLink} open={kopiOpen} onClick={onKopi} />
          </nav>
        )}
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
            <Metric label={t.hud.jobs}>{model.jobs.length}</Metric>
            {yours?.fit && (
              <Metric label={t.hud.fitFor(jobTitle(yours))}>
                <button
                  type="button"
                  aria-pressed={pinned}
                  aria-label={t.hud.pinYours(formatFitPercent(yours.fit[snapshot.id][scenario]), jobTitle(yours))}
                  onClick={onPin}
                  className="-my-3 inline-flex min-h-11 items-center rounded-sm underline decoration-current underline-offset-2 hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {formatFitPercent(yours.fit[snapshot.id][scenario])}
                </button>
              </Metric>
            )}
            {moved && (
              <Metric label={t.hud.fitChanged}>
                {t.jobs(moved.count)}
                <span className="text-text-muted">{t.hud.atMost(moved.max)}</span>
              </Metric>
            )}
            {!model.answers && (
              <Metric label={t.hud.distance}>
                {t.hud.zoneRange}
                {zoneN !== null && cite(zoneN, onCite)}
              </Metric>
            )}
          </div>
        </div>

        <div className={cn('relative flex max-w-[38%] flex-col items-end gap-0.5 text-right max-sm:portrait:contents')}>
          {sourcesOpen !== null && (
            <SourcesPopover
              title={`${c.sources} · ${month}`}
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
                label={t.hud.scenario}
                keyshortcuts="F 1 2"
                size="lg"
                value={scenario}
                onChange={onScenario}
                options={[
                  { value: 'slow', label: t.futureShort.slow, name: c.scenarios.slow },
                  { value: 'fast', label: t.futureShort.fast, name: c.scenarios.fast }
                ]}
              />
              <Kbd bare className="not-any-pointer-fine:hidden">
                F
              </Kbd>
            </div>
          </div>
          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1 max-sm:portrait:order-2 max-sm:portrait:justify-center">
            <span className="flex items-center gap-1.5 text-label-s text-text-muted">
              {t.hud.data}
              {sources.filter((s) => s.n !== anchorN && s.n !== zoneN).map((s) => cite(s.n, onCite))}
            </span>
            <Switcher
              label={t.hud.dataMonth}
              keyshortcuts="M"
              value={snapshot.id}
              onChange={onSnapshot}
              options={model.snapshots.map((s) => ({ value: s.id, label: monthLabel(s) }))}
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
