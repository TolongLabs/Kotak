import { commonText } from '../../i18n/common'
import { htmlLang, LOCALES, setLocale, useLocale } from '../../i18n/locale'
import { useText } from '../../i18n/text'
import { cn } from './cn'

// Steps through English, Bahasa Malaysia and Chinese (#431). It matches ThemeToggle; the face shows the current
// language in that language, and each tap moves to the next.
export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale()
  const t = useText(commonText)
  const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length]

  return (
    <button
      type="button"
      aria-label={t.languageLabel}
      lang={htmlLang(locale)}
      onClick={() => setLocale(next)}
      className={cn(
        'inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-bg-default px-2 text-label-m text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default',
        className
      )}
    >
      {t.languageShort}
    </button>
  )
}
