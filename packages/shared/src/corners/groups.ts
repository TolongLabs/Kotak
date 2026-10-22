import { z } from 'zod'
import {
  OnetAttributionSchema,
  OnetIwaIdSchema,
  OnetSocCodeSchema,
  OnetTaskIdSchema,
  OnetTaskTypeSchema,
  onetCredit,
  type OnetTask,
  type OnetTaskType
} from '../data/onet'

// Deterministic candidate corners (#74), written to `data/generated/corner-groups.json` before any model runs.
// The batch prompt starts from these groups, and the What Changed scan (#86) can use them as corners until the
// model's corners exist. No AI is involved. The rules, in order:
//
// 1. Tasks. Take the occupation's Core tasks. While there are fewer than 6 groups, add its Supplemental tasks, then
//    its unrated ("n/a") tasks. Occupations without Core tasks start at the first tier they have.
// 2. Primary IWA. A task joins the group of one IWA: the IWA holding most of the task's DWA links; on a tie, the IWA
//    that the most selected tasks of the occupation link to; then the lowest IWA ID.
// 3. Merge. While there are more than 6 groups, merge the smallest group (lowest ID on a tie) into the group
//    closest to it in the O*NET content model: one sharing a GWA, else the same GWA subcategory (such as 4.A.2.b),
//    else the same category (such as 4.A.2), else any. Among equally close groups, pick the smallest, then the
//    lowest ID. Groups are never split, so an occupation with fewer than 6 groups gets fewer.
//
// A group's `iwa_ids` are the primary IWAs merged into it, the IWA with most tasks first; that lead IWA names
// `group_id`. `name` joins the IWA titles. Groups are sorted by size, largest first, then by `group_id`.

export const MAX_CORNERS = 6

/** Task tiers in the order rule 1 adds them; `null` is O*NET's unrated "n/a". */
export const CORNER_TASK_TIERS: readonly (OnetTaskType | null)[] = ['Core', 'Supplemental', null]

const CornerIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const CornerGroupSchema = z
  .object({
    group_id: CornerIdSchema,
    name: z.string().min(1),
    iwa_ids: z.array(OnetIwaIdSchema).min(1),
    task_ids: z.array(OnetTaskIdSchema).min(1)
  })
  .strict()

export const OccupationGroupsSchema = z
  .object({
    onet_code: OnetSocCodeSchema,
    /** The task tiers included, in the order of `CORNER_TASK_TIERS`. */
    task_types: z.array(OnetTaskTypeSchema.nullable()).min(1),
    groups: z.array(CornerGroupSchema).min(1).max(MAX_CORNERS)
  })
  .strict()
  .superRefine((occupation, ctx) => {
    const unique = (values: (string | number)[]) => new Set(values).size === values.length
    if (!unique(occupation.groups.map((g) => g.group_id))) {
      ctx.addIssue({ code: 'custom', message: 'duplicate group_id', path: ['groups'] })
    }
    if (!unique(occupation.groups.flatMap((g) => g.task_ids))) {
      ctx.addIssue({ code: 'custom', message: 'a task belongs to more than one group', path: ['groups'] })
    }
    if (!unique(occupation.groups.flatMap((g) => g.iwa_ids))) {
      ctx.addIssue({ code: 'custom', message: 'an IWA belongs to more than one group', path: ['groups'] })
    }
  })

/** `data/generated/corner-groups.json` */
export const CornerGroupsFileSchema = z
  .object({
    meta: z
      .object({
        ...OnetAttributionSchema.shape,
        onet_version: z.string().regex(/^\d+\.\d+$/),
        method: z.string().min(1)
      })
      .strict()
      .refine((meta) => meta.credit === onetCredit(meta.onet_version), {
        message: 'credit must be the O*NET credit line naming onet_version',
        path: ['credit']
      }),
    occupations: z.array(OccupationGroupsSchema).min(1)
  })
  .strict()
  .refine((file) => new Set(file.occupations.map((o) => o.onet_code)).size === file.occupations.length, {
    message: 'duplicate onet_code',
    path: ['occupations']
  })

export type CornerGroup = z.infer<typeof CornerGroupSchema>
export type OccupationGroups = z.infer<typeof OccupationGroupsSchema>
export type CornerGroupsFile = z.infer<typeof CornerGroupsFileSchema>

/** One-line summary of the rules above, for the file's `meta.method`. */
export const CORNER_GROUPS_METHOD =
  'Core tasks (then Supplemental, then unrated, while under 6 groups) grouped by primary IWA: most DWA links, then the IWA most tasks share, then lowest ID. Groups above 6 merge smallest first into the closest group by GWA, subcategory, then category. No AI.'

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
/** A DWA's IWA, or an IWA's GWA. */
const parentId = (id: string) => id.slice(0, id.lastIndexOf('.'))

/** 3 for the same GWA, 2 for the same subcategory (4.A.2.b), 1 for the same category (4.A.2), else 0. */
function closeness(a: string, b: string): number {
  const pa = parentId(a).split('.')
  const pb = parentId(b).split('.')
  let shared = 0
  while (shared < pa.length && pa[shared] === pb[shared]) shared++
  return Math.max(0, shared - 2)
}

/** Rule 2: the IWA whose group a task joins. */
function primaryIwa(task: OnetTask, linkedTasks: ReadonlyMap<string, number>): string {
  const links = new Map<string, number>()
  for (const dwa of task.dwa_ids) links.set(parentId(dwa), (links.get(parentId(dwa)) ?? 0) + 1)
  const [best] = [...links].sort(
    ([a, na], [b, nb]) => nb - na || (linkedTasks.get(b) ?? 0) - (linkedTasks.get(a) ?? 0) || byText(a, b)
  )
  return best![0]
}

/** Primary IWA to its task IDs. */
type Group = Map<string, number[]>

const size = (group: Group) => [...group.values()].reduce((n, tasks) => n + tasks.length, 0)
/** IWAs with most tasks first, then by ID; the first one leads the group. */
const iwasOf = (group: Group) => [...group].sort(([a, ta], [b, tb]) => tb.length - ta.length || byText(a, b))
const leadOf = (group: Group) => iwasOf(group)[0]![0]
const idOf = (iwa: string) => iwa.toLowerCase().replaceAll('.', '-')

function groupByPrimaryIwa(tasks: readonly OnetTask[]): Group[] {
  const linkedTasks = new Map<string, number>()
  for (const task of tasks) for (const iwa of task.iwa_ids) linkedTasks.set(iwa, (linkedTasks.get(iwa) ?? 0) + 1)
  const groups = new Map<string, number[]>()
  for (const task of tasks) {
    const iwa = primaryIwa(task, linkedTasks)
    groups.set(iwa, [...(groups.get(iwa) ?? []), task.task_id])
  }
  return [...groups].map(([iwa, ids]) => new Map([[iwa, ids]]))
}

/** Rule 3: merge down to `MAX_CORNERS` groups. */
function mergeGroups(groups: Group[]): Group[] {
  let rest = groups
  while (rest.length > MAX_CORNERS) {
    const [smallest] = [...rest].sort((a, b) => size(a) - size(b) || byText(leadOf(a), leadOf(b)))
    const near = (other: Group) =>
      Math.max(...[...smallest!.keys()].flatMap((a) => [...other.keys()].map((b) => closeness(a, b))))
    const [partner] = rest
      .filter((g) => g !== smallest)
      .sort((a, b) => near(b) - near(a) || size(a) - size(b) || byText(leadOf(a), leadOf(b)))
    rest = rest.filter((g) => g !== smallest && g !== partner).concat(new Map([...partner!, ...smallest!]))
  }
  return rest
}

/** Group one occupation's O*NET tasks into at most 6 candidate corners. `iwaTitles` maps IWA IDs to titles. */
export function groupOccupationTasks(
  onetCode: string,
  tasks: readonly OnetTask[],
  iwaTitles: ReadonlyMap<string, string>
): OccupationGroups {
  const taskTypes: (OnetTaskType | null)[] = []
  let groups: Group[] = []
  for (const tier of CORNER_TASK_TIERS) {
    if (!tasks.some((t) => t.task_type === tier)) continue
    taskTypes.push(tier)
    groups = groupByPrimaryIwa(tasks.filter((t) => taskTypes.includes(t.task_type)))
    if (groups.length >= MAX_CORNERS) break
  }
  const title = (iwa: string) => {
    const text = iwaTitles.get(iwa)
    if (text === undefined) throw new Error(`${onetCode}: no title for IWA ${iwa}`)
    return text.replace(/\.$/, '')
  }
  const out = mergeGroups(groups)
    .sort((a, b) => size(b) - size(a) || byText(leadOf(a), leadOf(b)))
    .map((group) => {
      const iwas = iwasOf(group).map(([iwa]) => iwa)
      return {
        group_id: idOf(iwas[0]!),
        name: iwas.map(title).join('; '),
        iwa_ids: iwas,
        task_ids: [...group.values()].flat().sort((a, b) => a - b)
      }
    })
  return { onet_code: onetCode, task_types: taskTypes, groups: out }
}
