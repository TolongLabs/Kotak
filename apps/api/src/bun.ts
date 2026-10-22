import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serveStatic } from 'hono/bun'
import { createDiskStore } from './ai/disk-store'
import type { AiBindings } from './ai/env'
import { app } from './app'
import type { KotakBindings } from './tool-deps'

// Outside Cloudflare (local Bun, Replit) this process also serves the built web app.
// Like the Worker, unknown /api paths stay 404 and every other path falls back to index.html.
const webRoot = relative(process.cwd(), fileURLToPath(new URL('../../web/dist', import.meta.url)))
app.use('*', serveStatic({ root: webRoot }))
app.get('*', (context, next) =>
  context.req.path.startsWith('/api/') ? next() : serveStatic({ path: `${webRoot}/index.html` })(context, next)
)

const port = Number(Bun.env.PORT ?? 8787)

// Workers get AI_CACHE from the KV binding; here the same cache persists to gitignored files.
// The Worker reads the data bundle through ASSETS; here MCP reads the built bundle straight from disk.
const bindings: AiBindings & KotakBindings = {
  AI_CACHE: createDiskStore(fileURLToPath(new URL('../../../.cache/ai', import.meta.url))),
  BUNDLE_SOURCE: { trusted: true, read: (path) => Bun.file(join(webRoot, path)).json() }
}

Bun.serve({
  fetch: (request) => app.fetch(request, bindings),
  port
})

console.info(`Kotak listening on http://localhost:${port}`)
