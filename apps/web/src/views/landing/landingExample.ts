import { useMemo, useState } from 'react'
import { DEFAULT_SCENARIO, type BundleRole, type Rating } from '@kotak/shared'
import { computeCheckup, type Checkup } from '../../engine/checkup'
import { useRoleBundle, type Loaded } from '../../engine/bundle'
import { sourceRefs, toCorners } from '../../engine/viewModel'
import type { Corner, SourceRef } from '../../demo/types'

export const EXAMPLE_ROLE_CODE = '15-1254.00'

// Keep engine citations after the three research citations in LandingEvidence.
const evidenceCitationCount = 3

// Each pair rates the basic statement, then the advanced one (levels 3, 2, 1 and 0).
const exampleAnswers: Record<string, readonly [Rating, Rating]> = {
  'web-site-building': [4, 4],
  'web-testing-and-updates': [4, 2],
  'technical-documentation': [3, 1],
  'web-design-and-databases': [1, 1],
  'web-specifications-and-standards': [4, 2],
  'web-performance-and-support': [3, 1]
}

export interface LandingExample {
  role: BundleRole
  related: BundleRole[]
  checkup: Checkup
  corners: Corner[]
  sources: SourceRef[]
  numbers: Map<string, number[]>
}

export interface LandingExampleQuestion {
  cornerId: string
  name: string
  statement: string
  basicRating: Rating
}

export function useLandingExample(): Loaded<LandingExample> {
  const bundle = useRoleBundle(EXAMPLE_ROLE_CODE)
  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  const example = useMemo(() => {
    if (bundle.status !== 'ready') return null

    const { role, related } = bundle.data
    const answers = role.corners.flatMap(({ corner_id }) => {
      const answer = exampleAnswers[corner_id]
      return answer ? [...answer] : [null, null]
    })
    const checkup = computeCheckup({
      role,
      related,
      answers,
      snapshotId: '2026-05',
      scenario: DEFAULT_SCENARIO,
      weeklyHours: 3,
      startDate: today
    })
    const references = sourceRefs(checkup)
    const sources = references.sources.map((source) => ({ ...source, n: source.n + evidenceCitationCount }))
    const numbers = new Map(
      [...references.numbers].map(([cornerId, citations]) => [
        cornerId,
        citations.map((citation) => citation + evidenceCitationCount)
      ])
    )

    return {
      role,
      related,
      checkup,
      corners: toCorners(checkup, numbers),
      sources,
      numbers
    }
  }, [bundle, today])

  if (bundle.status !== 'ready') return bundle
  return { status: 'ready', data: example! }
}

export function getLandingExampleQuestions(example: LandingExample): LandingExampleQuestion[] {
  return example.checkup.questionOrder.flatMap(({ corner_id, name }) => {
    const statement = example.role.corners.find((corner) => corner.corner_id === corner_id)?.statements?.basic
    const answer = exampleAnswers[corner_id]

    return statement && answer ? [{ cornerId: corner_id, name, statement, basicRating: answer[0] }] : []
  })
}
