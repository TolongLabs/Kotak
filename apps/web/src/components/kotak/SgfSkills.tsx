import type { BundleSgfRole, BundleSgfSkill } from '@kotak/shared'
import { Sparkles } from 'lucide-react'
import { commonText } from '../../i18n/common'
import { useText } from '../../i18n/text'
import { cn } from '../ui/cn'

// SkillsFuture Singapore beside a job or a corner (#464): the regional framework's name for the same role or skill.
// Context only: no verdict, level or target reads it. The links are auto-generated, and the title says so.

/** The job's SkillsFuture equivalent, such as "Singapore Equivalent: UI Designer · Infocomm Technology". */
export function SgfEquivalent({ roles, className }: { roles: BundleSgfRole[]; className?: string }) {
  const t = useText(commonText).sgf
  const [first] = roles
  if (!first) return null
  return (
    <span className={cn('text-body-s text-text-muted', className)} title={t.matched}>
      {t.equivalent}: <span className="text-text-primary">{first.title}</span> · {first.sector}
      {roles.length > 1 ? ` · ${t.more(roles.length - 1)}` : ''}
    </span>
  )
}

/**
 * A corner's linked SkillsFuture skills, each with its proficiency level and whether Singapore flags it as emerging.
 * `compact` prints one line of text for tight columns, such as a table cell; otherwise each skill is a chip.
 */
export function SgfSkillList({
  skills,
  compact = false,
  className
}: {
  skills: BundleSgfSkill[]
  compact?: boolean
  className?: string
}) {
  const t = useText(commonText).sgf
  if (skills.length === 0) return null
  if (compact)
    return (
      <p className={cn('text-body-s text-text-muted', className)} title={t.matched}>
        {t.name}:{' '}
        {skills.map((skill, i) => (
          <span key={skill.code}>
            {i > 0 && ', '}
            <span className="text-text-primary">{skill.title}</span>
            {skill.proficiency_level !== null && ` (${t.level(skill.proficiency_level)})`}
            {skill.emerging && (
              <>
                {' '}
                <Sparkles className="inline h-3 w-3" aria-hidden="true" />
                <span className="sr-only">{t.emerging}</span>
              </>
            )}
          </span>
        ))}
      </p>
    )
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} title={t.matched}>
      <span className="text-label-s text-text-muted">{t.name}</span>
      {skills.map((skill) => (
        <span
          key={skill.code}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-panel px-3 py-1 text-label-s text-text-primary"
        >
          {skill.title}
          {skill.proficiency_level !== null && (
            <span className="whitespace-nowrap font-mono text-mono-s text-text-muted">
              {t.level(skill.proficiency_level)}
            </span>
          )}
          {skill.emerging && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-text-primary bg-accent-box px-2 text-label-s">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {t.emerging}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
