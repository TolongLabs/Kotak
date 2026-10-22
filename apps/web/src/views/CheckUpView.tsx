import { Briefcase, PackageOpen, Route } from 'lucide-react'
import { useRef, useState } from 'react'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { Button } from '../components/ui/Button'
import { ChoiceCard } from '../components/ui/ChoiceCard'
import { DatePicker } from '../components/ui/DatePicker'
import { SearchField } from '../components/ui/SearchField'
import { Slider } from '../components/ui/Slider'
import { TextField } from '../components/ui/TextField'
import { Stepper } from '../components/ui/Stepper'
import { cn } from '../components/ui/cn'
import type { BundleRoleIndexEntry } from '@kotak/shared'
import { goals } from '../demo/data'
import type { Goal } from '../demo/types'
import { useRoleIndex } from '../engine/bundle'
import { updateGuestSession, useGuestSession } from '../session/store'
import { KopiAside } from './checkup/KopiDialogue'

const stepLabels: [string, string, string, string, string] = ['Start', 'Questions', 'Radar', 'Roles', 'Plan']
const goalIcons = { stay: Briefcase, target: Route, explore: PackageOpen }
// The three roles the team hand-checks (#104) plus Software Developers lead the list before anything is typed.
const suggestedCodes = ['15-1254.00', '15-1255.00', '43-3031.00', '15-1252.00']
const suggestedTitles: Record<string, string> = {
  '15-1252.00': 'Software Engineer'
}
const maxSuggestions = 8

function getRoleDisplayTitle(role: BundleRoleIndexEntry) {
  return suggestedTitles[role.onet_code] ?? role.title
}

function getRoleCodeLine(role: BundleRoleIndexEntry) {
  const customTitle = suggestedTitles[role.onet_code]
  return customTitle ? `O*NET ${role.onet_code} · ${role.title}` : `O*NET ${role.onet_code}`
}

function getSuggestedRoles(roles: BundleRoleIndexEntry[]) {
  return suggestedCodes.flatMap((code) => {
    const role = roles.find((item) => item.onet_code === code)
    return role ? [role] : []
  })
}

function matchesQuery(role: BundleRoleIndexEntry, query: string) {
  return role.title.toLocaleLowerCase().includes(query) || getRoleDisplayTitle(role).toLocaleLowerCase().includes(query)
}

function getInitialJobQuery() {
  return new URLSearchParams(window.location.search).get('job') ?? ''
}

// Roles whose title starts with a word of the query, best fit first, for "Did You Mean".
function closestRoles(roles: BundleRoleIndexEntry[], query: string) {
  const words = query.split(/\s+/).filter((word) => word.length >= 3)

  return roles
    .map((role) => {
      const titleWords = `${role.title} ${getRoleDisplayTitle(role)}`.toLocaleLowerCase().split(/[^a-z0-9]+/)
      const score = words.reduce(
        (total, word) => total + (titleWords.some((titleWord) => titleWord.startsWith(word)) ? 1 : 0),
        0
      )
      return { role, score }
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score || left.role.title.length - right.role.title.length)
    .slice(0, 3)
    .map((match) => match.role)
}

export function CheckUpView() {
  const session = useGuestSession()
  const roleIndex = useRoleIndex()
  const roles = roleIndex.status === 'ready' ? roleIndex.data.roles : []
  const searchRef = useRef<HTMLInputElement>(null)
  const [jobQuery, setJobQuery] = useState(getInitialJobQuery)
  const [acceptedJob, setAcceptedJob] = useState<BundleRoleIndexEntry | null>(null)
  const [suggestionsOpen, setSuggestionsOpen] = useState(true)
  const [goalId, setGoalId] = useState<Goal['id']>('explore')
  const [hoursPerWeek, setHoursPerWeek] = useState(session.custom_weekly_hours ?? 4)
  const [startDate, setStartDate] = useState(() => new Date())

  const normalizedQuery = jobQuery.trim().toLocaleLowerCase()
  const matchingSuggestions = normalizedQuery
    ? roles.filter((role) => matchesQuery(role, normalizedQuery)).slice(0, maxSuggestions)
    : getSuggestedRoles(roles)
  const noJobMatch =
    roleIndex.status === 'ready' && normalizedQuery.length > 0 && matchingSuggestions.length === 0 && !acceptedJob
  const closeMatches = noJobMatch ? closestRoles(roles, normalizedQuery) : []
  const noMatchSuggestions = closeMatches.length ? closeMatches : noJobMatch ? getSuggestedRoles(roles) : []

  const updateJobQuery = (value: string) => {
    setJobQuery(value)
    setAcceptedJob(null)
    setSuggestionsOpen(true)
  }

  const acceptJob = (role: BundleRoleIndexEntry) => {
    setJobQuery(getRoleDisplayTitle(role))
    setAcceptedJob(role)
    setSuggestionsOpen(false)
  }

  // A new check-up starts from blank answers, so the radar never mixes two jobs' answers.
  const startQuestions = () => {
    if (!acceptedJob) return
    updateGuestSession({
      role_code: acceptedJob.onet_code,
      goal: goalId,
      custom_weekly_hours: hoursPerWeek,
      answers: Array<boolean | null>(12).fill(null),
      ticked_milestones: []
    })
    navigate(routes.questions)
  }

  const browseJobs = () => {
    setJobQuery('')
    setAcceptedJob(null)
    setSuggestionsOpen(true)
    searchRef.current?.focus()
  }

  if (noJobMatch) {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-[45rem] flex-col gap-5 lg:gap-6">
        <h1 className="sr-only">Find Your Job</h1>
        <Stepper step={1} labels={stepLabels} />
        <KopiAside pose="worried" speech="Hmm, I couldn’t find that job. Try a simpler title?" />

        <TextFieldForNoMatch value={jobQuery} onChange={updateJobQuery} />

        <section className="space-y-3" aria-labelledby="did-you-mean-heading">
          <h2 id="did-you-mean-heading" className="text-label-l text-text-primary">
            Did You Mean
          </h2>
          <div className="flex flex-wrap gap-2">
            {noMatchSuggestions.map((role) => (
              <Button
                key={role.onet_code}
                variant="secondary"
                size="lg"
                className="max-w-full"
                onClick={() => acceptJob(role)}
              >
                <span className="truncate">{getRoleDisplayTitle(role)}</span>
              </Button>
            ))}
          </div>
        </section>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={browseJobs}
            className="inline-flex h-12 items-center justify-center rounded-sm px-2 text-label-l font-semibold text-text-primary underline underline-offset-4 transition-colors duration-150 ease-out hover:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Browse All 900 Jobs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[45rem] flex-col gap-5 lg:gap-6">
      <Stepper step={1} labels={stepLabels} />
      <KopiAside pose="idle" speech="Hi, I’m Kopi. Let’s open the box on your job." />

      <section className="space-y-1.5" aria-labelledby="work-heading">
        <h1 id="work-heading" className="text-title-m text-text-primary">
          Tell Kopi About Your Work
        </h1>
        <p className="text-body-s text-text-muted">
          Type your job title in any language. Kopi matches it to one of 900 job profiles.
        </p>
      </section>

      <div className="w-full min-w-0 space-y-2 lg:max-w-[342px]">
        <SearchField
          ref={searchRef}
          label="Your Job Title"
          hideLabel
          placeholder="Type Your Job Title"
          shortcutHint=""
          value={jobQuery}
          onChange={(event) => updateJobQuery(event.currentTarget.value)}
          onFocus={() => setSuggestionsOpen(true)}
          aria-controls={suggestionsOpen && matchingSuggestions.length > 0 ? 'job-suggestions' : undefined}
          aria-expanded={suggestionsOpen && matchingSuggestions.length > 0}
        />
        {suggestionsOpen && matchingSuggestions.length > 0 && (
          <ul
            id="job-suggestions"
            aria-label="Job Suggestions"
            className="w-full min-w-0 space-y-0.5 rounded-md border border-border-subtle bg-bg-default p-1 shadow-popover"
          >
            {matchingSuggestions.map((role, index) => (
              <li key={role.onet_code}>
                <button
                  type="button"
                  onClick={() => acceptJob(role)}
                  className={cn(
                    'flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-1 rounded-sm px-3 py-2 text-left text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2',
                    index === 0 && 'bg-bg-panel'
                  )}
                >
                  <span className="w-full break-words text-label-l">{getRoleDisplayTitle(role)}</span>
                  <span className="font-mono text-mono-s text-text-muted">{getRoleCodeLine(role)}</span>
                </button>
              </li>
            ))}
            <li className="px-2 py-1 text-body-s text-text-muted">
              Can’t find it? Type any title and Kopi will match it.
            </li>
          </ul>
        )}
      </div>

      <section className="space-y-3" aria-labelledby="goal-heading">
        <h2 id="goal-heading" className="text-label-l text-text-primary">
          What Do You Want?
        </h2>
        <div className="space-y-3">
          {goals.map((goal) => {
            const Icon = goalIcons[goal.id]

            return (
              <ChoiceCard
                key={goal.id}
                name="goal"
                value={goal.id}
                title={goal.title}
                description={goal.description}
                icon={Icon}
                selected={goalId === goal.id}
                onSelect={(value) => setGoalId(value as Goal['id'])}
              />
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Slider
          label="Hours per Week"
          min={1}
          max={10}
          step={1}
          value={hoursPerWeek}
          onChange={setHoursPerWeek}
          unit="h"
        />
        <DatePicker label="Plan Start Date" value={startDate} onChange={setStartDate} />
      </div>

      <div className="surface-glass sticky bottom-3 z-10 rounded-md p-3 lg:static lg:rounded-none lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
        <Button variant="primary" size="lg" fullWidth disabled={!acceptedJob} onClick={startQuestions}>
          Start the 12 Questions
        </Button>
      </div>
    </div>
  )
}

function TextFieldForNoMatch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TextField
      label="Your Job Title"
      icon={Briefcase}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      error="We couldn't match that title. Try a simpler one, like 'web developer'."
    />
  )
}
