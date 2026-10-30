import type { Rating } from '@kotak/shared'
import { Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { cn } from '../../components/ui/cn'
import { checkupText } from '../../i18n/messages/checkup'
import { useText } from '../../i18n/text'

// The options in this session's order, labelled A to D by position; no score ever shows. Keys 1 to 4 pick by position.
export function ScenarioOptions({
  options,
  chosen,
  reduced,
  onPick
}: {
  options: string[]
  chosen: Rating | null
  reduced: boolean
  onPick: (position: Rating) => void
}) {
  const t = useText(checkupText)

  return (
    <div className="grid gap-3 min-[480px]:grid-cols-2">
      {options.map((text, index) => {
        const position = (index + 1) as Rating
        return (
          <Button
            key={index}
            variant={chosen === position ? 'primary' : 'secondary'}
            size="lg"
            fullWidth
            className={cn(
              'h-auto min-h-[48px] items-start justify-start gap-3 px-3 py-2 text-left !transition-[scale,background-color,color] !duration-[120ms]',
              chosen === position && '!bg-accent-chosen',
              chosen === position && !reduced && 'scale-[0.985]'
            )}
            aria-pressed={chosen === position}
            aria-keyshortcuts={String(position)}
            onClick={() => onPick(position)}
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-current font-mono text-mono-s"
            >
              {t.questions.scenarioOptionLabels[index]}
            </span>
            <span className="flex-1 text-body-s font-normal">{text}</span>
            {chosen === position && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
          </Button>
        )
      })}
    </div>
  )
}
