import {
  ExplanationRequestSchema,
  roleVerdicts,
  uniqueSources,
  type BundleRole,
  type ExplanationRequest,
  type GuestSession,
  type Scenario,
  type SnapshotId,
  type Source
} from '@kotak/shared'
import type { Role, SourceRef, VerdictId } from '../../demo/types'
import type { CheckupRole } from '../../engine/checkup'
import { roleOutlook, verdictId } from '../../engine/viewModel'
import { formatLevel } from './fit'

/** Generates Kopi's dialogue speech matching the screen state and engine data. */
export function kopiRoleSpeech(ranked: Role[], focus?: Role): string {
  if (focus) {
    const nextGap = focus.missing.split(', ')[0]
    return `${focus.title} fits you at ${focus.fit}%.${nextGap ? ` Close ${nextGap} next.` : ''}`
  }
  const bestFit = ranked.reduce<Role | undefined>(
    (best, candidate) => (!best || candidate.fit > best.fit ? candidate : best),
    undefined
  )

  return bestFit ? `${bestFit.title} is your best fit at ${bestFit.fit}%.` : 'No role fit is available yet.'
}

const sourceKey = (source: Source) =>
  JSON.stringify([source.source_name, source.source_url, source.vintage_date, source.geo_or_layer])

/** One cited skill row of the selected role, already rounded for display. */
export interface RoleSkillRow {
  verdict: VerdictId
  name: string
  you: string
  needed: string
  citation: number | null
}

export interface RoleEvidence {
  /** Why this role in at most 2 short sentences: outlook, biggest gap, one strength. */
  summary: string
  /** Gaps first, then strengths, rising skills first in each; at most 3, straight from the engine data. */
  rows: RoleSkillRow[]
  sources: SourceRef[]
}

/** Builds the role explanation, cited skill rows and citations from that role's fit and verdict inputs. */
export function deriveRoleEvidence(
  checkupRole: CheckupRole | undefined,
  bundleRole: BundleRole | undefined,
  snapshotId: SnapshotId
): RoleEvidence {
  if (!bundleRole || !checkupRole) return { summary: 'No read is available for this role yet.', rows: [], sources: [] }

  const verdicts = roleVerdicts(bundleRole.signals[snapshotId]).corners
  const allSources = uniqueSources(verdicts.flatMap((verdict) => verdict.sources))
  const sourceNumber = new Map(allSources.map((source, i) => [sourceKey(source), i + 1]))
  const sources = allSources.map((source, i) => ({
    n: i + 1,
    name: source.source_name,
    detail: `${source.geo_or_layer} · ${source.vintage_date}`,
    href: source.source_url
  }))

  const names = new Map(bundleRole.corners.map((corner) => [corner.corner_id, corner.name]))
  const targets = new Map(checkupRole.fit.terms.map((term) => [term.corner_id, term.target_level]))
  const levels = new Map(checkupRole.levels.map((level) => [level.corner_id, level.level]))

  const skills = verdicts.flatMap((verdict) => {
    const you = levels.get(verdict.corner_id)
    const needed = targets.get(verdict.corner_id)
    if (you === undefined || needed === undefined) return []
    const citation = verdict.sources.map((source) => sourceNumber.get(sourceKey(source))).find(Boolean) ?? null
    return [
      {
        verdict: verdictId(verdict.status),
        name: names.get(verdict.corner_id) ?? verdict.corner_id,
        you: formatLevel(you),
        needed: formatLevel(needed),
        citation
      }
    ]
  })
  if (skills.length === 0) return { summary: 'No skill read is available for this role yet.', rows: [], sources }

  const gap = (skill: { you: string; needed: string }) => Number(skill.needed) - Number(skill.you)
  const biggestGap = skills.filter((skill) => gap(skill) > 0).sort((a, b) => gap(b) - gap(a))[0]
  const biggestStrength = skills.filter((skill) => gap(skill) <= 0).sort((a, b) => gap(a) - gap(b))[0]

  const outlook = outlookText[roleOutlook(bundleRole, snapshotId)]
  const summary = [
    biggestGap
      ? `Outlook for this role is ${outlook}, and your biggest gap is ${biggestGap.name}.`
      : `Outlook for this role is ${outlook}, and you meet every needed level.`,
    biggestStrength ? `A strength to lean on is ${biggestStrength.name}.` : undefined
  ]
    .filter(Boolean)
    .join(' ')

  // Rising skills first in each group, so a role with no rising skill still shows its biggest gaps.
  const rank = (skill: (typeof skills)[number]) => (skill.verdict === 'rising' ? 0 : 1)
  const gaps = skills.filter((skill) => gap(skill) > 0).sort((a, b) => rank(a) - rank(b) || gap(b) - gap(a))
  const strengths = skills.filter((skill) => gap(skill) <= 0).sort((a, b) => rank(a) - rank(b) || gap(a) - gap(b))
  const rows: RoleSkillRow[] = [...gaps, ...strengths].slice(0, 3)

  return { summary, rows, sources }
}

const outlookText: Record<VerdictId, string> = {
  rising: 'Rising',
  steady: 'Steady',
  split: 'Split',
  unknown: 'Unknown',
  declining: 'Declining'
}

// Portrait order for "Show Me Where I Could Go": Rising, Steady, Split, Unknown, Declining, then by fit.
const outlookOrder: Record<VerdictId, number> = { rising: 0, steady: 1, split: 2, unknown: 3, declining: 4 }

const goalHeadings: Record<NonNullable<GuestSession['goal']>, string> = {
  stay: "Your Job's Future",
  target: 'Your Target Role',
  explore: 'Roles You Could Move To'
}

/** The heading the session goal asks for; the neutral list keeps the old one. */
export function sessionHeading(goal: GuestSession['goal']): string {
  return (goal && goalHeadings[goal]) || 'Roles That Fit You'
}

/** The card to select until the visitor picks one: the first rising role that is not their job, else the last. */
const defaultSelection = (roles: Role[]): string | null =>
  (
    roles.find((candidate) => !candidate.isCurrentJob && candidate.outlook === 'rising') ??
    (roles.length > 2 ? roles[2] : roles[0])
  )?.id ?? null

/** The role cards the session goal shows, and the card to select until the visitor picks one. */
export function pickDisplayRoles(
  goal: GuestSession['goal'],
  targetCode: string | null,
  ranked: Role[]
): { roles: Role[]; defaultId: string | null } {
  const currentJob = ranked.find((candidate) => candidate.isCurrentJob)
  const otherRoles = ranked.filter((candidate) => !candidate.isCurrentJob)
  const jobFirst = currentJob ? [currentJob, ...otherRoles.slice(0, 2)] : ranked.slice(0, 3)

  if (goal === 'target' && targetCode) {
    const target = ranked.find((candidate) => candidate.id === targetCode)
    if (target)
      return {
        roles: [target, ...otherRoles.filter((candidate) => candidate.id !== target.id).slice(0, 2)],
        defaultId: target.id
      }
  }

  if (goal === 'explore') {
    const sorted = [...ranked].sort((a, b) => outlookOrder[a.outlook] - outlookOrder[b.outlook] || b.fit - a.fit)
    const roles = sorted.slice(0, 3)
    return { roles, defaultId: defaultSelection(roles) }
  }

  return { roles: jobFirst, defaultId: defaultSelection(jobFirst) }
}

export function buildExplanationRequest(
  bundleRole: BundleRole,
  checkupRole: CheckupRole | undefined,
  snapshotId: SnapshotId,
  scenario: Scenario
): ExplanationRequest | null {
  if (!checkupRole || checkupRole.onet_code !== bundleRole.onet_code || bundleRole.corners.length !== 6) return null

  const verdicts = new Map(
    roleVerdicts(bundleRole.signals[snapshotId]).corners.map((verdict) => [verdict.corner_id, verdict])
  )
  const levels = new Map(checkupRole.levels.map((level) => [level.corner_id, level.level]))
  const request = {
    snapshot_id: snapshotId,
    corners: bundleRole.corners.map((corner) => {
      const verdict = verdicts.get(corner.corner_id)
      const userLevel = levels.get(corner.corner_id)
      if (!verdict || userLevel === undefined) return null
      return {
        corner_id: corner.corner_id,
        name: corner.name,
        verdict: verdict.status,
        user_level: userLevel,
        target_level: verdict.scenarios[scenario].target.value,
        sources: verdict.sources
      }
    })
  }

  if (request.corners.some((corner) => corner === null)) return null
  const parsed = ExplanationRequestSchema.safeParse(request)
  return parsed.success ? parsed.data : null
}
