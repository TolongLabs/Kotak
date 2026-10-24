// #249: Gemini flagship marks vague check-up statements, Gemini fast writes an explainer for each (see
// .agent-team plan). Usage: bun scripts/explainers/run.ts <triage|write|merge|count> [--max-batches N]
// Checkpoints are append-only JSONL files, so a rerun only does the items still missing. Workers only return text.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const RUN = '/home/drxg/projects/sdc-hack/.agent-team/build/2026-10-23-checkup-batch2'
const SESSION = '2e30d6e3-8b93-4d2c-b064-eb1330589e1f'
const GATE_RUN = '/home/drxg/projects/sdc-hack/.agent-team/build/2026-10-23-explainers-flash' // Flash-only gated run; outputs stay under RUN
const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '')
const W = `${RUN}/research/explainers`
const TRIAGE = `${W}/triage-results.jsonl`
const WRITTEN = `${W}/write-results.jsonl`
const OUT = `${ROOT}/data/generated/statement-explainers.json`
const WORKER = `${process.env.HOME}/.local/share/ai-tools/scripts/loop_worker.py`
const CONCURRENCY = 10 // narrowed from 20 after Antigravity refused calls at 25 concurrent (23 Oct)
const TRIAGE_FAMILY = 'agy.flash' // existing rows lack triaged_by and count as agy.pro
const MAX_WORDS = 39

type Level = 'basic' | 'advanced'
interface Item {
  onet_code: string
  title: string
  corner_id: string
  corner: string
  level: Level
  statement: string
}
const keyOf = (x: { onet_code: string; corner_id: string; level: string }) => `${x.onet_code}|${x.corner_id}|${x.level}`

for (const d of ['briefs', 'raw']) mkdirSync(`${W}/${d}`, { recursive: true })

async function loadItems(): Promise<Item[]> {
  const corners = await Bun.file(`${ROOT}/data/generated/role-corners.json`).json()
  const occ = await Bun.file(`${ROOT}/data/onet/occupations.json`).json()
  const titles = new Map<string, string>(
    occ.occupations.map((o: { onet_code: string; title: string }) => [o.onet_code, o.title])
  )
  return corners.roles.flatMap((r: any) =>
    r.corners.flatMap((c: any) =>
      (['basic', 'advanced'] as Level[]).map((level) => ({
        onet_code: r.onet_code,
        title: titles.get(r.onet_code) ?? r.onet_code,
        corner_id: c.corner_id,
        corner: c.name,
        level,
        statement: c.statements[level]
      }))
    )
  )
}

function readJsonl<T>(path: string): T[] {
  return existsSync(path)
    ? readFileSync(path, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l))
    : []
}

/** Parse the worker's text: strip code fences, keep every line that is a JSON object. */
function parseLines(text: string): any[] {
  const out: any[] = []
  for (const raw of text.replace(/```(?:json|jsonl)?/gi, '').split('\n')) {
    const line = raw.trim()
    if (!line.startsWith('{')) continue
    try {
      out.push(JSON.parse(line))
    } catch {
      /* a broken line leaves its item missing, so it is retried */
    }
  }
  return out
}

let aborted: string | null = null
let failures = 0

/** A stalled or failed call leaves its items pending for the next, smaller pass; eight failures in a row stop the run (quota, login). */
function onFail(e: unknown) {
  failures++
  console.error(String(e))
  if (failures >= 8) aborted = String(e)
}
let seq = 0

async function callWorker(family: string, mode: string, tag: string, brief: string, timeout: number): Promise<string> {
  const id = `${tag}-${Date.now()}-${seq++}`
  const briefPath = `${W}/briefs/${id}.md`
  const outPath = `${W}/raw/${id}.out`
  writeFileSync(briefPath, brief)
  const proc = Bun.spawn(
    [
      'python3',
      WORKER,
      '--run-dir',
      GATE_RUN,
      '--session-id',
      SESSION,
      '--family',
      family,
      '--brief',
      briefPath,
      '--cwd',
      ROOT,
      '--output',
      outPath,
      '--timeout',
      String(timeout),
      '--queue-timeout',
      '1800',
      '--mode',
      mode
    ],
    { stdout: 'pipe', stderr: 'pipe' }
  )
  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  await proc.exited
  if (proc.exitCode !== 0 || !existsSync(outPath))
    throw new Error(`worker failed (${tag}): ${stdout.trim()} ${stderr.trim()}`.slice(0, 600))
  return readFileSync(outPath, 'utf8')
}

async function pool<T>(jobs: T[], run: (job: T) => Promise<void>) {
  let next = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (!aborted && next < jobs.length) await run(jobs[next++]!)
    })
  )
}

const chunk = <T>(xs: T[], n: number) =>
  Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, (i + 1) * n))

const inputLine = (x: Item) =>
  JSON.stringify({
    onet_code: x.onet_code,
    role: x.title,
    corner_id: x.corner_id,
    skill_area: x.corner,
    level: x.level,
    statement: x.statement
  })

const TRIAGE_BRIEF = `Do not run any terminal commands. Do not read or write files. Reply with text only.

You are checking statements from a career self-assessment. A person reads one statement ("I can ...") and rates themselves 1 to 4. A statement is VAGUE if an ordinary adult without training in the field could not tell what work it describes, because of any of:
- jargon or acronyms that are not common knowledge;
- unclear scope (what, how much, or for whom is not clear);
- two or more different tasks bundled into one statement.
A statement that is concrete and in everyday words is NOT vague. Be strict but fair: mark vague only when a short plain explanation would clearly help.

Below are statements, one JSON object per line. For EVERY input line return exactly one output line, same onet_code, corner_id and level, in this exact form and nothing else (no commentary, no markdown fences):
{"onet_code":"...","corner_id":"...","level":"basic","vague":true,"reason":"at most 10 words"}

Input:
`

const WRITE_BRIEF = `Do not run any terminal commands. Do not read or write files. Reply with text only.

Each input line is a statement from a career self-assessment that people find vague. Write a short explainer for each one so a person with no training in the field understands what the work looks like.
Rules for every explainer:
- Fewer than ${MAX_WORDS + 1} words (target 25 to 35).
- Plain everyday English, no jargon, no acronyms unless you spell them out.
- Say what the task looks like at work and give exactly one concrete work example (start the example with "For example").
- Describe the task itself. Never address the reader with "you should", and never give advice.
- Stay faithful to the statement and its role; do not add claims about pay, seniority or tools not implied by it.
Return EXACTLY one output line per input line, same onet_code, corner_id and level, in this form and nothing else (no commentary, no markdown fences):
{"onet_code":"...","corner_id":"...","level":"basic","explainer":"..."}

Input:
`

function validTriage(o: any, want: Set<string>, seen: Set<string>): boolean {
  if (!o || typeof o.onet_code !== 'string' || typeof o.corner_id !== 'string' || typeof o.vague !== 'boolean')
    return false
  if (o.level !== 'basic' && o.level !== 'advanced') return false
  const k = keyOf(o)
  return want.has(k) && !seen.has(k)
}

export function validExplainer(text: unknown): text is string {
  if (typeof text !== 'string') return false
  const t = text.trim()
  const words = t.split(/\s+/).filter(Boolean).length
  return words > 0 && words <= MAX_WORDS && !/you should/i.test(t) && !t.includes('\n')
}

async function triage(maxBatches: number) {
  const items = await loadItems()
  const byKey = new Map(items.map((i) => [keyOf(i), i]))
  const done = new Set(readJsonl<any>(TRIAGE).map(keyOf))
  let budget = maxBatches
  for (const size of [125, 60, 30, 15]) {
    const pending = items.filter((i) => !done.has(keyOf(i)))
    if (pending.length === 0 || aborted) break
    const batches = chunk(pending, size).slice(0, budget)
    budget -= batches.length
    console.log(`triage pass size ${size}: ${pending.length} pending, ${batches.length} batches`)
    await pool(batches, async (batch) => {
      const want = new Set(batch.map(keyOf))
      try {
        const text = await callWorker(
          TRIAGE_FAMILY,
          'plan',
          'triage',
          TRIAGE_BRIEF + batch.map(inputLine).join('\n') + '\n',
          900
        )
        const seen = new Set<string>()
        const good = parseLines(text).filter((o) => validTriage(o, want, seen) && (seen.add(keyOf(o)), true))
        appendFileSync(
          TRIAGE,
          good
            .map((o) =>
              JSON.stringify({
                onet_code: o.onet_code,
                corner_id: o.corner_id,
                level: o.level,
                vague: o.vague,
                triaged_by: TRIAGE_FAMILY,
                reason: String(o.reason ?? '')
              })
            )
            .join('\n') + (good.length ? '\n' : '')
        )
        for (const o of good) done.add(keyOf(o))
        console.log(`  batch of ${batch.length}: ${good.length} valid`)
        failures = 0
      } catch (e) {
        onFail(e)
      }
    })
    if (budget <= 0) break
  }
  void byKey
  count()
}

async function write(maxBatches: number) {
  const items = await loadItems()
  const vague = new Set(
    readJsonl<any>(TRIAGE)
      .filter((t) => t.vague)
      .map(keyOf)
  )
  const written = new Set(readJsonl<any>(WRITTEN).map(keyOf))
  let budget = maxBatches
  for (const size of [100, 50, 25, 10]) {
    const pending = items.filter((i) => vague.has(keyOf(i)) && !written.has(keyOf(i)))
    if (pending.length === 0 || aborted) break
    const batches = chunk(pending, size).slice(0, budget)
    budget -= batches.length
    console.log(`write pass size ${size}: ${pending.length} pending, ${batches.length} batches`)
    await pool(batches, async (batch) => {
      const want = new Set(batch.map(keyOf))
      try {
        const text = await callWorker(
          'agy.flash',
          'plan',
          'write',
          WRITE_BRIEF + batch.map(inputLine).join('\n') + '\n',
          1200
        )
        const seen = new Set<string>()
        const good = parseLines(text).filter((o) => {
          if (
            !o ||
            (o.level !== 'basic' && o.level !== 'advanced') ||
            !want.has(keyOf(o)) ||
            seen.has(keyOf(o)) ||
            !validExplainer(o.explainer)
          )
            return false
          seen.add(keyOf(o))
          return true
        })
        appendFileSync(
          WRITTEN,
          good
            .map((o) =>
              JSON.stringify({
                onet_code: o.onet_code,
                corner_id: o.corner_id,
                level: o.level,
                explainer: o.explainer.trim()
              })
            )
            .join('\n') + (good.length ? '\n' : '')
        )
        for (const o of good) written.add(keyOf(o))
        console.log(`  batch of ${batch.length}: ${good.length} valid`)
        failures = 0
      } catch (e) {
        onFail(e)
      }
    })
    if (budget <= 0) break
  }
  count()
}

function merge() {
  const out: Record<string, Record<string, Partial<Record<Level, string>>>> = {}
  const rows = readJsonl<any>(WRITTEN).sort((a, b) => keyOf(a).localeCompare(keyOf(b)))
  for (const r of rows) ((out[r.onet_code] ??= {})[r.corner_id] ??= {})[r.level as Level] = r.explainer
  writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n')
  console.log(`wrote ${rows.length} explainers for ${Object.keys(out).length} roles to ${OUT}`)
}

function count() {
  const t = readJsonl<any>(TRIAGE)
  const w = new Set(readJsonl<any>(WRITTEN).map(keyOf))
  const vague = t.filter((x) => x.vague)
  const roles = new Set(t.map((x) => x.onet_code))
  const residual = vague.filter((x) => !w.has(keyOf(x)))
  const by = (f: string) => t.filter((x) => (x.triaged_by ?? 'agy.pro') === f).length
  console.log(
    JSON.stringify({
      triaged_by_pro: by('agy.pro'),
      triaged_by_flash: by('agy.flash'),
      triaged: t.length,
      roles_triaged: roles.size,
      vague: vague.length,
      written: w.size,
      residual_vague_unwritten: residual.length
    })
  )
}

const [cmd, ...rest] = process.argv.slice(2)
const mb = Number(rest[rest.indexOf('--max-batches') + 1]) || Infinity
if (cmd === 'triage') await triage(mb)
else if (cmd === 'write') await write(mb)
else if (cmd === 'merge') merge()
else if (cmd === 'count') count()
else console.error('usage: run.ts triage|write|merge|count [--max-batches N]')
if (aborted) process.exit(1)
