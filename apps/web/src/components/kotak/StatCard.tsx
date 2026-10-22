import type { ReactNode } from 'react'

export interface StatCardProps {
  label: string
  value: string
  caption?: string
  // An optional visual between the value and the caption, such as a sparkline or a progress bar.
  children?: ReactNode
}

export function StatCard({ label, value, caption, children }: StatCardProps) {
  return (
    <section className="surface-card flex min-w-0 flex-col gap-2 p-4">
      <h3 className="text-label-m text-text-muted">{label}</h3>
      <p className="hyphens-auto text-title-m tabular-nums text-text-primary [overflow-wrap:anywhere] lg:text-title-l">
        {value}
      </p>
      {children}
      {caption && <p className="text-body-s text-text-muted">{caption}</p>}
    </section>
  )
}
