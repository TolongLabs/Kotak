import { FAST_CONVERGENCE, type Scenario, type UsageAnchors } from '@kotak/shared'
import { Check, Info } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { ScenarioSwitch } from '../ui/ScenarioSwitch'
import { changesText } from '../../i18n/messages/changes'
import { useText } from '../../i18n/text'
import { cn } from '../ui/cn'

/** What the other future would change on this screen (in Slow), and what it did change (in Fast). */
export type FutureReceipt = Record<Scenario, string>

/**
 * The one AI-futures switch (#389), in the header of every screen that projects ahead: Radar, Roles, Roadmap and the
 * job page. One flip moves all four, because they all read the guest session's scenario. It names the choice, says
 * what each future means in the 3D space's own words, and reports what a switch changes, since a 1-point move is
 * otherwise invisible. The compact form sits in the Roadmap's plan island, which shows the result itself.
 */
export function ScenarioControl({
  scenario,
  onChange,
  receipt,
  trailing,
  anchors,
  compact = false,
  className
}: {
  scenario: Scenario
  onChange: (scenario: Scenario) => void
  receipt?: FutureReceipt
  /** A link at the bar's end, such as the 3D space. */
  trailing?: ReactNode
  /** Malaysia's and Singapore's usage index, for the ruler under What Changes. */
  anchors?: UsageAnchors
  compact?: boolean
  className?: string
}) {
  const t = useText(changesText)
  const explainId = useId()
  const [explain, setExplain] = useState(false)

  if (compact) {
    return (
      <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
        <span className="flex items-center gap-2 text-label-m text-text-primary">
          {t.scenarioChoiceShort}
          <EstimateTag />
        </span>
        <ScenarioSwitch
          value={scenario}
          onChange={onChange}
          aria-label={t.scenarioChoice}
          descriptions={t.scenarioLinesShort}
        />
      </div>
    )
  }

  const ReceiptIcon = scenario === 'fast' ? Check : Info
  return (
    <section
      aria-label={t.scenarioChoice}
      className={cn('rounded-md border border-border-subtle bg-bg-panel p-3', className)}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
        <div className="flex shrink-0 flex-col items-start gap-0.5">
          <span className="flex items-center gap-2 text-label-m text-text-primary">
            {t.scenarioChoice}
            <EstimateTag />
          </span>
          <button
            type="button"
            aria-expanded={explain}
            aria-controls={explainId}
            onClick={() => setExplain((value) => !value)}
            className="inline-flex min-h-6 items-center gap-1 rounded-sm text-label-s text-text-primary underline underline-offset-2 hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Info className="h-3.5 w-3.5 shrink-0 stroke-current" aria-hidden="true" />
            {t.whatChanges}
          </button>
        </div>
        <ScenarioSwitch
          value={scenario}
          onChange={onChange}
          aria-label={t.scenarioChoice}
          descriptions={t.scenarioLines}
          className="w-full lg:w-[26rem] lg:shrink-0"
        />
        {receipt && (
          <p role="status" className="flex min-w-0 flex-1 items-start gap-1.5 text-body-s text-text-primary">
            <ReceiptIcon
              className={cn('mt-0.5 h-4 w-4 shrink-0 stroke-current', scenario === 'fast' && 'text-state-success')}
              aria-hidden="true"
            />
            <span className={scenario === 'fast' ? 'font-semibold' : undefined}>{receipt[scenario]}</span>
          </p>
        )}
        {trailing && <div className="shrink-0 lg:ml-auto">{trailing}</div>}
      </div>
      <div id={explainId} hidden={!explain} className="mt-3 space-y-2 border-t border-border-subtle pt-3">
        {anchors && <UsageRuler anchors={anchors} />}
        <p className="max-w-[65ch] text-body-s text-text-primary">{t.estimatesOnly}</p>
      </div>
    </section>
  )
}

/** Both futures are estimates, so the switch always says so where it stands (DESIGN.md content rules). */
function EstimateTag() {
  const t = useText(changesText)
  return (
    <span className="rounded-full border border-border-control px-2 py-0.5 font-mono text-mono-s text-text-muted">
      {t.estimateTag}
    </span>
  )
}

/** Malaysia's AI usage index today, where the fast future puts it, and Singapore's, on one scale from the data. */
function UsageRuler({ anchors }: { anchors: UsageAnchors }) {
  const t = useText(changesText)
  const mys = anchors.mys.value
  const sgp = anchors.sgp.value
  const fast = mys + FAST_CONVERGENCE * (sgp - mys)
  const max = Math.ceil(Math.max(sgp, mys))
  const x = (value: number) => 48 + (value / max) * 264
  const marks = [
    { value: mys, top: `${t.scenarioShort.slow} · ${mys}`, bottom: t.rulerMalaysia },
    { value: fast, top: t.scenarioShort.fast, bottom: t.rulerHalfway },
    { value: sgp, top: String(sgp), bottom: t.rulerSingapore }
  ]
  return (
    <figure className="space-y-1">
      <figcaption className="text-label-m text-text-primary">{t.rulerTitle}</figcaption>
      <svg viewBox="0 0 360 60" className="h-auto w-full max-w-[25rem]" role="img" aria-label={t.rulerLabel(mys, sgp)}>
        <line x1="8" y1="30" x2="352" y2="30" stroke="var(--color-border-control)" strokeWidth="2" />
        <line x1={x(mys)} y1="30" x2={x(fast)} y2="30" stroke="var(--color-text-primary)" strokeWidth="4" />
        <circle
          cx={x(mys)}
          cy="30"
          r="6"
          fill="var(--color-bg-default)"
          stroke="var(--color-text-primary)"
          strokeWidth="2"
        />
        <rect
          x={x(fast) - 6}
          y="24"
          width="12"
          height="12"
          transform={`rotate(45 ${x(fast)} 30)`}
          fill="var(--color-accent-box)"
          stroke="var(--color-text-primary)"
          strokeWidth="2"
        />
        <circle cx={x(sgp)} cy="30" r="6" fill="var(--color-text-primary)" />
        {marks.map((mark) => (
          <g
            key={mark.bottom}
            fontSize="11"
            textAnchor="middle"
            fill="var(--color-text-primary)"
            fontFamily="var(--font-mono)"
          >
            <text x={x(mark.value)} y="13">
              {mark.top}
            </text>
            <text x={x(mark.value)} y="55">
              {mark.bottom}
            </text>
          </g>
        ))}
      </svg>
      <p className="font-mono text-mono-s text-text-muted">{anchors.mys.source_name}</p>
    </figure>
  )
}
