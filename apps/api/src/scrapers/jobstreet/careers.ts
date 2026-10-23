import { searchTitleSlug } from '@kotak/shared'
import { searchUrl } from './records'

// Search titles are checked by parseCareerTitle in @kotak/shared, which the admin page also uses.
export { parseCareerTitle } from '@kotak/shared'

// A search title is a row in jobstreet_careers. Its slug fixes the only page the runner may search:
// https://my.jobstreet.com/<slug>-jobs. The seeded titles live in db/migrations/0002_jobstreet.sql.
export interface JobstreetCareer {
  slug: string
  title: string
  searchUrl: string
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_SLUG_LENGTH = 80

export function isCareerSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(value)
}

export function careerSearchUrl(slug: string): string {
  if (!isCareerSlug(slug)) throw new Error('Invalid JobStreet career slug')
  return `https://my.jobstreet.com/${slug}-jobs`
}

/** The career slug of a JobStreet search page URL, such as a listing's search_url with ?page=2. */
export function slugForSearchUrl(value: string): string {
  const path = new URL(searchUrl(value)).pathname.replace(/\/$/, '')
  const slug = /^\/(.+)-jobs$/.exec(path)?.[1]
  if (!slug || !isCareerSlug(slug)) throw new Error(`Not a JobStreet career search URL: ${value}`)
  return slug
}

/** The slug JobStreet's keyword search uses for a title, checked: "UI/UX Designer" becomes ui-ux-designer. */
export function slugForTitle(title: string): string {
  const slug = searchTitleSlug(title)
  if (!isCareerSlug(slug)) throw new Error('The title does not make a valid JobStreet search')
  return slug
}

/** A career row from the database, checked so a changed row cannot point the runner at another page. */
export function careerFromRow(row: unknown): JobstreetCareer {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Invalid JobStreet career')
  const { slug, title, search_url: url } = row as Record<string, unknown>
  if (!isCareerSlug(slug)) throw new Error('Invalid JobStreet career slug')
  if (typeof title !== 'string' || !title.trim()) throw new Error('Invalid JobStreet career title')
  if (url !== careerSearchUrl(slug)) throw new Error(`JobStreet career ${slug} has an unexpected search URL`)
  return { slug, title, searchUrl: url }
}
