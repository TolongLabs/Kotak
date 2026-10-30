import type { CheckupBundle, RoleBundle } from '@kotak/sdk'
import type { BundleCorner, BundleRole, SdgReasonsFile } from '@kotak/shared'
import type { Locale } from '../locale'
import ms from './ms.json'
import zh from './zh.json'

// The translated data overlays: Malay and Chinese copies of the demo roles' corner texts, the statement
// explainers and the SDG reasons. Every field is optional; anything without an entry keeps its English.
// `zh.json` is another worker's placeholder until their Chinese lands.
interface CornerOverlay {
  name?: string
  statements?: { basic?: string; working?: string; advanced?: string }
  reversed_statements?: { basic?: string; advanced?: string }
}

type ScenarioQuestionOverlay = {
  situation?: string
  options?: Partial<Record<'a' | 'b' | 'c' | 'd', string>>
}

type CornerScenariosOverlay = Partial<Record<'basic' | 'advanced', ScenarioQuestionOverlay>>

export interface ContentFile {
  roles: Record<string, { corners: Record<string, CornerOverlay> }>
  explainers: Record<string, Record<string, { basic?: string; advanced?: string }>>
  sdg_targets: Record<string, { text?: string; reason?: string }>
  scenarios?: Record<string, Record<string, CornerScenariosOverlay>>
}

const content: Record<'ms' | 'zh', ContentFile> = { ms: ms as ContentFile, zh: zh as ContentFile }

/** The overlay for the locale, or null in English: then callers return the loaded value untouched. */
export function contentFor(locale: Locale): ContentFile | null {
  return locale === 'en' ? null : content[locale]
}

function overlayCorner(roleCode: string, corner: BundleCorner, overlay: ContentFile): BundleCorner {
  const cornerOverlay = overlay.roles[roleCode]?.corners[corner.corner_id]
  const explainer = overlay.explainers[roleCode]?.[corner.corner_id]
  const scenarioOverlay = overlay.scenarios?.[roleCode]?.[corner.corner_id]
  if (!cornerOverlay && !explainer && !scenarioOverlay) return corner

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

  return {
    ...corner,
    name: cornerOverlay?.name ?? corner.name,
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
      : corner.scenarios
  }
}

/** The role with its translated corner texts swapped in; roles without an entry keep their identity. */
export function overlayRole(role: BundleRole, overlay: ContentFile): BundleRole {
  if (!overlay.roles[role.onet_code] && !overlay.explainers[role.onet_code] && !overlay.scenarios?.[role.onet_code])
    return role
  return { ...role, corners: role.corners.map((corner) => overlayCorner(role.onet_code, corner, overlay)) }
}

/** The role bundle with every loaded role overlaid; ids, order and missing files are untouched. */
export function overlayRoleBundle(bundle: RoleBundle, overlay: ContentFile): RoleBundle {
  return {
    ...bundle,
    role: overlayRole(bundle.role, overlay),
    related: bundle.related.map((role) => overlayRole(role, overlay))
  }
}

/** The check-up bundle overlaid like a role bundle; pathways and candidates pass through untouched. */
export function overlayCheckupBundle(bundle: CheckupBundle, overlay: ContentFile): CheckupBundle {
  return { ...bundle, ...overlayRoleBundle(bundle, overlay) }
}

/** The SDG reasons with translated text and reason swapped in; the meta and missing targets keep English. */
export function overlaySdgReasons(file: SdgReasonsFile, overlay: ContentFile): SdgReasonsFile {
  return {
    ...file,
    targets: Object.fromEntries(
      Object.entries(file.targets).map(([target, row]) => [
        target,
        overlay.sdg_targets[target] ? { ...row, ...overlay.sdg_targets[target] } : row
      ])
    )
  }
}
