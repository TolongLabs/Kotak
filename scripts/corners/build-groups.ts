// Builds data/generated/corner-groups.json (#74): each O*NET occupation's tasks grouped by IWA into at most 6
// candidate corners, by the deterministic rules in packages/shared/src/corners/groups.ts. No AI.
// Run: bun run build:corner-groups. Reads data/onet/tasks.json and data/onet/work-activities.json.

import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  CORNER_GROUPS_METHOD,
  CornerGroupsFileSchema,
  MAX_CORNERS,
  groupOccupationTasks,
  type CornerGroupsFile
} from '../../packages/shared/src/corners'
import { OnetTasksFileSchema, OnetWorkActivitiesFileSchema } from '../../packages/shared/src/data/onet'
import { writeRecordsJson } from './io'

const ROOT = join(import.meta.dir, '../..')
const OUT = join(ROOT, 'data/generated/corner-groups.json')

const tasksFile = OnetTasksFileSchema.parse(await Bun.file(join(ROOT, 'data/onet/tasks.json')).json())
const activities = OnetWorkActivitiesFileSchema.parse(
  await Bun.file(join(ROOT, 'data/onet/work-activities.json')).json()
)
const iwaTitles = new Map(activities.iwas.map((iwa) => [iwa.iwa_id, iwa.title]))

const { meta } = tasksFile
const file: CornerGroupsFile = CornerGroupsFileSchema.parse({
  meta: {
    licence: meta.licence,
    licence_url: meta.licence_url,
    credit: meta.credit,
    modification_notice: meta.modification_notice,
    onet_version: meta.version,
    method: CORNER_GROUPS_METHOD
  },
  occupations: Object.entries(tasksFile.tasks)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([code, tasks]) => groupOccupationTasks(code, tasks, iwaTitles))
})

// Cross-check against O*NET: every grouped task is the occupation's own, of an included tier, and sits in the
// group of one of its own IWAs; every task of an included tier is grouped.
for (const occupation of file.occupations) {
  const own = new Map(tasksFile.tasks[occupation.onet_code]!.map((t) => [t.task_id, t]))
  const grouped = new Set<number>()
  for (const group of occupation.groups) {
    for (const id of group.task_ids) {
      const task = own.get(id)
      if (!task) throw new Error(`${occupation.onet_code}: task ${id} is not the occupation's own`)
      if (!occupation.task_types.includes(task.task_type)) throw new Error(`${occupation.onet_code}: task ${id} tier`)
      if (!task.iwa_ids.some((iwa) => group.iwa_ids.includes(iwa))) {
        throw new Error(`${occupation.onet_code}: task ${id} is in a group without any of its IWAs`)
      }
      grouped.add(id)
    }
  }
  const expected = [...own.values()].filter((t) => occupation.task_types.includes(t.task_type)).length
  if (grouped.size !== expected) throw new Error(`${occupation.onet_code}: ${expected - grouped.size} tasks ungrouped`)
}

await mkdir(join(ROOT, 'data/generated'), { recursive: true })
const bytes = await writeRecordsJson(OUT, file, 'occupations')

const counts = new Map<number, number>()
for (const o of file.occupations) counts.set(o.groups.length, (counts.get(o.groups.length) ?? 0) + 1)
const withExtra = file.occupations.filter((o) => o.task_types.length > 1 || o.task_types[0] !== 'Core').length
console.log(`Wrote ${OUT} (${(bytes / 1024).toFixed(0)} KB): ${file.occupations.length} occupations`)
for (let n = MAX_CORNERS; n >= 1; n--) console.log(`  ${n} groups: ${counts.get(n) ?? 0}`)
console.log(`  using supplemental or unrated tasks: ${withExtra}`)
