import { EngineSnapshotSchema, sampleSnapshot } from '@kotak/shared'
import type { ComponentType } from 'react'
import { usePath } from './app/router'
import { routes } from './app/routes'
import { AppShell } from './app/shell/AppShell'
import { Gallery } from './dev/Gallery'
import { useActiveSnapshot } from './session/snapshot'
import { CheckUpView } from './views/CheckUpView'
import { ConnectView } from './views/ConnectView'
import { DashboardView } from './views/DashboardView'
import { LandingView } from './views/LandingView'
import { NotFoundView } from './views/NotFoundView'
import { QuestionsView } from './views/QuestionsView'
import { RadarView } from './views/RadarView'
import { RoadmapView } from './views/RoadmapView'
import { RolesView } from './views/RolesView'
import { SignInView } from './views/SignInView'
import { SettingsView } from './views/SettingsView'
import { WhatChangedView } from './views/WhatChangedView'
import { AdminScrapingView } from './views/AdminScrapingView'
import { AdminSignInView } from './views/AdminSignInView'

// Validates the sample engine snapshot at startup (#29).
EngineSnapshotSchema.parse(sampleSnapshot)

const appViews: Record<string, ComponentType> = {
  [routes.home]: DashboardView,
  [routes.checkUp]: CheckUpView,
  [routes.questions]: QuestionsView,
  [routes.radar]: RadarView,
  [routes.roles]: RolesView,
  [routes.roadmap]: RoadmapView,
  [routes.changes]: WhatChangedView,
  [routes.connect]: ConnectView,
  [routes.settings]: SettingsView
}

function Screen({ path, dataLabel }: { path: string; dataLabel: string }) {
  if (path === routes.adminSignIn) return <AdminSignInView />
  if (path === routes.adminScraping) return <AdminScrapingView />
  if (path === routes.landing) return <LandingView />
  if (path === routes.signIn) return <SignInView />

  const View = appViews[path]
  if (!View) return <NotFoundView />

  return (
    <AppShell path={path} dataLabel={dataLabel} collapsed={path === routes.questions}>
      <View />
    </AppShell>
  )
}

export function App() {
  const path = usePath().replace(/(.)\/+$/, '$1')
  const [activeSnapshot] = useActiveSnapshot()

  if (import.meta.env.DEV && window.location.hash === '#gallery') return <Gallery />

  // The data date the shell shows, e.g. "May 2026" for the 2026-05 snapshot.
  const dataLabel = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${activeSnapshot}-01T00:00:00Z`)
  )

  return (
    <div className="contents" data-snapshot-id={activeSnapshot}>
      <Screen path={path} dataLabel={dataLabel} />
    </div>
  )
}
