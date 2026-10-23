import {
  candidateRoles,
  describeReasons,
  OUTLOOK_BONUS,
  roleAccess,
  type BundlePathways,
  type BundleRole,
  type Candidate,
  type CandidateReason,
  type Profile,
  type RoleAccess,
  type SnapshotId,
  type Source
} from '@kotak/shared'
import type { Bundle, RoleBundle } from './bundle'
import { assessedRoleCode } from './checkup'
import type { SuggestedRole } from './schemas'
import { roleOutlook } from './view'

// The wider pool and the access rule (#284) on top of the bundle: which roles the check-up ranks besides O*NET's
// related list, why each is there, and what stands in the way. The web app and the SDK's facade both call these, so
// the app, Kopi and MCP clients rank the same roles.

/** How many roles beyond O*NET's related list the check-up ranks. */
export const POOL_EXTRA = 18
/** How many candidates get their bundle file loaded for the outlook before suggestions are ranked. */
const SUGGEST_SHORTLIST = 24

/** True when the intake said anything: an empty profile keeps the check-up to O*NET's related roles, as before. */
export function hasProfile(profile: Profile): boolean {
  return (
    profile.situation !== null ||
    profile.education_level !== null ||
    profile.field_of_study !== null ||
    profile.interest_areas.length > 0 ||
    profile.target_role_codes.length > 0 ||
    profile.interests !== null
  )
}

export interface CheckupBundleInput {
  role_code: string | null
  goal: 'stay' | 'target' | 'explore'
  target_role_code: string | null
  profile: Profile
}

export interface CheckupBundle extends RoleBundle {
  pathways: BundlePathways
  /** The pool's candidates beyond O*NET's related roles, with why each is there. */
  candidates: Candidate[]
}

/**
 * Throws when the profile names a field of study or an area the pathways data doesn't have, listing the ids it does:
 * an unknown id would otherwise read as "no field" and could misstate a qualification.
 */
export function checkProfileIds(profile: Profile, pathways: BundlePathways): void {
  const fields = pathways.fields.map((field) => field.id)
  const areas = pathways.areas.map((area) => area.id)
  if (profile.field_of_study !== null && !fields.includes(profile.field_of_study))
    throw new Error(`Kotak has no field of study "${profile.field_of_study}". Use one of: ${fields.join(', ')}.`)
  const unknown = profile.interest_areas.filter((id) => !areas.includes(id))
  if (unknown.length) throw new Error(`Kotak has no area ${unknown.join(', ')}. Use up to 3 of: ${areas.join(', ')}.`)
}

/**
 * The assessed role, its related roles and the pool's extra roles, for the check-up to rank. "Stay strong" ranks
 * only the job's own related roles, as before: the user isn't looking to move.
 */
export async function loadCheckupBundle(bundle: Bundle, input: CheckupBundleInput): Promise<CheckupBundle> {
  const assessedCode = assessedRoleCode(input)
  if (!assessedCode)
    throw new Error('A check-up needs role_code (the current job), or the target goal with target_role_code.')
  const [pathways, main] = await Promise.all([bundle.pathways(), bundle.role(assessedCode)])
  checkProfileIds(input.profile, pathways)
  if (!hasProfile(input.profile) || input.goal === 'stay')
    return { ...(await bundle.roleBundle(assessedCode)), pathways, candidates: [] }

  // With a target, the user's job's own related roles come in too: what they already do can lead elsewhere.
  const current =
    input.role_code && input.role_code !== assessedCode ? await bundle.role(input.role_code).catch(() => null) : null
  const candidates = candidateRoles(input.profile, pathways, {
    currentCode: input.role_code,
    jobRelatedCodes: current?.related.map((related) => related.onet_code) ?? []
  })
  const skip = new Set([assessedCode, ...main.related.map((related) => related.onet_code)])
  const extra = candidates
    .filter((candidate) => !skip.has(candidate.onet_code))
    .slice(0, POOL_EXTRA)
    .map((candidate) => candidate.onet_code)
  return { ...(await bundle.roleBundle(assessedCode, extra)), pathways, candidates }
}

/**
 * Why a ranked role is there: the user's job, a target, a picked area, their field, their interests, related to
 * their job, or in the assessed role's own related list.
 */
export function rankedReasons(
  code: string,
  context: { role: BundleRole; roleCode: string | null; candidates: Candidate[] }
): CandidateReason[] {
  const reasons = new Set<CandidateReason>(context.candidates.find((c) => c.onet_code === code)?.reasons ?? [])
  if (code === context.roleCode) reasons.add('current')
  if (context.role.related.some((related) => related.onet_code === code)) reasons.add('related')
  if (code === context.role.onet_code && code !== context.roleCode) reasons.add('target')
  return [...reasons]
}

/** The access rule for a role; with no pathways file, every role is open. */
export function accessFor(
  code: string,
  profile: Profile,
  pathways: BundlePathways | null,
  roleCode: string | null
): RoleAccess {
  return roleAccess(code, profile, pathways ?? { professions: [], occupations: {} }, roleCode)
}

/**
 * The sources behind the pathways data: O*NET's preparation and interests, its Hot Technologies, the CIP to SOC
 * crosswalk and the regulators.
 */
export function pathwaysSources(pathways: BundlePathways): Source[] {
  return [pathways.sources.onet, pathways.sources.onet_tools, pathways.sources.cip_soc, pathways.sources.regulated]
}

/** The roles to suggest before any question: the candidates, with the outlook added, best first. */
export async function suggestRoles(
  bundle: Bundle,
  input: { profile: Profile; current_role_code: string | null; snapshot_id: SnapshotId; limit: number }
): Promise<SuggestedRole[]> {
  const pathways = await bundle.pathways()
  checkProfileIds(input.profile, pathways)
  const current = input.current_role_code ? await bundle.role(input.current_role_code).catch(() => null) : null
  const shortlist = candidateRoles(input.profile, pathways, {
    currentCode: input.current_role_code,
    jobRelatedCodes: current?.related.map((related) => related.onet_code) ?? []
  }).slice(0, SUGGEST_SHORTLIST)
  const loaded = await Promise.allSettled(shortlist.map((candidate) => bundle.role(candidate.onet_code)))
  return shortlist
    .flatMap((candidate, i) => {
      const result = loaded[i]!
      if (result.status !== 'fulfilled' || !result.value.questions_ready) return []
      const outlook = roleOutlook(result.value, input.snapshot_id)
      return [{ candidate, outlook, score: candidate.score + OUTLOOK_BONUS[outlook] }]
    })
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title))
    .slice(0, input.limit)
    .map(({ candidate, outlook }) => ({
      onet_code: candidate.onet_code,
      title: candidate.title,
      reasons: describeReasons(candidate, pathways, input.profile, { job: current?.title }),
      interest_match: candidate.interest_match === null ? null : Math.round(candidate.interest_match * 100) / 100,
      outlook,
      access: candidate.access
    }))
}
