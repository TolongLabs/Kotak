/**
 * Which UN Sustainable Development Goals a job's own work serves, by O*NET occupation.
 * This is Kotak's mapping: a fixed table the team can review, kept apart from the skill tags
 * (mostly SDG 4 and 8), which describe reskilling itself.
 */
export interface OccupationSdg {
  goals: number[]
  reason: string
}

// The most specific key wins: the detailed occupation ("29-1141"), then the major group ("29").
const MAPPING: Record<string, OccupationSdg> = {
  '11': { goals: [8], reason: 'Managers run the organisations that create decent, productive work (SDG 8).' },
  '13': {
    goals: [8],
    reason: 'Business and finance work keeps firms productive and widens access to financial services (SDG 8.10).'
  },
  '15': { goals: [9], reason: 'Computing and data work builds digital infrastructure and innovation (SDG 9).' },
  '17': { goals: [9, 11], reason: 'Engineers design the infrastructure that industry and cities run on (SDG 9, 11).' },
  '19': { goals: [9], reason: 'Scientists drive research and innovation (SDG 9.5).' },
  '21': {
    goals: [10, 3],
    reason: 'Community and social service work reduces inequality and supports wellbeing (SDG 10, 3).'
  },
  '23': { goals: [16], reason: 'Legal work upholds justice and the rule of law (SDG 16.3).' },
  '25': { goals: [4], reason: 'Educators deliver quality education (SDG 4).' },
  '27': { goals: [8, 11], reason: 'Creative and media work sustains livelihoods and cultural heritage (SDG 8, 11.4).' },
  '29': { goals: [3], reason: 'Health practitioners deliver health and wellbeing (SDG 3).' },
  '31': { goals: [3], reason: 'Health support work keeps care running (SDG 3).' },
  '33': { goals: [16, 11], reason: 'Protective services keep people and places safe (SDG 16.1, 11.5).' },
  '35': { goals: [8, 12], reason: 'Food service creates jobs and can cut food waste (SDG 8, 12.3).' },
  '37': { goals: [6, 11], reason: 'Cleaning and grounds work keeps places sanitary and liveable (SDG 6.2, 11).' },
  '39': { goals: [3, 8], reason: 'Personal care work supports wellbeing and decent jobs (SDG 3, 8).' },
  '41': { goals: [8, 12], reason: 'Sales work drives trade and responsible consumption (SDG 8, 12).' },
  '43': { goals: [8], reason: 'Office and administrative work keeps organisations productive (SDG 8.2).' },
  '45': { goals: [2, 15], reason: 'Farming, fishing and forestry feed people and manage land (SDG 2, 15).' },
  '47': { goals: [9, 11], reason: 'Construction builds resilient infrastructure and housing (SDG 9, 11).' },
  '49': { goals: [9], reason: 'Installation and repair keep infrastructure working (SDG 9.1).' },
  '51': { goals: [9, 12], reason: 'Production work drives sustainable industry and production (SDG 9.2, 12).' },
  '53': { goals: [11, 9], reason: 'Transport work moves people and goods (SDG 11.2, 9.1).' },
  '55': { goals: [16], reason: 'Military work serves peace and security (SDG 16).' },
  '11-9031': { goals: [4], reason: 'Early-childhood centre leaders run quality early education (SDG 4.2).' },
  '11-9032': { goals: [4], reason: 'School leaders run quality education (SDG 4.1).' },
  '11-9033': { goals: [4], reason: 'Postsecondary administrators run tertiary education (SDG 4.3).' },
  '11-9039': { goals: [4], reason: 'Education administrators run quality education (SDG 4).' },
  '11-9111': { goals: [3], reason: 'Health service managers run health care (SDG 3.8).' },
  '17-2071': { goals: [7, 9], reason: 'Electrical engineers build energy systems (SDG 7, 9).' },
  '17-2081': { goals: [6, 13], reason: 'Environmental engineers protect water and climate (SDG 6, 13).' },
  '17-3025': { goals: [6, 13], reason: 'Environmental engineering technicians protect water and climate (SDG 6, 13).' },
  '19-1031': { goals: [15], reason: 'Conservation scientists protect land ecosystems (SDG 15).' },
  '19-1041': { goals: [3], reason: 'Epidemiologists protect public health (SDG 3.3).' },
  '19-1042': { goals: [3], reason: 'Medical scientists advance health research (SDG 3.b).' },
  '19-2041': { goals: [13, 15], reason: 'Environmental scientists track climate and ecosystems (SDG 13, 15).' },
  '19-3011': { goals: [8], reason: 'Economists inform growth and jobs policy (SDG 8).' },
  '19-3051': { goals: [11], reason: 'Urban and regional planners shape sustainable cities (SDG 11.3).' },
  '19-4042': { goals: [6, 13], reason: 'Environmental science technicians monitor pollution (SDG 6, 13).' },
  '21-1094': { goals: [3], reason: 'Community health workers bring care to communities (SDG 3.8).' },
  '33-2011': { goals: [11, 13], reason: 'Firefighters protect communities from disasters (SDG 11.5, 13.1).' },
  '39-9011': { goals: [4, 5], reason: 'Childcare workers support early learning and parents at work (SDG 4.2, 5.4).' },
  '45-3031': { goals: [14], reason: 'Fishing workers depend on and manage life below water (SDG 14).' },
  '45-4011': { goals: [15], reason: 'Forest and conservation workers protect land ecosystems (SDG 15).' },
  '47-2152': { goals: [6], reason: 'Plumbers deliver clean water and sanitation (SDG 6).' },
  '47-2231': { goals: [7, 13], reason: 'Solar installers expand clean energy (SDG 7, 13).' },
  '49-9081': { goals: [7, 13], reason: 'Wind turbine technicians keep clean energy running (SDG 7, 13).' },
  '51-8013': { goals: [7], reason: 'Power plant operators supply energy (SDG 7).' },
  '51-8031': { goals: [6], reason: 'Water treatment operators supply clean water (SDG 6).' },
  '53-3052': { goals: [11], reason: 'Bus drivers provide public transport (SDG 11.2).' }
}

/** The SDGs a job's work serves, or null for an unknown code. */
export function occupationSdgs(onetCode: string | null | undefined): OccupationSdg | null {
  if (!onetCode) return null
  return MAPPING[onetCode.slice(0, 7)] ?? MAPPING[onetCode.slice(0, 2)] ?? null
}
