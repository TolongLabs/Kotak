import { useEffect, useId, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { SourceRef } from '../../demo/types'
import { commonText } from '../../i18n/common'
import { useText } from '../../i18n/text'
import { SourceReference } from './SourceReference'

/** A folded list of numbered sources. It opens when the user expands it or follows a citation to one of its entries. */
export function SourceList({
  sources,
  label,
  variant = 'card'
}: {
  sources: SourceRef[]
  label?: string
  /** rule: a ruled row inside another card, in place of a card of its own. */
  variant?: 'card' | 'rule'
}) {
  const common = useText(commonText)
  const resolvedLabel = label ?? common.sources
  const panelId = useId()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const reveal = () => {
      const n = Number(window.location.hash.match(/^#source-(\d+)$/)?.[1])
      if (!sources.some((source) => source.n === n)) return
      setOpen(true)
      requestAnimationFrame(() => document.getElementById(`source-${n}`)?.scrollIntoView({ block: 'center' }))
    }
    reveal()
    window.addEventListener('hashchange', reveal)
    return () => window.removeEventListener('hashchange', reveal)
  }, [sources])

  if (sources.length === 0) return null
  const ToggleIcon = open ? Minus : Plus

  return (
    <section className={variant === 'card' ? 'surface-card rounded-md' : 'border-t border-border-subtle'}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-[44px] w-full items-center justify-between gap-4 py-3 text-left text-text-primary ${
          variant === 'card' ? 'px-4 text-label-l' : 'text-label-m'
        }`}
      >
        {resolvedLabel} ({sources.length})
        <ToggleIcon className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
      </button>
      {open && (
        <div
          id={panelId}
          className="divide-y divide-border-subtle border-t border-border-subtle [&>div]:rounded-none [&>div]:border-0 [&>div:last-child]:rounded-b-[calc(var(--radius-md)-1px)]"
        >
          {sources.map((source) => (
            <SourceReference key={source.n} source={source} />
          ))}
        </div>
      )}
    </section>
  )
}
