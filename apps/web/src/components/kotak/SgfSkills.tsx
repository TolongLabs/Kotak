import type { BundleSgfRole, BundleSgfSkill } from '@kotak/shared'
import { ChevronDown, Sparkles } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { usePathways } from '../../engine/bundle'
import { commonText } from '../../i18n/common'
import { useText } from '../../i18n/text'
import { TextLink } from '../ui/TextLink'
import { cn } from '../ui/cn'
import { place } from './SdgReasonChip'

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

/**
 * One SkillsFuture skill as a chip that opens its description, as an SDG chip opens its reason: the chip names the skill
 * and its level, and the panel says it is Singapore's framework, whether it is emerging, and that an AI matched it.
 */
export function SgfSkillChip({ skill }: { skill: BundleSgfSkill }) {
  const t = useText(commonText).sgf
  const pathways = usePathways()
  const source = pathways.status === 'ready' ? pathways.data.sources.sgf : null
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const level = skill.proficiency_level === null ? null : t.level(skill.proficiency_level)

  useEffect(() => {
    if (!open) return
    const follow = () => place(buttonRef.current!, panelRef.current!)
    window.addEventListener('scroll', follow, { capture: true, passive: true })
    window.addEventListener('resize', follow)
    return () => {
      window.removeEventListener('scroll', follow, { capture: true })
      window.removeEventListener('resize', follow)
    }
  }, [open])

  return (
    // A press on the chip or its panel opens the description only; it doesn't also select the roadmap step around it.
    <span className="inline-flex" onClick={(event) => event.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={panelId}
        aria-label={`${t.name}: ${skill.title}${level ? `, ${level}` : ''}`}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-panel px-3 py-1 text-label-s text-text-primary transition-colors duration-150 ease-out hover:border-border-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {skill.emerging && <Sparkles className="h-3 w-3 shrink-0 stroke-current" aria-hidden="true" />}
        {skill.title}
        {level && <span className="whitespace-nowrap font-mono text-mono-s text-text-muted">{level}</span>}
        <ChevronDown
          className={cn('-mr-1 h-4 w-4 shrink-0 stroke-current transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      <div
        ref={panelRef}
        id={panelId}
        popover="auto"
        // Its height is known only once it shows, so it stays hidden until the toggle event places it.
        onBeforeToggle={(event) => {
          setOpen(event.newState === 'open')
          if (event.newState === 'open') event.currentTarget.style.visibility = 'hidden'
        }}
        onToggle={(event) => {
          if (event.newState !== 'open') return
          place(buttonRef.current!, event.currentTarget)
          event.currentTarget.style.visibility = ''
        }}
        className="inset-auto m-0 max-h-[calc(100vh-1.5rem)] w-[min(20rem,calc(100vw-1.5rem))] cursor-default space-y-2 overflow-y-auto rounded-md border border-border-subtle bg-bg-default p-4 text-left font-sans text-text-primary shadow-popover"
      >
        <p className="font-mono text-mono-s text-text-muted">{t.name}</p>
        <p className="text-label-m">{skill.title}</p>
        {(level || skill.emerging) && (
          <p className="flex flex-wrap items-center gap-2 text-label-s text-text-muted">
            {level}
            {skill.emerging && (
              <span className="inline-flex items-center gap-1 rounded-full border border-text-primary bg-accent-box px-2 text-label-s text-accent-on-box">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {t.emerging}
              </span>
            )}
          </p>
        )}
        {skill.description && <p className="text-body-s">{skill.description}</p>}
        <p className="text-label-s text-text-muted">
          {t.matched}{' '}
          {source && (
            <TextLink href={source.source_url} external className="text-label-s">
              {source.source_name}
            </TextLink>
          )}
        </p>
      </div>
    </span>
  )
}
