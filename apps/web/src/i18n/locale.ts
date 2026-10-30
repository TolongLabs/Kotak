import { useSyncExternalStore } from 'react'

// The interface starts in English unless the visitor saved a pick (#431): Bahasa Malaysia or Simplified Chinese.
// index.html applies the saved pick to <html lang> before first paint, and App reads useLocale so every screen
// re-renders on a switch.
export type Locale = 'en' | 'ms' | 'zh'

export const LOCALES: readonly Locale[] = ['en', 'ms', 'zh']

/** The <html lang> tag: Chinese is written in simplified characters in Malaysia. */
export const htmlLang = (locale: Locale) => (locale === 'zh' ? 'zh-Hans' : locale)

const STORAGE_KEY = 'kotak:locale'

const listeners = new Set<() => void>()
let currentChoice = readStoredChoice() ?? 'en'

function readStoredChoice(): Locale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return LOCALES.includes(stored as Locale) ? (stored as Locale) : null
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

/** The current language, for code outside components. Components use useLocale so they re-render on a switch. */
export function getLocale(): Locale {
  return currentChoice
}

export function setLocale(locale: Locale) {
  currentChoice = locale
  document.documentElement.lang = htmlLang(locale)
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Blocked storage: the choice lasts until the page closes.
  }
  listeners.forEach((listener) => listener())
}

export function useLocale() {
  return useSyncExternalStore(subscribe, getLocale)
}

const DATE_LOCALES: Record<Locale, string> = { en: 'en-GB', ms: 'ms-MY', zh: 'zh-Hans-MY' }

/** The Intl tag for dates in the current language: day-first British English, Malaysian Malay or Malaysian Chinese. */
export const dateLocale = (locale: Locale = getLocale()) => DATE_LOCALES[locale]
