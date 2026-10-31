import { createContext, useContext, type ReactNode } from 'react'
import { Quote } from 'lucide-react'
import { Citation } from '../ui/Citation'
import { VerdictChip, type VerdictType } from '../ui/VerdictChip'
import { renderCited } from './renderCited'
import { roadmapText } from '../../i18n/messages/roadmap'
import { useText } from '../../i18n/text'

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
  /** One quoted line with no box and no footer, for a list that prints its footer once (ReasoningFooter). */
  compact?: boolean
}

export function Reasoning({ text, paused = false, source, rows, compact = false }: ReasoningProps) {
  const t = useText(roadmapText)
  const contextualSource = useContext(ExplanationSourceContext)
  const textSource = source ?? contextualSource ?? 'template'

  if (compact) {
    return (
      <section className="flex gap-2">
        <h3 className="sr-only">{paused ? t.reasoning.paused : t.reasoning.title}</h3>
        <Quote className="mt-1 h-4 w-4 shrink-0 stroke-current text-text-muted" aria-hidden="true" />
        <p className="min-w-0 text-body-m text-text-primary">{paused ? t.reasoning.pausedText : renderCited(text)}</p>
      </section>
    )
  }

  return (
    <section className="space-y-2 rounded-md border border-border-subtle bg-bg-panel p-4">
      <h3 className="flex items-center gap-2 text-label-m text-text-primary">
        <Quote className="h-4 w-4 stroke-current" aria-hidden="true" />
        {paused ? t.reasoning.paused : t.reasoning.title}
      </h3>
      <p className="text-body-m text-text-primary">{paused ? t.reasoning.pausedText : renderCited(text)}</p>
      {rows && rows.length > 0 && (
        <ul className="space-y-1.5">
          {rows.map((row, index) => (
            <li key={index} className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <VerdictChip verdict={row.verdict} size="sm" />
              <span className="min-w-0 text-body-s text-text-primary">{row.name}</span>
              <span className="font-mono text-mono-s text-text-muted">
                {t.reasoning.youNeeded(
                  t.reasoning.levels[row.you as keyof typeof t.reasoning.levels] ?? row.you,
                  t.reasoning.levels[row.needed as keyof typeof t.reasoning.levels] ?? row.needed
                )}
              </span>
              {row.citation ? <Citation n={row.citation} /> : null}
            </li>
          ))}
        </ul>
      )}
      <p className="font-mono text-mono-s text-text-muted">
        {paused
          ? t.reasoning.pausedFooter
          : textSource === 'claude'
            ? t.reasoning.claudeFooter
            : t.reasoning.templateFooter}
      </p>
    </section>
  )
}

/** The footer of a list of compact Reasoning lines, printed once: one line for each kind of text the list holds. */
export function ReasoningFooter({ sources, paused = false }: { sources: ExplanationSource[]; paused?: boolean }) {
  const t = useText(roadmapText)
  const lines = paused
    ? [t.reasoning.pausedFooter]
    : [...new Set(sources)].map((source) =>
        source === 'claude' ? t.reasoning.claudeFooter : t.reasoning.templateFooter
      )
  return (
    <>
      {lines.map((line) => (
        <p key={line} className="font-mono text-mono-s text-text-muted">
          {line}
        </p>
      ))}
    </>
  )
}
