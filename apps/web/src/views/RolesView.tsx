import { useState } from 'react'
import { DEFAULT_SCENARIO } from '@kotak/shared'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { RoleCard } from '../components/kotak/RoleCard'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { useRoleBundle } from '../engine/bundle'
import { useCheckup } from '../engine/checkup'
import { toRoles } from '../engine/viewModel'
import { updateGuestSession, useGuestSession } from '../session/store'
import { MathsModal } from './roles/MathsModal'

export function RolesView() {
  const session = useGuestSession()
  const bundle = useRoleBundle(session.role_code)
  const loaded = useCheckup({ scenario: DEFAULT_SCENARIO })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mathsId, setMathsId] = useState<string | null>(null)
  const [askOpen, setAskOpen] = useState(false)

  if (!session.role_code) {
    return (
      <div className="mx-auto w-full max-w-[45rem] space-y-6">
        <h1 className="sr-only">Matched Roles</h1>
        <CatDialogue pose="worried" speech="Tell me your job first, then I can find roles that fit." />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Choose Your Job
        </Button>
      </div>
    )
  }

  if (loaded.status !== 'ready' || bundle.status !== 'ready') {
    return (
      <div className="mx-auto w-full max-w-[45rem] space-y-6">
        <h1 className="sr-only">Matched Roles</h1>
        {loaded.status === 'error' || bundle.status === 'error' ? (
          <Banner type="error" title="Kopi Could Not Open This Job" body="Reload the page, or choose your job again." />
        ) : (
          <CatDialogue pose="thinking" speech="Finding roles that fit your work…" />
        )}
      </div>
    )
  }

  const { checkup } = loaded.data
  const { role, related } = bundle.data
  const bundleRoles = [role, ...related]
  const ranked = toRoles(checkup, bundleRoles, session.role_code)
  const selected = ranked.find((candidate) => candidate.id === selectedId) ?? ranked[0]
  const mathsRole = ranked.find((candidate) => candidate.id === mathsId)
  const mathsCheckupRole = checkup.roles.find((candidate) => candidate.onet_code === mathsRole?.id)
  const mathsBundleRole = bundleRoles.find((candidate) => candidate.onet_code === mathsRole?.id)
  const stay = session.goal === 'stay'

  function pick() {
    if (!selected) return
    if (selected.isCurrentJob) {
      updateGuestSession({ target_role_code: null })
      navigate(routes.roadmap)
      return
    }
    setAskOpen(true)
  }

  function continueToRoadmap() {
    if (selected && !selected.isCurrentJob) updateGuestSession({ target_role_code: selected.id })
    else updateGuestSession({ target_role_code: null })
    navigate(routes.roadmap)
  }

  return (
    <section className="space-y-5 lg:space-y-6">
      <header className="space-y-2">
        <h1 className="text-title-m text-text-primary lg:text-title-l">
          {stay ? "Your Job's Future" : 'Matched Roles'}
        </h1>
        <p className="text-body-m text-text-muted">
          Ranked by estimated fit between your answers and each role&apos;s needs.
        </p>
      </header>
      {role.quality === 'auto-generated' && (
        <Banner
          type="info"
          title="AI-Drafted Skills"
          body="Kopi drafted these skills from the job’s O*NET tasks. The team has not checked them by hand yet."
        />
      )}
      <div role="radiogroup" aria-label="Matched Roles" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ranked.map((role) => (
          <div key={role.id} className="flex min-w-0 flex-col gap-2">
            <RoleCard
              role={role}
              name="role"
              selected={role.id === (selected?.id ?? null)}
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
      {mathsRole && mathsCheckupRole && mathsBundleRole && (
        <MathsModal role={mathsCheckupRole} bundleRole={mathsBundleRole} open onClose={() => setMathsId(null)} />
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
            <Button variant="primary" onClick={continueToRoadmap}>
              Continue to Roadmap
            </Button>
          </>
        }
      >
        Your answers give a rough fit for this role. Continue to the roadmap with your current check-up.
      </Modal>
    </section>
  )
}
