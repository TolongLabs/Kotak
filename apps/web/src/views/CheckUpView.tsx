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
import { useEffect, useState, type ComponentType } from 'react'
import {
  EDUCATION_LABELS,
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
import { ChoiceCard } from '../components/ui/ChoiceCard'
import { Select } from '../components/ui/Select'
import { checkUpSteps, Stepper } from '../components/ui/Stepper'
import { fetchRoleAliases, type RoleAlias } from '../engine/api'
import { usePathways, useRoleIndex } from '../engine/bundle'
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

const situations: { id: Situation; title: string; description: string; icon: Icon }[] = [
  { id: 'working', title: 'Working', description: 'I have a job now.', icon: Briefcase },
  { id: 'studying', title: 'Studying', description: 'I’m at school, college or university.', icon: BookOpen },
  {
    id: 'graduated',
    title: 'Graduated, Looking for Work',
    description: 'I’ve finished studying.',
    icon: GraduationCap
  },
  { id: 'between_jobs', title: 'Between Jobs', description: 'I’ve worked, and I’m looking again.', icon: Hourglass },
  {
    id: 'returning',
    title: 'Returning to Work',
    description: 'After a break, such as caring for family.',
    icon: RotateCcw
  }
]

const goalOptions: { id: IntakeGoal; title: string; description: string; icon: Icon }[] = [
  {
    id: 'stay',
    title: 'Stay Strong in My Job',
    description: 'Keep your current role safe as AI changes it.',
    icon: Briefcase
  },
  {
    id: 'target',
    title: 'Move to a Role I Have in Mind',
    description: 'Name up to 3 roles; the questions test you on the first.',
    icon: Route
  },
  {
    id: 'explore',
    title: 'Show Me Where I Could Go',
    description: 'Pick the areas that interest you, or let your job and study lead.',
    icon: PackageOpen
  },
  {
    id: 'unsure',
    title: 'I’m Not Sure Yet',
    description: 'Tell Kopi what you enjoy, and it suggests roles to try.',
    icon: Compass
  }
]

const educationOptions = [
  { value: '', label: 'Prefer Not to Say' },
  ...EducationLevelSchema.options.map((level) => ({ value: level, label: educationTitle(level) }))
]

function educationTitle(level: EducationLevel) {
  const titles: Record<EducationLevel, string> = {
    secondary: 'SPM or Equivalent',
    certificate: 'Certificate',
    diploma: 'Diploma',
    bachelor: 'Bachelor’s Degree',
    master: 'Master’s Degree',
    doctorate: 'Doctorate'
  }
  return titles[level] ?? EDUCATION_LABELS[level]
}

// Years of work as bands; each stores its lower bound, which the access rule compares with what a job needs.
const yearOptions = [
  { value: '', label: 'Prefer Not to Say' },
  { value: '0', label: 'None Yet' },
  { value: '1', label: 'Under 2 Years' },
  { value: '2', label: '2 to 3 Years' },
  { value: '4', label: '4 to 5 Years' },
  { value: '6', label: '6 to 9 Years' },
  { value: '10', label: '10 Years or More' }
]

const hasJobNow = (situation: Situation | null) => situation === 'working'
const jobLabel = (situation: Situation | null) =>
  situation === 'working' || situation === null
    ? { label: 'Your Job Title', placeholder: 'Type Your Job Title' }
    : situation === 'between_jobs' || situation === 'returning'
      ? { label: 'Your Last Job (Optional)', placeholder: 'Type Your Last Job Title' }
      : { label: 'A Job You’ve Had (Optional)', placeholder: 'Part-Time, Internship or Earlier Job' }

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

function initialGoal(goal: string | null, profile: Profile): IntakeGoal {
  if (goal === 'stay' || goal === 'target') return goal
  if (goal === 'explore' && (profile.interests || wasUnsure())) return 'unsure'
  return 'explore'
}

export function CheckUpView() {
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
  const [goal, setGoal] = useState<IntakeGoal>(() => initialGoal(session.goal, saved))
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
  const goals = goalOptions
    .filter((option) => option.id !== 'stay' || jobNow || backToLastJob)
    .map((option) =>
      option.id === 'stay' && backToLastJob
        ? {
            ...option,
            title: 'Get Back Into My Last Job',
            description: 'Test yourself on your last job as AI changes it.'
          }
        : option
    )
  const effectiveGoal: IntakeGoal = goal === 'stay' && !jobNow && !backToLastJob ? 'explore' : goal
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
          : true)
  const missing =
    situation === null
      ? 'Pick where you are right now.'
      : effectiveGoal === 'stay' && !job
        ? 'Type your job title to test you on it.'
        : effectiveGoal === 'target' && targets.length === 0
          ? 'Name the role you want.'
          : effectiveGoal === 'explore' && !canStart
            ? 'Pick an area, your field of study or a job, so Kopi has something to go on.'
            : null

  const profileNow = (): Profile => ({
    situation,
    education_level: education,
    field_of_study: field,
    // A student's years are hidden on the form, so a value left from another situation never counts.
    years_experience: situation === 'studying' ? null : years,
    interest_areas: effectiveGoal === 'explore' ? areas : [],
    target_role_codes: effectiveGoal === 'target' ? targets.map((target) => target.onet_code) : [],
    interests: effectiveGoal === 'unsure' ? saved.interests : null
  })

  // A new check-up starts from blank answers, so the radar never mixes two jobs' answers.
  const start = () => {
    if (!canStart) return
    rememberUnsure(effectiveGoal === 'unsure')
    const fresh = {
      role_code: job?.onet_code ?? null,
      answers: Array<Rating | null>(12).fill(null),
      plan_role_code: null,
      ticked_milestones: [],
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

  const speech =
    situation === null
      ? 'Hi, I’m Kopi. Tell me where you are, and I’ll find the roles worth checking.'
      : suggestsFirst
        ? 'No job to test yet? No problem. I’ll suggest roles first, then test you on the one you pick.'
        : 'Let’s open the box on your work.'

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 lg:gap-8">
      <Stepper step={1} labels={checkUpSteps} />
      <KopiAside pose="idle" speech={speech} />

      <section className="space-y-1.5" aria-labelledby="about-heading">
        <h1 id="about-heading" className="text-title-m text-text-primary lg:text-title-l">
          Tell Kopi About You
        </h1>
        <p className="text-body-s text-text-muted">
          Your study and situation decide which roles Kopi shows, and tell you when a role needs a qualification. It
          stays in this browser.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="situation-heading">
        <h2 id="situation-heading" className="text-label-l text-text-primary">
          Right Now, I’m
        </h2>
        <div role="radiogroup" aria-labelledby="situation-heading" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {situations.map((option) => (
            <ChoiceCard
              key={option.id}
              name="situation"
              value={option.id}
              title={option.title}
              description={option.description}
              icon={option.icon}
              selected={situation === option.id}
              onSelect={(value) => setSituation(value as Situation)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="study-heading">
        <h2 id="study-heading" className="text-label-l text-text-primary">
          Your Study and Experience
        </h2>
        <div className="grid max-w-[720px] gap-4 sm:grid-cols-2">
          <Select
            label="Highest Qualification"
            options={educationOptions}
            value={education ?? ''}
            onChange={(value) => setEducation(value ? (value as EducationLevel) : null)}
          />
          <Select
            label="Field of Study"
            options={[
              { value: '', label: 'Prefer Not to Say' },
              ...[...fields]
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((option) => ({ value: option.id, label: option.label }))
            ]}
            value={field ?? ''}
            onChange={(value) => setField(value || null)}
          />
          {situation !== 'studying' && (
            <Select
              label="Years of Work Experience"
              options={yearOptions}
              value={years === null ? '' : String(years)}
              onChange={(value) => setYears(value === '' ? null : Number(value))}
            />
          )}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="work-heading">
        <h2 id="work-heading" className="text-label-l text-text-primary">
          {jobNow ? 'Your Work' : 'Your Work, If Any'}
        </h2>
        <p className="text-body-s text-text-muted">
          Type a job title in any language. Kopi matches it to one of 900 job profiles.
        </p>
        <JobSearch
          key={restored ? 'restored' : 'initial'}
          roles={roles}
          aliases={aliases}
          ready={roleIndex.status === 'ready'}
          {...jobLabel(situation)}
          accepted={job}
          onAccept={setJob}
          initialQuery={jobQuery || job?.title || ''}
        />
      </section>

      <section className="space-y-3" aria-labelledby="goal-heading">
        <h2 id="goal-heading" className="text-label-l text-text-primary">
          What Do You Want?
        </h2>
        <div role="radiogroup" aria-labelledby="goal-heading" className="grid gap-4 sm:grid-cols-2">
          {goals.map((option) => (
            <ChoiceCard
              key={option.id}
              name="goal"
              value={option.id}
              title={option.title}
              description={option.description}
              icon={option.icon}
              selected={effectiveGoal === option.id}
              onSelect={(value) => setGoal(value as IntakeGoal)}
            />
          ))}
        </div>
      </section>

      {effectiveGoal === 'target' && (
        <section className="space-y-3" aria-labelledby="target-role-heading">
          <h2 id="target-role-heading" className="text-label-l text-text-primary">
            Which Roles Do You Want?
          </h2>
          <TargetPicker
            roles={roles}
            aliases={aliases}
            targets={targets}
            currentCode={job?.onet_code ?? null}
            onChange={setTargets}
          />
          {targetIsJob && (
            <p className="text-body-s text-state-error" role="status">
              Pick a role different from your current job.
            </p>
          )}
        </section>
      )}

      {effectiveGoal === 'explore' && pathways.status === 'ready' && (
        <section className="space-y-3" aria-labelledby="areas-heading">
          <h2 id="areas-heading" className="text-label-l text-text-primary">
            Areas That Interest You {job ? '(Optional)' : ''}
          </h2>
          <AreaPicker areas={pathways.data.areas} selected={areas} onChange={setAreas} />
        </section>
      )}

      <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 space-y-2 rounded-md p-3 lg:static lg:rounded-none lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
        <p className={missing ? 'text-body-s text-text-muted' : 'sr-only'} role="status">
          {missing ?? ''}
        </p>
        <Button variant="primary" size="lg" fullWidth disabled={!canStart} onClick={start}>
          {suggestsFirst ? (
            <span className="inline-flex items-center gap-2">
              <Search className="h-5 w-5" aria-hidden="true" />
              See Roles for Me
            </span>
          ) : (
            'Start the 12 Questions'
          )}
        </Button>
      </div>
    </div>
  )
}
