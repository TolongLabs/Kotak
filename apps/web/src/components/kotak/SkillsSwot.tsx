import { Briefcase, CircleCheck, Target, TriangleAlert } from 'lucide-react'
import { Link } from '../../app/router'
import { routes } from '../../app/routes'
import type { Swot, SwotItem } from '../../demo/types'
import { VerdictChip } from '../ui/VerdictChip'
import { cn } from '../ui/cn'

export interface SkillsSwotProps {
  swot: Swot
  size?: 'desktop' | 'phone'
  onOpenRadar?: () => void
}

export function SkillsSwot({ swot, size = 'desktop', onOpenRadar }: SkillsSwotProps) {
  const phone = size === 'phone'
  const quadrants: Array<{
    title: string
    hint: string
    items: SwotItem[]
    icon: typeof CircleCheck
    className: string
  }> = [
    {
      title: 'Strengths',
      hint: 'Lead With These',
      items: swot.strengths,
      icon: CircleCheck,
      className: 'border-[1.5px] border-text-primary bg-radar-you-fill'
    },
    {
      title: 'Weaknesses',
      hint: 'Close These Next',
      items: swot.weaknesses,
      icon: Target,
      className: 'border-[1.5px] border-text-primary bg-bg-default'
    },
    {
      title: 'Opportunities',
      hint: 'Roles Within Reach',
      items: swot.opportunities,
      icon: Briefcase,
      className: 'border border-border-subtle bg-bg-default'
    },
    {
      title: 'Threats',
      hint: 'Let AI Draft These',
      items: swot.threats,
      icon: TriangleAlert,
      className: 'border-[1.5px] border-text-primary bg-bg-panel'
    }
  ]

  return (
    <section className={cn('surface-card space-y-4', phone ? 'p-3' : 'p-3 lg:p-5')} aria-labelledby="skills-swot-title">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 id="skills-swot-title" className="text-title-s text-text-primary">
            Your Skills SWOT
          </h2>
          <p className="text-body-s text-text-muted">
            Your six skills, sorted by your level and where the market is heading.
          </p>
        </div>
        {onOpenRadar ? (
          <Link
            to={routes.radar}
            onClick={onOpenRadar}
            className="inline-flex min-h-11 shrink-0 items-center rounded-sm bg-bg-default px-1 text-label-m text-text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Open Radar
          </Link>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-3">
        {quadrants.map(({ title, hint, items, icon: Icon, className }) => (
          <section
            key={title}
            aria-label={title}
            className={cn(
              'flex h-full min-w-0 flex-col rounded-md p-3',
              phone ? 'gap-2' : 'gap-2 lg:gap-2.5 lg:p-4',
              className
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-[18px] w-[18px] shrink-0 stroke-current" aria-hidden="true" />
              <h3 className={cn('text-text-primary', phone ? 'text-label-m' : 'text-label-m lg:text-label-l')}>
                {title}
              </h3>
            </div>
            <p className="text-body-s text-text-muted">{hint}</p>
            <ul className={cn('space-y-2.5', phone ? 'mt-0.5' : 'mt-1')}>
              {items.map((item, index) => (
                <li key={`${item.label}-${index}`} className="min-w-0 space-y-1">
                  <p className="break-words text-label-m text-text-primary">{item.label}</p>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <VerdictChip verdict={item.verdict} size="sm" />
                    <span className="font-mono text-mono-s text-text-muted">{item.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="font-mono text-mono-s text-text-muted">
        Fixed rules sort the skills. Each verdict cites its sources on the Radar page.
      </p>
    </section>
  )
}
