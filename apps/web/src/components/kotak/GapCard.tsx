import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Corner, Scenario, SourceRef } from '../../demo/types'
import { commonText } from '../../i18n/common'
import { radarText } from '../../i18n/messages/radar'
import { useText } from '../../i18n/text'
import { Disclosure } from '../ui/Disclosure'
import { cn } from '../ui/cn'
import { Reasoning } from './Reasoning'
import { SourceReference } from './SourceReference'
import { LevelMeter } from './LevelMeter'
import { VerdictChip } from '../ui/VerdictChip'

export interface GapCardProps {
  corner: Corner
  sources: SourceRef[]
  paused?: boolean
  scenario?: Scenario
  neededLabel?: string
  /** Beside the level meter, such as the SDG targets that closing the gap supports. */
  aside?: ReactNode
  /** The Interpret row under the sources: opens Ask Kopi to explain the gap. Left out, there is no row. */
  onInterpret?: () => void
}

// The verdict, the levels and the one-line why up front; the sources one tap away, since every citation in the why
// also opens All Sources. The list under the cards prints the rules footer once (ReasoningFooter).
export function GapCard({
  corner,
  sources,
  paused = false,
  scenario = 'slow',
  neededLabel,
  aside,
  onInterpret
}: GapCardProps) {
  const t = useText(radarText)
  const common = useText(commonText)
  const needed = scenario === 'slow' ? corner.neededSlow : corner.neededFast

  return (
    <article className={cn('surface-card space-y-3 px-4 pt-4', sources.length === 0 && !onInterpret && 'pb-4')}>
      <header className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-title-s text-text-primary">{corner.name}</h3>
        <VerdictChip verdict={corner.verdict} size="sm" />
      </header>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <LevelMeter you={corner.you} needed={needed} neededLabel={neededLabel} />
        {aside}
      </div>

      {corner.reasoning ? <Reasoning text={corner.reasoning} paused={paused} compact /> : null}

      {/* Sources and Interpret stack as ruled rows, flush with each other. */}
      {(sources.length > 0 || onInterpret) && (
        <div>
          {sources.length > 0 && (
            <Disclosure title={`${common.sources} (${sources.length})`}>
              <ul className="space-y-2" aria-label={t.sourcesFor(corner.name)}>
                {sources.map((source) => (
                  <li key={source.n}>
                    <SourceReference source={source} />
                  </li>
                ))}
              </ul>
            </Disclosure>
          )}
          {onInterpret && (
            <button
              type="button"
              onClick={onInterpret}
              aria-label={t.interpretFor(corner.name)}
              aria-haspopup="dialog"
              className="flex min-h-11 w-full items-center justify-between gap-4 border-t border-border-subtle py-3 text-left text-label-m text-text-primary transition-colors duration-150 ease-out hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {t.interpret}
              <ArrowUpRight className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </article>
  )
}
