import type { BundleRole } from '@kotak/shared'
import { useState } from 'react'
import { Citation } from '../ui/Citation'

// The software and tools employers name for a role (#284), from O*NET's Hot Technologies: the ones O*NET marks In
// Demand, or without any, the first hot ones. The skill corners say what the work is; this says what it's done
// with. O*NET lists them alphabetically, so the card shows the first 12 and folds the rest.

const FOLDED = 12

export function ToolsCard({
  role,
  sourceNumber,
  heading = 'Tools Employers Name'
}: {
  role: Pick<BundleRole, 'onet_code' | 'title' | 'tools'>
  sourceNumber: number
  heading?: string
}) {
  const [open, setOpen] = useState(false)
  if (!role.tools.length) return null
  const titleId = `tools-${role.onet_code}`
  const inDemand = role.tools.some((tool) => tool.in_demand)
  const shown = open ? role.tools : role.tools.slice(0, FOLDED)
  return (
    <section aria-labelledby={titleId} className="surface-card space-y-3 p-4">
      <header className="flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-title-s text-text-primary">
          {heading}
        </h2>
        <Citation n={sourceNumber} />
      </header>
      <p className="text-body-s text-text-muted">
        {inDemand
          ? `Software in demand in job postings for ${role.title}, from O*NET, in alphabetical order.`
          : `Software that job postings for ${role.title} often name, from O*NET.`}{' '}
        US postings; Malaysian job ads, where Kotak has them, show what employers here ask for.
      </p>
      <ul className="flex flex-wrap gap-2" aria-label={`Tools for ${role.title}`}>
        {shown.map((tool) => (
          <li
            key={tool.name}
            className="inline-flex max-w-full items-center rounded-full border border-border-control bg-bg-default px-3 py-1 text-body-s text-text-primary"
          >
            <span className="min-w-0 break-words">{tool.name}</span>
          </li>
        ))}
      </ul>
      {role.tools.length > FOLDED && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-h-11 items-center text-label-m font-semibold text-text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {open ? 'Show Fewer' : `Show All ${role.tools.length}`}
        </button>
      )}
    </section>
  )
}
