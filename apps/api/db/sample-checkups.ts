// Labelled sample rows for the national view (is_sample = true). The seed script inserts them, and the
// summary route serves the same rows when the database is unset or unreachable.
import demoRoles from '../../../data/demo-roles.json'

// The live-demo roles in data/demo-roles.json (#88), so the national view shows the same jobs as the demo, and
// the lowest O*NET code in every other occupation group, so each group has labelled rows (TRD: "at least 10 per
// occupation group", #147). Each role's levels follow its corner count. `bun run build:data` checks the groups and
// counts against the bundle.
export const DEMO_ROLE_CODES = demoRoles.roles.map((role) => role.onet_code)
const GROUP_ROLES: Record<string, number> = {
  '11-1011.00': 6,
  '13-1011.00': 6,
  '17-1011.00': 6,
  '19-1011.00': 6,
  '21-1011.00': 6,
  '23-1011.00': 6,
  '25-1011.00': 6,
  '27-1011.00': 6,
  '29-1011.00': 6,
  '31-1121.00': 6,
  '33-1011.00': 6,
  '35-1011.00': 6,
  '37-1011.00': 6,
  '39-1013.00': 6,
  '41-1011.00': 6,
  '45-1011.00': 6,
  '47-1011.00': 6,
  '49-1011.00': 6,
  '51-1011.00': 6,
  '53-1041.00': 5
}
export const SAMPLE_ROLES: { onet_role_code: string; corners: number }[] = [
  ...DEMO_ROLE_CODES.map((onet_role_code) => ({ onet_role_code, corners: 6 })),
  ...Object.entries(GROUP_ROLES).map(([onet_role_code, corners]) => ({ onet_role_code, corners }))
]

// At least 10 per role, so each sample row stands in for a group the size the privacy threshold needs.
export const SAMPLE_ROWS_PER_ROLE = 12

export type SampleCheckup = { onet_role_code: string; corner_levels: number[] }

// Deterministic, so every seed run and the offline fallback show the same numbers.
export const sampleCheckups = (): SampleCheckup[] =>
  SAMPLE_ROLES.flatMap(({ onet_role_code, corners }) => {
    let state = [...onet_role_code].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261)
    // The top 2 bits of a 32-bit linear congruential step: 0 to 3.
    const next = () => (state = (Math.imul(state, 1664525) + 1013904223) | 0) >>> 30
    const centres = Array.from({ length: corners }, next)
    return Array.from({ length: SAMPLE_ROWS_PER_ROLE }, () => ({
      onet_role_code,
      corner_levels: centres.map((centre) => Math.min(3, Math.max(0, centre + [-1, 0, 0, 1][next()])))
    }))
  })
