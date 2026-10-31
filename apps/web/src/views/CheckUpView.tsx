import {
  BookOpen,
  Briefcase,
  Compass,
  GraduationCap,
  Hourglass,
  PackageOpen,
  RotateCcw,
  Route,
  Search
} from 'lucide-react'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import {
  EducationLevelSchema,
  type EducationLevel,
  type Occupation,
  type Profile,
  type Rating,
  type Situation
} from '@kotak/shared'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { Button } from '../components/ui/Button'
import { cn } from '../components/ui/cn'
import { ChoiceCard } from '../components/ui/ChoiceCard'
import { Select } from '../components/ui/Select'
import { Stepper } from '../components/ui/Stepper'
import { fetchRoleAliases, type RoleAlias } from '../engine/api'
import { usePathways, useRoleIndex } from '../engine/bundle'
import { checkupText } from '../i18n/messages/checkup'
import { useText } from '../i18n/text'
import { updateGuestSession, useGuestSession } from '../session/store'
import { AreaPicker } from './checkup/AreaPicker'
import { JobSearch } from './checkup/JobSearch'
import { KopiAside } from './checkup/KopiDialogue'
import { TargetPicker } from './checkup/TargetPicker'

// The check-up start (#284): who the user is before any question. Their situation, study and job decide which
// roles Kotak puts in front of them and what stands in the way; the goal decides what the 12 questions test. Without
// a job or a role in mind, Kopi suggests roles first (ChooseRoleView), so nobody answers questions about a job they
// don't have.

type Icon = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
type IntakeGoal = 'stay' | 'target' | 'explore' | 'unsure'

const situations: { id: Situation; icon: Icon }[] = [
  { id: 'working', icon: Briefcase },
  { id: 'studying', icon: BookOpen },
  { id: 'graduated', icon: GraduationCap },
  { id: 'between_jobs', icon: Hourglass },
  { id: 'returning', icon: RotateCcw }
]

const goalOptions: { id: IntakeGoal; icon: Icon }[] = [
  { id: 'stay', icon: Briefcase },
  { id: 'target', icon: Route },
  { id: 'explore', icon: PackageOpen },
  { id: 'unsure', icon: Compass }
]

// Years of work as bands; each stores its lower bound, which the access rule compares with what a job needs.

const hasJobNow = (situation: Situation | null) => situation === 'working'

// "I'm not sure" is stored as the explore goal until the user picks a role, so this browser remembers the choice
// itself, for coming back to the start. Blocked storage just forgets it.
const UNSURE_KEY = 'kotak:intake-unsure'
function rememberUnsure(unsure: boolean) {
  try {
    if (unsure) localStorage.setItem(UNSURE_KEY, '1')
    else localStorage.removeItem(UNSURE_KEY)
  } catch {
    // Blocked storage: nothing to remember.
  }
}
function wasUnsure() {
  try {
    return localStorage.getItem(UNSURE_KEY) === '1'
  } catch {
    return false
  }
}

// A new visitor starts with no goal picked, so the first yellow card on the form is their own choice.
function initialGoal(goal: string | null, profile: Profile): IntakeGoal | null {
  if (goal === 'stay' || goal === 'target') return goal
  if (goal === 'explore' && (profile.interests || wasUnsure())) return 'unsure'
  return goal === 'explore' ? 'explore' : null
}

// One numbered step of the form, ruled off from the one above.
function FormStep({ n, id, title, children }: { n: number; id: string; title: string; children: ReactNode }) {
  return (
    <section className="@container space-y-3 border-t border-border-subtle pt-5 lg:pt-6" aria-labelledby={id}>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-mono-m text-text-muted" aria-hidden="true">
          {String(n).padStart(2, '0')}
        </span>
        <h2 id={id} className="text-title-s text-text-primary">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

export function CheckUpView() {
  const t = useText(checkupText)
  const session = useGuestSession()
  const roleIndex = useRoleIndex()
  const pathways = usePathways()
  const roles = roleIndex.status === 'ready' ? roleIndex.data.roles : []
  const fields = pathways.status === 'ready' ? pathways.data.fields : []
  const [aliases, setAliases] = useState<RoleAlias[]>([])
  const saved = session.profile

  // A job title from the search bar (?job=) means the visitor is asking about their own job.
  const [situation, setSituation] = useState<Situation | null>(() =>
    new URLSearchParams(window.location.search).get('job') ? 'working' : saved.situation
  )
  const [education, setEducation] = useState<EducationLevel | null>(saved.education_level)
  const [field, setField] = useState<string | null>(saved.field_of_study)
  const [years, setYears] = useState<number | null>(saved.years_experience)
  const [job, setJob] = useState<Pick<Occupation, 'onet_code' | 'title'> | null>(null)
  const [goal, setGoal] = useState<IntakeGoal | null>(() => initialGoal(session.goal, saved))
  const [targets, setTargets] = useState<Pick<Occupation, 'onet_code' | 'title'>[]>([])
  const [areas, setAreas] = useState<string[]>(saved.interest_areas)
  const [restored, setRestored] = useState(false)
  const jobQuery = new URLSearchParams(window.location.search).get('job') ?? ''

  useEffect(() => {
    let current = true
    void fetchRoleAliases().then((list) => {
      if (current) setAliases(list)
    })
    return () => {
      current = false
    }
  }, [])

  // Coming back to the start keeps the job and target roles from the session, once the role index can name them.
  useEffect(() => {
    if (restored || roleIndex.status !== 'ready') return
    const byCode = new Map(roles.map((role) => [role.onet_code, role]))
    if (!jobQuery && session.role_code && byCode.has(session.role_code)) setJob(byCode.get(session.role_code)!)
    setTargets(saved.target_role_codes.flatMap((code) => (byCode.has(code) ? [byCode.get(code)!] : [])))
    setRestored(true)
  }, [jobQuery, restored, roleIndex.status, roles, saved.target_role_codes, session.role_code])

  const jobNow = hasJobNow(situation)
  // Between jobs or returning, "stay" becomes getting back into the last job, once the user has named it.
  const backToLastJob = (situation === 'between_jobs' || situation === 'returning') && job !== null
  const goals = goalOptions.filter((option) => option.id !== 'stay' || jobNow || backToLastJob)
  const effectiveGoal: IntakeGoal | null = goal === 'stay' && !jobNow && !backToLastJob ? 'explore' : goal
  const targetIsJob = job !== null && targets.some((target) => target.onet_code === job.onet_code)
  // Without a job to test, "show me where" needs something to go on, and Kopi suggests roles before any question.
  const suggestsFirst = effectiveGoal === 'unsure' || (effectiveGoal === 'explore' && !job)
  const canStart =
    situation !== null &&
    (effectiveGoal === 'stay'
      ? job !== null
      : effectiveGoal === 'target'
        ? targets.length > 0 && !targetIsJob
        : effectiveGoal === 'explore'
          ? job !== null || areas.length > 0 || (field !== null && field !== 'other')
          : effectiveGoal === 'unsure')
  const missing =
    situation === null
      ? t.copy.missingSituation
      : effectiveGoal === null
        ? t.copy.missingGoal
        : effectiveGoal === 'stay' && !job
          ? t.copy.missingJob
          : effectiveGoal === 'target' && targets.length === 0
            ? t.copy.missingTarget
            : effectiveGoal === 'explore' && !canStart
              ? t.copy.missingExplore
              : null

  const educationOptions = [
    { value: '', label: t.study.preferNot },
    ...EducationLevelSchema.options.map((level) => ({ value: level, label: t.study.qualifications[level] }))
  ]
  const yearOptions = [
    { value: '', label: t.study.preferNot },
    { value: '0', label: t.study.years.noneYet },
    { value: '1', label: t.study.years.underTwo() },
    { value: '2', label: t.study.years.range(2, 3) },
    { value: '4', label: t.study.years.range(4, 5) },
    { value: '6', label: t.study.years.range(6, 9) },
    { value: '10', label: t.study.years.orMore(10) }
  ]
  const jobSearchLabels =
    situation === 'working' || situation === null
      ? t.jobLabels.current
      : situation === 'between_jobs' || situation === 'returning'
        ? t.jobLabels.last
        : t.jobLabels.earlier

  const profileNow = (): Profile => ({
    situation,
    education_level: education,
    field_of_study: field,
    // A student's years are hidden on the form, so a value left from another situation never counts.
    years_experience: situation === 'studying' ? null : years,
    interest_areas: effectiveGoal === 'explore' ? areas : [],
    target_role_codes: effectiveGoal === 'target' ? targets.map((target) => target.onet_code) : [],
    interests: effectiveGoal === 'unsure' ? saved.interests : null,
    interest_activities: effectiveGoal === 'unsure' ? saved.interest_activities : []
  })

  // A new check-up starts from blank answers, so the radar never mixes two jobs' answers.
  const start = () => {
    if (!canStart || effectiveGoal === null) return
    rememberUnsure(effectiveGoal === 'unsure')
    const fresh = {
      role_code: job?.onet_code ?? null,
      answers: Array<Rating | null>(12).fill(null),
      plan_role_code: null,
      ticked_milestones: [],
      milestone_evidence: {},
      profile: profileNow()
    }
    if (suggestsFirst) {
      updateGuestSession({ ...fresh, goal: 'explore', target_role_code: null })
      navigate(effectiveGoal === 'unsure' ? `${routes.choose}?step=interests` : routes.choose)
      return
    }
    updateGuestSession({
      ...fresh,
      goal: effectiveGoal,
      target_role_code: effectiveGoal === 'target' ? targets[0]!.onet_code : null
    })
    navigate(routes.questions)
  }

  const speech = situation === null ? t.speech.greeting : suggestsFirst ? t.speech.noJob : t.speech.openWork

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 lg:gap-8">
      <Stepper step={1} />
      <KopiAside pose="idle" speech={speech} />

      <section className="space-y-1.5" aria-labelledby="about-heading">
        <h1 id="about-heading" className="text-title-m text-text-primary lg:text-title-l">
          {t.copy.heading}
        </h1>
        <p className="max-w-[65ch] text-body-s text-text-muted">{t.copy.intro}</p>
      </section>

      {/* One grid for the whole form (#410 polish): every step fills equal columns, so no card sits alone and every
          step ends on the same right edge. Five situations take one row once there is room, else two and one wide. */}
      <FormStep n={1} id="situation-heading" title={t.copy.situationHeading}>
        <div
          role="radiogroup"
          aria-labelledby="situation-heading"
          className="grid gap-3 @xl:grid-cols-2 @xl:[&>*:last-child]:col-span-2 @4xl:grid-cols-5 @4xl:[&>*:last-child]:col-span-1"
        >
          {situations.map((option) => (
            <ChoiceCard
              key={option.id}
              name="situation"
              value={option.id}
              title={t.situations[option.id].title}
              description={t.situations[option.id].description}
              icon={option.icon}
              selected={situation === option.id}
              onSelect={(value) => setSituation(value as Situation)}
              stacked
            />
          ))}
        </div>
      </FormStep>

      <FormStep n={2} id="study-heading" title={t.copy.studyHeading}>
        <div className={cn('grid gap-4', situation === 'studying' ? '@xl:grid-cols-2' : '@xl:grid-cols-3')}>
          <Select
            label={t.copy.qualification}
            options={educationOptions}
            value={education ?? ''}
            onChange={(value) => setEducation(value ? (value as EducationLevel) : null)}
          />
          <Select
            label={t.copy.field}
            options={[
              { value: '', label: t.study.preferNot },
              ...[...fields]
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((option) => ({ value: option.id, label: t.study.fields[option.id] ?? option.label }))
            ]}
            value={field ?? ''}
            onChange={(value) => setField(value || null)}
          />
          {situation !== 'studying' && (
            <Select
              label={t.copy.yearsExperience}
              options={yearOptions}
              value={years === null ? '' : String(years)}
              onChange={(value) => setYears(value === '' ? null : Number(value))}
            />
          )}
        </div>
      </FormStep>

      <FormStep n={3} id="work-heading" title={jobNow ? t.copy.work : t.copy.workIfAny}>
        <JobSearch
          key={restored ? 'restored' : 'initial'}
          roles={roles}
          aliases={aliases}
          ready={roleIndex.status === 'ready'}
          {...jobSearchLabels}
          accepted={job}
          onAccept={setJob}
          initialQuery={jobQuery || job?.title || ''}
        />
        <p className="text-body-s text-text-muted">{t.copy.jobSearchHint(900)}</p>
      </FormStep>

      <FormStep n={4} id="goal-heading" title={t.copy.goalHeading}>
        <div
          role="radiogroup"
          aria-labelledby="goal-heading"
          className={cn('grid gap-3', goals.length === 4 ? '@xl:grid-cols-2 @4xl:grid-cols-4' : '@2xl:grid-cols-3')}
        >
          {goals.map((option) => (
            <ChoiceCard
              key={option.id}
              name="goal"
              value={option.id}
              title={(option.id === 'stay' && backToLastJob ? t.goals.backToLastJob : t.goals[option.id]).title}
              description={
                option.id === 'target'
                  ? t.goals.target.description(3)
                  : (option.id === 'stay' && backToLastJob ? t.goals.backToLastJob : t.goals[option.id]).description
              }
              icon={option.icon}
              selected={effectiveGoal === option.id}
              onSelect={(value) => setGoal(value as IntakeGoal)}
              stacked
            />
          ))}
        </div>
      </FormStep>

      {effectiveGoal === 'target' && (
        <FormStep n={5} id="target-role-heading" title={t.copy.targetHeading}>
          <TargetPicker
            roles={roles}
            aliases={aliases}
            targets={targets}
            currentCode={job?.onet_code ?? null}
            onChange={setTargets}
          />
          {targetIsJob && (
            <p className="text-body-s text-state-error" role="status">
              {t.copy.targetDifferent}
            </p>
          )}
        </FormStep>
      )}

      {effectiveGoal === 'explore' && pathways.status === 'ready' && (
        <FormStep n={5} id="areas-heading" title={`${t.copy.areasHeading}${job ? t.copy.optional : ''}`}>
          <AreaPicker areas={pathways.data.areas} selected={areas} onChange={setAreas} />
        </FormStep>
      )}

      <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 space-y-2 rounded-md p-3 lg:static lg:rounded-none lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
        <p className={missing ? 'text-body-s text-text-muted' : 'sr-only'} role="status">
          {missing ?? ''}
        </p>
        <Button variant="primary" size="lg" fullWidth disabled={!canStart} onClick={start}>
          {suggestsFirst ? (
            <span className="inline-flex items-center gap-2">
              <Search className="h-5 w-5" aria-hidden="true" />
              {t.buttons.seeRoles}
            </span>
          ) : (
            t.buttons.startQuestions(12)
          )}
        </Button>
      </div>
    </div>
  )
}
