import { withProfile } from '@kotak/browser'
import type { Page } from '@kotak/browser'

export interface BrowserProfileOptions {
  profileId?: string
  headless?: boolean
}

export function withBrowserProfile<T>(
  options: BrowserProfileOptions,
  run: (page: Page, profileId: string) => Promise<T>,
  onProfile?: (profileId: string) => Promise<void>
): Promise<T> {
  return withProfile(options, run, onProfile)
}
