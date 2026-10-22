// Levels on matched roles (#83): reuse the user's answers where a role's corners overlap the answered ones.

import type { TransferAnswer, TransferLinks, TransferRole, TransferredLevel } from './schemas'

type Weights = Map<TransferAnswer, number>

const add = (weights: Weights, answers: TransferAnswer[]) => {
  for (const a of answers) weights.set(a, (weights.get(a) ?? 0) + 1)
}

/**
 * A level for every corner of `role`, trying in strict order: the user's own answer ("self-reported"); answered corners
 * sharing an intermediate work activity, weighted by shared task links ("estimated from your answers"); answered
 * corners sharing only a broad work activity, weighted the same way ("rough estimate"); else 0 ("not asked yet").
 * A weighted level is rounded down, so an estimate never credits more than the answers show.
 */
export function transferLevels(
  role: TransferRole,
  answers: TransferAnswer[],
  links: TransferLinks
): TransferredLevel[] {
  const iwasOf = (taskIds: (string | number)[]) => taskIds.flatMap((id) => links.task_iwas[String(id)] ?? [])
  const answered = answers.map((a) => {
    const iwas = new Set(iwasOf(a.task_ids))
    return { answer: a, iwas, broads: new Set([...iwas].flatMap((i) => links.iwa_broad[i] ?? [])) }
  })

  return role.corners.map((corner) => {
    const taskLinks = iwasOf(corner.task_ids)
    const byIwa: Weights = new Map()
    const byBroad: Weights = new Map()
    let iwaLinks = 0
    let broadLinks = 0
    for (const iwa of taskLinks) {
      const sharedIwa = answered.filter((a) => a.iwas.has(iwa)).map((a) => a.answer)
      if (sharedIwa.length > 0) {
        iwaLinks++
        add(byIwa, sharedIwa)
        continue
      }
      const broad = links.iwa_broad[iwa]
      const sharedBroad = answered.filter((a) => broad !== undefined && a.broads.has(broad)).map((a) => a.answer)
      if (sharedBroad.length > 0) {
        broadLinks++
        add(byBroad, sharedBroad)
      }
    }

    const own = answers.find((a) => a.onet_code === role.onet_code && a.corner_id === corner.corner_id)
    const weights: Weights = own ? new Map() : iwaLinks > 0 ? byIwa : byBroad
    const total = [...weights.values()].reduce((sum, w) => sum + w, 0)
    const weighted = own
      ? own.level
      : total > 0
        ? [...weights].reduce((sum, [a, w]) => sum + a.level * w, 0) / total
        : null
    const label = own
      ? 'self-reported'
      : iwaLinks > 0
        ? 'estimated from your answers'
        : broadLinks > 0
          ? 'rough estimate'
          : 'not asked yet'
    return {
      onet_code: role.onet_code,
      corner_id: corner.corner_id,
      level: Math.floor(weighted ?? 0),
      label,
      basis: {
        task_links: taskLinks.length,
        iwa_links: iwaLinks,
        broad_links: broadLinks,
        weighted_level: weighted,
        from: [...weights].map(([a, shared_links]) => ({
          onet_code: a.onet_code,
          corner_id: a.corner_id,
          level: a.level,
          shared_links
        }))
      }
    }
  })
}
