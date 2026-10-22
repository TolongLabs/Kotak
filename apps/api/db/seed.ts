// Bun script, not part of the Worker: creates the national view table if it is missing, then replaces the
// labelled sample rows. Real check-ups are never touched.
// Run with DATABASE_URL set to Neon's pooled connection URL: bun run db:seed
import { neon } from '@neondatabase/serverless'
import { SAMPLE_ROLES, sampleCheckups } from './sample-checkups'

const databaseUrl = Bun.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('Set DATABASE_URL to the Neon connection URL first.')
  process.exit(1)
}

const migrationFiles = [...new Bun.Glob('migrations/*.sql').scanSync({ cwd: import.meta.dir, absolute: true })].sort()
// The HTTP driver runs one statement per query: drop comment lines, then split at semicolons that end a line.
const statements = (await Promise.all(migrationFiles.map((file) => Bun.file(file).text())))
  .flatMap((text) => text.replace(/^\s*--.*$/gm, '').split(/;\s*$/m))
  .map((statement) => statement.trim())
  .filter(Boolean)

const sql = neon(databaseUrl)
const rows = sampleCheckups()

await sql.transaction([
  ...statements.map((statement) => sql.query(statement)),
  sql.query('DELETE FROM national_checkups WHERE is_sample'),
  sql.query(
    `INSERT INTO national_checkups (onet_role_code, corner_levels, is_sample)
     SELECT onet_role_code, corner_levels, true
     FROM jsonb_to_recordset($1::jsonb) AS sample(onet_role_code text, corner_levels jsonb)`,
    [JSON.stringify(rows)]
  )
])

console.info(`Applied ${migrationFiles.length} migration file(s); seeded ${rows.length} sample rows for:`)
console.info(SAMPLE_ROLES.map((role) => role.onet_role_code).join(', '))
