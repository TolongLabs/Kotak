import { useSyncExternalStore } from 'react'

// The theme starts light unless the visitor saved a pick. tokens.css reads `data-theme` on <html>; index.html
// applies the saved pick before first paint so the page never flashes.
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'kotak:theme'

const listeners = new Set<() => void>()
let currentChoice = readStoredChoice() ?? 'light'

function readStoredChoice(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function currentTheme(): Theme {
  return currentChoice
}

export function setTheme(theme: Theme) {
  currentChoice = theme
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
