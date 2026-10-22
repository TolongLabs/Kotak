import {
  ApiErrorSchema,
  ExplanationRequestSchema,
  ExplanationResponseSchema,
  HealthResponseSchema,
  NationalViewSummaryRequestSchema,
  NationalViewSummaryResponseSchema,
  RoleMatchRequestSchema,
  RoleMatchResponseSchema,
  type ApiError,
  type ExplanationRequest,
  type ExplanationResponse,
  type HealthResponse,
  type NationalViewSummaryRequest,
  type NationalViewSummaryResponse,
  type RoleMatchRequest,
  type RoleMatchResponse
} from '@kotak/shared'
import type { z } from 'zod'

// A typed client for Kotak's HTTP API (#184 "API client"), for code outside the web app. Requests and responses are
// checked with the API's own schemas in @kotak/shared. Like the web's calls, a failure is a result, never a throw.

/**
 * The response, or `unavailable` on any failure: network, non-2xx, or a body that fails its schema. `error` is the
 * API's error when the server sent one, or `invalid_request` when the client refused the request before sending it.
 */
export type ApiResult<T> = { status: 'available'; data: T } | { status: 'unavailable'; error?: ApiError['error'] }

export interface KotakClient {
  /** `{ status: 'ok' }` while the API is up. */
  health: () => Promise<ApiResult<HealthResponse>>
  /** The O*NET role for a job title: title search first, then Claude when the server has a key. */
  matchRole: (request: RoleMatchRequest) => Promise<ApiResult<RoleMatchResponse>>
  /** Two cited sentences per corner and a what-changed summary; the fixed template when Claude is unavailable. */
  explain: (request: ExplanationRequest) => Promise<ApiResult<ExplanationResponse>>
  /** Average corner levels per role in Malaysia: real from 10 check-ups, otherwise labelled sample data. */
  nationalViewSummary: (filter?: NationalViewSummaryRequest) => Promise<ApiResult<NationalViewSummaryResponse>>
}

const unavailable = { status: 'unavailable' } as const

// Names the first problem, as the API's own invalid_request does, for example "job_title: Too small: ...".
const invalid = (error: z.ZodError) => {
  const [issue] = error.issues
  const where = issue!.path.length ? `${issue!.path.join('.')}: ` : ''
  return { status: 'unavailable', error: { code: 'invalid_request', message: `${where}${issue!.message}` } } as const
}

/** `baseUrl` is the site's origin, such as https://kotak.tp073654.workers.dev or http://localhost:8787. */
export function createKotakClient({
  baseUrl,
  fetch = (url, init) => globalThis.fetch(url, init)
}: {
  baseUrl: string
  fetch?: (url: string, init?: RequestInit) => Promise<Response>
}): KotakClient {
  const root = baseUrl.replace(/\/$/, '')

  async function call<T>(path: string, init: RequestInit | undefined, schema: z.ZodType<T>): Promise<ApiResult<T>> {
    try {
      const response = await fetch(`${root}${path}`, init)
      const body: unknown = await response.json().catch(() => undefined)
      if (!response.ok) {
        const error = ApiErrorSchema.safeParse(body)
        return error.success ? { status: 'unavailable', error: error.data.error } : unavailable
      }
      const result = schema.safeParse(body)
      return result.success ? { status: 'available', data: result.data } : unavailable
    } catch {
      return unavailable
    }
  }

  async function post<T>(path: string, body: unknown, requestSchema: z.ZodType, responseSchema: z.ZodType<T>) {
    const request = requestSchema.safeParse(body)
    if (!request.success) return invalid(request.error)
    const init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.data) }
    return call(path, init, responseSchema)
  }

  return {
    health: () => call('/api/health', undefined, HealthResponseSchema),

    matchRole: (request) => post('/api/roles/match', request, RoleMatchRequestSchema, RoleMatchResponseSchema),

    explain: (request) => post('/api/explanations', request, ExplanationRequestSchema, ExplanationResponseSchema),

    async nationalViewSummary(filter = {}) {
      const request = NationalViewSummaryRequestSchema.safeParse(filter)
      if (!request.success) return invalid(request.error)
      const query = new URLSearchParams(
        Object.entries(request.data).filter((entry): entry is [string, string] => entry[1] !== undefined)
      ).toString()
      return call(`/api/national-view/summary${query && `?${query}`}`, undefined, NationalViewSummaryResponseSchema)
    }
  }
}
