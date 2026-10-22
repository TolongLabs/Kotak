import type { SnapshotId } from '@kotak/shared'
import { useSyncExternalStore } from 'react'

// shortcut: stand-in for #41's guest session active_snapshot_id, kept in localStorage until the session exists.
const storageKey = 'kotak:active-snapshot'
const defaultSnapshot: SnapshotId = '2026-04'
const listeners = new Set<() => void>()
// The choice made on this page; it wins over storage, which may be blocked.
let chosen: SnapshotId | null = null

function readSnapshot(): SnapshotId {
  if (chosen) return chosen
  try {
    const stored = window.localStorage.getItem(storageKey)
    return stored === '2026-05' || stored === '2026-04' ? stored : defaultSnapshot
  } catch {
    return defaultSnapshot
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setActiveSnapshot(id: SnapshotId) {
  chosen = id
  try {
    window.localStorage.setItem(storageKey, id)
  } catch {
    // Private windows can block storage; the choice then lasts only this page view.
  }
  listeners.forEach((listener) => listener())
}

export function useActiveSnapshot(): [SnapshotId, (id: SnapshotId) => void] {
  const active = useSyncExternalStore(subscribe, readSnapshot, () => defaultSnapshot)
  return [active, setActiveSnapshot]
}
