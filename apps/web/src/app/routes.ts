export const routes = {
  landing: '/',
  signIn: '/sign-in',
  home: '/app',
  checkUp: '/app/check-up',
  choose: '/app/check-up/choose',
  questions: '/app/check-up/questions',
  radar: '/app/radar',
  roles: '/app/roles',
  jobs: '/app/jobs',
  roadmap: '/app/roadmap',
  changes: '/app/changes',
  space: '/app/space',
  connect: '/app/connect',
  settings: '/app/settings',
  adminSignIn: '/admin/sign-in',
  adminScraping: '/admin/scraping'
} as const

/** The page for one job, by O*NET code. */
export const jobPath = (onetCode: string) => `${routes.jobs}/${encodeURIComponent(onetCode)}`

/** The 3D space, opening on one job (its card pinned) when given its O*NET code; Look Around needs no answers. */
export function spacePath(onetCode?: string, lookAround = false) {
  const params = new URLSearchParams()
  if (lookAround) params.set('view', 'look-around')
  if (onetCode) params.set('job', onetCode)
  const query = params.toString()
  return query ? `${routes.space}?${query}` : routes.space
}

/** The sign-in `next` target, only when the browser resolves it to a path inside /app on this origin. */
export function appNext(next: string | null) {
  if (next === null || !URL.canParse(next, window.location.origin)) return null
  const url = new URL(next, window.location.origin)
  const inApp = url.pathname === routes.home || url.pathname.startsWith(`${routes.home}/`)
  return url.origin === window.location.origin && inApp ? url.pathname + url.search + url.hash : null
}
