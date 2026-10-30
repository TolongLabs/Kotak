import { ChevronRight, History } from 'lucide-react'
import type { ChangeItem } from '../../demo/types'
import { VerdictChip } from '../ui/VerdictChip'
import { changesText } from '../../i18n/messages/changes'
import { useText } from '../../i18n/text'
import { renderCited } from './renderCited'

export function WhatChangedCard({ item }: { item: ChangeItem }) {
  const t = useText(changesText)
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-md border-[1.5px] border-text-primary bg-bg-default p-4">
      <p className="flex items-center gap-2 font-mono text-mono-s text-text-muted">
        <History className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
        {item.source}
      </p>
      <h3 className="text-title-s text-text-primary">{item.skill}</h3>
      <p className="flex flex-wrap items-center gap-2">
        <VerdictChip verdict={item.from} />
        <ChevronRight className="h-5 w-5 stroke-current text-text-primary" aria-label={t.changedTo} />
        <VerdictChip verdict={item.to} />
      </p>
      <p className="text-body-m text-text-muted">{renderCited(item.why)}</p>
      <p className="text-label-m text-text-primary">{item.effect}</p>
    </article>
  )
}
