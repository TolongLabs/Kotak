// Each occupation's corners (#88), from the best source present: the AI batch in data/generated/role-corners.json
// (#77), which has can-do statements, hours, SDG tags and resources; else the deterministic task groups in
// data/generated/corner-groups.json (#74), which have none. Statements come only from the batch, never from here.
// Batch corners also get their explainers (#249) and their scenarios (#352), when those files have them.

import {
  CornerGroupsFileSchema,
  RoleCornersSchema,
  ScenariosFileSchema,
  StatementExplainersSchema,
  cornerIwaErrors,
  foreignTaskErrors,
  validateOccupationCorners,
  type BundleCorner,
  type BundleRole,
  type OnetTask,
  type OnetTasksFile
} from '../../packages/shared/src/index'

export const BATCH_FILE = 'data/generated/role-corners.json'
export const EXPLAINERS_FILE = 'data/generated/statement-explainers.json'
export const GROUPS_FILE = 'data/generated/corner-groups.json'
export const SCENARIOS_FILE = 'data/generated/scenarios.json'

export type FoundCorners = Pick<BundleRole, 'corners_source' | 'quality' | 'generated' | 'corners'>

async function read<T>(path: string, schema: { parse: (value: unknown) => T }): Promise<T | null> {
  const file = Bun.file(path)
  return (await file.exists()) ? schema.parse(await file.json()) : null
}

/** Corners by O*NET code. Throws when a batch role fails the #74 post-validator or the groups file is missing. */
export async function loadCorners(root: string, tasks: OnetTasksFile['tasks']): Promise<Map<string, FoundCorners>> {
  const batch = await read(`${root}/${BATCH_FILE}`, RoleCornersSchema)
  const groups = await read(`${root}/${GROUPS_FILE}`, CornerGroupsFileSchema)
  if (!groups) throw new Error(`${GROUPS_FILE} is missing: run bun run build:corner-groups`)

  const explainers = (await read(`${root}/${EXPLAINERS_FILE}`, StatementExplainersSchema)) ?? {}
  const scenarios = (await read(`${root}/${SCENARIOS_FILE}`, ScenariosFileSchema))?.roles ?? {}
  const unknownRoles = Object.keys(scenarios).filter((code) => !batch?.roles.some((r) => r.onet_code === code))
  if (unknownRoles.length > 0) throw new Error(`${SCENARIOS_FILE}: no batch corners for ${unknownRoles.join(', ')}`)
  const found = new Map<string, FoundCorners>()
  for (const occupation of groups.occupations) {
    found.set(occupation.onet_code, {
      corners_source: 'corner-groups',
      quality: 'auto-generated',
      generated: null,
      corners: occupation.groups.map((g): BundleCorner => ({
        corner_id: g.group_id,
        name: g.name,
        task_ids: g.task_ids,
        iwa_ids: g.iwa_ids,
        statements: null,
        hours: null,
        sdg_targets: [],
        resources: []
      }))
    })
  }
  for (const role of batch?.roles ?? []) {
    const { errors } = validateOccupationCorners(role, tasks[role.onet_code] ?? [])
    if (errors.length > 0) throw new Error(`${BATCH_FILE} ${role.onet_code}: ${errors.join('; ')}`)
    const byCorner = explainers[role.onet_code] ?? {}
    const orphans = Object.keys(byCorner).filter((id) => !role.corners.some((c) => c.corner_id === id))
    if (orphans.length > 0)
      throw new Error(`${EXPLAINERS_FILE} ${role.onet_code}: unknown corner ${orphans.join(', ')}`)
    const scenariosByCorner = scenarios[role.onet_code] ?? {}
    // A scenario draws only on its own corner's tasks; the generator's validator checks them against O*NET too.
    const scenarioErrors = Object.entries(scenariosByCorner).flatMap(([id, levels]) => {
      const corner = role.corners.find((c) => c.corner_id === id)
      if (!corner) return [`unknown corner ${id}`]
      return Object.entries(levels).flatMap(([level, scenario]) =>
        scenario.task_ids
          .filter((t) => !corner.task_ids.includes(t))
          .map((t) => `${id} ${level}: task ${t} is not the corner's`)
      )
    })
    if (scenarioErrors.length > 0) throw new Error(`${SCENARIOS_FILE} ${role.onet_code}: ${scenarioErrors.join('; ')}`)
    found.set(role.onet_code, {
      corners_source: 'batch',
      quality: role.quality,
      generated: { generated_by: role.generated_by, model: role.model, generated_date: role.generated_date },
      corners: role.corners.map((c) => ({
        ...c,
        ...(byCorner[c.corner_id] && { explainers: byCorner[c.corner_id] }),
        ...(scenariosByCorner[c.corner_id] && { scenarios: scenariosByCorner[c.corner_id] })
      }))
    })
  }
  return found
}

/**
 * #74's task and IWA checks, the same ones `validateOccupationCorners` runs, for corners of any source: every task ID
 * is one of the occupation's own O*NET tasks, and every IWA is linked by at least one of the corner's own tasks. The
 * full validator also checks the batch-only fields, so the corner groups, which have none, cannot go through it.
 */
export function cornerLinkErrors(onetCode: string, found: FoundCorners, tasks: readonly OnetTask[]): string[] {
  const file = found.corners_source === 'batch' ? BATCH_FILE : GROUPS_FILE
  return [...foreignTaskErrors(onetCode, found.corners, tasks), ...cornerIwaErrors(onetCode, found.corners, tasks)].map(
    (error) => `${file} ${onetCode} ${error}`
  )
}
