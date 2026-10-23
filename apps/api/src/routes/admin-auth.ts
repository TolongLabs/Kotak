import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { login, logout, noStore, session, type ScraperAdminEnv } from '../admin-auth'

const route = new Hono<ScraperAdminEnv>()

route.use('*', noStore)
route.post(
  '/login',
  bodyLimit({ maxSize: 4096, onError: (context) => context.json({ error: 'request too large' }, 413) }),
  login
)
route.get('/session', session)
route.post('/logout', logout)

export const adminAuth = route
