import { isCareerSlug, slugForSearchUrl } from './careers'
import type { JobstreetCareer } from './careers'
import { parseListing } from './records'

export type JobstreetMode = 'breadth' | 'depth'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// The whole queue request: a search title's slug and a mode. Whether the slug names an enabled search title is
// checked against jobstreet_careers by the API before queueing and by the runner before it opens a browser.
export function parseJobstreetTask(value: unknown): { careerSlug: string; mode: JobstreetMode } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid JobStreet task')
  const input = value as Record<string, unknown>
  if (Object.keys(input).length !== 2 || !Object.hasOwn(input, 'career_slug') || !Object.hasOwn(input, 'mode'))
    throw new Error('Only career_slug and mode are accepted')
  if (!isCareerSlug(input.career_slug) || (input.mode !== 'breadth' && input.mode !== 'depth'))
    throw new Error('Choose a JobStreet search title and breadth or depth mode')
  return { careerSlug: input.career_slug, mode: input.mode }
}

// The runner's claim: the oldest queued run, marked running, for parseQueuedJobstreetRun. The Neon driver parses a
// date column into a JavaScript Date, which that check rejects as an invalid schedule date, so the nightly runs failed
// before scraping (#289). The date goes out as YYYY-MM-DD text instead, from to_char: a ::text cast follows the
// session's DateStyle. A manual run's date stays null.
export const CLAIM_NEXT_RUN = `UPDATE jobstreet_scrape_runs
  SET status = 'running', started_at = now(), heartbeat_at = now(), error = NULL
  WHERE id = (
    SELECT id FROM jobstreet_scrape_runs
    WHERE status = 'queued'
    ORDER BY created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id, career_slug, mode, source, to_char(scheduled_for, 'YYYY-MM-DD') AS scheduled_for`

export function parseQueuedJobstreetRun(value: unknown): {
  id: string
  career_slug: string
  mode: JobstreetMode
  source: 'manual' | 'schedule'
  scheduled_for: string | null
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid queued JobStreet task')
  const row = value as Record<string, unknown>
  const { careerSlug, mode } = parseJobstreetTask({ career_slug: row.career_slug, mode: row.mode })
  if (typeof row.id !== 'string' || !uuid.test(row.id)) throw new Error('Invalid JobStreet queue run ID')
  const source = row.source
  if (source !== 'manual' && source !== 'schedule') throw new Error('Invalid JobStreet queue source')
  const scheduledFor = row.scheduled_for
  if (scheduledFor !== null) {
    const date = typeof scheduledFor === 'string' ? new Date(`${scheduledFor}T00:00:00Z`) : new Date(NaN)
    if (
      typeof scheduledFor !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(scheduledFor) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== scheduledFor
    )
      throw new Error('Invalid JobStreet schedule date')
  }
  if ((row.source === 'schedule') !== (row.scheduled_for !== null)) throw new Error('Invalid JobStreet schedule source')
  return { id: row.id, career_slug: careerSlug, mode, source, scheduled_for: scheduledFor }
}

export function queuedDepthListing(
  row: { job_id: string; career_slug: string; latest_payload: unknown },
  career: JobstreetCareer
) {
  const listing = parseListing(row.latest_payload)
  if (
    row.career_slug !== career.slug ||
    listing.job_id !== row.job_id ||
    slugForSearchUrl(listing.search_url) !== career.slug
  )
    throw new Error('Queued JobStreet listing identity or career does not match')
  return listing
}
