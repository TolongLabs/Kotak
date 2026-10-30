import { Citation } from '../../components/ui/Citation'
import { TextLink } from '../../components/ui/TextLink'
import { dateLocale } from '../../i18n/locale'
import { roadmapText } from '../../i18n/messages/roadmap'
import { useText } from '../../i18n/text'

function formatSourceDate(value: string) {
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${value}T00:00:00Z`))
}

export function EmployerFundingCard({ sourceNumber }: { sourceNumber: number }) {
  const t = useText(roadmapText)
  return (
    <section
      aria-labelledby="employer-funding-title"
      className="space-y-3 rounded-md border border-border-subtle bg-bg-panel p-4"
    >
      <h3 id="employer-funding-title" className="text-title-s text-text-primary">
        {t.funding.title}
      </h3>
      <p className="text-body-s text-text-primary">{t.funding.eligibility}</p>
      <p className="text-body-s text-text-primary">{t.funding.application}</p>
      <div className="space-y-2 text-body-s">
        <p>
          <TextLink href="https://hrdcorp.gov.my/hrdcorp-claimable-courses" external>
            HRD Corp Claimable Courses
          </TextLink>{' '}
          {t.funding.schemeRules}
        </p>
        <p>
          <TextLink href="https://elatih.hrdcorp.gov.my/about-us" external>
            HRD Corp’s e-LATiH Portal
          </TextLink>{' '}
          {t.funding.freePremium}
        </p>
      </div>
      <p className="flex flex-wrap items-center gap-1.5 font-mono text-mono-s text-text-muted">
        {t.funding.source(formatSourceDate('2026-10-20'))}
        <Citation n={sourceNumber} />
        <Citation n={sourceNumber + 1} />
      </p>
    </section>
  )
}
