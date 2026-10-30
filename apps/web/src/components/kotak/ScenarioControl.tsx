import type { Scenario } from '@kotak/shared'
import { ScenarioSwitch } from '../ui/ScenarioSwitch'
import { changesText } from '../../i18n/messages/changes'
import { useText } from '../../i18n/text'
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
  const t = useText(changesText)
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5', className)}>
      <ScenarioSwitch value={scenario} onChange={onChange} aria-label={t.scenarioChoice} />
      <p className="text-label-s text-text-muted">{t.scenarioNote}</p>
    </div>
  )
}
