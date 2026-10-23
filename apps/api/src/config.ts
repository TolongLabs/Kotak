import type { Context } from 'hono'
import { env } from 'hono/adapter'

export type ConfigName = 'ANTHROPIC_API_KEY' | 'ELEVENLABS_API_KEY' | 'ELEVENLABS_VOICE_ID' | 'DATABASE_URL'

// Reads a server-side setting: Worker bindings and secrets on Cloudflare, process env on Bun and Replit.
// Unset and blank values both come back undefined.
export const getConfig = (context: Context, name: ConfigName): string | undefined => {
  const value = env<Partial<Record<ConfigName, unknown>>>(context)?.[name]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
