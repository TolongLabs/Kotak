import { fastGrowthMultiplier, type UsageAnchors } from '@kotak/shared'

/**
 * The fast future's one rule in plain words (#389), quoted in See the Maths on the Roles and Roadmap screens. The
 * multiplier and both anchors come from the data, never typed in by hand: `fastGrowthMultiplier` in
 * `packages/shared/src/rules/verdicts.ts` moves Malaysia's usage index halfway to Singapore's (FAST_CONVERGENCE = 0.5).
 */
export function ScenarioMathsNote({ anchors }: { anchors: UsageAnchors }) {
  const multiplier = fastGrowthMultiplier(anchors)

  return (
    <p className="text-label-s text-text-muted">
      Fast AI Uptake is an estimate with one assumption: Malaysia’s AI usage index ({anchors.mys.value}) moves halfway
      to Singapore’s ({anchors.sgp.value}), from {anchors.mys.source_name}. So growing AI use grows{' '}
      <span className="font-mono text-mono-s text-text-primary">{multiplier.toFixed(2)}x</span> faster, and shrinking
      use shrinks that much slower. Verdicts stay the same in both futures.
    </p>
  )
}
