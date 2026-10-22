import { useState } from 'react'
import { DEFAULT_SCENARIO } from '@kotak/shared'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { Reasoning } from '../components/kotak/Reasoning'
import { RoleCard } from '../components/kotak/RoleCard'
import { SourceReference } from '../components/kotak/SourceReference'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Stepper } from '../components/ui/Stepper'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { useRoleBundle } from '../engine/bundle'
import { useCheckup } from '../engine/checkup'
import { sourceRefs, toRoles } from '../engine/viewModel'
import { updateGuestSession, useGuestSession } from '../session/store'
import { MathsModal } from './roles/MathsModal'
import { deriveRoleReasoning, deriveSources, kopiRoleSpeech } from './roles/derived'
import { formatFitPercent } from './roles/fit'

const stepLabels: [string, string, string, string, string] = ['Start', 'Questions', 'Radar', 'Roles', 'Plan']

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
        <Stepper step={4} labels={stepLabels} />
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
        <Stepper step={4} labels={stepLabels} />
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

  const currentJob = ranked.find((candidate) => candidate.isCurrentJob)
  const otherRoles = ranked.filter((candidate) => !candidate.isCurrentJob)
  const displayRoles = currentJob ? [currentJob, ...otherRoles.slice(0, 2)] : ranked.slice(0, 3)

  const defaultSelected =
    displayRoles.find((candidate) => !candidate.isCurrentJob && candidate.outlook === 'rising') ??
    (displayRoles.length > 2 ? displayRoles[2] : displayRoles[0])

  const selected = displayRoles.find((candidate) => candidate.id === selectedId) ?? defaultSelected

  const mathsRole = ranked.find((candidate) => candidate.id === mathsId)
  const mathsCheckupRole = checkup.roles.find((candidate) => candidate.onet_code === mathsRole?.id)
  const mathsBundleRole = bundleRoles.find((candidate) => candidate.onet_code === mathsRole?.id)

  const detailCheckupRole = checkup.roles.find((candidate) => candidate.onet_code === selected?.id)
  const detailBundleRole = bundleRoles.find((candidate) => candidate.onet_code === selected?.id)
  const stay = session.goal === 'stay'

  const speech = kopiRoleSpeech(currentJob, ranked)
  const { sources } = sourceRefs(checkup)
  const displaySources = selected ? deriveSources(sources, role, selected) : []
  const reasoningText = selected ? deriveRoleReasoning(selected, detailCheckupRole, detailBundleRole) : ''

  const fitNumerator = detailCheckupRole?.fit.numerator ?? 0
  const fitDenominator = detailCheckupRole?.fit.denominator ?? 0
  const fitScore = detailCheckupRole ? formatFitPercent(detailCheckupRole.fit.score) : `${selected?.fit ?? 0}%`

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
    <div className="flex flex-col gap-5 lg:gap-6">
      <Stepper step={4} labels={stepLabels} />

      <CatDialogue pose="explaining" speech={speech} />

      {role.quality === 'auto-generated' && (
        <Banner
          type="info"
          title="AI-Drafted Skills"
          body="Kopi drafted these skills from the job’s O*NET tasks. The team has not checked them by hand yet."
        />
      )}

      <header className="flex flex-col gap-1.5">
        <h1 className="text-title-m font-bold text-text-primary lg:text-title-l">
          {stay ? "Your Job's Future" : 'Roles That Fit You'}
        </h1>
        <p className="text-body-s text-text-muted">
          Fit is the share of each role’s needed levels you already meet. Outlook comes from DOSM job ads and AI use for
          that role.
        </p>
      </header>

      <section
        role="radiogroup"
        aria-label={stay ? "Your Job's Future" : 'Roles That Fit You'}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {displayRoles.map((displayRole) => (
          <RoleCard
            key={displayRole.id}
            role={displayRole}
            name="role"
            selected={displayRole.id === selected?.id}
            onSelect={() => setSelectedId(displayRole.id)}
          />
        ))}
      </section>

      {selected && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* How Fit Is Worked Out */}
          <section
            aria-labelledby="fit-maths-title"
            className="flex flex-col gap-2.5 rounded-md border border-border-subtle bg-bg-panel p-5"
          >
            <h2 id="fit-maths-title" className="text-title-s text-text-primary">
              How Fit Is Worked Out
            </h2>
            <p className="break-words font-mono text-mono-s text-text-primary">
              Fit = sum of min(your level, needed level) ÷ sum of needed levels
            </p>
            <p className="text-body-s text-text-muted">
              {selected.title}: you meet {fitNumerator} of {fitDenominator} needed levels, so fit is {fitScore}. Levels
              shared with your job carry over; the rest are marked Estimated.
            </p>
            <div className="mt-auto pt-2">
              <Button variant="secondary" size="md" fullWidth onClick={() => setMathsId(selected.id)}>
                See the Maths
              </Button>
            </div>
          </section>

          {/* Why This Role */}
          <section aria-label="Why This Role" className="flex flex-col gap-3">
            <Reasoning text={reasoningText} />
            {displaySources.length > 0 && (
              <div className="divide-y divide-border-subtle rounded-md border border-border-subtle bg-bg-default [&>div]:rounded-none [&>div]:border-0">
                {displaySources.map((source) => (
                  <SourceReference key={source.n} source={source} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Action CTA */}
      <div className="surface-glass sticky bottom-3 z-10 rounded-md p-3 lg:static lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <Button variant="primary" size="lg" fullWidth onClick={pick}>
          Build My Roadmap
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
    </div>
  )
}
