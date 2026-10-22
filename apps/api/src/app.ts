import { EngineSnapshotSchema, HealthResponseSchema, sampleSnapshot } from '@kotak/shared'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { defaultAiDeps } from './ai/deps'
import { createExplanationsRoute } from './routes/explanations'
import { createRolesRoute } from './routes/roles'
import { nationalView } from './routes/national-view'
import { tts } from './routes/tts'
import { jobstreetAdmin } from './routes/jobstreet-admin'

export const app = new Hono()

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
