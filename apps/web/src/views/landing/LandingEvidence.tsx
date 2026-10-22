import { ChevronUp } from 'lucide-react'
import { Link } from '../../app/router'
import { routes } from '../../app/routes'
import { Logo } from '../../components/brand/Logo'
import { Accordion, type AccordionItem } from '../../components/ui/Accordion'
import { TextLink } from '../../components/ui/TextLink'
import { LandingActionLink } from './LandingActionLink'

export const evidenceStats = [
  {
    citation: 1,
    title: 'Skill-Related Underemployment',
    value: '74.3%',
    description: 'of employed tertiary-educated 15–24-year-olds worked in semi-skilled or low-skilled jobs in Q2 2026.',
    source: 'OpenDOSM SRU By Age',
    date: 'Q2 2026 · Updated 11 August 2026',
    href: 'https://open.dosm.gov.my/data-catalogue/lfs_qtr_sru_age'
  },
  {
    citation: 2,
    title: 'ICT Graduate Employment',
    value: '92.5%',
    description: 'of ICT graduates in the labour force were employed: 15,767 of 17,043 in the 2025 tracer study.',
    source: 'MOHE Graduate Tracer Study',
    date: '2025 Cohort · Published 14 May 2026',
    href: 'https://www.mohe.gov.my/en/download/statistics/2025-1-1/1845-bab-7-skpg-2025-pdf/file'
  },
  {
    citation: 3,
    title: 'Employers Assess AI Knowledge',
    value: '70%',
    description: 'of Malaysian businesses evaluate candidates’ AI knowledge, according to the report.',
    source: 'JobStreet Hiring Report',
    date: 'Published 23 April 2025',
    href: 'https://my.jobstreet.com/about/news/article/hiring-compensation-benefits-report-2025'
  }
]

const sourcesData = [
  {
    title: 'O*NET 30.1',
    description: 'What each job does, task by task',
    note: 'CC BY 4.0 · 2026'
  },
  {
    title: 'Anthropic Economic Index',
    description: 'How people use AI, by task and country',
    note: 'May and Aug 2026'
  },
  {
    title: 'DOSM Job Market Insights',
    description: 'Online job ads by occupation, every quarter',
    note: 'Q3 2019 to Q2 2026'
  },
  {
    title: 'MyCOL',
    description: 'Skills Malaysia is short of',
    note: '2025 edition'
  },
  {
    title: 'Epoch AI',
    description: 'What AI systems can now do',
    note: 'Context only'
  }
]

const nationalSampleBars = [
  { name: 'Reviewing AI-Written Output', percentage: 64 },
  { name: 'Accessibility', percentage: 58 },
  { name: 'Data Literacy for AI Tools', percentage: 52 },
  { name: 'Testing AI Output', percentage: 41 }
]

const faqItems: AccordionItem[] = [
  {
    id: 'verdicts',
    question: 'Where Do the Verdicts Come From?',
    answer:
      'From fixed rules over dated public data: O*NET tasks, the Anthropic Economic Index and DOSM job-ad counts. The AI only explains the result.'
  },
  {
    id: 'ai',
    question: 'Is the AI Making Things Up?',
    answer:
      'Fixed rules set each verdict from dated source data. The AI only explains the result in plain language with citations.'
  },
  {
    id: 'privacy',
    question: 'What Do You Store About Me?',
    answer:
      'Each opt-in check-up adds an anonymous job code, six skill levels and a date. The National View shows grouped patterns.'
  },
  {
    id: 'cat',
    question: 'Why a Cat?',
    answer: 'Kopi opens the box with you, one question and one verdict at a time.'
  },
  {
    id: 'free',
    question: 'Is It Free?',
    answer: 'The pilot check-up and your plan are free.'
  }
]

const darkSectionStyle = {
  '--color-bg-default': '#10100b',
  '--color-bg-panel': '#1b1a13',
  '--color-text-primary': '#f3f2ed',
  '--color-text-muted': '#acaba3',
  '--color-border-subtle': '#37362f',
  '--color-border-control': '#6a6961',
  colorScheme: 'dark'
} as React.CSSProperties

function SourcesSection() {
  return (
    <section id="data-sources" className="bg-bg-default px-6 py-16 lg:px-[120px] lg:py-24">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 lg:gap-10">
        <header className="mx-auto flex max-w-4xl flex-col gap-4 text-center">
          <h2 className="text-balance font-extrabold text-display text-text-primary lg:text-display-l">
            Rules Decide. The AI Explains.
          </h2>
          <p className="max-w-[700px] text-body-m text-text-muted lg:text-body-l">
            Kotak reads dated public data, applies fixed rules, and only then asks Claude to put the result into two
            plain sentences with citations.
          </p>
        </header>

        {/* Desktop 5 cards in a row; Phone vertical stack */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {sourcesData.map((source) => (
            <article
              key={source.title}
              className="flex min-w-0 flex-row items-center justify-between gap-3 rounded-md border border-border-subtle bg-bg-panel p-4 lg:flex-col lg:items-start lg:gap-2 lg:p-5"
            >
              <div className="flex min-w-0 flex-col gap-1 lg:gap-2">
                <h3 className="text-label-l text-text-primary">{source.title}</h3>
                <p className="text-body-s text-text-muted">{source.description}</p>
              </div>
              <p className="shrink-0 text-right font-mono text-mono-s text-text-muted lg:mt-auto lg:text-left">
                {source.note}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function NationalViewSection() {
  return (
    <section id="national-view" className="bg-bg-panel px-6 py-16 lg:px-[120px] lg:py-24">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
        <div className="flex min-w-0 flex-col items-start gap-5">
          <p className="font-mono text-mono-s text-text-muted">For TalentCorp, HRD Corp and MOHE</p>
          <h2 className="text-balance font-extrabold text-display text-text-primary lg:text-display-l">
            A Live, Anonymous View of the Skills Gap.
          </h2>
          <p className="text-body-m text-text-muted lg:text-body-l">
            Each check-up that opts in adds an anonymous job code, six skill levels and a date. Totals show only for
            groups of 10 or more.
          </p>
          <LandingActionLink to={routes.national} variant="secondary" showArrow className="w-full sm:w-auto">
            See the National View
          </LandingActionLink>
        </div>

        {/* Mini view card matching Figma */}
        <section
          aria-labelledby="mini-view-title"
          className="flex min-w-0 flex-col gap-3 rounded-md border border-border-subtle bg-bg-default p-4 lg:w-[460px] lg:gap-3 lg:p-6"
        >
          <h3 id="mini-view-title" className="text-label-m text-text-primary">
            Rising Skills Malaysians Lack Most · Sample
          </h3>

          <div className="flex flex-col gap-3">
            {nationalSampleBars.map((bar) => (
              <div key={bar.name} className="flex flex-col gap-1">
                <span className="text-label-s text-text-primary">{bar.name}</span>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full border border-border-subtle bg-bg-panel"
                  role="progressbar"
                  aria-valuenow={bar.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${bar.name}: ${bar.percentage}% of check-ups below target`}
                >
                  <div
                    className="h-full rounded-full bg-text-primary transition-[width] duration-200 ease-out"
                    style={{ width: `${bar.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Preserved cited evidence figures for screen readers and research citations [1], [2], [3] */}
        <div className="sr-only" aria-label="Cited national evidence figures">
          {evidenceStats.map((stat) => (
            <article key={stat.citation}>
              <h4>
                [{stat.citation}] {stat.title}: {stat.value}
              </h4>
              <p>{stat.description}</p>
              <p>
                <TextLink href={stat.href} external>
                  Source: {stat.source} · {stat.date}
                </TextLink>
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function StartAndFaqSection() {
  return (
    <section style={darkSectionStyle} className="bg-bg-default px-6 py-16 text-text-primary lg:px-[120px] lg:py-24">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 lg:grid-cols-[460px_minmax(0,1fr)] lg:gap-20">
        <div className="flex min-w-0 flex-col items-start gap-5">
          <Link
            to="/"
            aria-label="Kotak Home"
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default"
          >
            <Logo variant="icon" className="h-[72px] w-[72px] lg:h-[96px] lg:w-[96px]" />
          </Link>
          <h2 className="text-balance font-extrabold text-display text-text-primary lg:text-display-l">
            Open the Box in Three Minutes.
          </h2>
          <p className="text-body-m text-text-muted lg:text-body-l">
            No account needed for the pilot. Your check-up stays on your device.
          </p>
          <LandingActionLink to={routes.signIn} variant="primary" showArrow className="w-full sm:w-auto">
            Sign In as Guest
          </LandingActionLink>
        </div>

        <Accordion items={faqItems} defaultOpenIds={['verdicts']} className="w-full" />
      </div>
    </section>
  )
}

export function LandingEvidence() {
  return (
    <>
      <SourcesSection />
      <NationalViewSection />
      <StartAndFaqSection />
    </>
  )
}

export function LandingFooter() {
  return (
    <footer style={darkSectionStyle} className="bg-bg-panel px-6 py-10 text-text-primary lg:px-[120px] lg:py-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-8 border-b border-border-subtle pb-8 lg:flex-row lg:justify-between lg:gap-12">
          <div className="flex items-center">
            <Link
              to="/"
              aria-label="Kotak Home"
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default"
            >
              <Logo variant="lockup" className="h-10 w-auto" />
            </Link>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-16 lg:gap-20">
            <nav aria-label="Product" className="flex flex-col gap-2">
              <h2 className="text-label-m text-text-primary">Product</h2>
              <ul className="space-y-1.5">
                <li>
                  <a className="text-body-s text-text-muted hover:text-text-primary" href="#how-it-works">
                    How It Works
                  </a>
                </li>
                <li>
                  <a className="text-body-s text-text-muted hover:text-text-primary" href="#national-view">
                    National View
                  </a>
                </li>
                <li>
                  <a className="text-body-s text-text-muted hover:text-text-primary" href="#data-sources">
                    Data Sources
                  </a>
                </li>
              </ul>
            </nav>

            <div className="flex flex-col gap-2">
              <h2 className="text-label-m text-text-primary">Project</h2>
              <ul className="space-y-1.5 text-body-s text-text-muted">
                <li>SDC Hackathon 2026</li>
                <li>Domain 1: Aiversecity</li>
                <li>
                  <TextLink
                    href="https://github.com/TolongLabs/sdc-hack"
                    external
                    className="text-text-muted hover:text-text-primary"
                  >
                    GitHub
                  </TextLink>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-label-m text-text-primary">Credits</h2>
              <ul className="space-y-1.5 text-body-s text-text-muted">
                <li>Kopi: Live2D sample model Hijiki © Live2D Inc.</li>
                <li>Icons: Lucide (ISC)</li>
                <li>Data: O*NET, OpenDOSM (CC BY 4.0)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <p className="text-body-s text-text-muted">Selamat petang from Kuala Lumpur.</p>
          <a
            href="#top"
            aria-label="Back to top"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-control bg-bg-default text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default"
          >
            <ChevronUp className="h-5 w-5 stroke-current" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  )
}
