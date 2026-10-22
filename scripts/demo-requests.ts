// Writes scripts/demo-requests.json, the requests `bun run prewarm:ai` sends so the demo never waits on Claude (#150).
// - role_titles: the titles TRD.md's job match acceptance names, and the demo profile's job in docs/demo/video.md.
//   The app calls the match route only for a typed title with no exact O*NET title, so these are the ones it sends.
// - explanations: what the Radar sends for each role in data/demo-roles.json, through the app's own computeCheckup
//   and buildExplanationRequest: the May 2026 snapshot, the default scenario and the demo walk's answers (Not Yet,
//   then Yes, for each corner), which give the role's sample level on every corner.
// Run with `bun scripts/demo-requests.ts` after `bun run build:data`, then `bun run prewarm:ai scripts/demo-requests.json`.
import { join } from 'node:path'
import { computeCheckup } from '../packages/sdk/src/index'
import { BundleRoleSchema, DEFAULT_SCENARIO, DemoRolesFileSchema } from '../packages/shared/src/index'
import { buildExplanationRequest } from '../apps/web/src/views/roles/derived'

const ROOT = join(import.meta.dir, '..')
const ROLE_TITLES = ['Jurutera Perisian', 'akauntan', 'front-end developer']

const loadRole = async (code: string) =>
  BundleRoleSchema.parse(await Bun.file(join(ROOT, `apps/web/public/data/roles/${code}.json`)).json())

const demo = DemoRolesFileSchema.parse(await Bun.file(join(ROOT, 'data/demo-roles.json')).json())
const explanations = await Promise.all(
  demo.roles.map(async ({ onet_code, sample_level }) => {
    const role = await loadRole(onet_code)
    const checkup = computeCheckup({
      role,
      related: await Promise.all(role.related.map((related) => loadRole(related.onet_code))),
      answers: role.corners.flatMap(() => [false, true]),
      snapshotId: '2026-05',
      scenario: DEFAULT_SCENARIO,
      weeklyHours: 4,
      startDate: '2026-10-25'
    })
    const own = checkup.roles.find((candidate) => candidate.onet_code === onet_code)
    if (own?.levels.some((level) => level.level !== sample_level))
      throw new Error(`${onet_code}: not at its sample level`)
    const request = buildExplanationRequest(role, own, checkup.snapshotId, DEFAULT_SCENARIO)
    if (!request) throw new Error(`${onet_code}: no explanation request`)
    return request
  })
)

await Bun.write(
  join(ROOT, 'scripts/demo-requests.json'),
  `${JSON.stringify({ role_titles: ROLE_TITLES, explanations }, null, 2)}\n`
)
console.info(
  `Wrote scripts/demo-requests.json: ${ROLE_TITLES.length} titles, ${explanations.length} explanation requests`
)
