import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serveStatic } from 'hono/bun'
import { createDiskStore } from './ai/disk-store'
import type { AiBindings } from './ai/env'
import { createMemoryRateLimiter } from './ai/rate-limit'
import { serveAdminDocument, type ScraperAdminBindings } from './admin-auth'
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
const bindings: AiBindings & KotakBindings & ScraperAdminBindings = {
  AI_CACHE: createDiskStore(fileURLToPath(new URL('../../../.cache/ai', import.meta.url))),
  BUNDLE_SOURCE: { trusted: true, read: (path) => Bun.file(join(webRoot, path)).json() },
  SCRAPER_LOGIN_LIMITER: createMemoryRateLimiter(5)
}

// Replit's proxy ends HTTPS and forwards plain HTTP, so there a request URL reads http:// while the browser's Origin
// reads https://, and the admin same-origin check refused every sign-in. On Replit (REPLIT_DEPLOYMENT in a published
// app; REPLIT_DEV_DOMAIN or REPL_ID in the workspace), the URL takes the https scheme the proxy reports in
// X-Forwarded-Proto. Elsewhere the URL is used as it arrives.
const behindReplitProxy = Boolean(Bun.env.REPLIT_DEPLOYMENT || Bun.env.REPLIT_DEV_DOMAIN || Bun.env.REPL_ID)

function withExternalScheme(request: Request): Request {
  if (!behindReplitProxy) return request
  const forwarded = request.headers.get('X-Forwarded-Proto')?.split(',')[0]?.trim().toLowerCase()
  const url = new URL(request.url)
  if (forwarded !== 'https' || url.protocol !== 'http:') return request
  url.protocol = 'https:'
  return new Request(url, request)
}

Bun.serve({
  fetch: (incoming, server) => {
    const request = withExternalScheme(incoming)
    const requestBindings = { ...bindings, SCRAPER_LOGIN_CLIENT_IP: server.requestIP(incoming)?.address ?? 'unknown' }
    const path = new URL(request.url).pathname
    if (path === '/admin' || path.startsWith('/admin/')) {
      return serveAdminDocument(request, Bun.env.DATABASE_URL, {
        fetch: async (assetRequest) => app.fetch(assetRequest, requestBindings)
      })
    }
    return app.fetch(request, requestBindings)
  },
  port
})

console.info(`Kotak listening on http://localhost:${port}`)
