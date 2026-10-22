import type { ApiError } from '@kotak/shared'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { z } from 'zod'

export const fail = (context: Context, status: ContentfulStatusCode, code: string, message: string) =>
  context.json({ error: { code, message } } satisfies ApiError, status)

// Names the first problem Zod found, for example "corners.2.verdict: Invalid option".
export const invalidRequest = (context: Context, error: z.ZodError) => {
  const issue = error.issues[0]
  const where = issue?.path.length ? `${issue.path.join('.')}: ` : ''
  return fail(context, 400, 'invalid_request', `Invalid request body. ${where}${issue?.message ?? 'Send JSON.'}`)
}

export const tooLarge = (maxBytes: number) => (context: Context) =>
  fail(context, 413, 'request_too_large', `The request body is over ${maxBytes / 1024} KB.`)
