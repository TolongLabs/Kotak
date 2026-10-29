import type { Scenario } from '@kotak/shared'
import { updateGuestSession, useGuestSession } from './store'

// The AI future the screens show (#389) is the guest session's scenario, so one switch moves every screen: the radar,
// roles, roadmap and job page all read the same value through this hook.
function setScenario(scenario: Scenario) {
  updateGuestSession({ scenario })
}

export function useScenario(): [Scenario, (scenario: Scenario) => void] {
  return [useGuestSession().scenario, setScenario]
}
