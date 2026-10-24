import { JOB_MARKET_MIN_PAY_ADS, JOB_MARKET_MIN_SKILL_ADS, type JobMarket } from '@kotak/shared'
import type { jobstreetDatabase } from '../scrapers/jobstreet/database'
import { SKILL_BY_KEY, SKILL_PATTERN_ROWS, SKILL_TERMS, SKILL_VOCABULARY_VERSION, type SkillCategory } from './skills'

// The job-ad market (#271): what the JobStreet ads an admin approved under an O*NET occupation say about it. Postgres
// does the matching and the sums, so the Worker, with 10 ms of CPU a request, only shapes a few rows.

type Sql = ReturnType<typeof jobstreetDatabase>

/** Ads seen this many days before an occupation's latest scrape are active. */
export const ACTIVE_WINDOW_DAYS = 14
const TOP_REGIONS = 5
const TOP_TOOLS = 8
const TOP_LANGUAGES = 4
const TOP_AI = 5
const TOP_BENEFITS = 8
const WEEKS = 12
/** Decided listings a search title's run needs before it estimates how many JobStreet ads match the occupation. */
export const MIN_ESTIMATE_SAMPLE = 20

const AI_KEYS = SKILL_TERMS.filter((term) => term.category === 'ai').map((term) => term.key)

/**
 * The selling points an employer puts on an ad's card, up to three short lines such as "Medical Benefit" or "Free
 * Parking", as `card_points.highlights`. The card text reads "… This is a Full time job <location>[(Remote)] [<pay>]
 * <selling points> <summary> subClassification: …", so they are what lies between the location, work arrangement and
 * pay, and the summary. A card without any gives '', and one laid out otherwise gives NULL. `payload` is the SQL for
 * the listing's payload.
 */
export const cardHighlights = (payload: string) => `CROSS JOIN LATERAL (
    SELECT ${payload}->>'listing_text' AS text, ' job ' || (${payload}->>'location') AS anchor,
      nullif(${payload}->>'summary', '') AS summary, nullif(${payload}->>'salary', '') AS salary
  ) card
  CROSS JOIN LATERAL (
    SELECT CASE WHEN strpos(card.text, card.anchor) > 0 AND strpos(card.text, card.summary) > 0 THEN
      substr(card.text, strpos(card.text, card.anchor) + length(card.anchor),
        greatest(0, strpos(card.text, card.summary) - strpos(card.text, card.anchor) - length(card.anchor)))
    END AS between_text
  ) card_span
  CROSS JOIN LATERAL (
    SELECT btrim(regexp_replace(
      CASE WHEN card.salary IS NULL THEN card_span.between_text ELSE replace(card_span.between_text, card.salary, ' ') END,
      '^\\s*\\([^)]*\\)', '')) AS highlights
  ) card_points`

// The text a listing's skills are matched in: its title, summary, card text and, once a depth run fetched it, its
// description. The card text names the employer, which is taken out, so "Swift Haulage" is no Swift job. Its "Listed
// two days ago" changes every scrape, so the hash that decides whether to match again leaves the card text out and
// takes only its selling points, which benefits are matched in.
const MATCHED_TEXT = `concat_ws(' ', listing.latest_payload->>'title', listing.latest_payload->>'summary',
  replace(listing.latest_payload->>'listing_text', coalesce(listing.latest_payload->>'company', ''), ' '),
  listing.latest_detail->>'description_text')`
const HASHED_TEXT = `md5(concat_ws(' ', listing.latest_payload->>'title', listing.latest_payload->>'summary',
  listing.latest_detail->>'description_text', card_points.highlights, $2::text))`

/**
 * Matches up to `limit` listings whose skills are missing or stale, newest first, optionally for one search title.
 * Returns how many it matched; fewer than `limit` means none are left.
 */
export async function refreshListingSkills(sql: Sql, options: { limit: number; careerSlug?: string }) {
  const rows = await sql.query(
    `WITH vocabulary AS (
       SELECT key, pattern, case_sensitive, highlights
       FROM jsonb_to_recordset($1::jsonb) AS term(key text, pattern text, case_sensitive boolean, highlights boolean)
     ),
     pending AS MATERIALIZED (
       SELECT listing.job_id, listing.career_slug, ${MATCHED_TEXT} AS text, card_points.highlights,
         ${HASHED_TEXT} AS text_md5
       FROM jobstreet_listings listing
       ${cardHighlights('listing.latest_payload')}
       LEFT JOIN jobstreet_listing_skills matched
         ON matched.job_id = listing.job_id AND matched.career_slug = listing.career_slug
       WHERE ($3::text IS NULL OR listing.career_slug = $3)
         AND (matched.job_id IS NULL OR matched.vocabulary_version <> $2 OR matched.text_md5 <> ${HASHED_TEXT})
       ORDER BY listing.latest_seen_at DESC
       LIMIT $4
     ),
     -- Pattern by pattern, not listing by listing: Postgres keeps only 32 compiled patterns, so going through every
     -- pattern for each listing would compile each one again for every listing, about four times slower on 1,000
     -- listings. OFFSET 0 keeps the planner from turning the order round. Benefit patterns read only the selling points.
     hits AS (
       SELECT hit.job_id, hit.career_slug, vocabulary.key
       FROM vocabulary
       CROSS JOIN LATERAL (
         SELECT pending.job_id, pending.career_slug FROM pending
         WHERE CASE WHEN vocabulary.case_sensitive
           THEN (CASE WHEN vocabulary.highlights THEN pending.highlights ELSE pending.text END) ~ vocabulary.pattern
           ELSE (CASE WHEN vocabulary.highlights THEN pending.highlights ELSE pending.text END) ~* vocabulary.pattern END
         OFFSET 0
       ) hit
     )
     INSERT INTO jobstreet_listing_skills (job_id, career_slug, skills, text_md5, vocabulary_version, matched_at)
     SELECT pending.job_id, pending.career_slug,
       coalesce(array_agg(DISTINCT hits.key ORDER BY hits.key) FILTER (WHERE hits.key IS NOT NULL), '{}'),
       pending.text_md5, $2, now()
     FROM pending
     LEFT JOIN hits ON hits.job_id = pending.job_id AND hits.career_slug = pending.career_slug
     GROUP BY pending.job_id, pending.career_slug, pending.text_md5
     ON CONFLICT (job_id, career_slug) DO UPDATE SET skills = EXCLUDED.skills, text_md5 = EXCLUDED.text_md5,
       vocabulary_version = EXCLUDED.vocabulary_version, matched_at = EXCLUDED.matched_at
     RETURNING job_id`,
    [SKILL_PATTERN_ROWS, SKILL_VOCABULARY_VERSION, options.careerSlug ?? null, options.limit]
  )
  return rows.length
}

/** Matches in batches until none are left or `maxBatches` ran; returns how many listings were matched. */
export async function refreshAllListingSkills(
  sql: Sql,
  options: { batch: number; maxBatches: number; careerSlug?: string }
) {
  let total = 0
  for (let batch = 0; batch < options.maxBatches; batch++) {
    const matched = await refreshListingSkills(sql, { limit: options.batch, careerSlug: options.careerSlug })
    total += matched
    if (matched < options.batch) break
  }
  return total
}

// Advertised pay, lower-cased with commas removed: ringgit only ("RM" or "MYR"), a number with an optional k, an
// optional second number after a dash or "to", then the rest ("per month", "per year", "(Basic) + Bonus").
export const PAY_PATTERN = String.raw`^\s*(?:rm|myr)\s*([0-9]+(?:\.[0-9]+)?)(k?)(?:\s*(?:-|–|—|to)\s*(?:rm|myr)?\s*([0-9]+(?:\.[0-9]+)?)(k?))?(.*)$`
// The rest's first words give the period, after an optional "(Basic)": pay per year is divided by 12, pay by the
// hour, day or week is left out, and anything else is monthly, as JobStreet shows most pay. Later words, such as
// "+ annual bonus" after "per month", don't change it.
const period = (units: string) => String.raw`^\s*(\([^)]*\)\s*)?((per|an?|/)\s*)?(${units})(?![a-z])`
export const PER_YEAR = period(String.raw`year|yearly|annum|annual|annually|yr|p\.? ?a\.?`)
export const NOT_MONTHLY = period(String.raw`hour|hourly|hr|day|daily|week|weekly|p\.? ?h\.?`)

// The state or federal territory after a location's last comma: "Bayan Lepas, Penang" is Penang.
export const STATES: Record<string, string> = {
  'kuala lumpur': 'Kuala Lumpur',
  selangor: 'Selangor',
  penang: 'Penang',
  'pulau pinang': 'Penang',
  johor: 'Johor',
  perak: 'Perak',
  kedah: 'Kedah',
  kelantan: 'Kelantan',
  terengganu: 'Terengganu',
  pahang: 'Pahang',
  'negeri sembilan': 'Negeri Sembilan',
  melaka: 'Melaka',
  malacca: 'Melaka',
  perlis: 'Perlis',
  sabah: 'Sabah',
  sarawak: 'Sarawak',
  putrajaya: 'Putrajaya',
  labuan: 'Labuan',
  // JobStreet's own area names, which carry no state.
  'klang/port klang': 'Selangor',
  'kajang/bangi/serdang': 'Selangor',
  'shah alam/subang': 'Selangor'
}

type MarketRow = {
  onet_code: string
  search_titles: string[]
  reviewed: number
  active: number | null
  employers: number | null
  remote: number | null
  hybrid: number | null
  without_state: number | null
  skills_checked: number | null
  highlights_checked: number | null
  ai_ads: number | null
  estimated_ads: number | null
  estimate_title: string | null
  estimate_search_ads: number | null
  estimate_decided: number | null
  estimate_approved: number | null
  estimate_rank: number | null
  ranked_roles: number | null
  ads_with_pay: number | null
  pay_p25: number | null
  pay_median: number | null
  pay_p75: number | null
  regions: Array<{ name: string; ads: number }> | null
  work_types: Array<{ name: string; ads: number }> | null
  skills: Record<string, number> | null
  weekly: Array<{ week: string; ads: number }> | null
  first_seen: string
  vintage_date: string
}

/** The job-ad market for each code that has approved ads; codes without any are left out. */
export async function readJobMarkets(sql: Sql, codes: string[]): Promise<JobMarket[]> {
  if (!codes.length) return []
  const rows = (await sql.query(
    `WITH reviewed AS (
       SELECT review.onet_code, listing.job_id, listing.career_slug, career.title AS search_title,
         listing.latest_payload AS payload, listing.latest_seen_at
       FROM jobstreet_listing_reviews review
       JOIN jobstreet_careers career
         ON career.slug = review.career_slug AND career.onet_code = review.onet_code AND NOT career.hidden
       JOIN jobstreet_listings listing ON listing.job_id = review.job_id AND listing.career_slug = review.career_slug
       WHERE review.approved AND review.onet_code = ANY($1::text[])
     ),
     ads AS (
       -- One row per ad and occupation, from its newest sighting when two search titles found it.
       SELECT DISTINCT ON (onet_code, job_id) onet_code, job_id, career_slug, payload, latest_seen_at
       FROM reviewed ORDER BY onet_code, job_id, latest_seen_at DESC
     ),
     latest AS (SELECT onet_code, max(latest_seen_at) AS seen_at FROM ads GROUP BY onet_code),
     active AS (
       -- Skills matched by an older vocabulary still count until the nightly refresh matches them again.
       SELECT ads.onet_code, ads.job_id, ads.payload, matched.skills,
         ($2::jsonb)->>lower(btrim(regexp_replace(ads.payload->>'location', '^.*,', ''))) AS state,
         regexp_match(replace(lower(ads.payload->>'salary'), ',', ''), $3) AS pay_match,
         card_points.highlights <> '' AS has_highlights, matched.vocabulary_version = $10 AS current_vocabulary
       FROM ads
       ${cardHighlights('ads.payload')}
       JOIN latest USING (onet_code)
       LEFT JOIN jobstreet_listing_skills matched
         ON matched.job_id = ads.job_id AND matched.career_slug = ads.career_slug
       WHERE ads.latest_seen_at >= latest.seen_at - make_interval(days => $4)
     ),
     counts AS (
       SELECT onet_code, count(*)::int AS active,
         count(DISTINCT lower(btrim(payload->>'company')))::int AS employers,
         count(*) FILTER (WHERE payload->>'work_arrangement' ILIKE '%remote%')::int AS remote,
         count(*) FILTER (WHERE payload->>'work_arrangement' ILIKE '%hybrid%')::int AS hybrid,
         count(*) FILTER (WHERE state IS NULL)::int AS without_state,
         count(*) FILTER (WHERE skills IS NOT NULL)::int AS skills_checked,
         -- Benefits came in with vocabulary 2026-10-24.1, so only listings matched by the current one have them.
         count(*) FILTER (WHERE current_vocabulary AND has_highlights)::int AS highlights_checked,
         count(*) FILTER (WHERE skills && $5::text[])::int AS ai_ads
       FROM active GROUP BY onet_code
     ),
     -- How many of JobStreet's ads match each occupation. A breadth run's report keeps JobStreet's count of every ad
     -- its search finds, and the listings the run saw are a sample of them, newest first: the count times the share of
     -- that sample an admin approved under the occupation, once $9 or more of it are decided and one is approved.
     -- Each search title gives the estimate of its latest such run among its 3 latest counted runs, which keeps the
     -- observations read bounded, and an occupation takes its largest, since two searches can find the same ads. The
     -- occupations with an estimate are ranked by it: 1 has the most, and a tie shares a rank.
     counted_runs AS (
       SELECT id, career_slug, created_at, total FROM (
         SELECT run.id, run.career_slug, run.created_at, reported.total,
           row_number() OVER (PARTITION BY run.career_slug ORDER BY run.created_at DESC) AS recency
         FROM jobstreet_scrape_runs run
         CROSS JOIN LATERAL (
           SELECT coalesce(
             CASE WHEN jsonb_typeof(run.report->'reported_total_jobs_latest') = 'number'
               THEN (run.report->>'reported_total_jobs_latest')::int END,
             CASE WHEN jsonb_typeof(run.report->'reported_total_jobs_first') = 'number'
               THEN (run.report->>'reported_total_jobs_first')::int END
           ) AS total
         ) reported
         WHERE run.mode = 'breadth' AND reported.total > 0
       ) runs
       WHERE recency <= 3
     ),
     run_samples AS (
       SELECT counted.career_slug, counted.created_at, counted.total, career.onet_code, career.title,
         count(DISTINCT observation.job_id) FILTER (WHERE review.job_id IS NOT NULL)::int AS decided,
         count(DISTINCT observation.job_id) FILTER (WHERE review.approved)::int AS approved
       FROM counted_runs counted
       JOIN jobstreet_careers career
         ON career.slug = counted.career_slug AND career.onet_code IS NOT NULL AND NOT career.hidden
       JOIN jobstreet_observations observation
         ON observation.scrape_run_id = counted.id AND observation.career_slug = counted.career_slug
       LEFT JOIN jobstreet_listing_reviews review
         ON review.job_id = observation.job_id AND review.career_slug = observation.career_slug
         AND review.onet_code = career.onet_code
       GROUP BY counted.id, counted.career_slug, counted.created_at, counted.total, career.onet_code, career.title
     ),
     title_estimates AS (
       -- Rounded to 10 from 100 up; a smaller estimate is kept whole, and is at least 1 since an ad was approved.
       SELECT DISTINCT ON (career_slug) onet_code, title AS search_title, total AS search_ads, decided, approved,
         CASE WHEN total::numeric * approved / decided >= 100 THEN round(total::numeric * approved / decided, -1)
           ELSE greatest(1, round(total::numeric * approved / decided)) END::int AS estimated_ads
       FROM run_samples
       WHERE decided >= $9 AND approved > 0
       ORDER BY career_slug, created_at DESC
     ),
     ranking AS (
       SELECT best.*, rank() OVER (ORDER BY best.estimated_ads DESC)::int AS rank, count(*) OVER ()::int AS roles
       FROM (
         SELECT DISTINCT ON (onet_code) onet_code, search_title, search_ads, decided, approved, estimated_ads
         FROM title_estimates ORDER BY onet_code, estimated_ads DESC, search_title
       ) best
     ),
     monthly AS (
       SELECT onet_code, (low + high) / 2 / CASE WHEN rest ~ $6 THEN 12 ELSE 1 END AS monthly_pay
       FROM (
         SELECT onet_code,
           pay_match[1]::numeric * CASE WHEN pay_match[2] = 'k' THEN 1000 ELSE 1 END AS low,
           COALESCE(pay_match[3]::numeric * CASE WHEN pay_match[4] = 'k' THEN 1000 ELSE 1 END,
             pay_match[1]::numeric * CASE WHEN pay_match[2] = 'k' THEN 1000 ELSE 1 END) AS high,
           pay_match[5] AS rest
         FROM active WHERE pay_match IS NOT NULL
       ) parsed
       WHERE rest !~ $7
     ),
     pay_stats AS (
       SELECT onet_code, count(*)::int AS ads_with_pay,
         round(percentile_cont(0.25) WITHIN GROUP (ORDER BY monthly_pay)::numeric, -2)::int AS p25,
         round(percentile_cont(0.5) WITHIN GROUP (ORDER BY monthly_pay)::numeric, -2)::int AS median,
         round(percentile_cont(0.75) WITHIN GROUP (ORDER BY monthly_pay)::numeric, -2)::int AS p75
       FROM monthly WHERE monthly_pay BETWEEN 500 AND 100000 GROUP BY onet_code
     ),
     region_counts AS (
       SELECT onet_code, jsonb_agg(jsonb_build_object('name', state, 'ads', ads) ORDER BY ads DESC, state) AS regions
       FROM (SELECT onet_code, state, count(*)::int AS ads FROM active WHERE state IS NOT NULL GROUP BY 1, 2) by_state
       GROUP BY onet_code
     ),
     work_type_counts AS (
       SELECT onet_code, jsonb_agg(jsonb_build_object('name', work_type, 'ads', ads) ORDER BY ads DESC, work_type)
         AS work_types
       FROM (
         SELECT onet_code, payload->>'work_type' AS work_type, count(*)::int AS ads
         FROM active WHERE payload->>'work_type' IS NOT NULL GROUP BY 1, 2
       ) by_type
       GROUP BY onet_code
     ),
     skill_counts AS (
       SELECT onet_code, jsonb_object_agg(skill, ads) AS skills
       FROM (SELECT onet_code, skill, count(*)::int AS ads FROM active, unnest(skills) AS skill GROUP BY 1, 2) by_skill
       GROUP BY onet_code
     ),
     weekly_counts AS (
       SELECT onet_code, jsonb_agg(jsonb_build_object('week', week, 'ads', ads) ORDER BY week) AS weekly
       FROM (
         SELECT reviewed.onet_code,
           to_char(date_trunc('week', observation.observed_at AT TIME ZONE 'Asia/Kuala_Lumpur'), 'YYYY-MM-DD') AS week,
           count(DISTINCT reviewed.job_id)::int AS ads
         FROM reviewed
         JOIN jobstreet_observations observation
           ON observation.job_id = reviewed.job_id AND observation.career_slug = reviewed.career_slug
         -- This Malaysian week and the ones before it, whole.
         WHERE observation.observed_at >= (date_trunc('week', now() AT TIME ZONE 'Asia/Kuala_Lumpur')
           - make_interval(weeks => $8::int - 1)) AT TIME ZONE 'Asia/Kuala_Lumpur'
         GROUP BY 1, 2
       ) by_week
       GROUP BY onet_code
     ),
     summary AS (
       SELECT reviewed.onet_code,
         array_agg(DISTINCT reviewed.search_title ORDER BY reviewed.search_title) AS search_titles,
         count(DISTINCT reviewed.job_id)::int AS reviewed,
         to_char(max(reviewed.latest_seen_at) AT TIME ZONE 'Asia/Kuala_Lumpur', 'YYYY-MM-DD') AS vintage_date,
         (SELECT to_char(min(observation.observed_at) AT TIME ZONE 'Asia/Kuala_Lumpur', 'YYYY-MM-DD')
          FROM reviewed first
          JOIN jobstreet_observations observation
            ON observation.job_id = first.job_id AND observation.career_slug = first.career_slug
          WHERE first.onet_code = reviewed.onet_code) AS first_seen
       FROM reviewed GROUP BY reviewed.onet_code
     )
     SELECT summary.onet_code, summary.search_titles, summary.reviewed, summary.first_seen, summary.vintage_date,
       counts.active, counts.employers, counts.remote, counts.hybrid, counts.without_state, counts.skills_checked,
       counts.highlights_checked, counts.ai_ads, ranking.estimated_ads, ranking.search_title AS estimate_title,
       ranking.search_ads AS estimate_search_ads, ranking.decided AS estimate_decided,
       ranking.approved AS estimate_approved, ranking.rank AS estimate_rank, ranking.roles AS ranked_roles,
       pay_stats.ads_with_pay, pay_stats.p25 AS pay_p25, pay_stats.median AS pay_median, pay_stats.p75 AS pay_p75,
       region_counts.regions, work_type_counts.work_types, skill_counts.skills, weekly_counts.weekly
     FROM summary
     LEFT JOIN counts USING (onet_code)
     LEFT JOIN ranking USING (onet_code)
     LEFT JOIN pay_stats USING (onet_code)
     LEFT JOIN region_counts USING (onet_code)
     LEFT JOIN work_type_counts USING (onet_code)
     LEFT JOIN skill_counts USING (onet_code)
     LEFT JOIN weekly_counts USING (onet_code)
     ORDER BY summary.onet_code`,
    [
      codes,
      JSON.stringify(STATES),
      PAY_PATTERN,
      ACTIVE_WINDOW_DAYS,
      AI_KEYS,
      PER_YEAR,
      NOT_MONTHLY,
      WEEKS,
      MIN_ESTIMATE_SAMPLE,
      SKILL_VOCABULARY_VERSION
    ]
  )) as MarketRow[]
  return rows.map(toJobMarket)
}

function topSkills(counts: Record<string, number>, category: SkillCategory, limit: number) {
  return Object.entries(counts)
    .flatMap(([key, ads]) => {
      const term = SKILL_BY_KEY.get(key)
      return term?.category === category ? [{ key, label: term.label, ads }] : []
    })
    .sort((a, b) => b.ads - a.ads || a.label.localeCompare(b.label))
    .slice(0, limit)
}

function toJobMarket(row: MarketRow): JobMarket {
  const skillsChecked = row.skills_checked ?? 0
  const highlightsChecked = row.highlights_checked ?? 0
  const skillCounts = row.skills ?? {}
  const adsWithPay = row.ads_with_pay ?? 0
  return {
    onet_code: row.onet_code,
    search_titles: row.search_titles,
    ads: { reviewed: row.reviewed, active: row.active ?? 0, employers: row.employers ?? 0 },
    popularity:
      row.estimated_ads !== null &&
      row.estimate_title !== null &&
      row.estimate_search_ads !== null &&
      row.estimate_decided !== null &&
      row.estimate_approved !== null &&
      row.estimate_rank !== null &&
      row.ranked_roles !== null
        ? {
            estimated_ads: row.estimated_ads,
            rank: row.estimate_rank,
            roles: row.ranked_roles,
            search_title: row.estimate_title,
            search_ads: row.estimate_search_ads,
            sample_reviewed: row.estimate_decided,
            sample_approved: row.estimate_approved
          }
        : null,
    pay:
      adsWithPay >= JOB_MARKET_MIN_PAY_ADS && row.pay_median !== null && row.pay_p25 !== null && row.pay_p75 !== null
        ? { ads_with_pay: adsWithPay, median: row.pay_median, p25: row.pay_p25, p75: row.pay_p75 }
        : null,
    regions: (row.regions ?? []).slice(0, TOP_REGIONS),
    without_state: row.without_state ?? 0,
    remote: row.remote ?? 0,
    hybrid: row.hybrid ?? 0,
    work_types: row.work_types ?? [],
    skills:
      skillsChecked >= JOB_MARKET_MIN_SKILL_ADS
        ? {
            ads_checked: skillsChecked,
            ai_ads: row.ai_ads ?? 0,
            tools: topSkills(skillCounts, 'tool', TOP_TOOLS),
            languages: topSkills(skillCounts, 'language', TOP_LANGUAGES),
            ai: topSkills(skillCounts, 'ai', TOP_AI)
          }
        : null,
    benefits:
      highlightsChecked >= JOB_MARKET_MIN_SKILL_ADS
        ? { ads_checked: highlightsChecked, items: topSkills(skillCounts, 'benefit', TOP_BENEFITS) }
        : null,
    weekly: row.weekly ?? [],
    first_seen: row.first_seen,
    source: {
      source_name: 'JobStreet Malaysia job ads, reviewed by Kotak',
      source_url: 'https://my.jobstreet.com/',
      vintage_date: row.vintage_date,
      geo_or_layer: 'MYS/L3'
    }
  }
}
