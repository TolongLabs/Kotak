import { BriefcaseBusiness, ClipboardCheck, House, Plug, Radar, Route, Settings, type LucideIcon } from 'lucide-react'
import { commonText } from '../../i18n/common'
import { routes } from '../routes'

export interface NavItem {
  labelKey: keyof typeof commonText.en.nav
  to: string
  icon: LucideIcon
  // Paths that mark this item as the current page.
  match: readonly string[]
}

export const navItems: readonly NavItem[] = [
  { labelKey: 'home', to: routes.home, icon: House, match: [routes.home, routes.changes] },
  { labelKey: 'checkUp', to: routes.checkUp, icon: ClipboardCheck, match: [routes.checkUp, routes.questions] },
  { labelKey: 'radar', to: routes.radar, icon: Radar, match: [routes.radar] },
  { labelKey: 'roles', to: routes.roles, icon: BriefcaseBusiness, match: [routes.roles] },
  { labelKey: 'roadmap', to: routes.roadmap, icon: Route, match: [routes.roadmap] },
  { labelKey: 'connect', to: routes.connect, icon: Plug, match: [routes.connect] },
  { labelKey: 'settings', to: routes.settings, icon: Settings, match: [routes.settings] }
]
