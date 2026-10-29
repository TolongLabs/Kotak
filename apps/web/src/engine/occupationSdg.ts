/**
 * Which UN Sustainable Development Goal targets a job's own work serves, by O*NET occupation.
 * This is Kotak's mapping: a fixed table the team can review, kept apart from the skill tags
 * (mostly SDG 4 and 8), which describe reskilling itself.
 */
export interface OccupationSdg {
  /** The SDG targets the reason rests on, such as `8.5`; each has its UN text in /data/sdg-reasons.json (#391). */
  targets: string[]
  goals: number[]
  reason: string
}

// The most specific key wins: the detailed occupation ("29-1141"), then the minor group ("13-2"), then the major group
// ("29").
const MAPPING: Record<string, Omit<OccupationSdg, 'goals'>> = {
  '11': { targets: ['8.5'], reason: 'Managers organise the work that provides productive employment (SDG 8.5).' },
  '13': { targets: ['8.2'], reason: 'Business operations work helps organisations run productively (SDG 8.2).' },
  '15': {
    targets: ['9.5'],
    reason:
      'Computing and data work builds digital tools that can help industries upgrade their technology and innovate (SDG 9.5).'
  },
  '17': {
    targets: ['9.5'],
    reason: 'Engineering, design and mapping work helps industries upgrade their technology and innovate (SDG 9.5).'
  },
  '19': {
    targets: ['9.5'],
    reason: 'Scientists carry out the scientific research this target aims to grow (SDG 9.5).'
  },
  '21': {
    targets: ['10.2'],
    reason:
      'Community and social service work helps people take part in social and economic life, whatever their circumstances (SDG 10.2).'
  },
  '23': { targets: ['16.3'], reason: 'Legal work helps uphold the rule of law and access to justice (SDG 16.3).' },
  '25': {
    targets: ['4.c'],
    reason: 'Teaching and training add to the supply of qualified teachers that quality education depends on (SDG 4.c).'
  },
  '27': {
    targets: ['11.4'],
    reason: 'Creative and media work can help record, share and keep alive cultural heritage (SDG 11.4).'
  },
  '29': {
    targets: ['3.8'],
    reason: 'Health practitioners provide the essential health care that universal health coverage needs (SDG 3.8).'
  },
  '31': {
    targets: ['3.8'],
    reason:
      'Health support work helps people get the essential health care that universal health coverage needs (SDG 3.8).'
  },
  '33': {
    targets: ['16.1'],
    reason: 'Protective service work helps prevent violence and keep people safe (SDG 16.1).'
  },
  '35': {
    targets: ['12.3'],
    reason: 'Food service work can cut the food wasted in kitchens and restaurants (SDG 12.3).'
  },
  '37': {
    targets: ['6.2'],
    reason: 'Cleaning and pest control work helps keep buildings and their washrooms hygienic (SDG 6.2).'
  },
  '39': {
    targets: ['8.5'],
    reason:
      'Personal care and service work is employment, which this target wants to be productive and decent for everyone (SDG 8.5).'
  },
  '41': {
    targets: ['8.5'],
    reason: 'Sales work is employment, which this target wants to be productive and decent for everyone (SDG 8.5).'
  },
  '43': {
    targets: ['8.2'],
    reason: 'Office and administrative work keeps organisations running productively (SDG 8.2).'
  },
  '45': {
    targets: ['2.4'],
    reason:
      'Farming, fishing and forestry produce food and manage land, which this target wants done sustainably (SDG 2.4).'
  },
  '47': {
    targets: ['9.1'],
    reason: 'Construction work builds and repairs the infrastructure people rely on (SDG 9.1).'
  },
  '49': {
    targets: ['9.1'],
    reason: 'Installation and repair work keeps infrastructure and equipment working (SDG 9.1).'
  },
  '51': {
    targets: ['9.2'],
    reason: 'Production work is part of the industry this target wants to grow inclusively and sustainably (SDG 9.2).'
  },
  '53': {
    targets: ['11.2'],
    reason: 'Transport work helps run the transport systems that move people and goods (SDG 11.2).'
  },
  '55': { targets: ['16.1'], reason: 'Military work aims to protect people from violence and conflict (SDG 16.1).' },
  '11-9031': {
    targets: ['4.2'],
    reason: 'Early-childhood centre leaders run early childhood care and education (SDG 4.2).'
  },
  '11-9032': { targets: ['4.1'], reason: 'School leaders run primary and secondary schools (SDG 4.1).' },
  '11-9033': { targets: ['4.3'], reason: 'Postsecondary administrators run colleges and universities (SDG 4.3).' },
  '11-9039': { targets: ['4.3'], reason: 'Education administrators run education and training programmes (SDG 4.3).' },
  '11-9111': {
    targets: ['3.8'],
    reason: 'Health service managers run the services behind essential health care (SDG 3.8).'
  },
  '17-2071': {
    targets: ['7.1'],
    reason: 'Electrical engineers design the power systems behind reliable, modern energy (SDG 7.1).'
  },
  '17-2081': {
    targets: ['6.3'],
    reason: 'Environmental engineers design ways to cut pollution and treat wastewater (SDG 6.3).'
  },
  '17-3025': {
    targets: ['6.3'],
    reason: 'Environmental engineering technicians help reduce pollution and treat wastewater (SDG 6.3).'
  },
  '19-1031': { targets: ['15.1'], reason: 'Conservation scientists manage and protect land ecosystems (SDG 15.1).' },
  '19-1041': { targets: ['3.3'], reason: 'Epidemiologists track and help control communicable diseases (SDG 3.3).' },
  '19-1042': { targets: ['3.b'], reason: 'Medical research can lead to new medicines and vaccines (SDG 3.b).' },
  '19-2041': { targets: ['15.1'], reason: 'Environmental scientists study and help protect ecosystems (SDG 15.1).' },
  '19-3011': {
    targets: ['8.3'],
    reason: 'Economists advise on policies that support productive activity and job creation (SDG 8.3).'
  },
  '19-3051': { targets: ['11.3'], reason: 'Urban and regional planners plan how towns and cities grow (SDG 11.3).' },
  '19-4042': {
    targets: ['6.3'],
    reason: 'Environmental science technicians monitor pollution, including in water (SDG 6.3).'
  },
  '21-1094': { targets: ['3.8'], reason: 'Community health workers bring health care to communities (SDG 3.8).' },
  '25-4011': { targets: ['11.4'], reason: 'Archivists keep the records that make up cultural heritage (SDG 11.4).' },
  '25-4012': { targets: ['11.4'], reason: 'Curators look after and share cultural and natural heritage (SDG 11.4).' },
  '25-4013': { targets: ['11.4'], reason: 'Museum technicians and conservators protect heritage objects (SDG 11.4).' },
  '25-4022': { targets: ['16.10'], reason: 'Librarians help people find and use information (SDG 16.10).' },
  '25-4031': { targets: ['16.10'], reason: 'Library technicians help people find and use information (SDG 16.10).' },
  '33-2011': {
    targets: ['11.5', '13.1'],
    reason: 'Firefighters protect communities from fires and disasters (SDG 11.5, 13.1).'
  },
  '39-9011': {
    targets: ['4.2', '5.4'],
    reason:
      'Childcare workers support early learning and share care that parents would otherwise do unpaid (SDG 4.2, 5.4).'
  },
  '45-3031': {
    targets: ['14.4'],
    reason: 'Fishing work depends on the healthy fish stocks this target aims to restore (SDG 14.4).'
  },
  '45-4011': {
    targets: ['15.2'],
    reason: 'Forest and conservation workers plant, protect and manage forests (SDG 15.2).'
  },
  '47-2152': {
    targets: ['6.1', '6.2'],
    reason:
      'Plumbers install the pipes and fixtures that bring safe water and sanitation into buildings (SDG 6.1, 6.2).'
  },
  '47-2231': { targets: ['7.2'], reason: 'Solar installers add renewable energy to the energy mix (SDG 7.2).' },
  '49-9081': { targets: ['7.2'], reason: 'Wind turbine technicians keep renewable power running (SDG 7.2).' },
  '51-8013': { targets: ['7.1'], reason: 'Power plant operators keep reliable electricity flowing (SDG 7.1).' },
  '51-8031': {
    targets: ['6.1', '6.3'],
    reason: 'Water and wastewater treatment operators supply safe water and treat wastewater (SDG 6.1, 6.3).'
  },
  '53-3052': { targets: ['11.2'], reason: 'Bus drivers run public transport (SDG 11.2).' },
  '13-2': {
    targets: ['8.10'],
    reason: 'Finance work helps people and firms use banking, insurance and other financial services (SDG 8.10).'
  },
  '13-1031': {
    targets: ['8.10'],
    reason: 'Claims adjusters help insurers pay out on the cover people and firms rely on (SDG 8.10).'
  },
  '13-1032': { targets: ['8.10'], reason: 'Insurance appraisers help insurers settle claims (SDG 8.10).' },
  '17-1011': {
    targets: ['9.1'],
    reason: 'Architects design the buildings that are part of the infrastructure people rely on (SDG 9.1).'
  },
  '17-1012': {
    targets: ['11.7'],
    reason: 'Landscape architects design parks, streets and other green and public spaces (SDG 11.7).'
  },
  '17-1022': {
    targets: ['9.1'],
    reason: 'Surveyors measure the land that roads, buildings and other infrastructure are built on (SDG 9.1).'
  },
  '17-2051': {
    targets: ['9.1'],
    reason: 'Civil engineers design roads, bridges, water systems and other infrastructure (SDG 9.1).'
  },
  '17-3011': {
    targets: ['9.1'],
    reason: 'Architectural and civil drafters draw up the plans infrastructure is built from (SDG 9.1).'
  },
  '17-3022': {
    targets: ['9.1'],
    reason: 'Civil engineering technicians help plan, build and inspect infrastructure (SDG 9.1).'
  },
  '17-3031': {
    targets: ['9.1'],
    reason: 'Surveying and mapping technicians gather the measurements infrastructure projects need (SDG 9.1).'
  },
  '37-3': { targets: ['11.7'], reason: 'Grounds work looks after parks, gardens and other green spaces (SDG 11.7).' },
  '37-1012': {
    targets: ['11.7'],
    reason: 'Groundskeeping supervisors look after parks, gardens and other green spaces (SDG 11.7).'
  },
  '53-7': {
    targets: ['8.5'],
    reason:
      'Material moving work is employment, which this target wants to be productive and decent for everyone (SDG 8.5).'
  },
  '53-7081': {
    targets: ['11.6'],
    reason:
      'Refuse and recycling collectors carry out the municipal waste management this target highlights (SDG 11.6).'
  }
}

/** Every target the mapping names; build:data checks each has its UN text and a reason. */
export const OCCUPATION_SDG_TARGETS = [...new Set(Object.values(MAPPING).flatMap((entry) => entry.targets))]

/** The SDGs a job's work serves, or null for an unknown code. */
export function occupationSdgs(onetCode: string | null | undefined): OccupationSdg | null {
  if (!onetCode) return null
  const found = MAPPING[onetCode.slice(0, 7)] ?? MAPPING[onetCode.slice(0, 4)] ?? MAPPING[onetCode.slice(0, 2)]
  return found ? { ...found, goals: [...new Set(found.targets.map((target) => Number(target.split('.')[0])))] } : null
}
