import { lookupTitle, prepareTitleIndex, type Occupation, type OnetTitleIndex } from '@kotak/shared'
// Bundled into the Worker: it is parsed once at isolate startup, not inside a request's CPU budget.
import titleIndexJson from '../../../../data/onet/title-index.json'

export interface TitleSearch {
  // exact: the whole title is a known O*NET title or alternate title. partial: every word starts a word of the hits.
  match: 'exact' | 'partial' | 'none'
  // One per distinct occupation, best first.
  hits: Occupation[]
  // exact only: the query is the official O*NET title of the first hit and of no other hit.
  official: boolean
}

// The narrow view of the O*NET data that the job match route needs.
export interface OccupationIndex {
  // Every occupation Claude may suggest. A suggested code outside this list is rejected.
  readonly occupations: readonly Occupation[]
  // At most `limit` hits, 10 by default.
  search(title: string, limit?: number): TitleSearch
  getOccupation(onetCode: string): Occupation | null
}

export function createOnetOccupationIndex(index: OnetTitleIndex): OccupationIndex {
  prepareTitleIndex(index)
  const occupations = index.occupations.map(([onet_code, title, masco]): Occupation => ({
    onet_code,
    title,
    masco_unmatched: masco === null
  }))
  const byCode = new Map(occupations.map((occupation) => [occupation.onet_code, occupation]))
  return {
    occupations,
    search(title, limit) {
      const { match, hits } = lookupTitle(index, title, limit)
      const titles = hits.filter((hit) => hit.kind === 'title')
      return {
        match,
        official: match === 'exact' && titles.length === 1 && hits[0]?.kind === 'title',
        hits: hits.map(
          (hit) =>
            byCode.get(hit.onet_code) ?? {
              onet_code: hit.onet_code,
              title: hit.title,
              masco_unmatched: hit.masco_unmatched
            }
        )
      }
    },
    getOccupation: (onetCode) => byCode.get(onetCode.trim()) ?? null
  }
}

// O*NET 30.1 titles, alternate titles and short titles for the 923 occupations with task statements (#44).
export const onetOccupationIndex = createOnetOccupationIndex(titleIndexJson as unknown as OnetTitleIndex)

const alternateTitles = new Map<string, string[]>()

/**
 * The alternate and short titles O*NET publishes for one occupation, shortest first: the admin page offers them as
 * JobStreet search titles, and sorting listings shows them to Claude. The first request for a code scans the index
 * once, so no request pays to group every occupation; later requests reuse the list.
 */
export function occupationAlternateTitles(onetCode: string, limit = 24): string[] {
  let sorted = alternateTitles.get(onetCode)
  if (!sorted) {
    const titles = new Map<string, string>()
    for (const [key, code, matched, kind] of (titleIndexJson as unknown as OnetTitleIndex).entries) {
      if (code === onetCode && kind !== 'title' && !titles.has(key)) titles.set(key, matched)
    }
    sorted = [...titles.values()].sort((a, b) => a.length - b.length || a.localeCompare(b))
    alternateTitles.set(onetCode, sorted)
  }
  return sorted.slice(0, limit)
}

/**
 * Other occupations in the same O*NET-SOC broad group as onetCode (15-1254.00 is in 15-125), or in its minor group
 * (15-12) when the broad group has no others: the occupations a listing is most easily confused with.
 */
export function neighbouringOccupations(
  index: OccupationIndex,
  onetCode: string,
  limit = 12
): Array<{ onet_code: string; title: string }> {
  for (const prefix of [onetCode.slice(0, 6), onetCode.slice(0, 5)]) {
    const neighbours = index.occupations.filter(
      (occupation) => occupation.onet_code !== onetCode && occupation.onet_code.startsWith(prefix)
    )
    if (neighbours.length)
      return neighbours
        .slice(0, limit)
        .map((occupation) => ({ onet_code: occupation.onet_code, title: occupation.title }))
  }
  return []
}
