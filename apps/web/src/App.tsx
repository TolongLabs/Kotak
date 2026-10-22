import { EngineSnapshotSchema, sampleSnapshot } from '@kotak/shared'
import { Gallery } from './dev/Gallery'

const snapshot = EngineSnapshotSchema.parse(sampleSnapshot)

export function App() {
  if (window.location.hash === '#gallery') return <Gallery />

  return (
    <main data-snapshot-id={snapshot.snapshot_id}>
      <h1>Kotak</h1>
    </main>
  )
}
