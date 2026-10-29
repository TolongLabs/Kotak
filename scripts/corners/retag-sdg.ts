// #408: checks every SDG tag in data/generated/role-corners.json against its target's UN text, then retags the misfits.
// Claude Haiku 5.5 judges each (corner, target) tag, a role per request (Claude Sonnet 5.5 takes any role Haiku can't
// answer); Claude Sonnet 5.5 then checks a sample of the changes and every tag the #391 review flagged. The fit rule is
// FIT_RULE below; docs/sdg-retag-review.md has the run.
//
//   bun scripts/corners/retag-sdg.ts judge [--codes 19-2011.00,...] [--concurrency 8]   Haiku 5.5, every role
//   bun scripts/corners/retag-sdg.ts sample                                              picks the review sample
//   bun scripts/corners/retag-sdg.ts review                                              Sonnet 5.5 on the sample
//   bun scripts/corners/retag-sdg.ts recheck [--fixes <file>]                            Sonnet 5.5, second review's targets
//   bun scripts/corners/retag-sdg.ts reasons [--fixes <file>]                            Sonnet 5.5, added tags' reasons
//   bun scripts/corners/retag-sdg.ts apply [--fixes <file>]                              writes role-corners.json
//   bun scripts/corners/retag-sdg.ts report                                              counts, before and after
//
// Answers are cached under --dir (default /tmp/kotak-orch/408), outside the repo, one file per request keyed by a hash of
// the request, so a rerun only sends what is missing and `apply` is deterministic from the cache. --cap stops new
// requests once the cached answers have cost that many US dollars. The input is always the AI batch's file from git,
// never the working file, so a retagged file is never retagged again. A corner keeps the tags judged to fit; one that
// lost a tag gets the judge's best-fitting target, always a row of data/sdg-reasons.json. `--fixes` is a JSON object of
// accepted review fixes, `{ "<onet_code>|<corner_id>": ["7.3"] }`. The recheck then judges the second review's targets
// again (RECHECK_TASK). Last, a target added to a corner, other than 4.4 and 8.5, stays only if its reason in
// data/sdg-reasons.json, which Kotak shows beside it, is true of the corner; a corner left with none gets 4.4.
// API docs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs,
// https://platform.claude.com/docs/en/build-with-claude/prompt-caching, https://platform.claude.com/docs/en/api/rate-limits

import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { OnetOccupationsFileSchema, OnetTasksFileSchema } from '../../packages/shared/src/data/onet'
import { RoleCornersSchema, type OccupationCorners } from '../../packages/shared/src/data/role-corners'
import { SdgReasonsFileSchema } from '../../packages/shared/src/data/sdg-reasons'
import { writeRecordsJson } from './io'

const ROOT = resolve(import.meta.dir, '../..')
const CORNERS_FILE = `${ROOT}/data/generated/role-corners.json`
const { values: args, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    dir: { type: 'string', default: '/tmp/kotak-orch/408' },
    codes: { type: 'string' },
    concurrency: { type: 'string', default: '8' },
    cap: { type: 'string', default: '3' },
    fixes: { type: 'string' }
  },
  allowPositionals: true
})
const DIR = resolve(args.dir)
const CAP_USD = Number(args.cap)

const JUDGE = { model: 'claude-haiku-5-5', effort: 'medium', dir: `${DIR}/haiku` } as const
const REVIEWER = { model: 'claude-sonnet-5-5', effort: 'medium', dir: `${DIR}/sonnet` } as const
/** Judges a role Haiku can't answer in ATTEMPTS tries, such as one its safety classifier refuses. */
const JUDGE_FALLBACK = { ...REVIEWER, dir: `${DIR}/haiku-fallback` } as const
const REASONER = { ...REVIEWER, dir: `${DIR}/reasons` } as const
const RECHECKER = { ...REVIEWER, dir: `${DIR}/recheck` } as const
type Caller = { model: string; effort: 'medium'; dir: string }
/** US dollars per million tokens, for prompts up to 100K tokens: https://platform.claude.com/docs/en/about-claude/pricing */
const PRICES: Record<string, { input: number; cache_write: number; cache_read: number; output: number }> = {
  'claude-haiku-5-5': { input: 0.1, cache_write: 0.125, cache_read: 0.01, output: 0.5 },
  'claude-sonnet-5-5': { input: 2, cache_write: 2.5, cache_read: 0.1, output: 10 }
}
const ATTEMPTS = 3
/** Sonnet checks each changed corner in groups of this many. */
const REVIEW_GROUP = 6
/** Pairs per reason-check request. */
const REASON_GROUP = 12
/** Corners per recheck request. */
const RECHECK_GROUP = 8
/** At least this many changed corners go to the review, besides the flagged tags. */
const SAMPLE_SIZE = 60

const FIT_RULE = `Keep a tag only where the target's UN text supports the corner's own statements and O*NET tasks.

That means doing the work this corner's can-do statements and tasks describe directly contributes to something the target's UN text asks for, so a reader who sees only this corner and the target's text would agree the link is real. Judge the corner, not the job: the job's sector or its other duties don't count. A link that needs an extra assumption does not fit: a shared keyword, a benefit several steps away, or a benefit to people the target is not about. Measuring, testing or monitoring the very thing a target's text is about does count, since the target needs that evidence (testing water for pollution under 6.3); measuring something else does not.

The targets that carry most tags:
- 4.4 (relevant skills for employment, decent jobs and entrepreneurship): the user is building this skill for paid work, so it fits any corner that is a skill used in a job.
- 8.5 (full and productive employment and decent work): fits any corner that is a skill for productive paid work, as 4.4 does.
- 8.2 (productivity through diversification, technological upgrading and innovation): fits where the corner uses or improves technology, machines, software, data or methods in a way that raises output or efficiency, or develops new products or processes. Not routine clerical, care, interpersonal or manual work.
- 8.8 (labour rights and safe and secure working environments for all workers): fits only where the corner's statements or tasks are about workers' own safety, health or rights: workplace hazards, safety rules and procedures, protective equipment, safe handling of dangerous machines or materials, accident prevention, labour standards, wages or working conditions. Not the safety of customers, patients, students, passengers or the public; not product quality, testing or routine maintenance; not the security of data or property.
- 16.6 (effective, accountable and transparent institutions): fits where the corner's work is part of running a public institution or holding an organisation to account: government, courts and justice, regulation and inspection, audit and compliance, official records and public reporting, investigations. Not routine business paperwork, sales or rental records, or production logs.
- 9.1 and 9.4: infrastructure means shared physical systems such as roads, rail, bridges, ports, water, sewer and power networks, telecommunication networks and public buildings, not farm, kitchen or office equipment, scientific data or models. 9.4 also needs the work to upgrade or retrofit infrastructure or industry for resource efficiency or clean technology.`

const JUDGE_TASK = `You check the UN Sustainable Development Goal (SDG) targets that tag the skill corners of one job in Kotak, a skills check-up app. A corner is one skill of the job: a name, three can-do statements (basic, working, advanced) and the job's own O*NET task statements it covers. Kotak shows each tag on the corner with the target's UN text, so a tag has to be true of that corner.

For every corner in the user message:
1. For each of its tags listed under "Tags to judge", decide whether it fits under the fit rule. Give the reason in one sentence of under 25 words, then fits true or false.
2. Name the one target from the table below whose UN text best supports this corner under the same rule, with a one-sentence reason. Prefer the most specific target whose text names what this corner does; when no specific target does, choose 4.4. Kotak puts it in place of tags that don't fit.

Answer for every corner, in the order given, and judge exactly the tags listed for it.`

const REVIEW_TASK = `You review a first pass that checked the UN Sustainable Development Goal (SDG) targets tagging skill corners in Kotak, a skills check-up app. A corner is one skill of a job: a name, three can-do statements (basic, working, advanced) and the job's own O*NET task statements it covers. Kotak shows each tag on the corner with the target's UN text, so a tag has to be true of that corner.

The first pass kept a tag only where it fitted the fit rule. Where it removed a tag, it added the one target from the table that fitted the corner best, unless the corner already kept that target or kept a tag and the best target was the broad 4.4 or 8.5. For each corner in the user message, you see its tags before the pass and after it. Decide whether the tags after the pass are right under the fit rule: agree, or disagree and give the tags you would set. Every tag you set must be a target from the table below, and a corner needs at least one; prefer the corner's original tags where they fit, and add a new target only in place of a tag that doesn't fit. Give the reason in one or two sentences.`

const REASON_TASK = `You check whether a reason Kotak shows is true of a skill. Kotak, a skills check-up app, tags each skill corner of a job with UN Sustainable Development Goal (SDG) targets and shows each tag with the target's UN text and one fixed reason, written once for every skill tagged with that target. A corner is one skill of a job: a name, three can-do statements (basic, working, advanced) and the job's own O*NET task statements it covers.

For each (corner, target) pair in the user message, decide whether Kotak's reason is true of this corner: its statements and tasks do what the reason describes, or work of the same kind, so a user reading the reason beside this skill would find it accurate. A reason about a different kind of work does not hold, such as one about insulating buildings beside a skill that designs nanodevices. Give the reason for your answer in one sentence of under 25 words, then holds true or false.`

const RECHECK_TASK = `You judge again some UN Sustainable Development Goal (SDG) targets on skill corners in Kotak, a skills check-up app, after a second review found a first pass too strict on them. A corner is one skill of a job: a name, three can-do statements (basic, working, advanced) and the job's own O*NET task statements it covers. Kotak shows each tag on the corner with the target's UN text, so a tag has to be true of that corner.

For each corner, judge each target listed under "Targets to judge" against the fit rule, whether or not the corner has it now. Give the reason in one sentence of under 25 words, then fits true or false. Read these targets as follows:
- 3.8: giving people health care (examining, diagnosing, treating, nursing or caring for patients, preventing disease, immunising, or teaching patients about their health) is the access to quality essential health-care services the target names. Health research, administration, and fitness or wellness work are not.
- 7.1: installing, running, maintaining or planning systems that generate or deliver energy, such as power plants, grids, and solar or wind systems, supports access to reliable, modern energy services.
- 7.2: the same work on renewable sources (solar, wind, hydro, geothermal, bioenergy) raises the renewable share of energy.
- 7.3: work that cuts the energy that buildings, equipment or processes use, such as insulating, sealing, energy audits and efficiency upgrades.`

type Usage = {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
}
interface CacheEntry<T> {
  key: string
  model: string
  effort: string
  /** Every request this file has paid for, superseded ones included, so the spend counts them all. */
  attempts: { model?: string; usage: Usage; cost_usd: number; stop_reason: string | null; error: string | null }[]
  result: T | null
}
interface TagVerdict {
  target: string
  why: string
  fits: boolean
}
interface CornerVerdict {
  corner_id: string
  tags: TagVerdict[]
  best_target: string
  best_why: string
}
interface ReasonVerdict {
  key: string
  target: string
  why: string
  holds: boolean
}
interface ReviewVerdict {
  key: string
  verdict: 'agree' | 'disagree'
  tags: string[]
  why: string
}

const sha = (text: string) => createHash('sha256').update(text).digest('hex')
const cornerKey = (code: string, cornerId: string) => `${code}|${cornerId}`

// Inputs.
const reasons = SdgReasonsFileSchema.parse(await Bun.file(`${ROOT}/data/sdg-reasons.json`).json())
const tasks = OnetTasksFileSchema.parse(await Bun.file(`${ROOT}/data/onet/tasks.json`).json()).tasks
const titles = new Map(
  OnetOccupationsFileSchema.parse(await Bun.file(`${ROOT}/data/onet/occupations.json`).json()).occupations.map((o) => [
    o.onet_code,
    o.title
  ])
)
const TABLE = Object.keys(reasons.targets)
const TABLE_TEXT = TABLE.map((target) => `${target}: ${reasons.targets[target]!.text}`).join('\n')

/**
 * The tags as the AI batch (#77) left them, from git, never from the working file, which may already be retagged:
 * `apply` always starts from these, so it can run again. The hash refuses any other file.
 */
const BATCH_COMMIT = '19c8e04'
const BATCH_SHA256 = 'd8437648912d304030cb33e9ff3215058642a21c1202d8bb0689d778ea28dfb4'
const ORIGINAL_FILE = `${DIR}/role-corners.original.json`
mkdirSync(DIR, { recursive: true })
if (!existsSync(ORIGINAL_FILE)) {
  const git = Bun.spawnSync(['git', 'show', `${BATCH_COMMIT}:data/generated/role-corners.json`], { cwd: ROOT })
  if (!git.success) throw new Error(`git show ${BATCH_COMMIT} failed: ${git.stderr.toString()}`)
  await Bun.write(ORIGINAL_FILE, git.stdout)
}
const originalText = await Bun.file(ORIGINAL_FILE).text()
if (sha(originalText) !== BATCH_SHA256)
  throw new Error(`${ORIGINAL_FILE} isn't the AI batch's file from ${BATCH_COMMIT}; delete it to fetch that one`)
const original = RoleCornersSchema.parse(JSON.parse(originalText))
const originalTags = new Map(
  original.roles.flatMap((r) => r.corners.map((c) => [cornerKey(r.onet_code, c.corner_id), c.sdg_targets] as const))
)

function describeCorner(role: OccupationCorners, corner: OccupationCorners['corners'][number]): string {
  const byId = new Map((tasks[role.onet_code] ?? []).map((t) => [t.task_id, t.statement]))
  return [
    `Corner ${corner.corner_id}: "${corner.name}"`,
    'Statements:',
    ...(['basic', 'working', 'advanced'] as const).map((level) => `- ${level}: ${corner.statements[level]}`),
    'O*NET tasks:',
    ...corner.task_ids.map((id) => `- ${byId.get(id) ?? `task ${id}`}`)
  ].join('\n')
}

const targetEnum = { type: 'string', enum: TABLE }
const JUDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['corners'],
  properties: {
    corners: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['corner_id', 'tags', 'best_target', 'best_why'],
        properties: {
          corner_id: { type: 'string' },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['target', 'why', 'fits'],
              properties: { target: targetEnum, why: { type: 'string' }, fits: { type: 'boolean' } }
            }
          },
          best_target: targetEnum,
          best_why: { type: 'string' }
        }
      }
    }
  }
}
const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['corners'],
  properties: {
    corners: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'why', 'verdict', 'tags'],
        properties: {
          key: { type: 'string' },
          why: { type: 'string' },
          verdict: { type: 'string', enum: ['agree', 'disagree'] },
          tags: { type: 'array', minItems: 1, items: targetEnum }
        }
      }
    }
  }
}

const REASON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['pairs'],
  properties: {
    pairs: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'target', 'why', 'holds'],
        properties: { key: { type: 'string' }, target: targetEnum, why: { type: 'string' }, holds: { type: 'boolean' } }
      }
    }
  }
}

const RECHECK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['corners'],
  properties: {
    corners: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'targets'],
        properties: {
          key: { type: 'string' },
          targets: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['target', 'why', 'fits'],
              properties: { target: targetEnum, why: { type: 'string' }, fits: { type: 'boolean' } }
            }
          }
        }
      }
    }
  }
}

const system = (task: string) =>
  `${task}\n\nThe fit rule:\n${FIT_RULE}\n\nThe targets, with their UN text (code: text):\n${TABLE_TEXT}`

function costOf(model: string, usage: Usage): number {
  const p = PRICES[model]!
  return (
    (usage.input_tokens * p.input +
      usage.cache_creation_input_tokens * p.cache_write +
      usage.cache_read_input_tokens * p.cache_read +
      usage.output_tokens * p.output) /
    1e6
  )
}

function spent(): { usd: number; byModel: Record<string, number> } {
  const byModel: Record<string, number> = {}
  for (const dir of [JUDGE.dir, JUDGE_FALLBACK.dir, REVIEWER.dir, RECHECKER.dir, REASONER.dir]) {
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      const entry = JSON.parse(readFileSync(`${dir}/${name}`, 'utf8')) as CacheEntry<unknown>
      for (const a of entry.attempts) {
        const model = a.model ?? entry.model
        byModel[model] = (byModel[model] ?? 0) + a.cost_usd
      }
    }
  }
  return { usd: Object.values(byModel).reduce((a, b) => a + b, 0), byModel }
}

// A pinned base URL keeps the key from following an ANTHROPIC_BASE_URL set in the host environment. The SDK retries
// 429s and 5xx itself, waiting out retry-after (https://platform.claude.com/docs/en/api/rate-limits).
const client = new Anthropic({ baseURL: 'https://api.anthropic.com', maxRetries: 4, timeout: 5 * 60_000 })

/**
 * One structured-output request, cached at `file` under a hash of the request. No sampling settings (these models
 * reject them) and no thinking setting: both models run adaptive thinking, with depth set by effort.
 */
async function ask<T>(
  who: Caller,
  file: string,
  sys: string,
  user: string,
  schema: object,
  check: (value: unknown) => string | null,
  budget: { usd: number }
): Promise<T | null> {
  const key = sha(JSON.stringify({ model: who.model, effort: who.effort, sys, user, schema }))
  const path = `${who.dir}/${file}.json`
  const cached = existsSync(path) ? ((await Bun.file(path).json()) as CacheEntry<T>) : null
  if (cached?.key === key && cached.result) return cached.result
  const entry: CacheEntry<T> = { key, model: who.model, effort: who.effort, attempts: [], result: null }
  // Earlier attempts stay in the entry, failed or superseded, so the spend counts them; a rerun gets fresh attempts.
  if (cached) entry.attempts.push(...cached.attempts.map((a) => ({ ...a, model: a.model ?? cached.model })))
  for (let tries = 0; tries < ATTEMPTS && !entry.result; tries++) {
    if (budget.usd >= CAP_USD) throw new Error(`spend cap of US$${CAP_USD} reached`)
    let error: string | null = null
    try {
      const message = await client.messages.create({
        model: who.model,
        max_tokens: 32_000,
        system: [{ type: 'text', text: sys, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: user }],
        output_config: {
          effort: who.effort,
          format: { type: 'json_schema', schema: schema as Record<string, unknown> }
        }
      })
      const usage: Usage = {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        cache_creation_input_tokens: message.usage.cache_creation_input_tokens ?? 0,
        cache_read_input_tokens: message.usage.cache_read_input_tokens ?? 0
      }
      const cost = costOf(who.model, usage)
      budget.usd += cost
      const text = message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('')
      if (message.stop_reason !== 'end_turn') error = `stopped with ${message.stop_reason}`
      else {
        const value: unknown = JSON.parse(text)
        error = check(value)
        if (!error) entry.result = value as T
      }
      entry.attempts.push({ model: who.model, usage, cost_usd: cost, stop_reason: message.stop_reason, error })
    } catch (caught) {
      if (caught instanceof Anthropic.APIError && caught.status !== undefined && caught.status < 500) throw caught
      error = caught instanceof Error ? caught.message : String(caught)
      entry.attempts.push({
        model: who.model,
        usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
        cost_usd: 0,
        stop_reason: null,
        error
      })
    }
    await Bun.write(path, JSON.stringify(entry, null, 1))
    if (error) console.warn(`${file}: attempt ${entry.attempts.length}: ${error}`)
  }
  return entry.result
}

/** A cached answer to exactly this request, or null; never calls the API. */
async function cachedResult<T>(
  who: Caller,
  file: string,
  sys: string,
  user: string,
  schema: object
): Promise<T | null> {
  const path = `${who.dir}/${file}.json`
  if (!existsSync(path)) return null
  const entry = (await Bun.file(path).json()) as CacheEntry<T>
  const key = sha(JSON.stringify({ model: who.model, effort: who.effort, sys, user, schema }))
  return entry.key === key ? entry.result : null
}

async function pool<T>(items: readonly T[], size: number, run: (item: T) => Promise<void>): Promise<void> {
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) await run(items[next++]!)
    })
  )
}

function judgeRequest(role: OccupationCorners): string {
  const corners = role.corners.map(
    (c) =>
      `${describeCorner(role, c)}\nTags to judge: ${originalTags.get(cornerKey(role.onet_code, c.corner_id))!.join(', ')}`
  )
  return `Job: ${titles.get(role.onet_code) ?? role.onet_code} (${role.onet_code})\n\n${corners.join('\n\n')}`
}

function checkJudge(role: OccupationCorners) {
  return (value: unknown): string | null => {
    const corners = (value as { corners?: CornerVerdict[] }).corners ?? []
    const ids = corners.map((c) => c.corner_id)
    const want = role.corners.map((c) => c.corner_id)
    if (ids.length !== want.length || want.some((id) => !ids.includes(id)))
      return `corners ${ids.join(', ')} are not ${want.join(', ')}`
    for (const corner of corners) {
      const tags = originalTags.get(cornerKey(role.onet_code, corner.corner_id))!
      const judged = corner.tags.map((t) => t.target.toLowerCase())
      if (judged.length !== tags.length || tags.some((t) => !judged.includes(t)))
        return `${corner.corner_id}: judged ${judged.join(', ')}, not ${tags.join(', ')}`
      const best = corner.best_target.toLowerCase()
      if (!TABLE.includes(best)) return `${corner.corner_id}: ${corner.best_target}`
      if (corner.tags.some((t) => t.target.toLowerCase() === best && !t.fits))
        return `${corner.corner_id}: best target ${best} was judged not to fit`
    }
    return null
  }
}

async function judgments(): Promise<Map<string, CornerVerdict>> {
  const found = new Map<string, CornerVerdict>()
  for (const role of original.roles)
    for (const who of [JUDGE, JUDGE_FALLBACK]) {
      const path = `${who.dir}/${role.onet_code}.json`
      if (!existsSync(path)) continue
      const entry = (await Bun.file(path).json()) as CacheEntry<{ corners: CornerVerdict[] }>
      if (entry.key !== sha(JSON.stringify(judgeKeyParts(role, who))) || !entry.result) continue
      for (const c of entry.result.corners) found.set(cornerKey(role.onet_code, c.corner_id), c)
      break
    }
  return found
}
const judgeKeyParts = (role: OccupationCorners, who: Caller) => ({
  model: who.model,
  effort: who.effort,
  sys: system(JUDGE_TASK),
  user: judgeRequest(role),
  schema: JUDGE_SCHEMA
})

/** The broad targets that fit any job skill (FIT_RULE): a corner that kept a tag gains nothing from one of them. */
const BROAD = ['4.4', '8.5']

/**
 * Tags after the Haiku pass: the fitting ones, in their order. A corner that lost a tag gets its best-fitting target in
 * its place, when it doesn't have it yet and either kept nothing or the best target is a specific one.
 */
function judgedTags(key: string, verdict: CornerVerdict | undefined): string[] {
  const before = originalTags.get(key)!
  if (!verdict) return before
  const fits = new Set(verdict.tags.filter((t) => t.fits).map((t) => t.target.toLowerCase()))
  const kept = before.filter((t) => fits.has(t))
  const best = verdict.best_target.toLowerCase()
  if (kept.length === before.length || kept.includes(best)) return kept
  return kept.length === 0 || !BROAD.includes(best) ? [...kept, best] : kept
}

// The #391 review's flagged tags (docs/sdg-reasons-review.md, "Tags that look wrong", and PR #405's second review):
// every tag of these targets, plus these corners.
const FLAGGED_TARGETS = ['9.1', '11.6', '12.8', '13.2', '14.2']
const FLAGGED_CORNERS: [code: string, cornerId: string, target: string][] = [
  ['15-1254.00', 'web-testing-and-updates', '8.8'],
  ['39-5091.00', 'skin-care-and-hygiene', '8.8'],
  ['53-3052.00', 'safe-route-driving', '8.8'],
  ['19-2011.00', 'celestial-measurements', '9.4'],
  ['15-2021.00', 'computational-model-design', '9.4'],
  ['11-9051.00', 'supplies-and-equipment', '9.4'],
  ['19-1029.02', 'applied-biological-research', '2.3'],
  ['17-2021.00', 'water-and-land-systems', '6.6'],
  ['47-2181.00', 'roof-system-upgrades', '7.1'],
  ['51-8013.00', 'generator-control', '7.2'],
  ['11-9013.00', 'resource-planning-and-response', '13.1'],
  ['19-4044.00', 'water-advisory', '6.1'],
  ['45-4011.00', 'plant-protection-and-records', '12.4'],
  ['51-9051.00', 'operational-logging', '16.6'],
  ['41-2021.00', 'records-and-documentation', '16.6']
]
function flagged(): Map<string, string[]> {
  const found = new Map<string, string[]>()
  for (const [key, tags] of originalTags) {
    const hits = tags.filter((t) => FLAGGED_TARGETS.includes(t))
    if (hits.length > 0) found.set(key, hits)
  }
  for (const [code, id, target] of FLAGGED_CORNERS) {
    const key = cornerKey(code, id)
    if (!originalTags.get(key)?.includes(target)) throw new Error(`flagged tag ${key} ${target} is not in the batch`)
    found.set(key, [...new Set([...(found.get(key) ?? []), target])])
  }
  return found
}

async function judge(): Promise<void> {
  mkdirSync(JUDGE.dir, { recursive: true })
  mkdirSync(JUDGE_FALLBACK.dir, { recursive: true })
  const codes = args.codes?.split(',')
  const have = await judgments()
  const roles = original.roles.filter(
    (r) =>
      (!codes || codes.includes(r.onet_code)) && r.corners.some((c) => !have.has(cornerKey(r.onet_code, c.corner_id)))
  )
  const budget = { usd: spent().usd }
  let done = 0
  const failed: string[] = []
  await pool(roles, Number(args.concurrency), async (role) => {
    let result: unknown = null
    for (const who of [JUDGE, JUDGE_FALLBACK]) {
      const { sys, user } = judgeKeyParts(role, who)
      result ??= await ask(who, role.onet_code, sys, user, JUDGE_SCHEMA, checkJudge(role), budget)
    }
    if (!result) failed.push(role.onet_code)
    if (++done % 50 === 0) console.info(`${done}/${roles.length} roles, US$${budget.usd.toFixed(3)} so far`)
  })
  console.info(`Judged ${roles.length - failed.length}/${roles.length} roles; spend US$${budget.usd.toFixed(3)}`)
  if (failed.length > 0) console.error(`Failed: ${failed.join(', ')}`)
}

/**
 * Every flagged tag, plus at least SAMPLE_SIZE other changed corners stratified by the change, each stratum's share
 * rounded up and taken in a deterministic hash order.
 */
async function sample(): Promise<void> {
  const verdicts = await judgments()
  if (verdicts.size !== originalTags.size) throw new Error(`only ${verdicts.size}/${originalTags.size} corners judged`)
  const flags = flagged()
  const strata = new Map<string, string[]>()
  for (const [key, before] of originalTags) {
    if (flags.has(key)) continue
    const after = judgedTags(key, verdicts.get(key))
    if (after.join() === before.join()) continue
    const removed = before.filter((t) => !after.includes(t))
    const added = after.filter((t) => !before.includes(t))
    // By the removed target that comes first in the table, and whether another target took its place.
    const first = removed.sort((x, y) => TABLE.indexOf(x) - TABLE.indexOf(y))[0]
    const stratum = `${added.length > 0 ? 'retagged' : 'removed'} ${first}`
    strata.set(stratum, [...(strata.get(stratum) ?? []), key])
  }
  const changed = [...strata.values()].reduce((n, keys) => n + keys.length, 0)
  const picked: { key: string; stratum: string }[] = []
  for (const [stratum, keys] of [...strata].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const n = Math.ceil((SAMPLE_SIZE * keys.length) / changed)
    const ordered = [...keys].sort((a, b) => (sha(a) < sha(b) ? -1 : 1))
    for (const key of ordered.slice(0, n)) picked.push({ key, stratum })
  }
  const file = {
    changed,
    strata: Object.fromEntries([...strata].map(([s, keys]) => [s, keys.length])),
    sample: picked,
    flagged: [...flags].map(([key, targets]) => ({ key, targets }))
  }
  await Bun.write(`${DIR}/sample.json`, JSON.stringify(file, null, 1))
  const all = new Set([...picked.map((p) => p.key), ...flags.keys()])
  console.info(`${changed} other corners changed in ${strata.size} strata; sampled ${picked.length}`)
  console.info(`${flags.size} flagged corners; ${all.size} corners to review`)
}

async function review(): Promise<void> {
  mkdirSync(REVIEWER.dir, { recursive: true })
  const verdicts = await judgments()
  const file = (await Bun.file(`${DIR}/sample.json`).json()) as {
    sample: { key: string }[]
    flagged: { key: string }[]
  }
  const keys = [...new Set([...file.sample.map((s) => s.key), ...file.flagged.map((f) => f.key)])].sort()
  const roles = new Map(original.roles.map((r) => [r.onet_code, r]))
  const groups: string[][] = []
  for (let i = 0; i < keys.length; i += REVIEW_GROUP) groups.push(keys.slice(i, i + REVIEW_GROUP))
  const budget = { usd: spent().usd }
  const failed: string[] = []
  await pool(groups, Number(args.concurrency), async (group) => {
    const user = group
      .map((key) => {
        const [code, id] = key.split('|') as [string, string]
        const role = roles.get(code)!
        const corner = role.corners.find((c) => c.corner_id === id)!
        // The first pass's reasons stay out, so the review reads the corner afresh.
        return [
          `Key: ${key}`,
          `Job: ${titles.get(code) ?? code}`,
          describeCorner(role, corner),
          `Tags before: ${originalTags.get(key)!.join(', ')}`,
          `Tags after: ${judgedTags(key, verdicts.get(key)).join(', ')}`
        ].join('\n')
      })
      .join('\n\n')
    const check = (value: unknown): string | null => {
      const got = ((value as { corners?: ReviewVerdict[] }).corners ?? []).map((c) => c.key)
      return got.length === group.length && group.every((k) => got.includes(k)) ? null : `keys ${got.join(', ')}`
    }
    const name = `group-${sha(group.join()).slice(0, 12)}`
    const result = await ask(REVIEWER, name, system(REVIEW_TASK), user, REVIEW_SCHEMA, check, budget)
    if (!result) failed.push(name)
  })
  console.info(`Reviewed ${keys.length} corners in ${groups.length} requests; spend US$${budget.usd.toFixed(3)}`)
  if (failed.length > 0) console.error(`Failed: ${failed.join(', ')}`)
}

/** Each corner's tags after the judge and the accepted review fixes, before the reason check. */
async function proposed(): Promise<Map<string, string[]>> {
  const verdicts = await judgments()
  if (verdicts.size !== originalTags.size) throw new Error(`only ${verdicts.size}/${originalTags.size} corners judged`)
  const fixes = args.fixes ? ((await Bun.file(args.fixes).json()) as Record<string, string[]>) : {}
  for (const [key, tags] of Object.entries(fixes)) {
    if (!originalTags.has(key)) throw new Error(`fix for unknown corner ${key}`)
    const bad = tags.filter((t) => !TABLE.includes(t))
    if (tags.length === 0 || bad.length > 0) throw new Error(`fix for ${key}: ${tags.join(', ') || 'no tags'}`)
  }
  return new Map([...originalTags.keys()].map((key) => [key, fixes[key] ?? judgedTags(key, verdicts.get(key))]))
}

// The second review (PR #414) found the pass too strict on 3.8 in health care, on 7.1 to 7.3 across energy jobs, and
// on four single tags, so Sonnet 5.5 judges those targets again, with notes on reading them (RECHECK_TASK).
const ENERGY_JOBS = [
  '11-3051.02',
  '11-3051.03',
  '11-3051.04',
  '11-3051.06',
  '11-9041.01',
  '11-9199.09',
  '11-9199.10',
  '17-2141.01',
  '17-2199.03',
  '17-2199.10',
  '17-2199.11',
  '41-4011.07',
  '47-1011.03',
  '47-2152.04',
  '47-2231.00',
  '47-4011.01',
  '47-4099.03',
  '49-9051.00',
  '49-9081.00',
  '49-9099.01',
  '51-8011.00',
  '51-8012.00',
  '51-8013.00',
  '51-8013.03',
  '51-8013.04',
  '51-8099.01'
]
const ENERGY = ['7.1', '7.2', '7.3']
const RECHECK_CORNERS: [key: string, target: string][] = [
  ['51-8011.00|auxiliary-equipment-operation', '8.8'],
  ['43-5021.00|vehicle-operation', '8.8'],
  ['33-3012.00|facility-security-checks', '8.8'],
  ['15-1299.05|breach-investigation-analysis', '16.6']
]
/** Health-care corners the batch never tagged 3.8 that the second review named; judged in their own request. */
const RECHECK_LATE: [key: string, target: string][] = [
  ['29-1123.00|device-management', '3.8'],
  ['29-2091.00|device-fabrication', '3.8']
]
/** The most tags a corner keeps, as the batch prompt asked (1 to 3): past it, broad targets go first. */
const MAX_TAGS = 3

/**
 * The targets to judge again on each corner, given its tags after the pass and fixes: 3.8 on every corner that lost
 * it; 7.1, 7.2 and 7.3 on every corner of an energy job or with one of them before or after; and RECHECK_CORNERS.
 */
function recheckTargets(tags: Map<string, string[]>): Map<string, string[]> {
  const checks = new Map<string, string[]>()
  const add = (key: string, targets: string[]) =>
    checks.set(key, [...new Set([...(checks.get(key) ?? []), ...targets])])
  for (const [key, before] of originalTags) {
    const now = tags.get(key)!
    if (before.includes('3.8') && !now.includes('3.8')) add(key, ['3.8'])
    if (ENERGY_JOBS.includes(key.split('|')[0]!) || [...before, ...now].some((t) => ENERGY.includes(t)))
      add(key, ENERGY)
  }
  for (const [key, target] of RECHECK_CORNERS) {
    if (!originalTags.has(key)) throw new Error(`recheck of unknown corner ${key}`)
    add(key, [target])
  }
  return checks
}

function recheckGroups(checks: Map<string, string[]>): { name: string; keys: string[]; user: string }[] {
  const roles = new Map(original.roles.map((r) => [r.onet_code, r]))
  const keys = [...checks.keys()].sort()
  const groups = []
  for (let i = 0; i < keys.length; i += RECHECK_GROUP) {
    const group = keys.slice(i, i + RECHECK_GROUP)
    const user = group
      .map((key) => {
        const [code, id] = key.split('|') as [string, string]
        const role = roles.get(code)!
        return [
          `Key: ${key}`,
          `Job: ${titles.get(code) ?? code}`,
          describeCorner(
            role,
            role.corners.find((c) => c.corner_id === id)!
          ),
          `Targets to judge: ${checks.get(key)!.join(', ')}`
        ].join('\n')
      })
      .join('\n\n')
    groups.push({
      name: `group-${sha(JSON.stringify(group.map((k) => [k, checks.get(k)]))).slice(0, 12)}`,
      keys: group,
      user
    })
  }
  return groups
}

const checkRecheck = (keys: string[], checks: Map<string, string[]>) => (value: unknown) => {
  const corners = (value as { corners?: { key: string; targets: TagVerdict[] }[] }).corners ?? []
  for (const key of keys) {
    const got = corners.find((c) => c.key === key)?.targets.map((t) => t.target.toLowerCase()) ?? []
    const want = checks.get(key)!
    if (got.length !== want.length || want.some((t) => !got.includes(t))) return `${key}: judged ${got.join(', ')}`
  }
  return corners.length === keys.length ? null : `${corners.length} corners for ${keys.length}`
}

/** The recheck's groups: the first lot, then RECHECK_LATE apart, so adding it didn't regroup and re-ask the first. */
function allRecheckGroups(tags: Map<string, string[]>) {
  const checks = recheckTargets(tags)
  const late = new Map<string, string[]>()
  for (const [key, target] of RECHECK_LATE) {
    if (!originalTags.has(key) || checks.has(key)) throw new Error(`late recheck of ${key} must be a new corner`)
    late.set(key, [...(late.get(key) ?? []), target])
  }
  return { checks: new Map([...checks, ...late]), groups: [...recheckGroups(checks), ...recheckGroups(late)] }
}

async function recheck(): Promise<void> {
  mkdirSync(RECHECKER.dir, { recursive: true })
  const { checks, groups } = allRecheckGroups(await proposed())
  const budget = { usd: spent().usd }
  const failed: string[] = []
  await pool(groups, Number(args.concurrency), async ({ name, keys, user }) => {
    const result = await ask(
      RECHECKER,
      name,
      system(RECHECK_TASK),
      user,
      RECHECK_SCHEMA,
      checkRecheck(keys, checks),
      budget
    )
    if (!result) failed.push(name)
  })
  const pairs = [...checks.values()].reduce((n, t) => n + t.length, 0)
  console.info(
    `Judged ${pairs} targets on ${checks.size} corners again in ${groups.length} requests; spend US$${budget.usd.toFixed(3)}`
  )
  if (failed.length > 0) console.error(`Failed: ${failed.join(', ')}`)
}

/**
 * The tags after the recheck: a target judged to fit is added, one judged not to is removed, a broad target the pass
 * added in place of a removed tag goes once the corner has a specific one, and a corner past MAX_TAGS loses broad ones.
 */
async function rechecked(tags: Map<string, string[]>): Promise<Map<string, string[]>> {
  const verdicts = new Map<string, TagVerdict[]>()
  for (const { name, keys, user } of allRecheckGroups(tags).groups) {
    const result = await cachedResult<{ corners: { key: string; targets: TagVerdict[] }[] }>(
      RECHECKER,
      name,
      system(RECHECK_TASK),
      user,
      RECHECK_SCHEMA
    )
    if (!result) throw new Error(`${keys.length} corners not rechecked: run the recheck step`)
    for (const c of result.corners) verdicts.set(c.key, c.targets)
  }
  return new Map(
    [...tags].map(([key, list]) => {
      const judged = verdicts.get(key)
      if (!judged) return [key, list]
      let next = [...list]
      for (const { target, fits } of judged) {
        const t = target.toLowerCase()
        if (fits && !next.includes(t)) next.push(t)
        if (!fits) next = next.filter((x) => x !== t)
      }
      const before = originalTags.get(key)!
      if (next.some((t) => !BROAD.includes(t))) next = next.filter((t) => !BROAD.includes(t) || before.includes(t))
      for (const broad of [...next].reverse().filter((t) => BROAD.includes(t)))
        if (next.length > MAX_TAGS) next = next.filter((t) => t !== broad)
      return [key, next]
    })
  )
}

/** The targets corners gained, other than the broad ones. */
const addedPairs = (tags: Map<string, string[]>) =>
  [...tags].flatMap(([key, list]) =>
    list.filter((t) => !originalTags.get(key)!.includes(t) && !BROAD.includes(t)).map((t): [string, string] => [key, t])
  )

/**
 * The reason check's groups, each with its request: first the targets added by the pass and fixes, then, apart, those
 * the recheck added, so a recheck doesn't regroup and re-ask the first lot.
 */
function reasonPhases(before: Map<string, string[]>, after: Map<string, string[]>) {
  const first = addedPairs(before)
  const seen = new Set(first.map(([key, t]) => `${key} ${t}`))
  return [...reasonGroups(first), ...reasonGroups(addedPairs(after).filter(([key, t]) => !seen.has(`${key} ${t}`)))]
}

/** Pairs in groups for the reason check, each with its request. */
function reasonGroups(pairs: [string, string][]): { name: string; pairs: [string, string][]; user: string }[] {
  const roles = new Map(original.roles.map((r) => [r.onet_code, r]))
  const groups = []
  for (let i = 0; i < pairs.length; i += REASON_GROUP) {
    const group = pairs.slice(i, i + REASON_GROUP)
    const user = group
      .map(([key, target], n) => {
        const [code, id] = key.split('|') as [string, string]
        const role = roles.get(code)!
        return [
          `Pair ${n + 1}, key ${key}, target ${target}`,
          `Job: ${titles.get(code) ?? code}`,
          describeCorner(
            role,
            role.corners.find((c) => c.corner_id === id)!
          ),
          `Target ${target}: ${reasons.targets[target]!.text}`,
          `Kotak's reason: ${reasons.targets[target]!.reason}`
        ].join('\n')
      })
      .join('\n\n')
    groups.push({ name: `group-${sha(JSON.stringify(group)).slice(0, 12)}`, pairs: group, user })
  }
  return groups
}

const checkReasons = (pairs: [string, string][]) => (value: unknown) => {
  const got = ((value as { pairs?: ReasonVerdict[] }).pairs ?? []).map((p) => `${p.key} ${p.target.toLowerCase()}`)
  const want = pairs.map(([key, target]) => `${key} ${target}`)
  return got.length === want.length && want.every((w) => got.includes(w)) ? null : `pairs ${got.join(', ')}`
}

async function reasonCheck(): Promise<void> {
  mkdirSync(REASONER.dir, { recursive: true })
  const tags = await proposed()
  const groups = reasonPhases(tags, await rechecked(tags))
  const budget = { usd: spent().usd }
  const failed: string[] = []
  await pool(groups, Number(args.concurrency), async ({ name, pairs, user }) => {
    if (!(await ask(REASONER, name, REASON_TASK, user, REASON_SCHEMA, checkReasons(pairs), budget))) failed.push(name)
  })
  const count = groups.reduce((n, g) => n + g.pairs.length, 0)
  console.info(
    `Checked the reasons of ${count} added tags in ${groups.length} requests; spend US$${budget.usd.toFixed(3)}`
  )
  if (failed.length > 0) console.error(`Failed: ${failed.join(', ')}`)
}

async function apply(): Promise<void> {
  const before = await proposed()
  const tags = await rechecked(before)
  const untrue = new Set<string>()
  for (const { name, pairs, user } of reasonPhases(before, tags)) {
    const result = await cachedResult<{ pairs: ReasonVerdict[] }>(REASONER, name, REASON_TASK, user, REASON_SCHEMA)
    if (!result) throw new Error(`${pairs.length} reasons unchecked: run the reasons step`)
    for (const p of result.pairs) if (!p.holds) untrue.add(`${p.key} ${p.target.toLowerCase()}`)
  }
  const roles = original.roles.map((role) => ({
    ...role,
    corners: role.corners.map((corner) => {
      const key = cornerKey(role.onet_code, corner.corner_id)
      const kept = tags.get(key)!.filter((t) => !untrue.has(`${key} ${t}`))
      return { ...corner, sdg_targets: kept.length > 0 ? kept : ['4.4'] }
    })
  }))
  const file = RoleCornersSchema.parse({ ...original, roles })
  await writeRecordsJson(CORNERS_FILE, file, 'roles')
  console.info(`Wrote ${CORNERS_FILE}; ${untrue.size} added tags dropped because their reason isn't true of the corner`)
}

async function report(): Promise<void> {
  const now = RoleCornersSchema.parse(await Bun.file(CORNERS_FILE).json())
  const rows = new Map<string, { before: number; kept: number; removed: number; added: number }>()
  const row = (t: string) => rows.get(t) ?? rows.set(t, { before: 0, kept: 0, removed: 0, added: 0 }).get(t)!
  let changed = 0
  let tagsBefore = 0
  let tagsAfter = 0
  for (const role of now.roles)
    for (const corner of role.corners) {
      const before = originalTags.get(cornerKey(role.onet_code, corner.corner_id))!
      const after = corner.sdg_targets
      tagsBefore += before.length
      tagsAfter += after.length
      if (before.join() !== after.join()) changed++
      for (const t of before) {
        row(t).before++
        if (after.includes(t)) row(t).kept++
        else row(t).removed++
      }
      for (const t of after) if (!before.includes(t)) row(t).added++
    }
  const lines = [...rows]
    .sort(([a], [b]) => TABLE.indexOf(a) - TABLE.indexOf(b))
    .map(([t, r]) => `${t}\t${r.before}\t${r.kept}\t${r.removed}\t${r.added}\t${r.kept + r.added}`)
  console.info(`target\tbefore\tkept\tremoved\tadded\tafter\n${lines.join('\n')}`)
  console.info(`${changed} of ${originalTags.size} corners changed; tags ${tagsBefore} before, ${tagsAfter} after`)
  const { usd, byModel } = spent()
  console.info(
    `Spend US$${usd.toFixed(3)}: ${Object.entries(byModel)
      .map(([m, v]) => `${m} US$${v.toFixed(3)}`)
      .join(', ')}`
  )
}

const commands: Record<string, () => Promise<void>> = {
  judge,
  sample,
  review,
  recheck,
  reasons: reasonCheck,
  apply,
  report
}
const command = commands[positionals[0] ?? '']
if (!command) {
  console.error(`Usage: bun scripts/corners/retag-sdg.ts <${Object.keys(commands).join('|')}> [options]`)
  process.exit(1)
}
await command()
