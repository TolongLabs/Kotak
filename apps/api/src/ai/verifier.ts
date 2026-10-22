import { VerdictSchema, type ExplanationRequest, type ExplanationResponse, type Verdict } from '@kotak/shared'
import { z } from 'zod'

// What Claude returns. Two sentence fields make "exactly two sentences" part of the shape.
export const ExplanationDraftSchema = z.object({
  corners: z.array(z.object({ corner_id: z.string(), sentence_1: z.string(), sentence_2: z.string() })),
  what_changed_summary: z.string()
})

export type ExplanationDraft = z.infer<typeof ExplanationDraftSchema>
type DraftCorner = ExplanationDraft['corners'][number]
type Corner = ExplanationRequest['corners'][number]
type Explanation = ExplanationResponse['explanations'][number]
type Citation = Explanation['citations'][number]

const MAX_SENTENCE_LENGTH = 320
const MAX_SUMMARY_LENGTH = 600
// Words that deny, date or hedge a verdict label when they sit within a few words of it.
const NEGATIONS = new Set(
  'not no never nor neither none nothing without cannot anymore longer formerly previously was were could might may would if unless become becomes becoming almost nearly'.split(
    ' '
  )
)
const NEGATION_WINDOW_BEFORE = 3
const NEGATION_WINDOW_AFTER = 2

export function cornerName(corner: Corner): string {
  if (corner.name) return corner.name
  const words = corner.corner_id.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function uniqueCitations(sources: readonly Citation[]): Citation[] {
  const unique = new Map<string, Citation>()
  for (const { source_name, vintage_date } of sources) {
    unique.set(`${source_name}\n${vintage_date}`, { source_name, vintage_date })
  }
  return [...unique.values()]
}

function citeList(citations: readonly Citation[]): string {
  return citations.map(({ source_name, vintage_date }) => `${source_name}, dated ${vintage_date}`).join('; ')
}

type Phrase = { kind: 'source' | 'date' | 'corner'; value: string }
type Token = Phrase | { kind: 'verdict'; value: Verdict } | { kind: 'stop' }

interface Scan {
  tokens: Token[]
  // The text with every source name, date and corner name taken out.
  prose: string
  // The text with those phrases replaced by markers, so their own dots and words do not count.
  marked: string
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const MARKER = /\u0001(.)\u0002/g
const marker = (index: number) => `\u0001${String.fromCharCode(0xe000 + index)}\u0002`

// Finds the exact source names, dates and corner names the input gave, the verdict labels and the clause
// breaks, in reading order.
function scan(text: string, sources: readonly Citation[], corners: readonly Corner[]): Scan {
  const phrasesOf = (kind: Phrase['kind'], values: readonly string[]): Phrase[] =>
    [...new Set(values)].filter(Boolean).map((value) => ({ kind, value }))
  // Longest first, so a name that contains a shorter name or a date is taken whole.
  const known = [
    ...phrasesOf(
      'source',
      sources.map((source) => source.source_name)
    ),
    ...phrasesOf(
      'date',
      sources.map((source) => source.vintage_date)
    ),
    ...phrasesOf('corner', corners.map(cornerName))
  ].sort((a, b) => b.value.length - a.value.length)
  const phrasePattern = new RegExp(known.map((phrase) => escapeRegExp(phrase.value)).join('|'), 'g')
  const marked = known.length
    ? text.replace(phrasePattern, (match) => marker(known.findIndex((phrase) => phrase.value === match)))
    : text

  const tokens: Token[] = []
  const tokenPattern = new RegExp(`\\u0001(.)\\u0002|\\b(${VerdictSchema.options.join('|')})\\b|[.;!?]`, 'gi')
  for (const [, markedPhrase, label] of marked.matchAll(tokenPattern)) {
    if (markedPhrase) tokens.push(known[markedPhrase.charCodeAt(0) - 0xe000])
    else if (label) tokens.push({ kind: 'verdict', value: verdictLabel(label) })
    else tokens.push({ kind: 'stop' })
  }
  return { tokens, prose: marked.replace(MARKER, ' '), marked }
}

const verdictLabel = (word: string): Verdict =>
  VerdictSchema.options.find((label) => label.toLowerCase() === word.toLowerCase()) ?? VerdictSchema.options[0]

// Each source name must be followed by its own date in the same clause, before any other name, date or
// clause break, and every date must follow its own source. Returns the citations, or null on any other pairing.
function pairedCitations(tokens: readonly Token[], sources: readonly Citation[]): Citation[] | null {
  const pairs = new Set(sources.map((source) => `${source.source_name}\n${source.vintage_date}`))
  const cited: Citation[] = []
  let pending: string | null = null
  for (const token of tokens) {
    if (token.kind === 'source') {
      if (pending !== null) return null
      pending = token.value
    } else if (token.kind === 'date') {
      if (pending === null || !pairs.has(`${pending}\n${token.value}`)) return null
      cited.push({ source_name: pending, vintage_date: token.value })
      pending = null
    } else if (token.kind === 'stop' && pending !== null) {
      return null
    }
  }
  return pending === null ? uniqueCitations(cited) : null
}

// A verdict label with "not", "no longer", "isn't", "was", "could" and the like next to it no longer states the verdict.
function negatesAVerdict(marked: string): boolean {
  const words = (part: string) =>
    part
      .replace(/[’‘]/g, "'")
      .toLowerCase()
      .split(/[^a-z']+/)
      .filter(Boolean)
  const denies = (word: string) => NEGATIONS.has(word) || word.endsWith("n't")
  const labels = new RegExp(`\\b(?:${VerdictSchema.options.join('|')})\\b`, 'gi')
  for (const match of marked.matchAll(labels)) {
    const before =
      marked
        .slice(0, match.index)
        .split(/[.;!?]/)
        .at(-1) ?? ''
    const after = marked.slice(match.index + match[0].length).split(/[.;!?]/)[0] ?? ''
    const near = [...words(before).slice(-NEGATION_WINDOW_BEFORE), ...words(after).slice(0, NEGATION_WINDOW_AFTER)]
    if (near.some(denies)) return true
  }
  return false
}

// One sentence: a single closing . ! or ? at the end, once names and dates (which may hold dots) are masked.
function isOneSentence(marked: string): boolean {
  const text = marked.trim()
  const ends = text.match(/[.!?]+["')\]]*(?=\s|$)/g) ?? []
  return ends.length === 1 && /[.!?]+["')\]]*$/.test(text)
}

// Keeps Claude's two sentences only if each field is one sentence, they name the corner's own verdict and no
// other, never negate or hedge it, cite the corner's sources as exact name and date pairs, and hold no other digit.
// Numbers are shown by the app, not written by Claude.
function verifyCorner(request: ExplanationRequest, corner: Corner, draft: DraftCorner | undefined): Explanation | null {
  if (!draft) return null
  const sentences: [string, string] = [draft.sentence_1.trim(), draft.sentence_2.trim()]
  if (sentences.some((sentence) => sentence.length === 0 || sentence.length > MAX_SENTENCE_LENGTH)) return null
  if (!sentences.every((sentence) => isOneSentence(scan(sentence, corner.sources, request.corners).marked))) return null

  const { tokens, prose, marked } = scan(sentences.join(' '), corner.sources, request.corners)
  const citations = pairedCitations(tokens, corner.sources)
  if (!citations || citations.length === 0) return null
  const labels = new Set(tokens.flatMap((token) => (token.kind === 'verdict' ? [token.value] : [])))
  if (labels.size !== 1 || !labels.has(corner.verdict)) return null
  if (negatesAVerdict(marked) || /\d/.test(prose)) return null
  return { corner_id: corner.corner_id, sentences, citations, source: 'claude' }
}

function changedCorners(request: ExplanationRequest): Corner[] {
  return request.corners.filter((corner) => corner.previous_verdict && corner.previous_verdict !== corner.verdict)
}

// The summary passes the same citation, negation and digit checks. Each verdict label belongs to the corner
// named before it: a changed corner must carry exactly its previous and current labels, in that order, and an
// unchanged corner at most its own verdict. A label before any corner name, or any label when nothing
// changed, fails.
function verifySummary(request: ExplanationRequest, summary: string): string | null {
  const text = summary.trim()
  if (text.length === 0 || text.length > MAX_SUMMARY_LENGTH) return null
  const sources = request.corners.flatMap((corner) => corner.sources)
  const { tokens, prose, marked } = scan(text, sources, request.corners)
  const citations = pairedCitations(tokens, sources)
  if (!citations || citations.length === 0) return null
  if (negatesAVerdict(marked) || /\d/.test(prose)) return null

  const changed = changedCorners(request)
  const byName = new Map(request.corners.map((corner) => [cornerName(corner), corner]))
  const labelsOf = new Map<Corner, Verdict[]>()
  let current: Corner | undefined
  for (const token of tokens) {
    if (token.kind === 'corner') current = byName.get(token.value)
    if (token.kind !== 'verdict') continue
    if (!current || changed.length === 0) return null
    labelsOf.set(current, [...(labelsOf.get(current) ?? []), token.value])
  }
  const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i])
  for (const corner of changed) {
    if (!same(labelsOf.get(corner) ?? [], [corner.previous_verdict!, corner.verdict])) return null
  }
  for (const [corner, labels] of labelsOf) {
    if (!changed.includes(corner) && !same(labels, [corner.verdict])) return null
  }
  return text
}

export function templateExplanation(corner: Corner, snapshotId: string): Explanation {
  const citations = uniqueCitations(corner.sources)
  const levels = `You are at level ${corner.user_level} and the target is ${corner.target_level}`
  return {
    corner_id: corner.corner_id,
    sentences: [
      `Fixed rules rate ${cornerName(corner)} as ${corner.verdict} in the ${snapshotId} snapshot, using ${citeList(citations)}.`,
      corner.user_level < corner.target_level
        ? `${levels}, so this corner is a gap to close.`
        : `${levels}, so you already meet it.`
    ],
    citations,
    source: 'template'
  }
}

export function templateSummary(request: ExplanationRequest): string {
  const { corners, snapshot_id } = request
  const changed = changedCorners(request)
  if (changed.length > 0) {
    const moves = changed.map(
      (corner) => `${cornerName(corner)} moved from ${corner.previous_verdict} to ${corner.verdict}`
    )
    const sources = citeList(uniqueCitations(changed.flatMap((corner) => corner.sources)))
    return `In the ${snapshot_id} snapshot, ${moves.join('; ')}, according to ${sources}.`
  }
  const sources = citeList(uniqueCitations(corners.flatMap((corner) => corner.sources)))
  return corners.some((corner) => corner.previous_verdict)
    ? `No corner changed verdict in the ${snapshot_id} snapshot, according to ${sources}.`
    : `No earlier verdicts were given, so no corner is marked as changed in the ${snapshot_id} snapshot, according to ${sources}.`
}

// Every corner gets Claude's checked text or, failing a check, the fixed template from the same verdict,
// levels and sources. Verdicts and levels always come from the request, never from Claude.
export function buildExplanations(
  request: ExplanationRequest,
  draft: ExplanationDraft | null
): Omit<ExplanationResponse, 'cached'> {
  const drafts = new Map<string, DraftCorner>()
  for (const corner of draft?.corners ?? []) if (!drafts.has(corner.corner_id)) drafts.set(corner.corner_id, corner)

  const explanations = request.corners.map(
    (corner) =>
      verifyCorner(request, corner, drafts.get(corner.corner_id)) ?? templateExplanation(corner, request.snapshot_id)
  )
  const summary = draft ? verifySummary(request, draft.what_changed_summary) : null
  const rejected = summary === null || explanations.some((explanation) => explanation.source === 'template')

  return {
    explanations,
    what_changed_summary: summary ?? templateSummary(request),
    what_changed_source: summary === null ? 'template' : 'claude',
    ...(draft === null
      ? { fallback_reason: 'ai_unavailable' as const }
      : rejected
        ? { fallback_reason: 'verifier_rejected' as const }
        : {})
  }
}
