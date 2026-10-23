import { RIASEC, type InterestPicks } from './schemas'

// The "I'm not sure" screen (#284): 18 everyday activities, 3 for each of Holland's six interest areas, written by
// the team for Malaysian school leavers and graduates. It is a pointer, not a test: the picks are matched to
// O*NET's occupational interest scores (pool.ts), which use the same six areas.

export interface InterestActivity {
  id: string
  area: (typeof RIASEC)[number]
  label: string
}

export const INTEREST_ACTIVITIES: InterestActivity[] = [
  { id: 'build-with-hands', area: 'R', label: 'Fix or build things with my hands' },
  { id: 'work-with-machines', area: 'R', label: 'Work outdoors or with machines and tools' },
  { id: 'set-up-equipment', area: 'R', label: 'Set up computers, networks or equipment' },
  { id: 'solve-puzzles', area: 'I', label: 'Solve puzzles and work out how things work' },
  { id: 'analyse-data', area: 'I', label: 'Analyse data to find patterns' },
  { id: 'research-deeply', area: 'I', label: 'Research a question in depth' },
  { id: 'design-looks', area: 'A', label: 'Design how something looks or feels' },
  { id: 'make-media', area: 'A', label: 'Write, draw, film or make music' },
  { id: 'original-ideas', area: 'A', label: 'Come up with original ideas' },
  { id: 'teach-explain', area: 'S', label: 'Teach or explain things to people' },
  { id: 'help-problems', area: 'S', label: 'Help people with their problems' },
  { id: 'care-wellbeing', area: 'S', label: 'Look after people’s health or wellbeing' },
  { id: 'lead-team', area: 'E', label: 'Lead a team or a project' },
  { id: 'persuade-sell', area: 'E', label: 'Persuade people or sell to them' },
  { id: 'run-business', area: 'E', label: 'Start or run a business' },
  { id: 'organise-records', area: 'C', label: 'Organise records, files or schedules' },
  { id: 'check-details', area: 'C', label: 'Check details and catch mistakes' },
  { id: 'work-numbers', area: 'C', label: 'Work with numbers, budgets or accounts' }
]

/**
 * The career areas (data/pathways/career-areas.json) an activity's subject belongs to. The six interest scores carry
 * only a shape, so "set up computers" and "analyse data" alone match a zoologist better than a network engineer.
 * Activities that name no subject, such as solving puzzles, have none. build:data checks the ids.
 */
export const ACTIVITY_AREAS: Record<string, string[]> = {
  'set-up-equipment': ['cloud-and-infrastructure', 'cybersecurity'],
  'analyse-data': ['ai-and-data'],
  'research-deeply': ['science-and-research'],
  'design-looks': ['design-and-ux'],
  'make-media': ['arts-media-and-communication'],
  'teach-explain': ['education-and-training'],
  'help-problems': ['community-and-social-services'],
  'care-wellbeing': ['health-and-care'],
  'lead-team': ['management'],
  'persuade-sell': ['sales-and-marketing'],
  'organise-records': ['office-and-administration'],
  'work-numbers': ['business-and-finance']
}

/** At least this many picks before Kotak matches them. */
export const MIN_INTEREST_PICKS = 3

/** The picks per area, in RIASEC order, from the chosen activity ids. */
export function interestPicks(activityIds: string[]): InterestPicks {
  const counts = RIASEC.map(
    (area) =>
      INTEREST_ACTIVITIES.filter((activity) => activity.area === area && activityIds.includes(activity.id)).length
  )
  return counts as InterestPicks
}

/** The career areas the chosen activities are about, each once, in the activities' order. */
export function activityAreas(activityIds: string[]): string[] {
  const picked = INTEREST_ACTIVITIES.filter((activity) => activityIds.includes(activity.id))
  return [...new Set(picked.flatMap((activity) => ACTIVITY_AREAS[activity.id] ?? []))]
}
