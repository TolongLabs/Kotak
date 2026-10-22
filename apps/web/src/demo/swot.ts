import type { Corner, Role, Swot, SwotItem } from './types'

export function deriveSwot(corners: Corner[], roles: Role[], scenario: 'slow' | 'fast'): Swot {
  const strengths: SwotItem[] = []
  const weaknesses: SwotItem[] = []
  const opportunities: SwotItem[] = []
  const threats: SwotItem[] = []

  for (const corner of corners) {
    const needed = scenario === 'slow' ? corner.neededSlow : corner.neededFast
    const detail = `You ${corner.you} · Needed ${needed}`

    if ((corner.verdict === 'rising' || corner.verdict === 'steady') && corner.you >= needed) {
      strengths.push({ label: corner.name, verdict: corner.verdict, detail })
    }

    if (
      (corner.verdict === 'rising' || corner.verdict === 'steady' || corner.verdict === 'split') &&
      corner.you < needed
    ) {
      weaknesses.push({ label: corner.name, verdict: corner.verdict, detail })
    }

    if (corner.verdict === 'declining' && corner.you >= 2) {
      threats.push({ label: corner.name, verdict: corner.verdict, detail })
    }
  }

  for (const role of roles) {
    if (!role.isCurrentJob && role.outlook === 'rising' && role.fit >= 60) {
      opportunities.push({
        label: role.title,
        verdict: role.outlook,
        detail: `${role.fit}% ${role.fitEstimated ? 'Estimated Fit' : 'Fit'}`
      })
    }
  }

  return { strengths, weaknesses, opportunities, threats }
}
