import { ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { Link, navigate } from '../app/router'
import { routes } from '../app/routes'
import { StatCard } from '../components/kotak/StatCard'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { VerdictChip } from '../components/ui/VerdictChip'
import { dashboardStats, user } from '../demo/data'
import { readGuestSession } from '../session/guest'

export function DashboardView() {
  const hasSession = readGuestSession() !== null

  useEffect(() => {
    if (hasSession) return
    // Replace, not push, so the Back button does not return here and loop.
    window.history.replaceState(null, '', routes.signIn)
    // Must match NAVIGATE_EVENT in app/router.tsx.
    window.dispatchEvent(new Event('kotak:navigate'))
  }, [hasSession])

  if (!hasSession) return null

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="text-title-m text-text-primary lg:text-title-l">{user.greeting}</h1>
        <p className="flex flex-wrap items-center gap-3">
          <span className="text-label-m text-text-muted">Last check-up</span>
          <span className="font-mono text-mono-s text-text-primary">{user.lastCheckUp}</span>
        </p>
      </div>

      <Banner type="sample" />

      <section aria-label="Your Progress" className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {dashboardStats.map((tile) => (
          <div key={tile.id} className="flex h-full flex-col [&>section]:flex-1">
            <StatCard label={tile.label} value={tile.value} caption={tile.caption}>
              {tile.progress && (
                <ProgressBar
                  value={Number.parseFloat(tile.progress.value)}
                  label={tile.progress.label}
                  valueText={tile.progress.value}
                />
              )}
              {tile.change && (
                <p className="flex flex-wrap items-center gap-2">
                  <VerdictChip verdict={tile.change.from} size="sm" />
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <VerdictChip verdict={tile.change.to} size="sm" />
                </p>
              )}
              {tile.id === 'what-changed' && (
                <Link
                  to={routes.changes}
                  className="inline-flex items-center gap-1 font-sans font-medium text-text-primary underline decoration-current underline-offset-2 transition-colors duration-150 ease-out hover:text-text-muted"
                >
                  See What Changed
                </Link>
              )}
            </StatCard>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Button variant="primary" size="md" className="w-full lg:w-auto" onClick={() => navigate(routes.checkUp)}>
          Start Check-Up
        </Button>
        <Button variant="secondary" size="md" className="w-full lg:w-auto" onClick={() => navigate(routes.roadmap)}>
          Open Roadmap
        </Button>
      </div>
    </div>
  )
}
