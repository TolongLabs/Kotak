// What the AI futures switch changes on a screen (#389), so its receipt can say so: the moves are often a point or
// a tenth of a level, too small to spot on a chart. Both futures come from the same engine run or from a second run
// with the other scenario; these helpers only compare them.

/** How many skills' needed levels differ between the futures, as the radar draws them (half-level steps). */
export function radarFutureDiff(corners: { neededSlow: number; neededFast: number }[]) {
  const moved = corners.filter((corner) => Math.round(corner.neededSlow * 10) !== Math.round(corner.neededFast * 10))
  return { moved: moved.length, total: corners.length }
}

/** Among the shown roles, the one whose whole-percent fit moves most between the futures; null when none moves. */
export function biggestFitMove(
  shown: { id: string; title: string }[],
  slowFit: Map<string, number>,
  fastFit: Map<string, number>
): { title: string; from: number; to: number } | null {
  let best: { title: string; from: number; to: number } | null = null
  for (const role of shown) {
    const from = slowFit.get(role.id)
    const to = fastFit.get(role.id)
    if (from === undefined || to === undefined || from === to) continue
    if (!best || Math.abs(to - from) > Math.abs(best.to - best.from)) best = { title: role.title, from, to }
  }
  return best
}
