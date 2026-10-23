import { Briefcase, PackageOpen, Route } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { Button } from '../components/ui/Button'
import { ChoiceCard } from '../components/ui/ChoiceCard'
import { SearchField } from '../components/ui/SearchField'
import { TextField } from '../components/ui/TextField'
import { checkUpSteps, Stepper } from '../components/ui/Stepper'
import { cn } from '../components/ui/cn'
import { normalizeTitle, type BundleRoleIndexEntry, type Occupation } from '@kotak/shared'
import { goals } from '../demo/data'
import type { Goal } from '../demo/types'
import { useRoleIndex } from '../engine/bundle'
import { assessedRoleCode } from '../engine/checkup'
import { fetchRoleAliases, fetchRoleMatch, type ApiResult, type RoleAlias } from '../engine/api'
import { updateGuestSession } from '../session/store'
import { KopiAside } from './checkup/KopiDialogue'
import type { RoleMatchResponse } from '@kotak/shared'

const goalIcons = { stay: Briefcase, target: Route, explore: PackageOpen }
// The three roles the team hand-checks (#104) plus Software Developers lead the list before anything is typed.
const suggestedCodes = ['15-1254.00', '15-1255.00', '43-3031.00', '15-1252.00']
const suggestedTitles: Record<string, string> = {
  '15-1252.00': 'Software Engineer'
}
const maxSuggestions = 8
// Approved market titles shown above the O*NET titles, so they never crowd the occupations out.
const maxAliasSuggestions = 3

function normalizeJobQuery(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}

function getRoleDisplayTitle(role: Pick<Occupation, 'onet_code' | 'title'>) {
  return suggestedTitles[role.onet_code] ?? role.title
}

function getRoleCodeLine(role: Pick<Occupation, 'onet_code' | 'title'>) {
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

// One row of the job-title suggestions: an O*NET occupation, or a market title an admin approved for one.
type RoleSuggestion = { key: string; role: BundleRoleIndexEntry; label: string; codeLine: string }

function roleSuggestion(role: BundleRoleIndexEntry): RoleSuggestion {
  return { key: role.onet_code, role, label: getRoleDisplayTitle(role), codeLine: getRoleCodeLine(role) }
}

// Up to three approved market titles that contain the query (normalised with normalizeJobQuery), for occupations in
// the role index, the exact title first. A title that repeats its occupation's own title, plural or not, shows as
// that occupation instead.
function aliasSuggestions(aliases: RoleAlias[], roles: BundleRoleIndexEntry[], query: string): RoleSuggestion[] {
  if (!aliases.length) return []
  const byCode = new Map(roles.map((role) => [role.onet_code, role]))
  const matches = aliases.flatMap((alias) => {
    const role = byCode.get(alias.onet_code)
    const aliasKey = normalizeJobQuery(alias.title)
    if (!role || !aliasKey.includes(query)) return []
    const title = normalizeTitle(alias.title)
    const suggestion =
      title === normalizeTitle(role.title) || title === normalizeTitle(getRoleDisplayTitle(role))
        ? roleSuggestion(role)
        : { key: `alias:${alias.title}`, role, label: alias.title, codeLine: `O*NET ${role.onet_code} · ${role.title}` }
    return [{ suggestion, exact: aliasKey === query }]
  })
  return matches
    .sort((a, b) => Number(b.exact) - Number(a.exact))
    .slice(0, maxAliasSuggestions)
    .map((match) => match.suggestion)
}

// Market titles first, then O*NET occupations, each occupation once.
function mergeSuggestions(...lists: RoleSuggestion[][]): RoleSuggestion[] {
  const seen = new Set<string>()
  return lists
    .flat()
    .filter((suggestion) => !seen.has(suggestion.key) && seen.add(suggestion.key))
    .slice(0, maxSuggestions)
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
  const roleIndex = useRoleIndex()
  const roles = roleIndex.status === 'ready' ? roleIndex.data.roles : []
  const searchRef = useRef<HTMLInputElement>(null)
  const [jobQuery, setJobQuery] = useState(getInitialJobQuery)
  const [acceptedJob, setAcceptedJob] = useState<Occupation | null>(null)
  const [suggestionsOpen, setSuggestionsOpen] = useState(true)
  const [targetQuery, setTargetQuery] = useState('')
  const [acceptedTarget, setAcceptedTarget] = useState<Occupation | null>(null)
  const [targetSuggestionsOpen, setTargetSuggestionsOpen] = useState(false)
  const [roleMatchState, setRoleMatchState] = useState<
    | { queryKey: string; status: 'loading' }
    | { queryKey: string; status: 'settled'; result: ApiResult<RoleMatchResponse> }
    | null
  >(null)
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null)
  const [submitVersion, setSubmitVersion] = useState(0)
  const [goalId, setGoalId] = useState<Goal['id']>('explore')
  const [aliases, setAliases] = useState<RoleAlias[]>([])

  useEffect(() => {
    let current = true
    void fetchRoleAliases().then((list) => {
      if (current) setAliases(list)
    })
    return () => {
      current = false
    }
  }, [])

  const queryKey = normalizeJobQuery(jobQuery)
  const normalizedQuery = queryKey
  const hasExactLocalMatch =
    queryKey.length > 0 &&
    (roles.some(
      (role) => normalizeJobQuery(role.title) === queryKey || normalizeJobQuery(getRoleDisplayTitle(role)) === queryKey
    ) ||
      aliases.some(
        (alias) =>
          normalizeJobQuery(alias.title) === queryKey && roles.some((role) => role.onet_code === alias.onet_code)
      ))
  const matchingSuggestions: RoleSuggestion[] = normalizedQuery
    ? mergeSuggestions(
        aliasSuggestions(aliases, roles, normalizedQuery),
        roles.filter((role) => matchesQuery(role, normalizedQuery)).map(roleSuggestion)
      )
    : getSuggestedRoles(roles).map(roleSuggestion)
  const currentRoleMatch = roleMatchState?.queryKey === queryKey ? roleMatchState : null
  const waitingForRoleMatch =
    roleIndex.status === 'ready' &&
    queryKey.length > 0 &&
    !hasExactLocalMatch &&
    !acceptedJob &&
    currentRoleMatch?.status !== 'settled'
  const roleMatchResponse = currentRoleMatch?.status === 'settled' ? currentRoleMatch.result : null
  const remoteOccupation = roleMatchResponse?.status === 'available' ? roleMatchResponse.data.occupation : null
  const hasRemoteSuggestion =
    remoteOccupation !== null &&
    roleMatchResponse?.status === 'available' &&
    !roleMatchResponse.data.fallback_reason &&
    roleMatchResponse.data.match_source !== 'none'
  const roleMatchFallback =
    currentRoleMatch?.status === 'settled' &&
    (currentRoleMatch.result.status === 'unavailable' ||
      !currentRoleMatch.result.data.occupation ||
      Boolean(currentRoleMatch.result.data.fallback_reason) ||
      currentRoleMatch.result.data.match_source === 'none')
  const noJobMatch =
    roleIndex.status === 'ready' &&
    normalizedQuery.length > 0 &&
    !acceptedJob &&
    !(hasExactLocalMatch && matchingSuggestions.length > 0) &&
    (roleMatchFallback || (matchingSuggestions.length === 0 && !waitingForRoleMatch && !hasRemoteSuggestion))
  const closeMatches = noJobMatch ? closestRoles(roles, normalizedQuery) : []
  const noMatchSuggestions = closeMatches.length ? closeMatches : noJobMatch ? getSuggestedRoles(roles) : []
  const isTargetGoal = goalId === 'target'
  const normalizedTargetQuery = normalizeJobQuery(targetQuery)
  const targetSuggestions: RoleSuggestion[] = normalizedTargetQuery
    ? mergeSuggestions(
        aliasSuggestions(aliases, roles, normalizedTargetQuery),
        roles.filter((role) => matchesQuery(role, normalizedTargetQuery)).map(roleSuggestion)
      )
    : []
  const targetMatchesJob =
    acceptedJob !== null && acceptedTarget !== null && acceptedJob.onet_code === acceptedTarget.onet_code
  const canStart = acceptedJob !== null && (!isTargetGoal || (acceptedTarget !== null && !targetMatchesJob))
  const assessedCode = assessedRoleCode({
    goal: goalId,
    role_code: acceptedJob?.onet_code ?? null,
    target_role_code: acceptedTarget?.onet_code ?? null
  })
  const previousAssessedCode = useRef(assessedCode)

  useEffect(() => {
    if (roleIndex.status !== 'ready' || !queryKey || hasExactLocalMatch || acceptedJob) return

    let current = true
    const delay = submittedQuery === queryKey ? 0 : 600
    const timer = window.setTimeout(() => {
      setRoleMatchState({ queryKey, status: 'loading' })
      void fetchRoleMatch(jobQuery.trim()).then((result) => {
        if (current) setRoleMatchState({ queryKey, status: 'settled', result })
      })
    }, delay)

    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [acceptedJob, hasExactLocalMatch, jobQuery, queryKey, roleIndex.status, submittedQuery, submitVersion])

  useEffect(() => {
    if (previousAssessedCode.current === assessedCode) return
    previousAssessedCode.current = assessedCode
    updateGuestSession({ answers: Array<boolean | null>(12).fill(null), plan_role_code: null })
  }, [assessedCode])

  const updateJobQuery = (value: string) => {
    setJobQuery(value)
    setAcceptedJob(null)
    setSuggestionsOpen(true)
  }

  const acceptJob = (role: Pick<Occupation, 'onet_code' | 'title'>, label = getRoleDisplayTitle(role)) => {
    setJobQuery(label)
    setAcceptedJob(role)
    setSuggestionsOpen(false)
  }

  const updateTargetQuery = (value: string) => {
    setTargetQuery(value)
    setAcceptedTarget(null)
    setTargetSuggestionsOpen(true)
    if (acceptedTarget) updateGuestSession({ target_role_code: null })
  }

  const acceptTarget = (role: Pick<Occupation, 'onet_code' | 'title'>, label = getRoleDisplayTitle(role)) => {
    setTargetQuery(label)
    setAcceptedTarget(role)
    setTargetSuggestionsOpen(false)
    updateGuestSession({ target_role_code: role.onet_code })
  }

  const selectGoal = (next: Goal['id']) => {
    setGoalId(next)
    if (next === 'target') return
    setTargetQuery('')
    setAcceptedTarget(null)
    setTargetSuggestionsOpen(false)
    updateGuestSession({ target_role_code: null })
  }

  const submitTitleMatch = () => {
    if (!queryKey || hasExactLocalMatch || acceptedJob) return
    setSubmittedQuery(queryKey)
    setSubmitVersion((version) => version + 1)
  }

  // A new check-up starts from blank answers, so the radar never mixes two jobs' answers.
  const startQuestions = () => {
    if (!acceptedJob || !canStart) return
    updateGuestSession({
      role_code: acceptedJob.onet_code,
      goal: goalId,
      target_role_code: isTargetGoal && acceptedTarget ? acceptedTarget.onet_code : null,
      answers: Array<boolean | null>(12).fill(null),
      plan_role_code: null,
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
      <div className="flex w-full min-w-0 flex-col gap-5 lg:gap-6">
        <h1 className="sr-only">Find Your Job</h1>
        <Stepper step={1} labels={checkUpSteps} />
        <KopiAside pose="worried" speech="Hmm, I couldn’t find that job. Try a simpler title?" />

        <div className="w-full min-w-0 max-w-[532px]">
          <TextFieldForNoMatch value={jobQuery} onChange={updateJobQuery} />
        </div>

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

        <div className="flex justify-center lg:justify-start">
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
    <div className="flex w-full min-w-0 flex-col gap-5 lg:gap-6">
      <Stepper step={1} labels={checkUpSteps} />
      <KopiAside pose="idle" speech="Hi, I’m Kopi. Let’s open the box on your job." />

      <section className="space-y-1.5" aria-labelledby="work-heading">
        <h1 id="work-heading" className="text-title-m text-text-primary lg:text-title-l">
          Tell Kopi About Your Work
        </h1>
        <p className="text-body-s text-text-muted">
          Type your job title in any language. Kopi matches it to one of 900 job profiles.
        </p>
      </section>

      <div className="w-full min-w-0 max-w-[532px] space-y-2">
        <SearchField
          ref={searchRef}
          label="Your Job Title"
          hideLabel
          placeholder="Type Your Job Title"
          shortcutHint=""
          value={jobQuery}
          onChange={(event) => updateJobQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submitTitleMatch()
            }
          }}
          onFocus={() => setSuggestionsOpen(true)}
          aria-controls={
            suggestionsOpen && (matchingSuggestions.length > 0 || waitingForRoleMatch || hasRemoteSuggestion)
              ? 'job-suggestions'
              : undefined
          }
          aria-expanded={
            suggestionsOpen && (matchingSuggestions.length > 0 || waitingForRoleMatch || hasRemoteSuggestion)
          }
        />
        {suggestionsOpen && (matchingSuggestions.length > 0 || waitingForRoleMatch || hasRemoteSuggestion) && (
          <ul
            id="job-suggestions"
            aria-label="Job Suggestions"
            className="w-full min-w-0 space-y-0.5 rounded-md border border-border-subtle bg-bg-default p-1 shadow-popover"
          >
            {waitingForRoleMatch && (
              <li aria-live="polite" className="px-3 py-2 text-body-s text-text-muted">
                Kopi is matching your title…
              </li>
            )}
            {hasRemoteSuggestion && remoteOccupation && roleMatchResponse?.status === 'available' && (
              <li>
                <button
                  type="button"
                  onClick={() => acceptJob(remoteOccupation)}
                  className="flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-1 rounded-sm bg-bg-panel px-3 py-2 text-left text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                >
                  <span className="w-full break-words text-label-l">
                    Kopi thinks you mean {getRoleDisplayTitle(remoteOccupation)}
                  </span>
                  <span className="font-mono text-mono-s text-text-muted">
                    {getRoleCodeLine(remoteOccupation)}
                    {roleMatchResponse.data.match_source === 'claude' && ' · Matched by Claude'}
                    {roleMatchResponse.data.match_source === 'title_search' && ' · Matched by Title Search'}
                  </span>
                </button>
              </li>
            )}
            {matchingSuggestions.map((suggestion, index) => (
              <li key={suggestion.key}>
                <button
                  type="button"
                  onClick={() => acceptJob(suggestion.role, suggestion.label)}
                  className={cn(
                    'flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-1 rounded-sm px-3 py-2 text-left text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2',
                    index === 0 && 'bg-bg-panel'
                  )}
                >
                  <span className="w-full break-words text-label-l">{suggestion.label}</span>
                  <span className="font-mono text-mono-s text-text-muted">{suggestion.codeLine}</span>
                </button>
              </li>
            ))}
            {matchingSuggestions.length > 0 && (
              <li className="px-2 py-1 text-body-s text-text-muted">
                Can’t find it? Type any title and Kopi will match it.
              </li>
            )}
          </ul>
        )}
      </div>

      <section className="space-y-3" aria-labelledby="goal-heading">
        <h2 id="goal-heading" className="text-label-l text-text-primary">
          What Do You Want?
        </h2>
        <div className="grid gap-4 xl:grid-cols-3">
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
                onSelect={(value) => selectGoal(value as Goal['id'])}
              />
            )
          })}
        </div>
      </section>

      {isTargetGoal && (
        <section className="space-y-3" aria-labelledby="target-role-heading">
          <h2 id="target-role-heading" className="text-label-l text-text-primary">
            Which Role Do You Want?
          </h2>
          <div className="w-full min-w-0 max-w-[532px] space-y-2">
            <SearchField
              label="Target Role"
              hideLabel
              placeholder="Type the Role You Want"
              shortcutHint=""
              value={targetQuery}
              onChange={(event) => updateTargetQuery(event.currentTarget.value)}
              onFocus={() => setTargetSuggestionsOpen(true)}
              aria-controls={
                targetSuggestionsOpen && targetSuggestions.length > 0 ? 'target-role-suggestions' : undefined
              }
              aria-expanded={targetSuggestionsOpen && targetSuggestions.length > 0}
            />
            {targetSuggestionsOpen && targetSuggestions.length > 0 && (
              <ul
                id="target-role-suggestions"
                aria-label="Target Role Suggestions"
                className="w-full min-w-0 space-y-0.5 rounded-md border border-border-subtle bg-bg-default p-1 shadow-popover"
              >
                {targetSuggestions.map((suggestion, index) => (
                  <li key={suggestion.key}>
                    <button
                      type="button"
                      onClick={() => acceptTarget(suggestion.role, suggestion.label)}
                      className={cn(
                        'flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-1 rounded-sm px-3 py-2 text-left text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2',
                        index === 0 && 'bg-bg-panel'
                      )}
                    >
                      <span className="w-full break-words text-label-l">{suggestion.label}</span>
                      <span className="font-mono text-mono-s text-text-muted">{suggestion.codeLine}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {targetMatchesJob && (
              <p className="text-body-s text-state-error" role="status">
                Pick a Role Different From Your Current Job.
              </p>
            )}
          </div>
        </section>
      )}

      <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 rounded-md p-3 lg:static lg:rounded-none lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
        <Button variant="primary" size="lg" fullWidth disabled={!canStart} onClick={startQuestions}>
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
