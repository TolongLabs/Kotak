import type { Scenario } from '@kotak/shared'
import { ScenarioSwitch } from '../ui/ScenarioSwitch'
import { cn } from '../ui/cn'

/**
 * The one AI-futures switch (#389), in the header of every screen that projects ahead: Radar, Roles, Roadmap and the
 * job page. One flip moves all four, because they all read the guest session's scenario. Its caption is the one label
 * that marks the values it moves as estimates.
 */
export function ScenarioControl({
  scenario,
  onChange,
  className
}: {
  scenario: Scenario
  onChange: (scenario: Scenario) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5', className)}>
      <ScenarioSwitch value={scenario} onChange={onChange} aria-label="AI Uptake Scenario" />
      <p className="text-label-s text-text-muted">Estimate: the targets, fit and levels here follow this choice.</p>
    </div>
  )
}
