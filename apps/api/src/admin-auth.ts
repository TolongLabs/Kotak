import { neon } from '@neondatabase/serverless'
import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { RateLimiter } from './ai/env'
import { getConfig } from './config'

const ADMIN_COOKIE = '__Host-kotak_scraper_admin'
const SESSION_SECONDS = 8 * 60 * 60
const DATABASE_TIMEOUT_MS = 5_000
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,63}$/
const encoder = new TextEncoder()

export type ScraperAdminUser = { id: string; username: string }
export type ScraperAdminAuthMethod = 'session' | 'token'

export type ScraperAdminBindings = {
  DATABASE_URL?: string
  SCRAPER_ADMIN_TOKEN?: string
  SCRAPER_LOGIN_LIMITER?: RateLimiter
}

export type ScraperAdminEnv = {
  Bindings: ScraperAdminBindings
  Variables: {
    scraperAdminUser: ScraperAdminUser
    scraperAdminAuthMethod: ScraperAdminAuthMethod
  }
}

type LoginRow = ScraperAdminUser & { authenticated: boolean }

const database = (databaseUrl: string) =>
  neon(databaseUrl, { fetchOptions: { signal: AbortSignal.timeout(DATABASE_TIMEOUT_MS) } })

const base64Url = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const newSessionToken = () => base64Url(crypto.getRandomValues(new Uint8Array(32)))

const sessionTokenHash = async (token: string) => {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(token)))
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

const readSessionToken = (context: Context) => getCookie(context, ADMIN_COOKIE)

const setSessionCookie = (context: Context, token: string) =>
  setCookie(context, ADMIN_COOKIE, token, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'Strict',
    maxAge: SESSION_SECONDS
  })

const clearSessionCookie = (context: Context) =>
  deleteCookie(context, ADMIN_COOKIE, {
    path: '/',
    secure: true
  })

export const isJsonRequest = (request: Request) =>
  request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase() === 'application/json'

export const isSameOriginBrowserRequest = (request: Request) => {
  const origin = request.headers.get('Origin')
  const fetchSite = request.headers.get('Sec-Fetch-Site')
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) return false
    } catch {
      return false
    }
  }
  if (fetchSite && fetchSite !== 'same-origin') return false
  return Boolean(origin || fetchSite === 'same-origin')
}

export const validateSessionToken = async (
  databaseUrl: string | undefined,
  token: string | undefined
): Promise<ScraperAdminUser | undefined> => {
  if (!databaseUrl?.trim() || !token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return undefined
  const tokenHash = await sessionTokenHash(token)
  try {
    const rows = (await database(databaseUrl).query(
      `SELECT users.id, users.username
       FROM scraper_admin_sessions sessions
       JOIN scraper_admin_users users ON users.id = sessions.user_id
       WHERE sessions.token_hash = $1 AND sessions.expires_at > now() AND users.enabled`,
      [tokenHash]
    )) as ScraperAdminUser[]
    return rows[0]
  } catch (error) {
    console.error('Scraper admin session lookup failed:', error instanceof Error ? error.message : 'unknown error')
    return undefined
  }
}

export const validateSessionRequest = async (
  request: Request,
  databaseUrl: string | undefined
): Promise<ScraperAdminUser | undefined> => {
  const cookieHeader = request.headers.get('Cookie')
  const token = cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${ADMIN_COOKIE}=`))
    ?.slice(ADMIN_COOKIE.length + 1)
  return validateSessionToken(databaseUrl, token)
}

const bearerToken = (request: Request) => {
  const authorization = request.headers.get('Authorization')
  const match = authorization?.match(/^Bearer ([^\s]+)$/i)
  return match?.[1]
}

export const requireScraperAdmin: MiddlewareHandler<ScraperAdminEnv> = async (context, next) => {
  const expectedToken = getConfig(context, 'SCRAPER_ADMIN_TOKEN')
  const suppliedToken = bearerToken(context.req.raw)
  if (expectedToken && suppliedToken === expectedToken) {
    context.set('scraperAdminAuthMethod', 'token')
    await next()
    return
  }

  const user = await validateSessionToken(getConfig(context, 'DATABASE_URL'), readSessionToken(context))
  if (!user) return context.json({ error: 'unauthorized' }, 401)
  context.set('scraperAdminUser', user)
  context.set('scraperAdminAuthMethod', 'session')

  if (!['GET', 'HEAD', 'OPTIONS'].includes(context.req.method)) {
    if (!isJsonRequest(context.req.raw)) return context.json({ error: 'content type must be application/json' }, 415)
    if (!isSameOriginBrowserRequest(context.req.raw)) return context.json({ error: 'forbidden' }, 403)
  }

  await next()
}

export const noStore: MiddlewareHandler = async (context, next) => {
  await next()
  context.header('Cache-Control', 'no-store')
}

export const login = async (context: Context<ScraperAdminEnv>) => {
  if (!isJsonRequest(context.req.raw)) return context.json({ error: 'content type must be application/json' }, 415)
  if (!isSameOriginBrowserRequest(context.req.raw)) return context.json({ error: 'forbidden' }, 403)

  const ip = context.req.header('CF-Connecting-IP') ?? 'unknown'
  const limiter = context.env?.SCRAPER_LOGIN_LIMITER
  if (limiter && !(await limiter.limit({ key: ip })).success) {
    context.header('Retry-After', '60')
    return context.json({ error: 'too many login attempts' }, 429)
  }

  const body = await context.req.json().catch(() => undefined)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return context.json({ error: 'invalid request' }, 400)
  const input = body as Record<string, unknown>
  const username = typeof input.username === 'string' ? input.username.trim().toLowerCase() : ''
  const password = typeof input.password === 'string' ? input.password : ''
  const passwordBytes = encoder.encode(password).byteLength
  if (!USERNAME_PATTERN.test(username) || password.includes('\0') || passwordBytes < 16 || passwordBytes > 72) {
    return context.json({ error: 'invalid username or password' }, 401)
  }

  const databaseUrl = getConfig(context, 'DATABASE_URL')
  if (!databaseUrl) return context.json({ error: 'admin login is unavailable' }, 503)
  const token = newSessionToken()
  const tokenHash = await sessionTokenHash(token)

  try {
    const rows = (await database(databaseUrl).query(
      `WITH candidate AS MATERIALIZED (
         SELECT id, username, enabled,
           COALESCE(locked_until > now(), false) AS locked,
           CASE
             WHEN enabled AND (locked_until IS NULL OR locked_until <= now())
               THEN password_hash = crypt($2, password_hash)
             ELSE false
           END AS password_ok
         FROM scraper_admin_users
         WHERE username = $1
         FOR UPDATE
       ), updated AS (
         UPDATE scraper_admin_users users
         SET failed_login_attempts = CASE
               WHEN candidate.password_ok THEN 0
               WHEN candidate.enabled AND NOT candidate.locked
                    AND users.failed_login_attempts + 1 >= 5 THEN 0
               WHEN candidate.enabled AND NOT candidate.locked
                    THEN users.failed_login_attempts + 1
               ELSE users.failed_login_attempts
             END,
             locked_until = CASE
               WHEN candidate.password_ok THEN NULL
               WHEN candidate.enabled AND NOT candidate.locked
                    AND users.failed_login_attempts + 1 >= 5 THEN now() + interval '15 minutes'
               WHEN candidate.enabled AND NOT candidate.locked THEN NULL
               ELSE users.locked_until
             END
         FROM candidate
         WHERE users.id = candidate.id
         RETURNING users.id, users.username, candidate.enabled, candidate.locked, candidate.password_ok
       ), created_session AS (
         INSERT INTO scraper_admin_sessions (token_hash, user_id, expires_at)
         SELECT $3, id, now() + interval '8 hours'
         FROM updated
         WHERE enabled AND NOT locked AND password_ok
         RETURNING user_id
       )
       SELECT updated.id, updated.username, (created_session.user_id IS NOT NULL) AS authenticated
       FROM updated LEFT JOIN created_session ON created_session.user_id = updated.id`,
      [username, password, tokenHash]
    )) as LoginRow[]
    const authenticated = rows[0]
    if (!authenticated?.authenticated) return context.json({ error: 'invalid username or password' }, 401)
    setSessionCookie(context, token)
    return context.json({ user: { id: authenticated.id, username: authenticated.username } })
  } catch (error) {
    console.error('Scraper admin login failed:', error instanceof Error ? error.message : 'unknown error')
    return context.json({ error: 'admin login is unavailable' }, 503)
  }
}

export const session = async (context: Context<ScraperAdminEnv>) => {
  const user = await validateSessionToken(getConfig(context, 'DATABASE_URL'), readSessionToken(context))
  return user ? context.json({ user }) : context.json({ error: 'unauthorized' }, 401)
}

export const logout = async (context: Context<ScraperAdminEnv>) => {
  if (!isJsonRequest(context.req.raw)) return context.json({ error: 'content type must be application/json' }, 415)
  if (!isSameOriginBrowserRequest(context.req.raw)) return context.json({ error: 'forbidden' }, 403)

  const token = readSessionToken(context)
  const databaseUrl = getConfig(context, 'DATABASE_URL')
  if (token && databaseUrl) {
    try {
      await database(databaseUrl).query('DELETE FROM scraper_admin_sessions WHERE token_hash = $1', [
        await sessionTokenHash(token)
      ])
    } catch (error) {
      console.error('Scraper admin logout failed:', error instanceof Error ? error.message : 'unknown error')
      return context.json({ error: 'could not revoke the session' }, 503)
    }
  }
  clearSessionCookie(context)
  return context.json({ success: true })
}
