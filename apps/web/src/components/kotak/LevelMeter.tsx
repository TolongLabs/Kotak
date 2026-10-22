import type { Level } from '../../demo/types'
import { cn } from '../ui/cn'

export interface LevelMeterProps {
  you: Level
  needed: 1 | 2 | 3
  neededLabel?: string
}

function MeterLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="shrink-0 font-mono text-mono-s text-text-muted">{label}</span>
      <span className="flex shrink-0 items-center gap-1">
        {[1, 2, 3].map((level) => (
          <span
            key={level}
            className={cn(
              'h-2 w-6 rounded-full border',
              level <= value ? 'border-text-primary bg-accent-box' : 'border-border-subtle bg-bg-panel'
            )}
          />
        ))}
      </span>
    </div>
  )
}

export function LevelMeter({ you, needed, neededLabel = 'Needed by 2027' }: LevelMeterProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <MeterLine label="You" value={you} />
      <MeterLine label={neededLabel} value={needed} />
      <span className="sr-only">
        You level {you} of 3. Needed level {needed} of 3.
      </span>
    </div>
  )
}
