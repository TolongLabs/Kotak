import { z } from 'zod'
import type { OnetTask } from '../data/onet'
import { OccupationCornersSchema, type FreeResource } from '../data/role-corners'
import { SDG_TARGETS } from './sdg-targets'

// Post-validator for batch output (#74): one occupation's corners, checked against its own O*NET task list.
// It rejects task IDs and IWAs outside that list, an IWA that none of the corner's own tasks link to, a corner
// without exactly three tiered statements, an SDG tag or hours (via OccupationCornersSchema), an SDG code that is
// not a real target, and an unchecked resource that is not a search link. Missing tasks are reported, not rejected.

/** Unchecked resources must be links built by `searchResource`, never a course page a model named. */
export const RESOURCE_SEARCH_URL = 'https://www.google.com/search?q='

/** A free-resource search link for a learner's query. */
export function searchResource(query: string): FreeResource {
  return {
    title: `Search: ${query}`,
    url: RESOURCE_SEARCH_URL + encodeURIComponent(query),
    kind: 'search',
    verified: false
  }
}

const SDG = new Set(SDG_TARGETS)

// Just enough shape to name foreign task IDs even when the rest of the record fails the schema.
const TaskIdsOnlySchema = z.looseObject({
  onet_code: z.unknown(),
  corners: z.array(z.looseObject({ corner_id: z.unknown(), task_ids: z.array(z.unknown()) }))
})

/** One message per task ID that is not in the occupation's own O*NET list. */
export function foreignTaskErrors(
  onetCode: unknown,
  corners: readonly { corner_id: unknown; task_ids: readonly unknown[] }[],
  tasks: readonly OnetTask[]
): string[] {
  const own = new Set(tasks.map((t) => t.task_id))
  return corners.flatMap((corner) =>
    corner.task_ids
      .filter((id) => !own.has(id as number))
      .map((id) => `corner "${corner.corner_id}": task ${id} is not one of ${onetCode}'s O*NET tasks`)
  )
}

/** One message per IWA that none of the corner's own tasks link to. */
export function cornerIwaErrors(
  onetCode: string,
  corners: readonly { corner_id: string; task_ids: readonly number[]; iwa_ids: readonly string[] }[],
  tasks: readonly OnetTask[]
): string[] {
  const own = new Map(tasks.map((t) => [t.task_id, t]))
  const ownIwas = new Set(tasks.flatMap((t) => t.iwa_ids))
  return corners.flatMap((corner) => {
    const at = `corner "${corner.corner_id}"`
    const cornerIwas = new Set(corner.task_ids.flatMap((id) => own.get(id)?.iwa_ids ?? []))
    return corner.iwa_ids
      .filter((iwa) => !cornerIwas.has(iwa))
      .map((iwa) =>
        ownIwas.has(iwa)
          ? `${at}: IWA ${iwa} is not linked to this corner's tasks`
          : `${at}: IWA ${iwa} is not linked to any of ${onetCode}'s tasks`
      )
  })
}

export interface CornerValidation {
  errors: string[]
  /** Task IDs the model was given (the candidate groups), and those of them no corner holds. */
  candidate_tasks: number
  missing_task_ids: number[]
}

/** Checks `role` against `tasks`, the occupation's full O*NET list; `candidateTaskIds` defaults to all of them. */
export function validateOccupationCorners(
  role: unknown,
  tasks: readonly OnetTask[],
  candidateTaskIds: readonly number[] = tasks.map((t) => t.task_id)
): CornerValidation {
  const loose = TaskIdsOnlySchema.safeParse(role)
  const errors = loose.success ? foreignTaskErrors(loose.data.onet_code, loose.data.corners, tasks) : []
  const parsed = OccupationCornersSchema.safeParse(role)
  if (!parsed.success) {
    errors.push(...parsed.error.issues.map((issue) => `${issue.path.join('.') || 'role'}: ${issue.message}`))
    return { errors, candidate_tasks: candidateTaskIds.length, missing_task_ids: [] }
  }
  const { onet_code, corners } = parsed.data
  errors.push(...cornerIwaErrors(onet_code, corners, tasks))
  for (const corner of corners) {
    const at = `corner "${corner.corner_id}"`
    for (const target of corner.sdg_targets) {
      if (!SDG.has(target)) errors.push(`${at}: ${target} is not a UN SDG target`)
    }
    for (const resource of corner.resources) {
      if (!resource.verified && (resource.kind !== 'search' || !resource.url.startsWith(RESOURCE_SEARCH_URL))) {
        errors.push(`${at}: unchecked resource ${resource.url} must be a search link`)
      }
    }
  }
  const assigned = new Set(corners.flatMap((c) => c.task_ids))
  return {
    errors,
    candidate_tasks: candidateTaskIds.length,
    missing_task_ids: candidateTaskIds.filter((id) => !assigned.has(id))
  }
}
