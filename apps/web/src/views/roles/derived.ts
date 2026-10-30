import {
  ExplanationRequestSchema,
  needsQualification,
  roleVerdicts,
  uniqueSources,
  type BundleRole,
  type CandidateReason,
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
import { commonText } from '../../i18n/common'
import { textNow } from '../../i18n/text'
import { rolesText } from '../../i18n/messages/roles'

/** Generates Kopi's dialogue speech matching the screen state and engine data. */
export function kopiRoleSpeech(ranked: Role[], focus?: Role, pick?: { role: Role; reason: SelectionReason }): string {
  const t = textNow(rolesText)
  const common = textNow(commonText)
  const outlookKey: Record<VerdictId, keyof typeof common.verdicts> = {
    rising: 'Rising',
    steady: 'Steady',
    split: 'Split',
    unknown: 'Unknown',
    declining: 'Declining'
  }
  if (focus?.access?.profession && needsQualification(focus.access))
    return t.kopi.qualifiedFocus(focus.title, Boolean(focus.fitEstimated), focus.fit, focus.access.status === 'qualify')
  if (focus) {
    const nextGap = focus.missing.split(', ')[0]
    return t.kopi.focus(focus.title, Boolean(focus.fitEstimated), focus.fit, nextGap || undefined)
  }
  const bestFit = bestOf(ranked)
  // When Kopi highlights a Rising role over a better fit, say why, so the speech and the highlight agree.
  if (pick?.reason.kind === 'rising' && bestFit && bestFit.fit > pick.role.fit)
    return t.kopi.rising(
      pick.role.title,
      Boolean(pick.role.fitEstimated),
      pick.role.fit,
      common.verdicts.Rising,
      bestFit.title,
      bestFit.fit,
      common.verdicts[outlookKey[bestFit.outlook]]
    )

  return bestFit ? t.kopi.best(bestFit.title, bestFit.fit, Boolean(bestFit.fitEstimated)) : t.kopi.noRole
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
  const t = textNow(rolesText)
  const common = textNow(commonText)
  if (!bundleRole || !checkupRole) return { summary: t.kopi.noRead, rows: [], sources: [] }

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
  if (skills.length === 0) return { summary: t.kopi.noSkillRead, rows: [], sources }

  const gap = (skill: { you: string; needed: string }) => Number(skill.needed) - Number(skill.you)
  const biggestGap = skills.filter((skill) => gap(skill) > 0).sort((a, b) => gap(b) - gap(a))[0]
  const biggestStrength = skills.filter((skill) => gap(skill) <= 0).sort((a, b) => gap(a) - gap(b))[0]

  const outlookId = roleOutlook(bundleRole, snapshotId)
  const outlookKey: Record<VerdictId, keyof typeof common.verdicts> = {
    rising: 'Rising',
    steady: 'Steady',
    split: 'Split',
    unknown: 'Unknown',
    declining: 'Declining'
  }
  const outlook = common.verdicts[outlookKey[outlookId]]
  const summary = [
    t.kopi.outlookAndGap(outlook, biggestGap?.name ?? '', Boolean(biggestGap)),
    biggestStrength ? t.kopi.strength(biggestStrength.name) : undefined
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

// Portrait order for "Show Me Where I Could Go": Rising, Steady, Split, Unknown, Declining, then by fit.
const outlookOrder: Record<VerdictId, number> = { rising: 0, steady: 1, split: 2, unknown: 3, declining: 4 }

/** The heading the session goal asks for; the neutral list keeps the old one. */
export function sessionHeading(goal: GuestSession['goal']): string {
  const headings = textNow(rolesText).rolesView.heading
  if (goal === 'stay') return headings.stay
  if (goal === 'target') return headings.target
  if (goal === 'explore') return headings.explore
  return headings.default
}

/** The best fit of a list; the first one wins a tie, so the order of the cards breaks it. */
const bestOf = (roles: Role[]) =>
  roles.reduce<Role | undefined>((best, candidate) => (!best || candidate.fit > best.fit ? candidate : best), undefined)

/** Why a card is highlighted. The highlighted card is the one the details and the roadmap are for. */
export type SelectionReason =
  | { kind: 'picked' }
  | { kind: 'plan' }
  | { kind: 'target' }
  | { kind: 'rising'; count: number; besideJob: boolean }
  | { kind: 'fit' }

/** The bold line on the highlighted card, so a 75% card picked over an 84% one says why. */
export function selectionNote(reason: SelectionReason): string {
  const t = textNow(rolesText).rolesView
  const rising = textNow(commonText).verdicts.Rising
  switch (reason.kind) {
    case 'picked':
      return t.notePicked
    case 'plan':
      return t.notePlan
    case 'target':
      return t.noteTarget
    case 'rising':
      return t.noteRising(reason.count, reason.besideJob, rising)
    case 'fit':
      return t.noteFit(rising)
  }
}

/** Translates the shared package's reason labels by their stable reason enum; unknown labels keep their source text. */
export function translateRoleReasons(codes: CandidateReason[] | undefined, reasons: string[] | undefined): string[] {
  if (!codes || !reasons) return reasons ?? []
  const t = textNow(rolesText)
  const codeFor = (reason: string) =>
    codes.find((code) => {
      switch (code) {
        case 'target':
          return reason === 'You chose this role'
        case 'area':
          return reason.startsWith('In ')
        case 'field':
          return reason.startsWith('Your ') && reason.endsWith(' study leads here')
        case 'interests':
          return reason === 'Matches what you enjoy'
        case 'activity_area':
          return reason.startsWith('Your picks point to ')
        case 'job_related':
          return reason === 'Related to your job'
        case 'related':
          return reason.startsWith('Related to ') && reason !== 'Related to your job'
        case 'current':
          return reason === 'Your current job'
      }
    })
  return reasons.map((reason) => {
    const code = codeFor(reason)
    return code ? t.reason(code, reason) : reason
  })
}

/** The card to select until the visitor picks one: their best fit of the Rising roles that aren't their job, else their best fit. */
function defaultSelection(roles: Role[]): { defaultId: string | null; defaultReason: SelectionReason | null } {
  const others = roles.filter((candidate) => !candidate.isCurrentJob)
  const rising = others.filter((candidate) => candidate.outlook === 'rising')
  const pick = bestOf(rising) ?? bestOf(others) ?? roles[0]
  if (!pick) return { defaultId: null, defaultReason: null }
  const besideJob = roles.some((candidate) => candidate.isCurrentJob && candidate.outlook === 'rising')
  return {
    defaultId: pick.id,
    defaultReason: rising.length ? { kind: 'rising', count: rising.length, besideJob } : { kind: 'fit' }
  }
}

// Roles the user named or whose areas they picked come first, then the ones their field of study leads to, then the
// roles only related to the job. A qualification the user doesn't hold never moves a role down: its card says so.
const chosenRank = (role: Role) =>
  role.reasonCodes?.some((reason) => reason === 'area' || reason === 'target')
    ? 0
    : role.reasonCodes?.includes('field')
      ? 1
      : 2

/**
 * The role cards the session goal shows, and the card to select until the visitor picks one. With the intake's wider
 * pool (#284) the explore and target goals show 6 cards, the user's own choices first.
 */
export function pickDisplayRoles(
  goal: GuestSession['goal'],
  targetCode: string | null,
  ranked: Role[],
  options: { widened?: boolean; targets?: string[] } = {}
): { roles: Role[]; defaultId: string | null; defaultReason: SelectionReason | null } {
  const count = options.widened ? 6 : 3
  const currentJob = ranked.find((candidate) => candidate.isCurrentJob)
  const otherRoles = ranked.filter((candidate) => !candidate.isCurrentJob)
  const jobFirst = currentJob ? [currentJob, ...otherRoles.slice(0, 2)] : ranked.slice(0, 3)

  if (goal === 'target' && targetCode) {
    const target = ranked.find((candidate) => candidate.id === targetCode)
    if (target) {
      const named = (options.targets ?? []).flatMap((code) =>
        code === target.id ? [] : ranked.filter((candidate) => candidate.id === code)
      )
      const rest = otherRoles
        .filter((candidate) => candidate.id !== target.id && !named.includes(candidate))
        .sort((a, b) => (options.widened ? chosenRank(a) - chosenRank(b) : 0) || b.fit - a.fit)
      return {
        roles: [target, ...named, ...rest].slice(0, count),
        defaultId: target.id,
        defaultReason: { kind: 'target' }
      }
    }
  }

  if (goal === 'explore') {
    // A widened list orders by the pool's score, which already weighs the outlook and fit; the old list by outlook.
    const sorted = [...ranked].sort((a, b) =>
      options.widened
        ? chosenRank(a) - chosenRank(b) || (b.poolScore ?? 0) - (a.poolScore ?? 0)
        : outlookOrder[a.outlook] - outlookOrder[b.outlook] || b.fit - a.fit
    )
    const roles = sorted.slice(0, count)
    return { roles, ...defaultSelection(roles) }
  }

  return { roles: jobFirst, ...defaultSelection(jobFirst) }
}

export function buildExplanationRequest(
  bundleRole: BundleRole,
  checkupRole: CheckupRole | undefined,
  snapshotId: SnapshotId,
  scenario: Scenario
): ExplanationRequest | null {
  if (!checkupRole || checkupRole.onet_code !== bundleRole.onet_code) return null

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
