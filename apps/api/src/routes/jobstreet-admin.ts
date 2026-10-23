import { Hono, type Context } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import { noStore, requireScraperAdmin, type ScraperAdminEnv } from '../admin-auth'
import { describeClaudeError } from '../ai/claude'
import { withinRateLimit, type AiDeps } from '../ai/deps'
import type { AiContext } from '../ai/env'
import { neighbouringOccupations, occupationAlternateTitles } from '../ai/occupation-index'
import { getConfig } from '../config'
import { refreshAllListingSkills } from '../market/stats'
import { careerSearchUrl, isCareerSlug, parseCareerTitle, slugForTitle } from '../scrapers/jobstreet/careers'
import { jobstreetDatabase } from '../scrapers/jobstreet/database'
import {
  CLASSIFY_BATCH_SIZE,
  MAX_VERDICT_TITLE_LENGTH,
  VerdictDraftSchema,
  isSameTitle,
  isSearchTitle,
  verdictRequest,
  type Verdict
} from '../scrapers/jobstreet/review'
import { SYNC_APPROVED_AT } from '../scrapers/jobstreet/schedule'
import { parseJobstreetTask } from '../scrapers/jobstreet/tasks'

type AdminContext = Context<ScraperAdminEnv>
type Sql = ReturnType<typeof jobstreetDatabase>

const RUN_ID = /^[A-Za-z0-9-]{1,100}$/
const ONET_CODE = /^\d{2}-\d{4}\.\d{2}$/
// A batch can be reviewed once its runner has finished with it, including a failed run that saved listings.
const REVIEWABLE_STATUSES = new Set(['success', 'partial', 'failed'])
// The runner saves at most 5,000 listings per breadth run.
const MAX_REVIEW_IDS = 5000
// 5,000 job IDs are about 100 KB of JSON.
const MAX_BODY_BYTES = 256 * 1024
// O*NET names and neighbouring occupations shown to Claude with each batch of titles.
const PROMPT_ALTERNATE_TITLES = 15
const PROMPT_NEIGHBOURS = 12
// Sorting's rate-limit key. Each batch has its own classify path, so the path would give each batch its own 30 Claude
// calls a minute; one key makes every batch share them (#266).
export const CLASSIFY_RATE_LIMIT_KEY = 'jobstreet-classify'

const CareerCreateSchema = z.object({ title: z.string().max(200), onet_code: z.string().regex(ONET_CODE) }).strict()
const CareerUpdateSchema = z
  .object({
    onet_code: z.string().regex(ONET_CODE).optional(),
    daily_refresh: z.boolean().optional(),
    enabled: z.boolean().optional(),
    hidden: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0)
// One listing title, exactly as JobStreet shows it, or none for every title of the search title.
const ClearVerdictsSchema = z
  .object({
    title: z
      .string()
      .min(1)
      .refine((title) => [...title].length <= MAX_VERDICT_TITLE_LENGTH)
      .optional()
  })
  .strict()
const ReviewSchema = z.discriminatedUnion('decision', [
  z
    .object({
      decision: z.literal('approve'),
      approved_job_ids: z.array(z.string().regex(/^\d{1,20}$/)).max(MAX_REVIEW_IDS),
      // The batch's last observation when the page loaded: listings saved after it are left undecided.
      seen_through: z.string().regex(/^\d{1,19}$/)
    })
    .strict(),
  z.object({ decision: z.literal('reject') }).strict()
])

type Batch = {
  id: string
  career_slug: string
  mode: string
  status: string
  source: string
  created_at: string
  finished_at: string | null
  jobs_saved: number | null
  career_title: string
  onet_code: string | null
  review_status: 'approved' | 'rejected' | null
  approved_count: number | null
  excluded_count: number | null
  reviewed_at: string | null
  reviewed_by: string | null
}

function database(context: AdminContext): Sql | null {
  const url = getConfig(context, 'DATABASE_URL')
  return url ? jobstreetDatabase(url) : null
}

const noDatabase = (context: AdminContext) => context.json({ error: 'database is not configured' }, 503)

// A batch's decisions that still stand under its search title's occupation: a newer batch can take a listing over,
// and rejecting withdraws them.
const STANDING_DECISIONS = `(SELECT count(*) FILTER (WHERE decision.approved)::int FROM jobstreet_listing_reviews decision
         WHERE decision.scrape_run_id = run.id AND decision.onet_code = career.onet_code) AS approved_count,
       (SELECT count(*) FILTER (WHERE NOT decision.approved)::int FROM jobstreet_listing_reviews decision
         WHERE decision.scrape_run_id = run.id AND decision.onet_code = career.onet_code) AS excluded_count`

// Locks a search title's row against occupation changes and other reviews, while the runner can still save
// listings that reference it (their foreign-key checks take KEY SHARE locks, which this lock allows).
const LOCK_CAREER = 'SELECT slug FROM jobstreet_careers WHERE slug = $1 FOR NO KEY UPDATE'

// The first statement of every transaction that runs SYNC_APPROVED_AT, which writes jobstreet_listings last. Every
// deploy reruns the migrations, and CREATE INDEX IF NOT EXISTS takes a SHARE lock on its table even when the index
// exists: jobstreet_listings in 0002, then jobstreet_listing_reviews in 0006. A transaction that wrote the reviews and
// only then the listings would take them in the other order and could deadlock with a deploy. ROW EXCLUSIVE is the
// lock the sync takes anyway; it doesn't conflict with the runner's saves or other writes, only with those SHARE locks.
const LOCK_LISTINGS = 'LOCK TABLE jobstreet_listings IN ROW EXCLUSIVE MODE'

async function loadBatch(sql: Sql, runId: string): Promise<Batch | undefined> {
  const rows = await sql.query(
    `SELECT run.id, run.career_slug, run.mode, run.status, run.source, run.created_at, run.finished_at,
       CASE WHEN jsonb_typeof(run.report->'jobs_saved') = 'number' THEN (run.report->>'jobs_saved')::int END
         AS jobs_saved,
       career.title AS career_title, career.onet_code,
       review.status AS review_status, ${STANDING_DECISIONS}, review.reviewed_at,
       reviewer.username AS reviewed_by
     FROM jobstreet_scrape_runs run
     JOIN jobstreet_careers career ON career.slug = run.career_slug
     LEFT JOIN jobstreet_run_reviews review ON review.scrape_run_id = run.id
     LEFT JOIN scraper_admin_users reviewer ON reviewer.id = review.reviewed_by
     WHERE run.id = $1`,
    [runId]
  )
  return rows[0] as Batch | undefined
}

// A breadth batch the runner has finished with, or the response that explains why it cannot be reviewed.
async function reviewableBatch(context: AdminContext, sql: Sql): Promise<Batch | Response> {
  const runId = context.req.param('id') ?? ''
  if (!RUN_ID.test(runId)) return context.json({ error: 'Scrape run not found.' }, 404)
  const batch = await loadBatch(sql, runId)
  if (!batch) return context.json({ error: 'Scrape run not found.' }, 404)
  if (batch.mode !== 'breadth') return context.json({ error: 'Only breadth runs collect listings to review.' }, 409)
  if (!REVIEWABLE_STATUSES.has(batch.status))
    return context.json({ error: 'This run has not finished yet. Review it once the runner is done.' }, 409)
  return batch
}

// Whether the search title is in the check-up's job titles, read inside a review's transaction after its writes.
const IN_CHECKUP = `SELECT NOT career.hidden AND EXISTS (
     SELECT 1 FROM jobstreet_listing_reviews review
     WHERE review.career_slug = career.slug AND review.approved AND review.onet_code = career.onet_code
   ) AS in_checkup
   FROM jobstreet_careers career WHERE career.slug = $1`

const occupationChanged = (context: AdminContext) =>
  context.json(
    { error: "This search title's occupation changed while you were reviewing. Reload the batch and try again." },
    409
  )

export function createJobstreetAdminRoute(deps: AiDeps) {
  const route = new Hono<ScraperAdminEnv>()

  route.use(
    '*',
    noStore,
    requireScraperAdmin,
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: (context) => context.json({ error: 'The request is too large.' }, 413)
    })
  )

  const occupationTitle = (code: string | null) => (code ? (deps.occupations.getOccupation(code)?.title ?? null) : null)

  // Claude's verdicts for one request, or null when there is no key, sorting is over its rate limit (shared by every
  // batch) or the call fails. Not cached: a wrong or partial answer is not kept, and each title's verdict is stored
  // once it is checked.
  async function askClaude(context: AdminContext, request: ReturnType<typeof verdictRequest>) {
    const aiContext = context as unknown as AiContext
    const model = deps.model(aiContext)
    if (!model || !(await withinRateLimit(deps, aiContext, CLASSIFY_RATE_LIMIT_KEY))) return null
    try {
      return await model.generate(request, VerdictDraftSchema)
    } catch (error) {
      console.warn('[ai] Claude request failed:', describeClaudeError(error))
      return null
    }
  }

  // A search title is in the check-up when it is not hidden and has at least one listing approved under its current
  // occupation (approved_count counts only those).
  route.get('/careers', async (context) => {
    const sql = database(context)
    if (!sql) return noDatabase(context)
    const rows = (await sql.query(
      `SELECT career.slug, career.title, career.search_url, career.enabled, career.daily_refresh, career.hidden,
        career.onet_code, career.created_at,
        (SELECT count(*)::int FROM jobstreet_listings listing WHERE listing.career_slug = career.slug) AS listing_count,
        (SELECT count(*)::int FROM jobstreet_listings listing
         WHERE listing.career_slug = career.slug AND listing.latest_detail IS NOT NULL) AS described_count,
        (SELECT count(*)::int FROM jobstreet_listing_reviews review
         WHERE review.career_slug = career.slug AND review.approved AND review.onet_code = career.onet_code)
          AS approved_count
       FROM jobstreet_careers career ORDER BY career.title`
    )) as Array<Record<string, unknown> & { onet_code: string | null; hidden: boolean; approved_count: number }>
    return context.json({
      careers: rows.map((row) => {
        const occupation_title = occupationTitle(row.onet_code)
        return { ...row, occupation_title, in_checkup: !row.hidden && row.approved_count > 0 && !!occupation_title }
      })
    })
  })

  // Add a search title. Its JobStreet search is fixed by its slug. It starts outside the midnight refresh, and it
  // joins the check-up once an admin approves listings for it.
  route.post('/careers', async (context) => {
    const body = CareerCreateSchema.safeParse(await context.req.json().catch(() => null))
    if (!body.success) return context.json({ error: 'Enter a job title and choose an O*NET occupation.' }, 400)
    const parsed = parseCareerTitle(body.data.title)
    if ('error' in parsed) return context.json({ error: parsed.error }, 400)
    if (!deps.occupations.getOccupation(body.data.onet_code))
      return context.json({ error: 'Choose an occupation from the O*NET list.' }, 400)
    let slug: string
    try {
      slug = slugForTitle(parsed.title)
    } catch {
      return context.json(
        { error: 'That title does not make a JobStreet search. Use English letters or numbers.' },
        400
      )
    }
    const sql = database(context)
    if (!sql) return noDatabase(context)
    const searchUrl = careerSearchUrl(slug)
    const rows = await sql.query(
      `INSERT INTO jobstreet_careers (slug, title, search_url, enabled, daily_refresh, hidden, onet_code)
       VALUES ($1, $2, $3, true, false, false, $4)
       ON CONFLICT (slug) DO NOTHING
       RETURNING slug, title, search_url, onet_code`,
      [slug, parsed.title, searchUrl, body.data.onet_code]
    )
    if (!rows.length) {
      const [existing] = (await sql.query('SELECT title FROM jobstreet_careers WHERE slug = $1', [slug])) as Array<{
        title: string
      }>
      return context.json(
        { error: `"${existing?.title ?? slug}" already runs the same JobStreet search (${searchUrl}).` },
        409
      )
    }
    return context.json({ career: rows[0] }, 201)
  })

  // Change a search title's occupation or switches. The occupation stays while listings are approved under it, and
  // changing it clears the title verdicts, which were for the old occupation. The row is locked first, so an
  // approval in progress either finishes before the change or sees it.
  route.patch('/careers/:slug', async (context) => {
    const slug = context.req.param('slug')
    if (!isCareerSlug(slug)) return context.json({ error: 'Search title not found.' }, 404)
    const body = CareerUpdateSchema.safeParse(await context.req.json().catch(() => null))
    if (!body.success) return context.json({ error: 'Send onet_code, daily_refresh, enabled or hidden.' }, 400)
    const change = body.data
    if (change.onet_code !== undefined && !deps.occupations.getOccupation(change.onet_code))
      return context.json({ error: 'Choose an occupation from the O*NET list.' }, 400)
    const sql = database(context)
    if (!sql) return noDatabase(context)

    const [, locked, updated] = (await sql.transaction((transaction) => [
      transaction.query(LOCK_LISTINGS),
      transaction.query(LOCK_CAREER, [slug]),
      transaction.query(
        `WITH previous AS (SELECT onet_code FROM jobstreet_careers WHERE slug = $1),
         changed AS (
           UPDATE jobstreet_careers SET
             onet_code = COALESCE($2::text, onet_code),
             daily_refresh = COALESCE($3::boolean, daily_refresh),
             enabled = COALESCE($4::boolean, enabled),
             hidden = COALESCE($5::boolean, hidden)
           WHERE slug = $1 AND ($2::text IS NULL OR NOT EXISTS (
             SELECT 1 FROM jobstreet_listing_reviews review
             WHERE review.career_slug = $1 AND review.approved AND review.onet_code <> $2::text
           ))
           RETURNING slug, title, search_url, enabled, daily_refresh, hidden, onet_code
         ),
         cleared AS (
           DELETE FROM jobstreet_title_verdicts verdict USING changed, previous
           WHERE verdict.career_slug = changed.slug AND changed.onet_code IS DISTINCT FROM previous.onet_code
         )
         SELECT * FROM changed`,
        [slug, change.onet_code ?? null, change.daily_refresh ?? null, change.enabled ?? null, change.hidden ?? null]
      ),
      // An occupation change is refused while approvals stand under the old one, so this writes nothing today; it
      // keeps approved_at right if that rule changes.
      transaction.query(SYNC_APPROVED_AT, [slug])
    ])) as [unknown[], unknown[], Array<Record<string, unknown> & { onet_code: string | null }>, unknown[]]
    if (!locked.length) return context.json({ error: 'Search title not found.' }, 404)
    const [career] = updated
    if (!career)
      return context.json(
        {
          error:
            'Listings are already approved under another occupation for this title. Add a new search title instead.'
        },
        409
      )
    return context.json({ career: { ...career, occupation_title: occupationTitle(career.onet_code) } })
  })

  // Clear a search title's stored sorting answers, or the answer for one listing title, so sorting asks again (#265):
  // after a prompt change, or when Claude got a title wrong. A scraped title can try to steer Claude's answers for the
  // other titles in its request, and those answers decide which listings start ticked. Decisions already saved stay.
  // The review page sorts the open batch again straight after.
  route.post('/careers/:slug/verdicts/clear', async (context) => {
    const slug = context.req.param('slug')
    if (!isCareerSlug(slug)) return context.json({ error: 'Search title not found.' }, 404)
    const body = ClearVerdictsSchema.safeParse(await context.req.json().catch(() => null))
    if (!body.success)
      return context.json(
        {
          error: `Send one listing title of 1 to ${MAX_VERDICT_TITLE_LENGTH} characters, or none to clear every title.`
        },
        400
      )
    const sql = database(context)
    if (!sql) return noDatabase(context)
    const [result] = (await sql.query(
      `WITH career AS (SELECT slug FROM jobstreet_careers WHERE slug = $1),
       cleared AS (
         DELETE FROM jobstreet_title_verdicts verdict USING career
         WHERE verdict.career_slug = career.slug AND ($2::text IS NULL OR verdict.title = $2::text)
         RETURNING 1
       )
       SELECT EXISTS (SELECT 1 FROM career) AS found, (SELECT count(*)::int FROM cleared) AS cleared`,
      [slug, body.data.title ?? null]
    )) as Array<{ found: boolean; cleared: number }>
    if (!result?.found) return context.json({ error: 'Search title not found.' }, 404)
    return context.json({ cleared: result.cleared })
  })

  // O*NET occupations for a title, by title and alternate-title search (no AI).
  route.get('/occupations', (context) => {
    const query = (context.req.query('q') ?? '').normalize('NFKC').trim()
    if (query.length < 2 || query.length > 150) return context.json({ error: 'Type 2 to 150 characters.' }, 400)
    const byCode = ONET_CODE.test(query) ? deps.occupations.getOccupation(query) : null
    const found = byCode ? { match: 'exact' as const, hits: [byCode] } : deps.occupations.search(query, 8)
    return context.json({
      match: found.match,
      occupations: found.hits.map((occupation) => ({ onet_code: occupation.onet_code, title: occupation.title }))
    })
  })

  // Other names O*NET publishes for an occupation: starting points for the titles Malaysian ads use.
  route.get('/occupations/:code/titles', (context) => {
    const code = context.req.param('code')
    const occupation = ONET_CODE.test(code) ? deps.occupations.getOccupation(code) : null
    if (!occupation) return context.json({ error: 'Occupation not found.' }, 404)
    return context.json({ onet_code: occupation.onet_code, titles: occupationAlternateTitles(occupation.onet_code) })
  })

  route.get('/runs', async (context) => {
    const sql = database(context)
    if (!sql) return noDatabase(context)
    const rows = await sql.query(
      `SELECT run.id, run.career_slug, career.title AS career_title, run.mode, run.status, run.source,
        run.scheduled_for, run.created_at, run.started_at, run.finished_at, run.report, run.error,
        review.status AS review_status, ${STANDING_DECISIONS}
       FROM jobstreet_scrape_runs run
       JOIN jobstreet_careers career ON career.slug = run.career_slug
       LEFT JOIN jobstreet_run_reviews review ON review.scrape_run_id = run.id
       ORDER BY run.created_at DESC LIMIT 50`
    )
    return context.json({ runs: rows })
  })

  route.get('/jobs', async (context) => {
    const sql = database(context)
    if (!sql) return noDatabase(context)
    const careerSlug = context.req.query('career')
    const rows = careerSlug
      ? await sql.query(
          `SELECT job_id, career_slug, latest_payload, latest_seen_at, latest_detail
           FROM jobstreet_listings WHERE career_slug = $1 ORDER BY latest_seen_at DESC LIMIT 100`,
          [careerSlug]
        )
      : await sql.query(
          `SELECT job_id, career_slug, latest_payload, latest_seen_at, latest_detail
           FROM jobstreet_listings ORDER BY latest_seen_at DESC LIMIT 100`
        )
    return context.json({ jobs: rows })
  })

  route.post('/runs', async (context) => {
    const body = await context.req.json().catch(() => null)
    let task: ReturnType<typeof parseJobstreetTask>
    try {
      task = parseJobstreetTask(body)
    } catch {
      return context.json({ error: 'Choose a search title and breadth or depth mode.' }, 400)
    }
    const sql = database(context)
    if (!sql) return noDatabase(context)
    try {
      // The run is queued only for an enabled search title; the runner checks the title again before it starts.
      const rows = await sql.query(
        `INSERT INTO jobstreet_scrape_runs (id, career_slug, mode, status, source)
         SELECT $1, slug, $3, 'queued', 'manual' FROM jobstreet_careers WHERE slug = $2 AND enabled
         RETURNING id, career_slug, mode, status, created_at`,
        [crypto.randomUUID(), task.careerSlug, task.mode]
      )
      if (!rows.length) return context.json({ error: 'Choose an enabled search title.' }, 404)
      return context.json({ run: rows[0] }, 202)
    } catch (error) {
      if (String(error).includes('jobstreet_scrape_runs_one_active_per_career_idx'))
        return context.json({ error: 'A scrape for this search title is already queued or running.' }, 409)
      console.error('Could not queue JobStreet run:', error instanceof Error ? error.message : error)
      return context.json({ error: 'Could not queue the scrape.' }, 503)
    }
  })

  // One breadth batch for review: every listing it saw, its title's verdict, and the listing's current decision under
  // the search title's occupation. decided_in says which batch made that decision: this one, an older one (approving
  // this batch replaces it) or a newer one (which stands). title_decision is the admin's call on the same title in
  // other batches, when every listing with it was approved or every one excluded. seen_through marks the last
  // observation shown, and unsorted_titles counts the titles sorting can still answer.
  route.get('/runs/:id/review', async (context) => {
    const sql = database(context)
    if (!sql) return noDatabase(context)
    const batch = await reviewableBatch(context, sql)
    if (batch instanceof Response) return batch
    const listings = (await sql.query(
      `WITH batch AS (
         SELECT DISTINCT ON (observation.job_id) observation.job_id, observation.payload
         FROM jobstreet_observations observation
         WHERE observation.scrape_run_id = $1 AND observation.career_slug = $2
         ORDER BY observation.job_id, observation.observed_at DESC
       ),
       decided AS (
         SELECT DISTINCT ON (review.job_id) review.approved, observation.payload->>'title' AS title
         FROM jobstreet_listing_reviews review
         JOIN jobstreet_observations observation
           ON observation.job_id = review.job_id AND observation.career_slug = review.career_slug
           AND observation.scrape_run_id = review.scrape_run_id
         WHERE review.career_slug = $2 AND review.onet_code = $3::text AND review.scrape_run_id <> $1
         ORDER BY review.job_id, observation.observed_at DESC
       ),
       title_decisions AS (
         SELECT title, bool_and(approved) AS all_approved, bool_or(approved) AS any_approved
         FROM decided GROUP BY title
       )
       SELECT batch.job_id, batch.payload->>'title' AS title, batch.payload->>'company' AS company,
         batch.payload->>'location' AS location, batch.payload->>'salary' AS salary,
         batch.payload->>'listed_at_label' AS listed,
         verdict.verdict, verdict.source AS verdict_source,
         CASE WHEN review.onet_code = $3::text THEN review.approved END AS approved,
         CASE
           WHEN review.job_id IS NULL OR review.onet_code IS DISTINCT FROM $3::text OR $3::text IS NULL THEN NULL
           WHEN review.scrape_run_id = $1 THEN 'this'
           WHEN review_run.created_at > (SELECT created_at FROM jobstreet_scrape_runs WHERE id = $1) THEN 'newer'
           ELSE 'older'
         END AS decided_in,
         CASE WHEN title_decisions.all_approved THEN 'approved'
           WHEN NOT title_decisions.any_approved THEN 'excluded' END AS title_decision
       FROM batch
       LEFT JOIN jobstreet_title_verdicts verdict
         ON verdict.career_slug = $2 AND verdict.title = batch.payload->>'title'
       LEFT JOIN jobstreet_listing_reviews review
         ON review.job_id = batch.job_id AND review.career_slug = $2
       LEFT JOIN jobstreet_scrape_runs review_run ON review_run.id = review.scrape_run_id
       LEFT JOIN title_decisions ON title_decisions.title = batch.payload->>'title'
       ORDER BY batch.job_id`,
      [batch.id, batch.career_slug, batch.onet_code]
    )) as Array<{ title: string | null; verdict: Verdict | null }>
    const [{ seen_through }] = (await sql.query(
      'SELECT max(id)::text AS seen_through FROM jobstreet_observations WHERE scrape_run_id = $1 AND career_slug = $2',
      [batch.id, batch.career_slug]
    )) as Array<{ seen_through: string | null }>
    // As classify counts them: distinct titles of 1 to 500 characters without a verdict.
    const unsorted_titles = new Set(
      listings
        .filter((listing) => listing.verdict === null && listing.title)
        .map((listing) => listing.title as string)
        .filter((title) => [...title].length <= MAX_VERDICT_TITLE_LENGTH)
    ).size
    return context.json({
      run: {
        id: batch.id,
        status: batch.status,
        source: batch.source,
        created_at: batch.created_at,
        finished_at: batch.finished_at,
        jobs_saved: batch.jobs_saved,
        seen_through
      },
      career: {
        slug: batch.career_slug,
        title: batch.career_title,
        onet_code: batch.onet_code,
        occupation_title: occupationTitle(batch.onet_code)
      },
      review: batch.review_status
        ? {
            status: batch.review_status,
            approved_count: batch.approved_count,
            excluded_count: batch.excluded_count,
            reviewed_at: batch.reviewed_at,
            reviewed_by: batch.reviewed_by
          }
        : null,
      unsorted_titles,
      listings
    })
  })

  // Sort the next titles of a batch. The page calls this until nothing remains. Titles that are the admin's own
  // search title need no AI; Claude answers the rest. Verdicts are stored per search title and listing title.
  route.post('/runs/:id/classify', async (context) => {
    const sql = database(context)
    if (!sql) return noDatabase(context)
    const batch = await reviewableBatch(context, sql)
    if (batch instanceof Response) return batch
    const occupation = batch.onet_code ? deps.occupations.getOccupation(batch.onet_code) : null
    if (!occupation) return context.json({ error: "Choose this search title's O*NET occupation first." }, 409)

    const unsorted = `FROM jobstreet_observations observation
       LEFT JOIN jobstreet_title_verdicts verdict
         ON verdict.career_slug = $2 AND verdict.title = observation.payload->>'title'
       WHERE observation.scrape_run_id = $1 AND observation.career_slug = $2 AND verdict.title IS NULL
         AND char_length(observation.payload->>'title') BETWEEN 1 AND ${MAX_VERDICT_TITLE_LENGTH}`
    const [{ remaining }] = (await sql.query(
      `SELECT count(DISTINCT observation.payload->>'title')::int AS remaining ${unsorted}`,
      [batch.id, batch.career_slug]
    )) as Array<{ remaining: number }>
    if (!remaining) return context.json({ sorted: 0, remaining: 0 })
    const titles = (
      (await sql.query(
        `SELECT DISTINCT observation.payload->>'title' AS title ${unsorted} ORDER BY 1 LIMIT ${CLASSIFY_BATCH_SIZE}`,
        [batch.id, batch.career_slug]
      )) as Array<{ title: string }>
    ).map((row) => row.title)

    const verdicts: Array<{ title: string; verdict: Verdict; source: 'search_title' | 'claude' }> = []
    const forClaude: string[] = []
    for (const title of titles) {
      if (isSearchTitle(title, batch.career_title)) verdicts.push({ title, verdict: 'match', source: 'search_title' })
      else forClaude.push(title)
    }
    let aiUnavailable = false
    if (forClaude.length) {
      const answer = await askClaude(
        context,
        verdictRequest(
          occupation,
          batch.career_title,
          {
            alternateTitles: occupationAlternateTitles(occupation.onet_code, PROMPT_ALTERNATE_TITLES),
            neighbours: neighbouringOccupations(deps.occupations, occupation.onet_code, PROMPT_NEIGHBOURS)
          },
          forClaude
        )
      )
      if (!answer) aiUnavailable = true
      const seen = new Set<number>()
      for (const { number, title, verdict } of answer?.verdicts ?? []) {
        // An answer counts only if its number names a title Claude was sent, once, and it copies that title.
        if (number < 1 || number > forClaude.length || seen.has(number)) continue
        const sent = forClaude[number - 1]
        if (!isSameTitle(title, sent)) continue
        seen.add(number)
        verdicts.push({ title: sent, verdict, source: 'claude' })
      }
    }
    if (verdicts.length) {
      // Kept only while the search title still has this occupation. The shared lock waits for an occupation change
      // in progress, which clears the old verdicts.
      await sql.transaction((transaction) => [
        transaction.query('SELECT slug FROM jobstreet_careers WHERE slug = $1 FOR SHARE', [batch.career_slug]),
        transaction.query(
          `INSERT INTO jobstreet_title_verdicts (career_slug, title, verdict, source)
           SELECT $1, item.title, item.verdict, item.source
           FROM jsonb_to_recordset($3::jsonb) AS item(title text, verdict text, source text)
           WHERE EXISTS (SELECT 1 FROM jobstreet_careers WHERE slug = $1 AND onet_code = $2)
           ON CONFLICT (career_slug, title) DO NOTHING`,
          [batch.career_slug, occupation.onet_code, JSON.stringify(verdicts)]
        )
      ])
    }
    if (aiUnavailable && !verdicts.length)
      return context.json(
        {
          error: 'Kopi could not sort these titles right now. Try again in a minute, or review them yourself.',
          remaining
        },
        503
      )
    return context.json({ sorted: verdicts.length, remaining: Math.max(0, remaining - verdicts.length) })
  })

  // Approve a batch's ticked listings (the rest are excluded) or reject the whole batch. A listing keeps the decision
  // of the newest batch reviewed: approving an older batch leaves decisions from newer ones alone. Rejecting withdraws
  // the decisions this batch made. The search title is in the check-up while any listing is approved under its
  // occupation and it is not hidden.
  route.post('/runs/:id/review', async (context) => {
    const body = ReviewSchema.safeParse(await context.req.json().catch(() => null))
    if (!body.success) return context.json({ error: 'Approve a list of job IDs or reject the batch.' }, 400)
    const sql = database(context)
    if (!sql) return noDatabase(context)
    const batch = await reviewableBatch(context, sql)
    if (batch instanceof Response) return batch
    const user = context.get('scraperAdminUser')

    if (body.data.decision === 'reject') {
      // The same lock as approving, so a reject and an approve of one batch run one after the other.
      const [, , , , [checkup]] = (await sql.transaction((transaction) => [
        transaction.query(LOCK_LISTINGS),
        transaction.query(LOCK_CAREER, [batch.career_slug]),
        transaction.query(
          `INSERT INTO jobstreet_run_reviews (scrape_run_id, status, approved_count, excluded_count, reviewed_by)
           VALUES ($1, 'rejected', 0, 0, $2::uuid)
           ON CONFLICT (scrape_run_id) DO UPDATE SET status = 'rejected', approved_count = 0, excluded_count = 0,
             reviewed_by = EXCLUDED.reviewed_by, reviewed_at = now()`,
          [batch.id, user.id]
        ),
        transaction.query('DELETE FROM jobstreet_listing_reviews WHERE scrape_run_id = $1', [batch.id]),
        transaction.query(IN_CHECKUP, [batch.career_slug]),
        transaction.query(SYNC_APPROVED_AT, [batch.career_slug])
      ])) as [unknown[], unknown[], unknown[], unknown[], Array<{ in_checkup: boolean }>, unknown[]]
      return context.json({
        review: { status: 'rejected', approved_count: 0, excluded_count: 0 },
        in_checkup: checkup?.in_checkup === true && occupationTitle(batch.onet_code) !== null
      })
    }

    if (!batch.onet_code || !deps.occupations.getOccupation(batch.onet_code))
      return context.json({ error: "Choose this search title's O*NET occupation before approving." }, 409)
    const approvedIds = [...new Set(body.data.approved_job_ids)]
    const seenThrough = body.data.seen_through
    const [{ matched }] = (await sql.query(
      `SELECT count(DISTINCT job_id) FILTER (WHERE job_id = ANY($3::text[]))::int AS matched
       FROM jobstreet_observations WHERE scrape_run_id = $1 AND career_slug = $2 AND id <= $4::bigint`,
      [batch.id, batch.career_slug, approvedIds, seenThrough]
    )) as Array<{ matched: number }>
    if (matched !== approvedIds.length)
      return context.json(
        { error: 'Some approved listings are not in this batch. Reload the batch and try again.' },
        400
      )

    // The search title's row is locked for the whole transaction, and every write checks that its occupation is
    // still the one this review was for. Only listings the page showed (up to seen_through) are decided.
    const results = (await sql.transaction((transaction) => [
      transaction.query(LOCK_LISTINGS),
      transaction.query(LOCK_CAREER, [batch.career_slug]),
      transaction.query(
        `INSERT INTO jobstreet_listing_reviews (job_id, career_slug, approved, onet_code, scrape_run_id, reviewed_by)
         SELECT listing.job_id, $2, listing.job_id = ANY($3::text[]), $4, $1, $5::uuid
         FROM (
           SELECT DISTINCT job_id FROM jobstreet_observations
           WHERE scrape_run_id = $1 AND career_slug = $2 AND id <= $6::bigint
         ) AS listing
         WHERE EXISTS (SELECT 1 FROM jobstreet_careers WHERE slug = $2 AND onet_code = $4)
         ON CONFLICT (job_id, career_slug) DO UPDATE SET approved = EXCLUDED.approved,
           onet_code = EXCLUDED.onet_code, scrape_run_id = EXCLUDED.scrape_run_id,
           reviewed_by = EXCLUDED.reviewed_by, reviewed_at = now()
         WHERE jobstreet_listing_reviews.scrape_run_id = EXCLUDED.scrape_run_id
           OR jobstreet_listing_reviews.onet_code <> EXCLUDED.onet_code
           OR (SELECT created_at FROM jobstreet_scrape_runs WHERE id = jobstreet_listing_reviews.scrape_run_id)
             <= (SELECT created_at FROM jobstreet_scrape_runs WHERE id = EXCLUDED.scrape_run_id)`,
        [batch.id, batch.career_slug, approvedIds, batch.onet_code, user.id, seenThrough]
      ),
      transaction.query(
        `INSERT INTO jobstreet_run_reviews (scrape_run_id, status, approved_count, excluded_count, reviewed_by)
         SELECT $1, 'approved', count(*) FILTER (WHERE approved)::int, count(*) FILTER (WHERE NOT approved)::int,
           $2::uuid
         FROM jobstreet_listing_reviews WHERE scrape_run_id = $1
         HAVING EXISTS (SELECT 1 FROM jobstreet_careers WHERE slug = $3 AND onet_code = $4)
         ON CONFLICT (scrape_run_id) DO UPDATE SET status = 'approved', approved_count = EXCLUDED.approved_count,
           excluded_count = EXCLUDED.excluded_count, reviewed_by = EXCLUDED.reviewed_by, reviewed_at = now()
         RETURNING approved_count, excluded_count`,
        [batch.id, user.id, batch.career_slug, batch.onet_code]
      ),
      transaction.query(IN_CHECKUP, [batch.career_slug]),
      // The runner's depth order (#276). Listings a runner save holds right now are skipped, not waited for; the
      // nightly cron syncs them.
      transaction.query(SYNC_APPROVED_AT, [batch.career_slug])
    ])) as [
      unknown[],
      unknown[],
      unknown[],
      Array<{ approved_count: number; excluded_count: number }>,
      Array<{ in_checkup: boolean }>,
      unknown[]
    ]
    const [review] = results[3]
    if (!review) return occupationChanged(context)
    // The job-ad market (#271) reads approvals live; match the batch's skills now rather than at the nightly refresh.
    // A failure only delays them until then.
    const matching = refreshAllListingSkills(sql, { careerSlug: batch.career_slug, batch: 1000, maxBatches: 5 }).catch(
      (error) => console.error('Could not match listing skills:', error instanceof Error ? error.message : error)
    )
    try {
      context.executionCtx.waitUntil(matching)
    } catch {
      await matching // Bun has no execution context: finish before answering.
    }
    return context.json({ review: { status: 'approved', ...review }, in_checkup: results[4][0]?.in_checkup === true })
  })

  return route
}
