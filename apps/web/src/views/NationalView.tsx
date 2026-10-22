import { Info, Landmark, Lock } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { cn } from '../components/ui/cn'
import { Select } from '../components/ui/Select'
import { VerdictChip } from '../components/ui/VerdictChip'
import { nationalView } from '../demo/data'

export function NationalView() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <header className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            <Landmark className="h-[26px] w-[26px] shrink-0 stroke-current lg:h-8 lg:w-8" aria-hidden="true" />
            <h1 className="min-w-0 text-title-m text-text-primary lg:text-title-l">{nationalView.title}</h1>
          </div>
          <p className="text-body-m text-text-muted">{nationalView.intro}</p>
        </header>

        <SampleBanner title={nationalView.sample.title} body={nationalView.sample.body} className="lg:w-[420px]" />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-[280px]">
          <Select
            label={nationalView.filters.occupationGroup.label}
            options={[
              { value: nationalView.filters.occupationGroup.value, label: nationalView.filters.occupationGroup.value }
            ]}
            value={nationalView.filters.occupationGroup.value}
            onChange={() => {}}
          />
        </div>
        <div className="w-full lg:w-[280px]">
          <Select
            label={nationalView.filters.quarter.label}
            options={[{ value: nationalView.filters.quarter.value, label: nationalView.filters.quarter.value }]}
            value={nationalView.filters.quarter.value}
            onChange={() => {}}
          />
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <section aria-labelledby="gaps-heading" className="surface-card min-w-0 flex-1 space-y-3.5 p-6">
          <h2 id="gaps-heading" className="text-title-s text-text-primary">
            {nationalView.gapsTitle}
          </h2>

          <div aria-hidden="true" className="flex flex-col gap-3.5">
            {nationalView.rows.map((row) => (
              <div key={row.skill} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 text-label-m text-text-primary">{row.skill}</span>
                  <VerdictChip verdict={row.verdict} size="md" />
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full border border-border-subtle bg-bg-panel">
                    <div
                      className="h-full rounded-full bg-text-primary transition-[width] duration-200 ease-out motion-reduce:transition-none"
                      style={{ width: `${row.share}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-mono-s text-text-primary">{row.share}%</span>
                </div>
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

        <section
          aria-labelledby="counted-heading"
          className="flex flex-col gap-3.5 rounded-md border border-border-subtle bg-bg-panel p-6 lg:w-[360px] lg:shrink-0"
        >
          <h2 id="counted-heading" className="text-label-l text-text-primary">
            {nationalView.howCounted.title}
          </h2>
          {nationalView.howCounted.steps.map((step) => (
            <p key={step} className="text-body-s text-text-primary">
              {step}
            </p>
          ))}
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
            <p className="text-body-s text-text-muted">{nationalView.howCounted.privacy}</p>
          </div>
          <Button variant="secondary" size="lg" fullWidth disabled aria-describedby="download-note">
            {nationalView.howCounted.downloadLabel}
          </Button>
          <span id="download-note" className="sr-only">
            The open-data download is not available in the pilot.
          </span>
          <p className="font-mono text-mono-s text-text-muted">{nationalView.howCounted.sampleLabel}</p>
        </section>
      </div>
    </div>
  )
}

function SampleBanner({ title, body, className }: { title: string; body: string; className?: string }) {
  return (
    <div
      className={cn(
        'on-accent flex w-full shrink-0 items-start gap-3 rounded-md border-[1.5px] border-text-primary bg-accent-box px-4 py-3 text-text-primary',
        className
      )}
    >
      <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-label-l text-text-primary">{title}</span>
        <span className="text-body-s text-text-muted">{body}</span>
      </div>
    </div>
  )
}
