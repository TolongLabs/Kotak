import { getLocale, useLocale, type Locale } from './locale'

// One area's text in every language. Values are strings, functions for text with numbers or names in it, or nested
// objects of both. The Malay and Chinese tables take their type from the English one, so a missing or misshapen key
// fails typecheck.
export type Messages<T> = Record<Locale, T>

export function defineText<T extends object>(en: T, ms: NoInfer<T>, zh: NoInfer<T>): Messages<T> {
  return { en, ms, zh }
}

/** The area's text in the current language; the component re-renders when the language changes. */
export function useText<T>(messages: Messages<T>): T {
  return messages[useLocale()]
}

/** The same for helpers outside components. Call it while rendering, never at module level, so a switch reaches it. */
export function textNow<T>(messages: Messages<T>): T {
  return messages[getLocale()]
}
