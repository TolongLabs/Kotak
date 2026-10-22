import { useRef, useState, type ReactNode } from 'react'
import { readGuestSession, startGuestSession } from '../../session/store'
import { AskKopiPanel } from './AskKopi'
import { NavDrawer } from './NavDrawer'
import { Sidebar } from './Sidebar'
import { PhoneTopBar, Topbar } from './Topbar'

export interface AppShellProps {
  path: string
  dataLabel: string
  // The question flow collapses the sidebar to icons so the questions keep the focus.
  collapsed?: boolean
  children: ReactNode
}

const SIDEBAR_STORAGE_KEY = 'kotak:sidebar'

function readSidebarPreference(): boolean | null {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return stored === 'true' ? true : stored === 'false' ? false : null
  } catch {
    return null
  }
}

export function AppShell({ path, dataLabel, collapsed = false, children }: AppShellProps) {
  if (!readGuestSession()) startGuestSession()

  const [menuOpen, setMenuOpen] = useState(false)
  const [kopiOpen, setKopiOpen] = useState(false)
  const [sidebarPreference, setSidebarPreference] = useState(readSidebarPreference)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarCollapsed = sidebarPreference ?? collapsed

  function toggleSidebar() {
    const next = !sidebarCollapsed
    setSidebarPreference(next)
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
    } catch {
      // The preference lasts until the page closes when storage is blocked.
    }
  }

  return (
    <div className="min-h-dvh bg-bg-default lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-accent-box focus:px-4 focus:py-2 focus:text-label-l focus:text-accent-on-box"
      >
        Skip to Content
      </a>
      <Sidebar path={path} collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebar} className="hidden lg:flex" />
      <div className="min-w-0 flex-1">
        {/* z-30 keeps the top bar and its data popover above page parts (z-20 and below); overlays use z-50. */}
        <div className="sticky top-0 z-30 mx-auto w-full max-w-[1184px] px-3 pt-3 lg:px-12 lg:pt-4">
          <Topbar dataLabel={dataLabel} onAskKopi={() => setKopiOpen(true)} className="hidden lg:flex" />
          <PhoneTopBar
            dataLabel={dataLabel}
            onOpenMenu={() => setMenuOpen(true)}
            onAskKopi={() => setKopiOpen(true)}
            menuButtonRef={menuButtonRef}
            className="flex lg:hidden"
          />
        </div>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1184px] px-6 pb-8 pt-4 focus:outline-none lg:px-12 lg:pb-12 lg:pt-8"
        >
          {children}
        </main>
      </div>
      <NavDrawer open={menuOpen} path={path} onClose={() => setMenuOpen(false)} returnFocusRef={menuButtonRef} />
      <AskKopiPanel open={kopiOpen} onClose={() => setKopiOpen(false)} dataLabel={dataLabel} />
    </div>
  )
}
