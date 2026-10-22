import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { setTheme } from '../components/ui/theme'
import { navigate } from '../app/router'
import { routes } from '../app/routes'
import { resetGuestSession } from '../session/store'

export function SettingsView() {
  const [confirmingReset, setConfirmingReset] = useState(false)

  function resetAll() {
    setTheme('light')
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter(
      (key): key is string => key?.startsWith('kotak:') ?? false
    )
    keys.forEach((key) => localStorage.removeItem(key))
    resetGuestSession()
    navigate(routes.landing)
  }

  return (
    <div className="mx-auto w-full max-w-[720px] space-y-8">
      <header className="space-y-2">
        <h1 className="text-title-m text-text-primary lg:text-title-l">Settings</h1>
        <p className="text-body-m text-text-muted">Manage your saved guest data and preferences on this device.</p>
      </header>

      <section className="surface-card space-y-4 p-5 lg:p-6" aria-labelledby="reset-title">
        <div className="space-y-1">
          <h2 id="reset-title" className="text-title-s text-text-primary">
            Reset All Data
          </h2>
          <p className="text-body-s text-text-muted">
            Clear your guest session and every Kotak preference saved in this browser.
          </p>
        </div>

        {confirmingReset ? (
          <div
            className="space-y-4 rounded-md border border-border-subtle bg-bg-panel p-4"
            role="group"
            aria-label="Confirm Reset All"
            aria-live="polite"
          >
            <p className="text-body-s text-text-primary">
              Reset all Kotak data on this device? This action cannot be undone.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" fullWidth className="sm:w-auto" onClick={() => setConfirmingReset(false)}>
                Cancel
              </Button>
              <Button variant="primary" fullWidth className="sm:w-auto" onClick={resetAll}>
                Reset All
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmingReset(true)}>
            Reset All
          </Button>
        )}
      </section>
    </div>
  )
}
