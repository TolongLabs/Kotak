// Runs a whole check-up through @kotak/sdk (#185) for each role in data/demo-roles.json, against the built bundle on
// disk, and prints the report: `questions`, then `checkup` and `whatChanged` with the demo walk's answers (Not Yet,
// then Yes, on every corner) and the app's defaults. Both results are checked against their exported Zod schemas.
// Run with `bun scripts/sdk-checkup.ts` after `bun run build:data`.
import { join } from 'node:path'
import { CheckupReportSchema, createKotak, WhatChangedReportSchema } from '../packages/sdk/src/index'
import { DemoRolesFileSchema } from '../packages/shared/src/index'

const ROOT = join(import.meta.dir, '..')
const START_DATE = '2026-10-25'

// A server would mark this source trusted, to skip the Zod parse of files the build already checked.
const kotak = createKotak({ source: { read: (path) => Bun.file(join(ROOT, 'apps/web/public', path)).json() } })

const demo = DemoRolesFileSchema.parse(await Bun.file(join(ROOT, 'data/demo-roles.json')).json())
const manifest = await kotak.manifest()
console.info(
  `Snapshots ${manifest.snapshots.map((s) => s.snapshot_id).join(', ')}; default ${manifest.default_snapshot_id}`
)

for (const { onet_code } of demo.roles) {
  const questions = await kotak.questions(onet_code)
  const answers = questions.corners.map((corner) => ({ corner_id: corner.corner_id, can_do: false, follow_up: true }))
  const report = CheckupReportSchema.parse(
    await kotak.checkup({ role_code: onet_code, answers, start_date: START_DATE })
  )
  const changed = WhatChangedReportSchema.parse(await kotak.whatChanged({ role_code: onet_code, answers }))
  const { input, roadmap } = report

  console.info(`\n${report.role.title} (${onet_code}), snapshot ${input.snapshot_id}, ${input.scenario} scenario`)
  console.info(`Asked first: ${questions.corners[0]!.name}: "${questions.corners[0]!.can_do}"`)
  for (const corner of report.corners)
    console.info(
      `  ${corner.name}: level ${corner.level} (${corner.level_label}), target ${corner.target_level.toFixed(1)}, ${corner.verdict_label}. ${corner.reason}`
    )
  console.info(`Best fits of ${report.roles.length} roles:`)
  for (const role of report.roles.slice(0, 3))
    console.info(
      `  ${role.rank}. ${role.title} ${role.fit_percent}%${role.fit_estimated ? ' (estimated)' : ''}, ${role.outlook}; gaps: ${role.gaps.map((gap) => gap.name).join(', ') || 'none'}`
    )
  console.info(
    `Roadmap for ${roadmap.title}: ${roadmap.total_hours} h at ${roadmap.weekly_hours} h a week (${roadmap.weekly_hours_from}), finish ${roadmap.finish_date}; the AI dividend frees ${roadmap.dividend.weekly_hours_saved.toFixed(1)} h a week`
  )
  for (const step of roadmap.steps)
    console.info(
      `  Weeks ${step.weeks.join('–')} (${step.start_date} to ${step.end_date}): Level ${step.to_level} in ${step.name}: "${step.statement}" ${step.resource?.url ?? ''}`
    )
  console.info(
    `Sources: ${report.sources.map((s) => `${s.source_name}, ${s.geo_or_layer} (${s.vintage_date})`).join('; ')}`
  )
  console.info(
    `What changed ${changed.input.before} to ${changed.input.after}: ${changed.diff.verdict_flips} verdict flips, roadmap ${changed.diff.roadmap_reordered ? '' : 'not '}reordered, ranking ${changed.diff.roles_reordered ? '' : 'not '}reordered`
  )
  for (const corner of changed.diff.corners)
    console.info(`  ${corner.name}: ${corner.before.label} to ${corner.after.label} (${corner.changes.join(', ')})`)
}
