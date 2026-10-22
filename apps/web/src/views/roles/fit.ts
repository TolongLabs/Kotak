import { corners, goals, roles } from '../../demo/data'
import type { Role } from '../../demo/types'

export type GoalId = (typeof goals)[number]['id']
export type Coverage = 'Estimated From Your Answers' | 'Rough Estimate' | 'Not Asked Yet'

export interface MathsRow {
  name: string
  you: number | null
  needed: number | null
  counted: number | null
  coverage: Coverage
}

// Stand-in for #41 (the guest session's goal): ?goal= if valid, else "target".
export function getGoal(): GoalId {
  const goal = new URLSearchParams(window.location.search).get('goal')
  return goals.find((g) => g.id === goal)?.id ?? 'target'
}

// Highest fit first. For "stay" the current job leads, then two backups by fit.
export function rankRoles(goal: GoalId): Role[] {
  const byFit = [...roles].sort((a, b) => b.fit - a.fit)
  if (goal !== 'stay') return byFit.slice(0, 3)
  return [...byFit.filter((r) => r.isCurrentJob), ...byFit.filter((r) => !r.isCurrentJob)].slice(0, 3)
}

// Per-skill targets exist only for the current job (sample corners); others wait for the engine (#83).
export function hasTargets(role: Role) {
  return role.isCurrentJob
}

export function mathsRows(role: Role): MathsRow[] {
  if (!hasTargets(role)) {
    return corners.map((c) => ({ name: c.name, you: null, needed: null, counted: null, coverage: 'Not Asked Yet' }))
  }
  return corners.map((c) => ({
    name: c.name,
    you: c.you,
    needed: c.neededSlow,
    counted: Math.min(c.you, c.neededSlow),
    coverage: 'Estimated From Your Answers'
  }))
}

export function mathsTotals(rows: MathsRow[]) {
  const counted = rows.reduce((sum, r) => sum + (r.counted ?? 0), 0)
  const needed = rows.reduce((sum, r) => sum + (r.needed ?? 0), 0)
  return { counted, needed, fit: needed ? Math.round((counted / needed) * 100) : null }
}
