import { Quote } from 'lucide-react'
import { renderCited } from './renderCited'

export interface ReasoningProps {
  text: string
  // The explanation route is down: the verdict still stands on its sources.
  paused?: boolean
}

export function Reasoning({ text, paused = false }: ReasoningProps) {
  return (
    <section className="space-y-2 rounded-md border border-border-subtle bg-bg-panel p-4">
      <h3 className="flex items-center gap-2 text-label-m text-text-primary">
        <Quote className="h-4 w-4 stroke-current" aria-hidden="true" />
        {paused ? 'Explanation Paused' : 'Why Kopi Says This'}
      </h3>
      <p className="text-body-m text-text-primary">
        {paused ? 'Fixed rules set this verdict from the dated sources below, so it still holds.' : renderCited(text)}
      </p>
      <p className="font-mono text-mono-s text-text-muted">
        {paused
          ? 'Fixed rules set this verdict from the sources below.'
          : 'Fixed rules set the verdict. This summary is built from the cited inputs.'}
      </p>
    </section>
  )
}
