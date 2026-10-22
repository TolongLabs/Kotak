import type { OnetTitleIndex, OnetTitleKind } from './onet'

// Alternate-title lookup over `data/onet/title-index.json`. Pure TypeScript with no file access, so it runs on
// Workers and in the browser. The index is trusted here: `scripts/ingest/onet.ts` validates it with
// `OnetTitleIndexSchema` before writing, so parse it there or at build time, not per request.

/** Bump when `normalizeTitle` changes; the index stores the version its keys were built with. */
export const TITLE_KEY_VERSION = 1

function stem(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1)
  return token
}

/** Lower-case, strip accents and punctuation, and drop simple plurals, so "Software Developers" matches "software developer". */
export function normalizeTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[.'’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(stem)
    .join(' ')
}

export interface TitleHit {
  onet_code: string
  /** The O*NET occupation title. */
  title: string
  /** The title, alternate title or short title that matched, as O*NET publishes it. */
  matched_title: string
  kind: OnetTitleKind
  masco_2020: string | null
  masco_unmatched: boolean
}

export interface TitleLookupResult {
  /** `exact`: the whole normalised query is a known title. `partial`: every query word starts a word of the hits. */
  match: 'exact' | 'partial' | 'none'
  hits: TitleHit[]
}

const KIND_RANK: Record<OnetTitleKind, number> = { title: 0, alternate: 1, short: 2 }

const occupationCaches = new WeakMap<OnetTitleIndex, Map<string, [string, string | null]>>()

function occupationsOf(index: OnetTitleIndex): Map<string, [string, string | null]> {
  let byCode = occupationCaches.get(index)
  if (!byCode) {
    byCode = new Map(index.occupations.map(([code, title, masco]) => [code, [title, masco]]))
    occupationCaches.set(index, byCode)
  }
  return byCode
}

interface SearchCache {
  /** Every key, each preceded by a newline, so one native `indexOf` scan finds word starts. */
  keys: string
  /** Offset of each entry's key in `keys`. */
  starts: Int32Array
}

const searchCaches = new WeakMap<OnetTitleIndex, SearchCache>()

/** Built on the first partial lookup only; exact lookups never need it. */
function searchOf(index: OnetTitleIndex): SearchCache {
  let cache = searchCaches.get(index)
  if (!cache) {
    const starts = new Int32Array(index.entries.length)
    let offset = 1
    index.entries.forEach(([key], i) => {
      starts[i] = offset
      offset += key.length + 1
    })
    cache = { keys: `\n${index.entries.map(([key]) => key).join('\n')}`, starts }
    searchCaches.set(index, cache)
  }
  return cache
}

/**
 * Build the lookup caches now. The first partial lookup otherwise pays for them (about 20 ms on a 4 MB index), so
 * call this at module scope on Workers, where startup time is not billed to a request.
 */
export function prepareTitleIndex(index: OnetTitleIndex): void {
  occupationsOf(index)
  searchOf(index)
}

/** Indexes of the entries with a word that starts with `word`, ascending. */
function entriesWithWord(cache: SearchCache, word: string): number[] {
  const found = new Set<number>()
  for (const separator of ['\n', ' ']) {
    const needle = separator + word
    for (let at = cache.keys.indexOf(needle); at !== -1; at = cache.keys.indexOf(needle, at + 1)) {
      let low = 0
      let high = cache.starts.length - 1
      while (low < high) {
        const mid = (low + high + 1) >>> 1
        if (cache.starts[mid] <= at + 1) low = mid
        else high = mid - 1
      }
      found.add(low)
    }
  }
  return [...found].sort((a, b) => a - b)
}

function lowerBound(index: OnetTitleIndex, key: string): number {
  let low = 0
  let high = index.entries.length
  while (low < high) {
    const mid = (low + high) >>> 1
    if (index.entries[mid][0] < key) low = mid + 1
    else high = mid
  }
  return low
}

function toHits(index: OnetTitleIndex, entries: OnetTitleIndex['entries'], limit: number): TitleHit[] {
  const sorted = [...entries].sort((a, b) => KIND_RANK[a[3]] - KIND_RANK[b[3]] || a[0].length - b[0].length)
  const seen = new Set<string>()
  const hits: TitleHit[] = []
  for (const [, code, matched, kind] of sorted) {
    if (seen.has(code)) continue
    seen.add(code)
    const [title, masco] = occupationsOf(index).get(code) ?? [matched, null]
    hits.push({
      onet_code: code,
      title,
      matched_title: matched,
      kind,
      masco_2020: masco,
      masco_unmatched: masco === null
    })
    if (hits.length === limit) break
  }
  return hits
}

/** Resolve a job title against O*NET titles and alternate titles. Each hit is a distinct occupation. */
export function lookupTitle(index: OnetTitleIndex, query: string, limit = 10): TitleLookupResult {
  if (index.key_version !== TITLE_KEY_VERSION) {
    throw new Error(`title index key_version ${index.key_version} does not match ${TITLE_KEY_VERSION}`)
  }
  const key = normalizeTitle(query)
  if (!key) return { match: 'none', hits: [] }

  const exact: OnetTitleIndex['entries'] = []
  for (let i = lowerBound(index, key); i < index.entries.length && index.entries[i][0] === key; i++) {
    exact.push(index.entries[i])
  }
  if (exact.length > 0) return { match: 'exact', hits: toHits(index, exact, limit) }

  // Partial: scan for the longest word, then keep the candidates where every other word starts a word too.
  const [longest, ...others] = key.split(' ').sort((a, b) => b.length - a.length)
  const partial = entriesWithWord(searchOf(index), longest)
    .map((i) => index.entries[i])
    .filter(([entryKey]) => others.every((word) => entryKey.startsWith(word) || entryKey.includes(` ${word}`)))
  const hits = toHits(index, partial, limit)
  return { match: hits.length > 0 ? 'partial' : 'none', hits }
}
