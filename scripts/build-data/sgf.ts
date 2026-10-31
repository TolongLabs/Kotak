// Each role's SkillsFuture Singapore equivalents and the skills linked to its corners (#464), from the two files
// scripts/sgf/link.ts writes. The bundle gets per-role slices only; the framework's raw files never reach the client.

import {
  SgfCornerSkillsFileSchema,
  SgfCrosswalkFileSchema,
  SgfRolesFileSchema,
  SgfSkillsFileSchema,
  sgfMatchedRoles,
  type BundleRole
} from '../../packages/shared/src/index'

export async function loadSgfInputs(root: string) {
  const read = async <T>(path: string, schema: { parse: (value: unknown) => T }) =>
    schema.parse(await Bun.file(`${root}/${path}`).json())
  const [crosswalk, cornerSkills, roles, skills] = await Promise.all([
    read('data/sgf/onet-crosswalk.json', SgfCrosswalkFileSchema),
    read('data/sgf/corner-skills.json', SgfCornerSkillsFileSchema),
    read('data/sgf/roles.json', SgfRolesFileSchema),
    read('data/sgf/skills.json', SgfSkillsFileSchema)
  ])
  return { crosswalk, cornerSkills, roles, skills }
}

type Inputs = Awaited<ReturnType<typeof loadSgfInputs>>

/** A title that names a rank, such as Lead UI Designer, shows after the plain one, so the equivalent reads as the job. */
const RANKED = /\b(associate|assistant|senior|lead|principal|head|chief|director|manager|partner|vice)\b/i

/** Two sectors can name the same skill with different codes; a corner shows it once, at the higher level. */
function uniqueByTitle<T extends { title: string; proficiency_level: number | null }>(skills: T[]): T[] {
  const best = new Map<string, T>()
  for (const skill of skills) {
    const seen = best.get(skill.title)
    if (!seen || (skill.proficiency_level ?? 0) > (seen.proficiency_level ?? 0)) best.set(skill.title, skill)
  }
  return skills.filter((skill) => best.get(skill.title) === skill)
}

export function roleSgf(inputs: Inputs, code: string, cornerIds: string[]): BundleRole['sgf'] {
  const roles = sgfMatchedRoles(inputs.crosswalk, code).map((id) => {
    const role = inputs.roles.roles[id]
    const confidence = inputs.crosswalk.by_role[id].confidence
    if (confidence === 'low') throw new Error(`${id}: low matches are not shown`)
    return { role_id: id, sector: role.sector, track: role.track, title: role.title, confidence }
  })
  const rank = (r: (typeof roles)[number]) => (r.confidence === 'high' ? 0 : 2) + (RANKED.test(r.title) ? 1 : 0)
  roles.sort((a, b) => rank(a) - rank(b))
  const linked = inputs.cornerSkills.roles[code] ?? {}
  // The chip's panel is brief: the description's first sentence only.
  const describe = (code: string) => inputs.skills.skills[code]?.description.split(/(?<=\.)\s+/)[0] ?? null
  const corners = Object.fromEntries(
    cornerIds.flatMap((id) =>
      (linked[id]?.length ?? 0) > 0
        ? [[id, uniqueByTitle(linked[id]).map((skill) => ({ ...skill, description: describe(skill.code) }))]]
        : []
    )
  )
  return { roles, corners }
}

export function sgfSource(inputs: Inputs) {
  const { meta } = inputs.roles
  return {
    source_name: meta.source_name,
    source_url: meta.source_url,
    vintage_date: meta.vintage_date,
    geo_or_layer: meta.geo_or_layer
  }
}
