import { CircleCheck, CircleDashed, CircleHelp, Hourglass } from 'lucide-react'
import type { ComponentType } from 'react'
import type { Role } from '../../demo/types'
import { Modal } from '../../components/ui/Modal'
import { hasTargets, mathsRows, mathsTotals, type Coverage } from './fit'

const coverageIcon: Record<Coverage, ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>> = {
  'Estimated From Your Answers': CircleCheck,
  'Rough Estimate': CircleDashed,
  'Not Asked Yet': CircleHelp
}

function CoverageChip({ coverage }: { coverage: Coverage }) {
  const Icon = coverageIcon[coverage]
  return (
    <span className="inline-flex items-center gap-1 sm:whitespace-nowrap rounded-full border border-border-control px-2 py-0.5 text-label-s text-text-primary">
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {coverage}
    </span>
  )
}

const num = (n: number | null) =>
  n === null ? (
    <>
      <span className="text-text-muted" aria-hidden="true">
        —
      </span>
      <span className="sr-only">Not available yet</span>
    </>
  ) : (
    n
  )

export function MathsModal({ role, open, onClose }: { role: Role; open: boolean; onClose: () => void }) {
  const rows = mathsRows(role)
  const { counted, needed, fit } = mathsTotals(rows)
  const real = hasTargets(role)
  const title = real ? `How We Got ${fit}%` : `How We Got ${role.fit}% (Sample)`
  return (
    <Modal open={open} onClose={onClose} title={title} className="md:w-[min(40rem,calc(100vw-2rem))]">
      <div className="space-y-4">
        <div role="region" tabIndex={0} aria-label="Fit maths table" className="overflow-x-auto">
          <table className="w-full text-body-s">
            <caption className="sr-only">{role.title}: your level against the level needed, per skill</caption>
            <thead>
              <tr className="bg-bg-panel text-left text-label-m">
                <th scope="col" className="px-2 py-2 sm:px-3">
                  Skill
                </th>
                <th scope="col" className="px-2 py-2 sm:px-3 text-right">
                  You
                </th>
                <th scope="col" className="px-2 py-2 sm:px-3 text-right">
                  Needed
                </th>
                <th scope="col" className="px-2 py-2 sm:px-3 text-right">
                  Counted
                </th>
                <th scope="col" className="sr-only px-2 py-2 sm:not-sr-only sm:px-3">
                  Coverage
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-t border-border-subtle">
                  <th scope="row" className="px-2 py-2 sm:px-3 text-left font-normal">
                    {r.name}
                    <span aria-hidden="true" className="mt-1 block sm:hidden">
                      <CoverageChip coverage={r.coverage} />
                    </span>
                  </th>
                  <td className="whitespace-nowrap px-2 py-2 sm:px-3 text-right font-mono text-mono-m">{num(r.you)}</td>
                  <td className="whitespace-nowrap px-2 py-2 sm:px-3 text-right font-mono text-mono-m">
                    {num(r.needed)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 sm:px-3 text-right font-mono text-mono-m">
                    {num(r.counted)}
                  </td>
                  <td className="sr-only px-2 py-2 sm:not-sr-only sm:px-3">
                    <CoverageChip coverage={r.coverage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-mono text-mono-m">
          {real ? `${counted} counted / ${needed} needed = ${fit}%` : '— counted / — needed = Sample'}
        </p>
        {!real && (
          <p className="flex items-center gap-2 rounded-md border border-dashed border-border-control bg-bg-panel p-4 text-body-s text-text-muted">
            <Hourglass className="h-4 w-4 shrink-0" aria-hidden="true" />
            Per-skill targets arrive with the engine (#83).
          </p>
        )}
      </div>
    </Modal>
  )
}
