import { roleAccess } from './access'
import type { BundlePathways, CandidateReason, EducationLevel, InterestPicks, Profile, RoleAccess } from './schemas'

// Which roles to put in front of the user (#284), by fixed rules: the roles they named, the roles in the areas they
// picked, the jobs their field of study leads to (the NCES CIP to SOC crosswalk), the jobs that match the interests
// they picked (O*NET's interest scores) and the jobs O*NET lists as related to their job. Each reason adds a fixed
// weight. A qualification the user doesn't hold takes nothing away: the role says what it needs, and their answers
// show whether it suits them. Only a role that leads others, for a user without the years, and a job well below
// their qualification rank lower. The outlook, which needs each role's bundle file, is added by the caller once the
// shortlist is loaded.

export interface Candidate {
  onet_code: string
  title: string
  reasons: CandidateReason[]
  /** The user's picked areas the role is in. */
  area_ids: string[]
  /** How closely the job's interest scores follow the user's picks, 0 to 1; null without a usable pattern. */
  interest_match: number | null
  access: RoleAccess
  /** The fixed score before outlook; higher first. */
  score: number
}

const WEIGHTS: Record<CandidateReason, number> = {
  target: 10,
  area: 3,
  field: 3,
  interests: 0, // scaled by the match instead, below
  job_related: 1,
  related: 0, // the assessed role's own related list, which the check-up ranks anyway
  current: 0
}
const INTEREST_WEIGHT = 4
/** A match at or above this reads "Matches what you enjoy". */
const INTEREST_REASON = 0.5
/** Both a picked area and the field of study: a bridge from what the user studied to where they want to go. */
const BRIDGE_BONUS = 1
const ACCESS_PENALTY: Record<RoleAccess['status'], number> = {
  open: 0,
  register: 0,
  check_licence: 0,
  degree: 0,
  experience: 2,
  qualify: 0
}
// The O*NET Job Zone that matches each qualification: zone 4 needs considerable preparation, usually a degree.
const EXPECTED_ZONE: Record<EducationLevel, number> = {
  secondary: 2,
  certificate: 2,
  diploma: 3,
  bachelor: 4,
  master: 4,
  doctorate: 5
}
/** A digital area lists its core roles first: up to this much more for the first, less down the list. */
const AREA_CORE_BONUS = 1.5
/** How many of the closest interest matches join the pool when the user picked no area. */
const INTEREST_SHORTLIST = 40

/** True when the picks have a shape to match: some areas picked more than others. */
export const hasInterestPattern = (picks: InterestPicks) => picks.some((count) => count !== picks[0])

/**
 * How closely a job's interest scores follow the user's picks: Pearson's correlation, from 0 for no relation or an
 * opposite shape, up to 1 for the same shape. null when the picks are even across the six areas, which says nothing.
 */
export function interestMatch(picks: InterestPicks, scores: number[]): number | null {
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
  const [pickMean, scoreMean] = [mean(picks), mean(scores)]
  let numerator = 0
  let pickSquares = 0
  let scoreSquares = 0
  for (let i = 0; i < 6; i++) {
    const a = picks[i]! - pickMean
    const b = scores[i]! - scoreMean
    numerator += a * b
    pickSquares += a * a
    scoreSquares += b * b
  }
  if (pickSquares === 0 || scoreSquares === 0) return null
  return Math.max(0, numerator / Math.sqrt(pickSquares * scoreSquares))
}

/** Penalty for a job well below the user's qualification: underemployment, which graduates in Malaysia often face. */
function zonePenalty(zone: number | null, level: EducationLevel | null): number {
  if (zone === null || level === null) return 0
  const gap = zone - EXPECTED_ZONE[level]
  if (gap <= -2) return 2
  if (gap === -1) return 0.5
  return 0
}

export interface PoolOptions {
  /** The user's current job, if any; it is never a candidate. */
  currentCode: string | null
  /** O*NET's related occupations of the user's job, when it isn't the role the check-up assesses. */
  jobRelatedCodes?: string[]
}

/** Every candidate role with its reasons and fixed score, best first. Without any reason, the list is empty. */
export function candidateRoles(profile: Profile, pathways: BundlePathways, options: PoolOptions): Candidate[] {
  const reasons = new Map<string, Set<CandidateReason>>()
  const add = (code: string, reason: CandidateReason) => {
    if (code === options.currentCode || !pathways.occupations[code]) return
    const set = reasons.get(code) ?? new Set<CandidateReason>()
    set.add(reason)
    reasons.set(code, set)
  }
  for (const code of profile.target_role_codes) add(code, 'target')
  const areasOf = new Map<string, string[]>()
  const core = new Map<string, number>()
  for (const id of profile.interest_areas) {
    const area = pathways.areas.find((candidate) => candidate.id === id)
    area?.onet_codes.forEach((code, i) => {
      add(code, 'area')
      areasOf.set(code, [...(areasOf.get(code) ?? []), id])
      if (area.group === 'digital')
        core.set(code, Math.max(core.get(code) ?? 0, AREA_CORE_BONUS * (1 - i / area.onet_codes.length)))
    })
  }
  const field = pathways.fields.find((candidate) => candidate.id === profile.field_of_study)
  for (const code of field?.onet_codes ?? []) add(code, 'field')
  for (const code of options.jobRelatedCodes ?? []) add(code, 'job_related')

  const matches = new Map<string, number>()
  if (profile.interests && hasInterestPattern(profile.interests)) {
    for (const [code, occupation] of Object.entries(pathways.occupations)) {
      const match = occupation.interests ? interestMatch(profile.interests, occupation.interests) : null
      if (match !== null) matches.set(code, match)
    }
    // Without a picked area to aim at, the closest matches across all jobs join the pool beside the field's roles.
    if (profile.interest_areas.length === 0)
      [...matches]
        .sort((a, b) => b[1] - a[1])
        .slice(0, INTEREST_SHORTLIST)
        .forEach(([code]) => add(code, 'interests'))
  }

  return [...reasons]
    .map(([code, set]) => {
      const occupation = pathways.occupations[code]!
      const access = roleAccess(code, profile, pathways, options.currentCode)
      const match = matches.get(code) ?? null
      if (match !== null && match >= INTEREST_REASON) set.add('interests')
      else set.delete('interests')
      const list = [...set]
      const score =
        list.reduce((sum, reason) => sum + WEIGHTS[reason], 0) +
        (set.has('area') && set.has('field') ? BRIDGE_BONUS : 0) +
        (core.get(code) ?? 0) +
        (match ?? 0) * INTEREST_WEIGHT -
        ACCESS_PENALTY[access.status] -
        zonePenalty(occupation.job_zone, profile.education_level)
      return {
        onet_code: code,
        title: occupation.title,
        reasons: list,
        area_ids: areasOf.get(code) ?? [],
        interest_match: match,
        access,
        score
      }
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
}

/** The outlook bonus the caller adds once a candidate's bundle file is loaded. */
export const OUTLOOK_BONUS: Record<'rising' | 'steady' | 'split' | 'unknown' | 'declining', number> = {
  rising: 2,
  steady: 1,
  split: 0.5,
  unknown: 0,
  declining: -1
}

/** Why a candidate is on the list, in plain words, in a fixed order. */
export function describeReasons(
  candidate: Pick<Candidate, 'reasons' | 'area_ids'>,
  pathways: Pick<BundlePathways, 'areas' | 'fields'>,
  profile: Pick<Profile, 'field_of_study'>,
  titles: { assessed?: string; job?: string } = {}
): string[] {
  const field = pathways.fields.find((item) => item.id === profile.field_of_study)
  const areas = candidate.area_ids.flatMap((id) => pathways.areas.find((area) => area.id === id)?.label ?? [])
  const text: Record<CandidateReason, string | null> = {
    target: 'You named this role',
    area: areas.length ? `In ${areas.join(' and ')}` : null,
    field: field && field.onet_codes.length ? `Your ${field.label} study leads here` : null,
    interests: 'Matches what you enjoy',
    job_related: titles.job ? `Related to ${titles.job}` : 'Related to your job',
    related: titles.assessed ? `Related to ${titles.assessed}` : null,
    current: 'Your current job'
  }
  const order: CandidateReason[] = ['current', 'target', 'field', 'area', 'interests', 'job_related', 'related']
  return order.flatMap((reason) => (candidate.reasons.includes(reason) && text[reason] ? [text[reason]!] : []))
}
