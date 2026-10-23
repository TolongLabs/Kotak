// Runs the role-corner batch (#74, #77) on a RunPod serverless vLLM endpoint and writes
// data/generated/role-corners.json plus a run summary for the RunPod proof (#70).
// Run: bun run batch:corners [--codes 27-1024.00,15-1252.00] [--concurrency 32] [--attempts 3] [--force]
// Env: RUNPOD_API_KEY, RUNPOD_ENDPOINT_ID. Deploy notes and the cost estimate: runpod/README.md.
// The endpoint is RunPod's stock vLLM worker; requests use its OpenAI-compatible route:
// https://docs.runpod.io/serverless/vllm/openai-compatibility and https://github.com/runpod-workers/worker-vllm
//
// Each answer is parsed and checked by the shared post-validator; a rejected answer goes back to the model with
// its errors, up to --attempts times. Occupations already in the output file are kept unless --force, so a stopped
// run can resume. Codes still missing afterwards are listed in the summary, to run again; the final run left none,
// so the planned Claude backup (#79) was never needed.

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import {
  CornerGroupsFileSchema,
  buildCornerRequest,
  parseCornerResponse,
  validateOccupationCorners,
  type CornerPromptInput,
  type CornerRequest,
  type CornerRetry
} from '../../packages/shared/src/corners'
import { OnetOccupationsFileSchema, OnetTasksFileSchema, type OnetTasksFile } from '../../packages/shared/src/data/onet'
import { RoleCornersSchema, type OccupationCorners } from '../../packages/shared/src/data/role-corners'
import { writeRecordsJson } from './io'

const ROOT = resolve(import.meta.dir, '../..')
const { values: args } = parseArgs({
  options: {
    codes: { type: 'string' },
    concurrency: { type: 'string', default: '32' },
    attempts: { type: 'string', default: '3' },
    model: { type: 'string' },
    out: { type: 'string', default: 'data/generated/role-corners.json' },
    summary: { type: 'string', default: 'data/generated/role-corners-run.json' },
    'api-url': { type: 'string', default: 'https://api.runpod.ai/v2' },
    'rest-url': { type: 'string', default: 'https://rest.runpod.io/v1' },
    force: { type: 'boolean', default: false }
  }
})

const API_KEY = process.env.RUNPOD_API_KEY
const ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID
if (!API_KEY || !ENDPOINT_ID) {
  console.error('Set RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID (see runpod/README.md).')
  process.exit(1)
}
const BASE_URL = `${args['api-url']}/${ENDPOINT_ID}/openai/v1`
const CONCURRENCY = Number(args.concurrency)
const ATTEMPTS = Number(args.attempts)
const OUT = resolve(ROOT, args.out)
const SUMMARY = resolve(ROOT, args.summary)
const HTTP_RETRIES = 5
const REQUEST_TIMEOUT_MS = 10 * 60_000
const COLD_START_LIMIT_MS = 30 * 60_000
const TODAY = new Date().toISOString().slice(0, 10)

/** Wrong key, endpoint or worker set-up: stop the whole run. */
class FatalError extends Error {}
/** A response that resending the same request will not fix. */
class RequestError extends Error {}

const readJson = async (path: string) => Bun.file(resolve(ROOT, path)).json()
const tasksFile: OnetTasksFile = OnetTasksFileSchema.parse(await readJson('data/onet/tasks.json'))
const occupations = OnetOccupationsFileSchema.parse(await readJson('data/onet/occupations.json')).occupations
const groupsFile = CornerGroupsFileSchema.parse(await readJson('data/generated/corner-groups.json'))

const occupationByCode = new Map(occupations.map((o) => [o.onet_code, o]))
const inputs = new Map<string, CornerPromptInput>(
  groupsFile.occupations.map((g) => {
    const occupation = occupationByCode.get(g.onet_code)!
    const input = {
      onet_code: g.onet_code,
      title: occupation.title,
      description: occupation.description,
      groups: g.groups,
      tasks: tasksFile.tasks[g.onet_code]!
    }
    return [g.onet_code, input]
  })
)
const candidateIds = (input: CornerPromptInput) => input.groups.flatMap((g) => g.task_ids)

const requested = args.codes ? args.codes.split(',').map((c) => c.trim()) : [...inputs.keys()]
const unknown = requested.filter((c) => !inputs.has(c))
if (unknown.length > 0) {
  console.error(`Unknown O*NET-SOC codes: ${unknown.join(', ')}`)
  process.exit(1)
}

// Keep earlier results that still pass the validator. --force regenerates the requested codes; an earlier result
// stays until a new answer passes.
const roles = new Map<string, OccupationCorners>()
if (existsSync(OUT)) {
  for (const role of RoleCornersSchema.parse(await Bun.file(OUT).json()).roles) {
    const input = inputs.get(role.onet_code)
    if (input && validateOccupationCorners(role, input.tasks, candidateIds(input)).errors.length === 0) {
      roles.set(role.onet_code, role)
    }
  }
}
const queue = requested.filter((c) => args.force || !roles.has(c))
const kept = requested.length - queue.length

const stats = { sent: 0, http_errors: 0, rejected_answers: 0, prompt_tokens: 0, completion_tokens: 0 }
const failed: { onet_code: string; errors: string[] }[] = []
let generatedNow = 0
const headers = { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }

/** Waits out a cold start: the first request queues until a worker has loaded the model. Returns the served model. */
async function waitForWorker(): Promise<string> {
  const started = Date.now()
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(`${BASE_URL}/models`, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        throw new FatalError(`GET /models returned HTTP ${res.status}: check RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID`)
      }
      const body = (await res.json().catch(() => null)) as { data?: { id: string }[] } | null
      if (res.ok && body?.data?.[0]?.id) return body.data[0].id
    } catch (error) {
      if (error instanceof FatalError) throw error
    }
    if (Date.now() - started > COLD_START_LIMIT_MS) throw new FatalError('no worker answered within 30 minutes')
    if (i === 0) console.log('Waiting for a worker to start (cold start)...')
    await Bun.sleep(10_000)
  }
}

/** Endpoint settings for the proof; never records secrets, only these env names. */
async function endpointDetails(): Promise<Record<string, unknown> | null> {
  const shown = ['MODEL_NAME', 'MAX_MODEL_LEN', 'MAX_NUM_SEQS', 'MAX_CONCURRENCY', 'GPU_MEMORY_UTILIZATION']
  try {
    const res = await fetch(`${args['rest-url']}/endpoints/${ENDPOINT_ID}?includeTemplate=true`, { headers })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const e = (await res.json()) as Record<string, any>
    const env = { ...e.template?.env, ...e.env }
    return {
      name: e.name ?? null,
      gpu_type_ids: e.gpuTypeIds ?? null,
      gpu_count: e.gpuCount ?? null,
      workers_max: e.workersMax ?? null,
      idle_timeout_s: e.idleTimeout ?? null,
      image: e.template?.imageName ?? null,
      env: Object.fromEntries(shown.filter((k) => k in env).map((k) => [k, env[k]]))
    }
  } catch (error) {
    console.warn(`Could not read endpoint details from the RunPod REST API: ${(error as Error).message}`)
    return null
  }
}

/** One chat completion, retrying transient failures (429, 5xx, timeouts) with exponential backoff. */
async function complete(request: CornerRequest, model: string): Promise<{ text: string; finish: string }> {
  const body = JSON.stringify({
    model,
    messages: [{ role: 'system', content: request.system }, ...request.messages],
    response_format: {
      type: 'json_schema',
      json_schema: { name: request.schema_name, schema: request.schema, strict: true }
    },
    temperature: 0,
    max_tokens: request.max_output_tokens,
    // Qwen chat templates think by default; the corners need none, and the schema constrains every token.
    chat_template_kwargs: { enable_thinking: false }
  })
  for (let failure = 0; ; failure++) {
    let problem: string
    try {
      stats.sent++
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      })
      const text = await res.text()
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        throw new FatalError(`HTTP ${res.status}: ${text.slice(0, 300)}`)
      }
      const json = (() => {
        try {
          return JSON.parse(text)
        } catch {
          return null
        }
      })()
      if (json?.error?.type === 'startup_error') throw new FatalError(`worker failed to start: ${json.error.message}`)
      if (res.status === 400 || res.status === 422) throw new FatalError(`request rejected: ${text.slice(0, 300)}`)
      const choice = json?.choices?.[0]
      if (res.ok && choice) {
        stats.prompt_tokens += json.usage?.prompt_tokens ?? 0
        stats.completion_tokens += json.usage?.completion_tokens ?? 0
        return { text: choice.message?.content ?? '', finish: choice.finish_reason ?? '' }
      }
      // A worker-side error inside a 200 is about this request: fail the attempt rather than resend it.
      if (res.ok) throw new RequestError(`no completion in the response: ${text.slice(0, 200)}`)
      problem = `HTTP ${res.status}: ${text.slice(0, 200)}`
    } catch (error) {
      if (error instanceof FatalError || error instanceof RequestError) throw error
      problem = (error as Error).message
    }
    stats.http_errors++
    if (failure >= HTTP_RETRIES) throw new Error(`gave up after ${HTTP_RETRIES + 1} tries: ${problem}`)
    await Bun.sleep(Math.min(60_000, 2_000 * 2 ** failure) * (0.5 + Math.random()))
  }
}

async function runOne(code: string, model: string): Promise<void> {
  const input = inputs.get(code)!
  let retry: CornerRetry | undefined
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    let errors: string[]
    let text = ''
    try {
      const answer = await complete(buildCornerRequest(input, retry), model)
      text = answer.text
      const result = parseCornerResponse(text, input, { generated_by: 'runpod', model, generated_date: TODAY })
      if (result.ok) {
        roles.set(code, result.role)
        generatedNow++
        const { candidate_tasks, missing_task_ids } = result.validation
        const assigned = candidate_tasks - missing_task_ids.length
        console.log(
          `${code} ok: ${result.role.corners.length} corners, ${assigned}/${candidate_tasks} tasks, try ${attempt}`
        )
        return
      }
      errors =
        answer.finish === 'length' ? ['the answer hit max_tokens and was cut off', ...result.errors] : result.errors
      stats.rejected_answers++
    } catch (error) {
      if (error instanceof FatalError) throw error
      errors = [(error as Error).message]
    }
    console.log(`${code} try ${attempt} rejected: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? ' ...' : ''}`)
    retry = text ? { previous: text, errors } : undefined
    if (attempt === ATTEMPTS) failed.push({ onet_code: code, errors })
  }
}

async function writeOutputs(started: Date, model: string, endpoint: Record<string, unknown> | null): Promise<void> {
  const sorted = [...roles.values()].sort((a, b) => (a.onet_code < b.onet_code ? -1 : 1))
  if (sorted.length > 0) {
    const { meta } = tasksFile
    const file = RoleCornersSchema.parse({
      meta: {
        licence: meta.licence,
        licence_url: meta.licence_url,
        credit: meta.credit,
        modification_notice: meta.modification_notice,
        onet_version: meta.version
      },
      roles: sorted
    })
    await writeRecordsJson(OUT, file, 'roles')
  }
  let candidate = 0
  let assigned = 0
  for (const role of sorted) {
    const input = inputs.get(role.onet_code)!
    const v = validateOccupationCorners(role, input.tasks, candidateIds(input))
    candidate += v.candidate_tasks
    assigned += v.candidate_tasks - v.missing_task_ids.length
  }
  const finished = new Date()
  const run = {
    started_at: started.toISOString(),
    finished_at: finished.toISOString(),
    runtime_seconds: Math.round((finished.getTime() - started.getTime()) / 1000),
    model,
    endpoint,
    settings: { concurrency: CONCURRENCY, attempts: ATTEMPTS, temperature: 0, structured_output: 'json_schema' },
    requested: requested.length,
    kept_from_earlier_runs: kept,
    generated: generatedNow,
    requests: stats,
    failed
  }
  const runs = [...earlierRuns, run]
  const sum = (pick: (r: typeof run) => number) => runs.reduce((n, r) => n + pick(r), 0)
  const summary = {
    generated_by: 'runpod',
    endpoint_id: ENDPOINT_ID,
    openai_base_url: BASE_URL,
    totals: {
      runtime_seconds: sum((r) => r.runtime_seconds),
      requests: sum((r) => r.requests.sent),
      prompt_tokens: sum((r) => r.requests.prompt_tokens),
      completion_tokens: sum((r) => r.requests.completion_tokens)
    },
    occupations: {
      catalogue: inputs.size,
      in_output: sorted.length,
      six_corners: sorted.filter((r) => r.corners.length === 6).length,
      fewer_corners: sorted.filter((r) => r.corners.length < 6).length
    },
    task_coverage: { candidate, assigned, share: candidate ? Number((assigned / candidate).toFixed(4)) : null },
    /** Catalogue codes with no valid corners in the output, to run again. */
    missing_codes: [...inputs.keys()].filter((c) => !roles.has(c)).sort(),
    runs
  }
  await Bun.write(SUMMARY, `${JSON.stringify(summary, null, 2)}\n`)
}

// Nothing to do must not wake a worker, since a cold start is billed, nor touch the earlier summary.
if (queue.length === 0) {
  console.log(`All ${requested.length} requested occupations are already in ${OUT}; pass --force to regenerate.`)
  process.exit(0)
}
// Each run appends to the summary, so a test run and a resumed run all show in the proof.
const earlierRuns: any[] = existsSync(SUMMARY) ? ((await Bun.file(SUMMARY).json()).runs ?? []) : []
const started = new Date()
console.log(`${queue.length} occupations to generate (${kept} kept from ${OUT}), endpoint ${ENDPOINT_ID}`)
let model = args.model ?? ''
let endpoint: Record<string, unknown> | null = null
let fatal: Error | undefined
try {
  const served = await waitForWorker()
  model ||= served
  endpoint = await endpointDetails()
  console.log(`Worker ready, model ${model}`)
  let done = 0
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      try {
        for (let code = queue.shift(); code && !fatal; code = queue.shift()) {
          await runOne(code, model)
          if (++done % 25 === 0) await writeOutputs(started, model, endpoint)
        }
      } catch (error) {
        fatal ??= error as Error
      }
    })
  )
} catch (error) {
  fatal = error as Error
}
await writeOutputs(started, model, endpoint)
if (fatal) console.error(`Stopped: ${fatal.message}`)
console.log(`Wrote ${OUT} and ${SUMMARY}: ${roles.size} occupations, ${failed.length} failed this run`)
process.exit(fatal || failed.length > 0 ? 1 : 0)
