import { EngineSnapshotSchema, HealthResponseSchema, sampleSnapshot } from '@kotak/shared'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

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
