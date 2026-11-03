// Maps the O*NET files (#44) onto the narrow link shape the transfer rules and the hierarchy resolver read.

import type { OnetTasksFile, OnetWorkActivitiesFile } from '../data/onet'
import type { TransferLinks } from './schemas'

/** Every task's DWA links, the IWA of each link (repeats kept, so each counts as one task link) and each IWA's GWA. */
export function onetLinks(
  tasks: OnetTasksFile['tasks'],
  activities: Pick<OnetWorkActivitiesFile, 'iwas' | 'dwas'>
): TransferLinks {
  const dwaIwa = new Map(activities.dwas.map((d) => [d.dwa_id, d.iwa_id]))
  const links: Required<TransferLinks> = {
    task_iwas: {},
    task_dwas: {},
    iwa_broad: Object.fromEntries(activities.iwas.map((i) => [i.iwa_id, i.gwa_id]))
  }
  for (const task of Object.values(tasks).flat()) {
    links.task_dwas[task.task_id] = task.dwa_ids
    links.task_iwas[task.task_id] = task.dwa_ids.map((dwa) => dwaIwa.get(dwa)!)
  }
  return links
}
