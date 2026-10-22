import { EngineSnapshotSchema, sampleSnapshot } from '@kotak/shared'
import type { ComponentType } from 'react'
import { usePath } from './app/router'
import { routes } from './app/routes'
import { AppShell } from './app/shell/AppShell'
import { snapshots } from './demo/data'
import { Gallery } from './dev/Gallery'
import { CheckUpView } from './views/CheckUpView'
import { DashboardView } from './views/DashboardView'
import { LandingView } from './views/LandingView'
import { NationalView } from './views/NationalView'
import { NotFoundView } from './views/NotFoundView'
import { QuestionsView } from './views/QuestionsView'
import { RadarView } from './views/RadarView'
import { RoadmapView } from './views/RoadmapView'
import { RolesView } from './views/RolesView'
import { SignInView } from './views/SignInView'
import { WhatChangedView } from './views/WhatChangedView'

const snapshot = EngineSnapshotSchema.parse(sampleSnapshot)

// The data date the shell shows, e.g. "Apr 2026" for the 2026-04 snapshot.
const dataLabel = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
  new Date(`${snapshots[0].id}-01T00:00:00Z`)
)

const appViews: Record<string, ComponentType> = {
  [routes.home]: DashboardView,
  [routes.checkUp]: CheckUpView,
  [routes.questions]: QuestionsView,
  [routes.radar]: RadarView,
  [routes.roles]: RolesView,
  [routes.roadmap]: RoadmapView,
  [routes.changes]: WhatChangedView,
  [routes.national]: NationalView
}

function Screen({ path }: { path: string }) {
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

  if (window.location.hash === '#gallery') return <Gallery />

  return (
    <div className="contents" data-snapshot-id={snapshot.snapshot_id}>
      <Screen path={path} />
    </div>
  )
}
