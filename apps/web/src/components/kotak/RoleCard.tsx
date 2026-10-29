import { CircleCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Role } from '../../demo/types'
import { VerdictChip } from '../ui/VerdictChip'
import { cn } from '../ui/cn'

export interface RoleCardProps {
  role: Role
  selected: boolean
  onSelect: () => void
  // The radio group name shared by every card in the list.
  name: string
  // Pinned to the card's bottom edge, so cards in one row line up.
  footer?: ReactNode
  // Why the card is highlighted, in bold above its title.
  note?: string
}

export function RoleCard({ role, selected, onSelect, name, footer, note }: RoleCardProps) {
  return (
    <label
      className={cn(
        'relative flex h-full min-w-0 cursor-pointer flex-col gap-3 rounded-md border-[1.5px] p-4 transition-colors duration-150 ease-out has-[input:focus-visible]:outline has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus-ring',
        selected
          ? 'on-accent border-text-primary bg-accent-box text-accent-on-box'
          : 'border-border-control bg-bg-default hover:bg-bg-panel'
      )}
    >
      <input type="radio" name={name} value={role.id} checked={selected} onChange={onSelect} className="sr-only" />
      {note && <span className="text-body-s font-bold text-text-primary">{note}</span>}
      <div className="flex min-h-12 items-start justify-between gap-3">
        <span className="min-w-0 hyphens-auto text-title-s text-text-primary [overflow-wrap:anywhere]">
          {role.title}
          {role.isCurrentJob && ' (Your Job)'}
        </span>
        <span className="flex shrink-0 items-start gap-2">
          <span className="flex flex-col items-end">
            <span className="text-title-l tabular-nums text-text-primary">{role.fit}%</span>
            {role.fitEstimated ? (
              <span className="font-mono text-mono-s text-text-muted">
                <span aria-hidden="true">est. fit</span>
                <span className="sr-only">estimated fit</span>
              </span>
            ) : (
              <span className="font-mono text-mono-s text-text-muted">fit</span>
            )}
          </span>
          {selected && <CircleCheck className="mt-1 h-5 w-5 stroke-current" aria-hidden="true" />}
        </span>
      </div>
      <span className="flex items-center gap-2">
        <span className="font-mono text-mono-s text-text-muted">Outlook</span>
        <VerdictChip verdict={role.outlook} size="sm" />
      </span>
      <span
        aria-hidden="true"
        className={cn('h-2 w-full overflow-hidden rounded-full', selected ? 'bg-bg-default' : 'bg-bg-panel')}
      >
        <span className="block h-full rounded-full bg-text-primary" style={{ width: `${role.fit}%` }} />
      </span>
      <span className="text-body-s text-text-primary">
        {role.missing ? `Missing: ${role.missing}` : 'No gaps to close'}
      </span>
      {footer && <span className="mt-auto pt-1">{footer}</span>}
    </label>
  )
}
