export const JOBSTREET_CAREERS = [
  {
    slug: 'software-engineer',
    title: 'Software Engineer',
    searchUrl: 'https://my.jobstreet.com/software-engineer-jobs'
  },
  {
    slug: 'front-end-developer',
    title: 'Front-End Developer',
    searchUrl: 'https://my.jobstreet.com/front-end-developer-jobs'
  },
  {
    slug: 'design-systems-developer',
    title: 'Design Systems Developer',
    searchUrl: 'https://my.jobstreet.com/design-systems-developer-jobs'
  },
  {
    slug: 'accessibility-engineer',
    title: 'Accessibility Engineer',
    searchUrl: 'https://my.jobstreet.com/accessibility-engineer-jobs'
  }
] as const

export type JobstreetCareer = (typeof JOBSTREET_CAREERS)[number]
export type JobstreetCareerSlug = JobstreetCareer['slug']

export function careerForSearchUrl(value: string): JobstreetCareer {
  const path = new URL(value).pathname.toLowerCase().replace(/\/$/, '')
  const career = JOBSTREET_CAREERS.find((candidate) => new URL(candidate.searchUrl).pathname === path)
  if (!career) throw new Error(`No configured JobStreet career matches search URL: ${value}`)
  return career
}
