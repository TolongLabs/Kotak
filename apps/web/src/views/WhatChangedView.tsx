import type { SnapshotId } from '@kotak/shared'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { WhatChangedCard } from '../components/kotak/WhatChangedCard'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { changes, snapshots } from '../demo/data'
import { useActiveSnapshot } from '../session/snapshot'
import { WhatMovedList } from './changes/WhatMovedList'
import { whatMovedRows } from './changes/whatMoved'

const countWords = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

function changeSpeech() {
  const count = changes.length
  const verdicts = new Set(changes.map((item) => item.to))
  const names = changes.map((item) => item.skill)
  const nameList = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names.join('')
  const summary =
    verdicts.size === 1
      ? `${nameList} ${count === 1 ? 'is' : 'are'} now ${[...verdicts][0]}`
      : changes.map((item) => `${item.skill} is now ${item.to}`).join(', ')
  return `${countWords[count] ?? count} ${count === 1 ? 'thing' : 'things'} changed in May: ${summary}.`
}

export function WhatChangedView() {
  const [activeSnapshot, setActiveSnapshot] = useActiveSnapshot()
  const isMay = activeSnapshot === '2026-05'
  const aprilLabel = snapshots.find((item) => item.id === '2026-04')?.label ?? ''
  const mayLabel = snapshots.find((item) => item.id === '2026-05')?.label ?? ''
  const shownLabel = isMay ? mayLabel : aprilLabel

  function switchSnapshot() {
    const next: SnapshotId = isMay ? '2026-04' : '2026-05'
    setActiveSnapshot(next)
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <Banner type="sample" body="Radar, roles and roadmap update when engine data lands (#86, #41)." />

      <CatDialogue
        pose={isMay ? 'explaining' : 'idle'}
        speech={isMay ? changeSpeech() : 'Nothing new yet. Load May 2026 when you are ready.'}
        size="lg"
      />

      <header className="space-y-1.5">
        <h1 className="text-title-m text-text-primary lg:text-title-l">What Changed</h1>
        <p className="text-body-s text-text-muted">New data arrives; Kopi shows what moved and why.</p>
      </header>

      <div className="space-y-2">
        <Button
          type="button"
          variant={isMay ? 'secondary' : 'primary'}
          size="lg"
          className="w-full lg:w-auto"
          onClick={switchSnapshot}
        >
          {isMay ? `Back to ${aprilLabel}` : `Load ${mayLabel} Snapshot`}
        </Button>
        <p className="text-body-s text-text-muted">Showing: {shownLabel} data</p>
      </div>

      {isMay ? (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            {changes.map((item) => (
              <WhatChangedCard key={item.skill} item={item} />
            ))}
          </div>
          <WhatMovedList rows={whatMovedRows(changes)} />
        </>
      ) : (
        <section className="surface-card p-6 text-center">
          <p className="text-body-m text-text-primary">
            You&apos;re on {aprilLabel} data. Load {mayLabel} to see what changed.
          </p>
        </section>
      )}
    </div>
  )
}
