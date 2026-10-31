import { Briefcase, CircleCheck, Target, TriangleAlert } from 'lucide-react'
import { Link } from '../../app/router'
import { routes } from '../../app/routes'
import type { Swot, SwotItem } from '../../demo/types'
import { radarText } from '../../i18n/messages/radar'
import { useText } from '../../i18n/text'
import { VerdictChip } from '../ui/VerdictChip'
import { cn } from '../ui/cn'

export interface SkillsSwotProps {
  swot: Swot
  size?: 'desktop' | 'phone'
  // Shows the Open Radar link, for summaries outside the Radar page.
  radarLink?: boolean
}

export function SkillsSwot({ swot, size = 'desktop', radarLink = false }: SkillsSwotProps) {
  const phone = size === 'phone'
  const t = useText(radarText)
  const quadrants: Array<{
    key: string
    title: string
    hint: string
    items: SwotItem[]
    icon: typeof CircleCheck
    swatch: string
    focus?: boolean
  }> = [
    {
      key: 'strengths',
      title: t.strengths.title,
      hint: t.strengths.hint,
      items: swot.strengths,
      icon: CircleCheck,
      swatch: 'bg-radar-you-fill'
    },
    {
      key: 'weaknesses',
      title: t.weaknesses.title,
      hint: t.weaknesses.hint,
      items: swot.weaknesses,
      icon: Target,
      swatch: 'bg-swot-weak',
      focus: true
    },
    {
      key: 'opportunities',
      title: t.opportunities.title,
      hint: t.opportunities.hint,
      items: swot.opportunities,
      icon: Briefcase,
      swatch: 'bg-swot-opp'
    },
    {
      key: 'threats',
      title: t.threats.title,
      hint: t.threats.hint,
      items: swot.threats,
      icon: TriangleAlert,
      swatch: 'bg-swot-threat'
    }
  ]

  return (
    <section
      className={cn('surface-card @container space-y-3', phone ? 'p-3' : 'p-3 lg:p-5')}
      aria-labelledby="skills-swot-title"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 id="skills-swot-title" className="text-title-s text-text-primary">
            {t.swotTitle}
          </h2>
          <p className="text-body-s text-text-muted">{t.swotSubtitle}</p>
        </div>
        {radarLink ? (
          <Link
            to={routes.radar}
            className="inline-flex min-h-11 shrink-0 items-center rounded-sm bg-bg-default px-1 text-label-m text-text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t.openRadar}
          </Link>
        ) : null}
      </header>

      {/* Four ruled rows: an empty quadrant takes one line instead of a tinted box, and the tints stay as swatches, so
          the colours still match the quadrant map. */}
      <ul className="divide-y divide-border-subtle border-y border-border-subtle">
        {quadrants.map(({ key, title, hint, items, icon: Icon, swatch, focus }) => (
          <li
            key={key}
            aria-label={title}
            className="grid gap-x-5 gap-y-2 py-3 @2xl:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span
                aria-hidden="true"
                className={cn('mt-0.5 h-10 w-3 shrink-0 rounded-sm border border-text-primary', swatch)}
              />
              <div className="min-w-0 space-y-0.5">
                <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label-m text-text-primary">
                  <Icon className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
                  {title}
                  {focus && items.length > 0 && (
                    <span className="rounded-full border border-text-primary px-2 py-0.5 text-label-s font-semibold text-text-primary">
                      {t.focusHere}
                    </span>
                  )}
                </h3>
                <p className="text-body-s text-text-muted">{hint}</p>
              </div>
            </div>
            {items.length > 0 ? (
              <ul className="grid content-center gap-x-6 gap-y-2 @3xl:grid-cols-2">
                {items.map((item, index) => (
                  <li key={`${item.label}-${index}`} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="break-words text-label-m text-text-primary">{item.label}</span>
                    <VerdictChip verdict={item.verdict} size="sm" />
                    <span className="font-mono text-mono-s text-text-muted">{item.detail}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="self-center text-body-s text-text-muted">{t.noneInSnapshot}</p>
            )}
          </li>
        ))}
      </ul>

      <p className="font-mono text-mono-s text-text-muted">{t.swotFootnote}</p>
    </section>
  )
}
