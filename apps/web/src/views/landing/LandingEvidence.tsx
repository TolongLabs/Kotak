import { ArrowUpRight, ChevronUp } from 'lucide-react'
import { Link } from '../../app/router'
import { routes } from '../../app/routes'
import { Logo } from '../../components/brand/Logo'
import { Accordion, type AccordionItem } from '../../components/ui/Accordion'
import { TextLink } from '../../components/ui/TextLink'
import { FooterWordmark } from './FooterWordmark'
import { LandingActionLink } from './LandingActionLink'
import { LandingSection, SectionHeading } from './LandingSection'

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
    answer: 'Your check-up stays on your device. No account or personal details are needed for the pilot.'
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

const focusRing =
  'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default'
const footerLink = `inline-flex min-h-11 items-center gap-2 text-title-l text-text-primary decoration-accent-box decoration-2 underline-offset-8 hover:underline lg:text-display ${focusRing}`

function SourcesSection() {
  return (
    <LandingSection id="data-sources" tone="default">
      <SectionHeading title="Rules Decide. The AI Explains.">
        Kotak reads dated public data, applies fixed rules, and only then asks Claude to put the result into two plain
        sentences with citations.
      </SectionHeading>

      {/* A directory, after mkdir.directory: one ruled row per source. */}
      <ul className="border-b border-border-subtle">
        {sourcesData.map((source) => (
          <li
            key={source.title}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 border-t border-border-subtle py-5 lg:grid-cols-12 lg:py-6"
          >
            <h3 className="col-start-1 row-start-1 text-title-l text-text-primary lg:col-span-5 lg:text-display">
              {source.title}
            </h3>
            <p className="col-span-2 row-start-2 text-body-m text-text-muted lg:col-span-5 lg:col-start-6 lg:row-start-1 lg:text-body-l">
              {source.description}
            </p>
            <p className="col-start-2 row-start-1 text-right font-mono text-mono-s text-text-muted lg:col-span-2 lg:col-start-11">
              {source.note}
            </p>
          </li>
        ))}
      </ul>

      {/* Preserved cited evidence figures for screen readers and research citations [1], [2], [3] */}
      <div className="sr-only" aria-label="Cited evidence figures">
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
    </LandingSection>
  )
}

function StartAndFaqSection() {
  return (
    <LandingSection tone="panel">
      {/* The call to action holds the block's floor and the FAQ hangs from its top, so opening an answer moves
          neither until the FAQ outgrows the block. */}
      <div className="grid grid-cols-1 gap-12 lg:min-h-[560px] lg:grid-cols-12 lg:gap-6">
        <div className="flex min-w-0 flex-col items-start justify-end gap-6 lg:col-span-6">
          <Link to="/" aria-label="Kotak Home" className={focusRing}>
            <Logo variant="icon" className="h-[72px] w-[72px] lg:h-[96px] lg:w-[96px]" />
          </Link>
          <h2 className="text-balance font-extrabold text-display-l text-text-primary lg:text-display-xl">
            Open the Box in Three Minutes.
          </h2>
          <p className="text-body-m text-text-muted lg:text-body-l">
            No account needed for the pilot. Your check-up stays on your device.
          </p>
          <LandingActionLink to={routes.signIn} variant="primary" showArrow className="w-full sm:w-auto">
            Sign In as Guest
          </LandingActionLink>
        </div>

        <Accordion
          items={faqItems}
          defaultOpenIds={['verdicts']}
          className="w-full self-start lg:col-span-5 lg:col-start-8"
        />
      </div>
    </LandingSection>
  )
}

export function LandingEvidence() {
  return (
    <>
      <SourcesSection />
      <StartAndFaqSection />
    </>
  )
}

// After footer.design: links on a ruled grid up top, credits, then the wordmark as the page's floor.
export function LandingFooter() {
  return (
    <footer className="tone-dark flex min-h-svh flex-col overflow-hidden bg-bg-default px-6 pt-12 text-text-primary lg:px-16">
      <div className="mx-auto flex w-full max-w-[1312px] flex-1 flex-col">
        <div className="grid grid-cols-1 border-t border-border-subtle sm:grid-cols-2 lg:grid-cols-12">
          <div className="flex flex-col items-start gap-6 border-b border-border-subtle py-6 sm:col-span-2 lg:col-span-5 lg:border-b-0 lg:pr-8">
            <Link to="/" aria-label="Kotak Home" className={focusRing}>
              <Logo variant="icon" className="h-12 w-12" />
            </Link>
            <p className="max-w-[460px] text-balance font-extrabold text-title-l text-text-primary lg:text-display">
              Selamat petang from Kuala Lumpur.
            </p>
          </div>

          <nav
            aria-label="Product"
            className="flex flex-col gap-3 border-b border-border-subtle py-6 sm:border-b-0 sm:pr-8 lg:col-span-4 lg:border-l lg:px-8"
          >
            <h2 className="text-label-m text-text-muted">Product</h2>
            <ul>
              <li>
                <a className={footerLink} href="#how-it-works">
                  How It Works
                </a>
              </li>
              <li>
                <a className={footerLink} href="#data-sources">
                  Data Sources
                </a>
              </li>
              <li>
                <Link className={footerLink} to={routes.signIn}>
                  Sign In
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex flex-col gap-3 py-6 sm:border-l sm:border-border-subtle sm:pl-8 lg:col-span-3">
            <h2 className="text-label-m text-text-muted">Project</h2>
            <a className={footerLink} href="https://github.com/TolongLabs/sdc-hack" target="_blank" rel="noreferrer">
              GitHub
              <ArrowUpRight className="h-6 w-6 shrink-0 stroke-current" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <ul className="space-y-1 text-body-m text-text-muted">
              <li>SDC Hackathon 2026</li>
              <li>Domain 1: Aiversecity</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-border-subtle py-6 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="flex max-w-[860px] flex-col gap-2">
            <h2 className="text-label-m text-text-muted">Credits</h2>
            <ul className="space-y-1.5 text-body-s text-text-muted">
              {/* The notice Live2D designates for apps that use its Original Characters, word for word:
                  https://www.live2d.com/en/learn/sample/model-terms/ (#142) */}
              <li>
                Kopi: Live2D sample model Hijiki. This content uses sample data owned and copyrighted by Live2D Inc. The
                sample data are utilized in accordance with terms and conditions set by Live2D Inc. This content itself
                is created at the author’s sole discretion.
              </li>
              <li>Icons: Lucide (ISC)</li>
              <li>Data: O*NET, OpenDOSM (CC BY 4.0)</li>
            </ul>
          </div>

          <a
            href="#top"
            aria-label="Back to Top"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-control bg-bg-default text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default"
          >
            <ChevronUp className="h-5 w-5 stroke-current" aria-hidden="true" />
          </a>
        </div>

        {/* The wordmark is the floor: the page's bottom edge cuts through its last rows. */}
        <div className="mt-auto pt-6">
          <FooterWordmark className="-mb-[4%] block w-full text-text-primary" />
        </div>
      </div>
    </footer>
  )
}
