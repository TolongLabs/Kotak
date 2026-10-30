import { mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

const ROOT = resolve(import.meta.dir, '../..')
const DRY_RUN_DIR = '/tmp/translate-dry-run'
const MODEL = 'Qwen/Qwen3.8-27B-FP8'
const CONTEXT_LIMIT = 16_384
const MAX_OUTPUT_TOKENS = 4_096
const CONCURRENCY = 32
const HTTP_RETRIES = 5
const REQUEST_TIMEOUT_MS = 10 * 60_000
const COLD_START_LIMIT_MS = 30 * 60_000
const DEMO_CODES = ['15-1254.00', '15-1255.00', '43-3031.00']
const DEMO_EXAMPLE = { code: '15-1254.00', cornerId: 'web-site-building' }
const LANGUAGES = ['ms', 'zh'] as const
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
type Language = (typeof LANGUAGES)[number]
type Tier = 'basic' | 'working' | 'advanced'
type ScenarioTier = 'basic' | 'advanced'
type OptionId = 'a' | 'b' | 'c' | 'd'
type ScenarioTranslation = { situation: string; options: Record<OptionId, string> }
type SkillTranslation = {
  name: string
  statements: Record<Tier, string>
  reversed_statements: Record<'basic' | 'advanced', string>
  scenarios: Record<ScenarioTier, ScenarioTranslation>
}
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }
type ChatRequest = {
  model: string
  messages: ChatMessage[]
  response_format: { type: 'json_schema'; json_schema: { name: string; schema: Record<string, unknown>; strict: true } }
  temperature: 0
  max_tokens: number
  chat_template_kwargs: { enable_thinking: false }
}
type SourceCorner = {
  corner_id: string
  name: string
  statements: Record<Tier, string>
  reversed_statements: Record<'basic' | 'advanced', string>
}
type SourceScenario = {
  situation: string
  options: { id: OptionId; text: string; score: number }[]
}
type LocaleFile = {
  roles: Record<string, { corners: Record<string, Record<string, unknown>> }>
  scenarios: Record<string, Record<string, Record<string, unknown>>>
  [key: string]: unknown
}

class FatalError extends Error {}
class RequestError extends Error {}

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'dry-run': { type: 'boolean', default: false },
    lang: { type: 'string' },
    'self-test': { type: 'boolean', default: false }
  }
})

function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value)
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

const TRANSLATION_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
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
    },
    scenarios: {
      type: 'object',
      properties: {
        basic: scenarioSchema(),
        advanced: scenarioSchema()
      },
      required: ['basic', 'advanced'],
      additionalProperties: false
    }
  },
  required: ['name', 'statements', 'reversed_statements', 'scenarios'],
  additionalProperties: false
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
  if (!corner || !scenario?.basic || !scenario?.advanced) {
    throw new Error(`Missing English skill or scenarios for ${code} ${cornerId}`)
  }
  return {
    name: corner.name,
    statements: corner.statements,
    reversed_statements: corner.reversed_statements,
    scenarios: { basic: sourceScenario(scenario.basic), advanced: sourceScenario(scenario.advanced) }
  }
}

function translationFromLocale(locale: LocaleFile, code: string, cornerId: string): SkillTranslation {
  const corner = locale.roles?.[code]?.corners?.[cornerId]
  const scenarios = locale.scenarios?.[code]?.[cornerId]
  if (!corner || !scenarios) throw new Error(`Missing locale example for ${code} ${cornerId}`)
  return {
    name: corner.name as string,
    statements: corner.statements as Record<Tier, string>,
    reversed_statements: corner.reversed_statements as Record<'basic' | 'advanced', string>,
    scenarios: scenarios as SkillTranslation['scenarios']
  }
}

function promptRules(language: Language): string {
  const languageRules =
    language === 'ms'
      ? [
          'Write Bahasa Malaysia as used in Malaysia and following Dewan Bahasa dan Pustaka usage; never use Indonesian.',
          'Use “anda” in lower case. “I can …” is “Saya boleh …”; “I would still need help to …” is “Saya masih perlukan bantuan untuk …”; “I would struggle to …” is “Saya sukar untuk …”.',
          'Keep every Malay string within about 120% of its English length.'
        ]
      : [
          'Write Simplified Chinese as Malaysian Chinese readers use it. Use “你”, full-width Chinese punctuation, and exactly one half-width space between Chinese and a Latin word or number.',
          '“I can …” is “我能……” ; “I would still need help to …” is “我仍需要别人帮忙才能……” ; “I would struggle to …” is “我很难……”.'
        ]
  return [
    'You translate one O*NET skill and its two what-would-you-do scenarios for Kotak. Return only the requested JSON object.',
    ...languageRules,
    'Translate the skill name, all can-do statements, both reversed statements, both scenario situations, and all eight options.',
    'Keep every place name, company type, product, tool, and number. Keep Kotak, Kopi, O*NET, SDG, RM, AI, and every capitalised product or company name in the English verbatim.',
    'Keep the three skill tiers distinct. Preserve the meaning and strength of every statement.',
    'The four scenario options are ranked by hidden scores. Do not reorder them. Keep each option exactly as strong or weak as its English source; never improve a weak option or weaken a strong one. Keep the four options close in length to each other, as they are in English.',
    'Use the JSON keys exactly as supplied. Do not add explanations, comments, or other keys.'
  ].join('\n')
}

function buildRequest(
  source: SkillTranslation,
  language: Language,
  example: { source: SkillTranslation; translated: SkillTranslation },
  model: string,
  validationErrors: string[] = []
): ChatRequest {
  const names = [...new Set(sourceStrings(source).flatMap(nameCandidates))].sort()
  const retryNote =
    validationErrors.length > 0
      ? `\nYour previous response failed validation. Correct every issue below:\n${validationErrors.map((error) => `- ${error}`).join('\n')}`
      : ''
  const userInput = [
    `Translate this complete skill and its two scenarios into ${language === 'ms' ? 'Bahasa Malaysia' : 'Simplified Chinese'}.`,
    `Names to preserve verbatim: ${names.length > 0 ? names.join(', ') : '(none identified)'}.`,
    `English source:\n${JSON.stringify(source, null, 2)}${retryNote}`
  ].join('\n\n')
  return {
    model,
    messages: [
      { role: 'system', content: promptRules(language) },
      {
        role: 'user',
        content: `Complete worked example. First the English source:\n${JSON.stringify(example.source, null, 2)}\n\nThen its approved ${language === 'ms' ? 'Bahasa Malaysia' : 'Simplified Chinese'} translation follows.`
      },
      { role: 'assistant', content: JSON.stringify(example.translated) },
      { role: 'user', content: userInput }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'translated_skill', schema: TRANSLATION_SCHEMA, strict: true }
    },
    temperature: 0,
    max_tokens: MAX_OUTPUT_TOKENS,
    chat_template_kwargs: { enable_thinking: false }
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
  return Bun.file(resolve(ROOT, `apps/web/src/i18n/content/${language}.json`)).json() as Promise<LocaleFile>
}

async function loadSources(): Promise<{ roles: any[]; roleByCode: Map<string, any>; scenarioRoles: any }> {
  const roleFile = (await Bun.file(resolve(ROOT, 'data/generated/role-corners.json')).json()) as { roles: any[] }
  const scenarioFile = (await Bun.file(resolve(ROOT, 'data/generated/scenarios.json')).json()) as { roles: any }
  return {
    roles: roleFile.roles,
    roleByCode: new Map(roleFile.roles.map((role) => [role.onet_code, role])),
    scenarioRoles: scenarioFile.roles
  }
}

function expectedBrokenSample(name: string, errors: string[], expected: string): void {
  if (!errors.some((error) => error.toLowerCase().includes(expected.toLowerCase()))) {
    throw new Error(
      `self-test: broken sample “${name}” did not trigger ${expected}; got: ${errors.join('; ') || 'no errors'}`
    )
  }
}

async function selfTest(
  sources: Awaited<ReturnType<typeof loadSources>>,
  locales: Record<Language, LocaleFile>
): Promise<void> {
  let checked = 0
  const failures: string[] = []
  for (const code of DEMO_CODES) {
    const role = sources.roleByCode.get(code)
    if (!role) throw new Error(`self-test: missing demo role ${code}`)
    for (const corner of role.corners as SourceCorner[]) {
      const source = makeSourceSkill(code, corner.corner_id, sources.roleByCode, sources.scenarioRoles)
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

  const demoSource = makeSourceSkill(
    DEMO_EXAMPLE.code,
    DEMO_EXAMPLE.cornerId,
    sources.roleByCode,
    sources.scenarioRoles
  )
  const goodMs = translationFromLocale(locales.ms, DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId)
  const goodZh = translationFromLocale(locales.zh, DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId)

  const emptySample = structuredClone(goodZh)
  emptySample.name = ''
  const emptyErrors = validateTranslation(demoSource, emptySample, 'zh')
  expectedBrokenSample('empty string', emptyErrors, 'empty string')
  expectedBrokenSample('no CJK characters', emptyErrors, 'no Chinese characters')

  const digitSource = structuredClone(demoSource)
  const digitTranslation = structuredClone(goodZh)
  digitSource.scenarios.basic.situation = 'There are 3 tasks to review.'
  digitTranslation.scenarios.basic.situation = '有三项任务需要检查。'
  expectedBrokenSample('dropped digit', validateTranslation(digitSource, digitTranslation, 'zh'), 'digit sequence 3')

  const languageSample = structuredClone(goodMs)
  languageSample.statements.basic = 'Saya bisa mencuba ini.'
  delete (languageSample.scenarios.basic.options as Partial<Record<OptionId, string>>).d
  const languageErrors = validateTranslation(demoSource, languageSample, 'ms')
  expectedBrokenSample('Indonesian word', languageErrors, 'Indonesian term')
  expectedBrokenSample('missing key', languageErrors, 'keys differ')

  console.log(`Self-test passed: ${checked} existing demo skill translations passed; 3 broken samples were rejected.`)
}

type WorkItem = { code: string; cornerId: string; language: Language; source: SkillTranslation }

function workItems(
  codes: string[],
  languages: Language[],
  sources: Awaited<ReturnType<typeof loadSources>>
): WorkItem[] {
  return codes.flatMap((code) => {
    const role = sources.roleByCode.get(code)
    if (!role) throw new Error(`Unknown O*NET-SOC code: ${code}`)
    return (role.corners as SourceCorner[]).flatMap((corner) =>
      languages.map((language) => ({
        code,
        cornerId: corner.corner_id,
        language,
        source: makeSourceSkill(code, corner.corner_id, sources.roleByCode, sources.scenarioRoles)
      }))
    )
  })
}

function exampleFor(language: Language, sources: Awaited<ReturnType<typeof loadSources>>, locale: LocaleFile) {
  const source = makeSourceSkill(DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId, sources.roleByCode, sources.scenarioRoles)
  const translated = translationFromLocale(locale, DEMO_EXAMPLE.code, DEMO_EXAMPLE.cornerId)
  const errors = validateTranslation(source, translated, language, `few-shot ${language}`)
  if (errors.length > 0) throw new Error(`Invalid ${language} few-shot example: ${errors.join('; ')}`)
  return { source, translated }
}

async function writeDryRun(
  items: WorkItem[],
  locales: Record<Language, LocaleFile>,
  sources: Awaited<ReturnType<typeof loadSources>>
): Promise<void> {
  mkdirSync(DRY_RUN_DIR, { recursive: true })
  for (const name of readdirSync(DRY_RUN_DIR)) {
    if (name.endsWith('.json')) unlinkSync(resolve(DRY_RUN_DIR, name))
  }
  let largest = { tokens: 0, item: '' }
  for (const item of items) {
    const request = buildRequest(
      item.source,
      item.language,
      exampleFor(item.language, sources, locales[item.language]),
      MODEL
    )
    const filename = `${item.language}_${item.code}_${item.cornerId}.json`
    await Bun.write(resolve(DRY_RUN_DIR, filename), `${JSON.stringify(request, null, 2)}\n`)
    const tokens = estimateTokens(request)
    if (tokens > largest.tokens) largest = { tokens, item: `${item.language} ${item.code} ${item.cornerId}` }
  }
  const skills = new Set(items.map(({ code, cornerId }) => `${code}.${cornerId}`)).size
  const maxTotal = largest.tokens + MAX_OUTPUT_TOKENS
  console.log(
    `Built ${items.length} requests for ${new Set(items.map(({ code }) => code)).size} job(s), ${skills} skill(s), and ${new Set(items.map(({ language }) => language)).size} language(s).`
  )
  console.log(
    `Largest request: about ${largest.tokens.toLocaleString()} prompt tokens (${largest.item}); with the ${MAX_OUTPUT_TOKENS.toLocaleString()} token output cap, about ${maxTotal.toLocaleString()} / ${CONTEXT_LIMIT.toLocaleString()} context tokens.`
  )
  console.log(`Wrote request JSON files to ${DRY_RUN_DIR}/. No network calls were made.`)
}

type RunStats = { request_count: number; retries: number; prompt_tokens: number; completion_tokens: number }

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

async function complete(
  request: ChatRequest,
  baseUrl: string,
  headers: HeadersInit,
  stats: RunStats
): Promise<{ text: string; finish: string }> {
  const body = JSON.stringify(request)
  for (let failure = 0; ; failure++) {
    let problem: string
    try {
      stats.request_count++
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
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

      if ([401, 403, 404].includes(response.status))
        throw new FatalError(`HTTP ${response.status}: ${text.slice(0, 300)}`)
      if (json?.error?.type === 'startup_error') throw new FatalError(`worker failed to start: ${json.error.message}`)
      if ([400, 422].includes(response.status)) throw new FatalError(`request rejected: ${text.slice(0, 300)}`)
      const choice = json?.choices?.[0]
      if (response.ok && choice) {
        return {
          text: typeof choice.message?.content === 'string' ? choice.message.content : '',
          finish: choice.finish_reason ?? ''
        }
      }
      if (response.ok) throw new RequestError(`no completion in the response: ${text.slice(0, 200)}`)
      problem = `HTTP ${response.status}: ${text.slice(0, 200)}`
    } catch (error) {
      if (error instanceof FatalError || error instanceof RequestError) throw error
      problem = (error as Error).message
    }
    if (failure >= HTTP_RETRIES) throw new Error(`gave up after ${HTTP_RETRIES + 1} tries: ${problem}`)
    stats.retries++
    await Bun.sleep(Math.min(60_000, 2_000 * 2 ** failure) * (0.5 + Math.random()))
  }
}

type FailedItem = { onet_code: string; corner_id: string; language: Language; errors: string[] }

async function translateOne(
  item: WorkItem,
  example: { source: SkillTranslation; translated: SkillTranslation },
  model: string,
  baseUrl: string,
  headers: HeadersInit,
  stats: RunStats,
  accepted: Map<string, SkillTranslation>,
  failures: FailedItem[]
): Promise<void> {
  let validationErrors: string[] = []
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const request = buildRequest(item.source, item.language, example, model, validationErrors)
      const answer = await complete(request, baseUrl, headers, stats)
      let translated: unknown
      try {
        translated = JSON.parse(answer.text)
      } catch {
        validationErrors = ['response is not valid JSON']
        if (answer.finish === 'length') validationErrors.unshift('answer hit max_tokens and was cut off')
      }
      if (translated !== undefined) {
        validationErrors = validateTranslation(item.source, translated, item.language, `${item.code}.${item.cornerId}`)
        if (validationErrors.length === 0) {
          accepted.set(`${item.language}:${item.code}:${item.cornerId}`, translated as SkillTranslation)
          console.log(`${item.language} ${item.code} ${item.cornerId} ok (try ${attempt})`)
          return
        }
        if (answer.finish === 'length') validationErrors.unshift('answer hit max_tokens and was cut off')
      }
    } catch (error) {
      if (error instanceof FatalError) throw error
      validationErrors = [(error as Error).message]
    }
    if (attempt < 3) stats.retries++
    console.log(
      `${item.language} ${item.code} ${item.cornerId} try ${attempt} rejected: ${validationErrors.slice(0, 3).join('; ')}`
    )
    if (attempt === 3) {
      failures.push({
        onet_code: item.code,
        corner_id: item.cornerId,
        language: item.language,
        errors: validationErrors
      })
    }
  }
}

function mergeAccepted(locales: Record<Language, LocaleFile>, accepted: Map<string, SkillTranslation>): Set<Language> {
  const changed = new Set<Language>()
  for (const [key, translated] of accepted) {
    const [language, code, cornerId] = key.split(':') as [Language, string, string]
    if (DEMO_CODES.includes(code)) throw new Error(`Refusing to overwrite demo job ${code}`)
    const locale = locales[language]
    const roleEntry = locale.roles[code] ?? { corners: {} }
    locale.roles[code] = {
      ...roleEntry,
      corners: {
        ...roleEntry.corners,
        [cornerId]: {
          ...roleEntry.corners[cornerId],
          name: translated.name,
          statements: translated.statements,
          reversed_statements: translated.reversed_statements
        }
      }
    }
    const jobScenarios = locale.scenarios[code] ?? {}
    locale.scenarios[code] = {
      ...jobScenarios,
      [cornerId]: { ...jobScenarios[cornerId], ...translated.scenarios }
    }
    changed.add(language)
  }
  return changed
}

async function writeLocaleFiles(locales: Record<Language, LocaleFile>, changed: Set<Language>): Promise<void> {
  const paths = [...changed].map((language) => resolve(ROOT, `apps/web/src/i18n/content/${language}.json`))
  for (const language of changed) {
    await Bun.write(
      resolve(ROOT, `apps/web/src/i18n/content/${language}.json`),
      `${JSON.stringify(locales[language], null, 2)}\n`
    )
  }
  if (paths.length === 0) return
  const result = Bun.spawnSync(['bunx', 'prettier', '--write', ...paths], { cwd: ROOT, stdout: 'pipe', stderr: 'pipe' })
  if (result.exitCode !== 0) {
    throw new Error(`Prettier failed: ${Buffer.from(result.stderr).toString('utf8')}`)
  }
}

async function runBatch(
  items: WorkItem[],
  codes: string[],
  languages: Language[],
  sources: Awaited<ReturnType<typeof loadSources>>,
  locales: Record<Language, LocaleFile>
): Promise<void> {
  const apiKey = process.env.RUNPOD_API_KEY
  const endpointId = process.env.RUNPOD_ENDPOINT_ID
  if (!apiKey || !endpointId) throw new Error('Set RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID (see runpod/README.md).')
  if (codes.some((code) => DEMO_CODES.includes(code))) {
    throw new Error(
      `Refusing a paid run for demo job(s): ${codes.filter((code) => DEMO_CODES.includes(code)).join(', ')}`
    )
  }

  const baseUrl = `https://api.runpod.ai/v2/${endpointId}/openai/v1`
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
  const stats: RunStats = { request_count: 0, retries: 0, prompt_tokens: 0, completion_tokens: 0 }
  const accepted = new Map<string, SkillTranslation>()
  const failures: FailedItem[] = []
  const started = new Date()
  let model = ''
  let fatal: Error | undefined

  try {
    model = await waitForWorker(baseUrl, headers)
    console.log(`Worker ready, model ${model}`)
    const queue = [...items]
    const examples = new Map(languages.map((language) => [language, exampleFor(language, sources, locales[language])]))
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        while (queue.length > 0 && !fatal) {
          const item = queue.shift()!
          try {
            await translateOne(item, examples.get(item.language)!, model, baseUrl, headers, stats, accepted, failures)
          } catch (error) {
            fatal ??= error as Error
          }
        }
      })
    )
  } catch (error) {
    fatal = error as Error
  }

  const changed = mergeAccepted(locales, accepted)
  await writeLocaleFiles(locales, changed)
  const finished = new Date()
  const runRecord = {
    endpoint_id: endpointId,
    model,
    languages,
    job_codes: codes,
    started_at: started.toISOString(),
    finished_at: finished.toISOString(),
    request_count: stats.request_count,
    retries: stats.retries,
    failures,
    prompt_tokens: stats.prompt_tokens,
    completion_tokens: stats.completion_tokens
  }
  await Bun.write(resolve(ROOT, 'data/generated/translations-run.json'), `${JSON.stringify(runRecord, null, 2)}\n`)
  console.log(
    `Wrote translations for ${accepted.size} skill/language pair(s) and data/generated/translations-run.json.`
  )
  if (fatal) throw fatal
  if (failures.length > 0)
    throw new Error(`${failures.length} skill/language translation(s) failed validation after 3 tries.`)
}

async function main(): Promise<void> {
  if (args.lang !== undefined && !isLanguage(args.lang))
    throw new Error(`Unsupported language “${args.lang}”; use ms or zh.`)
  const languages = args.lang ? [args.lang as Language] : [...LANGUAGES]
  const sources = await loadSources()
  const locales = { ms: await loadLocaleFile('ms'), zh: await loadLocaleFile('zh') }

  if (args['self-test']) {
    if (positionals.length > 0) throw new Error('--self-test does not take O*NET-SOC codes.')
    await selfTest(sources, locales)
    return
  }
  if (positionals.length === 0)
    throw new Error('Usage: bun scripts/i18n/translate-roles.ts [--dry-run] [--lang ms|zh] <onet_code>...')

  const codes = [...new Set(positionals)]
  const items = workItems(codes, languages, sources)
  if (args['dry-run']) {
    await writeDryRun(items, locales, sources)
    return
  }
  await runBatch(items, codes, languages, sources, locales)
}

main().catch((error) => {
  console.error((error as Error).message)
  process.exitCode = 1
})
