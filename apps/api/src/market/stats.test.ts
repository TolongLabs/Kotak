import { afterAll, beforeAll, beforeEach, expect, test } from 'bun:test'
import { jobMarketLevelForYears } from '@kotak/shared'
import type { PGlite } from '@electric-sql/pglite'
import { migratedDatabase, routeNeonTo, TEST_DATABASE_URL } from '../../db/test-database'
import { jobstreetDatabase } from '../scrapers/jobstreet/database'
import { adLevel, cardHighlights, readJobMarkets, refreshAllListingSkills } from './stats'

// The job-ad market's selling points, benefits and ranking, sent by the Neon driver to a Postgres built by the repo's
// own migrations (PGlite, in memory).

let db: PGlite
let restoreNeon: () => void
const sql = jobstreetDatabase(TEST_DATABASE_URL)

beforeAll(async () => {
  db = await migratedDatabase()
  restoreNeon = routeNeonTo(db)
}, 30_000)

afterAll(async () => {
  restoreNeon()
  await db.close()
})

beforeEach(() => db.exec('TRUNCATE jobstreet_careers CASCADE'))

type Ad = {
  title?: string
  location?: string
  arrangement?: string | null
  salary?: string | null
  points?: string
  summary?: string
}

// A payload as the scraper saves it, with the card text laid out as JobStreet's card reads.
function payload(jobId: string, ad: Ad = {}) {
  const {
    title = 'Web Developer',
    location = 'Petaling Jaya, Selangor',
    arrangement = null,
    salary = null,
    points = '',
    summary = 'Build and look after our web apps.'
  } = ad
  const pay = salary ? ` ${salary}` : ''
  return {
    job_id: jobId,
    title,
    company: 'Contoh Sdn Bhd',
    location,
    salary,
    summary,
    work_type: 'Full time',
    work_arrangement: arrangement,
    listing_text:
      `Listed one day ago ${title} at Contoh Sdn Bhd This is a Full time job ${location}${arrangement ?? ''}${pay} ${points} ${summary} subClassification: Developers/Programmers classification: Information & Communication Technology 1d ago`.replace(
        /  +/g,
        ' '
      )
  }
}

const highlightsOf = async (value: unknown) =>
  (
    await db.query<{ highlights: string | null }>(
      `SELECT card_points.highlights FROM (SELECT $1::jsonb AS latest_payload) listing
       ${cardHighlights('listing.latest_payload')}`,
      [JSON.stringify(value)]
    )
  ).rows[0].highlights

test("a card's selling points are what lies between its location, arrangement and pay, and its summary", async () => {
  expect(
    await highlightsOf(
      payload('1', {
        location: 'Kuala Lumpur',
        arrangement: '(Remote)',
        salary: 'RM 6,000 – RM 8,000 per month',
        points: 'Medical Benefit Free Parking Flexible Hours'
      })
    )
  ).toBe('Medical Benefit Free Parking Flexible Hours')
  expect(await highlightsOf(payload('2', { points: 'Annual Bonus' }))).toBe('Annual Bonus')
  // A card without selling points, and one whose summary also starts the card, have none.
  expect(await highlightsOf(payload('3'))).toBe('')
  expect(await highlightsOf(payload('4', { title: 'Developer', summary: 'Developer' }))).toBe('')
  // A card laid out otherwise is left unread.
  expect(await highlightsOf({ ...payload('5'), summary: null })).toBeNull()
  expect(await highlightsOf({ ...payload('6'), listing_text: 'Something else entirely' })).toBeNull()
})

const addCareer = (slug: string, onet: string, hidden = false) =>
  db.query(
    `INSERT INTO jobstreet_careers (slug, title, search_url, enabled, daily_refresh, hidden, onet_code)
     VALUES ($1, $1, 'https://my.jobstreet.com/' || $1 || '-jobs', true, false, $2, $3)`,
    [slug, hidden, onet]
  )

// A breadth run of the search title whose report gives JobStreet's count of the search's ads (`total`), with
// `approved` listings approved and `excluded` excluded under the occupation; ad(i) describes each listing.
async function addRun(
  slug: string,
  onet: string,
  options: {
    id: string
    total?: number
    approved: number
    excluded?: number
    createdAt?: string
    ad?: (index: number) => Ad
    // A depth run's description for each listing, if any.
    description?: (index: number) => string | null
  }
) {
  const {
    id,
    total,
    approved,
    excluded = 0,
    createdAt = '2026-10-22T00:00:00Z',
    ad = () => ({}),
    description = () => null
  } = options
  await db.query(
    `INSERT INTO jobstreet_scrape_runs (id, career_slug, mode, status, source, created_at, report)
     VALUES ($1, $2, 'breadth', 'success', 'manual', $3, $4::jsonb)`,
    [id, slug, createdAt, JSON.stringify(total === undefined ? {} : { reported_total_jobs_latest: total })]
  )
  for (let index = 0; index < approved + excluded; index++) {
    const jobId = `${id}-${index}`
    const value = JSON.stringify(payload(jobId, ad(index)))
    const text = description(index)
    await db.query(
      `INSERT INTO jobstreet_listings (job_id, career_slug, latest_payload, latest_seen_at, latest_detail)
       VALUES ($1, $2, $3::jsonb, now(), $4::jsonb)`,
      [jobId, slug, value, text === null ? null : JSON.stringify({ description_text: text })]
    )
    await db.query(
      `INSERT INTO jobstreet_observations (job_id, career_slug, scrape_run_id, observed_at, payload)
       VALUES ($1, $2, $3, now(), $4::jsonb)`,
      [jobId, slug, id, value]
    )
    await db.query(
      `INSERT INTO jobstreet_listing_reviews (job_id, career_slug, approved, onet_code, scrape_run_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [jobId, slug, index < approved, onet, id]
    )
  }
}

test('benefits count only the selling points', async () => {
  await addCareer('web-developer', '15-1254.00')
  await addCareer('ux-designer', '15-1255.00')
  // 10 of the 12 approved web ads list selling points. The other two name medical work and a bonus in their
  // summaries, which are no benefits.
  await addRun('web-developer', '15-1254.00', {
    id: 'run-web',
    approved: 12,
    ad: (index) =>
      index < 10
        ? { points: index < 6 ? 'Medical Benefits Free Parking Flexi Hours' : 'Annual Bonus Training & Development' }
        : { summary: 'Build medical record software and earn a sales bonus.' }
  })
  await addRun('ux-designer', '15-1255.00', { id: 'run-ux', approved: 3, ad: () => ({ points: 'Medical Benefits' }) })

  await refreshAllListingSkills(sql, { batch: 100, maxBatches: 5 })
  const [web, ux] = await readJobMarkets(sql, ['15-1254.00', '15-1255.00'])
  expect(web.benefits).toEqual({
    ads_checked: 10,
    items: [
      { key: 'flexible_hours', label: 'Flexible Hours', ads: 6 },
      { key: 'medical', label: 'Medical Cover', ads: 6 },
      { key: 'parking_transport', label: 'Parking and Transport', ads: 6 },
      { key: 'bonus', label: 'Bonuses', ads: 4 },
      { key: 'training', label: 'Training and Courses', ads: 4 }
    ]
  })
  // Under 10 checked ads with selling points there are no benefit shares.
  expect(ux.benefits).toBeNull()

  // Listings still matched by a vocabulary from before benefits have none, so they are not counted as checked.
  await db.exec("UPDATE jobstreet_listing_skills SET vocabulary_version = '2026-10-23.2'")
  const [stale] = await readJobMarkets(sql, ['15-1254.00'])
  expect(stale.benefits).toBeNull()
  expect(stale.skills?.ads_checked).toBe(12)
})

test("JobStreet's count times the approved share estimates a role's ads, and roles rank by it", async () => {
  await addCareer('web-developer', '15-1254.00')
  await addCareer('data-analyst', '15-2051.00')
  await addCareer('ux-designer', '15-1255.00')
  await addCareer('hidden-title', '15-2051.01', true)
  await addCareer('chef', '35-1011.00')
  await addCareer('copywriter', '27-3043.00')
  // 12 of 20 reviewed web ads match; JobStreet lists 1,000 for the search.
  await addRun('web-developer', '15-1254.00', { id: 'run-web', total: 1000, approved: 12, excluded: 8 })
  // 5 of 20 of 3,962: 990.5, rounded to 10.
  await addRun('data-analyst', '15-2051.00', { id: 'run-data', total: 3962, approved: 5, excluded: 15 })
  // Under 20 reviewed listings, and a run without JobStreet's count, give no estimate.
  await addRun('ux-designer', '15-1255.00', { id: 'run-ux', total: 500, approved: 3, excluded: 2 })
  await addRun('ux-designer', '15-1255.00', { id: 'run-ux-uncounted', approved: 30, createdAt: '2026-10-23T00:00:00Z' })
  // A hidden search title counts nowhere, not even in the ranking.
  await addRun('hidden-title', '15-2051.01', { id: 'run-hidden', total: 9000, approved: 20 })
  // An estimate under 100 is kept whole: 2 of 20 of 40 is 4.
  await addRun('copywriter', '27-3043.00', { id: 'run-copy', total: 40, approved: 2, excluded: 18 })
  // A sample with nothing approved gives no estimate, and its role is not ranked.
  await addRun('chef', '35-1011.00', { id: 'run-chef', total: 5000, approved: 0, excluded: 20 })

  const markets = new Map(
    (
      await readJobMarkets(sql, ['15-1254.00', '15-2051.00', '15-1255.00', '15-2051.01', '35-1011.00', '27-3043.00'])
    ).map((market) => [market.onet_code, market.popularity])
  )
  expect([...markets.keys()]).toEqual(['15-1254.00', '15-1255.00', '15-2051.00', '27-3043.00'])
  expect(markets.get('15-2051.00')).toEqual({
    estimated_ads: 990,
    rank: 1,
    roles: 3,
    search_title: 'data-analyst',
    search_ads: 3962,
    sample_reviewed: 20,
    sample_approved: 5
  })
  expect(markets.get('15-1254.00')).toMatchObject({ estimated_ads: 600, rank: 2, roles: 3 })
  expect(markets.get('27-3043.00')).toMatchObject({ estimated_ads: 4, rank: 3, roles: 3 })
  expect(markets.get('15-1255.00')).toBeNull()
})

test("a search title's latest run gives its estimate, an occupation takes its largest, and a tie shares a rank", async () => {
  await addCareer('front-end-developer', '15-1254.00')
  await addCareer('web-developer', '15-1254.00')
  await addCareer('ux-designer', '15-1255.00')
  // front-end-developer's older run would give 1,000; its latest gives 200.
  await addRun('front-end-developer', '15-1254.00', {
    id: 'run-front-old',
    total: 2000,
    approved: 10,
    excluded: 10,
    createdAt: '2026-10-21T00:00:00Z'
  })
  await addRun('front-end-developer', '15-1254.00', { id: 'run-front-new', total: 400, approved: 10, excluded: 10 })
  await addRun('web-developer', '15-1254.00', { id: 'run-web', total: 800, approved: 10, excluded: 10 })
  await addRun('ux-designer', '15-1255.00', { id: 'run-ux', total: 400, approved: 20 })

  const [web, ux] = await readJobMarkets(sql, ['15-1254.00', '15-1255.00'])
  expect(web.popularity).toMatchObject({ estimated_ads: 400, search_title: 'web-developer', rank: 1, roles: 2 })
  expect(ux.popularity).toMatchObject({ estimated_ads: 400, rank: 1, roles: 2 })
})

const levelOf = async (title: string, description: string | null, summary = 'Build and look after our web apps.') =>
  (
    await db.query<{ level: string | null }>(
      `SELECT ad_level.level FROM (SELECT $1::jsonb AS latest_payload, $2::text AS description) listing
       ${adLevel('listing.latest_payload', 'listing.description')}`,
      [JSON.stringify(payload('1', { title, summary })), description]
    )
  ).rows[0].level

test('the level an ad asks for comes from the experience it states, then its title', async () => {
  expect(await levelOf('Developer', 'Requirements: minimum 3 years of working experience in PHP.')).toBe('mid')
  expect(await levelOf('Developer', 'You have 5+ years experience with Java.')).toBe('senior')
  expect(await levelOf('Developer', 'At least 1 year of relevant experience.')).toBe('junior')
  expect(await levelOf('Developer', 'Candidates need 2-4 years’ experience in React.')).toBe('mid')
  expect(await levelOf('Developer', 'Experience: at least 6 years in banking systems.')).toBe('senior')
  expect(await levelOf('Developer', 'Fresh graduates are welcome to apply.')).toBe('junior')
  // The card's summary counts too.
  expect(await levelOf('Developer', null, 'Seeking a developer with 3+ years’ exp in Cocos Creator.')).toBe('mid')
  // A number not about experience is no requirement.
  expect(await levelOf('Developer', 'We have served clients for 20 years in Malaysia.')).toBeNull()
  // Without a stated experience, the title decides; a stated experience beats the title.
  expect(await levelOf('Senior Developer', null)).toBe('senior')
  expect(await levelOf('Junior Developer', null)).toBe('junior')
  expect(await levelOf('Developer', null)).toBeNull()
  expect(await levelOf('Senior Developer', 'Minimum 2 years of experience.')).toBe('mid')
  // A range after "experience" gives its first number, and the least named experience counts.
  expect(await levelOf('Developer', 'Experience: 1-2 years.')).toBe('junior')
  expect(await levelOf('Developer', 'Experience required: 1 to 3 years')).toBe('junior')
  expect(await levelOf('Developer', 'Working experience of 3 to 5 years')).toBe('mid')
  expect(await levelOf('Developer', 'Experience: 2 years minimum, 5 years preferred')).toBe('mid')
  expect(await levelOf('Developer', 'You bring 10+ yrs experience in banking.')).toBe('senior')
  // Company history is not a requirement.
  expect(
    await levelOf(
      'Developer',
      'With over 20 years of experience in the industry, Contoh is growing. Requirements: 2 years experience in PHP.'
    )
  ).toBe('mid')
  // "Staff" and "lead" alone don't make a title senior.
  expect(await levelOf('Admin Staff', null)).toBeNull()
  expect(await levelOf('Staff Nurse', null)).toBeNull()
  expect(await levelOf('Lead Generation Executive', null)).toBeNull()
  expect(await levelOf('Team Lead, Payments', null)).toBe('senior')
  expect(await levelOf('Lead Engineer', null)).toBe('senior')
})

test('pay splits by level, and a level with under 5 ads stating pay gets no figure', async () => {
  await addCareer('web-developer', '15-1254.00')
  // 6 junior ads at RM 4,000, 5 senior at RM 9,000, 3 mid at RM 6,000 and 2 that state no level at RM 6,500.
  const plan = [
    ...Array(6).fill(['Junior Web Developer', 'RM 4,000 per month', null]),
    ...Array(5).fill(['Web Developer', 'RM 9,000 per month', 'At least 7 years of experience.']),
    ...Array(3).fill(['Web Developer', 'RM 6,000 per month', 'Minimum 3 years experience.']),
    ...Array(2).fill(['Web Developer', 'RM 6,500 per month', null])
  ] as Array<[string, string, string | null]>
  await addRun('web-developer', '15-1254.00', {
    id: 'run-web',
    approved: plan.length,
    ad: (index) => ({ title: plan[index][0], salary: plan[index][1] }),
    description: (index) => plan[index][2]
  })
  const [web] = await readJobMarkets(sql, ['15-1254.00'])
  expect(web.levels).toEqual({
    ads: { junior: 6, mid: 3, senior: 5, not_stated: 2 },
    pay: [
      { level: 'junior', ads_with_pay: 6, median: 4000, p25: 4000, p75: 4000 },
      { level: 'senior', ads_with_pay: 5, median: 9000, p25: 9000, p75: 9000 }
    ]
  })
  // The overall figure still covers every ad.
  expect(web.pay?.ads_with_pay).toBe(16)
})

test("the intake's years of work pick the pay level", () => {
  expect([null, 0, 1, 2, 4, 5, 6, 10].map(jobMarketLevelForYears)).toEqual([
    null,
    'junior',
    'junior',
    'mid',
    'mid',
    'senior',
    'senior',
    'senior'
  ])
})

test('only ads approved under the title’s current occupation, from titles not hidden, count', async () => {
  await addCareer('web-developer', '15-1254.00')
  await addCareer('hidden-title', '15-1254.00', true)
  // 5 approved at RM 5,000; 3 excluded at RM 9,000, which must not count.
  await addRun('web-developer', '15-1254.00', {
    id: 'run-web',
    approved: 5,
    excluded: 3,
    ad: (index) => ({ salary: index < 5 ? 'RM 5,000 per month' : 'RM 9,000 per month' })
  })
  // An ad approved while the title had another occupation.
  await addRun('web-developer', '15-1255.00', {
    id: 'run-old',
    approved: 1,
    ad: () => ({ salary: 'RM 9,000 per month' })
  })
  // A hidden title's approved ads.
  await addRun('hidden-title', '15-1254.00', {
    id: 'run-hidden',
    approved: 5,
    ad: () => ({ salary: 'RM 1,000 per month' })
  })
  const [web] = await readJobMarkets(sql, ['15-1254.00'])
  expect(web.ads).toEqual({ reviewed: 5, active: 5, employers: 1 })
  expect(web.pay).toEqual({ ads_with_pay: 5, median: 5000, p25: 5000, p75: 5000 })
  expect(web.search_titles).toEqual(['web-developer'])
})

test('pay is monthly ringgit: yearly pay is divided by 12, and other pay is left out', async () => {
  await addCareer('web-developer', '15-1254.00')
  const salaries = [
    'RM 60,000 per year', // 5,000 a month
    'MYR 5,000', // no period: monthly
    'RM 4k - RM 6k per month', // midpoint 5,000
    'RM 4,500 – RM 5,500 per month + annual bonus', // the words straight after set the period
    'RM 5,000 (Basic) per month',
    'RM 30 per hour', // hourly: left out
    'SGD 5,000 per month', // not ringgit: left out
    'RM 200 per month', // under RM 500: left out
    'Competitive salary' // no figure: left out
  ]
  await addRun('web-developer', '15-1254.00', {
    id: 'run-web',
    approved: salaries.length,
    ad: (index) => ({ salary: salaries[index] })
  })
  const [web] = await readJobMarkets(sql, ['15-1254.00'])
  expect(web.pay).toEqual({ ads_with_pay: 5, median: 5000, p25: 5000, p75: 5000 })
})

test('a location gives its state from the text after the last comma, or JobStreet’s area name', async () => {
  await addCareer('web-developer', '15-1254.00')
  const locations = ['Bayan Lepas, Penang', 'Petaling Jaya, Selangor', 'Shah Alam/Subang', 'Kuala Lumpur', 'Malaysia']
  await addRun('web-developer', '15-1254.00', {
    id: 'run-web',
    approved: locations.length,
    ad: (index) => ({ location: locations[index] })
  })
  const [web] = await readJobMarkets(sql, ['15-1254.00'])
  expect(web.regions).toEqual([
    { name: 'Selangor', ads: 2 },
    { name: 'Kuala Lumpur', ads: 1 },
    { name: 'Penang', ads: 1 }
  ])
  expect(web.without_state).toBe(1)
})
