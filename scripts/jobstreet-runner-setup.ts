import { randomBytes } from 'node:crypto'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { jobstreetDatabase } from '../apps/api/src/scrapers/jobstreet/database'

const RUNNER_ROLE = 'kotak_jobstreet_runner'
const repoRoot = fileURLToPath(new URL('../', import.meta.url))
const configPath = resolve(repoRoot, '.local/jobstreet-runner.json')

type RunnerConfig = { databaseUrl: string }
type RoleRow = {
  rolcanlogin: boolean
  rolsuper: boolean
  rolcreatedb: boolean
  rolcreaterole: boolean
  rolreplication: boolean
  rolbypassrls: boolean
  rolinherit: boolean
}

function connectionIdentity(value: string, label: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${label} is not a valid PostgreSQL URL.`)
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.host || !url.pathname.slice(1))
    throw new Error(`${label} is not a valid PostgreSQL URL.`)
  return {
    url,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.host.toLowerCase(),
    database: decodeURIComponent(url.pathname.slice(1))
  }
}

function parseConfig(contents: string): RunnerConfig {
  let parsed: unknown
  try {
    parsed = JSON.parse(contents)
  } catch {
    throw new Error('The private runner config is not valid JSON.')
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    typeof (parsed as RunnerConfig).databaseUrl !== 'string'
  )
    throw new Error('The private runner config must contain databaseUrl.')
  return { databaseUrl: (parsed as RunnerConfig).databaseUrl }
}

async function readConfig(): Promise<RunnerConfig | undefined> {
  try {
    const config = parseConfig(await readFile(configPath, 'utf8'))
    await chmod(configPath, 0o600)
    return config
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return undefined
    throw error
  }
}

const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`

function validateRole(role: RoleRow, memberships: Array<{ role_name: string }>) {
  if (
    !role.rolcanlogin ||
    role.rolsuper ||
    role.rolcreatedb ||
    role.rolcreaterole ||
    role.rolreplication ||
    role.rolbypassrls ||
    role.rolinherit ||
    memberships.length
  ) {
    throw new Error('The existing runner role has unsafe attributes or memberships; refusing to use it.')
  }
}

const ownerDatabaseUrl = Bun.env.DATABASE_URL?.trim()
if (!ownerDatabaseUrl) throw new Error('Set DATABASE_URL to the owner connection URL for one-time provisioning.')
const owner = connectionIdentity(ownerDatabaseUrl, 'DATABASE_URL')
if (owner.username === RUNNER_ROLE) throw new Error('DATABASE_URL must use the database owner, not the runner role.')

const sql = jobstreetDatabase(ownerDatabaseUrl)
const databaseRows = (await sql.query('SELECT current_database() AS database_name')) as Array<{ database_name: string }>
const currentDatabase = databaseRows[0]?.database_name
if (!currentDatabase || currentDatabase !== owner.database)
  throw new Error('DATABASE_URL did not connect to the database named in its URL.')

const roleRows = (await sql.query(
  `SELECT rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls, rolinherit
   FROM pg_roles WHERE rolname = $1`,
  [RUNNER_ROLE]
)) as RoleRow[]
const membershipRows = (await sql.query(
  `SELECT parent.rolname AS role_name
   FROM pg_auth_members membership
   JOIN pg_roles member ON member.oid = membership.member
   JOIN pg_roles parent ON parent.oid = membership.roleid
   WHERE member.rolname = $1`,
  [RUNNER_ROLE]
)) as Array<{ role_name: string }>

const savedConfig = await readConfig()
let runnerDatabaseUrl: string
if (savedConfig) {
  const saved = connectionIdentity(savedConfig.databaseUrl, 'The private runner database URL')
  if (saved.host !== owner.host || saved.database !== owner.database || saved.username !== RUNNER_ROLE)
    throw new Error('The private runner config does not match this host, database and runner role.')
  if (!/^[A-Za-z0-9_-]{43}$/.test(saved.password))
    throw new Error('The private runner config does not contain the generated runner password.')
  runnerDatabaseUrl = savedConfig.databaseUrl
} else {
  if (roleRows[0]) {
    validateRole(roleRows[0], membershipRows)
    throw new Error(
      'The runner role already exists but its private config is missing; refusing to rotate its password.'
    )
  }
  const password = randomBytes(32).toString('base64url')
  const runnerUrl = new URL(owner.url)
  runnerUrl.username = RUNNER_ROLE
  runnerUrl.password = password
  runnerDatabaseUrl = runnerUrl.toString()
  await mkdir(dirname(configPath), { recursive: true })
  await writeFile(configPath, `${JSON.stringify({ databaseUrl: runnerDatabaseUrl }, null, 2)}\n`, {
    flag: 'wx',
    mode: 0o600
  })
}

if (roleRows[0]) {
  validateRole(roleRows[0], membershipRows)
} else {
  const password = connectionIdentity(runnerDatabaseUrl, 'The private runner database URL').password
  await sql.query(
    `CREATE ROLE ${quoteIdentifier(RUNNER_ROLE)}
     WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT
     PASSWORD '${password}'`
  )
}

const sequenceRows = (await sql.query(
  `SELECT namespace.nspname AS schema_name, sequence.relname AS sequence_name
   FROM pg_class sequence
   JOIN pg_namespace namespace ON namespace.oid = sequence.relnamespace
   WHERE sequence.oid IN (
     pg_get_serial_sequence('public.jobstreet_observations', 'id')::regclass,
     pg_get_serial_sequence('public.jobstreet_detail_attempts', 'id')::regclass
   )
   ORDER BY namespace.nspname, sequence.relname`
)) as Array<{ schema_name: string; sequence_name: string }>
if (sequenceRows.length !== 2)
  throw new Error('Expected exactly two JobStreet identity sequences after database migrations.')
const sequences = sequenceRows
  .map((row) => `${quoteIdentifier(row.schema_name)}.${quoteIdentifier(row.sequence_name)}`)
  .join(', ')
const role = quoteIdentifier(RUNNER_ROLE)
const database = quoteIdentifier(currentDatabase)

await sql.transaction([
  sql.query(`GRANT CONNECT ON DATABASE ${database} TO ${role}`),
  sql.query(`GRANT USAGE ON SCHEMA public TO ${role}`),
  sql.query(`GRANT SELECT ON TABLE public.jobstreet_careers TO ${role}`),
  sql.query(
    `GRANT SELECT, INSERT, UPDATE ON TABLE
       public.jobstreet_scrape_runs,
       public.jobstreet_listings,
       public.jobstreet_observations,
       public.jobstreet_detail_attempts
     TO ${role}`
  ),
  sql.query(`GRANT USAGE, SELECT ON SEQUENCE ${sequences} TO ${role}`)
])

console.info(`JobStreet runner role is ready. Restricted credentials are saved privately to ${configPath}.`)
