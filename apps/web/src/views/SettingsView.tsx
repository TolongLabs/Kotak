import { useId, useState } from 'react'
import { Button } from '../components/ui/Button'
import { setTheme } from '../components/ui/theme'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { commonText } from '../i18n/common'
import { htmlLang, setLocale, useLocale } from '../i18n/locale'
import { shellText } from '../i18n/messages/shell'
import { useText } from '../i18n/text'
import { resetGuestSession } from '../session/store'

const languageOptions = [
  { locale: 'en', labelKey: 'english' },
  { locale: 'ms', labelKey: 'malay' },
  { locale: 'zh', labelKey: 'chinese' }
] as const

export function SettingsView() {
  const [confirmingReset, setConfirmingReset] = useState(false)
  const languageTitleId = useId()
  const locale = useLocale()
  const c = useText(commonText)
  const t = useText(shellText)

  function resetAll() {
    setTheme('light')
    setLocale('en')
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter(
      (key): key is string => key?.startsWith('kotak:') ?? false
    )
    keys.forEach((key) => localStorage.removeItem(key))
    resetGuestSession()
    navigate(routes.landing)
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-title-m text-text-primary lg:text-title-l">{c.nav.settings}</h1>
        <p className="text-body-s text-text-muted">{t.settings.description}</p>
      </header>

      <section className="surface-card space-y-4 p-5 lg:p-6" aria-labelledby={languageTitleId}>
        <h2 id={languageTitleId} className="text-title-s text-text-primary">
          {t.settings.language}
        </h2>
        <div className="flex flex-wrap gap-2">
          {languageOptions.map(({ locale: optionLocale, labelKey }) => (
            <Button
              key={optionLocale}
              variant={optionLocale === locale ? 'primary' : 'secondary'}
              lang={htmlLang(optionLocale)}
              onClick={() => setLocale(optionLocale)}
            >
              {t.settings.languageButtons[labelKey]}
            </Button>
          ))}
        </div>
      </section>

      <section className="surface-card space-y-4 p-5 lg:p-6" aria-labelledby="reset-title">
        <div className="space-y-1">
          <h2 id="reset-title" className="text-title-s text-text-primary">
            {t.settings.resetTitle}
          </h2>
          <p className="text-body-s text-text-muted">{t.settings.resetDescription}</p>
        </div>

        {confirmingReset ? (
          <div
            className="space-y-4 rounded-md border border-border-subtle bg-bg-panel p-4"
            role="group"
            aria-label={t.settings.confirmResetLabel}
            aria-live="polite"
          >
            <p className="text-body-s text-text-primary">{t.settings.confirmReset}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" fullWidth className="sm:w-auto" onClick={() => setConfirmingReset(false)}>
                {c.cancel}
              </Button>
              <Button variant="primary" fullWidth className="sm:w-auto" onClick={resetAll}>
                {t.settings.resetAll}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmingReset(true)}>
            {t.settings.resetAll}
          </Button>
        )}
      </section>
    </div>
  )
}
