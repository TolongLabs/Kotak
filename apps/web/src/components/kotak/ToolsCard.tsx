import type { BundleRole } from '@kotak/shared'
import { useState } from 'react'
import { Citation } from '../ui/Citation'
import { Disclosure } from '../ui/Disclosure'
import { roadmapText } from '../../i18n/messages/roadmap'
import { useText } from '../../i18n/text'

// The software and tools employers name for a role (#284), from O*NET's Hot Technologies: the ones O*NET marks In
// Demand, or without any, the first hot ones. The skill corners say what the work is; this says what it's done
// with. O*NET lists them alphabetically, so the card shows the first 12 and folds the rest.

const FOLDED = 12

export function ToolsCard({
  role,
  sourceNumber,
  heading,
  embedded = false,
  folded = false
}: {
  role: Pick<BundleRole, 'onet_code' | 'title' | 'tools'>
  sourceNumber: number
  heading?: string
  /** Inside another card or fold: no card of its own, and a smaller heading. */
  embedded?: boolean
  /** A closed fold of its own, titled with the heading and the count. */
  folded?: boolean
}) {
  const t = useText(roadmapText)
  const [open, setOpen] = useState(false)
  if (!role.tools.length) return null
  const titleId = `tools-${role.onet_code}`
  const title = heading ?? t.tools.employersName
  const inDemand = role.tools.some((tool) => tool.in_demand)
  const shown = open ? role.tools : role.tools.slice(0, FOLDED)

  const body = (
    <>
      <p className="text-body-s text-text-muted">
        {inDemand ? t.tools.inDemand(role.title) : t.tools.oftenNamed(role.title)} {t.tools.usAndMalaysia}
        {folded && (
          <>
            {' '}
            <Citation n={sourceNumber} />
          </>
        )}
      </p>
      <ul className="flex flex-wrap gap-2" aria-label={t.tools.listLabel(role.title)}>
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
          {open ? t.tools.showFewer : t.tools.showAll(role.tools.length)}
        </button>
      )}
    </>
  )

  if (folded) {
    return (
      <Disclosure variant="card" title={`${title} (${role.tools.length})`}>
        <div className="space-y-3">{body}</div>
      </Disclosure>
    )
  }

  return (
    <section aria-labelledby={titleId} className={embedded ? 'space-y-3' : 'surface-card space-y-3 p-4'}>
      <header className="flex items-start justify-between gap-3">
        <h2 id={titleId} className={embedded ? 'text-label-m text-text-primary' : 'text-title-s text-text-primary'}>
          {title}
        </h2>
        <Citation n={sourceNumber} />
      </header>
      {body}
    </section>
  )
}
