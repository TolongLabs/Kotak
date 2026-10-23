import { useEffect, useState } from 'react'
import { fetchJobMarkets, type JobMarket } from './api'

/**
 * What Malaysian job ads say about each role (#272), by O*NET code. Empty until the answer arrives, and for roles
 * with no approved ads; the codes' order doesn't matter.
 */
export function useJobMarkets(codes: string[]): Map<string, JobMarket> {
  const key = [...new Set(codes)].sort().join(',')
  const [markets, setMarkets] = useState<{ key: string; markets: Map<string, JobMarket> }>({
    key: '',
    markets: new Map()
  })

  useEffect(() => {
    if (!key) return
    let current = true
    void fetchJobMarkets(key.split(',')).then((found) => {
      if (current) setMarkets({ key, markets: found })
    })
    return () => {
      current = false
    }
  }, [key])

  return markets.key === key ? markets.markets : new Map()
}
