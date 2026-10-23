// JobStreet search titles, shared so the admin page previews exactly what the API accepts. The API turns a title's
// slug into its one search page, https://my.jobstreet.com/<slug>-jobs (apps/api/src/scrapers/jobstreet/careers.ts).

export const MAX_SEARCH_TITLE_LENGTH = 80

// Once accents are dropped: English letters, digits, spaces and the punctuation job titles use, such as
// "UI/UX Designer" or "R&D Engineer". The slug keeps only the letters and digits, so other scripts would make no
// search, and "+" or "#" would search another title: "C++ Developer" would become c-developer.
const TITLE_CHARACTERS = /^[A-Za-z0-9 &/.,'’()-]+$/

const withoutAccents = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '')

/** A trimmed, single-spaced search title, or an error message for the admin. */
export function parseCareerTitle(value: unknown): { title: string } | { error: string } {
  if (typeof value !== 'string') return { error: 'Enter a job title.' }
  const title = value.normalize('NFKC').trim().replace(/\s+/g, ' ')
  if (title.length < 2 || title.length > MAX_SEARCH_TITLE_LENGTH)
    return { error: `Use a job title of 2 to ${MAX_SEARCH_TITLE_LENGTH} characters.` }
  // Composed accents are fine ("Café"); a mark left over, such as a strikethrough, would show in the check-up.
  if (/\p{M}/u.test(title)) return { error: 'Use plain or accented letters, without added marks.' }
  const plain = withoutAccents(title)
  if (/[+#]/.test(plain))
    return { error: 'Leave out + and #. The JobStreet search drops them, so it would search for another title.' }
  if (!TITLE_CHARACTERS.test(plain))
    return { error: "Use English letters, numbers, spaces and simple punctuation (& / . , ' ( ) -) only." }
  if (!/^[A-Za-z0-9]/.test(plain)) return { error: 'Start the title with a letter or number.' }
  if (!/[A-Za-z]/.test(plain)) return { error: 'The title needs at least one letter.' }
  return { title }
}

/** The words of a title as JobStreet's keyword search slug: "UI/UX Designer" becomes ui-ux-designer. */
export function searchTitleSlug(title: string): string {
  return withoutAccents(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
