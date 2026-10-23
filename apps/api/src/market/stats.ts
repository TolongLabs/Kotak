import { JOB_MARKET_MIN_PAY_ADS, JOB_MARKET_MIN_SKILL_ADS, type JobMarket } from '@kotak/shared'
import type { jobstreetDatabase } from '../scrapers/jobstreet/database'
import { SKILL_BY_KEY, SKILL_PATTERN_ROWS, SKILL_TERMS, SKILL_VOCABULARY_VERSION } from './skills'

// The job-ad market (#271): what the JobStreet ads an admin approved under an O*NET occupation say about it. Postgres
// does the matching and the sums, so the Worker, with 10 ms of CPU a request, only shapes a few rows.

type Sql = ReturnType<typeof jobstreetDatabase>

/** Ads seen this many days before an occupation's latest scrape are active. */
export const ACTIVE_WINDOW_DAYS = 14
const TOP_REGIONS = 5
const TOP_TOOLS = 8
const TOP_LANGUAGES = 4
const TOP_AI = 5
const WEEKS = 12

const AI_KEYS = SKILL_TERMS.filter((term) => term.category === 'ai').map((term) => term.key)

// The text a listing's skills are matched in: its title, summary, card text and, once a depth run fetched it, its
// description. The card text names the employer, which is taken out, so "Swift Haulage" is no Swift job. Its "Listed
// two days ago" changes every scrape, so the hash that decides whether to match again leaves the card text out.
const MATCHED_TEXT = `concat_ws(' ', listing.latest_payload->>'title', listing.latest_payload->>'summary',
  replace(listing.latest_payload->>'listing_text', coalesce(listing.latest_payload->>'company', ''), ' '),
  listing.latest_detail->>'description_text')`
const HASHED_TEXT = `md5(concat_ws(' ', listing.latest_payload->>'title', listing.latest_payload->>'summary',
  listing.latest_detail->>'description_text', $2::text))`

/**
 * Matches up to `limit` listings whose skills are missing or stale, newest first, optionally for one search title.
 * Returns how many it matched; fewer than `limit` means none are left.
 */
export async function refreshListingSkills(sql: Sql, options: { limit: number; careerSlug?: string }) {
  const rows = await sql.query(
    `WITH vocabulary AS (
       SELECT key, pattern, case_sensitive
       FROM jsonb_to_recordset($1::jsonb) AS term(key text, pattern text, case_sensitive boolean)
     ),
     pending AS MATERIALIZED (
       SELECT listing.job_id, listing.career_slug, ${MATCHED_TEXT} AS text, ${HASHED_TEXT} AS text_md5
       FROM jobstreet_listings listing
       LEFT JOIN jobstreet_listing_skills matched
         ON matched.job_id = listing.job_id AND matched.career_slug = listing.career_slug
       WHERE ($3::text IS NULL OR listing.career_slug = $3)
         AND (matched.job_id IS NULL OR matched.vocabulary_version <> $2 OR matched.text_md5 <> ${HASHED_TEXT})
       ORDER BY listing.latest_seen_at DESC
       LIMIT $4
     ),
     -- Pattern by pattern, not listing by listing: Postgres keeps only 32 compiled patterns, so going through every
     -- pattern for each listing would compile each one again for every listing, about four times slower on 1,000
     -- listings. OFFSET 0 keeps the planner from turning the order round.
     hits AS (
       SELECT hit.job_id, hit.career_slug, vocabulary.key
       FROM vocabulary
       CROSS JOIN LATERAL (
         SELECT pending.job_id, pending.career_slug FROM pending
         WHERE CASE WHEN vocabulary.case_sensitive THEN pending.text ~ vocabulary.pattern
           ELSE pending.text ~* vocabulary.pattern END
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
  ai_ads: number | null
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
         regexp_match(replace(lower(ads.payload->>'salary'), ',', ''), $3) AS pay_match
       FROM ads
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
         count(*) FILTER (WHERE skills && $5::text[])::int AS ai_ads
       FROM active GROUP BY onet_code
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
       counts.ai_ads,
       pay_stats.ads_with_pay, pay_stats.p25 AS pay_p25, pay_stats.median AS pay_median, pay_stats.p75 AS pay_p75,
       region_counts.regions, work_type_counts.work_types, skill_counts.skills, weekly_counts.weekly
     FROM summary
     LEFT JOIN counts USING (onet_code)
     LEFT JOIN pay_stats USING (onet_code)
     LEFT JOIN region_counts USING (onet_code)
     LEFT JOIN work_type_counts USING (onet_code)
     LEFT JOIN skill_counts USING (onet_code)
     LEFT JOIN weekly_counts USING (onet_code)
     ORDER BY summary.onet_code`,
    [codes, JSON.stringify(STATES), PAY_PATTERN, ACTIVE_WINDOW_DAYS, AI_KEYS, PER_YEAR, NOT_MONTHLY, WEEKS]
  )) as MarketRow[]
  return rows.map(toJobMarket)
}

function topSkills(counts: Record<string, number>, category: 'tool' | 'language' | 'ai', limit: number) {
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
  const skillCounts = row.skills ?? {}
  const adsWithPay = row.ads_with_pay ?? 0
  return {
    onet_code: row.onet_code,
    search_titles: row.search_titles,
    ads: { reviewed: row.reviewed, active: row.active ?? 0, employers: row.employers ?? 0 },
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
