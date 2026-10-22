// Labelled sample rows for the national view (is_sample = true). The seed script inserts them, and the
// summary route serves the same rows when the database is unset or unreachable.
import demoRoles from '../../../data/demo-roles.json'

// The live-demo roles in data/demo-roles.json (#88), so the national view shows the same jobs as the demo.
// Occupation groups follow from the codes; `bun run build:data` checks each group gets at least 10 rows.
export const DEMO_ROLE_CODES = demoRoles.roles.map((role) => role.onet_code)

// At least 10 per role, so each sample row stands in for a group the size the privacy threshold needs.
export const SAMPLE_ROWS_PER_ROLE = 12

export type SampleCheckup = { onet_role_code: string; corner_levels: number[] }

// Deterministic, so every seed run and the offline fallback show the same numbers.
export const sampleCheckups = (): SampleCheckup[] =>
  DEMO_ROLE_CODES.flatMap((onet_role_code) => {
    let state = [...onet_role_code].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261)
    // The top 2 bits of a 32-bit linear congruential step: 0 to 3.
    const next = () => (state = (Math.imul(state, 1664525) + 1013904223) | 0) >>> 30
    const centres = Array.from({ length: 6 }, next)
    return Array.from({ length: SAMPLE_ROWS_PER_ROLE }, () => ({
      onet_role_code,
      corner_levels: centres.map((centre) => Math.min(3, Math.max(0, centre + [-1, 0, 0, 1][next()])))
    }))
  })
