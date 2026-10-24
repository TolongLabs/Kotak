import { describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  interestPicks,
  lacksExperience,
  ProfileSchema,
  roleAccess,
  type BundlePathways,
  type ProfileInput
} from '@kotak/shared'
import { createKotak } from './kotak'

// The four situations behind #284, run through the SDK on the built bundle (bun run build:data). Each states what
// Kotak must now do for that person. Skipped when the bundle hasn't been built.

const PUBLIC = join(import.meta.dir, '../../../apps/web/public')
const built = existsSync(join(PUBLIC, 'data/pathways.json'))
const kotak = createKotak({ source: { read: (path) => Bun.file(join(PUBLIC, path)).json(), trusted: true } })
const START = '2026-10-24'

/** "Not yet" on every corner of a role, as a user new to it would answer. */
async function notYet(code: string) {
  const questions = await kotak.questions(code)
  return questions.corners.map((corner) => ({ corner_id: corner.corner_id, basic: 1, advanced: 1 }) as const)
}

describe.skipIf(!built)('the intake pathways (#284)', () => {
  test('a law graduate who wants software, in AI or cybersecurity, gets those roles, with tools, and the law degree counts', async () => {
    const profile: ProfileInput = {
      situation: 'graduated',
      education_level: 'bachelor',
      field_of_study: 'law',
      interest_areas: ['ai-and-data', 'cybersecurity']
    }
    const { roles } = await kotak.suggestRoles({ profile, limit: 12 })
    const codes = roles.map((role) => role.onet_code)
    expect(codes.some((code) => ['15-1212.00', '15-1299.05', '15-1299.04'].includes(code))).toBe(true)
    expect(codes.some((code) => ['15-2051.00', '15-2051.01', '15-1221.00'].includes(code))).toBe(true)

    // Testing them on Information Security Analysts ranks the roles their law degree leads to beside it.
    const report = await kotak.checkup({
      role_code: null,
      goal: 'target',
      target_role_code: '15-1212.00',
      answers: await notYet('15-1212.00'),
      profile: { ...profile, target_role_codes: ['15-1212.00'] },
      start_date: START
    })
    expect(report.roadmap.tools.some((tool) => tool.name === 'Python')).toBe(true)
    const fromLaw = report.roles.filter((role) => role.reasons.includes('field'))
    expect(fromLaw.length).toBeGreaterThan(0)
    // A law degree qualifies for practice, but admission steps remain.
    expect(report.roles.find((role) => role.onet_code === '23-1011.00')?.access.status).toBe('register')
  })

  test('a linguistics graduate who wants to practise law sees the qualification it needs, beside their fit', async () => {
    const profile: ProfileInput = {
      situation: 'graduated',
      education_level: 'bachelor',
      field_of_study: 'linguistics-languages',
      target_role_codes: ['23-1011.00']
    }
    const report = await kotak.checkup({
      role_code: null,
      goal: 'target',
      target_role_code: '23-1011.00',
      answers: await notYet('23-1011.00'),
      profile,
      start_date: START
    })
    expect(report.roadmap.access.status).toBe('qualify')
    expect(report.roadmap.access.profession?.route.length).toBeGreaterThan(0)
    expect(report.roadmap.access.profession?.sources.length).toBeGreaterThan(0)
    // Roles the user can reach without the qualification are in the ranking.
    expect(report.roles.some((role) => role.access.status === 'open')).toBe(true)
  })

  test('a front-end developer who wants a better path sees AI, data, security and cloud roles, and Kubernetes', async () => {
    const corners = (await kotak.questions('15-1254.00')).corners
    const report = await kotak.checkup({
      role_code: '15-1254.00',
      goal: 'explore',
      answers: corners.map((corner) => ({ corner_id: corner.corner_id, basic: 3, advanced: 3 }) as const),
      profile: {
        situation: 'working',
        education_level: 'bachelor',
        field_of_study: 'computer-science',
        years_experience: 2,
        interest_areas: ['ai-and-data', 'cloud-and-infrastructure', 'cybersecurity']
      },
      start_date: START
    })
    const codes = report.roles.map((role) => role.onet_code)
    expect(codes).toContain('15-2051.00') // Data Scientists
    expect(codes).toContain('15-1221.00') // Computer and Information Research Scientists, where "AI engineer" maps
    expect(codes).toContain('15-1212.00') // Information Security Analysts
    const cloud = await kotak.checkup({
      role_code: '15-1254.00',
      goal: 'explore',
      answers: corners.map((corner) => ({ corner_id: corner.corner_id, basic: 3, advanced: 3 }) as const),
      plan_role_code: '15-1299.08', // Computer Systems Engineers/Architects
      profile: {
        situation: 'working',
        field_of_study: 'computer-science',
        interest_areas: ['cloud-and-infrastructure']
      },
      start_date: START
    })
    expect(cloud.roadmap.tools.map((tool) => tool.name)).toContain('Kubernetes')
  })

  test('a jobless computer science graduate who isn’t sure gets roles open to a new graduate, before any question', async () => {
    const profile: ProfileInput = {
      situation: 'graduated',
      education_level: 'bachelor',
      field_of_study: 'computer-science',
      interests: interestPicks(['solve-puzzles', 'analyse-data', 'set-up-equipment', 'check-details'])
    }
    const { roles } = await kotak.suggestRoles({ profile })
    expect(roles.length).toBeGreaterThanOrEqual(3)
    expect(roles.every((role) => !role.onet_code.startsWith('11-'))).toBe(true) // no management roles
    expect(roles.every((role) => role.access.status !== 'experience')).toBe(true)
    // Without a job title, the check-up runs on the role they pick.
    const picked = roles[0]!.onet_code
    const report = await kotak.checkup({
      role_code: null,
      goal: 'target',
      target_role_code: picked,
      answers: await notYet(picked),
      profile: { ...profile, target_role_codes: [picked] },
      start_date: START
    })
    expect(report.role.onet_code).toBe(picked)
  })
})

// The "I'm not sure" screen for a student with no field or area: the activities' subjects must count, not only the
// six interest scores' shape, which put zoologists and astronomers first for computers and data.
describe.skipIf(!built)('not sure, with no field or area', () => {
  const unsure = (ids: string[]): ProfileInput => ({
    situation: 'studying',
    interests: interestPicks(ids),
    interest_activities: ids
  })

  test('a student who enjoys computers and data gets computing roles, without claiming they picked an area', async () => {
    const pathways = (await Bun.file(join(PUBLIC, 'data/pathways.json')).json()) as BundlePathways
    const pointed = new Set(
      pathways.areas
        .filter((area) => ['ai-and-data', 'cloud-and-infrastructure', 'cybersecurity'].includes(area.id))
        .flatMap((area) => area.onet_codes)
    )
    const { roles } = await kotak.suggestRoles({
      profile: unsure(['solve-puzzles', 'analyse-data', 'set-up-equipment'])
    })
    expect(roles).toHaveLength(6)
    expect(roles.every((role) => pointed.has(role.onet_code))).toBe(true)
    expect(roles.some((role) => ['15-1212.00', '15-1299.05'].includes(role.onet_code))).toBe(true) // security
    expect(roles.every((role) => role.reasons.every((reason) => !reason.startsWith('In ')))).toBe(true)
  })

  test('a student who enjoys caring for people gets health roles, not teaching ones', async () => {
    const { roles } = await kotak.suggestRoles({
      profile: unsure(['care-wellbeing', 'help-problems', 'research-deeply'])
    })
    expect(roles.filter((role) => /^(29|31)-/.test(role.onet_code)).length).toBeGreaterThanOrEqual(2)
    expect(roles.every((role) => !role.onet_code.startsWith('25-'))).toBe(true)
  })

  test('picks spread evenly still say nothing', async () => {
    const { roles } = await kotak.suggestRoles({
      profile: unsure([
        'build-with-hands',
        'analyse-data',
        'design-looks',
        'care-wellbeing',
        'lead-team',
        'work-numbers'
      ])
    })
    expect(roles).toEqual([])
  })
})

describe.skipIf(!built)('access to regulated roles', () => {
  const pathways = async () => (await Bun.file(join(PUBLIC, 'data/pathways.json')).json()) as BundlePathways
  const profileOf = (input: ProfileInput) => ProfileSchema.parse(input)

  test('a working nurse has open access to the other nursing jobs', async () => {
    const bundle = await pathways()
    const nursing = bundle.professions.find((profession) => profession.onet_codes.includes('29-1141.00'))!
    const nurse = profileOf({ situation: 'working', education_level: 'diploma', field_of_study: 'nursing' })
    for (const code of nursing.onet_codes) expect(roleAccess(code, nurse, bundle, '29-1141.00').status).toBe('open')
    // A student nurse doesn't hold the registration yet.
    const student = profileOf({ situation: 'studying', education_level: 'diploma', field_of_study: 'nursing' })
    expect(roleAccess('29-1171.00', student, bundle, '29-1141.00').status).not.toBe('open')
  })

  test('software engineering is not a qualifying field for professional engineers', async () => {
    const bundle = await pathways()
    const graduate = profileOf({
      situation: 'graduated',
      education_level: 'bachelor',
      field_of_study: 'software-engineering'
    })
    expect(roleAccess('17-2051.00', graduate, bundle, null).status).toBe('qualify')
  })

  test('physiotherapy and occupational therapy each qualify only for their own profession', async () => {
    const bundle = await pathways()
    const physio = profileOf({ situation: 'graduated', education_level: 'bachelor', field_of_study: 'physiotherapy' })
    const ot = profileOf({
      situation: 'graduated',
      education_level: 'bachelor',
      field_of_study: 'occupational-therapy'
    })
    expect(roleAccess('29-1122.00', physio, bundle, null).status).toBe('qualify')
    expect(roleAccess('29-1122.00', ot, bundle, null).status).toBe('register')
    expect(roleAccess('29-1123.00', physio, bundle, null).status).toBe('register')
  })

  test('a regulated role that leads others still counts the years a student lacks', async () => {
    const bundle = await pathways()
    const student = profileOf({
      situation: 'studying',
      education_level: 'diploma',
      field_of_study: 'business-administration'
    })
    expect(lacksExperience('11-9141.00', student, bundle, null)).toBe(true)
    expect(roleAccess('11-9141.00', student, bundle, null).summary).toContain('leads others')
  })
})
