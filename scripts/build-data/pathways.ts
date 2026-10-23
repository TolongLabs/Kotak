// The bundle's /data/pathways.json (#284), joined from data/pathways/ and checked against the roles in the bundle:
// the fields of study with the occupations the CIP to SOC crosswalk links them to, the interest areas, the Malaysian
// regulated professions with the fields that qualify for them, and each role's preparation and interest scores.

import {
  ACTIVITY_AREAS,
  BundlePathwaysSchema,
  CareerAreasFileSchema,
  CipSocFileSchema,
  FieldsOfStudyFileSchema,
  INTEREST_ACTIVITIES,
  OnetHotTechnologiesFileSchema,
  OnetPreparationFileSchema,
  RegulatedProfessionsFileSchema,
  type BundlePathways,
  type BundleRole
} from '../../packages/shared/src/index'

/** At most this many tools per role: above the longest In Demand list (35), so none is cut for its name. */
const MAX_TOOLS = 40
/** A role with no In Demand tools shows this many of its hot technologies. */
const MAX_HOT_ONLY = 12

type Issue = { path: PropertyKey[]; message: string }
const describe = (issues: Issue[]) => issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')

async function load<T>(root: string, path: string, schema: { safeParse: (value: unknown) => any }): Promise<T> {
  const result = schema.safeParse(await Bun.file(`${root}/${path}`).json())
  if (!result.success) throw new Error(`build:data input ${path} failed validation: ${describe(result.error.issues)}`)
  return result.data as T
}

export async function loadPathwaysInputs(root: string) {
  const [areas, fields, cipSoc, regulated, preparation, tools] = await Promise.all([
    load<ReturnType<typeof CareerAreasFileSchema.parse>>(
      root,
      'data/pathways/career-areas.json',
      CareerAreasFileSchema
    ),
    load<ReturnType<typeof FieldsOfStudyFileSchema.parse>>(
      root,
      'data/pathways/fields-of-study.json',
      FieldsOfStudyFileSchema
    ),
    load<ReturnType<typeof CipSocFileSchema.parse>>(root, 'data/pathways/cip-soc.json', CipSocFileSchema),
    load<ReturnType<typeof RegulatedProfessionsFileSchema.parse>>(
      root,
      'data/pathways/regulated-professions.json',
      RegulatedProfessionsFileSchema
    ),
    load<ReturnType<typeof OnetPreparationFileSchema.parse>>(
      root,
      'data/pathways/onet-preparation.json',
      OnetPreparationFileSchema
    ),
    load<ReturnType<typeof OnetHotTechnologiesFileSchema.parse>>(
      root,
      'data/onet/hot-technologies.json',
      OnetHotTechnologiesFileSchema
    )
  ])
  return { areas, fields, cipSoc, regulated, preparation, tools }
}

type Inputs = Awaited<ReturnType<typeof loadPathwaysInputs>>

/** The tools employers name for a role: its In Demand hot technologies, or without any, its first hot ones. */
export function roleTools(inputs: Inputs, code: string): BundleRole['tools'] {
  const rows = inputs.tools.hot_technologies[code] ?? []
  const seen = new Set<string>()
  const unique = rows.filter((row) => !seen.has(row.example) && seen.add(row.example))
  const inDemand = unique.filter((row) => row.in_demand)
  return (inDemand.length ? inDemand.slice(0, MAX_TOOLS) : unique.slice(0, MAX_HOT_ONLY)).map((row) => ({
    name: row.example,
    in_demand: row.in_demand
  }))
}

/** The pathways file for the roles in the bundle; problems go to `failures`. */
export function buildPathways(
  inputs: Inputs,
  roles: Map<string, Pick<BundleRole, 'onet_code' | 'title'>>,
  failures: string[]
): BundlePathways | null {
  const codes = [...roles.keys()].sort()
  const known = (code: string, where: string) => {
    if (roles.has(code)) return true
    failures.push(`pathways: ${where} names ${code}, which has no role file`)
    return false
  }

  // Fields: CIP prefixes > SOC codes > the bundle's O*NET codes sharing the SOC's 7 characters. An All Other SOC
  // reaches its detailed occupations only from fields whose group lists its major group.
  const fields = inputs.fields.fields.map((field) => {
    const home = inputs.fields.home_majors[field.group] ?? []
    const socs = new Set(
      inputs.cipSoc.links
        .filter((link) => field.cip_prefixes.some((prefix) => link.cip.startsWith(prefix)))
        .map((link) => link.soc)
    )
    const onet_codes = codes.filter((code) => {
      const soc = code.slice(0, 7)
      if (!socs.has(soc)) return false
      const allOther = soc.endsWith('9') && !code.endsWith('.00')
      return !allOther || home.includes(code.slice(0, 2))
    })
    return { id: field.id, label: field.label, group: field.group, onet_codes }
  })
  for (const field of fields)
    if (field.id !== 'other' && field.onet_codes.length < 3)
      failures.push(`pathways: field ${field.id} reaches only ${field.onet_codes.length} roles`)

  const areas = inputs.areas.areas.map((area) => {
    const listed = area.onet_codes.filter((code) => known(code, `area ${area.id}`))
    const byPrefix = codes.filter((code) => area.soc_prefixes.some((prefix) => code.startsWith(prefix)))
    return {
      id: area.id,
      label: area.label,
      group: area.group,
      description: area.description,
      // The listed codes keep their order, the area's core roles first; the prefix matches follow by code.
      onet_codes: [...new Set([...listed, ...byPrefix])]
    }
  })
  for (const [activity, ids] of Object.entries(ACTIVITY_AREAS)) {
    if (!INTEREST_ACTIVITIES.some((known) => known.id === activity))
      failures.push(`pathways: ACTIVITY_AREAS names activity ${activity}, which doesn't exist`)
    for (const id of ids.filter((id) => !areas.some((area) => area.id === id)))
      failures.push(`pathways: activity ${activity} names area ${id}, which doesn't exist`)
  }

  // A field qualifies when one of its CIP codes sits inside a qualifying one: Law (22.01) for 22.01, but not
  // Psychology (42) for counselling (42.2803). A profession no field qualifies for reads "Licence Required".
  const professions = inputs.regulated.professions.map(({ qualifying_fields, notes: _notes, ...profession }) => {
    const qualifying_field_ids = inputs.fields.fields
      .filter((field) => field.cip_prefixes.some((prefix) => qualifying_fields.some((q) => prefix.startsWith(q))))
      .map((field) => field.id)
    return {
      ...profession,
      onet_codes: profession.onet_codes.filter((code) => known(code, `profession ${profession.id}`)),
      sources: profession.sources.map(({ url, title }) => ({ url, title })),
      qualifying_field_ids
    }
  })
  const claimed = new Map<string, string>()
  for (const profession of professions)
    for (const code of profession.onet_codes) {
      if (claimed.has(code))
        failures.push(`pathways: ${code} is in both ${claimed.get(code)} and ${profession.id}; a role takes one rule`)
      claimed.set(code, profession.id)
    }

  // A regulated profession's own minimum level wins over the US survey, where professional degrees such as law and
  // medicine mostly read as doctorates; in Malaysia they are bachelor's degrees (LLB, MBBS).
  const minimumLevel = new Map(
    professions.flatMap((profession) =>
      profession.minimum_level ? profession.onet_codes.map((code) => [code, profession.minimum_level!] as const) : []
    )
  )
  const occupations = Object.fromEntries(
    codes.map((code) => {
      const prep = inputs.preparation.occupations[code]
      return [
        code,
        {
          title: roles.get(code)!.title,
          job_zone: prep?.job_zone ?? null,
          // US legal jobs record the JD as a doctorate; Malaysian law is a bachelor's degree (LLB).
          education:
            minimumLevel.get(code) ??
            (code.startsWith('23-') && prep?.education === 'doctorate' ? 'bachelor' : (prep?.education ?? null)),
          experience_years: prep?.experience_years ?? null,
          interests: prep?.interests ?? null
        }
      ]
    })
  )

  const { preparation, tools, cipSoc, regulated } = inputs
  const result = BundlePathwaysSchema.safeParse({
    sources: {
      onet: {
        source_name: preparation.meta.source_name,
        source_url: preparation.meta.source_url,
        vintage_date: preparation.meta.vintage_date,
        geo_or_layer: 'US O*NET-SOC 2019 taxonomy'
      },
      onet_tools: {
        source_name: `${tools.meta.source_name}: Hot Technologies`,
        source_url: tools.meta.source_url,
        vintage_date: tools.meta.vintage_date,
        geo_or_layer: tools.meta.geo_or_layer
      },
      cip_soc: {
        source_name: cipSoc.meta.source_name,
        source_url: cipSoc.meta.source_url,
        vintage_date: cipSoc.meta.vintage_date,
        geo_or_layer: 'US CIP 2020 and SOC 2018'
      },
      regulated: {
        source_name: 'Malaysian regulators and Acts, checked by Kotak',
        source_url: 'https://lom.agc.gov.my/',
        vintage_date: regulated.accessed_date,
        geo_or_layer: 'MYS'
      }
    },
    fields,
    areas,
    professions,
    occupations
  })
  if (!result.success) {
    failures.push(`pathways.json: ${describe(result.error.issues)}`)
    return null
  }
  return result.data
}
