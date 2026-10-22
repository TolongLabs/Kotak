import { EngineSnapshotSchema, HealthResponseSchema, sampleSnapshot } from '@kotak/shared'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { defaultAiDeps } from './ai/deps'
import { fail } from './ai/errors'
import { createAgentChatRoute } from './routes/agent'
import { createExplanationsRoute } from './routes/explanations'
import { createRolesRoute } from './routes/roles'
import { nationalView } from './routes/national-view'
import { tts } from './routes/tts'
import { jobstreetAdmin } from './routes/jobstreet-admin'
import { mcp } from './routes/mcp'

export const app = new Hono()

const hostOf = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return null // an Origin of "null", from a sandboxed frame or a file
  }
}

// Kopi's chat spends Kotak's Claude key, so it answers only Kotak's own pages: a request from another site's page
// (its Origin names another host) is refused before CORS could allow it. A request with no Origin isn't from a page.
// Hosts, not origins, are compared, since a proxy in front of the server may end TLS.
app.use('/api/agent/*', async (context, next) => {
  const origin = context.req.header('Origin')
  if (origin && hostOf(origin) !== hostOf(context.req.url)) {
    return fail(context, 403, 'cross_origin', "Kopi's chat answers only Kotak's own pages.")
  }
  await next()
})

// Every other route, the MCP server included, is open to any site.
app.use('/api/*', cors())

app.get('/api/health', (context) => {
  const response = HealthResponseSchema.parse({ status: 'ok' })
  return context.json(response)
})

app.get('/api/sample', (context) => {
  const response = EngineSnapshotSchema.parse(sampleSnapshot)
  return context.json(response)
})

app.route('/api/national-view', nationalView)
app.route('/api/tts', tts)
app.route('/api/roles', createRolesRoute(defaultAiDeps))
app.route('/api/explanations', createExplanationsRoute(defaultAiDeps))
app.route('/api/admin/scraper', jobstreetAdmin)
app.route('/api/mcp', mcp)
app.route('/api/agent', createAgentChatRoute(defaultAiDeps))

// MCP clients probe /.well-known/* for OAuth metadata. The MCP server needs no auth, so they get a JSON 404, not the SPA.
app.all('/.well-known/*', (context) => fail(context, 404, 'not_found', 'Kotak publishes no .well-known metadata.'))
