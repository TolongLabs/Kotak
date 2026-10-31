// bun run build:data (#88): joins O*NET 30.1, each role's corners, the four-layer signals for 2026-04 and 2026-05
// and the demo diffs into the static client bundle in apps/web/public/data/ (paths in BUNDLE_PATHS). Every file is
// checked with Zod, and every corner's task IDs and IWAs against its occupation's own O*NET tasks; any failure, or a
// demo role that stops flipping a verdict or reordering its roadmap, exits 1 before anything is written. The browser runs the rules itself, so no level, target or verdict is stored.

import { rm } from 'node:fs/promises'
import { dirname } from 'node:path'
import { sampleCheckups } from '../apps/api/db/sample-checkups'
import { OCCUPATION_SDG_TARGETS } from '../apps/web/src/engine/occupationSdg'
import {
  AeiSnapshotSchema,
  BUNDLE_PATHS,
  BundleCornerSourceSchema,
  BundleManifestSchema,
  BundleRoleIndexSchema,
  BundleRoleSchema,
  DEFAULT_SCENARIO,
  DemoRolesFileSchema,
  diffSnapshots,
  DosmDemandSchema,
  engineInputs,
  onetLinks,
  OnetOccupationsFileSchema,
  OnetTasksFileSchema,
  OnetWorkActivitiesFileSchema,
  resolveRoleSignals,
  roleVerdicts,
  SdgReasonsFileSchema,
  SnapshotIdSchema,
  spaceRole,
  transferAnswers,
  usesScenarios,
  type AeiSnapshot,
  type BundleRole,
  type Source,
  type SpaceFile
} from '../packages/shared/src/index'
import { cornerLinkErrors, loadCorners } from './build-data/corners'
import { i18nFiles, I18N_LANGUAGES } from './build-data/i18n'
import { buildPathways, loadPathwaysInputs, roleTools } from './build-data/pathways'

const started = performance.now()
const ROOT = `${import.meta.dir}/..`
const PUBLIC = `${ROOT}/apps/web/public`
const MATCHED_RELATED = 3 // the demo diff ranks the role and its 3 closest O*NET related roles, as the #86 scan does
const DETAILED = new Set(['MYS/task', 'MYS/dwa', 'MYS/iwa', 'MYS/occupation']) // Malaysian rows finer than a GWA
const SAMPLE_THRESHOLD = 10 // the national view's privacy threshold (#34)

type Issue = { path: PropertyKey[]; message: string }
type Schema<T> = {
  safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: { issues: Issue[] } }
}
const describe = (issues: Issue[]) => issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')

async function load<T>(path: string, schema: Schema<T>): Promise<T> {
  const result = schema.safeParse(await Bun.file(`${ROOT}/${path}`).json())
  if (!result.success) throw new Error(`build:data input ${path} failed validation: ${describe(result.error.issues)}`)
  return result.data
}
const [occupations, tasks, activities, april, may, jmi, demoRoles, sdgReasons] = await Promise.all([
  load('data/onet/occupations.json', OnetOccupationsFileSchema),
  load('data/onet/tasks.json', OnetTasksFileSchema),
  load('data/onet/work-activities.json', OnetWorkActivitiesFileSchema),
  load('data/snapshots/aei/2026-04.json', AeiSnapshotSchema),
  load('data/snapshots/aei/2026-05.json', AeiSnapshotSchema),
  load('data/snapshots/dosm-jmi.json', DosmDemandSchema),
  load('data/demo-roles.json', DemoRolesFileSchema),
  load('data/sdg-reasons.json', SdgReasonsFileSchema)
])
const corners = await loadCorners(ROOT, tasks.tasks)
const pathwaysInputs = await loadPathwaysInputs(ROOT)
const links = onetLinks(tasks.tasks, activities)
const statementVariantCount = [...corners.values()].reduce(
  (count, role) =>
    count +
    role.corners.reduce(
      (roleCount, corner) =>
        roleCount +
        Object.values(corner.statement_variants?.statements ?? {}).filter((text) => text !== undefined).length +
        Object.values(corner.statement_variants?.reversed_statements ?? {}).filter((text) => text !== undefined).length,
      0
    ),
  0
)

const failures: string[] = []
function check<T>(name: string, schema: Schema<T>, value: unknown): T | null {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  failures.push(`${name}: ${describe(result.error.issues)}`)
  return null
}
const sourceOf = ({ source_name, source_url, vintage_date, geo_or_layer }: Source): Source => ({
  source_name,
  source_url,
  vintage_date,
  geo_or_layer
})

const { meta: onet } = occupations
const meta = {
  licence: onet.licence,
  licence_url: onet.licence_url,
  credit: onet.credit,
  modification_notice: onet.modification_notice,
  onet_version: onet.version
}
// Snapshot 2026-04 holds April's Economic Index month; 2026-05 holds April's and May's.
const months: AeiSnapshot[] = [april, may]
const snapshotMonths = (i: number) => months.slice(0, i + 1)

// 1. One file per occupation with corners.
const titles = new Map(
  occupations.occupations.flatMap((o) => (corners.has(o.onet_code) ? [[o.onet_code, o.title]] : []))
)
const roles = new Map<string, BundleRole>()
for (const occupation of occupations.occupations) {
  const found = corners.get(occupation.onet_code)
  if (!found) continue
  const ownTasks = tasks.tasks[occupation.onet_code] ?? []
  const linkErrors = cornerLinkErrors(occupation.onet_code, found, ownTasks)
  if (linkErrors.length > 0) {
    failures.push(...linkErrors)
    continue
  }
  const own = new Map(ownTasks.map((t) => [t.task_id, t]))
  const taskIds = found.corners.flatMap((c) => c.task_ids)
  const taskIwas = Object.fromEntries(taskIds.map((id) => [id, links.task_iwas[id]!]))
  const iwas = [...new Set(Object.values(taskIwas).flat())]
  const input = { occupation, corners: found.corners, links, jmi }
  const role = check(`roles/${occupation.onet_code}.json`, BundleRoleSchema, {
    meta,
    onet_code: occupation.onet_code,
    title: occupation.title,
    description: occupation.description,
    masco_2020: occupation.masco_2020,
    masco_unmatched: occupation.masco_unmatched,
    ...found,
    questions_ready: found.corners.every((c) => c.statements !== null && c.hours !== null),
    tasks: taskIds.map((id) => ({ task_id: id, statement: own.get(id)!.statement, task_type: own.get(id)!.task_type })),
    links: { task_iwas: taskIwas, iwa_broad: Object.fromEntries(iwas.map((iwa) => [iwa, links.iwa_broad[iwa]!])) },
    related: occupation.related.flatMap((r) =>
      titles.has(r.onet_code) ? [{ ...r, title: titles.get(r.onet_code)! }] : []
    ),
    tools: roleTools(pathwaysInputs, occupation.onet_code),
    signals: Object.fromEntries(
      months.map((m, i) => [m.snapshot_id, resolveRoleSignals({ ...input, aei: snapshotMonths(i) })])
    )
  })
  if (role) roles.set(role.onet_code, role)
}

// 2. The role index.
const index = check(BUNDLE_PATHS.roles, BundleRoleIndexSchema, {
  meta,
  roles: [...roles.values()].map((r) => ({
    onet_code: r.onet_code,
    title: r.title,
    quality: r.quality,
    questions_ready: r.questions_ready
  }))
})

// 2a. Every SDG target a corner is tagged with, or a job chip names, has its UN text and reason (#391).
const unexplained = [
  ...new Set([
    ...[...roles.values()].flatMap((r) => r.corners.flatMap((c) => c.sdg_targets)),
    ...OCCUPATION_SDG_TARGETS
  ])
].filter((target) => !sdgReasons.targets[target])
if (unexplained.length > 0) failures.push(`data/sdg-reasons.json: no reason for SDG ${unexplained.join(', ')}`)

// 2b. Pathways (#284): fields of study, interest areas, regulated professions and each role's preparation.
const pathways = buildPathways(pathwaysInputs, roles, failures)

// 3. Demo roles: April to May for the sample answers must flip a corner verdict and reorder the roadmap.
const demo = demoRoles.roles.flatMap((d) => {
  const role = roles.get(d.onet_code)
  if (!role) {
    failures.push(`demo role ${d.onet_code}: no valid bundle file`)
    return []
  }
  const matched = [role, ...role.related.slice(0, MATCHED_RELATED).flatMap((r) => roles.get(r.onet_code) ?? [])]
  const inputs = engineInputs(role, matched)
  const answers = transferAnswers(role, Object.fromEntries(role.corners.map((c) => [c.corner_id, d.sample_level])))
  const diff = diffSnapshots(inputs.role, answers, inputs.snapshots['2026-04'], inputs.snapshots['2026-05'])
  if (diff.verdict_flips === 0)
    failures.push(`demo role ${d.onet_code}: no corner verdict flips from 2026-04 to 2026-05`)
  if (!diff.roadmap_reordered) failures.push(`demo role ${d.onet_code}: the roadmap order does not change`)
  const mayCorners = role.signals['2026-05'].corners
  const detailed = mayCorners.filter((c) => DETAILED.has(c.ai_usage.points[0]?.geo_or_layer ?? ''))
  return [
    {
      ...d,
      title: role.title,
      corners_source: role.corners_source,
      matched: matched.map((m) => m.onet_code),
      checks: {
        corners: mayCorners.length,
        malaysian_detailed_corners: detailed.length,
        may_statuses: roleVerdicts(role.signals['2026-05']).corners.map((v) => v.status),
        ranking_moved: diff.roles_reordered
      },
      diff
    }
  ]
})

// 4. Occupations where the slow and fast scenarios disagree in May.
const scenarioSplits = [...roles.values()].flatMap((r) => {
  const ids = roleVerdicts(r.signals['2026-05'])
    .corners.filter((v) => v.reason === 'scenarios_disagree')
    .map((v) => v.corner_id)
  return ids.length > 0 ? [{ onet_code: r.onet_code, title: r.title, corner_ids: ids }] : []
})

// 5. The national view's labelled sample rows (#34, apps/api/db/sample-checkups.ts) cover every demo role and every
// occupation group in the bundle, with at least 10 per group, and each row has its role's corner count. They never
// count toward the 10-real-row threshold; the summary route counts only is_sample = false rows.
const samples = sampleCheckups()
for (const code of demoRoles.roles.map((r) => r.onet_code)) {
  if (!samples.some((s) => s.onet_role_code === code)) failures.push(`national view: no sample rows for ${code}`)
}
for (const group of new Set([...roles.keys()].map((code) => code.slice(0, 2)))) {
  const rows = samples.filter((s) => s.onet_role_code.startsWith(group)).length
  if (rows < SAMPLE_THRESHOLD) failures.push(`national view: group ${group}-0000 has ${rows} sample rows`)
}
for (const s of samples) {
  const corners = roles.get(s.onet_role_code)?.corners.length
  if (s.corner_levels.length !== corners)
    failures.push(
      `national view: ${s.onet_role_code} sample rows have ${s.corner_levels.length} levels, not ${corners}`
    )
}

// 6. The manifest.
const latestRelease = jmi.releases.reduce((a, b) => (b.release_date > a.release_date ? b : a))
const jmiSource = sourceOf(jmi.totals.at(-1)!)
const manifest = check(BUNDLE_PATHS.manifest, BundleManifestSchema, {
  meta,
  default_snapshot_id: SnapshotIdSchema.options[0], // TRD: the loader starts on April 2026
  snapshots: months.map((m, i) => ({
    snapshot_id: m.snapshot_id,
    label: new Date(`${m.period.date_start}T00:00:00Z`).toLocaleString('en-GB', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }),
    data_month: m.period.date_start,
    sources: [...snapshotMonths(i).map((x) => sourceOf(x.geos.MYS.overall)), jmiSource]
  })),
  credits: [
    {
      source_name: onet.source_name,
      source_url: onet.source_url,
      vintage_date: onet.vintage_date,
      licence: onet.licence,
      credit: `${onet.credit} ${onet.modification_notice}`
    },
    {
      source_name: may.geos.MYS.overall.source_name,
      source_url: may.geos.MYS.overall.source_url,
      vintage_date: may.release.release_date,
      licence: may.release.licence,
      credit: 'Anthropic Economic Index, by Anthropic.'
    },
    {
      source_name: jmi.source_name,
      source_url: latestRelease.url,
      vintage_date: latestRelease.release_date,
      licence: jmi.licence,
      credit: jmi.attribution
    }
  ],
  missing: [...new Set([...roles.values()].flatMap((r) => r.signals['2026-05'].context?.missing ?? []))],
  corners: Object.fromEntries(
    BundleCornerSourceSchema.options.map((s) => [s, [...roles.values()].filter((r) => r.corners_source === s).length])
  ),
  demo: { scenario: DEFAULT_SCENARIO, roles: demo, scenario_splits: scenarioSplits }
})

// 6b. The Malay and Chinese content, split per job (#449).
const i18n = (await Promise.all(I18N_LANGUAGES.map((lang) => i18nFiles(ROOT, lang, roles, failures)))).flat()

if (failures.length > 0 || !index || !manifest || !pathways) {
  console.error(`build:data failed with ${failures.length} problem(s); nothing was written:`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

// 7. Write, only after every check passed. The 3D space's file cuts every checked role down (space.ts) and keeps the
// usage index anchors once, from any role, since every role has the same.
const [anyRole] = roles.values()
const space: SpaceFile = {
  meta,
  anchors: Object.fromEntries(
    months.map((m) => [m.snapshot_id, anyRole!.signals[m.snapshot_id]!.anchors])
  ) as SpaceFile['anchors'],
  roles: [...roles.values()].map(spaceRole)
}
const files: [string, unknown][] = [
  [BUNDLE_PATHS.manifest, manifest],
  [BUNDLE_PATHS.roles, index],
  [BUNDLE_PATHS.pathways, pathways],
  [BUNDLE_PATHS.sdgReasons, sdgReasons],
  [BUNDLE_PATHS.space, space],
  ...[...roles.values()].map((r): [string, unknown] => [BUNDLE_PATHS.role(r.onet_code), r]),
  ...i18n
]
await rm(`${PUBLIC}${dirname(BUNDLE_PATHS.manifest)}`, { recursive: true, force: true })
const sizes = await Promise.all(files.map(([path, value]) => Bun.write(`${PUBLIC}${path}`, JSON.stringify(value))))

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`
const total = sizes.reduce((a, b) => a + b, 0)
const sizeOf = (path: string) => sizes[files.findIndex(([p]) => p === path)]!
const roleSizes = [...roles.keys()].map((code) => sizeOf(BUNDLE_PATHS.role(code))).sort((a, b) => a - b)
console.info(
  `Corners: ${JSON.stringify(manifest.corners)}; questions ready for ${index.roles.filter((r) => r.questions_ready).length} roles, ` +
    `scenarios for ${[...roles.values()].filter(usesScenarios).length}`
)
console.info(`Statement variants: ${statementVariantCount}`)
for (const d of manifest.demo.roles) {
  const { checks, diff } = d
  console.info(
    `Demo ${d.onet_code} ${d.title}: ${diff.verdict_flips} verdict flips, roadmap reordered, ranking ${checks.ranking_moved ? 'moved' : 'same'}, ` +
      `Malaysian detailed corners ${checks.malaysian_detailed_corners}/${checks.corners}, May ${checks.may_statuses.join(', ')}`
  )
}
console.info(
  `Wrote ${files.length} files (${(total / 1024 / 1024).toFixed(1)} MB) to apps/web/public${dirname(BUNDLE_PATHS.manifest)}: ` +
    `manifest ${kb(sizes[0]!)}, roles index ${kb(sizes[1]!)}, pathways ${kb(sizes[2]!)}, SDG reasons ${kb(sizes[3]!)}, ` +
    `space ${kb(sizeOf(BUNDLE_PATHS.space))} (${kb(Bun.gzipSync(JSON.stringify(space)).length)} gzipped), ${roleSizes.length} role files ` +
    `(median ${kb(roleSizes[roleSizes.length >> 1]!)}, largest ${kb(roleSizes.at(-1)!)}), ` +
    I18N_LANGUAGES.map(
      (lang) =>
        `${lang} ${i18n.filter(([path]) => path.startsWith(dirname(BUNDLE_PATHS.i18nIndex(lang)))).length} files`
    ).join(', ')
)
console.info(`build:data finished in ${((performance.now() - started) / 1000).toFixed(1)} s`)
