// Scans every O*NET occupation for what the April to May 2026 Economic Index switch changes (#86) and ranks demo
// candidates by what May shows. Corners are those the client bundle ships (scripts/build-data/corners.ts).
// Run: bun scripts/scan-verdict-flips.ts [--top 15]. Writes the full list to .cache/scan/verdict-flips.json.

import {
  AeiSnapshotSchema,
  diffSnapshots,
  DosmDemandSchema,
  onetLinks,
  OnetOccupationsFileSchema,
  OnetTasksFileSchema,
  OnetWorkActivitiesFileSchema,
  resolveRoleSignals,
  roleVerdicts,
  SnapshotDiffSchema,
  type RoleSignals
} from '../packages/shared/src/index'
import { loadCorners, type FoundCorners } from './build-data/corners'

const ROOT = `${import.meta.dir}/..`
const load = async <T>(path: string, schema: { parse: (v: unknown) => T }) =>
  schema.parse(await Bun.file(`${ROOT}/${path}`).json())

const [occupations, tasks, activities, april, may, jmi] = await Promise.all([
  load('data/onet/occupations.json', OnetOccupationsFileSchema),
  load('data/onet/tasks.json', OnetTasksFileSchema),
  load('data/onet/work-activities.json', OnetWorkActivitiesFileSchema),
  load('data/snapshots/aei/2026-04.json', AeiSnapshotSchema),
  load('data/snapshots/aei/2026-05.json', AeiSnapshotSchema),
  load('data/snapshots/dosm-jmi.json', DosmDemandSchema)
])
const links = onetLinks(tasks.tasks, activities)
const cornersByCode = await loadCorners(ROOT, tasks.tasks)
const topArg = process.argv.indexOf('--top')
const TOP = topArg > 0 ? Number(process.argv[topArg + 1]) : 15

// Resolve every occupation in both snapshots.
const roles = new Map<string, { title: string; corners: FoundCorners['corners']; apr: RoleSignals; may: RoleSignals }>()
for (const occupation of occupations.occupations) {
  const corners = cornersByCode.get(occupation.onet_code)?.corners
  if (!corners) continue
  const input = { occupation, corners, links, jmi }
  roles.set(occupation.onet_code, {
    title: occupation.title,
    corners,
    apr: resolveRoleSignals({ ...input, aei: [april] }),
    may: resolveRoleSignals({ ...input, aei: [april, may] })
  })
}

const DETAILED = new Set(['MYS/task', 'MYS/dwa', 'MYS/iwa', 'MYS/occupation'])
const count = (values: string[]) =>
  Object.fromEntries(
    [...values.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])
  )

const results = [...roles].map(([code, role]) => {
  const before = roleVerdicts(role.apr).corners
  const after = roleVerdicts(role.may).corners
  const layers = role.may.corners.map((c) => c.ai_usage.points[0]?.geo_or_layer ?? 'none')
  const related = occupations.occupations
    .find((o) => o.onet_code === code)!
    .related.slice(0, 3)
    .map((r) => r.onet_code)
    .filter((c) => roles.has(c))
  const matched = [code, ...related].map((c) => ({
    onet_code: c,
    title: roles.get(c)!.title,
    corners: roles.get(c)!.corners
  }))
  const diffRole = {
    onet_code: code,
    corners: role.corners.map((c) => ({ ...c, milestone_hours: { basic: 4, working: 8, advanced: 12 } })),
    matched,
    links
  }
  // Stand-in answers: level 1 on every corner of the user's own role.
  const answers = role.corners.map((c) => ({ onet_code: code, corner_id: c.corner_id, level: 1, task_ids: c.task_ids }))
  const snapshot = (id: '2026-04' | '2026-05', pick: 'apr' | 'may') => ({
    snapshot_id: id,
    roles: matched.map((m) => roles.get(m.onet_code)![pick])
  })
  const diff = SnapshotDiffSchema.parse(
    diffSnapshots(diffRole, answers, snapshot('2026-04', 'apr'), snapshot('2026-05', 'may'), 'slow')
  )
  const statuses = after.map((v) => v.status)
  return {
    onet_code: code,
    title: role.title,
    flips: before.flatMap((b, i) => (b.status === after[i]!.status ? [] : [`${b.status} -> ${after[i]!.status}`])),
    may: statuses,
    may_labels: after.map((v) => v.label),
    layers,
    detailed: layers.filter((l) => DETAILED.has(l)).length,
    mixed: statuses.includes('Rising') && (statuses.includes('Declining') || statuses.includes('Split')),
    scenario_splits: after.filter((v) => v.reason === 'scenarios_disagree').map((v) => v.corner_id),
    demand: role.may.corners[0]!.demand[0]?.direction ?? 'unknown',
    roadmap_reordered: diff.roadmap_reordered,
    roles_reordered: diff.roles_reordered
  }
})

const candidates = results
  .filter((r) => r.mixed)
  .sort(
    (a, b) =>
      b.detailed - a.detailed ||
      Number(b.roles_reordered) - Number(a.roles_reordered) ||
      Number(b.roadmap_reordered) - Number(a.roadmap_reordered) ||
      new Set(b.may).size - new Set(a.may).size ||
      a.onet_code.localeCompare(b.onet_code)
  )

const allFlips = results.flatMap((r) => r.flips)
const sources = [...new Set([...cornersByCode.values()].map((c) => c.corners_source))].join(' and ')
console.log(
  `${results.length} occupations scanned with ${sources} corners (${occupations.occupations.length} in O*NET).`
)
console.log(`Occupations with at least one April -> May verdict flip: ${results.filter((r) => r.flips.length).length}`)
console.log('Flips by type:', count(allFlips))
console.log('May verdicts:', count(results.flatMap((r) => r.may)))
console.log('May AI-use resolution (corners):', count(results.flatMap((r) => r.layers)))
console.log('May demand (roles):', count(results.map((r) => r.demand)))
console.log(
  `Roadmap reordered: ${results.filter((r) => r.roadmap_reordered).length}; fit-score ranking reordered: ${results.filter((r) => r.roles_reordered).length}`
)
console.log(`Mixed May verdicts (a Rising and a Declining or Split corner): ${candidates.length}`)
const splits = results.filter((r) => r.scenario_splits.length > 0)
console.log(`Slow -> fast flips within May (Split from the scenarios): ${splits.length} occupations`)
for (const r of splits) console.log(`  ${r.onet_code} ${r.title}: ${r.scenario_splits.join(', ')}`)
console.log(`\nTop ${TOP} demo candidates (MYS detailed corners, then ranking and roadmap changes):`)
for (const r of candidates.slice(0, TOP))
  console.log(
    `  ${r.onet_code} ${r.title.padEnd(48).slice(0, 48)} detailed ${r.detailed}/${r.may.length}  ranking ${r.roles_reordered ? 'moves' : 'same'}  roadmap ${r.roadmap_reordered ? 'moves' : 'same'}  May: ${r.may.join(', ')}`
  )

await Bun.write(`${ROOT}/.cache/scan/verdict-flips.json`, JSON.stringify({ candidates, results }, null, 2))
