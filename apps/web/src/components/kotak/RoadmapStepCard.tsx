import { BookOpen, Check, Clock3, Sparkles } from 'lucide-react'
import type { RoadmapStep } from '../../demo/types'
import { Citation } from '../ui/Citation'
import { SdgChip } from '../ui/SdgChip'
import { TextLink } from '../ui/TextLink'

export interface RoadmapStepCardProps {
  step: RoadmapStep
  index: number
  last: boolean
}

export function RoadmapStepCard({ step, index, last }: RoadmapStepCardProps) {
  const cardBorder = step.conditional
    ? 'border-[1.5px] border-dashed border-border-control bg-bg-panel'
    : step.state === 'next'
      ? 'border-[1.5px] border-text-primary bg-bg-default'
      : 'border border-border-subtle bg-bg-default'

  return (
    <div className="relative flex gap-3 sm:gap-4">
      <div className="relative flex w-7 shrink-0 justify-center">
        {!last && <span className="absolute bottom-0 top-7 w-px bg-border-subtle" aria-hidden="true" />}
        <span
          className={`relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] font-mono text-mono-s ${
            step.state === 'next'
              ? 'on-accent border-text-primary bg-accent-box text-text-primary'
              : step.state === 'done'
                ? 'border-state-success bg-state-success text-bg-default'
                : 'border-border-control bg-bg-default text-text-primary'
          }`}
          aria-hidden="true"
        >
          {step.state === 'done' ? <Check className="h-4 w-4 stroke-current" /> : index + 1}
        </span>
      </div>

      <article
        aria-labelledby={`roadmap-step-${step.id}`}
        className={`min-w-0 flex-1 space-y-2 rounded-md p-4 ${cardBorder}`}
      >
        <p className="font-mono text-mono-s text-text-muted">{step.when}</p>
        <h3 id={`roadmap-step-${step.id}`} className="text-title-s text-text-primary">
          {step.title}
        </h3>
        <p className="text-body-s text-text-primary">{step.description}</p>

        <div className="flex min-w-0 items-start gap-2 rounded-full border border-border-subtle bg-bg-panel px-2.5 py-1">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 stroke-current text-text-primary" aria-hidden="true" />
          <span className="min-w-0 text-label-s text-text-primary">{step.gain}</span>
        </div>

        <p className="flex items-center gap-2 text-body-s text-text-primary">
          <Clock3 className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
          <span>{step.hoursPerWeek} h a Week</span>
        </p>

        <div className="flex min-w-0 items-start gap-2 text-body-s">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 stroke-current text-text-primary" aria-hidden="true" />
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <TextLink href={step.resource.href} external className="min-w-0 break-words text-body-s">
              {step.resource.label}
            </TextLink>
            {step.resource.citation !== undefined && <Citation n={step.resource.citation} />}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {step.sdgs.map((goal) => (
            <SdgChip key={goal} goal={goal} />
          ))}
        </div>
      </article>
    </div>
  )
}
