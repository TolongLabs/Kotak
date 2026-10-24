import { EDUCATION_ORDER, type BundlePathways, type EducationLevel, type Profile, type RoleAccess } from './schemas'

// What a role asks of the user beyond skills (#284), by fixed rules over two kinds of data:
// - Malaysian regulated professions (data/pathways/regulated-professions.json), each resting on its Act and the pages
//   the row cites: the law decides who may work in them, so a study plan alone doesn't get there.
// - O*NET's Education, Training, and Experience survey: what US workers say their job needs. It is a norm, not a rule,
//   so it only ever says "usually".
// It informs and never blocks: no role is hidden or ranked lower for it. The user's answers still show how well the
// work suits them, which is what they need to decide whether the qualification is worth pursuing.

/**
 * Roles that lead others, managers and first-line supervisors, need years in the field before anyone is hired into
 * them. Other jobs aren't flagged for experience: O*NET's survey asks working incumbents, so it reports years that
 * junior posts in Malaysia often don't ask for (Software Developers report over 6).
 */
export const leadsOthers = (code: string, title: string) =>
  code.startsWith('11-') || /^First-Line Supervisors /.test(title) || /\bManagers\b/.test(title)
/** Below this many related years, a role that leads others is "Needs Experience" when O*NET gives no figure. */
const LEAD_MIN_YEARS = 2

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  secondary: 'SPM or equivalent',
  certificate: 'certificate',
  diploma: 'diploma',
  bachelor: 'bachelor’s degree',
  master: 'master’s degree',
  doctorate: 'doctorate'
}

export const ACCESS_LABELS: Record<RoleAccess['status'], string> = {
  open: 'Open to You',
  qualify: 'Qualification Needed',
  register: 'Registration Steps Left',
  check_licence: 'Licence Required',
  experience: 'Needs Experience',
  degree: 'Degree Usually Needed'
}

type Pathways = Pick<BundlePathways, 'professions' | 'occupations'>

const atLeast = (level: EducationLevel, minimum: EducationLevel) =>
  EDUCATION_ORDER.indexOf(level) >= EDUCATION_ORDER.indexOf(minimum)

/**
 * The years of work the user brings to a role that leads others. Students and new graduates bring none unless they
 * said otherwise; anyone else who didn't say is unknown, and an unknown is never flagged.
 */
export function yearsOfWork(profile: Profile): number | null {
  if (profile.years_experience !== null) return profile.years_experience
  return profile.situation === 'studying' || profile.situation === 'graduated' ? 0 : null
}

/** True when the job is the user's own, now or before a break, so its licence, experience and degree are theirs. */
const holdsJob = (code: string, profile: Profile, currentCode: string | null) =>
  currentCode === code && profile.situation !== 'studying' && profile.situation !== 'graduated'

/**
 * True when a role leads others and the user hasn't the years it needs. It ranks such roles lower in suggestions, for
 * regulated professions too; an unknown number of years is never flagged.
 */
export function lacksExperience(code: string, profile: Profile, pathways: Pathways, currentCode: string | null) {
  const prep = pathways.occupations[code]
  if (!prep || holdsJob(code, profile, currentCode) || !leadsOthers(code, prep.title)) return false
  const years = yearsOfWork(profile)
  return years !== null && years < Math.max(LEAD_MIN_YEARS, prep.experience_years ?? 0)
}

/** The fixed access rule for one role. `currentCode` is the user's current job, if any. */
export function roleAccess(code: string, profile: Profile, pathways: Pathways, currentCode: string | null): RoleAccess {
  const prep = pathways.occupations[code]
  const education = prep?.education ?? null
  const experienceYears = prep?.experience_years ?? null
  const base = { education, experience_years: experienceYears, profession: null }
  const open: RoleAccess = {
    ...base,
    status: 'open',
    label: ACCESS_LABELS.open,
    summary: 'Nothing Kotak knows of stands in the way.'
  }

  const profession = pathways.professions.find((p) => p.onet_codes.includes(code))
  if (profession) {
    const known = {
      id: profession.id,
      name: profession.name,
      body: profession.body,
      law: profession.law,
      route: profession.route,
      sources: profession.sources.map(({ url, title }) => ({ url, title }))
    }
    const law = profession.law ? ` under the ${profession.law}` : ''
    // Someone already in the profession, in this job or another of its jobs, holds its licence or registration.
    const inProfession =
      currentCode !== null &&
      profession.onet_codes.includes(currentCode) &&
      profile.situation !== 'studying' &&
      profile.situation !== 'graduated'
    if (holdsJob(code, profile, currentCode) || inProfession)
      return {
        ...open,
        profession: known,
        summary: holdsJob(code, profile, currentCode)
          ? `You already work in this profession, which Malaysian law regulates${law}.`
          : `You already work in this profession, which Malaysian law regulates${law}. A specialism can still need its own step in the route below.`
      }
    const leads = lacksExperience(code, profile, pathways, currentCode)
      ? ` It also leads others, which needs years in the field first${
          experienceYears ? `: US workers say over ${experienceYears} years (O*NET)` : ''
        }.`
      : ''
    // Entry by licence or examination, or by a degree none of Kotak's fields of study covers: Kotak can't judge it.
    if (!profession.qualifying_field_ids.length)
      return {
        ...base,
        profession: known,
        status: 'check_licence',
        label: ACCESS_LABELS.check_licence,
        summary: `${profession.name} is regulated in Malaysia${law}: working in it needs the licence or registration in the route below.${leads} Your answers show how well the work suits you.`
      }
    if (profile.field_of_study === null || profile.education_level === null)
      return {
        ...base,
        profession: known,
        status: 'check_licence',
        label: ACCESS_LABELS.check_licence,
        summary: `${profession.name} is regulated in Malaysia${law}: only people who complete the route below may work in it.${leads} Tell Kopi your study to see where you stand; your answers show how well the work suits you.`
      }
    const fieldQualifies = profession.qualifying_field_ids.includes(profile.field_of_study)
    const levelQualifies =
      profession.minimum_level === null || atLeast(profile.education_level, profession.minimum_level)
    if (fieldQualifies && levelQualifies)
      return {
        ...base,
        profession: known,
        status: 'register',
        label: ACCESS_LABELS.register,
        summary: `Your study can qualify you for this profession${law}, but the other steps in the route below still come before you work in it.${leads}`
      }
    return {
      ...base,
      profession: known,
      status: 'qualify',
      label: ACCESS_LABELS.qualify,
      summary: `${profession.name} is regulated in Malaysia${law}. Working in it needs a qualifying ${
        profession.minimum_level ? EDUCATION_LABELS[profession.minimum_level] : 'qualification'
      } and the other steps in the route below; skills alone don't get you there.${leads} Your answers show how well the work suits you, to help you decide whether that's worth pursuing.`
    }
  }

  if (holdsJob(code, profile, currentCode)) return open
  const years = yearsOfWork(profile)
  const neededYears = Math.max(LEAD_MIN_YEARS, experienceYears ?? 0)
  if (prep && leadsOthers(code, prep.title) && years !== null && years < neededYears)
    return {
      ...base,
      status: 'experience',
      label: ACCESS_LABELS.experience,
      summary: `Roles that lead others need years in the field first${
        experienceYears
          ? `: US workers in this job say over ${experienceYears} years of related experience (O*NET)`
          : ''
      }.`
    }
  if (
    education !== null &&
    atLeast(education, 'diploma') &&
    profile.education_level !== null &&
    !atLeast(profile.education_level, education)
  )
    return {
      ...base,
      status: 'degree',
      label: education === 'diploma' ? 'Diploma Usually Needed' : ACCESS_LABELS.degree,
      summary: `US workers in this job say it usually needs a ${EDUCATION_LABELS[education]} (O*NET).`
    }
  return open
}

/** True when practising the role needs a qualification or admission as well as skills. */
export const needsQualification = (access: RoleAccess) =>
  access.status === 'qualify' || access.status === 'register' || access.status === 'check_licence'
