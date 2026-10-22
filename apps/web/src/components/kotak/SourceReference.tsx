import { ExternalLink } from 'lucide-react'
import type { SourceRef } from '../../demo/types'

export function SourceReference({ source }: { source: SourceRef }) {
  return (
    <div
      id={`source-${source.n}`}
      className="flex items-start gap-3 rounded-md border border-border-subtle bg-bg-default p-3"
    >
      <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-sm border border-border-control bg-bg-panel px-1.5 font-mono text-mono-s text-text-primary">
        {source.n}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-label-m text-text-primary">{source.name}</p>
        <p className="font-mono text-mono-s text-text-muted">{source.detail}</p>
      </div>
      <a
        href={source.href}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${source.name}`}
        className="-my-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-bg-default text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel"
      >
        <ExternalLink className="h-5 w-5 stroke-current" aria-hidden="true" />
      </a>
    </div>
  )
}
