import { useSyncExternalStore } from 'react'

// Reduced motion is the system setting or the in-app toggle (TRD.md "Accessibility"). The toggle is a device preference.
const QUERY = '(prefers-reduced-motion: reduce)'
const STORAGE_KEY = 'kotak:reduced-motion'

const listeners = new Set<() => void>()
let manual = readStoredChoice()

function readStoredChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

function subscribeSystem(listener: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

function subscribeManual(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setManualReducedMotion(on: boolean) {
  manual = on
  try {
    if (on) localStorage.setItem(STORAGE_KEY, 'on')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Blocked storage: the choice lasts until the page closes.
  }
  listeners.forEach((listener) => listener())
}

export function useReducedMotion() {
  const system = useSyncExternalStore(subscribeSystem, () => window.matchMedia(QUERY).matches)
  const chosen = useSyncExternalStore(subscribeManual, () => manual)
  return { reduced: system || chosen, system, manual: chosen }
}
