import { useMemo, useState } from 'react'
import type { BundleRole } from '@kotak/shared'
import { computeCheckup, type Checkup } from '../../engine/checkup'
import { useRoleBundle, type Loaded } from '../../engine/bundle'
import { sourceRefs, toCorners } from '../../engine/viewModel'
import type { Corner, SourceRef } from '../../demo/types'

export const EXAMPLE_ROLE_CODE = '15-1254.00'

// Keep engine citations after the three research citations in LandingEvidence.
const evidenceCitationCount = 3

// Each pair answers the working question first, then the follow-up for that answer.
const exampleAnswers: Record<string, readonly [boolean, boolean]> = {
  'web-site-building': [true, true],
  'web-testing-and-updates': [true, false],
  'technical-documentation': [false, true],
  'web-design-and-databases': [false, false],
  'web-specifications-and-standards': [true, false],
  'web-performance-and-support': [false, true]
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
  workingAnswer: boolean
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
      scenario: 'slow',
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
    const statement = example.role.corners.find((corner) => corner.corner_id === corner_id)?.statements?.working
    const answer = exampleAnswers[corner_id]

    return statement && answer ? [{ cornerId: corner_id, name, statement, workingAnswer: answer[0] }] : []
  })
}
