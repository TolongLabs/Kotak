import { useState } from 'react'
import { RoleCard } from '../components/kotak/RoleCard'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { getGoal, hasTargets, rankRoles } from './roles/fit'
import { MathsModal } from './roles/MathsModal'

export function RolesView() {
  const goal = getGoal()
  const ranked = rankRoles(goal)
  const stay = goal === 'stay'
  const [selectedId, setSelectedId] = useState(ranked[0]?.id)
  const [mathsId, setMathsId] = useState<string | null>(null)
  const [askOpen, setAskOpen] = useState(false)
  const selected = ranked.find((r) => r.id === selectedId)
  const mathsRole = ranked.find((r) => r.id === mathsId)

  function pick() {
    if (!selected) return
    if (hasTargets(selected)) navigate(routes.roadmap)
    else setAskOpen(true)
  }

  return (
    <section className="space-y-5 lg:space-y-6">
      <header className="space-y-2">
        <h1 className="text-title-m text-text-primary lg:text-title-l">
          {stay ? "Your Job's Future" : 'Matched Roles'}
        </h1>
        <p className="text-body-m text-text-muted">Ranked by how much of each role's needed skill you already have.</p>
      </header>
      <Banner type="sample" body="Role fits are sample figures. Real ones come from the engine (#83)." />
      {stay && <p className="text-body-s text-text-muted">Your own job comes first, then two backup roles.</p>}
      <div role="radiogroup" aria-label="Matched Roles" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ranked.map((role) => (
          <div key={role.id} className="flex min-w-0 flex-col gap-2">
            <RoleCard
              role={role}
              name="role"
              selected={role.id === selectedId}
              onSelect={() => setSelectedId(role.id)}
            />
            <Button variant="secondary" size="md" fullWidth onClick={() => setMathsId(role.id)}>
              See the Maths
            </Button>
          </div>
        ))}
      </div>
      <div className="flex md:justify-end">
        <Button variant="primary" className="max-md:w-full" onClick={pick}>
          Pick This Role
        </Button>
      </div>
      {ranked[0] && (
        <MathsModal role={mathsRole ?? ranked[0]} open={mathsRole !== undefined} onClose={() => setMathsId(null)} />
      )}
      <Modal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        title="A Few More Questions"
        actions={
          <>
            <Button variant="secondary" autoFocus onClick={() => setAskOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => navigate(routes.roadmap)}>
              Continue to Roadmap
            </Button>
          </>
        }
      >
        Kopi will ask the missing can-do questions once the engine supplies them (#83). You can still see a sample
        roadmap.
      </Modal>
    </section>
  )
}
