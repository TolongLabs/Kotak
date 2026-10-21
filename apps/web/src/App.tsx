import { EngineSnapshotSchema, sampleSnapshot } from '@kotak/shared'

const snapshot = EngineSnapshotSchema.parse(sampleSnapshot)

export function App() {
  return (
    <main data-snapshot-id={snapshot.snapshot_id}>
      <h1>Kotak</h1>
    </main>
  )
}
