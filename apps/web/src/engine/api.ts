import {
  AgentChatRequestSchema,
  AgentChatResponseSchema,
  ApiErrorSchema,
  ExplanationRequestSchema,
  ExplanationResponseSchema,
  RoleMatchRequestSchema,
  RoleMatchResponseSchema,
  type AgentChatRequest,
  type AgentChatResponse,
  type ExplanationRequest,
  type ExplanationResponse,
  type RoleMatchResponse
} from '@kotak/shared'

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
      body: JSON.stringify(request.data)
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
