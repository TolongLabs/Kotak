// The skills, tools and languages Kotak looks for in Malaysian job ads (#271). Postgres matches each listing's title,
// summary, card text without the employer's name, and description against these patterns (stats.ts), so they use its
// regular-expression syntax: \m and \M mark the start and end of a word, and (?!…) looks ahead. A pattern ignores case unless `caseSensitive`
// is set, which keeps words like "Excel", "Swift" or "React" from matching ordinary English.
//
// The tools started from the O*NET Hot Technologies examples (data/onet/hot-technologies.json), renamed the way ads
// write them, and were checked against the 4,318 listings scraped on 22 October 2026: each pattern's matches were
// read for false hits. Bump SKILL_VOCABULARY_VERSION whenever a pattern changes, so every listing is matched again.

export type SkillCategory = 'ai' | 'tool' | 'language'

export interface SkillTerm {
  key: string
  label: string
  category: SkillCategory
  patterns: Array<{ pattern: string; caseSensitive?: boolean }>
}

export const SKILL_VOCABULARY_VERSION = '2026-10-23.2'

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
  }
]

export const SKILL_BY_KEY = new Map(SKILL_TERMS.map((term) => [term.key, term]))

/** The vocabulary as Postgres takes it: one row per pattern, for jsonb_to_recordset. */
export const SKILL_PATTERN_ROWS = JSON.stringify(
  SKILL_TERMS.flatMap((term) =>
    term.patterns.map(({ pattern, caseSensitive }) => ({ key: term.key, pattern, case_sensitive: !!caseSensitive }))
  )
)
