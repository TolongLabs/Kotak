// A throwaway Postgres for tests: PGlite (https://pglite.dev), Postgres compiled to WebAssembly, in memory. It is built
// by the repo's own migrations, and the Neon driver can be routed to it in process, so the real queries run unchanged.
// Test-only: the app never imports this file, and nothing here opens a network connection.
import { PGlite, type Transaction } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { neonConfig } from '@neondatabase/serverless'
import { readMigrations } from './read-migrations'

// DATABASE_URL while the driver is routed to PGlite. Its host is never contacted.
export const TEST_DATABASE_URL = 'postgresql://kotak:test@pglite.invalid/kotak'

// Every migration, applied as migrate.ts applies them: all statements in one transaction. Twice, as every deploy
// reruns them.
export async function migratedDatabase() {
  const db = await PGlite.create({ extensions: { pgcrypto } })
  const statements = (await readMigrations()).flatMap((migration) => migration.statements)
  for (let pass = 0; pass < 2; pass++)
    await db.transaction(async (transaction) => {
      for (const statement of statements) await transaction.query(statement)
    })
  return db
}

type NeonQuery = { query: string; params: unknown[] }

// Answers the Neon driver's SQL-over-HTTP requests from db, in Neon's format (neonConfig.fetchFunction,
// https://github.com/neondatabase/serverless/blob/main/CONFIG.md): every value as text, which the driver parses by
// type as it parses Neon's answers, a batch as one transaction, and an error as Neon's 400 answer. One PGlite
// connection serves every request, so a SET lasts until it is reset. Returns a function that puts the driver back.
export function routeNeonTo(db: PGlite) {
  const previous = neonConfig.fetchFunction
  const asText = Object.fromEntries(Object.keys(db.parsers).map((oid) => [oid, (value: string) => value]))
  const run = async (executor: PGlite | Transaction, { query, params }: NeonQuery) => {
    const result = await executor.query<unknown[]>(query, params, { rowMode: 'array', parsers: asText })
    return { fields: result.fields.map(({ name, dataTypeID }) => ({ name, dataTypeID })), rows: result.rows }
  }
  neonConfig.fetchFunction = async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as NeonQuery | { queries: NeonQuery[] }
    try {
      if (!('queries' in body)) return Response.json(await run(db, body))
      const results = await db.transaction(async (transaction) => {
        const answers = []
        for (const query of body.queries) answers.push(await run(transaction, query))
        return answers
      })
      return Response.json({ results })
    } catch (error) {
      const { message, code, constraint, detail } = error as Record<string, unknown>
      return Response.json({ message: message ?? String(error), code, constraint, detail }, { status: 400 })
    }
  }
  return () => {
    neonConfig.fetchFunction = previous
  }
}
