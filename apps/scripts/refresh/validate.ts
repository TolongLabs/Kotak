// Validates every JSON file under apps/data/ against its Zod schema (#90), so a refresh never proposes a snapshot that
// breaks its contract. Exits non-zero if a file fails or an expected file is missing.
// Run with `bun run refresh:validate`, after the ingest scripts and the build.
import { Glob } from 'bun'
import { join } from 'node:path'
import {
  AeiSnapshotSchema,
  DosmDemandSchema,
  DosmQesSnapshotSchema,
  EpochContextSchema,
  MyColSchema,
  OnetEmergingTasksFileSchema,
  OnetHotTechnologiesFileSchema,
  OnetOccupationsFileSchema,
  OnetTasksFileSchema,
  OnetTitleIndexSchema,
  OnetWorkActivitiesFileSchema,
  OpenDosmSnapshotSchema,
  RoleCornersSchema,
  SnapshotIdSchema
} from '../../shared/src/index'

const ROOT = join(import.meta.dir, '../../..')

// The part of a Zod schema this script uses, so it needs no direct dependency on zod.
type Schema = {
  safeParse(data: unknown): { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }
}

// Files the app reads today, and the O*NET supplements that no screen reads yet. They must exist.
const EXPECTED: Record<string, Schema> = {
  'apps/data/onet/occupations.json': OnetOccupationsFileSchema,
  'apps/data/onet/tasks.json': OnetTasksFileSchema,
  'apps/data/onet/work-activities.json': OnetWorkActivitiesFileSchema,
  'apps/data/onet/title-index.json': OnetTitleIndexSchema,
  'apps/data/onet/hot-technologies.json': OnetHotTechnologiesFileSchema,
  'apps/data/onet/emerging-tasks.json': OnetEmergingTasksFileSchema,
  'apps/data/snapshots/dosm-jmi.json': DosmDemandSchema,
  ...Object.fromEntries(SnapshotIdSchema.options.map((id) => [`apps/data/snapshots/aei/${id}.json`, AeiSnapshotSchema]))
}
// Files whose ingest or batch scripts have not landed yet. They are validated once they exist.
const OPTIONAL: Record<string, Schema> = {
  'apps/data/snapshots/opendosm.json': OpenDosmSnapshotSchema,
  'apps/data/snapshots/epoch-context.json': EpochContextSchema,
  'apps/data/snapshots/dosm-qes.json': DosmQesSnapshotSchema,
  'apps/data/snapshots/mycol.json': MyColSchema,
  'apps/data/generated/role-corners.json': RoleCornersSchema
}

// Glob returns backslash paths on Windows; the schema keys use forward slashes.
const found = new Set(
  (await Array.fromAsync(new Glob('apps/data/**/*.json').scan({ cwd: ROOT }))).map((path) => path.replaceAll('\\', '/'))
)
let failures = 0
for (const path of Object.keys(EXPECTED).filter((path) => !found.has(path))) {
  console.error(`missing  ${path}`)
  failures++
}
for (const path of [...found].sort()) {
  const schema = EXPECTED[path] ?? OPTIONAL[path]
  if (!schema) {
    console.warn(`skipped  ${path}: no schema is registered for it in apps/scripts/refresh/validate.ts`)
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
console.log('\nEvery snapshot file under apps/data/ with a registered schema is valid')
