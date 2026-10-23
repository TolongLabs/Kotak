import type { GuestSession } from '@kotak/shared'
import { routes } from '../../app/routes'

/**
 * Where a page with no role to show sends the user: to pick a role when they've already told Kopi about themselves
 * without naming a job (#284), otherwise to the check-up start.
 */
export function startAgain(session: Pick<GuestSession, 'profile' | 'role_code'>) {
  return session.profile.situation !== null && !session.role_code
    ? { route: routes.choose, label: 'Pick a Role to Check', speech: 'Pick a role to check first' }
    : { route: routes.checkUp, label: 'Choose Your Job', speech: 'Tell me your job first' }
}
