import { neon } from '@neondatabase/serverless'

const databaseUrl = Bun.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('Set DATABASE_URL to the Neon connection URL first.')
  process.exit(1)
}

const migrationFiles = [...new Bun.Glob('migrations/*.sql').scanSync({ cwd: import.meta.dir, absolute: true })].sort()
const statements = (await Promise.all(migrationFiles.map((file) => Bun.file(file).text())))
  .flatMap((text) => text.replace(/^\s*--.*$/gm, '').split(/;\s*$/m))
  .map((statement) => statement.trim())
  .filter(Boolean)

const sql = neon(databaseUrl)
await sql.transaction(statements.map((statement) => sql.query(statement)))
console.info(`Applied ${migrationFiles.length} migration file(s).`)
