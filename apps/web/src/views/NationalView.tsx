import { FlaskConical, Hourglass, Lock, ShieldCheck } from 'lucide-react'
import { nationalView } from '../demo/data'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { VerdictChip } from '../components/ui/VerdictChip'

const trendSignals = [
  'DOSM job-market trend: arrives with the national view API (#34).',
  'Economic Index AI-use trend: arrives with the national view API (#34).'
]

export function NationalView() {
  return (
    <div className="space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-title-m text-text-primary lg:text-title-l">{nationalView.title}</h1>
        <p className="text-body-s text-text-muted lg:text-body-m">{nationalView.intro}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-border-control bg-bg-default px-3 py-1 text-label-m text-text-primary">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            Shown only for groups of 10 or more anonymous check-ups
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border-control bg-bg-default px-3 py-1 text-label-m text-text-primary">
            <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
            Sample Data
          </span>
        </div>
      </header>

      <Banner type="sample" body={nationalView.sample.body} />

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative w-full lg:w-[260px]">
          <Select
            label={nationalView.filters.occupationGroup.label}
            options={[
              { value: nationalView.filters.occupationGroup.value, label: nationalView.filters.occupationGroup.value }
            ]}
            value={nationalView.filters.occupationGroup.value}
            onChange={() => {}}
            disabled
          />
          <Lock className="pointer-events-none absolute right-0 top-0.5 h-4 w-4 text-text-muted" aria-hidden="true" />
        </div>
        <div className="relative w-full lg:w-[260px]">
          <Select
            label={nationalView.filters.quarter.label}
            options={[{ value: nationalView.filters.quarter.value, label: nationalView.filters.quarter.value }]}
            value={nationalView.filters.quarter.value}
            onChange={() => {}}
            disabled
          />
          <Lock className="pointer-events-none absolute right-0 top-0.5 h-4 w-4 text-text-muted" aria-hidden="true" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <section aria-labelledby="gaps-heading" className="surface-card space-y-4 p-4 lg:p-6">
          <h2 id="gaps-heading" className="text-title-m text-text-primary">
            {nationalView.gapsTitle}
          </h2>

          <div aria-hidden="true" className="space-y-4">
            {nationalView.rows.map((row) => (
              <div
                key={row.skill}
                className="flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,26rem)_1fr_3rem] lg:items-center lg:gap-4"
              >
                <div className="flex items-center gap-2">
                  <span className="min-w-0 text-body-m text-text-primary">{row.skill}</span>
                  <VerdictChip verdict={row.verdict} size="sm" className="shrink-0" />
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-bg-panel">
                  <div
                    className="h-full rounded-full bg-text-primary transition-[width] duration-200 ease-out motion-reduce:transition-none"
                    style={{ width: `${row.share}%` }}
                  />
                </div>
                <span className="font-mono text-mono-m text-text-primary">{row.share}%</span>
              </div>
            ))}
          </div>

          <div className="sr-only">
            <table>
              <caption>{nationalView.gapsTitle}</caption>
              <thead>
                <tr>
                  <th scope="col">Skill</th>
                  <th scope="col">Verdict</th>
                  <th scope="col">Share of Check-Ups</th>
                </tr>
              </thead>
              <tbody>
                {nationalView.rows.map((row) => (
                  <tr key={row.skill}>
                    <th scope="row">{row.skill}</th>
                    <td>{row.verdict}</td>
                    <td>{row.share}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="trends-heading" className="space-y-4">
          <h2 id="trends-heading" className="text-title-m text-text-primary">
            Trend Signals
          </h2>
          {trendSignals.map((text) => (
            <div
              key={text}
              className="flex items-start gap-3 rounded-md border border-dashed border-border-control bg-bg-panel p-4 text-body-s text-text-muted"
            >
              <Hourglass className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{text}</p>
            </div>
          ))}
        </section>
      </div>

      <section aria-labelledby="counted-heading" className="surface-card space-y-4 p-4 lg:p-6">
        <h2 id="counted-heading" className="text-title-m text-text-primary">
          {nationalView.howCounted.title}
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-body-m text-text-primary">
          {nationalView.howCounted.steps.map((step) => (
            <li key={step}>{step.replace(/^\d+\.\s*/, '')}</li>
          ))}
        </ol>
        <div className="flex items-start gap-3 rounded-md border border-border-subtle bg-bg-panel p-4 text-body-s text-text-primary">
          <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{nationalView.howCounted.privacy}</p>
        </div>
        <p className="font-mono text-mono-s text-text-muted">{nationalView.howCounted.sampleLabel}</p>
        <div className="flex flex-col items-start gap-2">
          <Button variant="secondary" size="md" disabled aria-describedby="download-note">
            {nationalView.howCounted.downloadLabel}
          </Button>
          <p id="download-note" className="text-body-s text-text-muted">
            Arrives with the open-data route (#34)
          </p>
        </div>
      </section>
    </div>
  )
}
