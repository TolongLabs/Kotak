import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scrapeJobstreet } from './pipeline'
import { scrapeJobstreetDepth } from './depth'
import { parseSort } from './records'

try {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      mode: { type: 'string', default: 'breadth' },
      input: { type: 'string', multiple: true },
      'previous-depth': { type: 'string', multiple: true },
      'refresh-after-hours': { type: 'string' },
      url: { type: 'string' },
      output: { type: 'string' },
      'max-pages': { type: 'string' },
      'max-jobs': { type: 'string' },
      'delay-ms': { type: 'string', default: '10000' },
      'delay-jitter-ms': { type: 'string', default: '2000' },
      retries: { type: 'string', default: '2' },
      'verification-timeout-ms': { type: 'string', default: '120000' },
      sort: { type: 'string' },
      help: { type: 'boolean', short: 'h' }
    },
    strict: true,
    allowPositionals: false
  })
  if (values.help) {
    console.info(`Usage: bun run scrape:jobstreet [options]
  --mode MODE      breadth (default) discovers listings; depth enriches saved listings
  --input PATH     Depth: breadth jobs.jsonl or observations.jsonl; repeat for multiple files
  --previous-depth PATH  Depth: additional details.jsonl or jobs.enriched.jsonl; local depth runs are discovered automatically
  --refresh-after-hours N  Depth: optional refresh interval; 0 forces refresh (default: never refresh cached descriptions)
  --url URL        Breadth: Malaysian JobStreet search URL (default software-engineer-jobs)
  --max-pages N    Breadth: maximum search pages (1–50, default 1)
  --max-jobs N     Maximum unique jobs (1–1000; default 20 breadth, 100 depth)
  --delay-ms N     Base delay between pages/jobs (minimum 2000, default 10000)
  --delay-jitter-ms N  Extra random delay (0–60000, default 2000)
  --retries N      Transient navigation retries (0–3, default 2)
  --verification-timeout-ms N  Wait for verification (0–600000, default 120000); complete any checkbox in the Kameleo window
  --sort MODE      Breadth view: newest, title, company, location, job-id, scraped-at
  --output PATH    New directory (default data/jobstreet/[depth/]<timestamp>-<suffix>)
  KAMELEO_ENDPOINT defaults to http://localhost:5050`)
  } else {
    // Stable relative to the repo, even when invoked from apps/api.
    const root = fileURLToPath(new URL('../../../../../', import.meta.url))
    const mode = values.mode
    if (mode !== 'breadth' && mode !== 'depth') throw new Error('--mode must be breadth or depth')
    if (mode === 'breadth' && values.input?.length) throw new Error('--input is for depth mode; breadth uses --url')
    if (mode === 'breadth' && (values['previous-depth']?.length || values['refresh-after-hours'] !== undefined))
      throw new Error('--previous-depth and --refresh-after-hours are depth-only options')
    if (mode === 'depth' && (values.url || values['max-pages'] || values.sort))
      throw new Error('--url, --max-pages and --sort are breadth-only options')
    const common = {
      endpoint: Bun.env.KAMELEO_ENDPOINT || 'http://localhost:5050',
      output:
        values.output ||
        resolve(
          root,
          'data/jobstreet',
          mode === 'depth' ? 'depth' : '',
          `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID().slice(0, 8)}`
        ),
      maxJobs: Number(values['max-jobs'] ?? (mode === 'depth' ? '100' : '20')),
      delayMs: Number(values['delay-ms']),
      delayJitterMs: Number(values['delay-jitter-ms']),
      maxRetries: Number(values.retries),
      verificationTimeoutMs: Number(values['verification-timeout-ms'])
    }
    if (mode === 'depth') {
      const report = await scrapeJobstreetDepth({
        ...common,
        inputs: values.input ?? [],
        previousDetails: values['previous-depth'],
        refreshAfterHours:
          values['refresh-after-hours'] === undefined ? undefined : Number(values['refresh-after-hours'])
      })
      if (report.status !== 'success') process.exitCode = 1
    } else {
      await scrapeJobstreet({
        ...common,
        url: values.url ?? 'https://my.jobstreet.com/software-engineer-jobs',
        maxPages: Number(values['max-pages'] ?? '1'),
        sort: parseSort(values.sort ?? 'newest')
      })
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
