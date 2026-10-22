// Appends the Snapshot Diff summary to the refresh pull request body (#90): each demo role's May verdicts and
// targets that this refresh moved, per corner. It reads the "after" side of the April-to-May diff that build:data
// stores in manifest.demo.roles[].diff, once from .cache/refresh/manifest-before.json (the Refresh data workflow
// copies the manifest there after building the checked-out data, before the ingest scripts run) and once from the
// rebuilt apps/web/public/data/manifest.json.
// Run with `bun scripts/refresh/snapshot-diff.ts`, after `bun run refresh:check`, which writes the summary.
import { appendFile } from 'node:fs/promises'
import { join } from 'node:path'
import { BundleManifestSchema, type BundleDemoRole } from '../../packages/shared/src/index'

const ROOT = join(import.meta.dir, '../..')
const BEFORE = join(ROOT, '.cache/refresh/manifest-before.json')
const AFTER = join(ROOT, 'apps/web/public/data/manifest.json')
const SUMMARY = join(ROOT, '.cache/refresh/summary.md')

type DiffCorner = BundleDemoRole['diff']['corners'][number]

const demoRoles = async (path: string) => BundleManifestSchema.parse(await Bun.file(path).json()).demo.roles
const [before, after] = await Promise.all([demoRoles(BEFORE), demoRoles(AFTER)])

// The diff lists only corners that moved from April to May, so a corner missing from one manifest kept its April
// state there in May. That state is read from the other manifest, which assumes the refresh left April unchanged.
const mayCorners = (role?: BundleDemoRole) => new Map(role?.diff.corners.map((c) => [c.corner_id, c]))
const mayState = (corner: DiffCorner | undefined, other: DiffCorner | undefined) => corner?.after ?? other!.before
const target = (level: number) => String(Number(level.toFixed(2)))

const rows: string[] = []
for (const role of after) {
  const old = mayCorners(before.find((r) => r.onet_code === role.onet_code))
  const now = mayCorners(role)
  for (const id of new Set([...old.keys(), ...now.keys()])) {
    const [a, b] = [mayState(old.get(id), now.get(id)), mayState(now.get(id), old.get(id))]
    if (a.label === b.label && target(a.target) === target(b.target)) continue
    const name = (now.get(id) ?? old.get(id))!.name
    rows.push(
      `| ${role.onet_code} ${role.title} | ${name} | ${a.label} → ${b.label} | ${target(a.target)} → ${target(b.target)} |`
    )
  }
}

const lines = [
  '',
  '### Snapshot Diff for the demo roles',
  '',
  `May verdicts and targets per corner before and after this refresh, for the ${after.length} roles in \`data/demo-roles.json\`.`,
  ''
]
if (rows.length === 0) lines.push('No demo role has a May verdict or target that moved.')
else lines.push('| Role | Corner | May verdict | May target |', '| --- | --- | --- | --- |', ...rows)
const section = `${lines.join('\n')}\n`
await appendFile(SUMMARY, section)
console.log(`${section}\nAppended the Snapshot Diff to .cache/refresh/summary.md`)
