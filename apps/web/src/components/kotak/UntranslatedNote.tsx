import { Languages } from 'lucide-react'
import { commonText } from '../../i18n/common'
import { useText } from '../../i18n/text'
import { useRoleTranslated } from '../../engine/bundle'
import { cn } from '../ui/cn'

// Says plainly that some of a job's text is still in English (#449). The overlay translates job content job
// by job, so a Malay or Chinese visitor could meet English content inside a translated interface; the chip and its note
// sit under the job's title. Renders nothing when the job is translated, in English, or while that is still unknown
// (useRoleTranslated is null).
export function UntranslatedNote({ onetCode, className }: { onetCode: string | null; className?: string }) {
  const t = useText(commonText)
  const translated = useRoleTranslated(onetCode)
  if (translated !== false) return null
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-1', className)}>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-text-primary bg-bg-default px-2.5 py-0.5 text-label-s font-semibold text-text-primary">
        <Languages className="h-3.5 w-3.5 shrink-0 stroke-current" aria-hidden="true" />
        {t.untranslated}
      </span>
      <span className="text-body-s text-text-muted">{t.untranslatedNote}</span>
    </p>
  )
}
