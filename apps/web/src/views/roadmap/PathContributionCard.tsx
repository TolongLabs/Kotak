import { SdgTargetChip } from '../../components/kotak/SdgReasonChip'
import { useSdgReasons } from '../../engine/bundle'
import { fmt, type TimelineStep } from './planSupport'

// What This Path Contributes To (#391): the plan's SDG targets summed over its steps, each with how many steps and
// estimated hours build it and its one-line reason. It is worked out from the plan's own steps, so it changes with
// the role, the hours a week and anything else that changes the steps. The Impact Area pick highlights its goal here
// as it does on the steps.

export function PathContributionCard({ steps, impactArea }: { steps: TimelineStep[]; impactArea: number | null }) {
  const reasons = useSdgReasons()
  const totals = new Map<string, { steps: number; hours: number }>()
  for (const step of steps) {
    for (const target of new Set(step.sdgTargets ?? [])) {
      const total = totals.get(target) ?? { steps: 0, hours: 0 }
      totals.set(target, { steps: total.steps + 1, hours: total.hours + step.totalHours })
    }
  }
  if (totals.size === 0) return null
  const rows = [...totals].sort(([, left], [, right]) => right.hours - left.hours || right.steps - left.steps)
  const planHours = steps.reduce((sum, step) => sum + step.totalHours, 0)
  const shared = steps.some((step) => (step.sdgTargets?.length ?? 0) > 1)

  return (
    <section
      aria-labelledby="path-contribution-title"
      className="space-y-4 rounded-md border border-border-subtle bg-bg-default p-5"
    >
      <div className="space-y-1">
        <h2 id="path-contribution-title" className="text-title-s text-text-primary">
          What This Path Contributes To
        </h2>
        <p className="text-body-s text-text-muted">
          The UN SDG {rows.length === 1 ? 'target' : 'targets'} your {steps.length}{' '}
          {steps.length === 1 ? 'step builds' : 'steps build'} toward, from about {fmt(planHours)} learning hours.
          {shared && ' A step tagged with two targets counts toward each.'}
        </p>
      </div>
      <ul className="grid gap-3 lg:grid-cols-2">
        {rows.map(([target, total]) => (
          <li
            key={target}
            className={`space-y-2 rounded-md border border-border-subtle bg-bg-panel p-4 ${
              impactArea !== null && target.startsWith(`${impactArea}.`)
                ? 'ring-2 ring-text-primary ring-offset-2 ring-offset-bg-default'
                : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SdgTargetChip target={target} />
              <p className="font-mono text-mono-m text-text-primary">
                {total.steps} {total.steps === 1 ? 'step' : 'steps'} · about {fmt(total.hours)} h
              </p>
            </div>
            {reasons.status === 'ready' && (
              <p className="text-body-s text-text-primary">{reasons.data.targets[target]?.reason}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
