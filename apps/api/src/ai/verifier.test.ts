import { describe, expect, test } from 'bun:test'
import type { ExplanationRequest } from '@kotak/shared'
import { buildExplanations, templateExplanation, type ExplanationDraft } from './verifier'

const aei = { source_name: 'Anthropic Economic Index', vintage_date: '2026-04-01' }
const dosm = { source_name: 'DOSM Job Market Insights', vintage_date: '2026-03-15' }
const onet = { source_name: 'O*NET 30.1', vintage_date: '2025-12-01' }
const source = (citation: { source_name: string; vintage_date: string }) => ({
  ...citation,
  source_url: 'https://example.org/source',
  geo_or_layer: 'MY'
})

// Real changes: Problem Solving Steady to Rising, Communication Rising to Declining.
const request: ExplanationRequest = {
  snapshot_id: '2026-05',
  corners: [
    {
      corner_id: 'problem-solving',
      name: 'Problem Solving',
      verdict: 'Rising',
      previous_verdict: 'Steady',
      user_level: 2,
      target_level: 3,
      sources: [source(aei), source(dosm)]
    },
    {
      corner_id: 'communication',
      name: 'Communication',
      verdict: 'Declining',
      previous_verdict: 'Rising',
      user_level: 2,
      target_level: 1,
      sources: [source(onet)]
    },
    {
      corner_id: 'technical-work',
      name: 'Technical Work',
      verdict: 'Steady',
      previous_verdict: 'Steady',
      user_level: 2,
      target_level: 3,
      sources: [source(aei)]
    },
    {
      corner_id: 'digital-tools',
      name: 'Digital Tools',
      verdict: 'Split',
      user_level: 0,
      target_level: 3,
      sources: [source(onet)]
    },
    {
      corner_id: 'adaptability',
      name: 'Adaptability',
      verdict: 'Unknown',
      user_level: 2,
      target_level: 1,
      sources: [source(aei)]
    },
    {
      corner_id: 'learning',
      name: 'Continuous Learning',
      verdict: 'Steady',
      previous_verdict: 'Steady',
      user_level: 1,
      target_level: 2,
      sources: [source(onet)]
    }
  ]
}

const goodSentences: Record<string, [string, string]> = {
  'problem-solving': [
    'Problem Solving is Rising as AI use on its tasks grows (Anthropic Economic Index, 2026-04-01).',
    'Job ads keep asking for it (DOSM Job Market Insights, 2026-03-15), and your level is below the target.'
  ],
  communication: [
    'Communication is Declining because AI now drafts much of this work (O*NET 30.1, 2025-12-01).',
    'Your level is above the target, so other corners matter more.'
  ],
  'technical-work': [
    'Technical Work is Steady in the latest data (Anthropic Economic Index, 2026-04-01).',
    'Your level is below the target, so this is a gap to close.'
  ],
  'digital-tools': [
    'Digital Tools is Split because the slow and fast scenarios disagree (O*NET 30.1, 2025-12-01).',
    'Your level is below the target in both futures.'
  ],
  adaptability: [
    'Adaptability is Unknown because fewer than two dated points exist (Anthropic Economic Index, 2026-04-01).',
    'Your level is above the target for now.'
  ],
  learning: ['Continuous Learning is Steady (O*NET 30.1, 2025-12-01).', 'Your level is below the target.']
}

const goodSummary =
  'Problem Solving moved from Steady to Rising and Communication moved from Rising to Declining (Anthropic Economic Index, 2026-04-01).'

function draft(changes: Record<string, [string, string]> = {}, summary = goodSummary): ExplanationDraft {
  const sentences = { ...goodSentences, ...changes }
  return {
    corners: request.corners.map(({ corner_id }) => ({
      corner_id,
      sentence_1: sentences[corner_id][0],
      sentence_2: sentences[corner_id][1]
    })),
    what_changed_summary: summary
  }
}

const sourceOf = (result: ReturnType<typeof buildExplanations>, cornerId: string) =>
  result.explanations.find((explanation) => explanation.corner_id === cornerId)?.source

const cornerOf = (cornerId: string) => request.corners.find((corner) => corner.corner_id === cornerId)!

describe('explanation verifier', () => {
  test('keeps a draft that states each verdict, cites dated sources and writes no other digits', () => {
    const result = buildExplanations(request, draft())
    expect(result.explanations.map((explanation) => explanation.source)).toEqual(Array(6).fill('claude'))
    expect(result.what_changed_source).toBe('claude')
    expect(result.what_changed_summary).toBe(goodSummary)
    expect(result.fallback_reason).toBeUndefined()
    expect(result.explanations[0].citations).toEqual([aei, dosm])
  })

  test('replaces a summary that swaps the transitions between corners', () => {
    const swapped =
      'Problem Solving moved from Rising to Declining and Communication moved from Steady to Rising (Anthropic Economic Index, 2026-04-01).'
    const result = buildExplanations(request, draft({}, swapped))
    expect(result.what_changed_source).toBe('template')
    expect(result.what_changed_summary).not.toBe(swapped)
    expect(result.fallback_reason).toBe('verifier_rejected')
  })

  test('replaces a corner that credits its verdict only to demand when it has an Economic Index source', () => {
    const result = buildExplanations(
      request,
      draft({
        'problem-solving': [
          'Problem Solving is Rising as job ads keep asking for it (DOSM Job Market Insights, 2026-03-15).',
          'Your level is below the target, so this is a gap to close.'
        ]
      })
    )
    expect(result.explanations[0]).toEqual(templateExplanation(cornerOf('problem-solving'), request.snapshot_id))
    expect(sourceOf(result, 'communication')).toBe('claude')
  })

  test('replaces a summary that cites no Economic Index source when a changed corner has one', () => {
    const demandOnly =
      'Problem Solving moved from Steady to Rising and Communication moved from Rising to Declining (DOSM Job Market Insights, 2026-03-15).'
    const result = buildExplanations(request, draft({}, demandOnly))
    expect(result.what_changed_source).toBe('template')
    expect(result.fallback_reason).toBe('verifier_rejected')
  })

  // A first check-up sends no previous verdicts, so nothing changed, and the summary must still cite (#396).
  test('replaces a summary with no citation when no verdict changed', () => {
    const firstVisit = { ...request, corners: request.corners.map(({ previous_verdict, ...corner }) => corner) }
    const uncited = 'No verdict changed, since no previous verdict is given for any corner.'
    const result = buildExplanations(firstVisit, draft({}, uncited))
    expect(result.what_changed_source).toBe('template')
    expect(result.fallback_reason).toBe('verifier_rejected')
    const cited = 'No verdict changed in this snapshot (Anthropic Economic Index, 2026-04-01).'
    expect(buildExplanations(firstVisit, draft({}, cited)).what_changed_source).toBe('claude')
  })

  test('replaces a corner that negates its verdict label', () => {
    const result = buildExplanations(
      request,
      draft({
        'technical-work': [
          'Technical Work is not Steady anymore (Anthropic Economic Index, 2026-04-01).',
          'Your level is below the target, so this is a gap to close.'
        ]
      })
    )
    expect(result.explanations[2]).toEqual(templateExplanation(cornerOf('technical-work'), request.snapshot_id))
    expect(sourceOf(result, 'problem-solving')).toBe('claude')
  })

  test('replaces a corner that writes levels as digits, swapped or invented', () => {
    const result = buildExplanations(
      request,
      draft({
        // The real levels are 2 and 3.
        'technical-work': [
          'Technical Work is Steady in the latest data (Anthropic Economic Index, 2026-04-01).',
          'You are at level 3 and the target is 2.'
        ],
        // The real target is 2.
        learning: ['Continuous Learning is Steady (O*NET 30.1, 2025-12-01).', 'You are at level 1, the target is 1.']
      })
    )
    expect(sourceOf(result, 'technical-work')).toBe('template')
    expect(sourceOf(result, 'learning')).toBe('template')
    expect(sourceOf(result, 'communication')).toBe('claude')
  })

  test('replaces a corner that swaps the dates between two sources', () => {
    const result = buildExplanations(
      request,
      draft({
        'problem-solving': [
          'Problem Solving is Rising as AI use on its tasks grows (Anthropic Economic Index, 2026-03-15).',
          'Job ads keep asking for it (DOSM Job Market Insights, 2026-04-01), and your level is below the target.'
        ]
      })
    )
    expect(result.explanations[0]).toEqual(templateExplanation(cornerOf('problem-solving'), request.snapshot_id))
  })

  test('replaces a corner that names a source without its date', () => {
    const result = buildExplanations(
      request,
      draft({
        'problem-solving': [
          'Problem Solving is Rising as AI use on its tasks grows (Anthropic Economic Index, 2026-04-01).',
          'Job ads from DOSM Job Market Insights keep asking for it (DOSM Job Market Insights, 2026-03-15), and your level is below the target.'
        ]
      })
    )
    expect(result.explanations[0]).toEqual(templateExplanation(cornerOf('problem-solving'), request.snapshot_id))
    expect(sourceOf(result, 'communication')).toBe('claude')
  })

  test('replaces a corner whose fields hold more than one sentence each', () => {
    const result = buildExplanations(
      request,
      draft({
        'problem-solving': [
          'Problem Solving is Rising. AI use on its tasks grows (Anthropic Economic Index, 2026-04-01).',
          'Job ads keep asking for it. Your level is below the target (DOSM Job Market Insights, 2026-03-15).'
        ]
      })
    )
    expect(sourceOf(result, 'problem-solving')).toBe('template')
    expect(sourceOf(result, 'communication')).toBe('claude')
  })
})
