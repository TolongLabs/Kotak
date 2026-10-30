import {
  AgentChatRequestSchema,
  AgentChatResponseSchema,
  ApiErrorSchema,
  ExplanationRequestSchema,
  ExplanationResponseSchema,
  JOB_MARKET_MAX_CODES,
  JobMarketResponseSchema,
  RoleAliasesResponseSchema,
  RoleMatchRequestSchema,
  RoleMatchResponseSchema,
  type AgentChatRequest,
  type AgentChatResponse,
  type ExplanationRequest,
  type ExplanationResponse,
  type JobMarket,
  type RoleAliasesResponse,
  type RoleMatchResponse
} from '@kotak/shared'
import { getLocale } from '../i18n/locale'

export type ApiResult<T> = { status: 'available'; data: T } | { status: 'unavailable' }

type RuntimeSchema<T> = {
  safeParse(input: unknown): { success: true; data: T } | { success: false }
}

const unavailable = { status: 'unavailable' } as const

async function postJson<TRequest, TResponse>(
  path: string,
  body: unknown,
  requestSchema: RuntimeSchema<TRequest>,
  responseSchema: RuntimeSchema<TResponse>
): Promise<ApiResult<TResponse>> {
  const request = requestSchema.safeParse(body)
  if (!request.success) return unavailable

  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request.data, lang: getLocale() })
    })
    if (response.status !== 200) return unavailable

    const result = responseSchema.safeParse(await response.json())
    return result.success ? { status: 'available', data: result.data } : unavailable
  } catch {
    return unavailable
  }
}

function normalizeTitle(title: string) {
  return title.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}

const roleMatchCache = new Map<string, Promise<ApiResult<RoleMatchResponse>>>()

export function fetchRoleMatch(jobTitle: string): Promise<ApiResult<RoleMatchResponse>> {
  const key = normalizeTitle(jobTitle)
  const cached = roleMatchCache.get(key)
  if (cached) return cached

  const request = postJson('/api/roles/match', { job_title: jobTitle }, RoleMatchRequestSchema, RoleMatchResponseSchema)
  roleMatchCache.set(key, request)
  return request
}

export type RoleAlias = RoleAliasesResponse['aliases'][number]

let roleAliasesRequest: Promise<RoleAlias[]> | null = null

// Market job titles an admin approved from JobStreet listings. Fetched once per page load; a failed request leaves
// the check-up with the O*NET titles alone and is retried on the next visit.
export function fetchRoleAliases(): Promise<RoleAlias[]> {
  roleAliasesRequest ??= fetch('/api/roles/aliases')
    .then(async (response) => {
      if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
      const result = RoleAliasesResponseSchema.safeParse(await response.json())
      if (!result.success) throw new Error('Invalid role aliases')
      return result.data.aliases
    })
    .catch(() => {
      roleAliasesRequest = null
      return []
    })
  return roleAliasesRequest
}

type CornerExplanation = ExplanationResponse['explanations'][number]
const explanationResponseCache = new Map<string, ApiResult<ExplanationResponse>>()
const explanationPending = new Map<string, Promise<ApiResult<ExplanationResponse>>>()
const explanationByCornerCache = new Map<string, CornerExplanation>()

function explanationKey(roleCode: string, snapshotId: string) {
  return JSON.stringify([roleCode, snapshotId])
}

function cornerExplanationKey(roleCode: string, snapshotId: string, cornerId: string) {
  return JSON.stringify([roleCode, snapshotId, cornerId])
}

export function fetchExplanations(roleCode: string, body: ExplanationRequest): Promise<ApiResult<ExplanationResponse>> {
  const key = explanationKey(roleCode, body.snapshot_id)
  const cached = explanationResponseCache.get(key)
  if (cached) {
    if (cached.status === 'unavailable') return Promise.resolve(cached)

    const explanations = body.corners.map((corner) =>
      explanationByCornerCache.get(cornerExplanationKey(roleCode, body.snapshot_id, corner.corner_id))
    )
    if (explanations.every((explanation): explanation is CornerExplanation => Boolean(explanation))) {
      return Promise.resolve({ status: 'available', data: { ...cached.data, explanations } })
    }
    return Promise.resolve(cached)
  }

  const pending = explanationPending.get(key)
  if (pending) return pending

  const request = postJson('/api/explanations', body, ExplanationRequestSchema, ExplanationResponseSchema).then(
    (result) => {
      explanationResponseCache.set(key, result)
      if (result.status === 'available') {
        for (const explanation of result.data.explanations) {
          explanationByCornerCache.set(
            cornerExplanationKey(roleCode, body.snapshot_id, explanation.corner_id),
            explanation
          )
        }
      }
      return result
    }
  )
  explanationPending.set(key, request)
  return request
}

// Kopi's chat (#189): unavailable is the 503 agent_unavailable answer (no key, over the rate limit or a Claude failure);
// any other failure is an error worth a retry.
export type KopiChatResult = ApiResult<AgentChatResponse> | { status: 'error' }

export async function askKopi(body: AgentChatRequest): Promise<KopiChatResult> {
  const failed = { status: 'error' } as const
  const request = AgentChatRequestSchema.safeParse(body)
  if (!request.success) return failed

  try {
    const response = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.data)
    })
    const json: unknown = await response.json().catch(() => null)
    if (response.status === 200) {
      const result = AgentChatResponseSchema.safeParse(json)
      return result.success ? { status: 'available', data: result.data } : failed
    }
    const error = ApiErrorSchema.safeParse(json)
    return response.status === 503 && error.data?.error.code === 'agent_unavailable' ? unavailable : failed
  } catch {
    return failed
  }
}

export type { JobMarket } from '@kotak/shared'

const jobMarketCache = new Map<string, Promise<JobMarket | null>>()

/**
 * What Malaysian job ads say about each role (#272), by O*NET code; a role without approved ads is left out. Each code
 * is fetched once per page load, in one request for the codes not asked for yet. A failed request leaves those roles
 * out and is retried on the next call, as is a role missing while the database is unreachable.
 */
export async function fetchJobMarkets(codes: string[]): Promise<Map<string, JobMarket>> {
  const missing = [...new Set(codes)].filter((code) => !jobMarketCache.has(code))
  // The route takes up to JOB_MARKET_MAX_CODES codes a request.
  for (let start = 0; start < missing.length; start += JOB_MARKET_MAX_CODES) {
    const chunk = missing.slice(start, start + JOB_MARKET_MAX_CODES)
    const request = fetch(`/api/market?codes=${chunk.map(encodeURIComponent).join(',')}`).then(async (response) => {
      if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
      const result = JobMarketResponseSchema.safeParse(await response.json())
      if (!result.success) throw new Error('Unexpected job-ad response')
      return result.data
    })
    for (const code of chunk) {
      jobMarketCache.set(
        code,
        request.then(
          ({ markets, database_available }) => {
            const market = markets.find((found) => found.onet_code === code) ?? null
            // While the database is unreachable the route still sends what it cached, but a role it left out may
            // have ads.
            if (!market && !database_available) jobMarketCache.delete(code)
            return market
          },
          () => {
            jobMarketCache.delete(code)
            return null
          }
        )
      )
    }
  }
  const entries = await Promise.all(codes.map(async (code) => [code, await jobMarketCache.get(code)] as const))
  return new Map(entries.flatMap(([code, market]) => (market ? [[code, market] as const] : [])))
}
