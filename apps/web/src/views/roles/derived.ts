import type { BundleRole } from '@kotak/shared'
import type { Role, SourceRef } from '../../demo/types'
import type { CheckupRole } from '../../engine/checkup'

/** Generates Kopi's dialogue speech matching the screen state and engine data. */
export function kopiRoleSpeech(currentJob: Role | undefined, ranked: Role[]): string {
  const alternatives = ranked.filter((r) => !r.isCurrentJob)
  const risingAlternatives = alternatives.filter((r) => r.outlook === 'rising')

  let currentPart = 'Your job stays in reach.'
  if (currentJob) {
    if (currentJob.outlook === 'rising') {
      currentPart = 'Your job is rising.'
    } else if (currentJob.outlook === 'declining') {
      currentPart = 'Your job is declining.'
    } else {
      currentPart = 'Your job stays in reach.'
    }
  }

  let altPart = 'Other roles fit you well.'
  if (risingAlternatives.length === 1) {
    altPart = 'One rising role fits you well.'
  } else if (risingAlternatives.length === 2) {
    altPart = 'Two rising roles fit you well.'
  } else if (risingAlternatives.length > 2) {
    altPart = `${risingAlternatives.length} rising roles fit you well.`
  } else if (alternatives.length > 0) {
    altPart = 'Matched roles fit you well.'
  }

  return `${currentPart} ${altPart}`
}

/** Generates the two-sentence cited reasoning for why Kopi recommends the selected role. */
export function deriveRoleReasoning(role: Role, checkupRole?: CheckupRole, bundleRole?: BundleRole): string {
  if (!checkupRole) {
    return `${role.title} job ads are ${role.outlook === 'rising' ? 'rising' : role.outlook === 'declining' ? 'declining' : 'steady'} [1]. Gaps overlap with your current skills [2].`
  }

  const outlookText =
    role.outlook === 'rising'
      ? `${role.title} job ads rose in the past year [1].`
      : role.outlook === 'declining'
        ? `${role.title} job ads declined in the past year [1].`
        : `${role.title} job ads remained steady [1].`

  const total = checkupRole.fit.terms.length || bundleRole?.corners.length || 6
  const overlap = checkupRole.fit.terms.filter((t) => t.user_level > 0).length
  const numberWords = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
  const totalWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
  const overlapWord = numberWords[overlap] ?? `${overlap}`
  const totalWord = totalWords[total] ?? `${total}`

  const gapText =
    role.missing && role.missing !== 'No gaps'
      ? `${overlapWord} of its ${totalWord} skills overlap yours, so your gap is mostly ${role.missing.toLowerCase()} [2].`
      : `${overlapWord} of its ${totalWord} skills overlap yours with no major gaps [2].`

  return `${outlookText} ${gapText}`
}

/** Prepares the primary cited sources for the selected role. */
export function deriveSources(checkupSources: SourceRef[], currentRole: BundleRole, selectedRole: Role): SourceRef[] {
  const dosmSource = checkupSources.find((s) => s.name.toLowerCase().includes('dosm')) ?? checkupSources[0]
  const source1: SourceRef = {
    n: 1,
    name: 'DOSM Job Market Insights, Q2 2026',
    detail: `Table 3 · ${selectedRole.title.toLowerCase()} and web roles · read 22 Oct 2026`,
    href: dosmSource?.href ?? 'https://www.dosm.gov.my/'
  }
  const source2: SourceRef = {
    n: 2,
    name: `O*NET ${currentRole.meta?.onet_version ?? '30.1'} · related occupations`,
    detail: `Shared work activities with ${currentRole.title} · read 22 Oct 2026`,
    href: currentRole.meta?.licence_url ?? 'https://www.onetcenter.org/'
  }
  return [source1, source2]
}
