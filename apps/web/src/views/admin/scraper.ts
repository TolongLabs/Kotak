import { parseCareerTitle, searchTitleSlug } from '@kotak/shared'

// Shapes and helpers shared by the JobStreet admin page and its panels. The API is apps/api/src/routes/jobstreet-admin.ts.

export type Career = {
  slug: string
  title: string
  search_url: string
  enabled: boolean
  daily_refresh: boolean
  onet_code: string | null
  occupation_title: string | null
  // The admin's switch. in_checkup is the result: not hidden, with a listing approved under the occupation.
  hidden: boolean
  in_checkup: boolean
  listing_count: number
  described_count: number
  approved_count: number
}

export type ScrapeRun = {
  id: string
  career_slug: string
  career_title: string
  mode: 'breadth' | 'depth'
  status: string
  source: string
  created_at: string
  started_at: string | null
  finished_at: string | null
  report: Record<string, unknown> | null
  error: string | null
  review_status: 'approved' | 'rejected' | null
  approved_count: number | null
  excluded_count: number | null
}

export type Occupation = { onet_code: string; title: string }

// Calls /api/admin/scraper<path> with the admin session; throws AdminSessionExpiredError after a 401.
export type RequestScraper = (path: string, init?: RequestInit) => Promise<unknown>

export class AdminSessionExpiredError extends Error {}

export function isAbortError(cause: unknown) {
  return cause instanceof DOMException && cause.name === 'AbortError'
}

// The page already handles an expired session or a request it cancelled.
export function isHandledError(cause: unknown) {
  return cause instanceof AdminSessionExpiredError || isAbortError(cause)
}

export function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : String(cause)
}

// A run's listings can be reviewed once the runner has finished with it, including a failed run that saved listings.
export function isReviewable(run: Pick<ScrapeRun, 'mode' | 'status'>) {
  return run.mode === 'breadth' && ['success', 'partial', 'failed'].includes(run.status)
}

// The JobStreet search a title runs, or the API's reason for refusing it (the same parseCareerTitle).
export function jobstreetSearchPreview(title: string): { url: string } | { error: string } {
  const parsed = parseCareerTitle(title)
  if ('error' in parsed) return parsed
  return { url: `https://my.jobstreet.com/${searchTitleSlug(parsed.title)}-jobs` }
}

// A listing's JobStreet ad. Job IDs are digits (records.ts checks them before they are saved).
export function jobstreetJobUrl(jobId: string): string | null {
  return /^\d+$/.test(jobId) ? `https://my.jobstreet.com/job/${jobId}` : null
}
