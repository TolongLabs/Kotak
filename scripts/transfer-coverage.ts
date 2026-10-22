// Measures how much of a matched role's task links the #83 transfer rules cover, across each O*NET occupation's 3 most
// related roles. Each role is one corner holding all its core tasks, so the counts are the role's task-to-DWA links.
// Run: bun scripts/transfer-coverage.ts. Reads the O*NET 30.1 files under data/onet/ (#44).

import {
  onetLinks,
  OnetOccupationsFileSchema,
  OnetTasksFileSchema,
  OnetWorkActivitiesFileSchema,
  transferLevels
} from '../packages/shared/src/index'

const ROOT = `${import.meta.dir}/..`
const load = async <T>(path: string, schema: { parse: (v: unknown) => T }) =>
  schema.parse(await Bun.file(`${ROOT}/${path}`).json())
const [occupations, tasks, activities] = await Promise.all([
  load('data/onet/occupations.json', OnetOccupationsFileSchema),
  load('data/onet/tasks.json', OnetTasksFileSchema),
  load('data/onet/work-activities.json', OnetWorkActivitiesFileSchema)
])
const links = onetLinks(tasks.tasks, activities)
const coreTasks = (code: string) =>
  (tasks.tasks[code] ?? []).filter((t) => t.task_type === 'Core').map((t) => t.task_id)

const iwa: number[] = []
const iwaOrBroad: number[] = []
for (const occupation of occupations.occupations) {
  const answered = coreTasks(occupation.onet_code)
  if (answered.length === 0) continue
  const answers = [{ onet_code: occupation.onet_code, corner_id: 'all', level: 3, task_ids: answered }]
  for (const related of occupation.related.filter((r) => r.index <= 3)) {
    const role = {
      onet_code: related.onet_code,
      corners: [{ corner_id: 'all', task_ids: coreTasks(related.onet_code) }]
    }
    const { basis } = transferLevels(role, answers, links)[0]!
    if (basis.task_links === 0) continue
    iwa.push(basis.iwa_links / basis.task_links)
    iwaOrBroad.push((basis.iwa_links + basis.broad_links) / basis.task_links)
  }
}

// Linear interpolation between order statistics.
function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const lo = sorted[Math.floor(pos)]!
  return lo + (sorted[Math.ceil(pos)]! - lo) * (pos - Math.floor(pos))
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`
console.log(`${iwa.length} occupation and related-role pairs (top 3 by O*NET index, core tasks)`)
console.log(`Shared IWA:             median ${pct(quantile(iwa, 0.5))}, lower quartile ${pct(quantile(iwa, 0.25))}`)
console.log(
  `Shared IWA or broad:    median ${pct(quantile(iwaOrBroad, 0.5))}, lower quartile ${pct(quantile(iwaOrBroad, 0.25))}`
)
