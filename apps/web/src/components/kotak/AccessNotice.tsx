import type { RoleAccess } from '@kotak/shared'
import { needsQualification } from '@kotak/shared'
import { BadgeCheck, Clock, ExternalLink, GraduationCap, Landmark } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '../ui/cn'

// What a role asks for beyond skills (#284), from the fixed access rule in @kotak/shared: a regulated profession in
// Malaysia, or what US workers say the job needs (O*NET). It informs and never blocks. The chip sits on role cards;
// the notice sits on the radar, the role detail and the roadmap, beside the user's fit, so they can weigh whether the
// qualification is worth pursuing.

type Icon = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>

const icons: Record<RoleAccess['status'], Icon> = {
  open: BadgeCheck,
  qualify: GraduationCap,
  register: Landmark,
  check_licence: Landmark,
  experience: Clock,
  degree: GraduationCap
}

/** A small pill naming what the role asks for beyond skills; nothing for a role open to the user. */
export function AccessChip({ access, className }: { access: RoleAccess | undefined; className?: string }) {
  if (!access || access.status === 'open') return null
  const Icon = icons[access.status]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-text-primary bg-bg-default px-2.5 py-0.5 text-label-s font-semibold text-text-primary',
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 stroke-current" aria-hidden="true" />
      {access.label}
    </span>
  )
}

/**
 * The access rule in full: the summary, and for a regulated profession the route in, the regulator and the pages it
 * comes from. With `fit`, it says how much of the role the user's answers already meet, to weigh against the
 * qualification. `heading` overrides the label as the title.
 */
export function AccessNotice({
  access,
  roleTitle,
  fit,
  heading,
  className
}: {
  access: RoleAccess
  roleTitle: string
  fit?: { percent: number; estimated: boolean }
  heading?: string
  className?: string
}) {
  if (access.status === 'open') return null
  const Icon = icons[access.status]
  const qualification = needsQualification(access)
  return (
    <section
      aria-label={`${heading ?? access.label}: ${roleTitle}`}
      className={cn('space-y-3 rounded-md border border-border-subtle bg-bg-panel p-4', className)}
    >
      <header className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-text-primary" aria-hidden="true" />
        <div className="min-w-0 space-y-1">
          <h2 className="text-title-s text-text-primary">{heading ?? access.label}</h2>
          <p className="text-body-s text-text-primary">{access.summary}</p>
        </div>
      </header>
      {fit && (
        <p className="pl-8 text-body-s text-text-primary">
          Your answers meet {fit.estimated ? 'an estimated ' : ''}
          <span className="font-semibold tabular-nums">{fit.percent}%</span> of the levels {roleTitle} needs.{' '}
          {qualification
            ? 'A high fit says the work suits you and the qualification may be worth it; a low one is worth knowing before you enrol.'
            : 'Weigh that against what the role asks for.'}
        </p>
      )}
      {access.profession && qualification && (
        <div className="space-y-2 pl-8">
          <h3 className="text-label-m text-text-primary">The Route In</h3>
          <ol className="list-decimal space-y-1 pl-5 text-body-s text-text-primary">
            {access.profession.route.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      {access.profession && (
        <div className="flex flex-col gap-1.5 pl-8 text-body-s">
          <span className="text-text-muted">Who regulates it:</span>
          {access.profession.body.url ? (
            <a
              href={access.profession.body.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-text-primary underline underline-offset-4"
            >
              {access.profession.body.name}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
          ) : (
            <span className="font-semibold text-text-primary">{access.profession.body.name}</span>
          )}
          <span className="text-text-muted">
            {access.profession.law ? `${access.profession.law}. ` : ''}Checked against{' '}
            {access.profession.sources.map((source, i) => (
              <span key={source.url}>
                {i > 0 && ', '}
                <a href={source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  {source.title}
                </a>
              </span>
            ))}
            . Requirements change: confirm with the regulator before you enrol.
          </span>
        </div>
      )}
      {!access.profession && (
        <p className="pl-8 text-body-s text-text-muted">
          From what US workers report to O*NET. Malaysian employers may ask for less or more; job ads show what they ask
          for now.
        </p>
      )}
    </section>
  )
}
