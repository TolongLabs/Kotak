import { createKotakClaudeTools, type BoundCheckup, type KotakToolCall } from '@kotak/agent'
import { AGENT_RULES } from '@kotak/agent/catalog'
import { assessedRoleCode, BundleFileError, cornerAnswers, type Kotak } from '@kotak/sdk'
import {
  AgentChatRequestSchema,
  AgentChatResponseSchema,
  type AgentChatCheckup,
  type AgentChatRequest,
  type AgentChatResponse
} from '@kotak/shared'
import { Hono, type Context } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { describeClaudeError } from '../ai/claude'
import { withinRateLimit, type AiDeps } from '../ai/deps'
import type { AiBindings } from '../ai/env'
import { fail, invalidRequest, tooLarge } from '../ai/errors'
import { toolDepsFor, type KotakBindings } from '../tool-deps'

// Kopi's chat (#189): answers a follow-up question about the user's own check-up with Kotak's tools, run in process by
// the tool runner. Nothing is cached, since each conversation differs, and the user's answers are never logged.

const KOPI = `You are Kopi, the cat counsellor of the Kotak app, answering in its chat panel. Be playful, curious and encouraging, in a few words at most; keep every number, verdict and date plain and exact, as a tool returned it. Answer the question asked, leading with the answer: compare a what-if with the user's current result, and leave out results the user didn't ask about. Write plain text without Markdown, in 120 words at most.`

const WITH_CHECKUP = `The user has done a check-up in the app, and run_checkup and what_changed already hold it: the user's role, answers, goal and start date are filled in for you. Call run_checkup with no input to see the user's result as the app computes it; its roles are in fit order, while the app's Roles page puts the user's own choices first. For a what-if, set only the fields it changes (weekly_hours, scenario, snapshot_id or plan_role_code); a field you leave out keeps the user's own value, which its default shows. Don't ask the check-up's questions again.`

const WITHOUT_CHECKUP = `The user hasn't done a check-up yet, so there are no answers to work from and no tools to run one. Say that Kopi can answer questions about their own result once they finish the check-up on the Check-up page, which takes about 3 minutes, and answer general questions about Kotak and its data with the tools you have.`

const withoutAnswers = ({ onet_code, title }: { onet_code: string; title: string }) =>
  `The user has started a check-up in the app on ${title} (${onet_code}) but hasn't answered its questions yet, so there are no answers to work from and no tools to run one. Say that Kopi can answer questions about their own result once they answer the questions on the Check-up page, which takes about 3 minutes, and answer general questions about this role, Kotak and its data with the tools you have.`

// The caps on one chat request: Claude requests in the tool loop, and tokens per request.
const MAX_ITERATIONS = 5
const MAX_TOKENS = 8192

const unavailable = (context: Context) =>
  fail(context, 503, 'agent_unavailable', "Kopi can't chat right now. Your check-up, roles and roadmap still work.")

// The user's check-up for the tools, with the session's answer slots as run_checkup's answers on the assessed role's
// corners, and what the prompt says about it. With no corner answered, nothing is bound, since a result from no
// answers would read as the user's own.
async function bindCheckup(
  kotak: Kotak,
  chat: AgentChatCheckup | null
): Promise<{ checkup: BoundCheckup | null; about: string }> {
  if (!chat) return { checkup: null, about: WITHOUT_CHECKUP }
  const { answers, ...checkup } = chat
  // The request schema refuses a check-up with neither a current job nor a target.
  const role = await kotak.role(assessedRoleCode(checkup)!)
  const bound = cornerAnswers(role, answers)
  if (!bound.length) return { checkup: null, about: withoutAnswers(role) }
  return { checkup: { ...checkup, answers: bound }, about: WITH_CHECKUP }
}

// The panel's line for a tool call: its title, then what Kopi chose, e.g. "Run the Check-Up: 6 h a week".
const inputText: Record<string, (value: unknown) => string> = {
  weekly_hours: (hours) => (hours === null ? "the AI dividend's hours" : `${hours} h a week`),
  scenario: (pace) => (pace === 'fast' ? 'the fast AI pace' : "Malaysia's AI pace"),
  snapshot_id: (id) => `${id} data`,
  before: (id) => `from ${id}`,
  after: (id) => `to ${id}`,
  plan_role_code: (code) => (code ? `plan for ${code}` : 'plan for the assessed role')
}

type ChatLocale = NonNullable<AgentChatRequest['lang']>
type TranslatedLocale = Exclude<ChatLocale, 'en'>

const translatedToolTitles: Record<TranslatedLocale, Record<string, string>> = {
  ms: {
    find_role: 'Cari Peranan',
    get_checkup_questions: 'Dapatkan Soalan Semakan',
    suggest_roles: 'Cadangkan Peranan',
    run_checkup: 'Jalankan Semakan',
    what_changed: 'Perubahan antara Set Data',
    national_skill_gaps: 'Jurang Kemahiran Negara',
    job_market: 'Iklan Kerja di Malaysia',
    list_sources: 'Senarai Sumber Data'
  },
  zh: {
    find_role: '查找职位',
    get_checkup_questions: '获取检测问题',
    suggest_roles: '推荐职位',
    run_checkup: '运行检测',
    what_changed: '数据快照对比',
    national_skill_gaps: '全国技能差距',
    job_market: '马来西亚招聘广告',
    list_sources: '列出数据来源'
  }
}

const translatedInputText: Record<TranslatedLocale, Record<string, (value: unknown) => string>> = {
  ms: {
    weekly_hours: (hours) => (hours === null ? 'jam dividen AI' : `${hours} jam seminggu`),
    scenario: (pace) => (pace === 'fast' ? 'kadar AI pantas' : 'kadar AI Malaysia'),
    snapshot_id: (id) => `data ${id}`,
    before: (id) => `daripada ${id}`,
    after: (id) => `kepada ${id}`,
    plan_role_code: (code) => (code ? `peta jalan untuk ${code}` : 'peta jalan untuk peranan yang dinilai')
  },
  zh: {
    weekly_hours: (hours) => (hours === null ? 'AI 节省的小时数' : `${hours} 小时/周`),
    scenario: (pace) => (pace === 'fast' ? '快速 AI 进度' : '马来西亚 AI 进度'),
    snapshot_id: (id) => `${id} 数据`,
    before: (id) => `从 ${id}`,
    after: (id) => `到 ${id}`,
    plan_role_code: (code) => (code ? `为 ${code} 规划路线图` : '为当前评估职位规划路线图')
  }
}

function label({ name, title, input }: KotakToolCall, lang: ChatLocale = 'en'): string {
  const localized = lang !== 'en'
  const localizedTitle = localized ? (translatedToolTitles[lang][name] ?? title) : title
  const labels = localized ? translatedInputText[lang] : inputText
  const chosen = Object.entries((input ?? {}) as Record<string, unknown>).flatMap(([field, value]) =>
    labels[field] ? [labels[field](value)] : typeof value === 'string' ? [value] : []
  )
  return chosen.length ? `${localizedTitle}: ${chosen.join(', ')}` : localizedTitle
}

// Every { source_name, vintage_date } in the tools' results, once.
function collectSources(value: unknown, found: Map<string, AgentChatResponse['sources'][number]>) {
  if (Array.isArray(value)) return value.forEach((item) => collectSources(item, found))
  if (!value || typeof value !== 'object') return
  const { source_name, vintage_date } = value as Record<string, unknown>
  if (typeof source_name === 'string' && typeof vintage_date === 'string') {
    found.set(`${source_name} ${vintage_date}`, { source_name, vintage_date })
  } else {
    Object.values(value).forEach((item) => collectSources(item, found))
  }
}

export function createAgentChatRoute(deps: AiDeps) {
  const route = new Hono<{ Bindings: AiBindings & KotakBindings }>()

  route.post('/chat', bodyLimit({ maxSize: 64 * 1024, onError: tooLarge(64 * 1024) }), async (context) => {
    const request = AgentChatRequestSchema.safeParse(await context.req.json().catch(() => null))
    if (!request.success) return invalidRequest(context, request.error)

    const toolDeps = toolDepsFor(context)
    const agent = deps.agent(context)
    if (!toolDeps || !agent) return unavailable(context)

    const chat = request.data.checkup
    const promptLanguageRule =
      request.data.lang === 'ms'
        ? 'Reply in Bahasa Malaysia as written in Malaysia, not Indonesian. Keep every number, source name, date, job title and course title exactly as the tools give them.'
        : request.data.lang === 'zh'
          ? 'Reply in Simplified Chinese as Malaysian Chinese readers write it. Keep every number, source name, date, job title and course title exactly as the tools give them.'
          : undefined
    let bound: Awaited<ReturnType<typeof bindCheckup>>
    try {
      bound = await bindCheckup(toolDeps.kotak, chat)
    } catch (error) {
      if (error instanceof BundleFileError && chat) {
        const code = assessedRoleCode(chat)
        return fail(context, 400, 'invalid_request', `Invalid request body. checkup: Kotak has no role ${code}.`)
      }
      // Only the error's kind: its message could quote the user's check-up.
      console.warn('[ai] Kopi chat could not read the check-up:', error instanceof Error ? error.name : typeof error)
      return unavailable(context)
    }

    const calls: KotakToolCall[] = []
    try {
      const reply = await agent.run({
        system: [AGENT_RULES, KOPI, bound.about, ...(promptLanguageRule ? [promptLanguageRule] : [])].join('\n\n'),
        messages: request.data.messages,
        tools: createKotakClaudeTools(toolDeps, { checkup: bound.checkup, onCall: (call) => calls.push(call) }),
        max_tokens: MAX_TOKENS,
        max_iterations: MAX_ITERATIONS,
        // Every request in the loop counts toward the route's rate limit, not just the first.
        allowRequest: () => withinRateLimit(deps, context)
      })
      if (reply === null) return unavailable(context)
      const sources = new Map<string, AgentChatResponse['sources'][number]>()
      calls.forEach((call) => collectSources(call.output, sources))
      const response = {
        reply,
        tools: calls.map((call) => ({ name: call.name, label: label(call, request.data.lang) })),
        sources: [...sources.values()]
      }
      return context.json(AgentChatResponseSchema.parse(response))
    } catch (error) {
      console.warn('[ai] Kopi chat failed:', describeClaudeError(error))
      return unavailable(context)
    }
  })

  return route
}
