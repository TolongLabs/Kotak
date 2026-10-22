import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serveStatic } from 'hono/bun'
import { createDiskStore } from './ai/disk-store'
import type { AiBindings } from './ai/env'
import { app } from './app'

// Outside Cloudflare (local Bun, Replit) this process also serves the built web app.
// Like the Worker, unknown /api paths stay 404 and every other path falls back to index.html.
const webRoot = relative(process.cwd(), fileURLToPath(new URL('../../web/dist', import.meta.url)))
app.use('*', serveStatic({ root: webRoot }))
app.get('*', (context, next) =>
  context.req.path.startsWith('/api/') ? next() : serveStatic({ path: `${webRoot}/index.html` })(context, next)
)

const port = Number(Bun.env.PORT ?? 8787)

// Workers get AI_CACHE from the KV binding; here the same cache persists to gitignored files.
const bindings: AiBindings = {
  AI_CACHE: createDiskStore(fileURLToPath(new URL('../../../.cache/ai', import.meta.url)))
}

Bun.serve({
  fetch: (request) => app.fetch(request, bindings),
  port
})

console.info(`Kotak listening on http://localhost:${port}`)
