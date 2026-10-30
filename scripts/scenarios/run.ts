// #353: writes 12 what-would-you-do questions per job through the team loop worker (Claude Sonnet, then GPT fast) and folds sampled reviews.
// Usage: bun scripts/scenarios/run.ts <write|validate|concat|refine|review|redo|apply|merge|count> [--pilot] [--max-batches N] [--codes a,b] [--concurrency N]
// Checkpoints are append-only JSONL, so a rerun only does the jobs still missing. Workers only return text.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { ScenariosFileSchema } from '../../packages/shared/src/data/scenarios'
import { validateJob, type CornerIn, type Slot } from './validate'

const RUN = process.env.SCENARIO_RUN_DIR ?? '/home/drxg/projects/sdc-hack/.agent-team/build/2026-10-29-final-upgrades' // team run dir: briefs, raw output, checkpoints
const SESSION = process.env.SCENARIO_SESSION_ID ?? 'c9da7c6a-035d-41d6-8598-abcecc23ede7'
const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '')
const W = `${RUN}/research/scenarios`
const WRITTEN = process.env.WRITTEN_FILE ?? `${W}/v5-sonnet/write-results.jsonl`
const FAILED = process.env.FAILED_FILE ?? `${W}/v5-sonnet/write-rejects.jsonl`
const REVIEWS = process.env.REVIEWS_FILE ?? `${W}/v5-sonnet/reviews.jsonl`
const OUT = `${ROOT}/data/generated/scenarios.json`
const WORKER = `${process.env.HOME}/.local/share/ai-tools/scripts/loop_worker.py`
const WRITE_FAMILY = process.env.WRITE_FAMILY ?? 'agy.flash'
const REVIEW_FAMILY = 'agy.sonnet' // user, 2026-10-29: Argon is spent; Google-hosted Sonnet reviews, up to 8 at once (ids s0..s7)
const REVIEW_CONCURRENCY = 8
const DEMO = ['23-1012.00', '15-1254.00', '23-1011.00', '15-1252.00', '27-1024.00', '43-3031.00']
const PILOT = ['23-1012.00', '15-1254.00', '43-3031.00', '47-2111.00', '29-1141.00']
const args = process.argv.slice(2)
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)
const CONCURRENCY = Number(opt('--concurrency')) || 10 // 25 at once was refused on 23 Oct; raise only with no refusals
const BATCH = Number(process.env.BATCH) || 6

interface Role {
  onet_code: string
  title: string
  corners: (CornerIn & { name: string; statements: { basic: string; advanced: string } })[]
}
interface Job {
  onet_code: string
  title: string
  slots: Slot[]
}

for (const d of ['briefs', 'raw']) mkdirSync(`${W}/${d}`, { recursive: true })

const readJsonl = <T>(p: string): T[] =>
  existsSync(p)
    ? readFileSync(p, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l))
    : []

async function loadRoles(): Promise<Role[]> {
  const corners = await Bun.file(`${ROOT}/data/generated/role-corners.json`).json()
  const occ = await Bun.file(`${ROOT}/data/onet/occupations.json`).json()
  const titles = new Map<string, string>(occ.occupations.map((o: any) => [o.onet_code, o.title]))
  return corners.roles
    .filter((r: any) => r.corners.length === 6)
    .map((r: any) => ({ onet_code: r.onet_code, title: titles.get(r.onet_code) ?? r.onet_code, corners: r.corners }))
}

function parseLines(text: string): any[] {
  const out: any[] = []
  for (const raw of text.replace(/```(?:json|jsonl)?/gi, '').split('\n')) {
    const line = raw.trim()
    if (!line.startsWith('{')) continue
    try {
      out.push(JSON.parse(line))
    } catch {
      /* a broken line leaves its job missing, so it is retried */
    }
  }
  return out
}

let aborted: string | null = null
let failures = 0
let seq = 0
const onFail = (e: unknown) => {
  console.error(String(e))
  if (++failures >= 8) aborted = String(e)
}

async function callWorker(family: string, tag: string, brief: string, timeout: number): Promise<string> {
  const id = `${tag}-${Date.now()}-${seq++}`
  const briefPath = `${W}/briefs/${id}.md`
  const outPath = `${W}/raw/${id}.out`
  writeFileSync(briefPath, brief)
  const proc = Bun.spawn(
    [
      'python3',
      '-B',
      WORKER,
      '--run-dir',
      RUN,
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
      'plan',
      '--effort',
      'high',
      ...(process.env.ALLOW_GPT_OVER_LIMIT ? ['--allow-gpt-over-limit'] : []) // only with the user's yes
    ],
    { stdout: 'pipe', stderr: 'pipe' }
  )
  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  await proc.exited
  if (proc.exitCode !== 0 || !existsSync(outPath))
    throw new Error(`worker failed (${tag}): ${stdout.trim()} ${stderr.trim()}`.slice(0, 600))
  return readFileSync(outPath, 'utf8')
}

async function pool<T>(jobs: T[], run: (job: T) => Promise<void>, size = CONCURRENCY) {
  let next = 0
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (!aborted && next < jobs.length) await run(jobs[next++]!)
    })
  )
}
const chunk = <T>(xs: T[], n: number) =>
  Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, (i + 1) * n))

// ---------- writing ----------
const WRITE_HEAD = `You write short workplace situational-judgement questions ("what would you do") for a Malaysian career-check-up app. Do not run any terminal commands. Reply with text only.

For each JOB below, write 12 scenarios: for each of its 6 CORNERS (skill areas), one "basic" scenario and one "advanced" scenario, in the order given (corner 1 basic, corner 1 advanced, corner 2 basic, ...).

Each scenario has:
- "situation": one realistic workplace moment for that job, written to "you", at most 35 words, in full natural sentences. It must test the CORNER's task: use one of that corner's listed tasks (quoted below the corner) as the core of the situation, and list that task id in "task_ids" (at least one, only ids from that corner). A basic scenario is routine work. An advanced scenario is harder, with more at stake or less clear.
- "options": exactly 4 different things the person could do, each at most 16 words, all four within 3 words of each other in length. Each is a full natural sentence with articles (no telegraphic or clipped grammar). Each is something a real worker under time pressure might genuinely pick, with a plausible reason behind it. No option is absurd, reckless-sounding or a joke: the weakest (score 1) is a tempting shortcut. "score" is 4 for the strongest, 3 good but incomplete, 2 weak or risky, 1 poor shortcut. Use each of 1, 2, 3, 4 exactly once. Give the 4 options in a mixed order, not sorted by score.
- "why": for each option, one short line saying why it ranks at its score (hidden, used only for checking). The ranking must be clear: no two options may be able to swap places.

Rules for the options:
- No option may reveal its score by wording. Do not use: best, always, never, ignore, immediately, comprehensive, thoroughly, perfect, correct, wrong, guess, "do nothing".
- Spread the job-specific terms and professional vocabulary across all four options, so expert wording does not mark the best one. The strongest option must not be longer than the others by habit: vary which score is the longest.
- Plain, simple English. Malaysian workplace context is welcome (ringgit, kopitiam, Bahasa terms only if natural). No real company names, no real people. Facts must be right for the job.
- The person is the job holder, acting only within the authority of a junior-to-mid person in this job. No option may use powers the job lacks (for example a clerk does not set court dates or convene lawyers).
- Scores differ by competence, not by "asks the supervisor" or "adds one more step". The score-4 option is a distinctly better approach, never the score-3 option plus an extra step. Consulting a supervisor is not what makes an option strongest unless the situation truly needs it.
- Use only facts a person in this Malaysian job would know. If unsure of a specific law, rate or term, keep the wording generic rather than citing it.
- In the "why" of the score-4 option, name what makes it better than the score-3 option. If you cannot, rewrite the options.
- Weak options must not announce their weakness: do not write "without ...", "casually", "carelessly", "only" or "ignore" in them. Write each weak option as a reasonable-sounding shortcut a busy person might defend.
- Use only facts you are sure of. Name a Malaysian law only by its full official title with year (for example "Probate and Administration Act 1959"); if you are not sure of the exact title, do not name a law. No premises from tech news or recent events that may be out of date.
- Every situation stays inside the named corner's tasks and inside the job's own authority at junior-to-mid level. Score 1 is clearly the worst and score 4 is clearly the best.
- Score 1 is the most harmful, irreversible or rule-breaking choice. No other option may break a rule stated in the situation or be harder to undo than score 1.
- Each option also carries "words": its exact word count. Count carefully: the four "words" values in a slot must be within 3 of each other (for example all between 10 and 13).
- Each situation at most 250 characters and each option at most 120 characters.
- Do not mention the statements, scores or levels in the text.

Output: one JSON object per line per JOB (no code fences, no other text), exactly:
{"onet_code":"...","slots":[{"corner_id":"...","level":"basic","situation":"...","options":[{"text":"...","score":3,"words":11,"why":"..."},{"text":"...","score":1,"words":12,"why":"..."},{"text":"...","score":4,"words":10,"why":"..."},{"text":"...","score":2,"words":11,"why":"..."}],"task_ids":[123]}, ... 12 entries]}

JOBS:
`

function jobInput(r: Role, tasks: Record<string, any[]>): string {
  const byId = new Map((tasks[r.onet_code] ?? []).map((t) => [t.task_id, t.statement]))
  const cs = r.corners.map((c, i) => {
    const t = c.task_ids.map((id) => `    - ${id}: ${String(byId.get(id) ?? '').slice(0, 140)}`).join('\n')
    return `  CORNER ${i + 1} corner_id="${c.corner_id}" name="${c.name}"\n    basic skill: ${c.statements.basic}\n    advanced skill: ${c.statements.advanced}\n    tasks:\n${t}`
  })
  return `JOB onet_code="${r.onet_code}" title="${r.title}"\n${cs.join('\n')}\n`
}

function buildSlots(o: any): Slot[] | null {
  if (!o || !Array.isArray(o.slots)) return null
  return o.slots.map((s: any, i: number) => ({
    slot: i,
    corner_id: s?.corner_id,
    level: s?.level,
    situation: String(s?.situation ?? '').trim(),
    options: (Array.isArray(s?.options) ? s.options : []).map((x: any, k: number) => ({
      id: 'abcd'[k]!,
      text: String(x?.text ?? '').trim(),
      score: Number(x?.score)
    })), // "words" and "why" are dropped here
    task_ids: Array.isArray(s?.task_ids) ? s.task_ids.map(Number) : []
  }))
}

function toJob(r: Role, o: any): Job | string[] {
  const slots = buildSlots(o)
  if (!slots) return ['no slots array']
  const bad = validateJob(slots, r.corners)
  return bad.length ? bad : { onet_code: r.onet_code, title: r.title, slots }
}

const PARKED = process.env.PARKED_FILE ?? FAILED.replace('write-rejects', 'parked')
const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length

/** Exact repair notes per failing slot, with the numbers, from the validator's messages. */
function repairNotes(slots: Slot[], bad: string[]): Map<number, string[]> {
  const notes = new Map<number, string[]>()
  const add = (slot: number, note: string) => notes.set(slot, [...(notes.get(slot) ?? []), note])
  for (const msg of bad) {
    const m = msg.match(/^slot (\d+): (.*)$/)
    if (!m) continue
    const slot = Number(m[1])
    const lens = (slots[slot]?.options ?? []).map((o) => wordCount(o.text))
    if (m[2]!.startsWith('option lengths differ'))
      add(
        slot,
        `word counts ${lens.join(', ')}: rewrite so all four options are within 3 words of each other (for example all 10 to 13 words)`
      )
    else add(slot, m[2]!)
  }
  const longest = bad.find((x) => x.startsWith('score-4 option is the longest in'))
  if (longest) {
    const k = Number(longest.match(/in (\d+) of/)![1])
    const where = slots.filter((s) => {
      const l = s.options.map((o) => wordCount(o.text))
      const top = s.options.findIndex((o) => o.score === 4)
      return top >= 0 && l[top] === Math.max(...l) && l.filter((n) => n === l[top]).length === 1
    })
    // change k - 4 of them (the later ones), so the job is left with 4 slots where score 4 is the longest
    for (const s of where.slice(4))
      add(
        s.slot,
        `score 4 is the longest option here (it is the longest in ${k} of 12 slots, the limit is 4): rewrite so another option is the longest`
      )
  }
  return notes
}

/** One repair call for a job's failing slots; returns the job's slots with the replacements that came back. */
async function repairSlots(r: Role, slots: Slot[], notes: Map<number, string[]>): Promise<Slot[]> {
  const items = [...notes].map(([slot, n]) => {
    const s = slots[slot]!
    const cur = {
      slot,
      corner_id: s.corner_id,
      level: s.level,
      situation: s.situation,
      options: s.options.map((o) => ({ text: o.text, score: o.score, words: wordCount(o.text) })),
      task_ids: s.task_ids
    }
    return `SLOT ${slot} problems: ${n.join('; ')}\nCurrent: ${JSON.stringify(cur)}`
  })
  const brief = `Repair workplace situational-judgement scenarios for a Malaysian career-check-up app. Do not run any terminal commands. Reply with text only.\n\nJob: ${r.title} (${r.onet_code}). Each slot below failed an automatic checker. Rewrite ONLY the named problems and keep everything else the same where possible. Each option is a full natural sentence of at most 16 words and 120 characters, with a "words" count; the four "words" values must be within 3 of each other. Scores 1 to 4 each once; the situation at most 35 words and 250 characters. Keep slot, corner_id, level and task_ids. Never use the words: best, always, never, ignore, immediately, comprehensive, thoroughly, perfect, correct, wrong, guess, "do nothing".\n\n${items.join('\n\n')}\n\nOutput one JSON object per slot, one per line, no code fences: {"slot":N,"corner_id":"...","level":"...","situation":"...","options":[{"text":"...","score":3,"words":N}, ...4],"task_ids":[...]}`
  const text = await callWorker(WRITE_FAMILY, 'repair', brief, 900)
  const next = [...slots]
  for (const o of parseLines(text)) {
    if (!notes.has(o?.slot) || !Array.isArray(o.options)) continue
    next[o.slot] = {
      slot: o.slot,
      corner_id: o.corner_id,
      level: o.level,
      situation: String(o.situation ?? '').trim(),
      options: o.options.map((x: any, k: number) => ({
        id: 'abcd'[k]!,
        text: String(x?.text ?? '').trim(),
        score: Number(x?.score)
      })),
      task_ids: Array.isArray(o.task_ids) ? o.task_ids.map(Number) : []
    }
  }
  return next
}

/** Retry passes tell the writer what the validator rejected last time. */
function feedback(batch: Role[]): string {
  const rej = readJsonl<any>(FAILED)
  const lines = batch.flatMap((r) => {
    const last = rej.filter((x) => x.onet_code === r.onet_code).pop()
    return last ? [`- ${r.onet_code}: ${last.problems.join('; ')}`] : []
  })
  return lines.length
    ? `\nYour earlier attempt was rejected by the checker. Fix exactly these (count the words of every option before you answer):\n${lines.join('\n')}\n`
    : ''
}

async function write() {
  const roles = await loadRoles()
  const tasks = (await Bun.file(`${ROOT}/data/onet/tasks.json`).json()).tasks
  const codes = args.includes('--pilot') ? PILOT : opt('--codes')?.split(',')
  let pool_ = codes ? roles.filter((r) => codes.includes(r.onet_code)) : roles
  // write the most useful jobs first: demo jobs, then by job-market demand (research/scenarios/priority.json)
  const order: string[] = existsSync(`${W}/priority.json`)
    ? JSON.parse(readFileSync(`${W}/priority.json`, 'utf8')).order
    : []
  const rank = new Map(order.map((c, i) => [c, i]))
  pool_ = [...pool_].sort((a, b) => (rank.get(a.onet_code) ?? 1e6) - (rank.get(b.onet_code) ?? 1e6))
  if (process.env.ONLY_CHUNKS) {
    // native writers' chunk files: keep only the jobs in chunks A-B, in chunk order
    const [lo, hi] = process.env.ONLY_CHUNKS.split('-').map(Number)
    const codes: string[] = []
    for (let n = lo!; n <= hi!; n++)
      codes.push(
        ...JSON.parse(readFileSync(`${W}/native/chunks/chunk-${String(n).padStart(2, '0')}.json`, 'utf8')).jobs.map(
          (j: any) => j.onet_code
        )
      )
    const byCode = new Map(pool_.map((r) => [r.onet_code, r]))
    pool_ = codes.map((c) => byCode.get(c)).filter((r): r is Role => !!r)
  }
  let budget = Number(opt('--max-batches')) || Infinity
  // up to 3 passes; a retry uses smaller batches so a bad job cannot drag its neighbours down
  for (const size of [BATCH, 3, 1]) {
    const done = new Set([...readJsonl<Job>(WRITTEN), ...readJsonl<any>(PARKED)].map((j) => j.onet_code))
    const pending = pool_.filter((r) => !done.has(r.onet_code))
    if (!pending.length || aborted || budget <= 0) break
    const batches = chunk(pending, size).slice(0, budget)
    budget -= batches.length
    console.log(`write pass size ${size}: ${pending.length} pending, ${batches.length} batches`)
    await pool(batches, async (batch) => {
      try {
        const text = await callWorker(
          WRITE_FAMILY,
          'write',
          WRITE_HEAD + batch.map((r) => jobInput(r, tasks)).join('\n') + feedback(batch),
          900
        )
        let good = 0
        let repaired = 0
        for (const o of parseLines(text)) {
          const r = batch.find((x) => x.onet_code === o?.onet_code)
          if (!r) continue
          let slots = buildSlots(o)
          let bad = slots ? validateJob(slots, r.corners) : ['no slots array']
          // slot-level repair (at most 2 rounds) keeps the passing slots; then the job is parked for the lead
          for (let round = 0; round < 2 && slots && slots.length === 12 && bad.length; round++) {
            const notes = repairNotes(slots, bad)
            if (!notes.size) break
            try {
              slots = await repairSlots(r, slots, notes)
              bad = validateJob(slots, r.corners)
              if (!bad.length) repaired++
            } catch (e) {
              onFail(e)
              break
            }
          }
          if (!bad.length && slots)
            (appendFileSync(
              WRITTEN,
              JSON.stringify({ onet_code: r.onet_code, title: r.title, slots, batch: batch[0]!.onet_code }) + '\n'
            ),
              good++)
          else if (slots && slots.length === 12)
            appendFileSync(PARKED, JSON.stringify({ onet_code: r.onet_code, problems: bad.slice(0, 8) }) + '\n')
          else
            appendFileSync(FAILED, JSON.stringify({ onet_code: r.onet_code, size, problems: bad.slice(0, 6) }) + '\n')
        }
        console.log(`  batch of ${batch.length}: ${good} valid (${repaired} after slot repair)`)
        failures = 0
      } catch (e) {
        onFail(e)
      }
    })
  }
  count()
}

// ---------- reviewing ----------
const REVIEW_HEAD = `You are a strict reviewer of workplace situational-judgement questions for a Malaysian career-check-up app. Do not run any terminal commands. Reply with text only.

Each scenario below has a situation and 4 options, each with a hidden score (4 strongest ... 1 weakest). Judge each scenario. A BLOCKER is only one of these:
(a) the score-4 option is not clearly the best, or the score-1 option is not clearly the worst;
(b) the situation does not test the named skill area or job task, or an option is beyond the job's own authority;
(c) an option is unsafe, misleading or factually wrong, including invented terms or procedures.
Adjacent near-swaps (score 2 versus 3, or 3 versus 4 could trade places) are POLISH, not blockers. Wording, grammar, style, mild length differences are POLISH too. Do not mark POLISH for taste alone. A scenario with no problem is "pass".

Output one JSON object per line per scenario (no code fences, no other text):
{"onet_code":"...","slot":N,"verdict":"pass"|"fix","severity":null|"BLOCKER"|"POLISH","issue":"short reason, empty when pass","fix":null | {"situation":"...","options":[{"text":"...","score":4},...4 entries]}}
Give a "fix" only when you can fix it: keep each option's score, situation at most 40 words, each option at most 20 words, strongest option not longer than the rest. Judge every scenario given; do not skip any.

SCENARIOS:
`

function reviewText(j: Job, slotsWanted?: number[]): string {
  const rows = j.slots
    .filter((s) => !slotsWanted || slotsWanted.includes(s.slot))
    .map((s) => {
      const o = [...s.options]
        .sort((a, b) => b.score - a.score)
        .map((x) => `  score ${x.score}: ${x.text}`)
        .join('\n')
      return `onet_code=${j.onet_code} slot=${s.slot} corner=${s.corner_id} level=${s.level} job="${j.title}"\n situation: ${s.situation}\n${o}`
    })
  return rows.join('\n\n')
}

const MERGE_SEED = 'T4-scenarios-v1' // option order seed, logged here and in the run notes
const hash = (t: string) => [...t].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261)
const SAMPLE_SEED = 20261029 // logged in the run notes; the random 10% sample is repeatable
function seeded(seed: number) {
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32
}

/**
 * --pilot/--codes: every listed job is read by each reviewer in --reviewers (default s0,s1), one job per call.
 * Full run: the demo jobs (and --also) are read by two reviewers; a seeded 20% of the other jobs by ONE reviewer
 * (rotating s0..s7). Always one job per call.
 */
async function review() {
  const jobs = readJsonl<Job>(WRITTEN)
  const reviewed = new Set(readJsonl<any>(REVIEWS).map((r) => `${r.reviewer}|${r.onet_code}`))
  const codes = args.includes('--pilot') ? PILOT : opt('--codes')?.split(',')
  const pair = (opt('--reviewers') ?? 's0,s1').split(',')
  const extra = (opt('--also') ?? '').split(',').filter(Boolean)
  const plan: { reviewer: string; job: Job }[] = []
  const both = (j: Job) =>
    codes ? codes.includes(j.onet_code) : DEMO.includes(j.onet_code) || extra.includes(j.onet_code)
  const list = existsSync(`${W}/review-sample.json`)
    ? JSON.parse(readFileSync(`${W}/review-sample.json`, 'utf8'))
    : null
  const have = new Map(jobs.map((j) => [j.onet_code, j]))
  const sample = codes || !list ? [] : (list.sample as string[]).map((c) => have.get(c)).filter((j): j is Job => !!j)
  for (const j of jobs.filter((j) =>
    codes ? both(j) : list ? list.demo.includes(j.onet_code) || extra.includes(j.onet_code) : both(j)
  ))
    for (const rv of pair) plan.push({ reviewer: rv, job: j })
  sample.forEach((j, i) => plan.push({ reviewer: `s${(i + 2) % 8}`, job: j }))
  const [lo, hi] = (opt('--slots') ?? '0-11').split('-').map(Number)
  const slotsWanted = Array.from({ length: hi! - lo! + 1 }, (_, i) => lo! + i)
  const calls = plan.filter((p) => !reviewed.has(`${p.reviewer}|${p.job.onet_code}`))
  console.log(
    `review calls: ${calls.length}; random 20% sample of ${sample.length} jobs (seed ${SAMPLE_SEED}): ${sample.map((j) => j.onet_code).join(',')}`
  )
  await pool(
    calls,
    async ({ reviewer, job }) => {
      try {
        const text = await callWorker(
          reviewer.startsWith('a') ? 'agy.pro' : REVIEW_FAMILY,
          `review-${reviewer}`,
          REVIEW_HEAD + reviewText(job, slotsWanted),
          900
        )
        for (const o of parseLines(text)) {
          if (o.onet_code !== job.onet_code || typeof o.slot !== 'number') continue
          appendFileSync(
            REVIEWS,
            JSON.stringify({
              reviewer,
              onet_code: o.onet_code,
              slot: o.slot,
              verdict: o.verdict,
              severity: o.verdict === 'pass' ? null : o.severity === 'BLOCKER' ? 'BLOCKER' : 'POLISH',
              issue: o.issue ?? '',
              fix: o.fix ?? null
            }) + '\n'
          )
        }
        failures = 0
      } catch (e) {
        onFail(e)
      }
    },
    REVIEW_CONCURRENCY
  )
  reviewStats()
}

/** A sampled job with a BLOCKER sends its whole writing batch back: drop those jobs so `write` writes them again. */
function redo() {
  const rs = readJsonl<any>(REVIEWS)
  const blocked = new Set(rs.filter((r) => r.severity === 'BLOCKER').map((r) => r.onet_code))
  const jobs = readJsonl<Job & { batch: string }>(WRITTEN)
  const batches = new Set(jobs.filter((j) => blocked.has(j.onet_code)).map((j) => j.batch))
  const keep = jobs.filter((j) => !batches.has(j.batch))
  appendFileSync(
    `${W}/redo-log.jsonl`,
    JSON.stringify({ at: new Date().toISOString(), batches: [...batches], dropped: jobs.length - keep.length }) + '\n'
  )
  writeFileSync(WRITTEN, keep.map((j) => JSON.stringify(j)).join('\n') + (keep.length ? '\n' : ''))
  console.log(JSON.stringify({ batches: batches.size, dropped: jobs.length - keep.length }))
}

function reviewStats() {
  const rs = readJsonl<any>(REVIEWS)
  const key = (r: any) => `${r.onet_code}|${r.slot}`
  const per = [...new Set(rs.map((r) => r.reviewer))].sort().map((rv) => {
    const x = rs.filter((r) => r.reviewer === rv)
    return {
      reviewer: rv,
      scenarios: x.length,
      blocker: x.filter((r) => r.severity === 'BLOCKER').length,
      polish: x.filter((r) => r.severity === 'POLISH').length
    }
  })
  const failed = new Set(rs.filter((r) => r.severity === 'BLOCKER').map(key)) // either reviewer; the lead confirms
  const seen = new Set(rs.map(key))
  console.log(
    JSON.stringify({
      per,
      scenarios_seen: seen.size,
      blocker_scenarios: failed.size,
      blocker_rate: +(failed.size / (seen.size || 1)).toFixed(3)
    })
  )
}

// ---------- self-review: Flash re-reads its own draft and fixes swappable options ----------
const REFINE_HEAD = `You are checking workplace situational-judgement questions for a Malaysian career-check-up app. Do not run any terminal commands. Reply with text only.

Below is one JOB with 12 scenarios; each option has a hidden score (4 strongest ... 1 weakest). For every scenario check:
1. Could any two options swap places (a reasonable person might rank the lower one higher)? Rewrite so the order is clear: each lower option is clearly worse for a stated reason, and the score-4 option is a distinctly better approach, not the score-3 option plus an extra step.
2. Does an option use powers a junior-to-mid person in this job lacks, or state a specific law, rate or fact you are unsure of? Rewrite it within the job's own authority, generic when unsure.
3. Does the situation really test the task it names? If not, rewrite it around that task.
Keep scenarios that are already fine unchanged. Keep each score used exactly once per scenario, situation at most 35 words and 250 characters, options at most 16 words and 120 characters, all four options within 3 words in length, full natural sentences, no words: best, always, never, ignore, immediately, comprehensive, thoroughly, perfect, correct, wrong, guess. Keep the corner_id, level and task_ids.

Output exactly one JSON object on one line (no code fences, no other text) in this shape, with all 12 slots in the same order:
{"onet_code":"...","slots":[{"corner_id":"...","level":"basic","situation":"...","options":[{"text":"...","score":3}, ...4 entries],"task_ids":[123]}, ... 12 entries]}

JOB:
`

async function refine() {
  const roles = new Map((await loadRoles()).map((r) => [r.onet_code, r]))
  const jobs = readJsonl<Job & { batch: string; refined?: boolean }>(WRITTEN)
  const todo = jobs.filter((j) => !j.refined && (args.includes('--pilot') ? PILOT.includes(j.onet_code) : true))
  console.log(`refine: ${todo.length} jobs`)
  let changed = 0
  await pool(todo, async (j) => {
    const r = roles.get(j.onet_code)!
    try {
      const text = await callWorker(
        WRITE_FAMILY,
        'refine',
        REFINE_HEAD +
          `onet_code=${j.onet_code} title="${j.title}"\n` +
          j.slots
            .map(
              (s) =>
                `corner_id=${s.corner_id} level=${s.level} task_ids=${JSON.stringify(s.task_ids)}\n` +
                reviewText({ ...j, slots: [s] })
            )
            .join('\n\n'),
        900
      )
      const o = parseLines(text).find((x) => x?.onet_code === j.onet_code)
      const next = o ? toJob(r, o) : ['no output']
      // a refined job that fails the validator is dropped; the original draft stays
      if (!Array.isArray(next)) {
        Object.assign(j, { slots: next.slots })
        changed++
      }
      j.refined = true
      failures = 0
    } catch (e) {
      onFail(e)
    }
  })
  writeFileSync(WRITTEN, jobs.map((j) => JSON.stringify(j)).join('\n') + '\n')
  console.log(JSON.stringify({ refined_and_valid: changed, of: todo.length }))
}

// ---------- targeted slot rewrites (lead-named blockers/polish), kept in a side file and applied at merge ----------
const SLOT_FIXES = process.env.SLOT_FIXES_FILE ?? `${W}/v5-sonnet/slot-fixes.jsonl`
const FIX_SPECS: { code: string; slot: number; note: string }[] = [
  {
    code: '15-1254.00',
    slot: 7,
    note: 'The score-2 option breaks the situation\'s own "before any coding" rule, so it is worse than the score-1 option. Rewrite so no option breaks a rule stated in the situation and score 1 is the most rule-breaking choice.'
  },
  {
    code: '15-1254.00',
    slot: 8,
    note: 'The score-1 option (video summary) and the score-2 option (wait for a colleague) are not clearly ordered. Rewrite so 1 is clearly worse than 2.'
  },
  {
    code: '23-1012.00',
    slot: 10,
    note: "The score-2 option throws away the copy the judge's notes cite, which is worse than score 1. Rewrite so score 1 is the most harmful and irreversible choice."
  },
  {
    code: '29-1141.00',
    slot: 11,
    note: "The score-4 option leaves today's wrong fluid chart entry uncorrected. The best answer must also fix today's chart."
  },
  {
    code: '47-2111.00',
    slot: 10,
    note: 'The score-2 option (wiring in the cable order) is more dangerous than score 1, and score 3 copies old positions despite different markings. Rewrite so the risky wiring is the score-1 option.'
  },
  {
    code: '47-2111.00',
    slot: 6,
    note: 'The score-1 option ("pull from both ends") is not physically sensible. Make it a believable but poor shortcut.'
  },
  { code: '47-2111.00', slot: 8, note: 'Timber batten versus clip box is a near tie. Make the score order clear.' },
  {
    code: '15-1254.00',
    slot: 3,
    note: 'The score-4 option should include what the score-3 option does right, plus a distinct improvement.'
  },
  {
    code: '15-1254.00',
    slot: 10,
    note: 'The score-4 option should include what the score-3 option does right, plus a distinct improvement.'
  }
]

// ---------- #416: rewrite the slots the strict reviewers flagged (run with WRITE_FAMILY=codex.luna) ----------
const FIX_LIST = `${W}/native/review/fix-list.jsonl`
const DEMO_UNTOUCHED = new Set([...DEMO, '15-1255.00']) // the demo jobs are hand-read and stay as they are

/** Rewrite flagged slots, one call per job, at most 2 rounds (the second only for slots the validator still rejects). `--dry` prints the plan. */
async function fixflagged() {
  const roles = new Map((await loadRoles()).map((r) => [r.onet_code, r]))
  const jobs = new Map(readJsonl<Job>(WRITTEN).map((j) => [j.onet_code, jobWithFixes(j)]))
  const flags = new Map<string, { slot: number; reasons: string[] }[]>()
  for (const f of readJsonl<any>(FIX_LIST)) {
    if (DEMO_UNTOUCHED.has(f.onet_code) || !jobs.has(f.onet_code)) continue
    const list = flags.get(f.onet_code) ?? []
    const cur = list.find((x) => x.slot === f.slot)
    if (cur) cur.reasons.push(`${f.category}: ${f.reason}`)
    else list.push({ slot: f.slot, reasons: [`${f.category}: ${f.reason}`] })
    flags.set(f.onet_code, list)
  }
  const done = new Set(readJsonl<any>(`${W}/native/review/fixflagged-done.jsonl`).map((x) => x.onet_code))
  const todo = [...flags].filter(([c]) => !done.has(c))
  console.log(
    `flagged: ${flags.size} jobs, ${[...flags.values()].reduce((n, l) => n + l.length, 0)} slots; ${todo.length} jobs to do`
  )
  if (args.includes('--dry')) return
  const limit = Number(opt('--max-jobs')) || Infinity
  await pool(todo.slice(0, limit), async ([code, items]) => {
    const role = roles.get(code)!
    let slots = jobs.get(code)!.slots
    const accepted = new Map<number, Slot>()
    let pending = new Map(items.map((i) => [i.slot, i.reasons.join(' | ')]))
    for (let round = 0; round < 2 && pending.size; round++) {
      const cur = [...pending].map(([slot, why]) => {
        const s = slots[slot]!
        return `SLOT ${slot} reviewer comments: ${why}\nCurrent: ${JSON.stringify({ slot, corner_id: s.corner_id, level: s.level, situation: s.situation, options: s.options.map((o) => ({ text: o.text, score: o.score, words: wordCount(o.text) })), task_ids: s.task_ids })}`
      })
      const brief = `Fix workplace situational-judgement questions for a Malaysian career-check-up app. Do not run any terminal commands. Reply with text only.\n\nJob: ${role.title} (${code}). Strict reviewers commented on the slots below. Fix ONLY these kinds of problem: the ranking is unclear (two options could swap, or a lower option reads better than a higher one), the score-4 option is weak or only score 3 plus a step, or the situation does not test the corner's task or goes beyond the job's authority. A comment that only says the score-1 or score-2 option is harmful, unsafe or dishonest is INTENDED: leave that alone (reply {"slot":N,"keep":true}). Score 1 must stay clearly the worst, score 4 clearly the best.\n\nRules for a rewritten slot: situation at most 35 words and 250 characters; exactly 4 options, each a full natural sentence of at most 16 words and 120 characters, with "words" counts within 5 of each other; scores 1 to 4 each once; no words: best, always, never, ignore, immediately, comprehensive, thoroughly, perfect, correct, wrong, guess, "do nothing"; keep corner_id, level and task_ids (task ids must stay from this corner: ${JSON.stringify(role.corners.map((c) => [c.corner_id, c.task_ids]))}).\n\n${cur.join('\n\n')}\n\nOutput one JSON object per slot, one per line, no code fences: either {"slot":N,"keep":true} or {"slot":N,"corner_id":"...","level":"...","situation":"...","options":[{"text":"...","score":3,"words":N}, ...4],"task_ids":[...]}`
      let text: string
      try {
        text = await callWorker(WRITE_FAMILY, 'fixflag', brief, 900)
        failures = 0
      } catch (e) {
        onFail(e)
        return
      }
      const next = [...slots]
      const changed = new Set<number>()
      for (const o of parseLines(text)) {
        if (!pending.has(o?.slot) || o.keep || !Array.isArray(o.options)) continue
        next[o.slot] = {
          slot: o.slot,
          corner_id: o.corner_id,
          level: o.level,
          situation: String(o.situation ?? '').trim(),
          options: o.options.map((x: any, k: number) => ({
            id: 'abcd'[k]!,
            text: String(x?.text ?? '').trim(),
            score: Number(x?.score)
          })),
          task_ids: Array.isArray(o.task_ids) ? o.task_ids.map(Number) : []
        }
        changed.add(o.slot)
      }
      for (const [slot] of pending) if (!changed.has(slot)) pending.delete(slot) // kept as is
      const bad = validateJob(next, role.corners)
      const badSlots = new Set(
        bad.flatMap((m) => (m.match(/^slot (\d+):/) ? [Number(m.match(/^slot (\d+):/)![1])] : []))
      )
      for (const slot of changed) {
        if (badSlots.has(slot)) {
          pending.set(
            slot,
            `${pending.get(slot)} | YOUR LAST REWRITE WAS REJECTED BY THE CHECKER: ${bad.filter((m) => m.startsWith(`slot ${slot}:`)).join('; ')}`
          )
          next[slot] = slots[slot]! // go back to the original for the next round
        } else {
          accepted.set(slot, next[slot]!)
          pending.delete(slot)
        }
      }
      slots = next
      // job-level problems (e.g. score 4 longest in too many slots) undo the accepted slots of this job
      if (validateJob(slots, role.corners).length) {
        for (const slot of accepted.keys()) slots[slot] = jobs.get(code)!.slots[slot]!
        accepted.clear()
        break
      }
    }
    for (const [slot, s] of accepted)
      appendFileSync(SLOT_FIXES, JSON.stringify({ onet_code: code, slot, slot_obj: s, source: 'flag-fix' }) + '\n')
    appendFileSync(
      `${W}/native/review/fixflagged-done.jsonl`,
      JSON.stringify({ onet_code: code, flagged: items.length, rewritten: accepted.size }) + '\n'
    )
    console.log(`${code}: ${accepted.size} of ${items.length} slots rewritten`)
  })
}

/** native/review/fixflagged-sample.md: 10 random (seeded) rewritten slots, before and after, for the lead's hand-read. */
function fixSample() {
  const raw = new Map(readJsonl<Job>(WRITTEN).map((j) => [j.onet_code, j]))
  const fixes = readJsonl<any>(SLOT_FIXES).filter((f) => f.source === (opt('--source') ?? 'flag-fix'))
  const flags = readJsonl<any>(FIX_LIST)
  const rnd = seeded(SAMPLE_SEED)
  const pick = [...fixes]
    .sort((a, b) => `${a.onet_code}${a.slot}`.localeCompare(`${b.onet_code}${b.slot}`))
    .sort(() => rnd() - 0.5)
    .slice(0, 10)
  const show = (s: Slot) =>
    [
      `Situation: ${s.situation}`,
      ...[...s.options].sort((a, b) => b.score - a.score).map((o) => `- ${o.score}: ${o.text}`)
    ].join('\n')
  const out = [
    '# Rewritten slots: 10 at random, before and after\n',
    `${fixes.length} slots were rewritten in total.\n`
  ]
  for (const f of pick) {
    const before = raw.get(f.onet_code)!.slots[f.slot]!
    out.push(`\n## ${f.onet_code} ${raw.get(f.onet_code)!.title}, slot ${f.slot}\n`)
    for (const x of flags.filter((x) => x.onet_code === f.onet_code && x.slot === f.slot))
      out.push(`Flag (${x.category}): ${x.reason}\n`)
    out.push(`**Before**\n\n${show(before)}\n\n**After**\n\n${show(f.slot_obj)}\n`)
  }
  writeFileSync(`${W}/native/review/${opt('--out') ?? 'fixflagged-sample.md'}`, out.join('\n') + '\n')
  console.log(`wrote ${pick.length} of ${fixes.length} rewritten slots`)
}

// ---------- #416: Haiku packs for the flagged slots Luna could not fix ----------
const HAIKU_DIR = `${W}/native/review/haiku-packs`
const slotKey = (code: string, slot: number) => `${code}|${slot}`

/** Flagged slots still unchanged that Luna did NOT answer "keep" for, with the checker's last complaint on its last rewrite. */
async function failedSlots() {
  const { readdirSync } = await import('node:fs')
  const roles = new Map((await loadRoles()).map((r) => [r.onet_code, r]))
  const jobs = new Map(readJsonl<Job>(WRITTEN).map((j) => [j.onet_code, jobWithFixes(j)]))
  const fixed = new Set(
    readJsonl<any>(SLOT_FIXES)
      .filter((f) => f.source === 'flag-fix')
      .map((f) => slotKey(f.onet_code, f.slot))
  )
  const keep = new Set<string>()
  const last = new Map<string, any>() // latest rewrite Luna produced for a slot
  const briefs = readdirSync(`${W}/briefs`)
    .filter((f) => f.startsWith('fixflag'))
    .sort()
  for (const b of briefs) {
    const out = `${W}/raw/${b.replace(/\.md$/, '.out')}`
    if (!existsSync(out)) continue
    const code = readFileSync(`${W}/briefs/${b}`, 'utf8').match(/Job: .*?\(([0-9.-]+)\)/)?.[1]
    if (!code) continue
    for (const o of parseLines(readFileSync(out, 'utf8'))) {
      if (typeof o.slot !== 'number') continue
      if (o.keep) keep.add(slotKey(code, o.slot))
      else if (Array.isArray(o.options)) last.set(slotKey(code, o.slot), o)
    }
  }
  const out: { code: string; slot: number; reasons: string[]; complaint: string }[] = []
  const flags = new Map<string, string[]>()
  for (const f of readJsonl<any>(FIX_LIST)) {
    if (DEMO_UNTOUCHED.has(f.onet_code) || !jobs.has(f.onet_code)) continue
    flags.set(slotKey(f.onet_code, f.slot), [
      ...(flags.get(slotKey(f.onet_code, f.slot)) ?? []),
      `${f.category}: ${f.reason}`
    ])
  }
  for (const [k, reasons] of flags) {
    if (fixed.has(k) || keep.has(k)) continue
    const [code, slotText] = k.split('|')
    const slot = Number(slotText)
    let complaint = "no rewrite came back, or the job-level rule undid the job's rewrites"
    const o = last.get(k)
    if (o) {
      const next = [...jobs.get(code!)!.slots]
      next[slot] = {
        slot,
        corner_id: o.corner_id,
        level: o.level,
        situation: String(o.situation ?? '').trim(),
        options: o.options.map((x: any, i: number) => ({
          id: 'abcd'[i]!,
          text: String(x?.text ?? '').trim(),
          score: Number(x?.score)
        })),
        task_ids: Array.isArray(o.task_ids) ? o.task_ids.map(Number) : []
      }
      const bad = validateJob(next, roles.get(code!)!.corners)
      const mine = bad.filter((m) => m.startsWith(`slot ${slot}:`) || !m.startsWith('slot '))
      if (mine.length) complaint = mine.join('; ')
    }
    out.push({ code: code!, slot, reasons, complaint })
  }
  return out
}

async function haikuPacks() {
  const roles = new Map((await loadRoles()).map((r) => [r.onet_code, r]))
  const jobs = new Map(readJsonl<Job>(WRITTEN).map((j) => [j.onet_code, jobWithFixes(j)]))
  const failed = await failedSlots()
  const byJob = new Map<string, typeof failed>()
  for (const f of failed) byJob.set(f.code, [...(byJob.get(f.code) ?? []), f])
  mkdirSync(`${HAIKU_DIR}/../haiku-out`, { recursive: true })
  const packs = chunk([...byJob], 6)
  packs.forEach((p, i) => {
    const n = String(i + 1).padStart(2, '0')
    const body = p.map(([code, items]) => {
      const role = roles.get(code)!
      const cur = items.map((f) => {
        const s = jobs.get(code)!.slots[f.slot]!
        return `SLOT ${f.slot} reviewer comments: ${f.reasons.join(' | ')}\nChecker complaint on the last attempt: ${f.complaint}\nCurrent: ${JSON.stringify({ slot: f.slot, corner_id: s.corner_id, level: s.level, situation: s.situation, options: s.options.map((o) => ({ text: o.text, score: o.score, words: wordCount(o.text) })), task_ids: s.task_ids })}`
      })
      return `### Job ${role.title} (${code}); corner task ids: ${JSON.stringify(role.corners.map((c) => [c.corner_id, c.task_ids]))}\n\n${cur.join('\n\n')}`
    })
    const text = `# Pack ${n}: fix workplace situational-judgement questions

You fix questions for a Malaysian career-check-up app. Strict reviewers commented on the slots below, and an earlier attempt failed the checker. Fix ONLY these kinds of problem: the ranking is unclear (two options could swap, or a lower option reads better than a higher one), the score-4 option is weak or only score 3 plus a step, or the situation does not test the corner's task or goes beyond the job's authority. A comment that only says the score-1 or score-2 option is harmful, unsafe or dishonest is INTENDED: skip that slot. Score 1 must stay clearly the worst, score 4 clearly the best.

Rules for a rewritten slot: situation at most 35 words and 250 characters; exactly 4 options, each a full natural sentence of at most 16 words and 120 characters, whose word counts are within 5 of each other; scores 1 to 4 each once; never use the words best, always, never, ignore, immediately, comprehensive, thoroughly, perfect, correct, wrong, guess, "do nothing"; keep corner_id, level and task_ids (task ids only from that corner's list).

## Your output
Write one JSON line per rewritten slot to ${W}/native/review/haiku-out/pack-${n}.jsonl (append as you go, no code fences), exactly:
{"onet_code":"...","slot":N,"corner_id":"...","level":"...","situation":"...","options":[{"text":"...","score":3}, ...4 entries],"task_ids":[...]}
Then run this and fix every REJECT line until it is clean (a job's slots are checked together):
cd ${ROOT} && bun scripts/scenarios/run.ts applyhaiku --check --file ${W}/native/review/haiku-out/pack-${n}.jsonl
Rules for you: no web search, no git, write only that output file, run only that command. Reply with only the number of lines written and whether the check is clean.

## Slots

${body.join('\n\n')}
`
    writeFileSync(`${HAIKU_DIR}/pack-${n}.md`, text)
  })
  console.log(JSON.stringify({ packs: packs.length, jobs: byJob.size, slots: failed.length }))
}

/** Validate Haiku lines (jobs checked with all their rewrites together); with --check only print, else append to the slot fixes. */
async function applyHaiku() {
  const { readdirSync } = await import('node:fs')
  const roles = new Map((await loadRoles()).map((r) => [r.onet_code, r]))
  const jobs = new Map(readJsonl<Job>(WRITTEN).map((j) => [j.onet_code, jobWithFixes(j)]))
  const dir = `${W}/native/review/haiku-out`
  const files = opt('--file')
    ? [opt('--file')!]
    : existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => f.endsWith('.jsonl'))
          .sort()
          .map((f) => `${dir}/${f}`)
      : []
  const have = new Set(
    readJsonl<any>(SLOT_FIXES)
      .filter((f) => f.source === 'haiku-fix')
      .map((f) => slotKey(f.onet_code, f.slot))
  )
  let applied = 0
  let rejected = 0
  for (const file of files) {
    const byJob = new Map<string, any[]>()
    for (const o of readJsonl<any>(file))
      if (o?.onet_code && typeof o.slot === 'number') byJob.set(o.onet_code, [...(byJob.get(o.onet_code) ?? []), o])
    for (const [code, lines] of byJob) {
      const job = jobs.get(code)
      if (!job) {
        console.log(`REJECT ${code}: unknown job`)
        rejected++
        continue
      }
      const next = [...job.slots]
      for (const o of lines) {
        if (!Array.isArray(o.options) || o.slot < 0 || o.slot > 11) continue
        next[o.slot] = {
          slot: o.slot,
          corner_id: o.corner_id,
          level: o.level,
          situation: String(o.situation ?? '').trim(),
          options: o.options.map((x: any, i: number) => ({
            id: 'abcd'[i]!,
            text: String(x?.text ?? '').trim(),
            score: Number(x?.score)
          })),
          task_ids: Array.isArray(o.task_ids) ? o.task_ids.map(Number) : []
        }
      }
      const bad = validateJob(next, roles.get(code)!.corners)
      if (bad.length) {
        console.log(`REJECT ${code}: ${bad.slice(0, 5).join('; ')}`)
        rejected++
        continue
      }
      if (args.includes('--check')) continue
      for (const o of lines)
        if (!have.has(slotKey(code, o.slot)) && next[o.slot] !== job.slots[o.slot])
          (appendFileSync(
            SLOT_FIXES,
            JSON.stringify({ onet_code: code, slot: o.slot, slot_obj: next[o.slot], source: 'haiku-fix' }) + '\n'
          ),
            applied++)
    }
  }
  console.log(JSON.stringify({ applied, rejected_jobs: rejected }))
  if (rejected) process.exitCode = 1
}

async function fixslots() {
  const roles = new Map((await loadRoles()).map((r) => [r.onet_code, r]))
  const jobs = new Map(readJsonl<Job>(WRITTEN).map((j) => [j.onet_code, j]))
  const done = new Set(readJsonl<any>(SLOT_FIXES).map((f) => `${f.onet_code}|${f.slot}`))
  const todo = FIX_SPECS.filter((f) => !done.has(`${f.code}|${f.slot}`))
  await pool(
    todo,
    async (f) => {
      const job = jobs.get(f.code)!
      const s = job.slots[f.slot]!
      const text = await callWorker(
        WRITE_FAMILY,
        'fixslot',
        `Rewrite ONE workplace situational-judgement scenario for a Malaysian career-check-up app. Do not run any terminal commands. Reply with text only.\n\nJob: ${job.title}. Problem found by a reviewer: ${f.note}\n\nRules: situation at most 35 words and 250 characters; exactly 4 options, each a full natural sentence of at most 16 words and 120 characters, within 3 words of each other; scores 1 to 4 each once (4 clearly best, 1 clearly worst: the most harmful, irreversible or rule-breaking choice); weak options must sound like reasonable shortcuts and not announce their weakness; no words: best, always, never, ignore, immediately, comprehensive, thoroughly, perfect, correct, wrong, guess; only facts you are sure of; stay inside the job's own authority; keep corner_id, level and task_ids.\n\nCurrent scenario:\n${JSON.stringify({ corner_id: s.corner_id, level: s.level, situation: s.situation, options: s.options.map((o) => ({ text: o.text, score: o.score })), task_ids: s.task_ids })}\n\nOutput exactly one JSON object on one line (no code fences) with the same keys: corner_id, level, situation, options (4 of {text, score}), task_ids.`,
        600
      )
      const o = parseLines(text)[0]
      if (!o) return console.error(`fixslot ${f.code} ${f.slot}: no output`)
      const next = structuredClone(job)
      next.slots[f.slot] = {
        slot: f.slot,
        corner_id: o.corner_id,
        level: o.level,
        situation: String(o.situation ?? '').trim(),
        options: (o.options ?? []).map((x: any, k: number) => ({
          id: 'abcd'[k]!,
          text: String(x.text).trim(),
          score: Number(x.score)
        })),
        task_ids: (o.task_ids ?? []).map(Number)
      }
      const bad = validateJob(next.slots, roles.get(f.code)!.corners)
      if (bad.length) return console.error(`fixslot ${f.code} ${f.slot}: ${bad.join('; ')}`)
      appendFileSync(
        SLOT_FIXES,
        JSON.stringify({ onet_code: f.code, slot: f.slot, slot_obj: next.slots[f.slot] }) + '\n'
      )
      console.log(`fixed ${f.code} slot ${f.slot}`)
    },
    4
  )
}

// ---------- native writers: validate their output files and fold them into write-results ----------
/** Accepts the writers' format ({onet_code, slots:[{corner_id, level, situation, options:[{text, score}], task_ids}]}) and the stored one. */
async function validateFile() {
  const file = opt('--file')
  if (!file) return void console.error('usage: validate --file <out.jsonl> [--chunk <chunk.json>]')
  const roles = new Map((await loadRoles()).map((r) => [r.onet_code, r]))
  const rejects: string[] = []
  const good = new Set<string>()
  let lines = 0
  for (const raw of existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : []) {
    lines++
    let o: any
    try {
      o = JSON.parse(raw)
    } catch {
      rejects.push(`line ${lines}: not JSON`)
      continue
    }
    const r = roles.get(o?.onet_code)
    if (!r) {
      rejects.push(`line ${lines}: unknown or out-of-scope onet_code ${o?.onet_code}`)
      continue
    }
    const j = toJob(r, o)
    if (Array.isArray(j)) rejects.push(`${r.onet_code}: ${j.slice(0, 5).join('; ')}`)
    else if (good.has(r.onet_code)) rejects.push(`${r.onet_code}: duplicate job line`)
    else good.add(r.onet_code)
  }
  const chunk = opt('--chunk')
  if (chunk) {
    const want: string[] = JSON.parse(readFileSync(chunk, 'utf8')).jobs.map((j: any) => j.onet_code)
    const missing = want.filter((c) => !good.has(c))
    if (missing.length) rejects.push(`missing or invalid jobs: ${missing.join(', ')}`)
  }
  console.log(`${good.size} valid of ${lines} lines`)
  for (const r of rejects) console.log(`REJECT ${r}`)
  if (rejects.length) process.exitCode = 1
}

/** Append every valid job in native/out/*.jsonl to WRITTEN (skipping codes already there). */
async function concat() {
  const { readdirSync } = await import('node:fs')
  const dir = `${W}/native/out`
  const roles = new Map((await loadRoles()).map((r) => [r.onet_code, r]))
  const have = new Set(readJsonl<Job>(WRITTEN).map((j) => j.onet_code))
  let added = 0
  const luna = `${W}/native/out-luna/write-results.jsonl`
  const sources = [
    ...readdirSync(dir)
      .filter((f) => f.endsWith('.jsonl'))
      .sort()
      .map((f) => [f, `${dir}/${f}`]),
    ...(existsSync(luna) ? [['luna', luna]] : [])
  ]
  for (const [f, path] of sources as [string, string][]) {
    for (const o of readJsonl<any>(path)) {
      const r = roles.get(o?.onet_code)
      const j = r && !have.has(r.onet_code) ? toJob(r, o) : null
      if (!j || Array.isArray(j)) continue
      appendFileSync(WRITTEN, JSON.stringify({ ...j, batch: f }) + '\n')
      have.add(r!.onet_code)
      added++
    }
  }
  console.log(JSON.stringify({ added, total: have.size }))
}

// ---------- review preparation (no model calls) ----------
const jobWithFixes = (j: Job): Job => {
  const fixes = new Map(readJsonl<any>(SLOT_FIXES).map((f) => [`${f.onet_code}|${f.slot}`, f.slot_obj as Slot]))
  return { ...j, slots: j.slots.map((s) => fixes.get(`${j.onet_code}|${s.slot}`) ?? s) }
}

/** review-sample.json: the 7 demo jobs (two reviewers each) plus a seeded 10% of the other in-scope jobs (one reviewer each). */
async function sampleList() {
  const demo = [...DEMO, '15-1255.00']
  const codes = (await loadRoles()).map((r) => r.onet_code).sort()
  const rnd = seeded(SAMPLE_SEED)
  const rest = codes.filter((c) => !demo.includes(c) && !PILOT.includes(c)) // the 5 pilot jobs were hand-read already
  const sample = rest.filter(() => rnd() < 0.1)
  writeFileSync(`${W}/review-sample.json`, JSON.stringify({ seed: SAMPLE_SEED, demo, sample }, null, 1) + '\n')
  console.log(JSON.stringify({ demo: demo.length, sample: sample.length, seed: SAMPLE_SEED }))
}

/** readable.md for a list of codes (--codes a,b or --sample), with scores and any reviews: for the lead's hand-read. */
function readable() {
  const list = JSON.parse(readFileSync(`${W}/review-sample.json`, 'utf8'))
  const codes: string[] = opt('--codes')?.split(',') ?? [...list.demo, ...list.sample]
  const jobs = new Map(readJsonl<Job>(WRITTEN).map((j) => [j.onet_code, jobWithFixes(j)]))
  const rs = readJsonl<any>(REVIEWS)
  const out = [
    '# Scenarios for hand-read\n',
    'Options best first with hidden scores; reviewer flags follow each scenario.\n'
  ]
  for (const c of codes) {
    const j = jobs.get(c)
    if (!j) {
      out.push(`\n## ${c} (not written)\n`)
      continue
    }
    out.push(`\n## ${c} ${j.title}\n`)
    for (const s of j.slots) {
      out.push(
        `\n**Slot ${s.slot}** \`${s.corner_id}\` (${s.level}), tasks ${s.task_ids.join(',')}\n\nSituation: ${s.situation}\n`
      )
      for (const o of [...s.options].sort((a, b) => b.score - a.score)) out.push(`- ${o.score}: ${o.text}`)
      for (const r of rs.filter((x) => x.onet_code === c && x.slot === s.slot && x.severity))
        out.push(`- **${r.severity}** (${r.reviewer}): ${r.issue}`)
    }
  }
  const file = opt('--out') ?? `${W}/readable.md`
  writeFileSync(file, out.join('\n') + '\n')
  console.log(`wrote ${codes.length} jobs to ${file}`)
}

/** native/review/review-NN.md: REVIEW_HEAD plus up to 5 jobs each; demo jobs appear in two packs (two reviewers). */
function reviewPack() {
  const list = JSON.parse(readFileSync(`${W}/review-sample.json`, 'utf8'))
  const jobs = new Map(readJsonl<Job>(WRITTEN).map((j) => [j.onet_code, jobWithFixes(j)]))
  const dir = `${W}/native/review`
  mkdirSync(`${dir}/out`, { recursive: true })
  const have = (c: string) => jobs.has(c)
  const a: string[] = [...list.demo, ...list.sample].filter(have)
  const b: string[] = list.demo.filter(have) // second reviewer for demo jobs
  const packs = [...chunk(a, 5), ...chunk(b, 5)]
  packs.forEach((p, i) => {
    const n = String(i + 1).padStart(2, '0')
    const body = REVIEW_HEAD + p.map((c) => reviewText(jobs.get(c)!)).join('\n\n') + '\n'
    writeFileSync(
      `${dir}/review-${n}.md`,
      body +
        `\nWrite your output lines (one JSON object per scenario, the format above, no code fences) to ${dir}/out/review-${n}.jsonl, one line per scenario, appended as you go. Judge every scenario given. Do not run any command except writing that file.\n`
    )
  })
  console.log(
    JSON.stringify({
      packs: packs.length,
      jobs: a.length,
      missing: [...list.demo, ...list.sample].filter((c) => !have(c)).length
    })
  )
}

/** Fold native/review/out/*.jsonl and out-sol/*.jsonl (reviewer id = file name, "sol-" + name for out-sol) into REVIEWS; print the blocker rate by source. */
async function reviewFold() {
  const { readdirSync } = await import('node:fs')
  for (const [sub, prefix] of [
    ['out', ''],
    ['out-sol', 'sol-']
  ] as const) {
    const dir = `${W}/native/review/${sub}`
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir)
      .filter((x) => x.endsWith('.jsonl'))
      .sort()) {
      const id = prefix + f
      const done = new Set(
        readJsonl<any>(REVIEWS)
          .filter((r) => r.reviewer === id)
          .map((r) => `${r.onet_code}|${r.slot}`)
      )
      for (const o of readJsonl<any>(`${dir}/${f}`)) {
        if (typeof o.slot !== 'number' || done.has(`${o.onet_code}|${o.slot}`)) continue
        appendFileSync(
          REVIEWS,
          JSON.stringify({
            reviewer: id,
            onet_code: o.onet_code,
            slot: o.slot,
            verdict: o.verdict,
            severity: o.verdict === 'pass' ? null : o.severity === 'BLOCKER' ? 'BLOCKER' : 'POLISH',
            issue: o.issue ?? '',
            fix: o.fix ?? null
          }) + '\n'
        )
      }
    }
  }
  const codesIn = (path: string) => new Set(existsSync(path) ? readJsonl<any>(path).map((j) => j.onet_code) : [])
  const sonnet = new Set<string>()
  for (const f of readdirSync(`${W}/native/out`).filter((x) => x.endsWith('.jsonl')))
    for (const c of codesIn(`${W}/native/out/${f}`)) sonnet.add(c as string)
  const luna = codesIn(`${W}/native/out-luna/write-results.jsonl`)
  const source = (c: string) =>
    PILOT.includes(c) ? 'pilot' : sonnet.has(c) ? 'sonnet-01-12' : luna.has(c) ? 'luna-13-36' : 'other'
  const rs = readJsonl<any>(REVIEWS)
  const by: Record<string, { jobs: Set<string>; seen: Set<string>; blockers: Set<string> }> = {}
  for (const r of rs) {
    const b = (by[source(r.onet_code)] ??= { jobs: new Set(), seen: new Set(), blockers: new Set() })
    const k = `${r.onet_code}|${r.slot}`
    b.jobs.add(r.onet_code)
    b.seen.add(k)
    if (r.severity === 'BLOCKER') b.blockers.add(k)
  }
  const rate = Object.fromEntries(
    Object.entries(by).map(([k, v]) => [
      k,
      {
        jobs: v.jobs.size,
        scenarios: v.seen.size,
        blocker_scenarios: v.blockers.size,
        rate: +(v.blockers.size / (v.seen.size || 1)).toFixed(3)
      }
    ])
  )
  const all = new Set(rs.map((r) => `${r.onet_code}|${r.slot}`))
  const bl = new Set(rs.filter((r) => r.severity === 'BLOCKER').map((r) => `${r.onet_code}|${r.slot}`))
  console.log(
    JSON.stringify({
      overall: { scenarios: all.size, blocker_scenarios: bl.size, rate: +(bl.size / (all.size || 1)).toFixed(3) },
      by_source: rate
    })
  )
  const list = rs.filter(
    (r) => r.severity === 'BLOCKER' && ['sonnet-01-12', 'luna-13-36', 'other'].includes(source(r.onet_code))
  )
  for (const r of list)
    console.log(
      `BLOCKER ${r.onet_code} slot ${r.slot} [${source(r.onet_code)}] ${r.reviewer}: ${String(r.issue).slice(0, 160)}`
    )
}

// ---------- apply fixes, merge, count ----------
/** Apply a POLISH fix only when the fixed job still passes the validator and both reviewers did not call the scenario a pass. */
async function apply() {
  const roles = new Map((await loadRoles()).map((r) => [r.onet_code, r]))
  const jobs = new Map(readJsonl<Job>(WRITTEN).map((j) => [j.onet_code, j]))
  const rs = readJsonl<any>(REVIEWS)
  const passed = new Set(rs.filter((r) => r.verdict === 'pass').map((r) => `${r.onet_code}|${r.slot}`))
  let applied = 0
  let skipped = 0
  const blockers = new Set(rs.filter((x) => x.severity === 'BLOCKER').map((x) => `${x.onet_code}|${x.slot}`))
  for (const r of rs.filter((x) => x.severity === 'POLISH' && x.fix)) {
    const j = jobs.get(r.onet_code)
    if (!j || passed.has(`${r.onet_code}|${r.slot}`) || blockers.has(`${r.onet_code}|${r.slot}`)) {
      skipped++ // one reviewer passed it or it has a blocker: left to the lead
      continue
    }
    const next = structuredClone(j)
    const s = next.slots[r.slot]!
    s.situation = String(r.fix.situation ?? s.situation).trim()
    s.options = r.fix.options.map((x: any, k: number) => ({
      id: 'abcd'[k]!,
      text: String(x.text).trim(),
      score: Number(x.score)
    }))
    if (validateJob(next.slots, roles.get(r.onet_code)!.corners).length === 0) (jobs.set(r.onet_code, next), applied++)
    else skipped++
  }
  writeFileSync(WRITTEN, [...jobs.values()].map((j) => JSON.stringify(j)).join('\n') + '\n')
  console.log(JSON.stringify({ applied, skipped }))
}

function merge() {
  // data/generated/scenarios.json: roles[onet][corner_id] = { basic, advanced } (slot 2i basic, 2i + 1 advanced, #352)
  const roles: Record<string, Record<string, Record<string, unknown>>> = {}
  const fixes = new Map(readJsonl<any>(SLOT_FIXES).map((f) => [`${f.onet_code}|${f.slot}`, f.slot_obj as Slot]))
  for (const j of readJsonl<Job>(WRITTEN).sort((a, b) => a.onet_code.localeCompare(b.onet_code))) {
    for (const s0 of j.slots) {
      const { slot, options, corner_id, level, situation, task_ids } = fixes.get(`${j.onet_code}|${s0.slot}`) ?? s0
      // ids a-d are assigned after a seeded shuffle (by job and slot) so the letters never reveal the rank
      const rnd = seeded(hash(`${MERGE_SEED}|${j.onet_code}|${slot}`))
      const order = [...options]
      for (let i = order.length - 1; i > 0; i--) {
        const k = Math.floor(rnd() * (i + 1))
        ;[order[i], order[k]] = [order[k]!, order[i]!]
      }
      ;((roles[j.onet_code] ??= {})[corner_id] ??= {})[level] = {
        situation: situation.replace(/\s*What would you do\??\s*$/i, '').trim(),
        options: order.map((o, i) => ({ id: 'abcd'[i]!, text: o.text, score: o.score })),
        task_ids
      }
    }
  }
  const meta = {
    model: 'Claude Sonnet (Google-hosted and native) and GPT fast',
    reviewers: ['Gemini flagship', 'Claude Sonnet', 'GPT coder'],
    generated_at: new Date().toISOString().slice(0, 10),
    quality: 'auto-generated'
  }
  const file = ScenariosFileSchema.parse({ meta, roles })
  writeFileSync(OUT, JSON.stringify(file, null, 1) + '\n')
  console.log(`wrote ${Object.keys(roles).length} jobs to ${OUT}`)
}

async function count() {
  const n = (await loadRoles()).length
  const done = new Set(readJsonl<Job>(WRITTEN).map((j) => j.onet_code))
  const rejects = readJsonl<any>(FAILED)
  const reasons: Record<string, number> = {}
  for (const r of rejects)
    for (const p of r.problems)
      reasons[String(p).replace(/slot \d+: /, '')] = (reasons[String(p).replace(/slot \d+: /, '')] ?? 0) + 1
  console.log(
    JSON.stringify({
      roles: n,
      valid: done.size,
      pct: +((done.size / n) * 100).toFixed(1),
      rejected_runs: rejects.length,
      reasons
    })
  )
}

const cmd = args[0]
if (cmd === 'write') await write()
else if (cmd === 'review') await review()
else if (cmd === 'redo') redo()
else if (cmd === 'refine') await refine()
else if (cmd === 'validate') await validateFile()
else if (cmd === 'sample') await sampleList()
else if (cmd === 'readable') readable()
else if (cmd === 'reviewpack') reviewPack()
else if (cmd === 'reviewfold') await reviewFold()
else if (cmd === 'concat') await concat()
else if (cmd === 'fixslots') await fixslots()
else if (cmd === 'fixflagged') await fixflagged()
else if (cmd === 'fixsample') fixSample()
else if (cmd === 'haikupacks') await haikuPacks()
else if (cmd === 'applyhaiku') await applyHaiku()
else if (cmd === 'apply') await apply()
else if (cmd === 'merge') merge()
else if (cmd === 'count') await count()
else
  console.error(
    'usage: run.ts write|validate|concat|refine|review|redo|apply|merge|count [--pilot] [--codes a,b] [--max-batches N] [--concurrency N]'
  )
if (aborted) process.exit(1)
