import type { ToolDeps } from '@kotak/agent'
import { createKotak, fetchSource, type BundleSource, type Kotak } from '@kotak/sdk'
import type { Context } from 'hono'
import { onetOccupationIndex } from './ai/occupation-index'
import { jobMarketsFor } from './routes/market'
import { nationalViewSummary } from './routes/national-view'

// What Kotak's tools run on, for the MCP route (./routes/mcp.ts) and Kopi's chat (./routes/agent.ts).

type AssetsBinding = { fetch: (input: string) => Promise<Response> }

// The Worker reads the data bundle through the ASSETS binding; bun.ts injects a reader for the built bundle on disk.
export type KotakBindings = { ASSETS?: AssetsBinding; BUNDLE_SOURCE?: BundleSource }

// One Kotak per isolate, made from the first request's bindings, so parsed role files persist across requests. The
// sources are trusted: the build already validated the bundle, and Zod parsing it would cost Worker CPU (#184).
let isolateKotak: Kotak | undefined

function kotakFor(env: KotakBindings | undefined): Kotak | undefined {
  if (isolateKotak) return isolateKotak
  const assets = env?.ASSETS
  const source =
    env?.BUNDLE_SOURCE ??
    (assets && fetchSource({ baseUrl: 'https://assets.local', fetch: (url) => assets.fetch(url), trusted: true }))
  return (isolateKotak = source && createKotak({ source }))
}

export const searchTitles = (title: string, limit: number) => onetOccupationIndex.search(title, limit)

/** The tools' deps for this request; undefined when the server has no data bundle. */
export function toolDepsFor(context: Context<{ Bindings: KotakBindings }>): Omit<ToolDeps, 'today'> | undefined {
  const kotak = kotakFor(context.env)
  return (
    kotak && {
      kotak,
      searchTitles,
      nationalView: (filter) => nationalViewSummary(context, filter),
      jobMarket: (codes) => jobMarketsFor(context, codes)
    }
  )
}
