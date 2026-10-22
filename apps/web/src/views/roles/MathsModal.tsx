import type { BundleRole } from '@kotak/shared'
import type { CheckupRole } from '../../engine/checkup'
import { Modal } from '../../components/ui/Modal'
import { formatFitPercent } from './fit'

export function MathsModal({
  role,
  bundleRole,
  open,
  onClose
}: {
  role: CheckupRole
  bundleRole: BundleRole
  open: boolean
  onClose: () => void
}) {
  const cornerNames = new Map(bundleRole.corners.map((corner) => [corner.corner_id, corner.name]))
  const title = `How We Got Estimated ${formatFitPercent(role.fit.score)} Fit`

  return (
    <Modal open={open} onClose={onClose} title={title} className="md:w-[min(40rem,calc(100vw-2rem))]">
      <div className="space-y-4">
        <div role="region" tabIndex={0} aria-label="Fit maths table" className="overflow-x-auto">
          <table className="w-full text-body-s">
            <caption className="sr-only">{role.title}: your level, target level and counted term per skill</caption>
            <thead>
              <tr className="bg-bg-panel text-left text-label-m">
                <th scope="col" className="px-2 py-2 sm:px-3">
                  Skill
                </th>
                <th scope="col" className="px-2 py-2 text-right sm:px-3">
                  You
                </th>
                <th scope="col" className="px-2 py-2 text-right sm:px-3">
                  Target (Estimate)
                </th>
                <th scope="col" className="px-2 py-2 text-right sm:px-3">
                  Term
                </th>
              </tr>
            </thead>
            <tbody>
              {role.fit.terms.map((term) => (
                <tr key={term.corner_id} className="border-t border-border-subtle">
                  <th scope="row" className="px-2 py-2 text-left font-normal sm:px-3">
                    {cornerNames.get(term.corner_id) ?? term.corner_id}
                  </th>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-mono-m sm:px-3">
                    {term.user_level}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-mono-m sm:px-3">
                    About {term.target_level}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-mono-m sm:px-3">{term.term}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-mono text-mono-m">
          {role.fit.numerator} / {role.fit.denominator} = {formatFitPercent(role.fit.score)}
          {role.fit.is_estimate ? ' (estimate)' : ''}
        </p>
      </div>
    </Modal>
  )
}
