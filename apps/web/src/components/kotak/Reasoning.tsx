import { createContext, useContext, type ReactNode } from 'react'
import { Quote } from 'lucide-react'
import { Citation } from '../ui/Citation'
import { VerdictChip, type VerdictType } from '../ui/VerdictChip'
import { renderCited } from './renderCited'

export type ExplanationSource = 'claude' | 'template'

const ExplanationSourceContext = createContext<ExplanationSource | undefined>(undefined)

export function ExplanationSourceProvider({ source, children }: { source: ExplanationSource; children: ReactNode }) {
  return <ExplanationSourceContext.Provider value={source}>{children}</ExplanationSourceContext.Provider>
}

/** One cited skill row under the text. Styled levels arrive already rounded. */
export interface ReasoningRow {
  verdict: VerdictType
  name: string
  you: string
  needed: string
  citation?: number | null
}

export interface ReasoningProps {
  text: string
  // The explanation route is down: the verdict still stands on its sources.
  paused?: boolean
  source?: ExplanationSource
  /** Optional skill rows from engine data; callers without them keep the plain paragraph. */
  rows?: ReasoningRow[]
}

export function Reasoning({ text, paused = false, source, rows }: ReasoningProps) {
  const contextualSource = useContext(ExplanationSourceContext)
  const textSource = source ?? contextualSource ?? 'template'

  return (
    <section className="space-y-2 rounded-md border border-border-subtle bg-bg-panel p-4">
      <h3 className="flex items-center gap-2 text-label-m text-text-primary">
        <Quote className="h-4 w-4 stroke-current" aria-hidden="true" />
        {paused ? 'Explanation Paused' : 'Why Kopi Says This'}
      </h3>
      <p className="text-body-m text-text-primary">
        {paused ? 'Fixed rules set this verdict from the dated sources below, so it still holds.' : renderCited(text)}
      </p>
      {rows && rows.length > 0 && (
        <ul className="space-y-1.5">
          {rows.map((row, index) => (
            <li key={index} className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <VerdictChip verdict={row.verdict} size="sm" />
              <span className="min-w-0 text-body-s text-text-primary">{row.name}</span>
              <span className="font-mono text-mono-s text-text-muted">
                You {row.you} · Needed {row.needed}
              </span>
              {row.citation ? <Citation n={row.citation} /> : null}
            </li>
          ))}
        </ul>
      )}
      <p className="font-mono text-mono-s text-text-muted">
        {paused
          ? 'Fixed rules set this verdict from the sources below.'
          : textSource === 'claude'
            ? 'Kopi wrote this with Claude from the cited rows only. Fixed rules set the verdict.'
            : 'Fixed rules set the verdict. This summary is built from the cited inputs.'}
      </p>
    </section>
  )
}
