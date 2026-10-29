import { PACE_MAX, PACE_MIN, type Pace, type UsageAnchors } from '@kotak/shared'
import { ScenarioMathsNote } from '../../components/kotak/ScenarioMathsNote'

/** The pace rule in plain rows: three inputs, each with its multiplier, and the bounded product. */
export function PaceMathsCard({ pace, scenarioAnchors }: { pace: Pace; scenarioAnchors?: UsageAnchors }) {
  return (
    <section
      id="pace-maths"
      tabIndex={-1}
      aria-labelledby="pace-maths-title"
      className="scroll-mt-24 space-y-3 rounded-md border border-border-subtle bg-bg-default p-4"
    >
      <h2 id="pace-maths-title" className="text-title-s text-text-primary">
        See the Maths
      </h2>
      <p className="font-mono text-mono-s font-medium text-text-primary">Your pace</p>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-body-s text-text-primary">
        {pace.inputs.map((input) => (
          <div key={input.label} className="contents">
            <dt>
              {input.label}
              <span className="block text-label-s text-text-muted">{input.value}</span>
            </dt>
            <dd className="text-right font-mono text-mono-s">×{input.factor.toFixed(2)}</dd>
          </div>
        ))}
        <dt className="border-t border-text-primary pt-2 font-semibold">Pace factor</dt>
        <dd className="border-t border-text-primary pt-2 text-right font-mono text-mono-s font-semibold">
          {pace.factor.toFixed(2)}x
        </dd>
      </dl>
      <p className="text-label-s text-text-muted">
        Kept between {PACE_MIN}x and {PACE_MAX}x. {pace.maths[pace.maths.length - 1]} Unknown answers count as 1.00. A
        fixed rule; no AI sets it.
      </p>
      {pace.refresher && (
        <p className="text-label-s text-text-muted">
          Refresher step added because you are returning to work: {pace.refresher.hours} fixed hours, not scaled by the
          factor.
        </p>
      )}
      {scenarioAnchors && (
        <div className="border-t border-border-subtle pt-3">
          <ScenarioMathsNote anchors={scenarioAnchors} />
        </div>
      )}
    </section>
  )
}
