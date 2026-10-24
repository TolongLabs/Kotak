// The skills, tools, languages and benefits Kotak looks for in Malaysian job ads (#271). Postgres matches each
// listing's title, summary, card text without the employer's name, and description against these patterns (stats.ts),
// so they use its regular-expression syntax: \m and \M mark the start and end of a word, and (?!…) looks ahead. A
// pattern ignores case unless `caseSensitive` is set, which keeps words like "Excel", "Swift" or "React" from matching
// ordinary English. Benefits are matched only in the selling points an employer puts on the ad's card (stats.ts,
// CARD_HIGHLIGHTS), so "medical" in a hospital's job summary is no medical cover.
//
// The tools started from the O*NET Hot Technologies examples (data/onet/hot-technologies.json), renamed the way ads
// write them, and were checked against the 4,318 listings scraped on 22 October 2026: each pattern's matches were
// read for false hits. The benefits were read the same way against the selling points of the 1,083 of 4,408 cards
// that had them on 24 October. Bump SKILL_VOCABULARY_VERSION whenever a pattern changes, so every listing is matched
// again.

export type SkillCategory = 'ai' | 'tool' | 'language' | 'benefit'

export interface SkillTerm {
  key: string
  label: string
  category: SkillCategory
  patterns: Array<{ pattern: string; caseSensitive?: boolean }>
}

export const SKILL_VOCABULARY_VERSION = '2026-10-24.1'

const ci = (pattern: string) => ({ pattern })
const cs = (pattern: string) => ({ pattern, caseSensitive: true })

export const SKILL_TERMS: SkillTerm[] = [
  // AI: an ad that names any of these counts towards the share of ads that ask for AI skills.
  {
    key: 'artificial_intelligence',
    label: 'Artificial Intelligence',
    category: 'ai',
    patterns: [cs('\\mAI\\M'), ci('artificial intelligence')]
  },
  {
    key: 'machine_learning',
    label: 'Machine Learning',
    category: 'ai',
    patterns: [ci('machine learning'), cs('\\mML\\M')]
  },
  {
    key: 'generative_ai',
    label: 'Generative AI and LLMs',
    category: 'ai',
    patterns: [
      ci('generative ai'),
      ci('\\mgen ?ai\\M'),
      ci('large language models?'),
      cs('\\mLLMs?\\M'),
      ci('chatgpt'),
      cs('\\mGPT(s|-?[0-9][0-9a-z.]*)?\\M'), // not "GPTW", Great Place to Work
      ci('prompt engineering'),
      cs('\\mRAG\\M')
    ]
  },
  {
    key: 'deep_learning',
    label: 'Deep Learning',
    category: 'ai',
    patterns: [ci('deep learning'), ci('neural networks?')]
  },
  {
    key: 'nlp',
    label: 'Natural Language Processing',
    category: 'ai',
    patterns: [ci('natural language processing'), cs('\\mNLP\\M')]
  },
  { key: 'computer_vision', label: 'Computer Vision', category: 'ai', patterns: [ci('computer vision')] },
  { key: 'tensorflow', label: 'TensorFlow', category: 'ai', patterns: [ci('tensorflow')] },
  { key: 'pytorch', label: 'PyTorch', category: 'ai', patterns: [ci('pytorch')] },
  { key: 'mlops', label: 'MLOps', category: 'ai', patterns: [ci('\\mmlops\\M')] },
  {
    key: 'ai_coding_tools',
    label: 'AI Coding Tools',
    category: 'ai',
    patterns: [ci('copilot'), ci('ai coding'), ci('\\mcursor ai\\M'), ci('claude code')]
  },

  // Programming languages and frameworks.
  { key: 'python', label: 'Python', category: 'tool', patterns: [ci('\\mpython\\M')] },
  { key: 'java', label: 'Java', category: 'tool', patterns: [ci('\\mjava\\M(?!\\s?script)')] },
  { key: 'javascript', label: 'JavaScript', category: 'tool', patterns: [ci('javascript'), cs('\\mJS\\M')] },
  { key: 'typescript', label: 'TypeScript', category: 'tool', patterns: [ci('typescript')] },
  { key: 'react', label: 'React', category: 'tool', patterns: [cs('\\mReact(\\.?js)?\\M'), ci('reactjs')] },
  { key: 'react_native', label: 'React Native', category: 'tool', patterns: [ci('react native')] },
  { key: 'angular', label: 'Angular', category: 'tool', patterns: [cs('\\mAngular(JS)?\\M')] },
  { key: 'vue', label: 'Vue.js', category: 'tool', patterns: [ci('\\mvue(\\.?js)?\\M')] },
  { key: 'nodejs', label: 'Node.js', category: 'tool', patterns: [ci('node\\.?js'), cs('\\mNode\\M')] },
  { key: 'php', label: 'PHP', category: 'tool', patterns: [ci('\\mphp\\M')] },
  { key: 'laravel', label: 'Laravel', category: 'tool', patterns: [ci('\\mlaravel\\M')] },
  {
    key: 'csharp_dotnet',
    label: 'C# and .NET',
    category: 'tool',
    // Not a ".net.my" email or web address.
    patterns: [ci('c#'), ci('\\.net\\M(?!\\.[a-z])'), ci('\\mdotnet\\M'), ci('asp\\.net')]
  },
  { key: 'cpp', label: 'C++', category: 'tool', patterns: [ci('c\\+\\+')] },
  { key: 'golang', label: 'Go', category: 'tool', patterns: [ci('\\mgolang\\M')] },
  { key: 'kotlin', label: 'Kotlin', category: 'tool', patterns: [ci('\\mkotlin\\M')] },
  { key: 'swift', label: 'Swift', category: 'tool', patterns: [cs('\\mSwift(UI)?\\M')] },
  { key: 'flutter', label: 'Flutter', category: 'tool', patterns: [ci('\\mflutter\\M')] },
  { key: 'html_css', label: 'HTML and CSS', category: 'tool', patterns: [cs('\\mHTML5?\\M'), cs('\\mCSS3?\\M')] },
  {
    key: 'sql',
    label: 'SQL',
    category: 'tool',
    // SQL Account is accounting software, counted below.
    patterns: [cs('\\mSQL\\M(?! ?[Aa]ccount)'), ci('mysql'), ci('postgres(ql)?'), ci('sql server')]
  },
  { key: 'mongodb', label: 'MongoDB', category: 'tool', patterns: [ci('mongo ?db')] },
  {
    key: 'rest_api',
    label: 'REST APIs',
    category: 'tool',
    patterns: [ci('\\mrest(ful)? ?apis?\\M'), ci('\\mrestful\\M')]
  },
  { key: 'graphql', label: 'GraphQL', category: 'tool', patterns: [ci('graphql')] },
  { key: 'microservices', label: 'Microservices', category: 'tool', patterns: [ci('micro-?services')] },

  // Cloud, delivery and data tools.
  { key: 'aws', label: 'AWS', category: 'tool', patterns: [cs('\\mAWS\\M'), ci('amazon web services')] },
  { key: 'azure', label: 'Microsoft Azure', category: 'tool', patterns: [ci('\\mazure\\M')] },
  { key: 'google_cloud', label: 'Google Cloud', category: 'tool', patterns: [ci('google cloud'), cs('\\mGCP\\M')] },
  { key: 'docker', label: 'Docker', category: 'tool', patterns: [ci('\\mdocker\\M')] },
  { key: 'kubernetes', label: 'Kubernetes', category: 'tool', patterns: [ci('kubernetes'), cs('\\mK8s\\M')] },
  { key: 'linux', label: 'Linux', category: 'tool', patterns: [ci('\\mlinux\\M')] },
  { key: 'git', label: 'Git', category: 'tool', patterns: [cs('\\mGit\\M'), ci('github'), ci('gitlab')] },
  {
    key: 'ci_cd',
    label: 'CI/CD',
    category: 'tool',
    patterns: [ci('ci ?/ ?cd'), ci('\\mcicd\\M'), ci('continuous integration')]
  },
  { key: 'devops', label: 'DevOps', category: 'tool', patterns: [ci('\\mdevops\\M')] },
  { key: 'agile', label: 'Agile and Scrum', category: 'tool', patterns: [cs('\\mAgile\\M'), ci('\\mscrum\\M')] },
  { key: 'jira', label: 'Jira', category: 'tool', patterns: [ci('\\mjira\\M')] },
  { key: 'power_bi', label: 'Power BI', category: 'tool', patterns: [ci('power ?bi\\M')] },
  { key: 'tableau', label: 'Tableau', category: 'tool', patterns: [ci('\\mtableau\\M')] },
  { key: 'data_science', label: 'Data Science', category: 'tool', patterns: [ci('data scien(ce|tist)')] },
  { key: 'selenium', label: 'Selenium', category: 'tool', patterns: [ci('\\mselenium\\M')] },

  // Design, office and business software.
  { key: 'figma', label: 'Figma', category: 'tool', patterns: [ci('\\mfigma\\M')] },
  {
    key: 'adobe_creative',
    label: 'Adobe Creative Cloud',
    category: 'tool',
    patterns: [
      ci('photoshop'),
      ci('adobe illustrator'),
      ci('\\mindesign\\M'),
      ci('adobe xd'),
      ci('after effects'),
      ci('premiere pro'),
      ci('adobe creative')
    ]
  },
  { key: 'autocad', label: 'AutoCAD', category: 'tool', patterns: [ci('autocad')] },
  { key: 'solidworks', label: 'SolidWorks', category: 'tool', patterns: [ci('solidworks')] },
  { key: 'matlab', label: 'MATLAB', category: 'tool', patterns: [ci('\\mmatlab\\M')] },
  {
    key: 'excel',
    label: 'Microsoft Excel',
    category: 'tool',
    patterns: [ci('(ms|microsoft) excel'), cs('\\mExcel\\M(?! (in|at|as|with)\\M)')]
  },
  {
    key: 'ms_office',
    label: 'Microsoft Office',
    category: 'tool',
    patterns: [
      ci('(ms|microsoft) office'),
      ci('office 365'),
      ci('microsoft 365'),
      ci('(ms|microsoft) (word|powerpoint|outlook)')
    ]
  },
  { key: 'sap', label: 'SAP', category: 'tool', patterns: [cs('\\mSAP\\M')] },
  { key: 'salesforce', label: 'Salesforce', category: 'tool', patterns: [ci('salesforce')] },
  {
    key: 'accounting_software',
    label: 'Accounting Software',
    category: 'tool',
    patterns: [ci('autocount'), ci('sql account'), ci('quickbooks'), ci('\\mxero\\M')]
  },
  { key: 'wordpress', label: 'WordPress', category: 'tool', patterns: [ci('wordpress')] },

  // Languages: in Malaysia many ads ask for one or more besides English.
  { key: 'english', label: 'English', category: 'language', patterns: [ci('\\menglish\\M')] },
  {
    key: 'malay',
    label: 'Bahasa Malaysia',
    category: 'language',
    patterns: [ci('bahasa (malaysia|melayu)'), ci('\\mmalay\\M(?! ?sia)'), ci('\\mBM\\M')]
  },
  {
    key: 'mandarin',
    label: 'Mandarin',
    category: 'language',
    patterns: [ci('mandarin'), ci('\\mchinese\\M(?! new year)')]
  },
  { key: 'cantonese', label: 'Cantonese', category: 'language', patterns: [ci('cantonese')] },
  { key: 'japanese', label: 'Japanese', category: 'language', patterns: [ci('japanese')] },
  { key: 'korean', label: 'Korean', category: 'language', patterns: [ci('\\mkorean\\M')] },
  { key: 'tamil', label: 'Tamil', category: 'language', patterns: [ci('\\mtamil\\M')] },
  { key: 'thai', label: 'Thai', category: 'language', patterns: [ci('\\mthai\\M')] },
  { key: 'vietnamese', label: 'Vietnamese', category: 'language', patterns: [ci('vietnamese')] },
  {
    key: 'indonesian',
    label: 'Bahasa Indonesia',
    category: 'language',
    patterns: [ci('bahasa indonesia'), ci('indonesian')]
  },

  // Benefits and perks, in the card's selling points only. Malay and Chinese terms are the ones those cards used.
  {
    key: 'medical',
    label: 'Medical Cover',
    category: 'benefit',
    // Not "Fortune 500 Healthcare", an employer.
    patterns: [
      ci('medical'),
      ci('outpatient'),
      ci('hospitali[sz]ation'),
      ci('health ?care (benefits?|coverage)'),
      ci('health (benefits?|coverage|insurance|screening)'),
      ci('\\mclinics?\\M'),
      ci('perubatan'),
      ci('医疗')
    ]
  },
  {
    key: 'dental_optical',
    label: 'Dental and Optical',
    category: 'benefit',
    patterns: [ci('dental'), ci('optical'), ci('\\mvision care'), ci('spectacles'), ci('牙科'), ci('视力')]
  },
  {
    key: 'insurance',
    label: 'Insurance',
    category: 'benefit',
    patterns: [ci('insurance'), ci('takaful'), ci('insurans'), ci('保险')]
  },
  {
    key: 'bonus',
    label: 'Bonuses',
    category: 'benefit',
    // "AWS" is left out: on these cards it is as often Amazon Web Services as the annual wage supplement.
    patterns: [ci('bonus'), ci('13(th)?[- ]?months?'), ci('annual wage supplement'), ci('奖金')]
  },
  {
    key: 'commission',
    label: 'Commission and Incentives',
    category: 'benefit',
    // Not "commissioning", engineering work.
    patterns: [ci('\\mcommissions?\\M'), ci('incentives?'), ci('komisen'), ci('insentif'), ci('佣金')]
  },
  {
    key: 'allowance',
    label: 'Allowances',
    category: 'benefit',
    patterns: [ci('allowances?'), ci('subsid(y|ies|ised|ized)'), ci('reimburse'), ci('elaun'), ci('津贴'), ci('补贴')]
  },
  {
    key: 'flexible_hours',
    label: 'Flexible Hours',
    category: 'benefit',
    patterns: [
      ci('flexi(ble)?[ -]?(working[ -])?(hours?|time|timing|schedules?|arrangements?)'),
      ci('flexibility'),
      ci('flexible work'),
      ci('work[- ]life balance')
    ]
  },
  {
    key: 'work_from_home',
    label: 'Work From Home or Hybrid',
    category: 'benefit',
    patterns: [ci('work(ing)? (from|at) home'), ci('\\mwfh\\M'), ci('remote(ly)?'), ci('hybrid')]
  },
  {
    key: 'training',
    label: 'Training and Courses',
    category: 'benefit',
    patterns: [
      ci('training'),
      ci('learning (and|&) (development|growth)'),
      ci('\\ml ?& ?d\\M'),
      ci('upskill'),
      ci('education (assistance|sponsorship|subsidy)'),
      ci('sponsorship'),
      ci('certifications?'),
      ci('courses?'),
      ci('latihan'),
      ci('培训')
    ]
  },
  {
    key: 'career_growth',
    label: 'Career Growth',
    category: 'benefit',
    patterns: [
      ci('career'),
      ci('promotion'),
      ci('progression'),
      ci('advancement'),
      ci('kerjaya'),
      ci('职业发展'),
      ci('晋升')
    ]
  },
  {
    key: 'extra_leave',
    label: 'Extra Leave',
    category: 'benefit',
    patterns: [ci('\\mleaves?\\M'), ci('\\mcuti\\M'), ci('年假'), ci('假期')]
  },
  {
    key: 'five_day_week',
    label: 'Five-Day Week',
    category: 'benefit',
    patterns: [
      ci('\\m(5|five)[- ]?(working[- ])?days?( (work(ing)?|week))?\\M'),
      ci('monday ?(to|-|–) ?friday'),
      ci('\\mmon ?(-|–|to) ?fri\\M'),
      ci('五天')
    ]
  },
  {
    key: 'parking_transport',
    label: 'Parking and Transport',
    category: 'benefit',
    patterns: [
      ci('parking'),
      ci('transport'),
      ci('shuttle'),
      ci('\\m(lrt|mrt)\\M'),
      ci('petrol'),
      ci('mileage'),
      ci('\\mtoll'),
      ci('停车')
    ]
  },
  {
    key: 'meals',
    label: 'Meals and Snacks',
    category: 'benefit',
    patterns: [
      ci('\\mmeals?\\M'),
      ci('snacks?'),
      ci('\\mlunch'),
      ci('breakfast'),
      ci('pantry'),
      ci('free (food|drinks|coffee)'),
      ci('\\mmakan\\M')
    ]
  },
  {
    key: 'wellness',
    label: 'Wellness and Fitness',
    category: 'benefit',
    patterns: [ci('wellness'), ci('well-?being'), ci('\\mgym\\M'), ci('fitness'), ci('\\msports?\\M'), ci('yoga')]
  },
  {
    key: 'team_events',
    label: 'Team Events and Trips',
    category: 'benefit',
    patterns: [
      ci('team[- ]?building'),
      ci('company trips?'),
      ci('annual (trip|dinner)'),
      ci('\\mtrips?\\M'),
      ci('outings?'),
      ci('social activities'),
      ci('employee engagement'),
      ci('festive'),
      ci('celebrations?'),
      ci('旅游')
    ]
  },
  {
    key: 'housing',
    label: 'Housing and Relocation',
    category: 'benefit',
    // Not "In-house Sport Center".
    patterns: [
      ci('accommodation'),
      ci('hostel'),
      ci('housing'),
      ci('\\mhouse ?(/|allowance|subsid)'),
      ci('rental (subsid|allowance)'),
      ci('relocation'),
      ci('宿舍')
    ]
  },
  {
    key: 'shares',
    label: 'Shares and Stock',
    category: 'benefit',
    patterns: [
      ci('stock (options?|grants?)'),
      ci('\\mESOS\\M'),
      ci('\\mESPP\\M'),
      ci('\\mRSUs?\\M'),
      ci('\\mequity\\M'),
      ci('share (options?|scheme|plan)')
    ]
  },
  {
    key: 'competitive_pay',
    label: 'Competitive Pay',
    category: 'benefit',
    patterns: [
      ci(
        '(competitive|attractive|superb|excellent|good|lucrative|handsome|great) (basic )?(salary|salaries|pay|remuneration|compensation|package|income)'
      )
    ]
  },
  {
    key: 'pay_rises',
    label: 'Pay Rises',
    category: 'benefit',
    patterns: [ci('increments?'), ci('salary (review|increase)'), ci('pay rise')]
  },
  {
    key: 'overtime_pay',
    label: 'Overtime Pay',
    category: 'benefit',
    patterns: [cs('\\mOT\\M'), ci('overtime')]
  },
  {
    key: 'epf',
    label: 'EPF and SOCSO',
    category: 'benefit',
    patterns: [ci('\\m(EPF|SOCSO|PERKESO|KWSP)\\M')]
  }
]

export const SKILL_BY_KEY = new Map(SKILL_TERMS.map((term) => [term.key, term]))

/**
 * The vocabulary as Postgres takes it: one row per pattern, for jsonb_to_recordset. `highlights` patterns match only
 * the card's selling points.
 */
export const SKILL_PATTERN_ROWS = JSON.stringify(
  SKILL_TERMS.flatMap((term) =>
    term.patterns.map(({ pattern, caseSensitive }) => ({
      key: term.key,
      pattern,
      case_sensitive: !!caseSensitive,
      highlights: term.category === 'benefit'
    }))
  )
)
