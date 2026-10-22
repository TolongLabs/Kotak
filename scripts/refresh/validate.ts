// Validates every JSON file under data/ against its Zod schema (#90), so a refresh never proposes a snapshot that
// breaks its contract. Exits non-zero if a file fails or an expected file is missing.
// Run with `bun run refresh:validate`; the Refresh data workflow runs it after the ingest scripts and the build.
import { Glob } from 'bun'
import { join } from 'node:path'
import {
  AeiSnapshotSchema,
  DosmDemandSchema,
  DosmQesSnapshotSchema,
  EpochContextSchema,
  MyColSchema,
  OnetOccupationsFileSchema,
  OnetTasksFileSchema,
  OnetTitleIndexSchema,
  OnetWorkActivitiesFileSchema,
  OpenDosmSnapshotSchema,
  RoleCornersSchema,
  SnapshotIdSchema
} from '../../packages/shared/src/index'

const ROOT = join(import.meta.dir, '../..')

// The part of a Zod schema this script uses, so it needs no direct dependency on zod.
type Schema = {
  safeParse(data: unknown): { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }
}

// Files the app reads today. They must exist.
const EXPECTED: Record<string, Schema> = {
  'data/onet/occupations.json': OnetOccupationsFileSchema,
  'data/onet/tasks.json': OnetTasksFileSchema,
  'data/onet/work-activities.json': OnetWorkActivitiesFileSchema,
  'data/onet/title-index.json': OnetTitleIndexSchema,
  'data/snapshots/dosm-jmi.json': DosmDemandSchema,
  ...Object.fromEntries(SnapshotIdSchema.options.map((id) => [`data/snapshots/aei/${id}.json`, AeiSnapshotSchema]))
}
// Files whose ingest or batch scripts have not landed yet. They are validated once they exist.
const OPTIONAL: Record<string, Schema> = {
  'data/snapshots/opendosm.json': OpenDosmSnapshotSchema,
  'data/snapshots/epoch-context.json': EpochContextSchema,
  'data/snapshots/dosm-qes.json': DosmQesSnapshotSchema,
  'data/snapshots/mycol.json': MyColSchema,
  'data/generated/role-corners.json': RoleCornersSchema
}

const found = new Set(await Array.fromAsync(new Glob('data/**/*.json').scan({ cwd: ROOT })))
let failures = 0
for (const path of Object.keys(EXPECTED).filter((path) => !found.has(path))) {
  console.error(`missing  ${path}`)
  failures++
}
for (const path of [...found].sort()) {
  const schema = EXPECTED[path] ?? OPTIONAL[path]
  if (!schema) {
    console.warn(`skipped  ${path}: no schema is registered for it in scripts/refresh/validate.ts`)
    continue
  }
  const parsed = schema.safeParse(await Bun.file(join(ROOT, path)).json())
  if (parsed.success) {
    console.log(`valid    ${path}`)
  } else {
    const issues = parsed.error!.issues.map(
      (issue) => `  ${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`
    )
    console.error(`invalid  ${path}\n${issues.slice(0, 20).join('\n')}`)
    failures++
  }
}
if (failures > 0) {
  console.error(`\n${failures} snapshot file(s) failed validation`)
  process.exit(1)
}
console.log('\nEvery snapshot file under data/ with a registered schema is valid')
