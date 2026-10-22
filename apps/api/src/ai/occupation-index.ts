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
