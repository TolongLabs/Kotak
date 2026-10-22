import type { SnapshotId } from '@kotak/shared'
import { updateGuestSession, useGuestSession } from './store'

// The active snapshot is the guest session's active_snapshot_id (#41), so one switch moves every screen: the radar,
// roles, roadmap and What Changed all read the same value through useCheckup or this hook.
function setActiveSnapshot(id: SnapshotId) {
  updateGuestSession({ active_snapshot_id: id })
}

export function useActiveSnapshot(): [SnapshotId, (id: SnapshotId) => void] {
  return [useGuestSession().active_snapshot_id, setActiveSnapshot]
}
