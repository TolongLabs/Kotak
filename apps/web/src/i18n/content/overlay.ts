import type { CheckupBundle, RoleBundle } from '@kotak/sdk'
import type { BundleCorner, BundleRole, SdgReasonsFile } from '@kotak/shared'

// The translated data overlays (#449): Malay and Chinese copies of the jobs' titles, corner texts, questions,
// explainers, resource titles and the SDG reasons. The build splits `data/generated/i18n/<lang>.json` into a small
// index every page may read and one file per job, read only when that job is on screen (engine/bundle.ts). Every field
// is optional; anything without an entry keeps its English.
interface CornerOverlay {
  name?: string
  statements?: { basic?: string; working?: string; advanced?: string }
  reversed_statements?: { basic?: string; advanced?: string }
  /** Resource titles by the resource's English url. */
  resources?: Record<string, string>
}

type ScenarioQuestionOverlay = {
  situation?: string
  options?: Partial<Record<'a' | 'b' | 'c' | 'd', string>>
}

type CornerScenariosOverlay = Partial<Record<'basic' | 'advanced', ScenarioQuestionOverlay>>

/** `/data/i18n/<lang>/roles/<onet_code>.json`: one job's translated content. */
export interface RoleOverlay {
  title?: string
  corners: Record<string, CornerOverlay>
  explainers?: Record<string, { basic?: string; advanced?: string }>
  scenarios?: Record<string, CornerScenariosOverlay>
}

/** `/data/i18n/<lang>/index.json`: what any page may show for any job, and which jobs have a role file. */
export interface LocaleIndex {
  titles: Record<string, string>
  skill_names: Record<string, Record<string, string>>
  sdg_targets: Record<string, { text?: string; reason?: string }>
  /** The jobs with a `roles/<onet_code>.json` file. */
  roles: string[]
}

/** A language's index and the role files loaded for the jobs on screen. */
export interface Overlays {
  index: LocaleIndex
  roles: ReadonlyMap<string, RoleOverlay>
}

/** A job's title in the language on show, or its English title. */
export const roleTitle = (index: LocaleIndex | null, onetCode: string, english: string) =>
  index?.titles[onetCode] ?? english

function overlayCorner(
  roleCode: string,
  corner: BundleCorner,
  roleOverlay: RoleOverlay | undefined,
  index: LocaleIndex
): BundleCorner {
  const cornerOverlay = roleOverlay?.corners[corner.corner_id]
  const explainer = roleOverlay?.explainers?.[corner.corner_id]
  const scenarioOverlay = roleOverlay?.scenarios?.[corner.corner_id]
  const indexName = index.skill_names[roleCode]?.[corner.corner_id]
  if (!cornerOverlay && !explainer && !scenarioOverlay && !indexName) return corner

  const overlayScenario = (
    question: NonNullable<BundleCorner['scenarios']>['basic'],
    translated: ScenarioQuestionOverlay | undefined
  ) => {
    if (!question || !translated) return question
    return {
      ...question,
      situation: translated.situation ?? question.situation,
      options: question.options.map((option) => ({
        ...option,
        text: translated.options?.[option.id] ?? option.text
      }))
    }
  }

  const basicScenario = overlayScenario(corner.scenarios?.basic, scenarioOverlay?.basic)
  const advancedScenario = overlayScenario(corner.scenarios?.advanced, scenarioOverlay?.advanced)
  const resourceTitles = cornerOverlay?.resources

  return {
    ...corner,
    name: cornerOverlay?.name ?? indexName ?? corner.name,
    statements:
      cornerOverlay?.statements && corner.statements
        ? { ...corner.statements, ...cornerOverlay.statements }
        : corner.statements,
    reversed_statements: cornerOverlay?.reversed_statements
      ? { ...corner.reversed_statements, ...cornerOverlay.reversed_statements }
      : corner.reversed_statements,
    explainers: explainer ? { ...corner.explainers, ...explainer } : corner.explainers,
    scenarios: corner.scenarios
      ? {
          ...corner.scenarios,
          ...(basicScenario ? { basic: basicScenario } : {}),
          ...(advancedScenario ? { advanced: advancedScenario } : {})
        }
      : corner.scenarios,
    resources: resourceTitles
      ? corner.resources.map((resource) =>
          resourceTitles[resource.url] ? { ...resource, title: resourceTitles[resource.url]! } : resource
        )
      : corner.resources
  }
}

/** The role with its translated title, related titles and corner texts swapped in; untranslated roles keep identity. */
export function overlayRole(role: BundleRole, roleOverlay: RoleOverlay | undefined, index: LocaleIndex): BundleRole {
  const title = roleOverlay?.title ?? index.titles[role.onet_code]
  const relatedTranslated = role.related.some((related) => index.titles[related.onet_code])
  if (!roleOverlay && !title && !relatedTranslated && !index.skill_names[role.onet_code]) return role
  return {
    ...role,
    title: title ?? role.title,
    related: relatedTranslated
      ? role.related.map((related) => ({ ...related, title: roleTitle(index, related.onet_code, related.title) }))
      : role.related,
    corners: role.corners.map((corner) => overlayCorner(role.onet_code, corner, roleOverlay, index))
  }
}

/** The role bundle with every loaded role overlaid; ids, order and missing files are untouched. */
export function overlayRoleBundle(bundle: RoleBundle, overlays: Overlays): RoleBundle {
  const overlay = (role: BundleRole) => overlayRole(role, overlays.roles.get(role.onet_code), overlays.index)
  return { ...bundle, role: overlay(bundle.role), related: bundle.related.map(overlay) }
}

/** The check-up bundle overlaid like a role bundle; pathways and candidates pass through untouched. */
export function overlayCheckupBundle(bundle: CheckupBundle, overlays: Overlays): CheckupBundle {
  return { ...bundle, ...overlayRoleBundle(bundle, overlays) }
}

/** The SDG reasons with translated text and reason swapped in; the meta and missing targets keep English. */
export function overlaySdgReasons(file: SdgReasonsFile, index: LocaleIndex): SdgReasonsFile {
  return {
    ...file,
    targets: Object.fromEntries(
      Object.entries(file.targets).map(([target, row]) => [
        target,
        index.sdg_targets[target] ? { ...row, ...index.sdg_targets[target] } : row
      ])
    )
  }
}

/**
 * Whether everything a visitor reads about the job is translated: its title, and for every corner the name, each
 * statement and reversed tier, each resource title, both questions and each explainer the English has.
 */
export function isRoleTranslated(role: BundleRole, roleOverlay: RoleOverlay | undefined): boolean {
  if (!roleOverlay?.title) return false
  const has = (english: object | null | undefined, translated: object | undefined) =>
    Object.keys(english ?? {}).every((key) => Boolean((translated as Record<string, unknown> | undefined)?.[key]))
  return role.corners.every((corner) => {
    const overlay = roleOverlay.corners[corner.corner_id]
    const scenarios = roleOverlay.scenarios?.[corner.corner_id]
    const questionsDone = (['basic', 'advanced'] as const).every((tier) => {
      const english = corner.scenarios?.[tier]
      if (!english) return true
      const translated = scenarios?.[tier]
      return Boolean(translated?.situation) && english.options.every((option) => translated?.options?.[option.id])
    })
    return (
      Boolean(overlay?.name) &&
      has(corner.statements, overlay?.statements) &&
      has(corner.reversed_statements, overlay?.reversed_statements) &&
      corner.resources.every((resource) => overlay?.resources?.[resource.url]) &&
      questionsDone &&
      has(corner.explainers, roleOverlay.explainers?.[corner.corner_id])
    )
  })
}
