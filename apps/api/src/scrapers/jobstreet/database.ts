import { neon } from '@neondatabase/serverless'

export function jobstreetDatabase(databaseUrl: string) {
  if (!databaseUrl.trim()) throw new Error('DATABASE_URL is required')
  const sql = neon(databaseUrl)
  const query = sql.query
  sql.query = (text, params, options) =>
    query(text, params, {
      ...options,
      fetchOptions: { ...options?.fetchOptions, signal: options?.fetchOptions?.signal ?? AbortSignal.timeout(30_000) }
    })
  return sql
}
