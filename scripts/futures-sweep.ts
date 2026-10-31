// Prints Aina's slow/fast comparison for the active snapshot and per-job roadmap hours.
// Run: bun scripts/futures-sweep.ts
// Aina's role, pace, answer key and start date are documented in docs/demo/prelim/video.md. PR #441 does not publish
// numeric ratings; its "Mostly" basic / "Not yet" advanced answer key maps to 3 / 1, as in scripts/sdk-checkup.ts.

import { join } from 'node:path'
import { toRoles } from '../apps/web/src/engine/viewModel'
import { pickDisplayRoles } from '../apps/web/src/views/roles/derived'
import { spaceModel } from '../apps/web/src/views/space/model'
import { computeCheckup } from '../packages/sdk/src/checkup'
import { createBundle } from '../packages/sdk/src/bundle'
import { DEFAULT_SNAPSHOT, type Scenario } from '../packages/shared/src'

const ROOT = join(import.meta.dir, '..')
const ROLE_CODE = '15-1254.00'
const START_DATE = '2026-11-02'
const SCENARIOS = ['slow', 'fast'] as const satisfies readonly Scenario[]
const answersFor = (cornerCount: number) => Array.from({ length: cornerCount }, () => [3, 1] as const).flat()

const bundle = createBundle({
  read: (path) => Bun.file(join(ROOT, 'apps/web/public', path)).json()
})
const [manifest, pathways, space, { role, related }] = await Promise.all([
  bundle.manifest(),
  bundle.pathways(),
  bundle.space(),
  bundle.roleBundle(ROLE_CODE)
])
const snapshotId = DEFAULT_SNAPSHOT
const answers = answersFor(role.corners.length)
const checkups = new Map(
  SCENARIOS.map((scenario) => [
    scenario,
    computeCheckup({
      role,
      related,
      answers,
      snapshotId,
      scenario,
      weeklyHours: 10,
      startDate: START_DATE,
      profile: { situation: 'working' }
    })
  ])
)
const model = spaceModel({
  space,
  snapshots: manifest.snapshots,
  pathways,
  checkup: {
    role,
    relatedCodes: role.related.map((item) => item.onet_code),
    answers: [...answers],
    startDate: START_DATE
  }
})
const moved = model.moved![snapshotId]
const aina = model.jobs.find((job) => job.code === ROLE_CODE)!
const ownFit = aina.fit![snapshotId]
const slow = checkups.get('slow')!
const fast = checkups.get('fast')!
const slowTargets = new Map(slow.corners.map((corner) => [corner.corner_id, corner.target]))
const fastTargets = new Map(fast.corners.map((corner) => [corner.corner_id, corner.target]))
const targetChanges = role.corners.map((corner) => ({
  name: corner.name,
  slow: slowTargets.get(corner.corner_id)!,
  fast: fastTargets.get(corner.corner_id)!
}))
const changedTargets = targetChanges
  .map((target) => Math.abs(target.fast - target.slow))
  .filter((difference) => difference > 1e-9)
const targetRange = changedTargets.length
  ? `${Math.min(...changedTargets).toFixed(3)} -> ${Math.max(...changedTargets).toFixed(3)}`
  : 'none'
const rankChanges = slow.roles.flatMap((before) => {
  const after = fast.roles.find((candidate) => candidate.onet_code === before.onet_code)!
  return before.rank === after.rank ? [] : [`${before.title} (${before.onet_code}) ${before.rank} -> ${after.rank}`]
})

const fitList = (scenario: Scenario) => {
  const checkup = checkups.get(scenario)!
  return checkup.roles
    .map((candidate) => `${candidate.rank}. ${candidate.title} ${Math.round(candidate.fit.score)}%`)
    .join('; ')
}
const shownRoles = (scenario: Scenario) => {
  const checkup = checkups.get(scenario)!
  const ranked = toRoles(checkup, [role, ...related], ROLE_CODE)
  const shown = pickDisplayRoles('stay', null, ranked).roles
  return shown
    .map((candidate) => {
      const rank = checkup.roles.find((item) => item.onet_code === candidate.id)!.rank
      return `${candidate.title} (rank ${rank}, ${candidate.fit}%)`
    })
    .join('; ')
}

// Each job gets the same documented demo answer pattern; the engine then builds its own one-role roadmap.
const jobCodes = space.roles.map((job) => job.onet_code).sort((a, b) => a.localeCompare(b))
const jobRoles = await Promise.all(jobCodes.map((code) => bundle.role(code)))
const changedHours: { code: string; title: string; slow: number; fast: number }[] = []
for (const job of jobRoles) {
  const jobAnswers = answersFor(job.corners.length)
  const hours = SCENARIOS.map(
    (scenario) =>
      computeCheckup({
        role: job,
        related: [],
        answers: jobAnswers,
        snapshotId,
        scenario,
        weeklyHours: 10,
        startDate: START_DATE,
        profile: { situation: 'working' }
      }).roadmap.total_hours
  )
  if (hours[0] !== hours[1])
    changedHours.push({ code: job.onet_code, title: job.title, slow: hours[0]!, fast: hours[1]! })
}

console.log(`AI futures sweep · snapshot ${snapshotId} · ${model.jobs.length} jobs`)
console.log(
  `Inputs: Web Developers (${ROLE_CODE}), Stay strong in my job, 10 h/week, Working; basic 3 / advanced 1 per skill; start ${START_DATE}`
)
console.log(`Market fit: ${moved.count} jobs move by at least 1 point; largest move ${moved.max} points`)
console.log(
  `Aina's job: ${Math.round(ownFit.slow)}% slow -> ${Math.round(ownFit.fast)}% fast; ${Math.round(ownFit.fast) - Math.round(ownFit.slow)} points`
)
console.log(
  `Targets (${targetChanges.length}): ${targetChanges.map((target) => `${target.name} ${target.slow.toFixed(3)} -> ${target.fast.toFixed(3)}`).join('; ')}`
)
console.log(`Target changes: ${changedTargets.length}/${targetChanges.length}; absolute range ${targetRange}`)
console.log(
  `Roadmap slow: ${slow.roadmap.items.length} steps, ${slow.roadmap.total_hours.toFixed(1)} h, finish ${slow.roadmap.finish_date}`
)
console.log(
  `Roadmap fast: ${fast.roadmap.items.length} steps, ${fast.roadmap.total_hours.toFixed(1)} h, finish ${fast.roadmap.finish_date}`
)
console.log(
  `Roadmap difference: ${fast.roadmap.items.length - slow.roadmap.items.length} steps, ${(fast.roadmap.total_hours - slow.roadmap.total_hours).toFixed(1)} h, ${fast.roadmap.finish_date === slow.roadmap.finish_date ? 'same finish date' : `${slow.roadmap.finish_date} -> ${fast.roadmap.finish_date}`}`
)
console.log(`Ranked roles slow: ${fitList('slow')}`)
console.log(`Ranked roles fast: ${fitList('fast')}`)
console.log(`Rank changes: ${rankChanges.length ? rankChanges.join('; ') : 'none'}`)
console.log(`Roles page shows slow: ${shownRoles('slow')}`)
console.log(`Roles page shows fast: ${shownRoles('fast')}`)
console.log(
  `Market roadmap hours: ${changedHours.length}/${jobRoles.length} jobs change (same demo answers, Working, 10 h/week)`
)
for (const job of changedHours)
  console.log(`  ${job.code} ${job.title}: ${job.slow.toFixed(1)} -> ${job.fast.toFixed(1)} h`)
