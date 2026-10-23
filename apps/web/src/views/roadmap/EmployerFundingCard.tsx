import { Citation } from '../../components/ui/Citation'
import { TextLink } from '../../components/ui/TextLink'

export function EmployerFundingCard({ sourceNumber }: { sourceNumber: number }) {
  return (
    <section
      aria-labelledby="employer-funding-title"
      className="space-y-3 rounded-md border border-border-subtle bg-bg-panel p-4"
    >
      <h3 id="employer-funding-title" className="text-title-s text-text-primary">
        Can Your Employer Fund This?
      </h3>
      <p className="text-body-s text-text-primary">
        If your employer is registered with HRD Corp, it pays a training levy. It can claim approved training from that
        levy.
      </p>
      <p className="text-body-s text-text-primary">
        Your employer applies for the grant in e-TRiS before training starts. The training must run at least 4 hours.
      </p>
      <div className="space-y-2 text-body-s">
        <p>
          <TextLink href="https://hrdcorp.gov.my/hrdcorp-claimable-courses" external>
            HRD Corp Claimable Courses
          </TextLink>{' '}
          explains the scheme rules.
        </p>
        <p>
          <TextLink href="https://elatih.hrdcorp.gov.my/about-us" external>
            HRD Corp’s e-LATiH Portal
          </TextLink>{' '}
          offers free and premium courses.
        </p>
      </div>
      <p className="flex flex-wrap items-center gap-1.5 font-mono text-mono-s text-text-muted">
        Source: HRD Corp · accessed 20 Oct 2026
        <Citation n={sourceNumber} />
        <Citation n={sourceNumber + 1} />
      </p>
    </section>
  )
}
