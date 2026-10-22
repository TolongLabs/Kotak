import { Briefcase, PackageOpen, Route } from 'lucide-react'
import { useRef, useState } from 'react'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { Checkbox } from '../components/ui/Checkbox'
import { ChoiceCard } from '../components/ui/ChoiceCard'
import { DatePicker } from '../components/ui/DatePicker'
import { SearchField } from '../components/ui/SearchField'
import { SdgChip } from '../components/ui/SdgChip'
import { Slider } from '../components/ui/Slider'
import { TextField } from '../components/ui/TextField'
import { Stepper } from '../components/ui/Stepper'
import { goals, impactAreas, jobSuggestions, nationalView, noMatchSuggestions, roadmap, user } from '../demo/data'
import type { Goal } from '../demo/types'

const stepLabels: [string, string, string, string, string] = ['Start', 'Questions', 'Radar', 'Roles', 'Plan']
const goalIcons = { stay: Briefcase, target: Route, explore: PackageOpen }

function getInitialJobQuery() {
  return new URLSearchParams(window.location.search).get('job') ?? ''
}

function getDefaultStartDate() {
  const schedule = roadmap[0]?.when.split('·')[1]?.trim()
  const match = schedule?.match(/^(\d+)[–-]\d+\s+([A-Za-z]+)/)
  const year = user.lastCheckUp.match(/\d{4}/)?.[0]

  if (!match || !year) return new Date()

  const monthIndex = new Date(`${match[2]} 1, ${year}`).getMonth()
  return new Date(Number(year), monthIndex, Number(match[1]))
}

export function CheckUpView() {
  const searchRef = useRef<HTMLInputElement>(null)
  const [jobQuery, setJobQuery] = useState(getInitialJobQuery)
  const [acceptedJob, setAcceptedJob] = useState<string | null>(null)
  const [suggestionsOpen, setSuggestionsOpen] = useState(true)
  const [goalId, setGoalId] = useState<Goal['id']>('explore')
  const [selectedImpact, setSelectedImpact] = useState<number | null>(impactAreas[0]?.sdg ?? null)
  const [hoursPerWeek, setHoursPerWeek] = useState(roadmap[1]?.hoursPerWeek ?? 1)
  const [startDate, setStartDate] = useState(getDefaultStartDate)
  const [anonymousResult, setAnonymousResult] = useState(false)

  const normalizedQuery = jobQuery.trim().toLocaleLowerCase()
  const matchingSuggestions = jobSuggestions.filter(
    (suggestion) => !normalizedQuery || suggestion.title.toLocaleLowerCase().includes(normalizedQuery)
  )
  const noJobMatch = normalizedQuery.length > 0 && matchingSuggestions.length === 0 && acceptedJob !== jobQuery

  const updateJobQuery = (value: string) => {
    setJobQuery(value)
    setAcceptedJob(null)
    setSuggestionsOpen(true)
  }

  const acceptJob = (title: string) => {
    setJobQuery(title)
    setAcceptedJob(title)
    setSuggestionsOpen(false)
  }

  const browseJobs = () => {
    setJobQuery('')
    setAcceptedJob(null)
    setSuggestionsOpen(true)
    searchRef.current?.focus()
  }

  if (noJobMatch) {
    return (
      <div className="mx-auto w-full max-w-[45rem] space-y-6">
        <h1 className="sr-only">Find Your Job</h1>
        <Stepper step={1} labels={stepLabels} />
        <Banner type="sample" />
        <CatDialogue pose="worried" speech="Hmm, I couldn’t find that job. Try a simpler title?" />

        <TextFieldForNoMatch value={jobQuery} onChange={updateJobQuery} />

        <section className="space-y-3" aria-labelledby="did-you-mean-heading">
          <h2 id="did-you-mean-heading" className="text-label-l text-text-primary">
            Did You Mean
          </h2>
          <div className="flex flex-wrap gap-2">
            {noMatchSuggestions.map((suggestion) => (
              <Button key={suggestion} variant="secondary" onClick={() => acceptJob(suggestion)}>
                {suggestion}
              </Button>
            ))}
          </div>
        </section>

        <div className="flex justify-center">
          <Button variant="ghost" onClick={browseJobs}>
            Browse All 900 Jobs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[45rem] space-y-6">
      <Stepper step={1} labels={stepLabels} />
      <Banner type="sample" />
      <CatDialogue pose="idle" speech="Hi, I’m Kopi. Let’s open the box on your job." />

      <section className="space-y-1.5" aria-labelledby="work-heading">
        <h1 id="work-heading" className="text-title-m text-text-primary">
          Tell Kopi About Your Work
        </h1>
        <p className="text-body-s text-text-muted">
          Type your job title in any language. Kopi matches it to one of 900 job profiles.
        </p>
      </section>

      <div className="space-y-2">
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
            className="space-y-0.5 rounded-sm border border-border-subtle bg-bg-default p-1 shadow-popover"
          >
            {matchingSuggestions.map((suggestion) => (
              <li key={suggestion.onet}>
                <button
                  type="button"
                  onClick={() => acceptJob(suggestion.title)}
                  className="flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-1 rounded-sm px-3 py-2 text-left text-text-primary hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                >
                  <span className="text-body-m">{suggestion.title}</span>
                  <span className="font-mono text-mono-s text-text-muted">
                    {suggestion.onetTitle} · O*NET {suggestion.onet}
                  </span>
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

      <section className="space-y-3" aria-labelledby="impact-heading">
        <div className="space-y-1">
          <h2 id="impact-heading" className="text-label-l text-text-primary">
            Where Do You Want to Make a Difference?
          </h2>
          <p className="text-body-s text-text-muted">Your practice projects will serve this goal.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {impactAreas.map((area) => {
            const selected = selectedImpact === area.sdg

            return (
              <button
                key={area.sdg}
                type="button"
                aria-label={`SDG ${area.sdg}: ${area.label}`}
                aria-pressed={selected}
                onClick={() => setSelectedImpact(area.sdg)}
                className={
                  'inline-flex min-h-11 items-center rounded-full bg-bg-default px-1 focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ' +
                  (selected ? 'border-[1.5px] border-text-primary' : 'border border-transparent')
                }
              >
                <SdgChip goal={area.sdg} />
              </button>
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

      <div className="space-y-1">
        <Checkbox
          label="Add my anonymous result to the national view"
          checked={anonymousResult}
          onChange={setAnonymousResult}
        />
        <p className="pl-8 text-body-s text-text-muted">{nationalView.howCounted.privacy}</p>
      </div>

      <div className="surface-glass sticky bottom-3 z-10 rounded-md p-3 lg:static lg:rounded-none lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(routes.questions)}>
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
