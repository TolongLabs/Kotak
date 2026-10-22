import type { MovedRow } from './whatMoved'

export function WhatMovedList({ rows }: { rows: MovedRow[] }) {
  return (
    <section aria-labelledby="what-moved-title" className="space-y-3">
      <h2 id="what-moved-title" className="text-title-m text-text-primary">
        What Moved
      </h2>
      <ul className="divide-y divide-border-subtle rounded-md border border-border-subtle bg-bg-default">
        {rows.map((row) => (
          <li key={row.label} className="grid gap-2 p-4 sm:grid-cols-[200px_1fr] sm:gap-4">
            <p className="text-label-l text-text-primary">{row.label}</p>
            <p className="text-body-m text-text-primary">{row.effect}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
