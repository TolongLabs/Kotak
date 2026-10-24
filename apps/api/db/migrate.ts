import { neon } from '@neondatabase/serverless'
import { readMigrations } from './read-migrations'

const databaseUrl = Bun.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('Set DATABASE_URL to the Neon connection URL first.')
  process.exit(1)
}

const migrations = await readMigrations()
const statements = migrations.flatMap((migration) => migration.statements)

const sql = neon(databaseUrl)
await sql.transaction(statements.map((statement) => sql.query(statement)))
console.info(`Applied ${migrations.length} migration file(s).`)
