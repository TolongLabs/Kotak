export interface JobListing {
  source: 'jobstreet'
  job_id: string
  url: string
  title: string
  company: string | null
  location: string | null
  salary: string | null
  work_type: string | null
  work_arrangement: string | null
  listed_at_label: string | null
  listed_at_estimate: string | null
  summary: string | null
  listing_text: string
  search_url: string
  scraped_at: string
  scrape_run_id: string | null
}

export const sortModes = ['newest', 'title', 'company', 'location', 'job-id', 'scraped-at'] as const
export type SortMode = (typeof sortModes)[number]

export function utcTimestamp(value: string, field: string): string {
  const timestamp = new Date(value)
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) ||
    !Number.isFinite(timestamp.getTime()) ||
    timestamp.toISOString().replace('.000Z', 'Z') !== value.replace('.000Z', 'Z')
  ) {
    throw new Error(`${field} must be a valid UTC ISO timestamp`)
  }
  return timestamp.toISOString()
}

export function parseSort(value: string): SortMode {
  if (!sortModes.includes(value as SortMode)) throw new Error(`--sort must be one of: ${sortModes.join(', ')}`)
  return value as SortMode
}

export function searchUrl(input: string): string {
  const url = new URL(input)
  if (url.protocol !== 'https:' || url.hostname !== 'my.jobstreet.com' || url.port || url.username || url.password) {
    throw new Error('Use an HTTPS search URL on my.jobstreet.com')
  }
  if (!/\/[^/]*jobs(?:\/|$)/.test(url.pathname)) {
    throw new Error('Expected a JobStreet search listing, for example https://my.jobstreet.com/software-engineer-jobs')
  }
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (key === 'tracking' || key.startsWith('utm_') || key.startsWith('__cf_chl_')) url.searchParams.delete(key)
  }
  url.searchParams.sort()
  return url.href
}

export function jobUrl(input: string, expectedId?: string): string {
  const url = new URL(input)
  const id = url.pathname.match(/^\/job\/(\d+)\/?$/)?.[1]
  if (
    url.protocol !== 'https:' ||
    url.host !== 'my.jobstreet.com' ||
    url.username ||
    url.password ||
    !id ||
    (expectedId !== undefined && id !== expectedId)
  ) {
    throw new Error('Job URL must match its JobStreet job_id')
  }
  return `https://my.jobstreet.com/job/${id}`
}

export function nextSearchUrl(current: string, href: string): string {
  const before = new URL(searchUrl(current))
  const after = new URL(searchUrl(new URL(href, before).href))
  const page = (url: URL) => {
    if (url.searchParams.getAll('page').length > 1) throw new Error('Ambiguous pagination page parameter')
    const raw = url.searchParams.get('page') ?? '1'
    const number = Number(raw)
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(number) || number < 1)
      throw new Error('Invalid pagination page number')
    return number
  }
  if (page(after) !== page(before) + 1) throw new Error('Next link must advance exactly one page')
  const target = after.href
  for (const url of [before, after]) {
    url.searchParams.delete('page')
    url.pathname = url.pathname.replace(/\/+$/, '')
  }
  if (before.href !== after.href) throw new Error('Pagination would change the search query or filters')
  return target
}

// These are estimates from the site's relative labels, never exact posting dates.
function estimateListedAt(label: string | null, observedAt: string): string | null {
  const match = label?.match(/^(\d+)\s*(m|min|minute|h|hr|hour|d|day|w|week)s?\s+ago$/i)
  if (!match) return null
  const unit = match[2][0].toLowerCase()
  const seconds = { m: 60, h: 3600, d: 86400, w: 604800 }[unit]!
  const time = Date.parse(observedAt) - Number(match[1]) * seconds * 1000
  return Number.isFinite(time) && time >= 0 ? new Date(time).toISOString() : null
}

export function parseListing(input: unknown): JobListing {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected a job object')
  const row = input as Record<string, unknown>
  const text = (key: string, required = false): string | null => {
    const value = row[key]
    if (value != null && typeof value !== 'string') throw new Error(`${key} must be text or null`)
    const result = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() || null : null
    if (required && !result) throw new Error(`${key} is required`)
    return result
  }
  if (row.source !== 'jobstreet') throw new Error('source must be jobstreet')
  const id = text('job_id', true)!
  if (!/^\d+$/.test(id)) throw new Error('job_id must contain only digits')
  const url = jobUrl(text('url', true)!, id)
  const observedAt = utcTimestamp(text('scraped_at', true)!, 'scraped_at')
  const label = text('listed_at_label')
  return {
    source: 'jobstreet',
    job_id: id,
    url,
    title: text('title', true)!,
    company: text('company'),
    location: text('location'),
    salary: text('salary'),
    work_type: text('work_type'),
    work_arrangement: text('work_arrangement'),
    listed_at_label: label,
    listed_at_estimate: estimateListedAt(label, observedAt),
    summary: text('summary'),
    listing_text: text('listing_text', true)!,
    search_url: searchUrl(text('search_url', true)!),
    scraped_at: observedAt,
    scrape_run_id: text('scrape_run_id')
  }
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const compareId = (a: JobListing, b: JobListing) => a.job_id.length - b.job_id.length || compare(a.job_id, b.job_id)

export function sortListings(jobs: Iterable<JobListing>, mode: SortMode): JobListing[] {
  return [...jobs].sort((a, b) => {
    let order = 0
    if (mode === 'newest' || mode === 'scraped-at') {
      const key = mode === 'newest' ? 'listed_at_estimate' : 'scraped_at'
      // Missing dates go last. Job ID breaks ties, without assuming IDs encode dates.
      order = a[key] === null ? (b[key] === null ? 0 : 1) : b[key] === null ? -1 : compare(b[key]!, a[key]!)
    } else if (mode !== 'job-id') {
      const left = a[mode]?.normalize('NFKC').toLowerCase() ?? null
      const right = b[mode]?.normalize('NFKC').toLowerCase() ?? null
      order = left === null ? (right === null ? 0 : 1) : right === null ? -1 : compare(left, right)
    }
    return order || compareId(a, b)
  })
}

// Use one complete observation; mixing optional fields from different dates would invent a record.
export function preferObservation(previous: JobListing, next: JobListing): JobListing {
  const order = compare(previous.scraped_at, next.scraped_at) || compare(JSON.stringify(previous), JSON.stringify(next))
  return order >= 0 ? previous : next
}
