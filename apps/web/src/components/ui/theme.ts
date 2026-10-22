import { useSyncExternalStore } from 'react'

// The theme follows the system setting until the visitor picks one, and the pick is a device preference. tokens.css
// reads `data-theme` on <html>; index.html applies a stored pick before first paint so the page never flashes.
export type Theme = 'light' | 'dark'

const QUERY = '(prefers-color-scheme: dark)'
const STORAGE_KEY = 'kotak:theme'

const listeners = new Set<() => void>()
let manual = readStoredChoice()

function readStoredChoice(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function subscribe(listener: () => void) {
  const media = window.matchMedia(QUERY)
  listeners.add(listener)
  media.addEventListener('change', listener)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', listener)
  }
}

function currentTheme(): Theme {
  return manual ?? (window.matchMedia(QUERY).matches ? 'dark' : 'light')
}

export function setTheme(theme: Theme) {
  manual = theme
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Blocked storage: the choice lasts until the page closes.
  }
  listeners.forEach((listener) => listener())
}

export function useTheme() {
  return useSyncExternalStore(subscribe, currentTheme)
}
