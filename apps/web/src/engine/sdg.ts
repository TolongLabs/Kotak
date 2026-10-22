import type { BundleCorner } from '@kotak/shared'

/** The most frequent SDG goals across a role's corners ("8.5" counts as goal 8), ties going to the lower number. */
export function roleSdgGoals(corners: BundleCorner[], limit = 2): number[] {
  const counts = new Map<number, number>()
  for (const corner of corners) {
    const goals = new Set(
      corner.sdg_targets.map((target) => Number(target.split('.')[0])).filter((goal) => goal >= 1 && goal <= 17)
    )
    for (const goal of goals) counts.set(goal, (counts.get(goal) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([a, aCount], [b, bCount]) => bCount - aCount || a - b)
    .slice(0, Math.max(0, limit))
    .map(([goal]) => goal)
}
