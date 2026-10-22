// Fills the Claude response cache for the demo roles through the running API, so the live demo never waits on
// the Claude API. Run it once ANTHROPIC_API_KEY is set on the target server; it exits 1 while any answer is a fallback.
//
//   bun run prewarm:ai <demo-requests.json> [--base-url https://<worker>.workers.dev]
//
// The file lists the demo job titles and the exact explanation payloads the app sends for the demo profiles:
//   { "role_titles": ["Jurutera Perisian"], "explanations": [<ExplanationRequest>, ...] }
import { parseArgs } from 'node:util'
import {
  ExplanationRequestSchema,
  ExplanationResponseSchema,
  RoleMatchRequestSchema,
  RoleMatchResponseSchema
} from '../packages/shared/src/index'

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: { 'base-url': { type: 'string', default: 'http://localhost:8787' } },
  allowPositionals: true
})
const [file] = positionals
if (!file) {
  console.error('Usage: bun run prewarm:ai <demo-requests.json> [--base-url <url>]')
  process.exit(1)
}

const demo = (await Bun.file(file).json()) as { role_titles?: unknown[]; explanations?: unknown[] }
const titles = (demo.role_titles ?? []).map((title) => RoleMatchRequestSchema.parse({ job_title: title }))
const explanations = (demo.explanations ?? []).map((request) => ExplanationRequestSchema.parse(request))
if (titles.length + explanations.length === 0) {
  console.error(`${file} lists no role_titles and no explanations.`)
  process.exit(1)
}

async function post(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(new URL(path, values['base-url']), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!response.ok) throw new Error(`POST ${path} returned ${response.status}: ${await response.text()}`)
  return response.json()
}

const state = (cached: boolean | undefined) => (cached ? 'already cached' : 'cached now')
let fallbacks = 0

for (const request of titles) {
  const match = RoleMatchResponseSchema.parse(await post('/api/roles/match', request))
  const found = match.occupation ? `${match.occupation.onet_code} ${match.occupation.title}` : 'no occupation'
  if (match.match_source === 'title_search') {
    console.info(`match "${request.job_title}": ${found} by title search, no Claude call`)
  } else if (match.fallback_reason === 'ai_unavailable') {
    fallbacks += 1
    console.warn(`match "${request.job_title}": fallback, Claude unavailable`)
  } else {
    console.info(`match "${request.job_title}": ${found}, ${state(match.cached)}`)
  }
}

for (const [index, request] of explanations.entries()) {
  const response = ExplanationResponseSchema.parse(await post('/api/explanations', request))
  const label = `explanations #${index + 1} (${request.snapshot_id})`
  if (response.fallback_reason === 'ai_unavailable') {
    fallbacks += 1
    console.warn(`${label}: fixed template, Claude unavailable`)
  } else {
    const fromClaude = response.explanations.filter((explanation) => explanation.source === 'claude').length
    console.info(
      `${label}: ${fromClaude} of 6 corners from Claude, summary from ${response.what_changed_source}, ${state(response.cached)}`
    )
  }
}

if (fallbacks > 0) {
  console.error(`${fallbacks} request(s) got the fallback. Set ANTHROPIC_API_KEY on the server and run again.`)
  process.exit(1)
}
