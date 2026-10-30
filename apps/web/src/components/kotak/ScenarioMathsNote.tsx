import { fastGrowthMultiplier, type UsageAnchors } from '@kotak/shared'
import { commonText } from '../../i18n/common'
import { changesText } from '../../i18n/messages/changes'
import { useText } from '../../i18n/text'

/**
 * The fast future's one rule in plain words (#389), quoted in See the Maths on the Roles and Roadmap screens. The
 * multiplier and both anchors come from the data, never typed in by hand: `fastGrowthMultiplier` in
 * `packages/shared/src/rules/verdicts.ts` moves Malaysia's usage index halfway to Singapore's (FAST_CONVERGENCE = 0.5).
 */
export function ScenarioMathsNote({ anchors }: { anchors: UsageAnchors }) {
  const t = useText(changesText)
  const c = useText(commonText)
  const multiplier = fastGrowthMultiplier(anchors)

  return (
    <p className="text-label-s text-text-muted">
      {t.mathsBefore(c.scenarios.fast, anchors.mys.value, anchors.sgp.value, anchors.mys.source_name)}{' '}
      <span className="font-mono text-mono-s text-text-primary">{multiplier.toFixed(2)}x</span>
      {t.mathsAfter}
    </p>
  )
}
