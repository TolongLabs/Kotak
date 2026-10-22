import { ArrowUp } from 'lucide-react'
import { Link } from '../../app/router'
import { routes } from '../../app/routes'
import { Logo } from '../../components/brand/Logo'
import { Accordion, type AccordionItem } from '../../components/ui/Accordion'
import { TextLink } from '../../components/ui/TextLink'
import { LandingActionLink } from './LandingActionLink'

const privacyCopy =
  'Each opt-in check-up adds an anonymous job code, skill levels and a date. The National View shows grouped patterns.'

const sourceCards = [
  {
    citation: 1,
    title: 'OpenDOSM SRU By Age',
    description: 'Quarterly skills-related underemployment by age.',
    note: 'Q2 2026 · Updated 11 August 2026',
    href: 'https://open.dosm.gov.my/data-catalogue/lfs_qtr_sru_age'
  },
  {
    citation: 2,
    title: 'MOHE Graduate Tracer Study',
    description: 'Graduate employment rates by field and institution type.',
    note: '2025 Cohort · Published 14 May 2026',
    href: 'https://www.mohe.gov.my/en/download/statistics/2025-1-1/1845-bab-7-skpg-2025-pdf/file'
  },
  {
    citation: 3,
    title: 'JobStreet Hiring Report',
    description: 'A survey of employer views on AI knowledge in hiring.',
    note: 'Published 23 April 2025',
    href: 'https://my.jobstreet.com/about/news/article/hiring-compensation-benefits-report-2025'
  }
]

const evidenceStats = [
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

const faqItems: AccordionItem[] = [
  {
    id: 'verdicts',
    question: 'Where Do the Verdicts Come From?',
    answer:
      'From fixed rules over dated data in each role bundle. The AI explains the result in plain language with citations.'
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
    answer: privacyCopy
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

function SourcesSection() {
  return (
    <section id="data-sources" className="px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="mx-auto flex max-w-4xl flex-col gap-4 text-center">
          <h2 className="text-balance text-display text-text-primary lg:text-display-l">
            Rules Decide. The AI Explains.
          </h2>
          <p className="text-body-m text-text-muted lg:text-body-l">
            Kotak reads dated public data, applies fixed rules, and only then asks Claude to explain the result with
            citations.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {sourceCards.map((source) => (
            <article key={source.citation} className="surface-card flex min-w-0 flex-col gap-2 p-4 lg:p-5">
              <h3 className="text-label-l text-text-primary">{source.title}</h3>
              <p className="text-body-s text-text-muted">{source.description}</p>
              <p className="mt-auto font-mono text-mono-s text-text-muted">{source.note}</p>
              <TextLink href={source.href} external>
                [{source.citation}] Open Source
              </TextLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function NationalViewSection() {
  return (
    <section id="national-view" className="bg-bg-panel px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
        <div className="flex min-w-0 flex-col items-start gap-5">
          <p className="font-mono text-mono-s text-text-muted">For TalentCorp, HRD Corp and MOHE</p>
          <h2 className="text-balance text-display text-text-primary lg:text-display-l">
            A Live, Anonymous View of the Skills Gap.
          </h2>
          <p className="text-body-m text-text-muted lg:text-body-l">
            National indicators add context to the skills gap. These figures cover underemployment, graduate employment
            and employer views on AI knowledge. Each figure links to its source and date.
          </p>
          <LandingActionLink to={routes.national} variant="secondary" className="w-full sm:w-auto">
            See the National View
          </LandingActionLink>
        </div>

        <section className="surface-card min-w-0 space-y-4 p-4 sm:p-6" aria-labelledby="national-preview-title">
          <h3 id="national-preview-title" className="text-label-m text-text-primary">
            Malaysian Evidence
          </h3>

          <div className="space-y-4">
            {evidenceStats.map((stat) => (
              <article
                key={stat.citation}
                className="space-y-2 rounded-md border border-border-subtle bg-bg-default p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h4 className="text-label-m text-text-primary">{stat.title}</h4>
                  <p className="font-mono text-title-s text-text-primary">{stat.value}</p>
                </div>
                <p className="text-body-s text-text-muted">{stat.description}</p>
                <p className="font-mono text-mono-s text-text-muted">
                  <TextLink href={stat.href} external>
                    [{stat.citation}] {stat.source} · {stat.date}
                  </TextLink>
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

function StartAndFaqSection() {
  return (
    <section className="bg-text-primary px-6 py-16 text-bg-default dark:bg-bg-default dark:text-text-primary lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[460px_minmax(0,1fr)] lg:gap-20">
        <div className="flex min-w-0 flex-col items-start gap-5">
          <Link
            to="/"
            aria-label="Kotak Home"
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default"
          >
            <Logo variant="icon" className="h-20 w-20 lg:h-24 lg:w-24" />
          </Link>
          <h2 className="text-balance text-display text-bg-default dark:text-text-primary lg:text-display-l">
            Open the Box With Kopi.
          </h2>
          <p className="text-body-m text-bg-default dark:text-text-muted lg:text-body-l">
            No account needed for the pilot. Answer a few questions and see a plan you can start this week.
          </p>
          <LandingActionLink to={routes.checkUp} variant="primary" className="w-full sm:w-auto">
            Start Your Free Check-Up
          </LandingActionLink>
        </div>

        <Accordion
          items={faqItems}
          defaultOpenIds={['verdicts']}
          className="[&_button]:text-bg-default [&_p]:text-bg-default dark:[&_button]:text-text-primary dark:[&_p]:text-text-muted"
        />
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
    <footer className="bg-text-primary px-6 py-10 text-bg-default dark:bg-bg-panel dark:text-text-primary lg:px-10 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 border-b border-border-control pb-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-12">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              aria-label="Kotak Home"
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default"
            >
              <Logo variant="icon" className="h-12 w-12" />
            </Link>
            <span className="text-title-l font-extrabold lowercase text-bg-default dark:text-text-primary">kotak</span>
          </div>

          <nav aria-label="Product">
            <h2 className="text-label-m text-bg-default dark:text-text-primary">Product</h2>
            <ul className="mt-2 space-y-1">
              <li>
                <a className="text-body-s text-bg-default dark:text-text-muted" href="#how-it-works">
                  How It Works
                </a>
              </li>
              <li>
                <a className="text-body-s text-bg-default dark:text-text-muted" href="#national-view">
                  National View
                </a>
              </li>
              <li>
                <a className="text-body-s text-bg-default dark:text-text-muted" href="#data-sources">
                  Data Sources
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-label-m text-bg-default dark:text-text-primary">Project</h2>
            <ul className="mt-2 space-y-1 text-body-s text-bg-default dark:text-text-muted">
              <li>SDC Hackathon</li>
              <li>Aiversecity</li>
              <li>
                <TextLink
                  href="https://github.com/TolongLabs/sdc-hack"
                  external
                  className="text-bg-default dark:text-text-muted"
                >
                  GitHub
                </TextLink>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-label-m text-bg-default dark:text-text-primary">Credits</h2>
            <ul className="mt-2 space-y-1 text-body-s text-bg-default dark:text-text-muted">
              <li>Kopi: Live2D sample model Hijiki © Live2D Inc.</li>
              <li>Icons: Lucide (ISC)</li>
              <li>Data: OpenDOSM, MOHE and JobStreet</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <p className="text-body-s text-bg-default dark:text-text-muted">Selamat petang from Kuala Lumpur.</p>
          <a
            href="#top"
            aria-label="Back to top"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-control bg-text-primary text-bg-default transition-colors duration-150 ease-out hover:bg-bg-panel hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default dark:bg-bg-panel dark:text-text-primary"
          >
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  )
}
