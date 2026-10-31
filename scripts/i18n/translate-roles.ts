import { mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

const ROOT = resolve(import.meta.dir, '../..')
const DRY_RUN_DIR = '/tmp/translate-dry-run'
const RUNPOD_MODEL = 'Qwen/Qwen3.8-27B-FP8'
const CONTEXT_LIMIT = 16_384
const RUNPOD_MAX_TOKENS = 4_096
const PROVIDER_MAX_TOKENS = 16_384
const CONCURRENCY = 32
const HTTP_RETRIES = 5
const REQUEST_TIMEOUT_MS = 10 * 60_000
const COLD_START_LIMIT_MS = 30 * 60_000
const CHECKPOINT_EVERY = 200
const PROGRESS_EVERY = 100
const TITLES_PER_REQUEST = 40
const DEMO_CODES = ['15-1254.00', '15-1255.00', '43-3031.00']
const DEMO_EXAMPLE = { code: '15-1254.00', cornerId: 'web-site-building' }
const LANGUAGES = ['ms', 'zh'] as const
const KINDS = ['skills', 'explainers', 'titles', 'resources'] as const
const INDONESIAN_WORDS = [
  'bisa',
  'hapus',
  'berkas',
  'kata sandi',
  'coba',
  'kamu',
  'kantor',
  'karyawan',
  'pelatihan',
  'tamu',
  'lembur'
]
const FIXED_NAMES = ['Kotak', 'Kopi', 'O*NET', 'SDG', 'RM', 'AI']
// Approved few-shot pairs for the title and resource kinds: English, Malay, Chinese.
const TITLE_EXAMPLES: [string, string, string][] = [
  ['Web Developers', 'Pembangun Web', '网页开发人员'],
  ['Web and Digital Interface Designers', 'Pereka Web dan Antara Muka Digital', '网页与数字界面设计师'],
  ['Bookkeeping, Accounting, and Auditing Clerks', 'Kerani Simpan Kira, Perakaunan dan Audit', '簿记、会计和审计文员']
]
const RESOURCE_EXAMPLES: [string, string, string][] = [
  ['Search: how to prepare corporate budgets', 'Cari: cara menyediakan belanjawan korporat', '搜索：如何编制企业预算'],
  ['MDN: Learn web development', 'MDN: Belajar pembangunan web', 'MDN：学习网页开发'],
  ['freeCodeCamp: Relational Database', 'freeCodeCamp: Pangkalan Data Hubungan', 'freeCodeCamp：关系数据库']
]
type Language = (typeof LANGUAGES)[number]
type Kind = (typeof KINDS)[number]
type Tier = 'basic' | 'working' | 'advanced'
type ScenarioTier = 'basic' | 'advanced'
/** The explainer tiers in a stable order: basic before advanced, for every kind that reads them. */
const EXPLAINER_TIERS = ['basic', 'advanced'] as const
type OptionId = 'a' | 'b' | 'c' | 'd'
type ScenarioTranslation = { situation: string; options: Record<OptionId, string> }
type SkillTranslation = {
  name: string
  statements: Record<Tier, string>
  reversed_statements: Record<'basic' | 'advanced', string>
  scenarios?: Record<ScenarioTier, ScenarioTranslation>
}
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }
type ChatRequest = {
  model: string
  messages: ChatMessage[]
  response_format: { type: 'json_schema'; json_schema: { name: string; schema: Record<string, unknown>; strict: true } }
  temperature: 0
  max_tokens: number
  chat_template_kwargs?: { enable_thinking: false }
  reasoning_effort?: string
}
type SourceCorner = {
  corner_id: string
  name: string
  statements: Record<Tier, string>
  reversed_statements: Record<'basic' | 'advanced', string>
  resources?: { title: string; url: string }[]
}
type SourceScenario = {
  situation: string
  options: { id: OptionId; text: string; score: number }[]
}
type RoleOverlay = { title?: string; corners: Record<string, Record<string, unknown>> }
type LocaleFile = {
  roles: Record<string, RoleOverlay>
  explainers: Record<string, Record<string, Record<string, unknown>>>
  scenarios?: Record<string, Record<string, Record<string, unknown>>>
  [key: string]: unknown
}
type Provider = {
  /** Host only, for the run record: `api.meta.ai` or `runpod`. */
  host: string
  name: 'runpod' | 'openai-compatible'
  baseUrl: string
  headers: HeadersInit
  model?: string
  apiKey?: string
  concurrency: number
  maxTokens: number
  rpm?: number
  reasoningEffort?: string
}

class FatalError extends Error {}
class RequestError extends Error {}
/** A provider's content filter refused the prompt. Never resend it: providers count repeats as policy violations. */
class RefusedError extends Error {}
/** Content-filter refusals before the run stops; Meta blocked the key after five in one run (#449). */
const MAX_REFUSALS = 2
let refusals = 0

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'dry-run': { type: 'boolean', default: false },
    kind: { type: 'string' },
    lang: { type: 'string' },
    all: { type: 'boolean', default: false },
    limit: { type: 'string' },
    'self-test': { type: 'boolean', default: false }
  }
})

function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value)
}

function isKind(value: string): value is Kind {
  return (KINDS as readonly string[]).includes(value)
}

function requireNumber(name: string, value: string, { min, max }: { min: number; max: number }): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be a whole number between ${min} and ${max}; got “${value}”.`)
  }
  return parsed
}

function positiveEnvNumber(name: string, fallback: number): number {
  const value = process.env[name]
  if (value === undefined || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${name} must be a positive number; got “${value}”.`)
  return parsed
}

function digitCounts(value: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const digit of value.match(/\d+/g) ?? []) counts.set(digit, (counts.get(digit) ?? 0) + 1)
  return counts
}

function sourceStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.values(value).flatMap(sourceStrings)
}

// Names that must stay verbatim: Kotak's fixed names, acronyms (HR, CEO, ROI) and camelCase product names. A Title
// Case word inside an English sentence ("the Hybrid Work Policy", "Model A", "Saturdays") is ordinary language to
// translate; the prompt still asks the model to keep place, product and company names.
function nameCandidates(source: string): string[] {
  const names = new Set(FIXED_NAMES.filter((name) => source.includes(name)))
  for (const match of source.matchAll(/\b[A-Za-z][A-Za-z0-9]*\b/g)) {
    const word = match[0]
    if (/^[A-Z0-9]{2,}$/.test(word) || /[a-z][A-Z]/.test(word)) names.add(word)
  }
  return [...names]
}

function validateString(source: string, translated: string, language: Language, path: string): string[] {
  const errors: string[] = []
  if (!translated.trim()) errors.push(`${path}: empty string`)

  const sourceDigits = digitCounts(source)
  const translatedDigits = digitCounts(translated)
  for (const [digit, count] of sourceDigits) {
    if ((translatedDigits.get(digit) ?? 0) < count) errors.push(`${path}: missing digit sequence ${digit}`)
  }

  for (const name of nameCandidates(source)) {
    if (!translated.includes(name)) errors.push(`${path}: must keep ${name} verbatim`)
  }

  if (language === 'ms') {
    if ([...translated].length > [...source].length * 1.6) errors.push(`${path}: exceeds 1.6× the English length`)
    // The demo uses “hapus kira” as a Malaysian accounting term; standalone “hapus” remains blocked.
    const withoutMalayAccountingPhrase = translated.replace(/\bhapus\s+kira\b/giu, ' ')
    for (const word of INDONESIAN_WORDS) {
      const pattern = new RegExp(`(^|[^\\p{L}])${word.replaceAll(' ', '\\s+')}($|[^\\p{L}])`, 'iu')
      if (pattern.test(word === 'hapus' ? withoutMalayAccountingPhrase : translated)) {
        errors.push(`${path}: contains Indonesian term “${word}”`)
      }
    }
  } else {
    if (!/\p{Script=Han}/u.test(translated)) errors.push(`${path}: contains no Chinese characters`)
    const mixedBoundaries = /([\p{Script=Han}])(\s*)([A-Za-z0-9])|([A-Za-z0-9])(\s*)([\p{Script=Han}])/gu
    for (const match of translated.matchAll(mixedBoundaries)) {
      const gap = match[2] ?? match[5]
      if (gap !== ' ')
        errors.push(`${path}: use exactly one half-width space between Chinese and Latin text or numbers`)
    }
  }
  return errors
}

/** A Malay sentence starts with “Anda”, never “anda”; the prompt asks for it, and this makes sure. */
function tidy<T>(value: T, language: Language): T {
  if (language !== 'ms') return value
  if (typeof value === 'string') return value.replace(/(^|[.!?]\s+)anda\b/g, '$1Anda') as T
  if (Array.isArray(value)) return value.map((item) => tidy(item, language)) as T
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, tidy(item, language)])) as T
  return value
}

function validateTranslation(source: unknown, translated: unknown, language: Language, path = 'translation'): string[] {
  if (typeof source === 'string') {
    if (typeof translated !== 'string') return [`${path}: expected a string`]
    return validateString(source, translated, language, path)
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) return [`${path}: invalid English source shape`]
  if (!translated || typeof translated !== 'object' || Array.isArray(translated)) return [`${path}: expected an object`]

  const sourceRecord = source as Record<string, unknown>
  const translatedRecord = translated as Record<string, unknown>
  const sourceKeys = Object.keys(sourceRecord).sort()
  const translatedKeys = Object.keys(translatedRecord).sort()
  if (sourceKeys.join('\0') !== translatedKeys.join('\0')) {
    return [`${path}: keys differ (expected ${sourceKeys.join(', ')}, got ${translatedKeys.join(', ')})`]
  }
  return sourceKeys.flatMap((key) =>
    validateTranslation(sourceRecord[key], translatedRecord[key], language, `${path}.${key}`)
  )
}

function scenarioSchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      situation: { type: 'string' },
      options: {
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'string' }, c: { type: 'string' }, d: { type: 'string' } },
        required: ['a', 'b', 'c', 'd'],
        additionalProperties: false
      }
    },
    required: ['situation', 'options'],
    additionalProperties: false
  }
}

function skillSchema(withScenarios: boolean): Record<string, unknown> {
  const required = ['name', 'statements', 'reversed_statements']
  const properties: Record<string, unknown> = {
    name: { type: 'string' },
    statements: {
      type: 'object',
      properties: { basic: { type: 'string' }, working: { type: 'string' }, advanced: { type: 'string' } },
      required: ['basic', 'working', 'advanced'],
      additionalProperties: false
    },
    reversed_statements: {
      type: 'object',
      properties: { basic: { type: 'string' }, advanced: { type: 'string' } },
      required: ['basic', 'advanced'],
      additionalProperties: false
    }
  }
  if (withScenarios) {
    required.push('scenarios')
    properties.scenarios = {
      type: 'object',
      properties: { basic: scenarioSchema(), advanced: scenarioSchema() },
      required: ['basic', 'advanced'],
      additionalProperties: false
    }
  }
  return { type: 'object', properties, required, additionalProperties: false }
}

function itemsSchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: { items: { type: 'array', items: { type: 'string' } } },
    required: ['items'],
    additionalProperties: false
  }
}

function scenarioOptions(source: SourceScenario): Record<OptionId, string> {
  const options = Object.fromEntries(source.options.map(({ id, text }) => [id, text])) as Record<OptionId, string>
  if (!(['a', 'b', 'c', 'd'] as OptionId[]).every((id) => typeof options[id] === 'string')) {
    throw new Error('scenario source must have options a, b, c and d')
  }
  return options
}

function sourceScenario(source: SourceScenario): ScenarioTranslation {
  return { situation: source.situation, options: scenarioOptions(source) }
}

function makeSourceSkill(
  code: string,
  cornerId: string,
  roleByCode: Map<string, any>,
  scenarioRoles: any
): SkillTranslation {
  const role = roleByCode.get(code)
  const corner = role?.corners?.find((item: SourceCorner) => item.corner_id === cornerId) as SourceCorner | undefined
  const scenario = scenarioRoles?.[code]?.[cornerId]
  if (!corner) throw new Error(`Missing English skill for ${code} ${cornerId}`)
  const skill: SkillTranslation = {
    name: corner.name,
    statements: corner.statements,
    reversed_statements: corner.reversed_statements
  }
  // A job without scenarios is translated without them, so neither the source nor the schema carries the key.
  if (scenario?.basic && scenario?.advanced) {
    skill.scenarios = { basic: sourceScenario(scenario.basic), advanced: sourceScenario(scenario.advanced) }
  }
  return skill
}

function translationFromLocale(locale: LocaleFile, code: string, cornerId: string): SkillTranslation {
  const corner = locale.roles?.[code]?.corners?.[cornerId]
  if (!corner) throw new Error(`Missing locale example for ${code} ${cornerId}`)
  const translated: SkillTranslation = {
    name: corner.name as string,
    statements: corner.statements as Record<Tier, string>,
    reversed_statements: corner.reversed_statements as Record<'basic' | 'advanced', string>
  }
  const scenarios = locale.scenarios?.[code]?.[cornerId]
  if (scenarios) translated.scenarios = scenarios as SkillTranslation['scenarios']
  return translated
}

function promptRules(language: Language, kind: Kind): string {
  const languageRules =
    language === 'ms'
      ? [
          'Write Bahasa Malaysia as used in Malaysia and following Dewan Bahasa dan Pustaka usage; never use Indonesian.',
          'Use “anda” in lower case inside a sentence and “Anda” at the start of one. “I can …” is “Saya boleh …”; “I would still need help to …” is “Saya masih perlukan bantuan untuk …”; “I would struggle to …” is “Saya sukar untuk …”.',
          'Keep every Malay string within about 120% of its English length.'
        ]
      : [
          'Write Simplified Chinese as Malaysian Chinese readers use it. Use “你”, full-width Chinese punctuation, and exactly one half-width space between Chinese and a Latin word or number.',
          'Write dates the Chinese way, such as 4月15日 or 星期六; never leave an English month or weekday name.',
          '“I can …” is “我能……” ; “I would still need help to …” is “我仍需要别人帮忙才能……” ; “I would struggle to …” is “我很难……”.'
        ]
  const taskRules: Record<Kind, string[]> = {
    skills: [
      'You translate one O*NET skill and its two what-would-you-do scenarios for Kotak. Return only the requested JSON object.',
      'Translate the skill name, all can-do statements, both reversed statements, both scenario situations, and all eight options.',
      'Keep the three skill tiers distinct. Preserve the meaning and strength of every statement.',
      'The four scenario options are ranked by hidden scores. Do not reorder them. Keep each option exactly as strong or weak as its English source; never improve a weak option or weaken a strong one. Keep the four options close in length to each other, as they are in English.'
    ],
    explainers: [
      'You translate the plain-language explainers of one O*NET job’s skill corners for Kotak. Return only the requested JSON object.',
      'Translate every string in items, one by one, and return them in the same order with the same length.',
      'These explainers tell a reader who has never done the job what the task involves. Keep them plain, concrete and at the same reading level as the English; do not add, drop or merge detail.'
    ],
    titles: [
      'You translate O*NET occupation titles into the target language for Kotak. Return only the requested JSON object.',
      'Translate every title in items, one by one, and return them in the same order with the same length.',
      'Use the name a Malaysian employer or jobseeker would recognise for that occupation, not a word-for-word rendering. Never translate the name of a product, platform or company inside a title.'
    ],
    resources: [
      'You translate the titles of free learning resources of one O*NET job’s skill corners for Kotak. Return only the requested JSON object.',
      'Translate every title in items, one by one, and return them in the same order with the same length.',
      'Translate a “Search:” prefix as “Cari:” in Malay and “搜索：” in Chinese, and translate the query after it. Keep the site or organisation name before a colon verbatim: MDN, freeCodeCamp, web.dev, GOV.UK. Never translate a URL, and never invent a resource that is not in items.'
    ]
  }
  return [
    ...taskRules[kind],
    ...languageRules,
    'Keep every place name, company type, product, tool, and number. Keep Kotak, Kopi, O*NET, SDG, RM, AI, and every capitalised product or company name in the English verbatim.',
    'Use the JSON keys exactly as supplied. Do not add explanations, comments, or other keys.'
  ].join('\n')
}

function maxTokensFor(provider: Provider): number {
  return positiveEnvNumber('TRANSLATE_MAX_TOKENS', provider.name === 'runpod' ? RUNPOD_MAX_TOKENS : PROVIDER_MAX_TOKENS)
}

function namesToPreserve(source: unknown): string {
  const names = [...new Set(sourceStrings(source).flatMap(nameCandidates))].sort()
  return `Names to preserve verbatim: ${names.length > 0 ? names.join(', ') : '(none identified)'}.`
}

function retryNote(validationErrors: string[]): string {
  return validationErrors.length > 0
    ? `\nYour previous response failed validation. Correct every issue below:\n${validationErrors.map((error) => `- ${error}`).join('\n')}`
    : ''
}

function buildSkillRequest(
  source: SkillTranslation,
  language: Language,
  example: { source: SkillTranslation; translated: SkillTranslation },
  provider: Provider,
  validationErrors: string[] = []
): ChatRequest {
  const label = language === 'ms' ? 'Bahasa Malaysia' : 'Simplified Chinese'
  const userInput = [
    `Translate this complete skill${source.scenarios ? ' and its two scenarios' : ''} into ${label}.`,
    namesToPreserve(source),
    `English source:\n${JSON.stringify(source, null, 2)}${retryNote(validationErrors)}`
  ].join('\n\n')
  return {
    ...baseRequest(provider, 'translated_skill', skillSchema(source.scenarios !== undefined)),
    messages: [
      { role: 'system', content: promptRules(language, 'skills') },
      {
        role: 'user',
        content: `Complete worked example. First the English source:\n${JSON.stringify(example.source, null, 2)}\n\nThen its approved ${label} translation follows.`
      },
      { role: 'assistant', content: JSON.stringify(example.translated) },
      { role: 'user', content: userInput }
    ]
  }
}

function baseRequest(provider: Provider, schemaName: string, schema: Record<string, unknown>): ChatRequest {
  const request: ChatRequest = {
    model: provider.model ?? RUNPOD_MODEL,
    messages: [],
    response_format: { type: 'json_schema', json_schema: { name: schemaName, schema, strict: true } },
    temperature: 0,
    max_tokens: maxTokensFor(provider)
  }
  if (provider.name === 'runpod') {
    request.chat_template_kwargs = { enable_thinking: false }
  } else if (provider.reasoningEffort) {
    request.reasoning_effort = provider.reasoningEffort
  }
  return request
}

function buildItemsRequest(
  items: string[],
  language: Language,
  kind: Exclude<Kind, 'skills'>,
  example: { source: string[]; translated: string[] },
  provider: Provider,
  validationErrors: string[] = []
): ChatRequest {
  const label = language === 'ms' ? 'Bahasa Malaysia' : 'Simplified Chinese'
  const userInput = [
    `Translate these ${items.length} string(s) into ${label}. Return them in the same order.`,
    namesToPreserve(items),
    `English items:\n${JSON.stringify({ items }, null, 2)}${retryNote(validationErrors)}`
  ].join('\n\n')
  return {
    ...baseRequest(provider, `translated_${kind}`, itemsSchema()),
    messages: [
      { role: 'system', content: promptRules(language, kind) },
      {
        role: 'user',
        content: `Complete worked example. Translate these ${example.source.length} string(s) into ${label}:\n${JSON.stringify({ items: example.source }, null, 2)}`
      },
      { role: 'assistant', content: JSON.stringify({ items: example.translated }) },
      { role: 'user', content: userInput }
    ]
  }
}

function estimateTokens(request: ChatRequest): number {
  const serialized = JSON.stringify(request)
  let cjk = 0
  let nonCjk = 0
  for (const character of serialized) {
    if (/\p{Script=Han}/u.test(character)) cjk++
    else nonCjk++
  }
  // A conservative character-based estimate: about 3.5 non-CJK characters or 1.1 Han characters per token.
  return Math.ceil(nonCjk / 3.5 + cjk * 1.1 + 100)
}

function loadLocaleFile(language: Language): Promise<LocaleFile> {
  return Bun.file(resolve(ROOT, `data/generated/i18n/${language}.json`)).json() as Promise<LocaleFile>
}

type Sources = {
  roles: any[]
  roleByCode: Map<string, any>
  scenarioRoles: any
  titleByCode: Map<string, string>
  explainers: Record<string, Record<string, Record<string, string>>>
}

async function loadSources(): Promise<Sources> {
  const roleFile = (await Bun.file(resolve(ROOT, 'data/generated/role-corners.json')).json()) as { roles: any[] }
  const scenarioFile = (await Bun.file(resolve(ROOT, 'data/generated/scenarios.json')).json()) as { roles: any }
  const explainerFile = (await Bun.file(
    resolve(ROOT, 'data/generated/statement-explainers.json')
  ).json()) as Sources['explainers']
  const occupationFile = (await Bun.file(resolve(ROOT, 'data/onet/occupations.json')).json()) as {
    occupations: { onet_code: string; title: string }[]
  }
  return {
    roles: roleFile.roles,
    roleByCode: new Map(roleFile.roles.map((role) => [role.onet_code, role])),
    scenarioRoles: scenarioFile.roles,
    titleByCode: new Map(occupationFile.occupations.map(({ onet_code, title }) => [onet_code, title])),
    explainers: explainerFile
  }
}

function expectedBrokenSample(name: string, errors: string[], expected: string): void {
  if (!errors.some((error) => error.toLowerCase().includes(expected.toLowerCase()))) {
    throw new Error(
      `self-test: broken sample “${name}” did not trigger ${expected}; got: ${errors.join('; ') || 'no errors'}`
    )
  }
}

function buildSourceSkill(code: string, cornerId: string, sources: Sources): SkillTranslation {
  return makeSourceSkill(code, cornerId, sources.roleByCode, sources.scenarioRoles)
}

function itemsFor(code: string, kind: Exclude<Kind, 'skills'>, sources: Sources): string[] {
  const role = sources.roleByCode.get(code)
  if (!role) throw new Error(`Unknown O*NET-SOC code: ${code}`)
  const corners = role.corners as SourceCorner[]
  const lines: string[] = []
  if (kind === 'titles') return [sources.titleByCode.get(code) ?? role.title]
  for (const corner of corners) {
    if (kind === 'resources') {
      for (const resource of corner.resources ?? []) lines.push(resource.title)
    } else {
      // The explainer tiers come from the locale-file-free source, so the few-shot order is stable.
      const explainers = sources.explainers[code]?.[corner.corner_id]
      for (const tier of EXPLAINER_TIERS) {
        const line = explainers?.[tier]
        if (typeof line === 'string' && line.trim() !== '') lines.push(line)
      }
    }
  }
  return lines
}

/** The few-shot for explainers comes from the locale file; a locale overlay is usable only when every value is a
 * non-empty string that passes the same validation a live answer must pass. */
function validExplainersExample(
  code: string,
  language: Language,
  translated: string[] | undefined,
  source: string[]
): { source: string[]; translated: string[] } | undefined {
  if (!translated || translated.length !== source.length) return undefined
  const errors = source.flatMap((line, index) =>
    validateString(line, translated[index]!, language, `few-shot explainers ${code} ${index + 1}`)
  )
  return errors.length === 0 ? { source, translated } : undefined
}

function translationFor(
  code: string,
  kind: Exclude<Kind, 'skills'>,
  sources: Sources,
  locale: LocaleFile
): string[] | undefined {
  const role = sources.roleByCode.get(code)
  if (!role) throw new Error(`Unknown O*NET-SOC code: ${code}`)
  const corners = role.corners as SourceCorner[]
  const translated: string[] = []
  if (kind === 'titles') {
    const title = locale.roles?.[code]?.title
    return typeof title === 'string' ? [title] : undefined
  }
  for (const corner of corners) {
    const overlay = locale.roles?.[code]?.corners?.[corner.corner_id]
    if (kind === 'resources') {
      for (const resource of corner.resources ?? []) {
        const value = (overlay?.resources as Record<string, unknown> | undefined)?.[resource.url]
        if (typeof value !== 'string' || value.trim() === '') return undefined
        translated.push(value)
      }
    } else {
      const explainers = sources.explainers[code]?.[corner.corner_id]
      const overlayExplainers = locale.explainers?.[code]?.[corner.corner_id]
      for (const [tier, line] of Object.entries(explainers ?? {})) {
        if (typeof line !== 'string') continue
        const value = overlayExplainers?.[tier]
        if (typeof value !== 'string' || value.trim() === '') return undefined
        translated.push(value)
      }
    }
  }
  return translated
}

function exampleItems(
  language: Language,
  kind: Exclude<Kind, 'skills'>,
  sources: Sources,
  locale: LocaleFile
): { source: string[]; translated: string[] } {
  if (kind !== 'explainers') {
    const pairs = kind === 'titles' ? TITLE_EXAMPLES : RESOURCE_EXAMPLES
    const column = language === 'ms' ? 1 : 2
    return { source: pairs.map((pair) => pair[0]), translated: pairs.map((pair) => pair[column]) }
  }
  const source = itemsFor(DEMO_EXAMPLE.code, kind, sources)
  const valid = validExplainersExample(
    DEMO_EXAMPLE.code,
    language,
    translationFor(DEMO_EXAMPLE.code, kind, sources, locale),
    source
  )
  if (!valid) throw new Error(`Missing or invalid ${language} few-shot example for explainers (${DEMO_EXAMPLE.code})`)
  return valid
}

async function selfTest(sources: Sources, locales: Record<Language, LocaleFile>): Promise<void> {
  let checked = 0
  const failures: string[] = []
  for (const code of DEMO_CODES) {
    const role = sources.roleByCode.get(code)
    if (!role) throw new Error(`self-test: missing demo role ${code}`)
    for (const corner of role.corners as SourceCorner[]) {
      const source = buildSourceSkill(code, corner.corner_id, sources)
      for (const language of LANGUAGES) {
        const translated = translationFromLocale(locales[language], code, corner.corner_id)
        const errors = validateTranslation(source, translated, language, `${code}.${corner.corner_id}`)
        failures.push(...errors.slice(0, 4))
        checked++
      }
    }
  }
  if (failures.length > 0)
    throw new Error(`self-test: demo overlay validation failed: ${failures.slice(0, 12).join('; ')}`)

  const demoSource = buildSourceSkill(DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId, sources)

  const goodMs = translationFromLocale(locales.ms, DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId)
  const goodZh = translationFromLocale(locales.zh, DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId)

  const emptySample = structuredClone(goodZh)
  emptySample.name = ''
  const emptyErrors = validateTranslation(demoSource, emptySample, 'zh')
  expectedBrokenSample('empty string', emptyErrors, 'empty string')
  expectedBrokenSample('no CJK characters', emptyErrors, 'no Chinese characters')

  const digitSource = structuredClone(demoSource)
  const digitTranslation = structuredClone(goodZh)
  digitSource.scenarios!.basic.situation = 'There are 3 tasks to review.'
  digitTranslation.scenarios!.basic.situation = '有三项任务需要检查。'
  expectedBrokenSample('dropped digit', validateTranslation(digitSource, digitTranslation, 'zh'), 'digit sequence 3')

  const languageSample = structuredClone(goodMs)
  languageSample.statements.basic = 'Saya bisa mencuba ini.'
  delete (languageSample.scenarios!.basic.options as Partial<Record<OptionId, string>>).d
  const languageErrors = validateTranslation(demoSource, languageSample, 'ms')
  expectedBrokenSample('Indonesian word', languageErrors, 'Indonesian term')
  expectedBrokenSample('missing key', languageErrors, 'keys differ')

  const cjkSpaceSample = structuredClone(goodZh)
  cjkSpaceSample.name = `网页开发人员vsWeb`
  expectedBrokenSample('missing CJK space', validateTranslation(demoSource, cjkSpaceSample, 'zh'), 'half-width space')

  const longerSample = structuredClone(goodMs)
  longerSample.name =
    'Pembangun laman web yang membina dan menyelenggara laman web moden untuk organisasi besar hari ini'
  expectedBrokenSample('too long', validateTranslation(demoSource, longerSample, 'ms'), '1.6×')

  for (const kind of KINDS) {
    for (const language of LANGUAGES) {
      const skillExample = {
        source: buildSourceSkill(DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId, sources),
        translated: translationFromLocale(locales[language], DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId)
      }
      const itemsExample = kind === 'skills' ? undefined : exampleItems(language, kind, sources, locales[language])
      const provider = providerConfig({ dryRun: true })
      const request =
        kind === 'skills'
          ? buildSkillRequest(skillExample.source, language, skillExample, provider)
          : buildItemsRequest(itemsExample!.source, language, kind, itemsExample!, provider)
      const serialized = JSON.stringify(request)
      const expectedItems = kind === 'skills' ? 1 : itemsExample!.source.length
      if (request.messages.length !== 4)
        throw new Error(`self-test: ${kind} request has ${request.messages.length} messages`)
      if (kind !== 'skills' && !serialized.includes(`"items"`))
        throw new Error(`self-test: ${kind} request lost its items`)
      if (
        kind === 'skills' &&
        !serialized.includes(buildSourceSkill(DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId, sources).name)
      )
        throw new Error(`self-test: ${kind} request lost its source`)
      if (expectedItems < 1) throw new Error(`self-test: ${kind} example is empty`)
      if (process.env.TRANSLATE_API_KEY && serialized.includes(process.env.TRANSLATE_API_KEY))
        throw new Error('self-test: the API key leaked into a request')
      if (provider.name === 'runpod' ? !('chat_template_kwargs' in request) : 'chat_template_kwargs' in request)
        throw new Error(`self-test: ${kind} request has the wrong provider parameters`)
    }
  }

  for (const code of ['15-1254.00', '17-2111.02', '11-1011.00']) {
    const items = itemsFor(code, 'explainers', sources)
    const provider = providerConfig({ dryRun: true })
    buildItemsRequest(items, 'ms', 'explainers', exampleItems('ms', 'explainers', sources, locales.ms), provider)
  }
  const noScenario = '17-2111.02'
  const skill = buildSourceSkill(
    noScenario,
    (sources.roleByCode.get(noScenario).corners as SourceCorner[])[0].corner_id,
    sources
  )
  if (skill.scenarios !== undefined) throw new Error('self-test: a job without scenarios kept the scenarios key')
  const noScenarioRequest = buildSkillRequest(
    skill,
    'ms',
    {
      source: buildSourceSkill(DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId, sources),
      translated: translationFromLocale(locales.ms, DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId)
    },
    providerConfig({ dryRun: true })
  )
  if (!noScenarioRequest.response_format.json_schema.schema.required) throw new Error('self-test: missing schema')
  const required = noScenarioRequest.response_format.json_schema.schema.required as string[]
  // Names to preserve quotable strings belong to the source, not to the request, so a stray "scenario" word there is
  // fine; the schema and the English source must not carry the key.
  if (required.includes('scenarios') || JSON.stringify(noScenarioRequest.messages[3]).includes('"scenarios"'))
    throw new Error('self-test: a job without scenarios still asked for scenarios')

  console.log(
    `Self-test passed: ${checked} existing demo skill translations passed; 5 broken samples were rejected; every kind builds ${KINDS.length} request shapes.`
  )
}

async function writeDryRun(
  plan: Plan,
  locales: Record<Language, LocaleFile>,
  sources: Sources,
  provider: Provider
): Promise<void> {
  mkdirSync(DRY_RUN_DIR, { recursive: true })
  for (const name of readdirSync(DRY_RUN_DIR)) {
    if (name.endsWith('.json')) unlinkSync(resolve(DRY_RUN_DIR, name))
  }
  const examples = new Map<Language, any>(
    plan.languages.map((language) => [
      language,
      plan.jobs[0].kind === 'skills'
        ? {
            source: buildSourceSkill(DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId, sources),
            translated: translationFromLocale(locales[language], DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId)
          }
        : exampleItems(language, plan.jobs[0].kind, sources, locales[language])
    ])
  )

  let largest = { tokens: 0, item: '' }
  let requests = 0
  for (const job of plan.jobs) {
    for (const language of plan.languages) {
      const chunks = job.kind === 'skills' ? [job.source] : chunk(job.items!, TITLES_PER_REQUEST)
      for (const [index, part] of chunks.entries()) {
        const request =
          job.kind === 'skills'
            ? buildSkillRequest(part as SkillTranslation, language, examples.get(language), provider)
            : buildItemsRequest(part as string[], language, job.kind, examples.get(language), provider)
        const suffix = chunks.length > 1 ? `_${index + 1}` : ''
        const filename = `${job.kind}_${language}_${job.code}${job.cornerId ? `_${job.cornerId}` : ''}${suffix}.json`
        await Bun.write(resolve(DRY_RUN_DIR, filename), `${JSON.stringify(request, null, 2)}\n`)
        requests++
        const tokens = estimateTokens(request)
        if (tokens > largest.tokens) ((largest.tokens = tokens), (largest.item = `${job.kind} ${language} ${job.code}`))
      }
    }
  }
  const maxTokens = maxTokensFor(provider)
  const maxTotal = largest.tokens + maxTokens
  console.log(
    `Built ${requests} request(s) for ${plan.jobs.length} job(s) and ${plan.languages.length} language(s), kind ${plan.jobs[0].kind}.`
  )
  console.log(
    `Largest request: about ${largest.tokens.toLocaleString()} prompt tokens (${largest.item}); with the ${maxTokens.toLocaleString()} token output cap, about ${maxTotal.toLocaleString()} / ${CONTEXT_LIMIT.toLocaleString()} context tokens.`
  )
  console.log(`Wrote request JSON files to ${DRY_RUN_DIR}/. No network calls were made.`)
}

type RunStats = {
  request_count: number
  retries: number
  failures: number
  prompt_tokens: number
  completion_tokens: number
  reasoning_tokens: number
}

function newStats(): RunStats {
  return { request_count: 0, retries: 0, failures: 0, prompt_tokens: 0, completion_tokens: 0, reasoning_tokens: 0 }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size))
  return chunks
}

// `--dry-run` only needs the request shape, so it builds one without a key; a paid run always requires one.
function providerConfig({ dryRun = false }: { dryRun?: boolean } = {}): Provider {
  const base = process.env.TRANSLATE_BASE_URL
  if (base) {
    const apiKey = process.env.TRANSLATE_API_KEY
    if (!apiKey && !dryRun) throw new Error('Set TRANSLATE_API_KEY for TRANSLATE_BASE_URL (see runpod/README.md).')
    const model = process.env.TRANSLATE_MODEL
    if (!model) throw new Error('Set TRANSLATE_MODEL for TRANSLATE_BASE_URL (see runpod/README.md).')
    return {
      host: new URL(base).host,
      name: 'openai-compatible',
      baseUrl: base.replace(/\/+$/, ''),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      model,
      concurrency: positiveEnvNumber('TRANSLATE_CONCURRENCY', CONCURRENCY),
      maxTokens: PROVIDER_MAX_TOKENS,
      rpm: process.env.TRANSLATE_RPM ? positiveEnvNumber('TRANSLATE_RPM', 0) : undefined,
      reasoningEffort: process.env.TRANSLATE_REASONING_EFFORT || undefined
    }
  }
  const apiKey = process.env.RUNPOD_API_KEY
  const endpointId = process.env.RUNPOD_ENDPOINT_ID ?? (dryRun ? 'dry-run' : undefined)
  if (!dryRun && (!apiKey || !endpointId))
    throw new Error('Set RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID (see runpod/README.md).')
  return {
    host: 'runpod',
    name: 'runpod',
    baseUrl: `https://api.runpod.ai/v2/${endpointId}/openai/v1`,
    headers: {
      Authorization: `Bearer ${apiKey ?? 'dry-run'}`,
      'Content-Type': 'application/json'
    },
    concurrency: positiveEnvNumber('TRANSLATE_CONCURRENCY', CONCURRENCY),
    maxTokens: RUNPOD_MAX_TOKENS,
    rpm: process.env.TRANSLATE_RPM ? positiveEnvNumber('TRANSLATE_RPM', 0) : undefined,
    reasoningEffort: process.env.TRANSLATE_REASONING_EFFORT || undefined
  }
}

/** Spaces requests evenly so they stay under `rpm` a minute; no cap without it. */
function limiterFor(rpm: number | undefined): () => Promise<void> {
  if (!rpm) return async () => {}
  const intervalMs = 60_000 / rpm
  let next = 0
  return async () => {
    const now = Date.now()
    const at = Math.max(now, next)
    next = at + intervalMs
    if (at > now) await Bun.sleep(at - now)
  }
}

async function waitForWorker(baseUrl: string, headers: HeadersInit): Promise<string> {
  const started = Date.now()
  for (let poll = 0; ; poll++) {
    try {
      const response = await fetch(`${baseUrl}/models`, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if ([401, 403, 404].includes(response.status)) {
        throw new FatalError(
          `GET /models returned HTTP ${response.status}: check RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID`
        )
      }
      const body = (await response.json().catch(() => null)) as { data?: { id?: string }[] } | null
      if (response.ok && body?.data?.[0]?.id) return body.data[0].id
    } catch (error) {
      if (error instanceof FatalError) throw error
    }
    if (Date.now() - started > COLD_START_LIMIT_MS) throw new FatalError('no worker answered within 30 minutes')
    if (poll === 0) console.log('Waiting for a worker to start (cold start)...')
    await Bun.sleep(10_000)
  }
}

// One GET /models check against a third-party API: it names the model to record and stops the run on a bad key,
// rather than failing 923 jobs one by one.
async function checkProvider(provider: Provider): Promise<string | undefined> {
  const response = await fetch(`${provider.baseUrl}/models`, {
    headers: provider.headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })
  const text = await response.text()
  if ([401, 403, 404].includes(response.status)) {
    throw new FatalError(`GET ${provider.baseUrl}/models returned HTTP ${response.status}: check TRANSLATE_API_KEY.`)
  }
  if (!response.ok) return undefined
  const body = (() => {
    try {
      return JSON.parse(text) as { data?: { id?: string }[] }
    } catch {
      return null
    }
  })()
  return body?.data?.[0]?.id
}

async function complete(
  request: ChatRequest,
  provider: Provider,
  stats: RunStats,
  limit: () => Promise<void>
): Promise<{ text: string; finish: string }> {
  const body = JSON.stringify(request)
  for (let failure = 0; ; failure++) {
    let problem: string
    let retryAfterMs: number | undefined
    try {
      await limit()
      stats.request_count++
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: provider.headers,
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      })
      const text = await response.text()
      const json = (() => {
        try {
          return JSON.parse(text)
        } catch {
          return null
        }
      })()
      stats.prompt_tokens += json?.usage?.prompt_tokens ?? 0
      stats.completion_tokens += json?.usage?.completion_tokens ?? 0
      stats.reasoning_tokens += json?.usage?.completion_tokens_details?.reasoning_tokens ?? 0

      if ([401, 403, 404].includes(response.status))
        throw new FatalError(`HTTP ${response.status}: ${text.slice(0, 300)}`)
      if (json?.error?.type === 'startup_error') throw new FatalError(`worker failed to start: ${json.error.message}`)
      // A content filter refuses one prompt, not the run: that item fails and keeps its English.
      if (response.status === 400 && json?.error?.code === 'content_policy_violation') {
        refusals++
        if (refusals >= MAX_REFUSALS)
          throw new FatalError(
            `stopped after ${refusals} content-filter refusals, to protect the key: ${json.error.message}`
          )
        throw new RefusedError(`content filter: ${json.error.message}`)
      }
      if ([400, 422].includes(response.status)) throw new FatalError(`request rejected: ${text.slice(0, 300)}`)
      const choice = json?.choices?.[0]
      if (response.ok && choice) {
        return {
          text: typeof choice.message?.content === 'string' ? choice.message.content : '',
          finish: choice.finish_reason ?? ''
        }
      }
      if (response.ok) throw new RequestError(`no completion in the response: ${text.slice(0, 200)}`)
      if (response.status === 429) {
        const header = Number(response.headers.get('retry-after'))
        // Some providers answer 429 with a JSON body instead of the header.
        const bodyDelay = json?.error?.retry_after ?? json?.retry_after
        const seconds = Number.isFinite(header) && header > 0 ? header : Number(bodyDelay)
        if (Number.isFinite(seconds) && seconds > 0) retryAfterMs = seconds * 1_000
      }
      problem = `HTTP ${response.status}: ${text.slice(0, 200)}`
    } catch (error) {
      if (error instanceof FatalError || error instanceof RequestError || error instanceof RefusedError) throw error
      problem = (error as Error).message
    }
    if (failure >= HTTP_RETRIES) throw new Error(`gave up after ${HTTP_RETRIES + 1} tries: ${problem}`)
    stats.retries++
    const backoff = Math.min(60_000, 2_000 * 2 ** failure) * (0.5 + Math.random())
    await Bun.sleep(Math.min(15 * 60_000, Math.max(retryAfterMs ?? 0, backoff)))
  }
}

type FailedItem = { onet_code: string; corner_id: string | null; errors: string[] }
type Job = {
  code: string
  cornerId?: string
  kind: Kind
  source?: SkillTranslation
  items?: string[]
  /** Resource URLs and explainer tiers in the same order as `items`. */
  refs?: ({ url: string; cornerId: string } | { tier: string; cornerId: string } | { code: string })[]
}

type Accepted = Map<string, { language: Language; job: Job; value: SkillTranslation | string[] }>

function acceptedKey(job: Job, language: Language): string {
  return `${job.kind}:${language}:${job.code}:${job.cornerId ?? ''}`
}

function itemLabel(job: Job, language: Language): string {
  return job.kind === 'skills' ? `${language} ${job.code} ${job.cornerId}` : `${language} ${job.kind} ${job.code}`
}

async function translateOne(
  job: Job,
  language: Language,
  examples: Map<Language, any>,
  provider: Provider,
  stats: RunStats,
  limit: () => Promise<void>,
  accepted: Accepted,
  failures: FailedItem[]
): Promise<void> {
  const example = examples.get(language)
  let validationErrors: string[] = []
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const answer =
        job.kind === 'skills'
          ? await complete(
              buildSkillRequest(job.source!, language, example, provider, validationErrors),
              provider,
              stats,
              limit
            )
          : await complete(
              buildItemsRequest(job.items!, language, job.kind, example, provider, validationErrors),
              provider,
              stats,
              limit
            )
      let parsed: unknown
      try {
        parsed = JSON.parse(answer.text)
      } catch {
        validationErrors = ['response is not valid JSON']
        if (answer.finish === 'length') validationErrors.unshift('answer hit max_tokens and was cut off')
      }
      if (parsed !== undefined) {
        if (job.kind === 'skills') {
          const translated = parsed as SkillTranslation
          validationErrors = validateTranslation(job.source, translated, language, `${job.code}.${job.cornerId}`)
          if (validationErrors.length === 0) {
            accepted.set(acceptedKey(job, language), { language, job, value: tidy(translated, language) })
            console.log(`${itemLabel(job, language)} ok (try ${attempt})`)
            return
          }
        } else {
          const items = (parsed as { items?: unknown })?.items
          validationErrors =
            Array.isArray(items) &&
            items.length === job.items!.length &&
            items.every((item) => typeof item === 'string')
              ? items.flatMap((item, index) =>
                  validateString(job.items![index]!, item as string, language, `${job.code} item ${index + 1}`)
                )
              : [`expected ${job.items!.length} items, got ${Array.isArray(items) ? items.length : 'none'}`]
          if (validationErrors.length === 0) {
            accepted.set(acceptedKey(job, language), { language, job, value: tidy(items as string[], language) })
            console.log(`${itemLabel(job, language)} ok (try ${attempt})`)
            return
          }
        }
        if (answer.finish === 'length') validationErrors.unshift('answer hit max_tokens and was cut off')
      }
    } catch (error) {
      if (error instanceof FatalError) throw error
      validationErrors = [(error as Error).message]
      if (error instanceof RefusedError) {
        console.log(`${itemLabel(job, language)} refused by the content filter; not resent`)
        stats.failures++
        failures.push({ onet_code: job.code, corner_id: job.cornerId ?? null, errors: validationErrors })
        return
      }
    }
    if (attempt < 3) stats.retries++
    console.log(`${itemLabel(job, language)} try ${attempt} rejected: ${validationErrors.slice(0, 3).join('; ')}`)
    if (attempt === 3) {
      stats.failures++
      failures.push({ onet_code: job.code, corner_id: job.cornerId ?? null, errors: validationErrors })
    }
  }
}

function mergeAccepted(locales: Record<Language, LocaleFile>, accepted: Accepted): Set<Language> {
  const changed = new Set<Language>()
  for (const { language, job, value } of accepted.values()) {
    if (job.kind === 'skills' && DEMO_CODES.includes(job.code))
      throw new Error(`Refusing to overwrite demo job ${job.code}`)
    const locale = locales[language]
    if (job.kind === 'skills') {
      const translated = value as SkillTranslation
      const roleEntry = locale.roles[job.code] ?? { corners: {} }
      if (roleEntry.corners[job.cornerId!]?.name) continue
      locale.roles[job.code] = {
        ...roleEntry,
        corners: {
          ...roleEntry.corners,
          [job.cornerId!]: {
            ...roleEntry.corners[job.cornerId!],
            name: translated.name,
            statements: translated.statements,
            reversed_statements: translated.reversed_statements
          }
        }
      }
      if (translated.scenarios) {
        const jobScenarios = locale.scenarios?.[job.code] ?? {}
        locale.scenarios = {
          ...locale.scenarios,
          [job.code]: { ...jobScenarios, [job.cornerId!]: { ...jobScenarios[job.cornerId!], ...translated.scenarios } }
        }
      }
    } else if (job.kind === 'titles') {
      job.refs!.forEach((ref, index) => {
        const { code } = ref as { code: string }
        const roleEntry = locale.roles[code] ?? { corners: {} }
        if (!roleEntry.title) locale.roles[code] = { ...roleEntry, title: (value as string[])[index]! }
      })
    } else if (job.kind === 'explainers') {
      const jobExplainers = locale.explainers?.[job.code] ?? {}
      const merged = { ...jobExplainers }
      job.refs!.forEach((ref, index) => {
        const { tier, cornerId } = ref as { tier: string; cornerId: string }
        if (!merged[cornerId]?.[tier]) merged[cornerId] = { ...merged[cornerId], [tier]: (value as string[])[index]! }
      })
      locale.explainers = { ...locale.explainers, [job.code]: merged }
    } else {
      const roleEntry = locale.roles[job.code] ?? { corners: {} }
      const corners = { ...roleEntry.corners }
      job.refs!.forEach((ref, index) => {
        const cornerId = refCornerId(job, index)
        const overlay = corners[cornerId] ?? {}
        if ((overlay.resources as Record<string, string> | undefined)?.[(ref as { url: string }).url]) return
        corners[cornerId] = {
          ...overlay,
          resources: {
            ...(overlay.resources as Record<string, string> | undefined),
            [(ref as { url: string }).url]: (value as string[])[index]!
          }
        }
      })
      locale.roles[job.code] = { ...roleEntry, corners }
    }
    changed.add(language)
  }
  return changed
}

function refCornerId(job: Job, index: number): string {
  return (job.refs![index] as { cornerId: string }).cornerId
}

async function writeLocaleFiles(
  locales: Record<Language, LocaleFile>,
  changed: Set<Language>,
  pretty: boolean
): Promise<void> {
  for (const language of changed) {
    const path = resolve(ROOT, `data/generated/i18n/${language}.json`)
    await Bun.write(path, `${JSON.stringify(locales[language], null, 2)}\n`)
  }
  if (!pretty || changed.size === 0) return
  const paths = [...changed].map((language) => resolve(ROOT, `data/generated/i18n/${language}.json`))
  const result = Bun.spawnSync(['bunx', 'prettier', '--write', ...paths], { cwd: ROOT, stdout: 'pipe', stderr: 'pipe' })
  if (result.exitCode !== 0) throw new Error(`Prettier failed: ${Buffer.from(result.stderr).toString('utf8')}`)
}

type RunRecord = {
  provider: string
  model: string
  reasoning_effort: string | null
  kind: Kind
  languages: Language[]
  job_count: number
  job_codes: string[]
  started_at: string
  finished_at: string
  request_count: number
  retries: number
  failures: FailedItem[]
  prompt_tokens: number
  completion_tokens: number
  reasoning_tokens: number
}

type RunHistory = {
  note?: unknown
  totals?: Record<string, unknown>
  runs?: Record<string, unknown>[]
  [key: string]: unknown
}

async function writeRunRecord(history: RunHistory, runs: RunRecord[]): Promise<void> {
  const totals: Record<string, number> = {}
  for (const run of runs) {
    for (const field of ['request_count', 'retries', 'prompt_tokens', 'completion_tokens', 'reasoning_tokens']) {
      totals[field] = (totals[field] ?? 0) + (Number(run[field as keyof RunRecord]) || 0)
    }
    totals.failures =
      (totals.failures ?? 0) + (Array.isArray(run.failures) ? run.failures.length : Number(run.failures) || 0)
  }
  const file = { ...history, totals, runs: [...(history.runs ?? []), ...runs] }
  await Bun.write(resolve(ROOT, 'data/generated/translations-run.json'), `${JSON.stringify(file, null, 2)}\n`)
}

async function loadRunHistory(): Promise<RunHistory> {
  const path = resolve(ROOT, 'data/generated/translations-run.json')
  try {
    return (await Bun.file(path).json()) as RunHistory
  } catch {
    return { note: 'Translation runs.', totals: {}, runs: [] }
  }
}

type Plan = { kind: Kind; jobs: Job[]; languages: Language[]; requestCount: number }

function jobCodesSelected(
  kind: Kind,
  requested: string[],
  languages: Language[],
  locales: Record<Language, LocaleFile>,
  sources: Sources,
  limit: number | undefined
): Job[] {
  const codes = requested.length > 0 ? requested : sources.roles.map((role) => role.onet_code as string)
  const jobs: Job[] = []
  const picked = new Set<string>()
  for (const code of codes) {
    if (limit !== undefined && picked.size >= limit && !picked.has(code)) break
    const before = jobs.length
    if (kind === 'skills') {
      const role = sources.roleByCode.get(code)
      if (!role) throw new Error(`Unknown O*NET-SOC code: ${code}`)
      for (const corner of role.corners as SourceCorner[]) {
        if (
          languages.every((language) => {
            const overlay = locales[language].roles?.[code]?.corners?.[corner.corner_id]
            return typeof overlay?.name === 'string' && (overlay.name as string).trim() !== ''
          })
        )
          continue
        jobs.push({ code, cornerId: corner.corner_id, kind, source: buildSourceSkill(code, corner.corner_id, sources) })
      }
      if (jobs.length > before) picked.add(code)
      continue
    }
    let missing = false
    for (const language of languages) {
      const source = itemsFor(code, kind, sources)
      const translated = translationFor(code, kind, sources, locales[language])
      if (source.length > 0 && (!translated || translated.length !== source.length)) missing = true
      if (kind === 'titles' && source[0] === undefined) missing = false
    }
    if (!missing) continue
    const items = itemsFor(code, kind, sources)
    if (items.length === 0) continue
    jobs.push({ code, kind, items, refs: kind === 'titles' ? [{ code }] : refsFor(code, kind, sources) })
    picked.add(code)
  }
  if (kind !== 'titles') return jobs
  return chunk(jobs, TITLES_PER_REQUEST).map((group) => ({
    code: group[0]!.code,
    kind,
    items: group.map((job) => job.items![0]!),
    refs: group.map((job) => ({ code: job.code }))
  }))
}

function refsFor(code: string, kind: Exclude<Kind, 'skills'>, sources: Sources): Job['refs'] {
  const corners = sources.roleByCode.get(code).corners as SourceCorner[]
  const refs: NonNullable<Job['refs']> = []
  for (const corner of corners) {
    if (kind === 'resources') {
      for (const resource of corner.resources ?? []) refs.push({ url: resource.url, cornerId: corner.corner_id })
    } else {
      for (const tier of Object.keys(sources.explainers[code]?.[corner.corner_id] ?? {})) {
        refs.push({ tier, cornerId: corner.corner_id })
      }
    }
  }
  return refs
}

async function main(): Promise<void> {
  if (args.lang !== undefined && !isLanguage(args.lang))
    throw new Error(`Unsupported language “${args.lang}”; use ms or zh.`)
  if (args.kind !== undefined && !isKind(args.kind))
    throw new Error(`Unsupported kind “${args.kind}”; use ${KINDS.join(', ')}.`)
  const kind: Kind = (args.kind as Kind) ?? 'skills'
  const languages = args.lang ? [args.lang as Language] : [...LANGUAGES]
  const sources = await loadSources()
  const locales = { ms: await loadLocaleFile('ms'), zh: await loadLocaleFile('zh') }

  if (args['self-test']) {
    if (positionals.length > 0) throw new Error('--self-test does not take O*NET-SOC codes.')
    await selfTest(sources, locales)
    return
  }

  if (positionals.some((code) => !/^\d{2}-\d{4}\.\d{2}$/.test(code))) {
    throw new Error(
      'Usage: bun scripts/i18n/translate-roles.ts [--dry-run] [--kind skills|explainers|titles|resources] [--all] [--limit N] [--lang ms|zh] <onet_code>...'
    )
  }
  if (args.all && positionals.length > 0)
    throw new Error('--all translates every job; do not pass O*NET-SOC codes with it.')
  if (!args.all && positionals.length === 0) {
    throw new Error(
      'Usage: bun scripts/i18n/translate-roles.ts [--dry-run] [--kind skills|explainers|titles|resources] [--all] [--limit N] [--lang ms|zh] <onet_code>...'
    )
  }
  if (!args.all && args.limit !== undefined && positionals.length > Number(args.limit))
    throw new Error('--limit caps --all; do not pass more O*NET-SOC codes than the limit.')

  const requested = args.all ? [] : [...new Set(positionals)]
  const limit =
    args.limit === undefined ? undefined : requireNumber('--limit', args.limit, { min: 1, max: sources.roles.length })
  const jobs = jobCodesSelected(kind, requested, languages, locales, sources, limit)
  const onetCodes = new Set(
    jobs.flatMap((job) => (job.kind === 'titles' ? job.refs!.map((ref) => (ref as { code: string }).code) : [job.code]))
  )

  const provider = providerConfig({ dryRun: args['dry-run'] === true })
  const requestCount = jobs.length * languages.length
  console.log(
    `Selected ${onetCodes.size} job(s), ${jobs.length} unit(s) and ${requestCount} request(s) for kind ${kind} in ${languages.join(', ')} on ${provider.host}.`
  )

  const plan: Plan = { kind, jobs, languages, requestCount }
  if (args['dry-run']) {
    await writeDryRun(plan, locales, sources, provider)
    return
  }

  if (kind === 'skills') {
    const refused = [...new Set(jobs.filter((job) => DEMO_CODES.includes(job.code)).map((job) => job.code))]
    if (refused.length > 0) throw new Error(`Refusing a paid run for demo job(s): ${refused.join(', ')}`)
  }

  let model = provider.model ?? ''
  if (provider.name === 'runpod') {
    model = await waitForWorker(provider.baseUrl, provider.headers)
    console.log(`Worker ready, model ${model}`)
  } else {
    // Every request names the configured model; /models only proves the key and lists what else it may serve.
    await checkProvider(provider)
    console.log(`Provider ready, model ${model}`)
  }

  if (jobs.length === 0) {
    console.log('Nothing to translate: every selected item is already in the locale files.')
    return
  }

  const history = await loadRunHistory()
  const run: RunRecord = {
    provider: provider.host,
    model,
    reasoning_effort: provider.reasoningEffort ?? null,
    kind,
    languages,
    job_count: jobs.length,
    job_codes: [...onetCodes],
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    request_count: 0,
    retries: 0,
    failures: [],
    prompt_tokens: 0,
    completion_tokens: 0,
    reasoning_tokens: 0
  }
  const stats = newStats()
  const accepted: Accepted = new Map()
  const failures: FailedItem[] = []
  const changed = new Set<Language>()
  const limitRequest = limiterFor(provider.rpm)
  let acceptedItems = 0
  let fatal: Error | undefined
  let stopping = false

  const checkpoint = async (pretty: boolean) => {
    const merged = mergeAccepted(locales, accepted)
    for (const language of merged) changed.add(language)
    accepted.clear()
    Object.assign(run, {
      finished_at: new Date().toISOString(),
      request_count: stats.request_count,
      retries: stats.retries,
      failures,
      prompt_tokens: stats.prompt_tokens,
      completion_tokens: stats.completion_tokens,
      reasoning_tokens: stats.reasoning_tokens
    })
    await writeRunRecord(history, [run])
    await writeLocaleFiles(locales, changed, pretty)
  }

  const onSignal = (signal: string) => {
    if (stopping) process.exit(1)
    stopping = true
    console.log(`\nReceived ${signal}; writing a checkpoint and exiting.`)
    checkpoint(true)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error((error as Error).message)
        process.exit(1)
      })
  }
  process.on('SIGINT', () => onSignal('SIGINT'))
  process.on('SIGTERM', () => onSignal('SIGTERM'))

  const examples = new Map<Language, any>(
    languages.map((language) => [
      language,
      kind === 'skills'
        ? {
            source: buildSourceSkill(DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId, sources),
            translated: translationFromLocale(locales[language], DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId)
          }
        : exampleItems(language, kind, sources, locales[language])
    ])
  )

  const queue: { job: Job; language: Language }[] = jobs.flatMap((job) =>
    languages.map((language) => ({ job, language }))
  )
  let lastProgress = 0

  try {
    await Promise.all(
      Array.from({ length: Math.min(provider.concurrency, queue.length) }, async () => {
        while (queue.length > 0 && !fatal && !stopping) {
          const { job, language } = queue.shift()!
          try {
            const before = accepted.size
            await translateOne(job, language, examples, provider, stats, limitRequest, accepted, failures)
            if (accepted.size > before) {
              acceptedItems++
              if (acceptedItems % CHECKPOINT_EVERY === 0) await checkpoint(false)
            }
          } catch (error) {
            fatal ??= error as Error
          }
          if (stats.request_count - lastProgress >= PROGRESS_EVERY) {
            lastProgress = stats.request_count
            console.log(
              `Progress: ${stats.request_count} request(s), ${acceptedItems} accepted, ${failures.length} failed, ${stats.prompt_tokens.toLocaleString()} prompt, ${stats.completion_tokens.toLocaleString()} completion, ${stats.reasoning_tokens.toLocaleString()} reasoning tokens.`
            )
          }
        }
      })
    )
  } catch (error) {
    fatal = error as Error
  }

  await checkpoint(true)
  console.log(`Wrote translations for ${acceptedItems} item/language pair(s) and data/generated/translations-run.json.`)
  if (fatal) throw fatal
  if (failures.length > 0)
    throw new Error(`${failures.length} item/language translation(s) failed validation after 3 tries.`)
}

main().catch((error) => {
  console.error((error as Error).message)
  process.exitCode = 1
})
