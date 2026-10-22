import {
  ExplanationRequestSchema,
  roleVerdicts,
  uniqueSources,
  type BundleRole,
  type ExplanationRequest,
  type Scenario,
  type SnapshotId,
  type Source
} from '@kotak/shared'
import type { Role, SourceRef } from '../../demo/types'
import type { CheckupRole } from '../../engine/checkup'

/** Generates Kopi's dialogue speech matching the screen state and engine data. */
export function kopiRoleSpeech(ranked: Role[]): string {
  const bestFit = ranked.reduce<Role | undefined>(
    (best, candidate) => (!best || candidate.fit > best.fit ? candidate : best),
    undefined
  )

  return bestFit ? `${bestFit.title} is your best fit at ${bestFit.fit}%.` : 'No role fit is available yet.'
}

const sourceKey = (source: Source) =>
  JSON.stringify([source.source_name, source.source_url, source.vintage_date, source.geo_or_layer])

/** Builds the role explanation and citations from that role's fit and verdict inputs. */
export function deriveRoleEvidence(
  checkupRole: CheckupRole | undefined,
  bundleRole: BundleRole | undefined,
  currentRole: BundleRole,
  snapshotId: SnapshotId
): { reasoning: string; reasoningPrefix: string; sources: SourceRef[] } {
  const verdicts = bundleRole ? roleVerdicts(bundleRole.signals[snapshotId]).corners : []
  const allSources = uniqueSources(verdicts.flatMap((verdict) => verdict.sources))
  const sourceNumber = new Map(allSources.map((source, i) => [sourceKey(source), i + 1]))
  const sources = allSources.map((source, i) => ({
    n: i + 1,
    name: source.source_name,
    detail: `${source.geo_or_layer} · ${source.vintage_date}`,
    href: source.source_url
  }))

  const cornerNames = new Map(bundleRole?.corners.map((corner) => [corner.corner_id, corner.name]))
  const terms = checkupRole?.fit.terms ?? []
  const fitTerms = terms.map((term) => {
    const name = cornerNames.get(term.corner_id) ?? term.corner_id
    return `${name}: ${term.term} (${term.user_level}/${term.target_level})`
  })

  const sharedCornerIds = new Set(
    checkupRole?.levels.flatMap((level) =>
      level.basis.from.filter((answer) => answer.onet_code === currentRole.onet_code).map((answer) => answer.corner_id)
    ) ?? []
  )
  const sharedSkills = currentRole.corners
    .filter((corner) => sharedCornerIds.has(corner.corner_id))
    .map((corner) => corner.name)

  const fitAndSkills = checkupRole
    ? `Fit terms are ${fitTerms.length ? fitTerms.join('; ') : 'unavailable'}; ${
        sharedSkills.length
          ? `shared skill links from your job include ${sharedSkills.join(', ')}`
          : 'no shared skill links from your job are shown'
      }.`
    : 'Fit terms and shared skill links from your job are unavailable.'

  const statuses = verdicts.map((verdict) => {
    const name = cornerNames.get(verdict.corner_id) ?? verdict.corner_id
    const status =
      verdict.status === 'Split'
        ? `Split (slow: ${verdict.futures.find((future) => future.scenario === 'slow')?.status ?? 'Unavailable'}, fast: ${verdict.futures.find((future) => future.scenario === 'fast')?.status ?? 'Unavailable'})`
        : verdict.status
    const citations = [...new Set(verdict.sources.map((source) => sourceNumber.get(sourceKey(source))).filter(Boolean))]
    return `${name}: ${status}${citations.length ? ` ${citations.map((n) => `[${n}]`).join(' ')}` : ''}`
  })
  const statusSummary = statuses.length
    ? `Verdict statuses are ${statuses.join('; ')}.`
    : 'Verdict statuses are unavailable.'

  return { reasoning: `${fitAndSkills} ${statusSummary}`, reasoningPrefix: fitAndSkills, sources }
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
