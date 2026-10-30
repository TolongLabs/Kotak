import { useSyncExternalStore } from 'react'

// The space's one phone rule, for the camera's opening shot and for the HUD's layout: Tailwind's max-sm query (under
// 640 px at the default font size) in portrait, so it agrees with the HUD's max-sm:portrait classes. A narrow landscape
// window keeps the desktop layout, compacted, as its stack would leave the scene no room.
const PHONE = '(width < 40rem) and (orientation: portrait)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(PHONE)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export function usePhoneLayout(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(PHONE).matches)
}
