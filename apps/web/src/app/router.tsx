import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react'
import { readGuestSession, startGuestSession } from '../session/store'

const NAVIGATE_EVENT = 'kotak:navigate'

function ensureGuestSession(path: string) {
  if ((path === '/app' || path.startsWith('/app/')) && !readGuestSession()) startGuestSession()
}

function subscribe(onChange: () => void) {
  function handleNavigation() {
    ensureGuestSession(window.location.pathname)
    onChange()
  }

  window.addEventListener('popstate', handleNavigation)
  window.addEventListener(NAVIGATE_EVENT, handleNavigation)
  return () => {
    window.removeEventListener('popstate', handleNavigation)
    window.removeEventListener(NAVIGATE_EVENT, handleNavigation)
  }
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname)
}

export function navigate(to: string) {
  const url = new URL(to, window.location.origin)
  if (url.pathname + url.search === window.location.pathname + window.location.search) return
  ensureGuestSession(url.pathname)
  window.history.pushState(null, '', url)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
  window.scrollTo(0, 0)
}

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string
}

export function Link({ to, onClick, ...props }: LinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(to)
  }

  return <a href={to} onClick={handleClick} {...props} />
}
