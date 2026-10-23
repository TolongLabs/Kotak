import type { BundleDemoRole, Rating, Scenario } from '@kotak/shared'
import { useState } from 'react'
import { useManifest } from '../../engine/bundle'
import { useCheckup, type LoadedCheckup } from '../../engine/checkup'
import { updateGuestSession, useGuestSession } from '../../session/store'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { ScenarioSwitch } from '../../components/ui/ScenarioSwitch'
import { VerdictChip, type VerdictType } from '../../components/ui/VerdictChip'

// Dev panel for #41: loads a demo role from /data, then the engine recomputes on every snapshot or scenario switch.

// The demo's synthetic answers: `sample_level` on every corner, as the build's precomputed diff assumes.
const demoAnswers = (level: number): Rating[] =>
  Array.from(
    { length: 12 },
    (_, i) => (i % 2 === 0 ? 1 + Math.min(3, 2 * level) : 1 + Math.max(0, 2 * level - 3)) as Rating
  )

const unknownReason: Record<string, string> = {
  too_few_points: 'Fewer than 2 dated points',
  no_collaboration_split: 'No collaboration split',
  no_demand: 'No demand reading'
}

function LoadError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="space-y-3">
      <Banner type="error" title="Couldn’t Load the Data Bundle" body={error.message} />
      <Button variant="secondary" onClick={retry}>
        Try Again
      </Button>
    </div>
  )
}

export function SnapshotLoaderGallery() {
  const manifest = useManifest()
  const session = useGuestSession()
  const [scenario, setScenario] = useState<Scenario>('slow')
  const result = useCheckup({ scenario })

  const loadDemo = (demo: BundleDemoRole) =>
    updateGuestSession({ role_code: demo.onet_code, answers: demoAnswers(demo.sample_level) })

  return (
    <section className="space-y-6" aria-labelledby="snapshot-loader-title">
      <div className="space-y-1">
        <h2 id="snapshot-loader-title" className="text-title-l">
          Snapshot Loader
        </h2>
        <p className="text-body-s text-text-muted">
          Loads a demo role from the data bundle, then runs the engine rules in the browser. Switching the snapshot or
          scenario recomputes without a fetch.
        </p>
      </div>

      {manifest.status === 'loading' && <p className="text-body-m">Loading the data bundle…</p>}
      {manifest.status === 'error' && <LoadError error={manifest.error} retry={manifest.retry} />}
      {manifest.status === 'ready' && (
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Demo Role" className="flex flex-wrap gap-2">
            {manifest.data.demo.roles.map((demo) => (
              <Button
                key={demo.onet_code}
                variant={session.role_code === demo.onet_code ? 'primary' : 'secondary'}
                aria-pressed={session.role_code === demo.onet_code}
                onClick={() => loadDemo(demo)}
                className="h-auto! max-w-full py-2 text-left"
              >
                {demo.title}
              </Button>
            ))}
          </div>
          <div role="group" aria-label="Snapshot" className="flex flex-wrap gap-2">
            {manifest.data.snapshots.map((snapshot) => (
              <Button
                key={snapshot.snapshot_id}
                variant={session.active_snapshot_id === snapshot.snapshot_id ? 'primary' : 'secondary'}
                aria-pressed={session.active_snapshot_id === snapshot.snapshot_id}
                onClick={() => updateGuestSession({ active_snapshot_id: snapshot.snapshot_id })}
              >
                {snapshot.label}
              </Button>
            ))}
          </div>
          <ScenarioSwitch value={scenario} onChange={setScenario} aria-label="AI Uptake Scenario" />
        </div>
      )}

      {result.status === 'idle' && <p className="text-body-m">Pick a demo role to load it.</p>}
      {result.status === 'loading' && <p className="text-body-m">Loading the role…</p>}
      {result.status === 'error' && <LoadError error={result.error} retry={result.retry} />}
      {result.status === 'ready' && <CheckupResult {...result.data} />}
    </section>
  )
}

function CheckupResult({ checkup, unavailable }: LoadedCheckup) {
  const names = new Map(checkup.corners.map((corner) => [corner.corner_id, corner.name]))

  return (
    <div className="space-y-6" data-snapshot={checkup.snapshotId} data-scenario={checkup.scenario}>
      {!checkup.questionsReady && (
        <Banner
          type="info"
          title="Questions Not Generated Yet"
          body="This role has no can-do statements or hours until the batch runs, so the levels use the demo answers and the roadmap shows its order only."
        />
      )}
      {unavailable.length > 0 && (
        <p className="text-body-s text-text-muted">Left out of the ranking: {unavailable.join(', ')}.</p>
      )}

      <div className="space-y-2">
        <h3 className="text-title-s">Question Order</h3>
        <ol aria-label="Question Order" className="list-decimal space-y-1 pl-6 text-body-s">
          {checkup.questionOrder.map((corner) => (
            <li key={corner.corner_id}>{corner.name}</li>
          ))}
        </ol>
      </div>

      <div className="space-y-2 overflow-x-auto">
        <h3 className="text-title-s">Verdicts and Targets</h3>
        <table aria-label="Corner Verdicts" className="w-full text-left text-body-s">
          <thead className="text-label-m text-text-muted">
            <tr>
              <th className="py-2 pr-4">Corner</th>
              <th className="py-2 pr-4">Verdict</th>
              <th className="py-2 pr-4">Target</th>
              <th className="py-2">You</th>
            </tr>
          </thead>
          <tbody>
            {checkup.corners.map((corner) => (
              <tr key={corner.corner_id} className="border-t border-border-subtle">
                <td className="py-2 pr-4">{corner.name}</td>
                <td className="py-2 pr-4">
                  <VerdictChip verdict={corner.verdict.status.toLowerCase() as VerdictType} size="sm" />
                  <span className="mt-1 block text-text-muted">
                    {corner.row ?? unknownReason[corner.verdict.reason] ?? 'No row in this scenario'}
                  </span>
                </td>
                <td className="py-2 pr-4 font-mono text-mono-s">{corner.target.toFixed(2)}</td>
                <td className="py-2 font-mono text-mono-s">
                  {corner.level.level} · {corner.level.label}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-title-s">Fit Scores</h3>
          <ol aria-label="Matched Roles" className="space-y-1 text-body-s">
            {checkup.roles.slice(0, 5).map((role) => (
              <li key={role.onet_code} className="flex justify-between gap-3">
                <span>
                  {role.rank}. {role.title}
                </span>
                <span className="shrink-0 font-mono text-mono-s">
                  {Math.round(role.fit.score)} ({role.fit.numerator}/{role.fit.denominator.toFixed(2)})
                </span>
              </li>
            ))}
          </ol>
          <p className="text-body-s text-text-muted">{checkup.roles.length} roles ranked. Scores are estimates.</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-title-s">Roadmap Order</h3>
          <ol aria-label="Roadmap Order" className="space-y-1 text-body-s">
            {checkup.roadmap.items.map((item) => (
              <li key={item.rank}>
                {item.rank}. {names.get(item.corner_id)} → {item.statement} ({item.tier}
                {item.tag ? `, ${item.tag}` : ''})
              </li>
            ))}
          </ol>
          {checkup.roadmap.items.length === 0 && <p className="text-body-s">No gaps in this scenario.</p>}
        </div>
      </div>
    </div>
  )
}
