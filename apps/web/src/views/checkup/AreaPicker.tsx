import { MAX_AREAS, type BundlePathways } from '@kotak/shared'
import { Check } from 'lucide-react'
import { cn } from '../../components/ui/cn'

// Up to three areas the user is drawn to (#284): the digital areas first, then the rest of the world of work.

export function AreaPicker({
  areas,
  selected,
  onChange
}: {
  areas: BundlePathways['areas']
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const full = selected.length >= MAX_AREAS
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((other) => other !== id) : full ? selected : [...selected, id])
  const groups: { label: string; areas: BundlePathways['areas'] }[] = [
    { label: 'Digital and Tech', areas: areas.filter((area) => area.group === 'digital') },
    { label: 'Other Fields', areas: areas.filter((area) => area.group === 'other') }
  ]
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.label} className="space-y-2" role="group" aria-label={group.label}>
          <h3 className="text-label-m text-text-muted">{group.label}</h3>
          <div className="flex flex-wrap gap-2">
            {group.areas.map((area) => {
              const on = selected.includes(area.id)
              return (
                <button
                  key={area.id}
                  type="button"
                  aria-pressed={on}
                  disabled={!on && full}
                  title={area.description}
                  onClick={() => toggle(area.id)}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] px-3 py-2 text-label-m transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50',
                    on
                      ? 'border-text-primary bg-accent-box text-accent-on-box'
                      : 'border-border-control bg-bg-default text-text-primary hover:bg-bg-panel'
                  )}
                >
                  {on && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  {area.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <p className="text-body-s text-text-muted" aria-live="polite">
        {selected.length} of {MAX_AREAS} picked.
      </p>
    </div>
  )
}
