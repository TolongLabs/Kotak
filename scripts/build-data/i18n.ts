import { BUNDLE_PATHS, type BundleRole } from '../../packages/shared/src/index'

// The Malay and Chinese content (#449): `data/generated/i18n/<lang>.json` split into the index every page may read
// and one file per job, read only when that job is on screen. The web app's overlay (apps/web/src/i18n/content/
// overlay.ts) reads both shapes.

export const I18N_LANGUAGES = ['ms', 'zh'] as const

type Tiers = Partial<Record<string, string>>
type CornerEntry = { name?: string; resources?: Record<string, string> }
interface ContentFile {
  roles: Record<string, { title?: string; corners: Record<string, CornerEntry> }>
  explainers: Record<string, Record<string, Tiers>>
  sdg_targets: Record<string, { text?: string; reason?: string }>
  scenarios?: Record<string, Record<string, unknown>>
}

/** The index and role files for one language; an entry naming a job, skill or resource the bundle lacks fails. */
export async function i18nFiles(
  root: string,
  lang: (typeof I18N_LANGUAGES)[number],
  roles: ReadonlyMap<string, BundleRole>,
  failures: string[]
): Promise<[string, unknown][]> {
  const where = `data/generated/i18n/${lang}.json`
  const file = (await Bun.file(`${root}/${where}`).json()) as ContentFile
  const codes = [
    ...new Set([...Object.keys(file.roles), ...Object.keys(file.explainers), ...Object.keys(file.scenarios ?? {})])
  ].sort()
  const titles: Record<string, string> = {}
  const skillNames: Record<string, Record<string, string>> = {}
  const roleFiles: [string, unknown][] = []

  for (const code of codes) {
    const role = roles.get(code)
    if (!role) {
      failures.push(`${where}: no role ${code}`)
      continue
    }
    const corners = new Map(role.corners.map((corner) => [corner.corner_id, corner]))
    const entry = file.roles[code]
    const sections = { roles: entry?.corners, explainers: file.explainers[code], scenarios: file.scenarios?.[code] }
    for (const [section, byCorner] of Object.entries(sections)) {
      for (const id of Object.keys(byCorner ?? {})) {
        if (!corners.has(id)) failures.push(`${where}: ${section}.${code} names no corner of the role: ${id}`)
      }
    }
    for (const [id, corner] of Object.entries<CornerEntry>(entry?.corners ?? {})) {
      const urls = new Set(corners.get(id)?.resources.map((resource) => resource.url))
      for (const url of Object.keys(corner.resources ?? {})) {
        if (!urls.has(url)) failures.push(`${where}: roles.${code}.corners.${id} has no resource ${url}`)
      }
      if (corner.name) (skillNames[code] ??= {})[id] = corner.name
    }
    if (entry?.title) titles[code] = entry.title
    roleFiles.push([
      BUNDLE_PATHS.i18nRole(lang, code),
      {
        ...(entry?.title ? { title: entry.title } : {}),
        corners: entry?.corners ?? {},
        ...(file.explainers[code] ? { explainers: file.explainers[code] } : {}),
        ...(file.scenarios?.[code] ? { scenarios: file.scenarios[code] } : {})
      }
    ])
  }

  const index = {
    titles,
    skill_names: skillNames,
    sdg_targets: file.sdg_targets,
    roles: codes.filter((code) => roles.has(code))
  }
  return [[BUNDLE_PATHS.i18nIndex(lang), index], ...roleFiles]
}
