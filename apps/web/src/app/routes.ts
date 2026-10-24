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
  connect: '/app/connect',
  settings: '/app/settings',
  adminSignIn: '/admin/sign-in',
  adminScraping: '/admin/scraping'
} as const

/** The page for one job, by O*NET code. */
export const jobPath = (onetCode: string) => `${routes.jobs}/${encodeURIComponent(onetCode)}`
