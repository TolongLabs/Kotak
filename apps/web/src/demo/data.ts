import type {
  ChangeItem,
  Corner,
  DividendNote,
  Goal,
  ImpactArea,
  JobSuggestion,
  NationalView,
  Readiness,
  RoadmapStep,
  Role,
  Snapshot,
  SourceRef,
  StatTile,
  User
} from './types'

// Sample values from the approved mockups. Screens read these until engine outputs replace them.

export const user: User = {
  name: 'Guest',
  greeting: 'Good Morning, Guest',
  jobTitle: 'Front-End Developer',
  targetRole: 'Accessibility Engineer',
  location: 'Kuala Lumpur',
  lastCheckUp: 'Thu 22 Oct 2026'
}

export const snapshots: Snapshot[] = [
  { id: '2026-04', label: 'April 2026' },
  { id: '2026-05', label: 'May 2026' }
]

export const corners: Corner[] = [
  {
    id: 'working-with-ai-coding-tools',
    name: 'Working With AI Coding Tools',
    verdict: 'rising',
    you: 3,
    neededSlow: 3,
    neededFast: 3
  },
  {
    id: 'reviewing-ai-written-code',
    name: 'Reviewing AI-Written Code',
    verdict: 'rising',
    you: 1,
    neededSlow: 3,
    neededFast: 3,
    reasoning:
      'More of the code in this job is now drafted by AI [2]. Someone still has to check it before it ships, and the task list for the role says so [3].',
    sources: [2, 3]
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    verdict: 'rising',
    you: 1,
    neededSlow: 3,
    neededFast: 3,
    reasoning:
      'Front-end job ads that ask for accessibility rose 14% in a year [1][8]. AI tools still miss most screen-reader problems, so people who can test with one stay in demand [2].',
    sources: [1, 2, 8]
  },
  {
    id: 'hand-coded-layouts',
    name: 'Hand-Coded Layouts',
    verdict: 'declining',
    you: 3,
    neededSlow: 1,
    neededFast: 1
  },
  {
    id: 'testing',
    name: 'Testing',
    verdict: 'split',
    you: 2,
    neededSlow: 3,
    neededFast: 3,
    reasoning:
      'AI use in testing tasks grew [2], but job ads asking for testing stayed flat [1]. Kopi shows two plans until the sources agree.',
    sources: [2, 1]
  },
  {
    id: 'design-systems',
    name: 'Design Systems',
    verdict: 'steady',
    you: 2,
    neededSlow: 2,
    neededFast: 3
  }
]

export const sources: SourceRef[] = [
  {
    n: 1,
    name: 'DOSM Job Market Insights, Q2 2026',
    detail: 'Table 3 · online job ads by occupation · read 22 Oct 2026',
    href: 'https://www.dosm.gov.my/'
  },
  {
    n: 2,
    name: 'Anthropic Economic Index, April 2026',
    detail: 'Malaysia rows · web development tasks · read 22 Oct 2026',
    href: 'https://www.anthropic.com/economic-index'
  },
  {
    n: 3,
    name: 'O*NET 30.1 · Web Developers 15-1254.00',
    detail: 'Task statements · read 22 Oct 2026',
    href: 'https://www.onetonline.org/link/summary/15-1254.00'
  },
  {
    n: 4,
    name: 'GitHub Skills: Review Pull Requests',
    detail: 'Free course · skills.github.com',
    href: 'https://skills.github.com/'
  },
  {
    n: 5,
    name: 'W3C WAI: Easy Checks',
    detail: 'Free guide · w3.org/WAI',
    href: 'https://www.w3.org/WAI/test-evaluate/preliminary/'
  },
  {
    n: 6,
    name: 'MDN Web Docs: ARIA',
    detail: 'Free guide · developer.mozilla.org',
    href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA'
  },
  {
    n: 7,
    name: 'freeCodeCamp: Quality Assurance',
    detail: 'Free course · freecodecamp.org',
    href: 'https://www.freecodecamp.org/learn/quality-assurance/'
  },
  {
    n: 8,
    name: 'DOSM Job Market Insights, Q2 2025',
    detail: 'Table 3 · same series, one year earlier · read 22 Oct 2026',
    href: 'https://www.dosm.gov.my/'
  },
  {
    n: 9,
    name: 'Anthropic Economic Index, May 2026',
    detail: 'Malaysia rows · design and testing tasks · sample',
    href: 'https://www.anthropic.com/economic-index'
  },
  {
    n: 10,
    name: 'O*NET 30.1 · related occupations',
    detail: 'Shared work activities with Web Developers · read 22 Oct 2026',
    href: 'https://www.onetonline.org/link/summary/15-1254.00'
  }
]

export const roles: Role[] = [
  {
    id: 'front-end-developer',
    title: 'Front-End Developer',
    isCurrentJob: true,
    fit: 67,
    outlook: 'steady',
    missing: 'reviewing AI-written code, accessibility.'
  },
  {
    id: 'design-systems-developer',
    title: 'Design Systems Developer',
    isCurrentJob: false,
    fit: 74,
    outlook: 'steady',
    missing: 'design tokens in code.'
  },
  {
    id: 'accessibility-engineer',
    title: 'Accessibility Engineer',
    isCurrentJob: false,
    fit: 61,
    outlook: 'rising',
    missing: 'screen-reader testing, WCAG audits.',
    reasoning:
      'Accessibility engineer job ads rose 9% in a year [1]. Four of its six skills overlap yours, so your gap is mostly screen-reader testing and audits [10].',
    sources: [1, 10]
  }
]

export const roadmap: RoadmapStep[] = [
  {
    id: 'review-ai-written-pull-requests',
    state: 'next',
    weeks: [1, 4],
    when: 'Weeks 1–4 · 2–29 Nov',
    skill: 'Reviewing AI-Written Code',
    title: 'Review AI-Written Pull Requests',
    description: 'Review three AI-written pull requests and fix what they get wrong.',
    gain: '+2 Levels · Reviewing AI-Written Code',
    hoursPerWeek: 3,
    resource: {
      label: 'GitHub Skills: Review Pull Requests',
      href: 'https://skills.github.com/',
      citation: 4
    },
    sdgs: [8]
  },
  {
    id: 'audit-pages-with-a-screen-reader',
    state: 'todo',
    weeks: [5, 8],
    when: 'Weeks 5–8 · 30 Nov–27 Dec',
    skill: 'Accessibility',
    title: 'Audit Pages With a Screen Reader',
    description: 'Run one screen-reader audit a week and fix every blocker you find.',
    gain: '+2 Levels · Accessibility',
    hoursPerWeek: 4,
    resource: {
      label: 'W3C WAI: Easy Checks',
      href: 'https://www.w3.org/WAI/test-evaluate/preliminary/',
      citation: 5
    },
    sdgs: [10, 3]
  },
  {
    id: 'make-a-clinic-booking-page-accessible',
    state: 'todo',
    weeks: [9, 12],
    when: 'Weeks 9–12 · Practice Project',
    skill: 'Design Systems',
    title: 'Make a Clinic Booking Page Accessible',
    description: 'Rebuild a public clinic booking page so it works with a screen reader.',
    gain: '+1 Level · Design Systems',
    hoursPerWeek: 4,
    resource: {
      label: 'MDN Web Docs: ARIA',
      href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA',
      citation: 6
    },
    sdgs: [3, 10]
  },
  {
    id: 'write-tests-for-ai-written-code',
    state: 'todo',
    weeks: [9, 12],
    when: 'Weeks 9–12 · If AI Uptake Runs Fast',
    skill: 'Testing',
    title: 'Write Tests for AI-Written Code',
    description: 'Only if uptake runs fast: add tests that catch what AI-written code gets wrong.',
    gain: '+1 Level · Testing',
    hoursPerWeek: 2,
    resource: {
      label: 'freeCodeCamp: Quality Assurance',
      href: 'https://www.freecodecamp.org/learn/quality-assurance/',
      citation: 7
    },
    sdgs: [8],
    conditional: 'If AI Uptake Runs Fast'
  }
]

export const readiness: Readiness = {
  title: 'Readiness for Accessibility Engineer',
  caption: 'Solid: your plan · Dashed: fast uptake',
  readyBy: 'Ready by Week 8 · 81%',
  threshold: 'Ready = 80% Fit',
  yLabels: ['60%', '80%', '100%'],
  xLabels: ['W0', 'W4', 'W8', 'W12'],
  // Read off the approved mockup's chart markers and lines.
  points: [
    { week: 0, plan: 61, fast: 61 },
    { week: 4, plan: 70, fast: 72 },
    { week: 8, plan: 81, fast: 82 },
    { week: 12, plan: 88, fast: 93 }
  ]
}

export const dividend: DividendNote = {
  title: 'Your AI Dividend',
  body: 'AI now drafts much of your layout work [2]. Put 4 of the hours it saves you each week into this plan.',
  lessImportant: {
    verdict: 'declining',
    text: 'Hand-Coded Layouts: let AI draft them and spend fewer hours here [1].'
  },
  sources: [2, 1]
}

export const changes: ChangeItem[] = [
  {
    source: 'New data · Economic Index, May 2026',
    skill: 'Testing',
    from: 'split',
    to: 'rising',
    why: 'AI use in testing tasks grew again in May [9]. The slow and fast plans now agree, so Kopi calls it rising.',
    effect: 'Your roadmap: “Write Tests for AI-Written Code” joined weeks 9–12.'
  },
  {
    source: 'New data · Economic Index, May 2026',
    skill: 'Design Systems',
    from: 'steady',
    to: 'rising',
    why: 'More design-system work now runs through AI tools [9], and job ads held steady [1].',
    effect: 'Design Systems Developer is now your top match at 74%.'
  }
]

export const dashboardStats: StatTile[] = [
  {
    id: 'fit',
    label: 'Fit for Accessibility Engineer',
    value: '61%',
    caption: 'Ready by Week 8 at 4 h a week'
  },
  {
    id: 'this-week',
    label: 'This Week',
    value: '1 of 4 h',
    caption: 'Review AI-Written Pull Requests',
    progress: { label: 'Week 1 of 12', value: '25%' }
  },
  {
    id: 'what-changed',
    label: 'What Changed',
    value: '2 Updates Waiting',
    caption: 'May 2026 data is in. Open What Changed to apply it.',
    change: { from: 'split', to: 'rising' }
  },
  {
    id: 'data-freshness',
    label: 'Data Freshness',
    value: 'Apr 2026',
    caption: 'Next DOSM release: Q3 2026'
  }
]

export const jobSuggestions: JobSuggestion[] = [
  {
    title: 'Front-End Developer',
    onet: '15-1254.00',
    onetTitle: 'Web Developers'
  },
  {
    title: 'Front Desk Clerk',
    onet: '43-4081.00',
    onetTitle: 'Hotel, Motel and Resort Desk Clerks'
  },
  {
    title: 'Frontline Supervisor',
    onet: '43-1011.00',
    onetTitle: 'First-Line Supervisors of Office Workers'
  }
]

export const goals: Goal[] = [
  {
    id: 'stay',
    title: 'Stay Strong in My Job',
    description: 'Keep your current role safe as AI changes it.'
  },
  {
    id: 'target',
    title: 'Move to a Role I Have in Mind',
    description: 'Tell Kopi the role; the questions test you against it.'
  },
  {
    id: 'explore',
    title: 'Show Me Where I Could Go',
    description: 'Kopi suggests rising roles that fit you.'
  }
]

export const impactAreas: ImpactArea[] = [
  { sdg: 3, label: 'Good Health' },
  { sdg: 4, label: 'Quality Education' },
  { sdg: 8, label: 'Decent Work' },
  { sdg: 10, label: 'Reduced Inequalities' },
  { sdg: 13, label: 'Climate Action' }
]

export const nationalView: NationalView = {
  title: 'Where Malaysian Workers Lag on Rising Skills',
  intro: 'Each finished check-up stores only a job code, six skill levels and a date. No names, no answers.',
  sample: {
    title: 'Sample Data',
    body: 'Real totals replace these once 10 people in a group finish a check-up.'
  },
  filters: {
    occupationGroup: { label: 'Occupation Group', value: 'All Occupations' },
    quarter: { label: 'Quarter', value: 'May 2026' }
  },
  gapsTitle: 'Share of Check-Ups Below the 2027 Level',
  rows: [
    { skill: 'Reviewing AI-Written Output', share: 64, verdict: 'rising' },
    { skill: 'Accessibility', share: 58, verdict: 'rising' },
    { skill: 'Data Literacy for AI Tools', share: 52, verdict: 'rising' },
    { skill: 'Prompting and Checking AI Image Tools', share: 47, verdict: 'rising' },
    { skill: 'Testing AI Output', share: 41, verdict: 'split' },
    { skill: 'Contract Review With AI Drafts', share: 33, verdict: 'rising' },
    { skill: 'Cloud Cost Control', share: 29, verdict: 'steady' },
    { skill: 'Cybersecurity Basics', share: 26, verdict: 'rising' }
  ],
  howCounted: {
    title: 'How This Is Counted',
    steps: [
      '1. Each check-up compares six self-reported levels with what the role needs by Oct 2027.',
      '2. A skill counts here when someone sits below its 2027 level and its verdict is Rising or Split.',
      '3. Totals appear only for groups of 10 or more people.'
    ],
    privacy: 'Stored: job code, six levels, date. Never names, emails or answers.',
    downloadLabel: 'Download as Open Data (CSV)',
    sampleLabel: 'Sample: 1,240 check-ups · May 2026'
  }
}

export const noMatchSuggestions: string[] = ['Web Developer', 'Software Developer', 'UI Designer']
