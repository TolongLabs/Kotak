import type { Corner, Scenario, SourceRef } from '../../demo/types'
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
}

export function GapCard({
  corner,
  sources,
  paused = false,
  scenario = 'slow',
  neededLabel = 'Needed by 2027'
}: GapCardProps) {
  const needed = scenario === 'slow' ? corner.neededSlow : corner.neededFast

  return (
    <article className="surface-card space-y-3 p-4">
      <header className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-title-s text-text-primary">{corner.name}</h3>
        <VerdictChip verdict={corner.verdict} size="sm" />
      </header>

      <LevelMeter you={corner.you} needed={needed} neededLabel={neededLabel} />

      {corner.reasoning ? <Reasoning text={corner.reasoning} paused={paused} /> : null}

      {sources.length > 0 ? (
        <ul className="space-y-2" aria-label={`Sources for ${corner.name}`}>
          {sources.map((source) => (
            <li key={source.n}>
              <SourceReference source={source} />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
