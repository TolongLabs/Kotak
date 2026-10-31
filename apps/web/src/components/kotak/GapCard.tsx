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
}

// The verdict, the levels and the one-line why up front; the sources one tap away, since every citation in the why
// also opens All Sources. The list under the cards prints the rules footer once (ReasoningFooter).
export function GapCard({ corner, sources, paused = false, scenario = 'slow', neededLabel, aside }: GapCardProps) {
  const t = useText(radarText)
  const common = useText(commonText)
  const needed = scenario === 'slow' ? corner.neededSlow : corner.neededFast

  return (
    <article className={cn('surface-card space-y-3 px-4 pt-4', sources.length === 0 && 'pb-4')}>
      <header className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-title-s text-text-primary">{corner.name}</h3>
        <VerdictChip verdict={corner.verdict} size="sm" />
      </header>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <LevelMeter you={corner.you} needed={needed} neededLabel={neededLabel} />
        {aside}
      </div>

      {corner.reasoning ? <Reasoning text={corner.reasoning} paused={paused} compact /> : null}

      {sources.length > 0 ? (
        <Disclosure title={`${common.sources} (${sources.length})`}>
          <ul className="space-y-2" aria-label={t.sourcesFor(corner.name)}>
            {sources.map((source) => (
              <li key={source.n}>
                <SourceReference source={source} />
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}
    </article>
  )
}
