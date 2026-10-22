import type { Corner, Scenario, SourceRef } from '../../demo/types'
import { LevelMeter } from '../../components/kotak/LevelMeter'
import { Reasoning } from '../../components/kotak/Reasoning'
import { SourceReference } from '../../components/kotak/SourceReference'
import { TextLink } from '../../components/ui/TextLink'
import { VerdictChip } from '../../components/ui/VerdictChip'
import { cn } from '../../components/ui/cn'

export interface LandingExampleCardProps {
  corner: Corner
  sources: SourceRef[]
  paused?: boolean
  scenario?: Scenario
  neededLabel?: string
  className?: string
}

export function LandingExampleCard({
  corner,
  sources,
  paused = false,
  scenario = 'slow',
  neededLabel = 'Needed by 2027',
  className
}: LandingExampleCardProps) {
  const needed = scenario === 'slow' ? corner.neededSlow : corner.neededFast
  const displayedSources = sources.slice(0, 2)
  const remainingCount = sources.length - displayedSources.length

  return (
    <article className={cn('surface-card space-y-3 p-4', className)}>
      <header className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-title-s text-text-primary">{corner.name}</h3>
        <VerdictChip verdict={corner.verdict} size="sm" />
      </header>

      <LevelMeter you={corner.you} needed={needed} neededLabel={neededLabel} />

      {corner.reasoning ? <Reasoning text={corner.reasoning} paused={paused} /> : null}

      {displayedSources.length > 0 ? (
        <ul className="space-y-2" aria-label={`Sources for ${corner.name}`}>
          {displayedSources.map((source) => (
            <li key={source.n}>
              <SourceReference source={source} />
            </li>
          ))}
        </ul>
      ) : null}

      {remainingCount > 0 ? (
        <div className="flex justify-center pt-1">
          <TextLink href="#data-sources" className="text-label-s font-semibold">
            +{remainingCount} More Sources
          </TextLink>
        </div>
      ) : null}
    </article>
  )
}
