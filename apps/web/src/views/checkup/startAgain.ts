import { assessedRoleCode } from '@kotak/sdk'
import type { GuestSession } from '@kotak/shared'
import { routes } from '../../app/routes'
import { checkupText } from '../../i18n/messages/checkup'
import { textNow } from '../../i18n/text'
import { hasAnswers } from '../../session/store'

/**
 * Where a page with no role to show sends the user: to pick a role when they've already told Kopi about themselves
 * without naming a job (#284), back to the questions when the job is set but unanswered, otherwise to the check-up
 * start.
 */
export function startAgain(
  session: Pick<GuestSession, 'profile' | 'role_code' | 'goal' | 'target_role_code' | 'answers'>
) {
  const t = textNow(checkupText)
  const roleCode = assessedRoleCode(session)
  if (roleCode && !hasAnswers(session))
    return { route: routes.questions, label: t.startAgain.answerQuestions, speech: t.startAgain.finishQuestions(12) }
  return session.profile.situation !== null && !roleCode
    ? { route: routes.choose, label: t.startAgain.pickRole, speech: t.startAgain.pickRoleSpeech }
    : { route: routes.checkUp, label: t.startAgain.chooseJob, speech: t.startAgain.tellJob }
}
