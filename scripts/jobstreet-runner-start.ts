import { chmod, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RUNNER_ROLE = 'kotak_jobstreet_runner'
const repoRoot = fileURLToPath(new URL('../', import.meta.url))
const configPath = resolve(repoRoot, '.local/jobstreet-runner.json')
const runnerPath = resolve(repoRoot, 'apps/api/src/scrapers/jobstreet/runner.ts')
const profileRoot = resolve(repoRoot, '.local/browser-profiles')
const dataRoot = resolve(repoRoot, 'data/jobstreet/production')

if (Bun.argv.length > 2) throw new Error('scraper:worker does not accept command arguments.')

let parsed: unknown
try {
  parsed = JSON.parse(await readFile(configPath, 'utf8'))
  await chmod(configPath, 0o600)
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
    throw new Error('Runner credentials are missing. Run bun run scraper:setup with the owner DATABASE_URL first.')
  throw new Error('The private JobStreet runner config could not be read.')
}
if (
  !parsed ||
  typeof parsed !== 'object' ||
  Array.isArray(parsed) ||
  typeof (parsed as { databaseUrl?: unknown }).databaseUrl !== 'string'
)
  throw new Error('The private JobStreet runner config must contain databaseUrl.')
const databaseUrl = (parsed as { databaseUrl: string }).databaseUrl
let runnerUrl: URL
try {
  runnerUrl = new URL(databaseUrl)
} catch {
  throw new Error('The private JobStreet runner config contains an invalid database URL.')
}
if (
  !['postgres:', 'postgresql:'].includes(runnerUrl.protocol) ||
  decodeURIComponent(runnerUrl.username) !== RUNNER_ROLE ||
  !/^[A-Za-z0-9_-]{43}$/.test(decodeURIComponent(runnerUrl.password)) ||
  !runnerUrl.host ||
  !runnerUrl.pathname.slice(1)
)
  throw new Error('The private JobStreet runner config is not scoped to the expected database role.')

const inheritedNames = [
  'ALLUSERSPROFILE',
  'APPDATA',
  'COMMONPROGRAMFILES',
  'COMMONPROGRAMFILES(X86)',
  'COMMONPROGRAMW6432',
  'COMSPEC',
  'HOMEDRIVE',
  'HOMEPATH',
  'LOCALAPPDATA',
  'NUMBER_OF_PROCESSORS',
  'OS',
  'PATH',
  'PATHEXT',
  'PROCESSOR_ARCHITECTURE',
  'PROCESSOR_IDENTIFIER',
  'PROCESSOR_LEVEL',
  'PROCESSOR_REVISION',
  'PROGRAMDATA',
  'PROGRAMFILES',
  'PROGRAMFILES(X86)',
  'PROGRAMW6432',
  'PUBLIC',
  'SYSTEMDRIVE',
  'SYSTEMROOT',
  'TEMP',
  'TMP',
  'USERDOMAIN',
  'USERDOMAIN_ROAMINGPROFILE',
  'USERNAME',
  'USERPROFILE',
  'WINDIR',
  'HOME',
  'DISPLAY',
  'WAYLAND_DISPLAY',
  'XAUTHORITY',
  'XDG_CACHE_HOME',
  'XDG_CONFIG_HOME',
  'XDG_DATA_HOME',
  'XDG_RUNTIME_DIR',
  'DBUS_SESSION_BUS_ADDRESS',
  'LANG',
  'LANGUAGE',
  'LC_ALL',
  'LC_CTYPE',
  'TZ',
  'SSL_CERT_FILE',
  'SSL_CERT_DIR',
  'NODE_EXTRA_CA_CERTS',
  'CLEARCOTE_CACHE'
] as const

const childEnv: Record<string, string> = {}
for (const name of inheritedNames) {
  const value = Bun.env[name]
  if (value) childEnv[name] = value
}

const profileId = Bun.env.BROWSER_PROFILE_ID?.trim()
if (profileId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(profileId))
  throw new Error('BROWSER_PROFILE_ID must be a UUID.')
if (profileId) childEnv.BROWSER_PROFILE_ID = profileId

const headless = Bun.env.BROWSER_HEADLESS?.trim()
if (headless && !['true', 'false'].includes(headless)) throw new Error('BROWSER_HEADLESS must be true or false.')
if (headless) childEnv.BROWSER_HEADLESS = headless

function addIntegerSetting(
  name: 'JOBSTREET_DELAY_MS' | 'JOBSTREET_DELAY_JITTER_MS' | 'JOBSTREET_MAX_PAGES' | 'JOBSTREET_MAX_DEPTH_JOBS',
  minimum: number,
  maximum: number
) {
  const value = Bun.env[name]?.trim()
  if (!value) return
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum)
    throw new Error(`${name} must be an integer from ${minimum} to ${maximum}.`)
  childEnv[name] = String(number)
}

addIntegerSetting('JOBSTREET_DELAY_MS', 2_000, 3_600_000)
addIntegerSetting('JOBSTREET_DELAY_JITTER_MS', 0, 60_000)
// The pipeline's own limit is 200 search pages.
addIntegerSetting('JOBSTREET_MAX_PAGES', 1, 200)
addIntegerSetting('JOBSTREET_MAX_DEPTH_JOBS', 1, 1000)
childEnv.BROWSER_PROFILE_ROOT = profileRoot
childEnv.JOBSTREET_DATA_DIR = dataRoot
childEnv.JOBSTREET_RUNNER_DATABASE_URL = databaseUrl

const child = Bun.spawn([process.execPath, '--no-env-file', runnerPath], {
  cwd: repoRoot,
  env: childEnv,
  stdout: 'inherit',
  stderr: 'inherit'
})

const forward = (signal: NodeJS.Signals) => {
  if (child.exitCode === null) child.kill(signal)
}
const onInterrupt = () => forward('SIGINT')
const onTerminate = () => forward('SIGTERM')
process.on('SIGINT', onInterrupt)
process.on('SIGTERM', onTerminate)

const exitCode = await child.exited
process.off('SIGINT', onInterrupt)
process.off('SIGTERM', onTerminate)
process.exitCode = exitCode
