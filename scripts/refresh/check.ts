// Checks the upstream feeds behind the snapshots (#90). Lists the Anthropic Economic Index release folders on the
// Hugging Face Hub and reports any newer than the pinned one, without re-pinning, then runs the DOSM Job Market
// Insights, OpenDOSM and Epoch AI ingest scripts if package.json has them. Writes .cache/refresh/result.json
// (machine-readable) and .cache/refresh/summary.md (the refresh pull request body), and exits non-zero if a feed or
// script failed.
// Run with `bun run refresh:check`; the Refresh data workflow runs it weekly.
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { AeiSnapshotSchema } from '../../packages/shared/src/data/aei'
import { SnapshotIdSchema } from '../../packages/shared/src/engine'

const ROOT = join(import.meta.dir, '../..')
const OUT_DIR = join(ROOT, '.cache/refresh')
const HUB = 'https://huggingface.co'
const REPO = 'Anthropic/EconomicIndex'
const RELEASE_FOLDER = /^release_\d{4}_\d{2}_\d{2}$/
const REQUEST_TIMEOUT_MS = 30_000
const REQUEST_ATTEMPTS = 3
const INGEST_TIMEOUT_MS = 20 * 60_000
// The scripts for #63 and #66 should be registered in package.json under these names. The DOSM Job Market Insights
// script needs pdftotext (poppler-utils) and unzip on PATH.
const INGESTS = [
  { source: 'DOSM Job Market Insights', issue: 52, script: 'ingest:dosm-jmi' },
  { source: 'OpenDOSM', issue: 63, script: 'ingest:opendosm' },
  { source: 'Epoch AI', issue: 66, script: 'ingest:epoch' }
]

type Pin = { release: string; revision: string; path: string }
type EconomicIndex = {
  repo: string
  pinned: Pin
  hub_revision: string | null
  releases: string[]
  new_releases: { release: string; url: string; files: { path: string; size: number }[] }[]
  error: string | null
}
type Ingest = (typeof INGESTS)[number] & {
  status: 'missing' | 'passed' | 'failed'
  exit_code: number | null
  seconds: number | null
}
type Result = { checked_at: string; economic_index: EconomicIndex; ingest: Ingest[]; files_changed: string[] }

// Anonymous Hub API calls share 500 requests per 5-minute window per IP (https://huggingface.co/docs/hub/rate-limits),
// and a check makes two plus one per new release. On HTTP 429 this waits for the reset the RateLimit header gives
// (`"api";r=0;t=<seconds>`); on a timeout, a network error or a 5xx it backs off 2 s, then 4 s.
async function hubGet(url: string): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    let response: Response | undefined
    let failure: string
    try {
      response = await fetch(url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      })
      if (response.ok) return response
      failure = `HTTP ${response.status}`
    } catch (error) {
      failure = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    }
    const retryable = !response || response.status === 429 || response.status >= 500
    if (!retryable || attempt === REQUEST_ATTEMPTS) {
      const body = response ? `: ${(await response.text()).slice(0, 200)}` : ''
      throw new Error(`${failure} from ${url}${body}`)
    }
    const reset = /t=(\d+)/.exec(response?.headers.get('ratelimit') ?? '')?.[1]
    const seconds = response?.status === 429 ? Number(reset ?? 60) : 2 ** attempt
    await response?.body?.cancel()
    console.warn(`${failure} from ${url}, retrying in ${seconds} s`)
    await Bun.sleep(seconds * 1000)
  }
}

// Lists a folder at a revision. The tree endpoint pages with a `Link: <url>; rel="next"` header.
async function hubTree(revision: string, folder?: string) {
  const entries: { type: string; path: string; size: number }[] = []
  let next: string | undefined = folder
    ? `${HUB}/api/datasets/${REPO}/tree/${revision}/${folder}?recursive=true`
    : `${HUB}/api/datasets/${REPO}/tree/${revision}`
  while (next) {
    const response = await hubGet(next)
    const page = await response.json()
    if (!Array.isArray(page)) throw new Error(`Unexpected tree listing from ${next}`)
    entries.push(...page)
    next = /<([^>]+)>;\s*rel="next"/.exec(response.headers.get('link') ?? '')?.[1]
  }
  return entries
}

// The pin is what the committed snapshots record: the newest release any of them was filtered from.
async function readPin(): Promise<Pin> {
  const pins = await Promise.all(
    SnapshotIdSchema.options.map(async (id) => {
      const file = await Bun.file(join(ROOT, `data/snapshots/aei/${id}.json`)).json()
      const { revision, path } = AeiSnapshotSchema.shape.release.parse(file.release)
      return { release: path.split('/')[0], revision, path }
    })
  )
  return pins.reduce((newest, pin) => (pin.release > newest.release ? pin : newest))
}

async function checkEconomicIndex(pinned: Pin): Promise<EconomicIndex> {
  const result: EconomicIndex = { repo: REPO, pinned, hub_revision: null, releases: [], new_releases: [], error: null }
  try {
    const refs = await (await hubGet(`${HUB}/api/datasets/${REPO}/refs`)).json()
    const main = refs?.branches?.find((branch: { name?: string }) => branch.name === 'main')?.targetCommit
    if (typeof main !== 'string' || !/^[0-9a-f]{40}$/.test(main)) throw new Error('No main branch in the Hub refs')
    result.hub_revision = main
    // Release folders are named by date, so string order is date order.
    result.releases = (await hubTree(main))
      .filter((entry) => entry.type === 'directory' && RELEASE_FOLDER.test(entry.path))
      .map((entry) => entry.path)
      .sort()
    for (const release of result.releases.filter((release) => release > pinned.release)) {
      const files = (await hubTree(main, release))
        .filter((entry) => entry.type === 'file')
        .map(({ path, size }) => ({ path, size }))
      result.new_releases.push({ release, url: `${HUB}/datasets/${REPO}/tree/${main}/${release}`, files })
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error)
  }
  return result
}

async function runIngest(entry: (typeof INGESTS)[number], scripts: Record<string, string>): Promise<Ingest> {
  if (!scripts[entry.script]) {
    console.log(`Skipping ${entry.source}: package.json has no ${entry.script} script yet (#${entry.issue})`)
    return { ...entry, status: 'missing', exit_code: null, seconds: null }
  }
  console.log(`Running bun run ${entry.script}`)
  const started = performance.now()
  const proc = Bun.spawn([process.execPath, 'run', entry.script], {
    cwd: ROOT,
    stdout: 'inherit',
    stderr: 'inherit',
    timeout: INGEST_TIMEOUT_MS
  })
  const exitCode = await proc.exited
  const seconds = Math.round((performance.now() - started) / 1000)
  if (proc.signalCode) console.error(`${entry.script} was stopped by ${proc.signalCode} after ${seconds} s`)
  return { ...entry, status: exitCode === 0 ? 'passed' : 'failed', exit_code: exitCode, seconds }
}

// Files under data/ that differ from the checked-out commit, including new ones.
function changedDataFiles(): string[] {
  const git = Bun.spawnSync(['git', 'status', '--porcelain', '--untracked-files=all', '--', 'data'], { cwd: ROOT })
  if (!git.success) throw new Error(`git status failed: ${git.stderr.toString()}`)
  return git.stdout
    .toString()
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3))
}

function summarize(result: Result): string {
  const aei = result.economic_index
  const short = (sha: string) => `\`${sha.slice(0, 7)}\``
  const size = (bytes: number) =>
    bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
  const lines = [
    '## Upstream data refresh',
    '',
    `Checked at ${result.checked_at} by \`bun run refresh:check\` (#90).`,
    '',
    '### Anthropic Economic Index',
    '',
    `Pinned: \`${aei.pinned.release}\` at Hub revision ${short(aei.pinned.revision)}, as recorded in \`data/snapshots/aei/\`.`,
    ''
  ]
  if (aei.error) {
    lines.push(`Could not check the Hugging Face Hub: ${aei.error}`, '')
  } else if (aei.new_releases.length === 0) {
    const latest = aei.releases.at(-1) ?? 'none'
    lines.push(
      `No newer release. Hub \`main\` is at ${short(aei.hub_revision!)}, and its latest release is \`${latest}\`.`,
      ''
    )
  } else {
    for (const release of aei.new_releases) {
      lines.push(`New release [\`${release.release}\`](${release.url}):`, '')
      for (const file of release.files) lines.push(`- \`${file.path}\` (${size(file.size)})`)
      lines.push('')
    }
    const ids = SnapshotIdSchema.options.map((id) => `\`${id}\``).join(', ')
    lines.push(
      `This check does not re-pin the Economic Index. The snapshot IDs are a fixed enum (${ids}), so a person adopts a new release:`,
      '',
      '1.  Read `data_documentation.md` in the release folder and check its CSV columns against `scripts/ingest/aei.ts`.',
      `1.  In \`scripts/ingest/aei.ts\`, set \`REVISION\` to \`${aei.hub_revision}\` and point \`FILE\`, \`RELEASE_DATE\` and \`SOURCE_NAME\` at the new release.`,
      '1.  Decide which months the app shows and add them to `SnapshotIdSchema` in `packages/shared/src/engine.ts`. This changes the snapshot switch and the What changed diff.',
      '1.  Run `bun run ingest:aei`, `bun run build:data` and `bun run refresh:validate`, then open a pull request.',
      ''
    )
  }
  const outcome = (ingest: Ingest) =>
    ingest.status === 'missing'
      ? 'Script not added yet, skipped'
      : ingest.status === 'passed'
        ? `Passed in ${ingest.seconds} s`
        : `Failed with exit code ${ingest.exit_code} after ${ingest.seconds} s`
  lines.push('### Ingest scripts', '', '| Source | Script | Result |', '| --- | --- | --- |')
  for (const ingest of result.ingest) {
    lines.push(`| ${ingest.source} (#${ingest.issue}) | \`bun run ${ingest.script}\` | ${outcome(ingest)} |`)
  }
  lines.push('', '### Data files changed by the ingest scripts', '')
  if (result.files_changed.length === 0) lines.push('None.')
  for (const path of result.files_changed) lines.push(`- \`${path}\``)
  return `${lines.join('\n')}\n`
}

const checkedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
const economicIndex = await checkEconomicIndex(await readPin())
if (economicIndex.error) console.error(`Economic Index check failed: ${economicIndex.error}`)
for (const { release } of economicIndex.new_releases) {
  console.log(`New Economic Index release on the Hub: ${release}`)
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log(
      `::warning title=New Economic Index release::${release} needs a person to adopt it; see the run summary`
    )
  }
}

const { scripts } = await Bun.file(join(ROOT, 'package.json')).json()
const ingest: Ingest[] = []
for (const entry of INGESTS) ingest.push(await runIngest(entry, scripts))

const result: Result = {
  checked_at: checkedAt,
  economic_index: economicIndex,
  ingest,
  files_changed: changedDataFiles()
}
const summary = summarize(result)
await mkdir(OUT_DIR, { recursive: true })
await Bun.write(join(OUT_DIR, 'result.json'), `${JSON.stringify(result, null, 2)}\n`)
await Bun.write(join(OUT_DIR, 'summary.md'), summary)
console.log(`\n${summary}\nWrote .cache/refresh/result.json and .cache/refresh/summary.md`)
if (economicIndex.error || ingest.some((entry) => entry.status === 'failed')) process.exit(1)
