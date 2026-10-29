// The personal pace rule (#356): a stated estimate, not a measurement. The check-up's situation, years of work and
// qualification scale each step's hours by one bounded factor; a returning worker also gets a refresher step first.
// Pure and deterministic. An unknown input (missing, or "Prefer Not to Say") counts as 1.

import type { EducationLevel, Situation } from '../pathways/schemas'
import type { Pace, PaceInput, RefresherStep } from './schemas'

export const PACE_MIN = 0.8
export const PACE_MAX = 1.3
export const REFRESHER_ID = 'refresher' // never a corner id, so ticks and What Changed key it safely
export const REFRESHER_HOURS = 4 // fixed: the pace factor does not scale it

export interface PaceProfile {
  situation?: Situation | null
  years_experience?: number | null
  education_level?: EducationLevel | null
}

const SITUATION: Record<Situation, { text: string; factor: number }> = {
  working: { text: 'Working', factor: 0.95 },
  studying: { text: 'Studying', factor: 0.95 },
  graduated: { text: 'Recently graduated', factor: 1 },
  between_jobs: { text: 'Between jobs', factor: 1.05 },
  returning: { text: 'Returning to work', factor: 1.1 }
}
const EDUCATION: Record<EducationLevel, { text: string; factor: number }> = {
  secondary: { text: 'SPM or below', factor: 1.05 },
  certificate: { text: 'Certificate', factor: 1.03 },
  diploma: { text: 'Diploma', factor: 1 },
  bachelor: { text: 'Bachelor’s degree', factor: 0.95 },
  master: { text: 'Master’s degree', factor: 0.93 },
  doctorate: { text: 'Doctorate', factor: 0.92 }
}
const NOT_GIVEN = 'Not given'

// The check-up form's year bands, named as its options are (CheckUpView); it stores each band's lower bound.
const yearsBand = (years: number): { text: string; factor: number } =>
  years < 1
    ? { text: 'None yet', factor: 1.1 }
    : years < 2
      ? { text: 'Under 2 years', factor: 1.1 }
      : years < 4
        ? { text: '2 to 3 years', factor: 1.05 }
        : years < 6
          ? { text: '4 to 5 years', factor: 1.05 }
          : years < 10
            ? { text: '6 to 9 years', factor: 1 }
            : { text: '10 years or more', factor: 0.95 }

const round2 = (n: number) => Math.round(n * 100) / 100

/** The factor, its three inputs, the notes and the refresher (its weeks are set by buildRoadmap). */
export function paceFor(profile: PaceProfile | null | undefined): Pace {
  const s = profile?.situation ? SITUATION[profile.situation] : null
  const y = profile?.years_experience != null ? yearsBand(profile.years_experience) : null
  const e = profile?.education_level ? EDUCATION[profile.education_level] : null
  const inputs: PaceInput[] = [
    { label: 'Situation', value: s?.text ?? NOT_GIVEN, factor: s?.factor ?? 1 },
    { label: 'Years of work', value: y?.text ?? NOT_GIVEN, factor: y?.factor ?? 1 },
    { label: 'Qualification', value: e?.text ?? NOT_GIVEN, factor: e?.factor ?? 1 }
  ]
  const factor = round2(
    Math.min(
      PACE_MAX,
      Math.max(
        PACE_MIN,
        inputs.reduce((p, i) => p * i.factor, 1)
      )
    )
  )
  const note =
    factor < 0.95
      ? 'Faster than typical: your experience should shorten the hours. A stated estimate.'
      : factor <= 1.05
        ? 'Typical pace. A stated estimate.'
        : 'Needs more practice time: the hours are lengthened to fit your starting point. A stated estimate.'
  const maths = [
    `Pace factor ${factor.toFixed(2)} = ${inputs.map((i) => i.factor.toFixed(2)).join(' × ')}, kept between ${PACE_MIN.toFixed(2)} and ${PACE_MAX.toFixed(2)}. A stated estimate, not a measurement.`,
    ...inputs.map((i) => `${i.label}: ${i.value} gives ${i.factor.toFixed(2)}.`),
    'Each step’s hours are multiplied by the factor; the finish week follows.'
  ]
  const refresher: RefresherStep | null =
    profile?.situation === 'returning'
      ? {
          id: REFRESHER_ID,
          hours: REFRESHER_HOURS,
          weeks: [1, 1],
          title: 'Refresh your work routine',
          description:
            'A short warm-up before the skill steps: review how your field works today and rebuild a weekly study habit.'
        }
      : null
  return { factor, inputs, note, maths, refresher }
}
