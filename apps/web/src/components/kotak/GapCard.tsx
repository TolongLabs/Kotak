import { useState } from 'react'
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
  // Two sources up front, as on the landing example card; the rest open and close in place.
  const [showAll, setShowAll] = useState(false)
  const shownSources = showAll ? sources : sources.slice(0, 2)
  const hiddenCount = sources.length - shownSources.length

  return (
    <article className="surface-card space-y-3 p-4">
      <header className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-title-s text-text-primary">{corner.name}</h3>
        <VerdictChip verdict={corner.verdict} size="sm" />
      </header>

      <LevelMeter you={corner.you} needed={needed} neededLabel={neededLabel} />

      {corner.reasoning ? <Reasoning text={corner.reasoning} paused={paused} /> : null}

      {shownSources.length > 0 ? (
        <ul className="space-y-2" aria-label={`Sources for ${corner.name}`}>
          {shownSources.map((source) => (
            <li key={source.n}>
              <SourceReference source={source} />
            </li>
          ))}
        </ul>
      ) : null}

      {sources.length > 2 ? (
        <div className="flex justify-center">
          <button
            type="button"
            aria-expanded={showAll}
            onClick={() => setShowAll((value) => !value)}
            className="inline-flex min-h-11 items-center px-2 text-label-s font-semibold text-text-primary underline decoration-current underline-offset-2 transition-colors duration-150 ease-out hover:text-text-muted"
          >
            {showAll ? 'Show Fewer Sources' : `+${hiddenCount} More Sources`}
          </button>
        </div>
      ) : null}
    </article>
  )
}
