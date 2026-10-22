import { ArrowUp } from 'lucide-react'
import { Link } from '../../app/router'
import { routes } from '../../app/routes'
import { nationalView, sources } from '../../demo/data'
import { Logo } from '../../components/brand/Logo'
import { Accordion, type AccordionItem } from '../../components/ui/Accordion'
import { TextLink } from '../../components/ui/TextLink'
import { LandingActionLink } from './LandingActionLink'

const privacyCopy =
  'Each check-up that opts in adds an anonymous job code, six skill levels and a date. Totals show only for groups of 10 or more.'

const onetSource = sources.find((source) => source.name.startsWith('O*NET'))
const anthropicSource = sources.find((source) => source.name.startsWith('Anthropic Economic Index, May'))
const dosmSource = sources.find((source) => source.name.startsWith('DOSM Job Market Insights'))

const sourceCards = [
  {
    title: onetSource?.name.split(' · ')[0] ?? 'O*NET',
    description: 'What each job does, task by task',
    note: onetSource?.detail ?? 'Task statements'
  },
  {
    title: anthropicSource?.name.split(',')[0] ?? 'Anthropic Economic Index',
    description: 'How people use AI, by task and country',
    note: anthropicSource?.detail ?? 'Economic Index data'
  },
  {
    title: dosmSource?.name.split(',')[0] ?? 'DOSM Job Market Insights',
    description: 'Online job ads by occupation, every quarter',
    note: dosmSource?.detail ?? 'Job-ad counts'
  },
  {
    title: 'MyCOL',
    description: 'Skills Malaysia is short of',
    note: 'Malaysia Critical Occupations List'
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
      'Fixed rules set each verdict from dated public data. The AI only explains the result in plain language with citations.'
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
    answer: 'The pilot check-up and your 12-week plan are free.'
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
            Kotak reads dated public data, applies fixed rules, and only then asks Claude to put the result into two
            plain sentences with citations.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {sourceCards.map((source) => (
            <article key={source.title} className="surface-card flex min-w-0 flex-col gap-2 p-4 lg:p-5">
              <h3 className="text-label-l text-text-primary">{source.title}</h3>
              <p className="text-body-s text-text-muted">{source.description}</p>
              <p className="mt-auto font-mono text-mono-s text-text-muted">{source.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function NationalViewSection() {
  const previewRows = nationalView.rows.filter((_, index) => index < 3 || index === 4)

  return (
    <section id="national-view" className="bg-bg-panel px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
        <div className="flex min-w-0 flex-col items-start gap-5">
          <p className="font-mono text-mono-s text-text-muted">For TalentCorp, HRD Corp and MOHE</p>
          <h2 className="text-balance text-display text-text-primary lg:text-display-l">
            A Live, Anonymous View of the Skills Gap.
          </h2>
          <p className="text-body-m text-text-muted lg:text-body-l">{privacyCopy}</p>
          <LandingActionLink to={routes.national} variant="secondary" className="w-full sm:w-auto">
            See the National View
          </LandingActionLink>
        </div>

        <section className="surface-card min-w-0 space-y-4 p-4 sm:p-6" aria-labelledby="national-preview-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="national-preview-title" className="text-label-m text-text-primary">
              Rising Skills Malaysians Lack Most · {nationalView.sample.title}
            </h3>
            <span className="rounded-full border border-border-subtle bg-bg-panel px-3 py-1 font-mono text-mono-s text-text-muted">
              {nationalView.filters.quarter.value}
            </span>
          </div>

          <div className="space-y-4" aria-hidden="true">
            {previewRows.map((row) => (
              <div key={row.skill} className="space-y-1">
                <p className="text-label-s text-text-primary">{row.skill}</p>
                <div className="h-2.5 overflow-hidden rounded-full border border-border-subtle bg-bg-panel">
                  <div className="h-full rounded-full bg-text-primary" style={{ width: `${row.share}%` }} />
                </div>
              </div>
            ))}
          </div>

          <ul className="sr-only" aria-label="Sample share of check-ups below the 2027 skill level">
            {previewRows.map((row) => (
              <li key={row.skill}>
                {row.skill}: {row.share}% of sample check-ups are below the 2027 level.
              </li>
            ))}
          </ul>

          <p className="text-body-s text-text-muted">{nationalView.sample.body}</p>
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
            Open the Box in Three Minutes.
          </h2>
          <p className="text-body-m text-bg-default dark:text-text-muted lg:text-body-l">
            No account needed for the pilot. Your check-up takes about three minutes.
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
              <li>SDC Hackathon 2026</li>
              <li>Domain 1: Aiversecity</li>
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
              <li>Data: O*NET, OpenDOSM (CC BY 4.0)</li>
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
