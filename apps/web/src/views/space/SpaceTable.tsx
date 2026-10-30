import type { Scenario, SnapshotId, Verdict } from '@kotak/shared'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { SourceList } from '../../components/kotak/SourceList'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Citation } from '../../components/ui/Citation'
import { cn } from '../../components/ui/cn'
import { Link } from '../../app/router'
import { jobPath } from '../../app/routes'
import { formatFitPercent } from '../roles/fit'
import {
  Est,
  formatChange,
  formatIndex,
  hasNoEstimate,
  NO_ESTIMATE,
  snapshotSources,
  VERDICT_MARKS,
  ZONE_LABEL
} from './format'
import type { SpaceJob, SpaceModel } from './model'

// The space as a table: every job in the AI future and month the space shows, best fit first, one page at a time. It
// is the body of the table dialog, which D opens over the 3D view and which stands in for it when WebGL fails or motion
// is reduced. It has no switches of its own: the dialog's title (spaceTableTitle) names the state it shows. In Look
// Around, with no answers, it has no fit: each job shows its O*NET Job Zone, sorted by zone, then title. Every number
// the 3D view shows is here too: both futures' index above the rows, and each job's both futures in its expansion.

const SCENARIO_WORD: Record<Scenario, string> = { slow: 'Slow', fast: 'Fast' }

/** Rows on one page of the table. */
const PAGE_SIZE = 20

const markOf = new Map(VERDICT_MARKS.map((mark) => [mark.verdict, mark]))

// As the Roles cards mark fit: answered on your job, estimated where answers carry over, none where no answer reaches.
function Fit({ job, value }: { job: SpaceJob; value: number }) {
  if (hasNoEstimate(job)) return <span className="font-sans text-body-s text-text-muted">{NO_ESTIMATE}</span>
  return (
    <>
      {formatFitPercent(value)}
      <Est hidden={job.kind === 'yours'} />
    </>
  )
}

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-text-muted">Unknown</span>
  return (
    <>
      {formatChange(value)}
      <Est />
    </>
  )
}

function VerdictMark({ verdict }: { verdict: Verdict }) {
  const { icon: Icon, tone } = markOf.get(verdict)!
  return (
    <span className={cn('inline-flex items-center gap-1 font-sans text-label-s', tone)}>
      <Icon className="size-3.5 shrink-0 stroke-current" aria-hidden="true" />
      {verdict}
    </span>
  )
}

interface StateProps {
  snapshotId: SnapshotId
  scenario: Scenario
}

// Each skill of one job, as the 3D view draws its blades: the AI-use change and verdict in the future shown, and
// whether its AI-use data is borrowed from a broader Malaysian row.
function Skills({ job, snapshotId, scenario }: { job: SpaceJob } & StateProps) {
  const cell = 'whitespace-nowrap px-3 py-1.5'
  return (
    <table className="w-full text-left">
      <caption className="sr-only">Skills of {job.title}</caption>
      <thead>
        <tr className="font-mono text-mono-s text-text-muted">
          <th scope="col" className="px-3 py-1.5 font-normal">
            Skill
          </th>
          <th scope="col" className={cn(cell, 'text-right font-normal')}>
            AI Use, 12-Month Change
          </th>
          <th scope="col" className={cn(cell, 'text-right font-normal')}>
            Verdict
          </th>
          <th scope="col" className={cn(cell, 'text-right font-normal')}>
            AI-Use Data
          </th>
        </tr>
      </thead>
      <tbody>
        {job.skills.map((skill) => (
          <tr key={skill.corner_id} className="border-t border-border-subtle">
            <th scope="row" className="px-3 py-1.5 text-body-s font-normal text-text-primary">
              {skill.name}
            </th>
            <td className={cn(cell, 'text-right font-mono text-mono-s')}>
              <Change value={skill.growth[snapshotId][scenario]} />
            </td>
            <td className={cn(cell, 'text-right')}>
              <VerdictMark verdict={skill.status[snapshotId][scenario]} />
            </td>
            <td className={cn(cell, 'text-right text-body-s text-text-muted')}>
              {skill.borrowed[snapshotId] ? 'Borrowed from a broader row' : 'Not borrowed'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// One job in both AI futures, as its card in the space shows it: fit (with answers) and the median AI-use change, the
// future shown in ink. It reads as one block with the skills under it: the same cells, header and rules.
function Futures({ job, snapshotId, scenario }: { job: SpaceJob } & StateProps) {
  const futures: Scenario[] = ['slow', 'fast']
  const value = (s: Scenario) =>
    cn(
      'w-40 whitespace-nowrap px-3 py-1.5 text-right font-mono text-mono-s',
      s === scenario ? 'text-text-primary' : 'text-text-muted'
    )
  const head = 'px-3 py-1.5 text-body-s font-normal text-text-primary'
  return (
    <table className="w-full text-left">
      <caption className="sr-only">{job.title} in both AI futures</caption>
      <thead>
        <tr className="font-mono text-mono-s text-text-muted">
          <th scope="col" className="px-3 py-1.5 font-normal">
            Both Futures
          </th>
          {futures.map((s) => (
            <th
              key={s}
              scope="col"
              className={cn(
                'w-40 whitespace-nowrap px-3 py-1.5 text-right font-normal',
                s === scenario && 'text-text-primary'
              )}
            >
              {SCENARIO_WORD[s]} AI Uptake
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {job.fit && (
          <tr className="border-t border-border-subtle">
            <th scope="row" className={head}>
              Fit
            </th>
            {futures.map((s) => (
              <td key={s} className={value(s)}>
                <Fit job={job} value={job.fit![snapshotId][s]} />
              </td>
            ))}
          </tr>
        )}
        <tr className="border-t border-border-subtle">
          <th scope="row" className={head}>
            AI use, 12-month change, median skill
          </th>
          {futures.map((s) => (
            <td key={s} className={value(s)}>
              <Change value={job.growth[snapshotId][s]} />
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}

function Verdicts({ counts }: { counts: Record<Verdict, number> }) {
  const shown = VERDICT_MARKS.filter(({ verdict }) => counts[verdict] > 0)
  return (
    <>
      <span aria-hidden="true" className="inline-flex gap-2.5">
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
}

interface JobRowProps extends StateProps {
  job: SpaceJob
  open: boolean
  onToggle: (code: string) => void
  /** The row the table opened on: the job in focus in the space, otherwise yours. Marked aria-current. */
  highlight: boolean
  /** Whether this job's card is pinned in the space. */
  pinned: boolean
  rowRef?: Ref<HTMLTableRowElement>
}

/** Each row's cells, for the skills row's span. */
const COLUMNS = 5

/** One job's row, and its skills under it when open. Its controls keep clear of the sticky header (about 50 px) when
 * focus scrolls them into view. */
const JobRow = memo(function JobRow({
  job,
  snapshotId,
  scenario,
  open,
  onToggle,
  highlight,
  pinned,
  rowRef
}: JobRowProps) {
  const yours = job.kind === 'yours'
  const detailsId = `space-details-${job.code}`
  return (
    <>
      <tr
        ref={rowRef}
        aria-current={highlight || undefined}
        className={cn('border-t border-border-subtle', highlight && 'bg-bg-panel')}
      >
        <th
          scope="row"
          className={cn('min-w-56 py-2 pl-1 pr-3 font-normal', highlight && 'border-l-4 border-l-accent-box')}
        >
          <span className="flex items-start gap-1">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={open ? detailsId : undefined}
              onClick={() => onToggle(job.code)}
              className="inline-flex size-11 shrink-0 scroll-mt-20 items-center justify-center rounded-sm text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <ChevronRight
                className={cn('size-4 stroke-current transition-transform duration-150', open && 'rotate-90')}
                aria-hidden="true"
              />
              <span className="sr-only">Both futures and skills of {job.title}</span>
            </button>
            <span className="pt-2.5">
              <Link
                to={jobPath(job.code)}
                className={cn(
                  'scroll-mt-20 text-label-m text-text-primary underline decoration-current underline-offset-2 transition-colors duration-150 ease-out hover:text-text-muted',
                  yours && 'font-bold'
                )}
              >
                {job.title}
              </Link>
              {yours && <span className="ml-2 text-label-s font-bold text-text-primary">Your Job</span>}
              {pinned && !yours && <span className="ml-2 text-label-s font-bold text-text-primary">Pinned</span>}
              {job.kind === 'related' && (
                <span className="ml-2 inline-flex items-center gap-1 text-label-s text-text-muted">
                  <span aria-hidden="true" className="size-2 rounded-full bg-map-suggested" />
                  Related
                </span>
              )}
            </span>
          </span>
        </th>
        <td className="min-w-40 px-3 py-2 text-body-s text-text-muted">{job.groupName}</td>
        {job.fit ? (
          <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-mono-m">
            <Fit job={job} value={job.fit[snapshotId][scenario]} />
          </td>
        ) : (
          <td className="min-w-48 px-3 py-2">
            <span className="font-mono text-mono-m text-text-primary">{job.zone}</span>
            <span className="ml-2 text-body-s text-text-muted">{ZONE_LABEL[job.zone]}</span>
          </td>
        )}
        <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-mono-m">
          <Change value={job.growth[snapshotId][scenario]} />
        </td>
        <td className="whitespace-nowrap px-3 py-2 font-mono text-mono-s">
          <Verdicts counts={job.verdicts[snapshotId][scenario]} />
        </td>
      </tr>
      {open && (
        <tr className={cn(highlight && 'bg-bg-panel')}>
          <td colSpan={COLUMNS} className={cn('px-3 pb-3', highlight && 'border-l-4 border-l-accent-box')}>
            <div id={detailsId} className="rounded-md border border-border-subtle bg-bg-default">
              <Futures job={job} snapshotId={snapshotId} scenario={scenario} />
              <div className="border-t border-border-subtle">
                <Skills job={job} snapshotId={snapshotId} scenario={scenario} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
})

/** The table dialog's title, naming the month and the AI future it shows, such as "All 923 Jobs · May 2026 · Slow AI
 * Uptake". */
export const spaceTableTitle = (model: SpaceModel, snapshotId: SnapshotId, scenario: Scenario) =>
  `All ${model.jobs.length} Jobs · ${model.snapshots.find((s) => s.id === snapshotId)!.label} · ${SCENARIO_WORD[scenario]} AI Uptake`

export interface SpaceTableProps extends StateProps {
  model: SpaceModel
  /** The job in focus in the space (its pinned card), whose page the table opens on; null opens on your job's page. */
  focusCode: string | null
  /** Why the table shows instead of the 3D view, when it is the fallback. */
  note?: string
  /** Actions beside the explanation, such as showing the 3D view. */
  actions?: ReactNode
}

export function SpaceTable({ model, scenario, snapshotId, focusCode, note, actions }: SpaceTableProps) {
  const regionRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const targetRef = useRef<HTMLTableRowElement>(null)
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())
  const snapshot = model.snapshots.find((s) => s.id === snapshotId)!
  const { sources, anchorN, zoneN } = snapshotSources(model, snapshot)
  const anchors = model.anchors[snapshotId]
  const moved = model.moved?.[snapshotId]
  // Sorted once per model, snapshot and future, not on every render, such as opening a job's skills.
  const rows = useMemo(
    () =>
      model.answers
        ? [...model.jobs].sort((a, b) => b.fit![snapshotId][scenario] - a.fit![snapshotId][scenario])
        : [...model.jobs].sort((a, b) => a.zone - b.zone || a.title.localeCompare(b.title)),
    [model, snapshotId, scenario]
  )
  const word = SCENARIO_WORD[scenario]
  const target = focusCode ?? model.assessedCode
  const pages = Math.ceil(rows.length / PAGE_SIZE)
  // The table mounts each time its dialog opens, so it opens on the target's page, or the first.
  const [page, setPage] = useState(() =>
    Math.max(0, Math.floor(rows.findIndex((job) => job.code === target) / PAGE_SIZE))
  )
  const first = page * PAGE_SIZE
  const shown = rows.slice(first, first + PAGE_SIZE)

  // Said once the dialog has opened on the target's page, as a live region only speaks a change after it mounts.
  const [opened, setOpened] = useState('')

  // Once the dialog shows (its showModal runs after this effect), bring the target's row to the middle of the table's
  // box, the dialog's one scroller, and say where it opened.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const region = regionRef.current
      const row = targetRef.current
      if (!region || !row) return
      const box = region.getBoundingClientRect()
      const at = row.getBoundingClientRect()
      region.scrollTop += at.top - box.top - (box.height - at.height) / 2
      const job = rows.find((j) => j.code === target)
      if (job) setOpened(`Page ${page + 1} of ${pages}, showing ${job.title}`)
    })
    return () => cancelAnimationFrame(frame)
    // Once, on opening: the dialog remounts the table each time it opens.
  }, [])

  // The ends stay focusable (aria-disabled, not disabled), so focus stays on the button pressed. A new page starts at
  // its first row, under the header, past the summary above the table.
  const go = (to: number) => {
    if (to < 0 || to >= pages) return
    setPage(to)
    if (regionRef.current && tableRef.current) regionRef.current.scrollTop = tableRef.current.offsetTop
  }

  // Stable, so the rows' memo holds.
  const toggle = useCallback(
    (code: string) =>
      setOpen((current) => {
        const next = new Set(current)
        if (!next.delete(code)) next.add(code)
        return next
      }),
    []
  )

  // Set lines, such as "AI Use," over "12-Month Change"; the spaces between them keep the accessible name whole.
  const header = (lines: string[], { sorted = false, right = true } = {}) => (
    <th
      scope="col"
      aria-sort={sorted ? 'descending' : undefined}
      className={cn('whitespace-nowrap px-3 py-2 font-normal', right && 'text-right', sorted && 'text-text-primary')}
    >
      {lines.map((line, i) => (
        <Fragment key={line}>
          {i > 0 && ' '}
          <span className="block">{line}</span>
        </Fragment>
      ))}
    </th>
  )

  const pagerButton =
    'aria-disabled:cursor-not-allowed aria-disabled:border-border-subtle aria-disabled:text-text-muted'

  return (
    <div className="flex min-h-0 flex-col gap-3">
      {(note || actions) && (
        <div className="flex flex-col gap-3">
          {note && <Banner type="info" title="Table View" body={note} />}
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
      )}

      {/* The dialog's one scroller, of a fixed height that gives way on a short screen, so the pager and the sources
          below it stay in view and the pager never moves: what the numbers mean and both futures' summary, then one
          page of rows under a sticky header. Its overflow clips the header to the rounded corners; the summary stays
          put when the rows scroll sideways. A tab stop, so the keys scroll it. */}
      <div
        ref={regionRef}
        role="region"
        aria-label="Jobs Table"
        tabIndex={0}
        className="relative h-[min(36rem,60dvh)] min-h-0 overflow-auto overscroll-contain rounded-md border border-border-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <div className="sticky left-0 flex flex-col gap-4 p-4">
          <p className="max-w-[720px] text-body-s text-text-muted">
            {model.answers
              ? 'Fit is the share of each job’s needed levels your answers already meet; for every other job it is estimated from your answers. AI use, 12-month change, is the median of a job’s skills’ projected change in AI use: an AI-usage signal, not job demand. Both are estimates, for the month and AI future the title names, as the space shows them. Open a job to see both futures and each skill.'
              : 'With no answers yet, there is no fit, so each job shows its O*NET Job Zone: how much preparation it needs. AI use, 12-month change, is the median of a job’s skills’ projected change in AI use: an AI-usage signal, not job demand. It is an estimate, for the month and AI future the title names, as the space shows them. Open a job to see both futures and each skill.'}
          </p>

          <dl className="grid gap-3 sm:grid-cols-2">
            {anchors && (
              <div className="flex flex-col gap-1 rounded-md border border-border-subtle bg-bg-panel p-4">
                <dt className="text-label-m text-text-primary">Malaysia’s AI Usage Index</dt>
                <dd className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label-m">
                  {(['slow', 'fast'] as const).map((s) => (
                    <span key={s} className={s === scenario ? 'text-text-primary' : 'text-text-muted'}>
                      {SCENARIO_WORD[s]} AI Uptake{' '}
                      <span className="font-mono text-mono-m">
                        {formatIndex(s === 'fast' ? anchors.fastMys : anchors.mys)}
                        {s === 'fast' && <Est />}
                      </span>
                    </span>
                  ))}
                  <span className="text-text-muted">
                    Singapore <span className="font-mono text-mono-m">{formatIndex(anchors.sgp)}</span>
                  </span>
                  {anchorN !== null && <Citation n={anchorN} />}
                </dd>
                <dd className="text-body-s text-text-muted">
                  Fast AI Uptake moves Malaysia halfway to Singapore, from the same release, so it is an estimate.
                </dd>
              </div>
            )}
            {moved ? (
              <div className="flex flex-col gap-1 rounded-md border border-border-subtle bg-bg-panel p-4">
                <dt className="text-label-m text-text-primary">Fit Between the Two Futures</dt>
                <dd className="text-body-m text-text-primary">
                  {moved.count === 0
                    ? 'Fit is the same in both futures for every job.'
                    : `Fit changed for ${moved.count} ${moved.count === 1 ? 'job' : 'jobs'}, by at most ${moved.max} ${
                        moved.max === 1 ? 'point' : 'points'
                      }.`}
                </dd>
                <dd className="text-body-s text-text-muted">Whole percents, as the table shows them.</dd>
              </div>
            ) : (
              <div className="flex flex-col gap-1 rounded-md border border-border-subtle bg-bg-panel p-4">
                <dt className="text-label-m text-text-primary">O*NET Job Zone</dt>
                <dd className="flex flex-wrap items-center gap-1.5 text-body-m text-text-primary">
                  <span>
                    From <span className="font-mono text-mono-m">1</span>, {ZONE_LABEL[1].toLowerCase()}, to{' '}
                    <span className="font-mono text-mono-m">5</span>, {ZONE_LABEL[5].toLowerCase()}.
                  </span>
                  {zoneN !== null && <Citation n={zoneN} />}
                </dd>
                <dd className="text-body-s text-text-muted">
                  The education, training and experience a job needs, as O*NET rates it for US workers. It is the same
                  in both futures and both months.
                </dd>
              </div>
            )}
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p className="flex flex-wrap items-center gap-1.5 font-mono text-mono-s text-text-muted">
              {model.jobs.length} jobs · {snapshot.label} data
              {sources.map((source) => (
                <Citation key={source.n} n={source.n} />
              ))}
              {model.answers ? `· best fit first, ${word} AI Uptake` : '· by Job Zone, then title'}
            </p>
            <ul
              className="flex flex-wrap items-center gap-3 font-mono text-mono-s text-text-muted"
              aria-label="Verdicts"
            >
              {VERDICT_MARKS.map(({ verdict, icon: Icon, tone }) => (
                <li key={verdict} className="inline-flex items-center gap-1">
                  <Icon className={cn('size-3.5 shrink-0 stroke-current', tone)} aria-hidden="true" />
                  {verdict}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <table ref={tableRef} className="w-full border-t border-border-subtle text-left">
          <caption className="sr-only">
            {model.answers
              ? `Jobs ${first + 1} to ${first + shown.length} of ${rows.length}: each job’s fit, AI use, 12-month change, and skill verdicts in ${word} AI Uptake, for ${snapshot.label} data, best fit first.`
              : `Jobs ${first + 1} to ${first + shown.length} of ${rows.length}: each job’s O*NET Job Zone, AI use, 12-month change, and skill verdicts in ${word} AI Uptake, for ${snapshot.label} data, by Job Zone, then title.`}
          </caption>
          <thead className="sticky top-0 z-10 bg-bg-default shadow-[0_1px_0_var(--color-border-subtle)]">
            <tr className="font-mono text-mono-s text-text-muted">
              <th scope="col" className="px-3 py-2 font-normal">
                Job
              </th>
              <th scope="col" className="px-3 py-2 font-normal">
                Group
              </th>
              {model.answers ? (
                header(['Fit'], { sorted: true })
              ) : (
                <th
                  scope="col"
                  aria-sort="ascending"
                  className="whitespace-nowrap px-3 py-2 font-normal text-text-primary"
                >
                  <span className="flex items-center gap-1.5">
                    Job Zone
                    {zoneN !== null && <Citation n={zoneN} />}
                  </span>
                </th>
              )}
              {header(['AI Use,', '12-Month Change'])}
              {header(['Skill Verdicts'], { right: false })}
            </tr>
          </thead>
          <tbody>
            {shown.map((job) => (
              <JobRow
                key={job.code}
                job={job}
                snapshotId={snapshotId}
                scenario={scenario}
                open={open.has(job.code)}
                onToggle={toggle}
                highlight={job.code === target}
                pinned={job.code === focusCode}
                rowRef={job.code === target ? targetRef : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>

      <nav aria-label="Jobs Table Pages" className="flex shrink-0 items-center justify-between gap-3">
        <Button
          variant="secondary"
          aria-disabled={page === 0 || undefined}
          onClick={() => go(page - 1)}
          iconStart={<ChevronLeft className="size-5 stroke-current" aria-hidden="true" />}
          className={cn(pagerButton, 'max-sm:w-11 max-sm:!px-0')}
        >
          <span className="max-sm:sr-only">Previous</span>
          <span className="sr-only"> Page</span>
        </Button>
        <p aria-live="polite" aria-atomic="true" className="text-center font-mono text-mono-s text-text-muted">
          Page {page + 1} of {pages} · rows {first + 1}–{first + shown.length} of {rows.length}
        </p>
        <Button
          variant="secondary"
          aria-disabled={page === pages - 1 || undefined}
          onClick={() => go(page + 1)}
          iconEnd={<ChevronRight className="size-5 stroke-current" aria-hidden="true" />}
          className={cn(pagerButton, 'max-sm:w-11 max-sm:!px-0')}
        >
          <span className="max-sm:sr-only">Next</span>
          <span className="sr-only"> Page</span>
        </Button>
      </nav>
      <p className="sr-only" aria-live="polite">
        {opened}
      </p>

      <div className="shrink-0">
        <SourceList sources={sources} />
      </div>
    </div>
  )
}
