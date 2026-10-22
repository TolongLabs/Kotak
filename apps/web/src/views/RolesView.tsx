import { useState } from 'react'
import { DEFAULT_SCENARIO } from '@kotak/shared'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { Reasoning } from '../components/kotak/Reasoning'
import { RoleCard } from '../components/kotak/RoleCard'
import { SourceList } from '../components/kotak/SourceList'
import { Accordion } from '../components/ui/Accordion'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { SdgChip } from '../components/ui/SdgChip'
import { checkUpSteps, Stepper } from '../components/ui/Stepper'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { useRoleBundle } from '../engine/bundle'
import { assessedRoleCode, useCheckup } from '../engine/checkup'
import { occupationSdgs } from '../engine/occupationSdg'
import { toRoles } from '../engine/viewModel'
import { updateGuestSession, useGuestSession } from '../session/store'
import { deriveRoleEvidence, kopiRoleSpeech, pickDisplayRoles, sessionHeading } from './roles/derived'
import { estimatedCorners, formatFitPercent, formatLevel } from './roles/fit'

export function RolesView() {
  const session = useGuestSession()
  const bundle = useRoleBundle(assessedRoleCode(session))
  const loaded = useCheckup({ scenario: DEFAULT_SCENARIO })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const checkup = loaded.status === 'ready' ? loaded.data.checkup : null
  const aiOff = new URLSearchParams(window.location.search).get('ai') === 'off'

  if (!session.role_code) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <h1 className="sr-only">Matched Roles</h1>
        <Stepper step={4} labels={checkUpSteps} />
        <CatDialogue pose="worried" speech="Tell me your job first, then I can find roles that fit." />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(routes.checkUp)}>
          Choose Your Job
        </Button>
      </div>
    )
  }

  if (loaded.status !== 'ready' || bundle.status !== 'ready' || !checkup) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <h1 className="sr-only">Matched Roles</h1>
        <Stepper step={4} labels={checkUpSteps} />
        {loaded.status === 'error' || bundle.status === 'error' ? (
          <Banner type="error" title="Kopi Could Not Open This Job" body="Reload the page, or choose your job again." />
        ) : (
          <CatDialogue pose="thinking" speech="Finding roles that fit your work…" />
        )}
      </div>
    )
  }

  const { role, related } = bundle.data
  const bundleRoles = [role, ...related]
  const ranked = toRoles(checkup, bundleRoles, session.role_code)

  const { roles: displayRoles, defaultId } = pickDisplayRoles(session.goal, session.target_role_code, ranked)
  const selected =
    displayRoles.find((candidate) => candidate.id === selectedId) ??
    displayRoles.find((candidate) => candidate.id === defaultId)

  const detailCheckupRole = checkup.roles.find((candidate) => candidate.onet_code === selected?.id)
  const detailBundleRole = bundleRoles.find((candidate) => candidate.onet_code === selected?.id)

  const speech = kopiRoleSpeech(
    ranked,
    session.goal === 'explore' ? undefined : displayRoles.find((candidate) => candidate.id === defaultId)
  )
  const heading = sessionHeading(session.goal)

  const roleEvidence = selected ? deriveRoleEvidence(detailCheckupRole, detailBundleRole, checkup.snapshotId) : null
  // Only the sources the visible rows cite; the first two when no row cites one.
  const citedNumbers = new Set(roleEvidence?.rows.map((row) => row.citation).filter((n) => n !== null))
  const allSources = roleEvidence?.sources ?? []
  const displaySources =
    citedNumbers.size > 0 ? allSources.filter((source) => citedNumbers.has(source.n)) : allSources.slice(0, 2)

  const reasoningText = roleEvidence?.summary ?? ''

  const cornerName = new Map(detailBundleRole?.corners.map((corner) => [corner.corner_id, corner.name]) ?? [])
  const carryOver = detailCheckupRole ? estimatedCorners(detailCheckupRole) : new Set<string>()
  const fitRows = detailCheckupRole
    ? detailCheckupRole.fit.terms.map((term) => ({
        name: cornerName.get(term.corner_id) ?? term.corner_id,
        you: formatLevel(term.user_level),
        needed: formatLevel(term.target_level),
        counts: formatLevel(term.term),
        estimated: carryOver.has(term.corner_id)
      }))
    : []
  // When every level is carried over, one caption replaces a badge on every row.
  const allEstimated = fitRows.length > 0 && fitRows.every((fitRow) => fitRow.estimated)
  const mathsAnswer = detailCheckupRole
    ? `Fit = sum of min(your level, needed level) ÷ sum of needed levels; here ${formatLevel(
        detailCheckupRole.fit.numerator
      )} / ${formatLevel(detailCheckupRole.fit.denominator)} gives ${formatFitPercent(detailCheckupRole.fit.score)}.`
    : ''
  function pick() {
    updateGuestSession({
      plan_role_code: selected && selected.id !== assessedRoleCode(session) ? selected.id : null
    })
    navigate(routes.roadmap)
  }

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <Stepper step={4} labels={checkUpSteps} />

      <CatDialogue pose="explaining" speech={speech} />

      <header className="flex flex-col gap-1.5">
        <h1 className="text-title-m font-bold text-text-primary lg:text-title-l">{heading}</h1>
        <p className="text-body-s text-text-muted">
          Fit is the share of each role’s needed levels you already meet. Outlook comes from DOSM job ads and AI use for
          that role.
        </p>
      </header>

      <section role="radiogroup" aria-label={heading} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {displayRoles.map((displayRole) => {
          const occupation = occupationSdgs(displayRole.id)
          const goals = occupation?.goals.slice(0, 3) ?? []
          return (
            <RoleCard
              key={displayRole.id}
              role={displayRole}
              name="role"
              selected={displayRole.id === selected?.id}
              onSelect={() => setSelectedId(displayRole.id)}
              footer={
                goals.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-mono-s text-text-muted">This Work Supports</span>
                    {goals.map((goal) => (
                      <SdgChip key={goal} goal={goal} compact title={occupation?.reason} />
                    ))}
                  </span>
                )
              }
            />
          )
        })}
      </section>

      {selected && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* How Fit Is Worked Out */}
          <section aria-labelledby="fit-maths-title" className="surface-card flex flex-col gap-3 p-5">
            <h2 id="fit-maths-title" className="text-title-s text-text-primary">
              How Fit Is Worked Out
            </h2>
            <p className="text-body-s text-text-primary">
              {detailCheckupRole
                ? `You meet ${formatLevel(detailCheckupRole.fit.numerator)} of ${formatLevel(
                    detailCheckupRole.fit.denominator
                  )} needed levels for ${selected.title}, so fit is ${formatFitPercent(detailCheckupRole.fit.score)}.`
                : `Fit for ${selected.title} is not ready yet.`}
            </p>
            {fitRows.length > 0 && (
              <div role="region" tabIndex={0} aria-label="Fit by skill" className="overflow-x-auto">
                <table className="w-full text-body-s">
                  <caption className="sr-only">
                    {selected.title}: your level, needed level and counted level per skill
                  </caption>
                  <thead>
                    <tr className="bg-bg-panel text-left text-label-m">
                      <th scope="col" className="px-2 py-1.5">
                        Skill
                      </th>
                      <th scope="col" className="px-2 py-1.5 text-right">
                        You
                      </th>
                      <th scope="col" className="px-2 py-1.5 text-right">
                        Needed
                      </th>
                      <th scope="col" className="px-2 py-1.5 text-right">
                        Counts
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fitRows.map((fitRow) => (
                      <tr key={fitRow.name} className="border-t border-border-subtle">
                        <th scope="row" className="px-2 py-1.5 text-left font-normal">
                          {fitRow.name}
                        </th>
                        <td className="whitespace-nowrap px-2 py-1.5 text-right font-mono text-mono-m">
                          {/* On phones the badge drops under the level, so all four columns fit. */}
                          <span className="inline-flex flex-col items-end gap-1 sm:flex-row sm:items-center">
                            {fitRow.you}
                            {fitRow.estimated && !allEstimated && (
                              <span className="rounded-full border border-border-control px-1.5 py-0.5 font-sans text-label-s text-text-muted">
                                Estimated
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-right font-mono text-mono-m">
                          {fitRow.needed}
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-right font-mono text-mono-m">
                          {fitRow.counts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {allEstimated && (
              <p className="text-body-s text-text-muted">
                Your levels here are estimated from your {role.title} answers.
              </p>
            )}
            {detailCheckupRole && mathsAnswer && (
              <Accordion items={[{ id: 'fit-maths', question: 'See the Maths', answer: mathsAnswer }]} />
            )}
          </section>

          {/* Why This Role */}
          {/* Stretches with the fit card, so both boxes in the row end on one line. */}
          <section aria-label="Why This Role" className="flex flex-col justify-between gap-3">
            <Reasoning text={reasoningText} source="template" paused={aiOff} rows={roleEvidence?.rows ?? []} />
            <SourceList sources={displaySources} />
          </section>
        </div>
      )}

      {/* Action CTA */}
      <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 rounded-md p-3 lg:static lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <Button variant="primary" size="lg" fullWidth onClick={pick}>
          Build My Roadmap
        </Button>
      </div>
    </div>
  )
}
