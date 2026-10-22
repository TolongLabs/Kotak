import { BriefcaseBusiness, ClipboardCheck, House, Radar, Route, type LucideIcon } from 'lucide-react'
import { routes } from '../routes'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  // Paths that mark this item as the current page.
  match: readonly string[]
}

export const navItems: readonly NavItem[] = [
  { label: 'Home', to: routes.home, icon: House, match: [routes.home, routes.changes] },
  { label: 'Check-Up', to: routes.checkUp, icon: ClipboardCheck, match: [routes.checkUp, routes.questions] },
  { label: 'Radar', to: routes.radar, icon: Radar, match: [routes.radar] },
  { label: 'Roles', to: routes.roles, icon: BriefcaseBusiness, match: [routes.roles] },
  { label: 'Roadmap', to: routes.roadmap, icon: Route, match: [routes.roadmap] }
]
