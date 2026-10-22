// A local stand-in for the RunPod vLLM endpoint, to test run-batch.ts without a key or GPU credit. It serves the
// worker's OpenAI-compatible routes (/v2/<id>/openai/v1/models and /chat/completions) and the REST endpoint lookup
// (/v1/endpoints/<id>), and answers with placeholder corners cut from the request's own task IDs. The answers are
// not model output: never commit a role-corners.json written against this stub.
// Run: bun scripts/corners/stub-server.ts [--port 8787] [--plant-foreign 27-1024.00] [--fail-first 2]
//   --plant-foreign: the first answer for these codes adds task 999999, which the post-validator must reject.
//   --fail-first: the first N chat requests return HTTP 503, to exercise the runner's retries.
// Then: RUNPOD_API_KEY=stub RUNPOD_ENDPOINT_ID=stub bun run batch:corners \
//   --api-url http://localhost:8787/v2 --rest-url http://localhost:8787/v1 --out <scratch>/role-corners.json ...

import { parseArgs } from 'node:util'

const { values: args } = parseArgs({
  options: {
    port: { type: 'string', default: '8787' },
    'plant-foreign': { type: 'string', default: '' },
    'fail-first': { type: 'string', default: '0' }
  }
})
const MODEL = 'stub-model'
const plant = new Set(args['plant-foreign'].split(',').filter(Boolean))
let failuresLeft = Number(args['fail-first'])

type Message = { role: string; content: string }

function answer(messages: Message[], taskIds: number[]): Record<string, unknown> {
  const user = messages.find((m) => m.role === 'user')?.content ?? ''
  const code = /O\*NET-SOC (\d{2}-\d{4}\.\d{2})/.exec(user)?.[1] ?? ''
  const count = Number(/Make (\d+) corners/.exec(user)?.[1] ?? 1)
  const isRetry = messages.some((m) => m.role === 'assistant')
  const corners = Array.from({ length: count }, (_, i) => {
    const ids = taskIds.filter((_, j) => j % count === i)
    return {
      task_ids: i === 0 && plant.has(code) && !isRetry ? [...ids, 999999] : ids,
      name: `Stub corner ${i + 1}`,
      statements: {
        basic: `I can describe stub task ${ids[0]} with guidance.`,
        working: `I have done stub task ${ids[0]} on my own.`,
        advanced: `I have taught others stub task ${ids[0]}.`
      },
      hours: { basic: 10, working: 40, advanced: 120 },
      sdg_targets: ['8.5'],
      resource_queries: [`stub search ${code} ${i + 1}`]
    }
  })
  return { corners }
}

const json = (body: unknown, status = 200) => Response.json(body, { status })

Bun.serve({
  port: Number(args.port),
  async fetch(req) {
    const url = new URL(req.url)
    if (req.headers.get('authorization') !== 'Bearer stub') return json({ error: 'unauthorized' }, 401)
    if (req.method === 'GET' && /^\/v1\/endpoints\/[^/]+$/.test(url.pathname)) {
      return json({
        id: url.pathname.split('/').pop(),
        name: 'local stub',
        gpuTypeIds: ['STUB GPU'],
        gpuCount: 1,
        workersMax: 1,
        idleTimeout: 5,
        template: { imageName: 'local-stub', env: { MODEL_NAME: MODEL, HF_TOKEN: 'never-recorded' } }
      })
    }
    if (req.method === 'GET' && /^\/v2\/[^/]+\/openai\/v1\/models$/.test(url.pathname)) {
      return json({ object: 'list', data: [{ id: MODEL, object: 'model' }] })
    }
    if (req.method === 'POST' && /^\/v2\/[^/]+\/openai\/v1\/chat\/completions$/.test(url.pathname)) {
      if (failuresLeft > 0) {
        failuresLeft--
        return json({ error: 'stub: worker throttled' }, 503)
      }
      const body = (await req.json()) as Record<string, any>
      const schema = body.response_format?.json_schema?.schema
      const taskIds: number[] | undefined = schema?.properties?.corners?.items?.properties?.task_ids?.items?.enum
      if (body.model !== MODEL || body.temperature !== 0 || body.response_format?.type !== 'json_schema' || !taskIds) {
        return json({ error: { message: 'stub: unexpected request shape', type: 'BadRequestError' } }, 400)
      }
      const content = JSON.stringify(answer(body.messages, taskIds))
      const prompt = (body.messages as Message[]).reduce((n, m) => n + m.content.length, 0)
      return json({
        id: `stub-${crypto.randomUUID()}`,
        object: 'chat.completion',
        model: MODEL,
        choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
        usage: {
          prompt_tokens: Math.ceil(prompt / 4),
          completion_tokens: Math.ceil(content.length / 4),
          total_tokens: Math.ceil((prompt + content.length) / 4)
        }
      })
    }
    return json({ error: 'not found' }, 404)
  }
})
console.log(`Stub RunPod endpoint on http://localhost:${args.port} (model ${MODEL})`)
