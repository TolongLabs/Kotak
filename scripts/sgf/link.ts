// #464: joins the SkillsFuture Skills Framework (data/sgf/, from scripts/ingest/sgf.ts) to the O*NET spine. Its roles
// carry no O*NET-SOC code, so a model picks one for each, then links each corner of a matched O*NET role to the
// SkillsFuture skills its equivalent roles list.
//
//   bun scripts/sgf/link.ts roles   [--concurrency 8]   SkillsFuture role → O*NET-SOC, writes data/sgf/onet-crosswalk.json
//   bun scripts/sgf/link.ts corners [--concurrency 8]   corner → skill codes, writes data/sgf/corner-skills.json
//   bun scripts/sgf/link.ts report                      coverage counts and spend
//
// The model is the hackathon's KrackedDevs LiteLLM key (KD_API_KEY, gpt-5.6-luna): an OpenAI-compatible
// /v1/chat/completions with a strict JSON schema. Answers are cached under --dir, one file per request keyed by a
// hash of it, so a rerun sends only what is missing and the written files are deterministic from the cache. --cap
// stops new requests once the cached answers have cost that many US dollars. A code the model names outside its
// candidate list never ships: a crosswalk code outside O*NET is rejected and asked again, and a corner skill outside
// its own role's SkillsFuture equivalents is dropped. Both outputs are labelled "auto-generated".
// API docs: https://docs.litellm.ai/docs/completion/json_mode, https://docs.litellm.ai/docs/completion/prompt_caching,
// https://platform.openai.com/docs/guides/structured-outputs

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import {
  OnetOccupationsFileSchema,
  OnetTasksFileSchema,
  type OnetTitleIndex
} from '../../packages/shared/src/data/onet'
import { RoleCornersSchema } from '../../packages/shared/src/data/role-corners'
import {
  SgfCornerSkillsFileSchema,
  SgfCrosswalkFileSchema,
  SgfRolesFileSchema,
  SgfUniqueSkillsFileSchema,
  sgfMatchedRoles,
  type SgfCornerSkill,
  type SgfCrosswalkFile,
  type SgfCrosswalkRow,
  type SgfRole
} from '../../packages/shared/src/data/sgf'
import { lookupTitle } from '../../packages/shared/src/data/title-lookup'

const ROOT = resolve(import.meta.dir, '../..')
const { values: args, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    dir: { type: 'string', default: `${ROOT}/.cache/sgf-link` },
    concurrency: { type: 'string', default: '8' },
    cap: { type: 'string', default: '5' },
    /** Send only the first N requests, then stop without writing: a smoke test. */
    limit: { type: 'string' }
  },
  allowPositionals: true
})
const DIR = resolve(args.dir)
const CAP_USD = Number(args.cap)
const API = 'https://litellm.rapidscreen.io/v1/chat/completions'
const MODEL = 'gpt-5.6-luna'
const EFFORT = 'low'
/** US dollars per million tokens, from `cc list --provider krackeddevs` on 31 October 2026. */
const PRICE = { input: 0.2, cached: 0.02, output: 1.2 }
const ATTEMPTS = 3
/** SkillsFuture roles per crosswalk request, taken from one sector and track so the model sees the ladder. */
const ROLE_GROUP = 12
/** Equivalent roles whose skills a corner may link, best first. */
const LINK_ROLES = 6
/** Skills linked to one corner, at most. */
const PER_CORNER = 3
const TODAY = new Date().toISOString().slice(0, 10)

const ROLES_TASK = `You map Singapore SkillsFuture Skills Framework job roles to the closest O*NET-SOC 2019 occupation, for Kotak, a skills check-up app that keys every job by O*NET code. Kotak shows the SkillsFuture role beside the O*NET job as its regional equivalent, so the match must be one a worker in either job would accept.

For each role in the user message, pick the one O*NET occupation from the list below whose work the role mostly does:
- Judge the work in the description and work functions, not the sector name alone.
- A role whose main job is to manage a function or a team (Manager, Head, Director, Chief, Partner) maps to the O*NET management occupation for that function when one fits, such as Treasurers and Controllers, or Computer and Information Systems Managers. Associates, executives, seniors and specialists map to the occupation that does the work.
- Use the title-index hints when they fit; they are exact or partial title matches, not answers.
- Give null only when no occupation on the list does most of this role's work.

Confidence: "high" when it is the same occupation; "medium" when the O*NET occupation is broader or a close neighbour; "low" when it is the best available but a stretch. Give the reason in one sentence of under 20 words.

Answer for every role, by its number, in the order given.`

const CORNERS_TASK = `You link the skill corners of one job in Kotak, a skills check-up app, to skills in Singapore's SkillsFuture Skills Framework. A corner is one skill of the job: a name and the job's own O*NET task statements it covers. Kotak shows each linked SkillsFuture skill on the corner, with its proficiency level, as the regional framework's name for that skill.

For each corner, pick up to ${PER_CORNER} skill codes from the list in the user message whose title and description name the same skill the corner's tasks use. Link a skill only when someone who has the corner's skill would say they have that skill too; a shared keyword or a skill several steps away is not enough. Prefer technical skills (TSC) over critical core skills (CCS). Give an empty list when none fits. Use only codes from the list, exactly as written.

Answer for every corner, by its id, in the order given.`

interface Usage {
  prompt_tokens: number
  completion_tokens: number
  cached_tokens: number
}
interface CacheEntry<T> {
  key: string
  attempts: { usage: Usage; cost_usd: number; error: string | null }[]
  result: T | null
}

const sha = (text: string) => createHash('sha256').update(text).digest('hex')
const costOf = (u: Usage) =>
  ((u.prompt_tokens - u.cached_tokens) * PRICE.input +
    u.cached_tokens * PRICE.cached +
    u.completion_tokens * PRICE.output) /
  1e6

function spent(): number {
  let usd = 0
  for (const kind of ['roles', 'corners']) {
    const dir = `${DIR}/${kind}`
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      const entry = JSON.parse(readFileSync(`${dir}/${name}`, 'utf8')) as CacheEntry<unknown>
      usd += entry.attempts.reduce((a, b) => a + b.cost_usd, 0)
    }
  }
  return usd
}

class FatalError extends Error {}

/** One structured-output request, cached at `<dir>/<kind>/<file>.json` under a hash of the request. */
async function ask<T>(
  kind: 'roles' | 'corners',
  file: string,
  sys: string,
  user: string,
  schema: Record<string, unknown>,
  check: (value: T) => string | null,
  budget: { usd: number }
): Promise<T | null> {
  const key = sha(JSON.stringify({ model: MODEL, effort: EFFORT, sys, user, schema }))
  mkdirSync(`${DIR}/${kind}`, { recursive: true })
  const path = `${DIR}/${kind}/${file}.json`
  const cached = existsSync(path) ? ((await Bun.file(path).json()) as CacheEntry<T>) : null
  if (cached?.key === key && cached.result) return cached.result
  const entry: CacheEntry<T> = { key, attempts: [...(cached?.attempts ?? [])], result: null }
  const apiKey = process.env.KD_API_KEY
  if (!apiKey) throw new FatalError('Set KD_API_KEY (source ~/.config/tolong/secrets.env).')
  // A retry tells the model why its last answer was rejected; the cache key stays the first request's.
  let rejected = cached?.attempts.at(-1)?.error ?? null
  for (let tries = 0; tries < ATTEMPTS && !entry.result; tries++) {
    if (budget.usd >= CAP_USD) throw new FatalError(`spend cap of US$${CAP_USD} reached`)
    let error: string | null = null
    let usage: Usage = { prompt_tokens: 0, completion_tokens: 0, cached_tokens: 0 }
    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          reasoning_effort: EFFORT,
          messages: [
            { role: 'system', content: sys },
            {
              role: 'user',
              content: rejected
                ? `${user}\n\nYour last answer was rejected: ${rejected}. Answer again, using only codes from the list.`
                : user
            }
          ],
          response_format: { type: 'json_schema', json_schema: { name: kind, schema, strict: true } }
        }),
        signal: AbortSignal.timeout(180_000)
      })
      const body = (await response.json()) as {
        choices?: { message: { content: string | null }; finish_reason: string }[]
        usage?: { prompt_tokens: number; completion_tokens: number; prompt_tokens_details?: { cached_tokens?: number } }
        error?: { message?: string }
      }
      if (response.status === 401 || response.status === 403) {
        throw new FatalError(`HTTP ${response.status}: ${body.error?.message ?? 'check KD_API_KEY'}`)
      }
      if (!response.ok) error = `HTTP ${response.status}: ${body.error?.message ?? ''}`
      else {
        usage = {
          prompt_tokens: body.usage?.prompt_tokens ?? 0,
          completion_tokens: body.usage?.completion_tokens ?? 0,
          cached_tokens: body.usage?.prompt_tokens_details?.cached_tokens ?? 0
        }
        const choice = body.choices?.[0]
        if (choice?.finish_reason !== 'stop') error = `finished with ${choice?.finish_reason}`
        else {
          const value = JSON.parse(choice.message.content ?? '') as T
          error = check(value)
          if (!error) entry.result = value
        }
      }
    } catch (caught) {
      if (caught instanceof FatalError) throw caught
      error = caught instanceof Error ? caught.message : String(caught)
    }
    const cost = costOf(usage)
    budget.usd += cost
    entry.attempts.push({ usage, cost_usd: cost, error })
    rejected = error
    await Bun.write(path, JSON.stringify(entry, null, 1))
    if (error) console.warn(`${kind}/${file}: attempt ${entry.attempts.length}: ${error}`)
  }
  return entry.result
}

async function pool<T>(items: T[], run: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items]
  const workers = Array.from({ length: Number(args.concurrency) }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await run(item)
  })
  await Promise.all(workers)
}

/** Writes `file` as JSON with one entry of each record (`by_role`, `by_onet`, `roles`) per line, for readable diffs. */
async function writeJson(path: string, file: Record<string, unknown>): Promise<void> {
  const parts = Object.entries(file).map(([name, value]) =>
    name === 'meta' || name === 'generated'
      ? `${JSON.stringify(name)}: ${JSON.stringify(value)}`
      : `${JSON.stringify(name)}: {\n${Object.entries(value as object)
          .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
          .join(',\n')}\n}`
  )
  await Bun.write(path, `{\n${parts.join(',\n')}\n}\n`)
}

const load = async <T>(path: string, schema: { parse: (v: unknown) => T }) =>
  schema.parse(await Bun.file(`${ROOT}/${path}`).json())

// ---- roles ----

type RoleAnswer = {
  matches: { n: number; onet_code: string | null; confidence: 'high' | 'medium' | 'low'; reason: string }[]
}
const ROLE_SCHEMA = {
  type: 'object',
  properties: {
    matches: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          n: { type: 'integer' },
          onet_code: { type: ['string', 'null'] },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          reason: { type: 'string' }
        },
        required: ['n', 'onet_code', 'confidence', 'reason'],
        additionalProperties: false
      }
    }
  },
  required: ['matches'],
  additionalProperties: false
}

function roleText(n: number, role: SgfRole, hints: string[]): string {
  const description = role.description.length > 600 ? `${role.description.slice(0, 600)}…` : role.description
  return [
    `${n}. ${role.title}`,
    `Sector: ${role.sector}; track: ${role.track}`,
    `Description: ${description}`,
    `Work functions: ${role.work_functions.map((w) => w.name).join('; ') || 'none listed'}`,
    `Title-index hints: ${hints.join('; ') || 'none'}`
  ].join('\n')
}

async function linkRoles() {
  const sgf = await load('data/sgf/roles.json', SgfRolesFileSchema)
  const occupations = (await load('data/onet/occupations.json', OnetOccupationsFileSchema)).occupations
  const index = (await Bun.file(`${ROOT}/data/onet/title-index.json`).json()) as OnetTitleIndex
  const codes = new Set(occupations.map((o) => o.onet_code))
  const sys = `${ROLES_TASK}\n\nO*NET occupations (code, title):\n${occupations.map((o) => `${o.onet_code} ${o.title}`).join('\n')}`

  const byTrack = new Map<string, SgfRole[]>()
  for (const role of Object.values(sgf.roles)) {
    const track = `${role.sector}|${role.track}`
    byTrack.set(track, [...(byTrack.get(track) ?? []), role])
  }
  const groups: { file: string; roles: SgfRole[] }[] = []
  for (const [track, roles] of byTrack) {
    for (let i = 0; i < roles.length; i += ROLE_GROUP) {
      groups.push({ file: sha(`${track}#${i}`).slice(0, 16), roles: roles.slice(i, i + ROLE_GROUP) })
    }
  }

  if (args.limit) groups.splice(Number(args.limit))
  const budget = { usd: spent() }
  const rows: Record<string, SgfCrosswalkRow> = {}
  let failed = 0
  await pool(groups, async (group) => {
    const user = group.roles
      .map((role, i) => {
        const variants = [role.title, ...role.title.split('/').map((s) => s.trim())]
        const hits = new Map<string, string>()
        for (const v of variants) {
          for (const hit of lookupTitle(index, v, 3).hits) hits.set(hit.onet_code, `${hit.onet_code} ${hit.title}`)
        }
        return roleText(i + 1, role, [...hits.values()].slice(0, 5))
      })
      .join('\n\n')
    const answer = await ask<RoleAnswer>(
      'roles',
      group.file,
      sys,
      user,
      ROLE_SCHEMA,
      (value) => {
        const ns = value.matches.map((m) => m.n).join()
        if (ns !== group.roles.map((_, i) => i + 1).join())
          return `answered roles ${ns}, not 1 to ${group.roles.length}`
        const bad = value.matches.find((m) => m.onet_code !== null && !codes.has(m.onet_code))
        return bad ? `${bad.onet_code} is not an O*NET occupation` : null
      },
      budget
    )
    if (!answer) {
      failed += group.roles.length
      return
    }
    for (const m of answer.matches) {
      const role = group.roles[m.n - 1]
      rows[role.role_id] = { onet_code: m.onet_code, confidence: m.confidence, reason: m.reason }
    }
  })
  if (failed) throw new Error(`${failed} roles have no answer; rerun to retry them`)
  if (args.limit) {
    console.log(JSON.stringify(rows, null, 1), `spend US$${spent().toFixed(4)}`)
    return
  }

  const rank = { high: 0, medium: 1, low: 2 } as const
  const ids = Object.keys(sgf.roles).filter((id) => rows[id])
  const byOnet: Record<string, string[]> = {}
  for (const id of ids) {
    const code = rows[id].onet_code
    if (code) byOnet[code] = [...(byOnet[code] ?? []), id]
  }
  for (const list of Object.values(byOnet)) {
    list.sort((a, b) => rank[rows[a].confidence] - rank[rows[b].confidence] || ids.indexOf(a) - ids.indexOf(b))
  }
  const file: SgfCrosswalkFile = {
    meta: {
      ...sgf.meta,
      dataset: 'sgf-onet-crosswalk',
      retrieved_date: sgf.meta.retrieved_date,
      notes: [
        `Each SkillsFuture role mapped to one O*NET-SOC 2019 occupation by ${MODEL} on ${TODAY}, reading its title, sector, track, description and work functions; O*NET title-index matches were given as hints. Auto-generated: no person has checked the rows.`
      ]
    },
    generated: { model: MODEL, generated_date: TODAY, prompt_sha256: sha(ROLES_TASK), quality: 'auto-generated' },
    by_role: Object.fromEntries(ids.map((id) => [id, rows[id]])),
    by_onet: Object.fromEntries(
      Object.keys(byOnet)
        .sort()
        .map((code) => [code, byOnet[code]])
    )
  }
  await writeJson(`${ROOT}/data/sgf/onet-crosswalk.json`, SgfCrosswalkFileSchema.parse(file))
  console.log(
    `roles: ${ids.length} answered, ${Object.keys(byOnet).length} O*NET codes covered, spend US$${spent().toFixed(4)}`
  )
}

// ---- corners ----

type CornerAnswer = { corners: { corner_id: string; codes: string[] }[] }
const CORNER_SCHEMA = {
  type: 'object',
  properties: {
    corners: {
      type: 'array',
      items: {
        type: 'object',
        properties: { corner_id: { type: 'string' }, codes: { type: 'array', items: { type: 'string' } } },
        required: ['corner_id', 'codes'],
        additionalProperties: false
      }
    }
  },
  required: ['corners'],
  additionalProperties: false
}

async function linkCorners() {
  const sgf = await load('data/sgf/roles.json', SgfRolesFileSchema)
  const unique = await load('data/sgf/unique-skills.json', SgfUniqueSkillsFileSchema)
  const crosswalk = await load('data/sgf/onet-crosswalk.json', SgfCrosswalkFileSchema)
  const corners = new Map(
    (await load('data/generated/role-corners.json', RoleCornersSchema)).roles.map((r) => [r.onet_code, r])
  )
  const tasks = (await load('data/onet/tasks.json', OnetTasksFileSchema)).tasks

  const emergingTitles = new Set(
    Object.values(unique.skills)
      .filter((s) => s.emerging)
      .map((s) => s.title)
  )
  const emerging = (code: string) =>
    (unique.mappings[code] ?? []).some((m) => emergingTitles.has(m.updated?.title ?? m.previous?.title ?? m.title))

  const budget = { usd: spent() }
  const out: Record<string, Record<string, SgfCornerSkill[]>> = {}
  let failed = 0
  const codes = [...corners.keys()].filter((code) => sgfMatchedRoles(crosswalk, code, LINK_ROLES).length > 0)
  await pool(codes, async (code) => {
    const candidates = new Map<string, SgfCornerSkill>()
    for (const id of sgfMatchedRoles(crosswalk, code, LINK_ROLES)) {
      for (const ref of sgf.roles[id].skills) {
        const seen = candidates.get(ref.code)
        const level = Math.max(seen?.proficiency_level ?? 0, ref.proficiency_level ?? 0) || null
        candidates.set(ref.code, {
          code: ref.code,
          title: ref.title,
          type: ref.type,
          proficiency_level: level,
          emerging: emerging(ref.code),
          role_id: seen?.role_id ?? id
        })
      }
    }
    if (candidates.size === 0) return
    const describe = (c: SgfCornerSkill) => {
      const description = unique.mappings[c.code]?.[0]?.description
      return `${c.code} [${c.type.toUpperCase()}] ${c.title}${description ? `: ${description}` : ''}`
    }
    const taskText = new Map((tasks[code] ?? []).map((t) => [t.task_id, t.statement]))
    const role = corners.get(code)!
    const user = [
      'Corners:',
      ...role.corners.map(
        (c) => `- ${c.corner_id}: ${c.name}\n${c.task_ids.map((t) => `  - ${taskText.get(t) ?? ''}`).join('\n')}`
      ),
      '',
      'SkillsFuture skills (code [type] title: description):',
      ...[...candidates.values()].map(describe)
    ].join('\n')
    const ids = role.corners.map((c) => c.corner_id)
    const answer = await ask<CornerAnswer>(
      'corners',
      code,
      CORNERS_TASK,
      user,
      CORNER_SCHEMA,
      (value) => {
        if (value.corners.map((c) => c.corner_id).join() !== ids.join()) return 'corners missing or out of order'
        for (const c of value.corners) {
          if (c.codes.length > PER_CORNER) return `${c.corner_id} has ${c.codes.length} codes`
        }
        return null
      },
      budget
    )
    if (!answer) {
      failed++
      return
    }
    // A code outside this role's own list is dropped, never shipped: the model sometimes names a sibling sector's code.
    const outside = answer.corners.flatMap((c) => c.codes.filter((x) => !candidates.has(x)))
    if (outside.length > 0) console.warn(`corners/${code}: dropped ${outside.join(', ')}, not in this role's list`)
    out[code] = Object.fromEntries(
      answer.corners.map((c) => [
        c.corner_id,
        [...new Set(c.codes)].flatMap((x) => (candidates.has(x) ? [candidates.get(x) as SgfCornerSkill] : []))
      ])
    )
  })
  if (failed) throw new Error(`${failed} roles have no answer; rerun to retry them`)

  const file = {
    meta: {
      ...sgf.meta,
      dataset: 'sgf-corner-skills',
      notes: [
        `Each corner of an O*NET role with a high or medium SkillsFuture match linked to up to ${PER_CORNER} skills of its best ${LINK_ROLES} equivalent roles by ${MODEL} on ${TODAY}. A link names only a skill those roles list. Emerging comes from the unique skills list, through each code's updated mapping. Auto-generated: no person has checked the links.`
      ]
    },
    generated: {
      model: MODEL,
      generated_date: TODAY,
      prompt_sha256: sha(CORNERS_TASK),
      quality: 'auto-generated' as const
    },
    roles: Object.fromEntries(
      Object.keys(out)
        .sort()
        .map((code) => [code, out[code]])
    )
  }
  await writeJson(`${ROOT}/data/sgf/corner-skills.json`, SgfCornerSkillsFileSchema.parse(file))
  console.log(`corners: ${Object.keys(out).length} roles linked, spend US$${spent().toFixed(4)}`)
}

async function report() {
  const crosswalk = await load('data/sgf/onet-crosswalk.json', SgfCrosswalkFileSchema)
  const rows = Object.values(crosswalk.by_role)
  const count = (c: string) => rows.filter((r) => r.onet_code && r.confidence === c).length
  console.log({
    sgf_roles: rows.length,
    mapped: {
      high: count('high'),
      medium: count('medium'),
      low: count('low'),
      none: rows.filter((r) => !r.onet_code).length
    },
    onet_codes_covered: Object.keys(crosswalk.by_onet).length
  })
  if (existsSync(`${ROOT}/data/sgf/corner-skills.json`)) {
    const linked = (await load('data/sgf/corner-skills.json', SgfCornerSkillsFileSchema)).roles
    const all = Object.values(linked).flatMap((r) => Object.values(r))
    console.log({
      roles_with_links: Object.keys(linked).length,
      corners: all.length,
      corners_with_a_skill: all.filter((c) => c.length > 0).length,
      corners_with_an_emerging_skill: all.filter((c) => c.some((s) => s.emerging)).length
    })
  }
  console.log(`spend US$${spent().toFixed(4)}`)
}

const commands: Record<string, () => Promise<void>> = { roles: linkRoles, corners: linkCorners, report }
const command = commands[positionals[0] ?? '']
if (!command) {
  console.error('usage: bun scripts/sgf/link.ts roles|corners|report')
  process.exit(1)
}
await command()
