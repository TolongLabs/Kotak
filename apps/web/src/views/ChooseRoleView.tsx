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
import { checkUpSteps, Stepper } from '../components/ui/Stepper'
import { VerdictChip } from '../components/ui/VerdictChip'
import { cn } from '../components/ui/cn'
import { usePathways, useSuggestions } from '../engine/bundle'
import { updateGuestSession, useGuestSession } from '../session/store'

// Roles to check before any question (#284), for a user with no job to test or no role in mind: first what they
// enjoy, if they said they're not sure, then up to six roles from their study, picked areas and interests, each with
// why it's there, its outlook and what stands in the way. The one they pick becomes the target the 12 questions test.

const AREA_NAMES: Record<(typeof RIASEC)[number], string> = {
  R: 'hands-on',
  I: 'investigating',
  A: 'creative',
  S: 'helping',
  E: 'leading',
  C: 'organising'
}

function InterestScreen({ onDone }: { onDone: (ids: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>([])
  // The same count in every area points nowhere, so Kotak can't match it.
  const even = !hasInterestPattern(interestPicks(picked))
  const toggle = (id: string) =>
    setPicked((current) => (current.includes(id) ? current.filter((other) => other !== id) : [...current, id]))
  return (
    <section className="space-y-4" aria-labelledby="interests-heading">
      <div className="space-y-1.5">
        <h1 id="interests-heading" className="text-title-m text-text-primary lg:text-title-l">
          What Do You Enjoy?
        </h1>
        <p className="text-body-s text-text-muted">
          Pick everything that sounds good, at least {MIN_INTEREST_PICKS}. It’s a pointer, not a test: Kopi matches your
          picks to the interests O*NET records for each job.
        </p>
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
              {activity.label}
            </button>
          )
        })}
      </div>
      <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 space-y-2 rounded-md p-3 lg:static lg:rounded-none lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
        <p className="text-body-s text-text-muted" aria-live="polite">
          {picked.length} picked
          {picked.length < MIN_INTEREST_PICKS
            ? `; pick ${MIN_INTEREST_PICKS - picked.length} more.`
            : even
              ? '. They’re spread evenly, so they don’t point anywhere yet: leave out the ones you like least.'
              : '.'}
        </p>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={picked.length < MIN_INTEREST_PICKS || even}
          onClick={() => onDone(picked)}
        >
          Show Roles for Me
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
          {role.title}
        </span>
        {role.interest_match !== null && role.interest_match > 0 && (
          <span className="flex shrink-0 flex-col items-end">
            <span className="text-title-m tabular-nums text-text-primary">
              {Math.round(role.interest_match * 100)}%
            </span>
            <span className="font-mono text-mono-s text-text-muted">interest match</span>
          </span>
        )}
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-mono-s text-text-muted">Outlook</span>
        <VerdictChip verdict={role.outlook} size="sm" />
        <AccessChip access={role.access} />
      </span>
      {role.reasons.length > 0 && <span className="text-body-s text-text-primary">{role.reasons.join(' · ')}</span>}
      {role.access.status !== 'open' && <span className="text-body-s text-text-muted">{role.access.summary}</span>}
    </label>
  )
}

export function ChooseRoleView() {
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
        <Stepper step={1} labels={checkUpSteps} />
        <CatDialogue pose="asking" speech="Not sure yet? Tell me what you enjoy, and I’ll suggest roles to try." />
        <InterestScreen onDone={finishInterests} />
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Change My Answers
        </Button>
      </div>
    )

  const roles = suggestions.status === 'ready' ? suggestions.data : []
  const selected = roles.find((role) => role.onet_code === selectedId) ?? roles[0]
  const strongest = profile.interests
    ? RIASEC.filter((_, i) => profile.interests![i] === Math.max(...profile.interests!)).map((area) => AREA_NAMES[area])
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
      <Stepper step={1} labels={checkUpSteps} />
      <CatDialogue
        pose={suggestions.status === 'ready' ? 'explaining' : 'thinking'}
        speech={
          suggestions.status !== 'ready'
            ? 'Looking for roles that suit you…'
            : roles.length
              ? `${strongest.length ? `Your picks lean to ${strongest.join(' and ')} work. ` : ''}Pick a role, and I’ll test you against it.`
              : 'I need a little more to go on.'
        }
      />

      <header className="space-y-1.5">
        <h1 ref={headingRef} tabIndex={-1} className="text-title-m text-text-primary outline-none lg:text-title-l">
          Roles to Check
        </h1>
        <p className="text-body-s text-text-muted">
          From your study, the areas you picked and what you enjoy. A role that needs a qualification says so; pick it
          anyway if it interests you, and your answers will show how well it suits you. The 12 questions test the
          highlighted role; pick any card to switch.
        </p>
      </header>

      {suggestions.status === 'error' && (
        <Banner type="error" title="Kopi Could Not Load the Roles" body="Reload the page, or go back and try again." />
      )}

      {suggestions.status === 'ready' && roles.length === 0 && (
        <Banner
          type="info"
          title="Nothing to Go On Yet"
          body="Pick an area that interests you, your field of study, or what you enjoy, and Kopi can suggest roles."
        />
      )}

      {roles.length > 0 && (
        <section
          role="radiogroup"
          aria-label="Roles to Check"
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
                    ? 'You picked this role.'
                    : 'Picked for you: Kopi’s top suggestion for your answers.'
              }
              onSelect={() => setSelectedId(role.onet_code)}
            />
          ))}
        </section>
      )}

      <SourceList sources={sources} />

      <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 grid grid-cols-1 gap-3 rounded-md p-3 sm:grid-cols-2 lg:static lg:rounded-none lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Change My Answers
        </Button>
        <Button variant="primary" size="lg" fullWidth disabled={!selected} onClick={check}>
          {selected ? `Test Me on ${selected.title}` : 'Pick a Role'}
        </Button>
      </div>
    </div>
  )
}
