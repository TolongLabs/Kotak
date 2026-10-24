import { cn } from '../ui/cn'

export interface LevelMeterProps {
  you: number
  needed: number
  neededLabel?: string
}

function MeterLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="shrink-0 font-mono text-mono-s text-text-muted">{label}</span>
      <span className="flex shrink-0 items-center gap-1">
        {[1, 2, 3].map((level) => {
          const fill = Math.min(1, Math.max(0, value - level + 1))
          return (
            <span
              key={level}
              className={cn(
                'relative h-2 w-6 overflow-hidden rounded-full border bg-bg-panel',
                fill > 0 ? 'border-text-primary' : 'border-border-subtle'
              )}
            >
              <span className="absolute inset-y-0 left-0 bg-accent-box" style={{ width: `${fill * 100}%` }} />
            </span>
          )
        })}
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
