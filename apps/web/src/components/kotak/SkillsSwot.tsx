import { Briefcase, CircleCheck, Target, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
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

// Each quadrant shows this many items first, so one long list does not stretch its row.
const QUADRANT_PREVIEW = 4

export function SkillsSwot({ swot, size = 'desktop', radarLink = false }: SkillsSwotProps) {
  const phone = size === 'phone'
  const t = useText(radarText)
  const [expanded, setExpanded] = useState<string[]>([])
  const quadrants: Array<{
    key: string
    title: string
    hint: string
    items: SwotItem[]
    icon: typeof CircleCheck
    className: string
    focus?: boolean
  }> = [
    {
      key: 'strengths',
      title: t.strengths.title,
      hint: t.strengths.hint,
      items: swot.strengths,
      icon: CircleCheck,
      className: 'on-accent on-you-fill border-[1.5px] border-text-primary bg-radar-you-fill'
    },
    {
      key: 'weaknesses',
      title: t.weaknesses.title,
      hint: t.weaknesses.hint,
      items: swot.weaknesses,
      icon: Target,
      className: 'border-[1.5px] border-text-primary bg-swot-weak',
      focus: true
    },
    {
      key: 'opportunities',
      title: t.opportunities.title,
      hint: t.opportunities.hint,
      items: swot.opportunities,
      icon: Briefcase,
      className: 'border-[1.5px] border-text-primary bg-swot-opp'
    },
    {
      key: 'threats',
      title: t.threats.title,
      hint: t.threats.hint,
      items: swot.threats,
      icon: TriangleAlert,
      className: 'border-[1.5px] border-text-primary bg-swot-threat'
    }
  ]

  return (
    <section
      className={cn('surface-card @container space-y-4', phone ? 'p-3' : 'p-3 lg:p-5')}
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

      {/* Columns follow the card's own width: one on phones, 2x2 in a half column, one row of four at full width. */}
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @3xl:grid-cols-4">
        {quadrants.map(({ key, title, hint, items, icon: Icon, className, focus }) => {
          const open = expanded.includes(key)
          const shown = open ? items : items.slice(0, QUADRANT_PREVIEW)
          const hiddenCount = items.length - shown.length
          return (
            <section
              key={key}
              aria-label={title}
              className={cn(
                'flex h-full min-w-0 flex-col rounded-md p-3',
                phone ? 'gap-2' : 'gap-2 lg:gap-2.5 lg:p-4',
                className
              )}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Icon className="h-[18px] w-[18px] shrink-0 stroke-current" aria-hidden="true" />
                <h3 className={cn('text-text-primary', phone ? 'text-label-m' : 'text-label-m lg:text-label-l')}>
                  {title}
                </h3>
                {focus && items.length > 0 && (
                  <span className="rounded-full border border-text-primary px-2 py-0.5 text-label-s font-semibold text-text-primary">
                    {t.focusHere}
                  </span>
                )}
              </div>
              <p className="text-body-s text-text-muted">{hint}</p>
              {shown.length > 0 ? (
                <ul className={cn('space-y-2.5', phone ? 'mt-0.5' : 'mt-1')}>
                  {shown.map((item, index) => (
                    <li key={`${item.label}-${index}`} className="min-w-0 space-y-1">
                      <p className="break-words text-label-m text-text-primary">{item.label}</p>
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <VerdictChip verdict={item.verdict} size="sm" />
                        <span className="font-mono text-mono-s text-text-muted">{item.detail}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-s text-text-muted">{t.noneInSnapshot}</p>
              )}
              {items.length > QUADRANT_PREVIEW && (
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() =>
                    setExpanded((current) => (open ? current.filter((each) => each !== key) : [...current, key]))
                  }
                  className="-ml-1 inline-flex min-h-11 items-center self-start px-1 text-label-s font-semibold text-text-primary underline decoration-current underline-offset-2 transition-colors duration-150 ease-out hover:text-text-muted"
                >
                  {open ? t.showLess : t.moreItems(hiddenCount)}
                </button>
              )}
            </section>
          )
        })}
      </div>

      <p className="font-mono text-mono-s text-text-muted">{t.swotFootnote}</p>
    </section>
  )
}
