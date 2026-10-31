import { pathwaysSources, type SuggestedRole } from '@kotak/sdk'
import {
  hasInterestPattern,
  INTEREST_ACTIVITIES,
  interestPicks,
  MIN_INTEREST_PICKS,
  RIASEC,
  type Rating
} from '@kotak/shared'
import { Check } from 'lucide-react'
import { useRef, useState } from 'react'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { AccessChip } from '../components/kotak/AccessNotice'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { SourceList } from '../components/kotak/SourceList'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { Stepper } from '../components/ui/Stepper'
import { VerdictChip } from '../components/ui/VerdictChip'
import { cn } from '../components/ui/cn'
import { useLocaleIndex, usePathways, useSuggestions } from '../engine/bundle'
import { roleTitle } from '../i18n/content/overlay'
import { checkupText } from '../i18n/messages/checkup'
import { useText } from '../i18n/text'
import { updateGuestSession, useGuestSession } from '../session/store'

// Roles to check before any question (#284), for a user with no job to test or no role in mind: first what they
// enjoy, if they said they're not sure, then up to six roles from their study, picked areas and interests, each with
// why it's there, its outlook and what stands in the way. The one they pick becomes the target the 12 questions test.

function InterestScreen({ onDone }: { onDone: (ids: string[]) => void }) {
  const t = useText(checkupText)
  const [picked, setPicked] = useState<string[]>([])
  // The same count in every area points nowhere, so Kotak can't match it.
  const even = !hasInterestPattern(interestPicks(picked))
  const toggle = (id: string) =>
    setPicked((current) => (current.includes(id) ? current.filter((other) => other !== id) : [...current, id]))
  return (
    <section className="space-y-4" aria-labelledby="interests-heading">
      <div className="space-y-1.5">
        <h1 id="interests-heading" className="text-title-m text-text-primary lg:text-title-l">
          {t.suggestions.interestsHeading}
        </h1>
        <p className="text-body-s text-text-muted">{t.interestPrompt(MIN_INTEREST_PICKS)}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {INTEREST_ACTIVITIES.map((activity) => {
          const on = picked.includes(activity.id)
          return (
            <button
              key={activity.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(activity.id)}
              className={cn(
                'flex min-h-14 items-center gap-3 rounded-md border-[1.5px] px-4 py-3 text-left text-body-m transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                on
                  ? 'on-accent border-text-primary bg-accent-box text-accent-on-box'
                  : 'border-border-subtle bg-bg-default text-text-primary hover:border-border-control'
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-[1.5px]',
                  on ? 'border-text-primary bg-text-primary text-bg-default' : 'border-border-control'
                )}
              >
                {on && <Check className="h-3.5 w-3.5" />}
              </span>
              {t.interestActivities[activity.id] ?? activity.label}
            </button>
          )
        })}
      </div>
      <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 space-y-2 rounded-md p-3 lg:static lg:rounded-none lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
        <p className="text-body-s text-text-muted" aria-live="polite">
          {t.interestCount(picked.length)}
          {picked.length < MIN_INTEREST_PICKS
            ? t.interestMore(MIN_INTEREST_PICKS - picked.length)
            : even
              ? t.interestEven
              : t.interestEnough}
        </p>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={picked.length < MIN_INTEREST_PICKS || even}
          onClick={() => onDone(picked)}
        >
          {t.buttons.showRoles}
        </Button>
      </div>
    </section>
  )
}

function RoleOption({
  role,
  selected,
  onSelect,
  note
}: {
  role: SuggestedRole
  selected: boolean
  onSelect: () => void
  // Why the card is highlighted, in bold above its title.
  note?: string
}) {
  const t = useText(checkupText)
  const index = useLocaleIndex()
  return (
    <label
      className={cn(
        'relative flex h-full min-w-0 cursor-pointer flex-col gap-3 rounded-md border-[1.5px] p-4 transition-colors duration-150 ease-out has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring',
        selected
          ? 'on-accent border-text-primary bg-accent-box text-accent-on-box'
          : 'border-border-control bg-bg-default hover:bg-bg-panel'
      )}
    >
      <input
        type="radio"
        name="suggested-role"
        value={role.onet_code}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      {note && <span className="text-body-s font-bold text-text-primary">{note}</span>}
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0 hyphens-auto text-title-s text-text-primary [overflow-wrap:anywhere]">
          {roleTitle(index, role.onet_code, role.title)}
        </span>
        {role.interest_match !== null && role.interest_match > 0 && (
          <span className="flex shrink-0 flex-col items-end">
            <span className="text-title-m tabular-nums text-text-primary">
              {Math.round(role.interest_match * 100)}%
            </span>
            <span className="font-mono text-mono-s text-text-muted">{t.roleLabels.interestMatch}</span>
          </span>
        )}
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-mono-s text-text-muted">{t.roleLabels.outlook}</span>
        <VerdictChip verdict={role.outlook} size="sm" />
        <AccessChip access={role.access} />
      </span>
      {role.reasons.length > 0 && <span className="text-body-s text-text-primary">{role.reasons.join(' · ')}</span>}
      {role.access.status !== 'open' && <span className="text-body-s text-text-muted">{role.access.summary}</span>}
    </label>
  )
}

export function ChooseRoleView() {
  const t = useText(checkupText)
  const localeIndex = useLocaleIndex()
  const session = useGuestSession()
  const pathways = usePathways()
  const askInterests = new URLSearchParams(window.location.search).get('step') === 'interests'
  const [interestsDone, setInterestsDone] = useState(!askInterests)
  const profile = session.profile
  // An earlier pick from this screen is in target_role_codes; leave it out, so it doesn't rank as a named target.
  const suggestions = useSuggestions(interestsDone ? { ...profile, target_role_codes: [] } : null, session.role_code)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // After the interest screen, focus moves to the roles' heading, so the keyboard doesn't drop to the page.
  const finishInterests = (ids: string[]) => {
    updateGuestSession({ profile: { ...profile, interests: interestPicks(ids), interest_activities: ids } })
    window.history.replaceState(null, '', routes.choose)
    setInterestsDone(true)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  if (!interestsDone)
    return (
      <div className="flex w-full min-w-0 flex-col gap-5 lg:gap-6">
        <Stepper step={1} />
        <CatDialogue pose="asking" speech={t.speech.interestPrompt} />
        <InterestScreen onDone={finishInterests} />
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          {t.buttons.changeAnswers}
        </Button>
      </div>
    )

  const roles = suggestions.status === 'ready' ? suggestions.data : []
  const selected = roles.find((role) => role.onet_code === selectedId) ?? roles[0]
  const strongest = profile.interests
    ? RIASEC.filter((_, i) => profile.interests![i] === Math.max(...profile.interests!)).map(
        (area) => t.interestAreas[area]
      )
    : []
  const sources =
    pathways.status === 'ready'
      ? pathwaysSources(pathways.data).map((source, i) => ({
          n: i + 1,
          name: source.source_name,
          detail: `${source.geo_or_layer} · ${source.vintage_date}`,
          href: source.source_url
        }))
      : []

  const check = () => {
    if (!selected) return
    updateGuestSession({
      goal: 'target',
      target_role_code: selected.onet_code,
      profile: { ...profile, target_role_codes: [selected.onet_code] },
      answers: Array<Rating | null>(12).fill(null),
      plan_role_code: null,
      ticked_milestones: []
    })
    navigate(routes.questions)
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 lg:gap-6">
      <Stepper step={1} />
      <CatDialogue
        pose={suggestions.status === 'ready' ? 'explaining' : 'thinking'}
        speech={
          suggestions.status !== 'ready'
            ? t.speech.lookingForRoles
            : roles.length
              ? strongest.length
                ? t.speech.rolesFromInterests(strongest)
                : t.speech.pickRole
              : t.speech.needMore
        }
      />

      <header className="space-y-1.5">
        <h1 ref={headingRef} tabIndex={-1} className="text-title-m text-text-primary outline-none lg:text-title-l">
          {t.suggestions.heading}
        </h1>
        <p className="text-body-s text-text-muted">{t.suggestions.intro(12)}</p>
      </header>

      {suggestions.status === 'error' && (
        <Banner type="error" title={t.suggestions.openErrorTitle} body={t.suggestions.reloadOrBack} />
      )}

      {suggestions.status === 'ready' && roles.length === 0 && (
        <Banner type="info" title={t.suggestions.nothingTitle} body={t.suggestions.nothingBody} />
      )}

      {roles.length > 0 && (
        <section
          role="radiogroup"
          aria-label={t.suggestions.ariaLabel}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {roles.map((role) => (
            <RoleOption
              key={role.onet_code}
              role={role}
              selected={role.onet_code === selected?.onet_code}
              note={
                role.onet_code !== selected?.onet_code
                  ? undefined
                  : selectedId
                    ? t.roleLabels.youPicked
                    : t.roleLabels.pickedForYou
              }
              onSelect={() => setSelectedId(role.onet_code)}
            />
          ))}
        </section>
      )}

      <SourceList sources={sources} />

      <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 grid grid-cols-1 gap-3 rounded-md p-3 sm:grid-cols-2 lg:static lg:rounded-none lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          {t.buttons.changeAnswers}
        </Button>
        <Button variant="primary" size="lg" fullWidth disabled={!selected} onClick={check}>
          {selected
            ? t.buttons.testMeOn(roleTitle(localeIndex, selected.onet_code, selected.title))
            : t.buttons.pickRole}
        </Button>
      </div>
    </div>
  )
}
