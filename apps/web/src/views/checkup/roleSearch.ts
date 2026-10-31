import { normalizeTitle, type BundleRoleIndexEntry, type Occupation } from '@kotak/shared'
import type { RoleAlias } from '../../engine/api'
import { roleTitle, type LocaleIndex } from '../../i18n/content/overlay'

// The job-title search helpers the check-up start uses for the user's job and their target roles.

// The three roles the team hand-checks (#104) plus Software Developers, offered when nothing matches.
const suggestedCodes = ['15-1254.00', '15-1255.00', '43-3031.00', '15-1252.00']
const suggestedTitles: Record<string, string> = {
  '15-1252.00': 'Software Engineer'
}
export const maxSuggestions = 8
// Approved market titles shown above the O*NET titles, so they never crowd the occupations out.
const maxAliasSuggestions = 3

export function normalizeJobQuery(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function getRoleDisplayTitle(role: Pick<Occupation, 'onet_code' | 'title'>) {
  return suggestedTitles[role.onet_code] ?? role.title
}

export function getRoleCodeLine(role: Pick<Occupation, 'onet_code' | 'title'>) {
  const customTitle = suggestedTitles[role.onet_code]
  return customTitle ? `O*NET ${role.onet_code} · ${role.title}` : `O*NET ${role.onet_code}`
}

export function getSuggestedRoles(roles: BundleRoleIndexEntry[]) {
  return suggestedCodes.flatMap((code) => {
    const role = roles.find((item) => item.onet_code === code)
    return role ? [role] : []
  })
}

function matchesQuery(role: BundleRoleIndexEntry, query: string, index: LocaleIndex | null) {
  return (
    role.title.toLocaleLowerCase().includes(query) ||
    getRoleDisplayTitle(role).toLocaleLowerCase().includes(query) ||
    roleTitle(index, role.onet_code, role.title).toLocaleLowerCase().includes(query)
  )
}

// One row of the job-title suggestions: an O*NET occupation, or a market title an admin approved for one.
export type RoleSuggestion = { key: string; role: BundleRoleIndexEntry; label: string; codeLine: string }

function roleSuggestion(role: BundleRoleIndexEntry, index: LocaleIndex | null): RoleSuggestion {
  return {
    key: role.onet_code,
    role,
    label: roleTitle(index, role.onet_code, getRoleDisplayTitle(role)),
    codeLine: getRoleCodeLine(role)
  }
}

// Up to three approved market titles that contain the query (normalised with normalizeJobQuery), for occupations in
// the role index, the exact title first. A title that repeats its occupation's own title, plural or not, shows as
// that occupation instead.
function aliasSuggestions(
  aliases: RoleAlias[],
  roles: BundleRoleIndexEntry[],
  query: string,
  index: LocaleIndex | null
): RoleSuggestion[] {
  if (!aliases.length) return []
  const byCode = new Map(roles.map((role) => [role.onet_code, role]))
  const matches = aliases.flatMap((alias) => {
    const role = byCode.get(alias.onet_code)
    const aliasKey = normalizeJobQuery(alias.title)
    if (!role || !aliasKey.includes(query)) return []
    const title = normalizeTitle(alias.title)
    const suggestion =
      title === normalizeTitle(role.title) || title === normalizeTitle(getRoleDisplayTitle(role))
        ? roleSuggestion(role, index)
        : { key: `alias:${alias.title}`, role, label: alias.title, codeLine: `O*NET ${role.onet_code} · ${role.title}` }
    return [{ suggestion, exact: aliasKey === query }]
  })
  return matches
    .sort((a, b) => Number(b.exact) - Number(a.exact))
    .slice(0, maxAliasSuggestions)
    .map((match) => match.suggestion)
}

/** Market titles first, then O*NET occupations, each occupation once; nothing for an empty query. `index` only widens
 * the match and the label: it is the language on show's titles, null in English. */
export function searchRoles(
  roles: BundleRoleIndexEntry[],
  aliases: RoleAlias[],
  query: string,
  index: LocaleIndex | null = null
): RoleSuggestion[] {
  if (!query) return []
  const seen = new Set<string>()
  return [
    ...aliasSuggestions(aliases, roles, query, index),
    ...roles.filter((role) => matchesQuery(role, query, index)).map((role) => roleSuggestion(role, index))
  ]
    .filter((suggestion) => !seen.has(suggestion.key) && seen.add(suggestion.key))
    .slice(0, maxSuggestions)
}

/** True when the query is a role's own title, its title in the language on show, or an approved market title, so no
 * remote match is needed. */
export function hasExactMatch(
  roles: BundleRoleIndexEntry[],
  aliases: RoleAlias[],
  query: string,
  index: LocaleIndex | null = null
) {
  return (
    query.length > 0 &&
    (roles.some(
      (role) =>
        normalizeJobQuery(role.title) === query ||
        normalizeJobQuery(getRoleDisplayTitle(role)) === query ||
        normalizeJobQuery(roleTitle(index, role.onet_code, role.title)) === query
    ) ||
      aliases.some(
        (alias) => normalizeJobQuery(alias.title) === query && roles.some((role) => role.onet_code === alias.onet_code)
      ))
  )
}

/** Roles whose title starts with a word of the query, best fit first, for "No match yet". */
export function closestRoles(roles: BundleRoleIndexEntry[], query: string, index: LocaleIndex | null = null) {
  const words = query.split(/\s+/).filter((word) => word.length >= 3)

  return roles
    .map((role) => {
      const titles = `${role.title} ${getRoleDisplayTitle(role)} ${roleTitle(index, role.onet_code, role.title)}`
      const titleWords = titles.toLocaleLowerCase().split(/[^a-z0-9]+/)
      const score = words.reduce(
        (total, word) => total + (titleWords.some((titleWord) => titleWord.startsWith(word)) ? 1 : 0),
        0
      )
      return { role, score }
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score || left.role.title.length - right.role.title.length)
    .slice(0, 3)
    .map((match) => match.role)
}

// Titles that describe a situation rather than a job: the situation question covers them.
const SITUATION_WORDS =
  /\b(graduate|grad|student|undergrad|unemployed|jobless|intern|fresh ?grad|lepasan|pelajar|siswazah|menganggur)\b/i

/** True when the typed title names a situation, like "law graduate" or "unemployed", rather than a job. */
export const looksLikeSituation = (query: string) => SITUATION_WORDS.test(query)
