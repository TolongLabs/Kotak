import { Clock3 } from 'lucide-react'
import { Citation } from '../../components/ui/Citation'
import { Button } from '../../components/ui/Button'
import { fmt } from './planSupport'

export interface FreeUpTimeTask {
  id: string
  name: string
  weeklyHoursSaved: number
}

interface FreeUpTimeCardProps {
  /** Null: the dividend has no source-backed estimate for this role. */
  estimate: {
    weeklyHoursSaved: number
    tasks: FreeUpTimeTask[]
    citations: number[]
  } | null
  currentWeeklyHours: number
  /** The Weekly Hours cap reached via Use Time For My Plan; null when there's nothing to add. */
  proposedWeeklyHours: number | null
  readyWeekBefore: number | null
  readyWeekAfter: number | null
  planWeeks: number
  onApply: () => void
}

function resultLine(applied: boolean, before: number | null, after: number | null, planWeeks: number): string | null {
  if (before === 0 || after === 0) return 'Already at least 80% Fit'
  if (!applied) {
    if (after !== null && before !== null && after !== before) return `80% Fit by Week ${after}, Was Week ${before}`
    if (after !== null && before === null) return `80% Fit by Week ${after} · Was Below 80%`
    if (after !== null) return `80% Fit by Week ${after} With These Hours`
    if (before !== null) return `80% Fit by Week ${before} With Current Hours`
    return `Below 80% Fit Within ${planWeeks} Weeks`
  }
  if (before !== null) return `80% Fit by Week ${before}`
  return `Below 80% Fit Within ${planWeeks} Weeks`
}

export function FreeUpTimeCard({
  estimate,
  currentWeeklyHours,
  proposedWeeklyHours,
  readyWeekBefore,
  readyWeekAfter,
  planWeeks,
  onApply
}: FreeUpTimeCardProps) {
  if (!estimate) {
    return (
      <section aria-labelledby="free-time-title" className="space-y-2">
        <div className="space-y-2 rounded-md border-[1.5px] border-text-primary bg-accent-box p-4 text-accent-on-box">
          <h3 id="free-time-title" className="flex items-center gap-2 text-label-l">
            <Clock3 className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
            Free Up Time With AI
          </h3>
          <p className="text-body-s">There is no source-backed estimate of time saved for this role yet.</p>
        </div>
      </section>
    )
  }

  const total = estimate.weeklyHoursSaved
  const hasTasks = estimate.tasks.length > 0
  const canApply = proposedWeeklyHours !== null && proposedWeeklyHours > currentWeeklyHours + 0.001
  const appliedNow = proposedWeeklyHours !== null && proposedWeeklyHours <= currentWeeklyHours + 0.001
  const line = canApply
    ? resultLine(false, readyWeekBefore, readyWeekAfter, planWeeks)
    : resultLine(appliedNow, readyWeekBefore, readyWeekAfter, planWeeks)

  return (
    <section aria-labelledby="free-time-title" className="space-y-2">
      <div className="space-y-3 rounded-md border-[1.5px] border-text-primary bg-accent-box p-4 text-accent-on-box">
        <h3 id="free-time-title" className="flex items-center gap-2 text-label-l">
          <Clock3 className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
          Free Up Time With AI
        </h3>

        {hasTasks ? (
          <ul className="space-y-1.5">
            {estimate.tasks.map((task) => (
              <li key={task.id} className="flex items-baseline justify-between gap-3 text-body-s">
                <span className="min-w-0">{task.name}</span>
                <span className="shrink-0 font-mono text-mono-s">-{fmt(task.weeklyHoursSaved)} h</span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="text-title-s">
          About {fmt(total)} h a week
          <span className="text-body-s"> goes free with AI on tasks like these.</span>
        </p>

        {line && <p className="text-label-m">{line}</p>}

        {canApply && (
          <Button variant="inverse" onClick={onApply} className="w-full justify-center">
            Use {fmt(total)} h a Week for My Plan
          </Button>
        )}

        {estimate.citations.length > 0 && (
          <p className="flex flex-wrap items-center gap-1.5 text-label-s">
            Source: Anthropic Economic Index
            {estimate.citations.map((citation) => (
              <Citation key={citation} n={citation} />
            ))}
          </p>
        )}
      </div>
    </section>
  )
}
