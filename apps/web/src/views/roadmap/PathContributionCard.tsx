import { SdgTargetChip } from '../../components/kotak/SdgReasonChip'
import { SdgChip } from '../../components/ui/SdgChip'
import { useSdgReasons } from '../../engine/bundle'
import { roadmapText, type SdgReasonKey } from '../../i18n/messages/roadmap'
import { useText } from '../../i18n/text'
import { fmt, pathTargetTotals, type TimelineStep } from './planSupport'

// What This Path Contributes To (#391): the plan's SDG targets summed over its steps, each with how many steps and
// estimated hours build it and its one-line reason. It is worked out from the plan's own steps, so it changes with
// the role, the hours a week and anything else that changes the steps. Its goal chips are the Impact Area pick: one
// highlights its goal here and on the steps.

export function PathContributionCard({
  steps,
  impactArea,
  goals,
  onSelectGoal
}: {
  steps: TimelineStep[]
  impactArea: number | null
  goals: number[]
  onSelectGoal: (goal: number | null) => void
}) {
  const t = useText(roadmapText)
  const reasons = useSdgReasons()
  const rows = pathTargetTotals(steps)
  if (rows.length === 0) return null
  const planHours = steps.reduce((sum, step) => sum + step.totalHours, 0)
  const shared = steps.some((step) => (step.sdgTargets?.length ?? 0) > 1)

  return (
    <section
      aria-labelledby="path-contribution-title"
      className="space-y-4 rounded-md border border-border-subtle bg-bg-panel p-5"
    >
      <div className="space-y-1">
        <h2 id="path-contribution-title" className="text-title-s text-text-primary">
          {t.path.title}
        </h2>
        <p className="text-body-s text-text-muted">
          {t.path.description(rows.length, steps.length, fmt(planHours), shared)}
        </p>
      </div>
      {goals.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-x-1 gap-y-0"
          role="group"
          aria-label={t.controls.filterStepsByImpact}
        >
          <span className="mr-1 font-mono text-mono-s text-text-muted">{t.controls.highlightStepsBySdg}</span>
          {/* Every chip is 24 px, All included; each sits in a 44 px target. */}
          <button
            type="button"
            aria-pressed={impactArea === null}
            onClick={() => onSelectGoal(null)}
            className="inline-flex min-h-11 items-center rounded-full p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <span
              className={`inline-flex items-center rounded-full border px-3 py-[3px] text-label-s ${
                impactArea === null
                  ? 'border-text-primary bg-text-primary text-bg-default'
                  : 'border-border-control bg-bg-default text-text-primary hover:bg-bg-panel'
              }`}
            >
              {t.controls.showAll}
            </span>
          </button>
          {goals.map((goal) => (
            <button
              key={goal}
              type="button"
              aria-pressed={impactArea === goal}
              onClick={() => onSelectGoal(goal)}
              className="inline-flex min-h-11 items-center rounded-full p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <SdgChip
                goal={goal}
                className={impactArea === goal ? 'outline outline-2 outline-offset-2 outline-text-primary' : undefined}
              />
            </button>
          ))}
        </div>
      )}
      <ul className="grid gap-3 lg:grid-cols-3">
        {rows.map(([target, total]) => (
          <li
            key={target}
            className={`space-y-2 rounded-md border border-border-subtle bg-bg-default p-4 ${
              impactArea !== null && target.startsWith(`${impactArea}.`)
                ? 'ring-2 ring-text-primary ring-offset-2 ring-offset-bg-default'
                : ''
            }`}
          >
            <div className="flex flex-col items-start gap-1.5">
              <SdgTargetChip target={target} />
              <p className="font-mono text-mono-s text-text-muted">{t.path.stepHours(total.steps, fmt(total.hours))}</p>
            </div>
            {reasons.status === 'ready' && (
              <p className="text-body-s text-text-primary">
                {t.sdg.reasons[target as SdgReasonKey] ?? reasons.data.targets[target]?.reason}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
