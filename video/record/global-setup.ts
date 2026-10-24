import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import {
  SEED_PATH,
  SESSION_KEY,
  answer,
  goal,
  jobField,
  jobOption,
  onClock,
  situation,
  startQuestions,
  url
} from './flows'

// Builds the finished check-up once per run through the real intake and the real 12 answers, then saves the session
// the app wrote, with Hours Per Week at 10 (the slider's setting, set off camera). Every seeded take starts from it.
export default async function globalSetup(): Promise<void> {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      timezoneId: 'Asia/Kuala_Lumpur',
      colorScheme: 'light'
    })
    const page = await context.newPage()
    await onClock(page)
    await page.goto(url('/app/check-up'))
    await situation(page).click()
    await jobField(page).fill('web developer')
    await jobOption(page).click()
    await goal(page).click()
    await startQuestions(page).click()
    for (let n = 1; n <= 12; n++) await answer(page, n)
    await page.waitForURL('**/app/radar', { timeout: 60_000 })
    await expect(page.getByText('You (Self-Reported)', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    const saved = await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)
    if (!saved) throw new Error('The app saved no guest session after the 12 answers')
    const session = JSON.parse(saved)
    if (session.role_code !== '15-1254.00' || session.answers.some((item: unknown) => item === null))
      throw new Error(`Unexpected seed session: role ${session.role_code}, answers ${JSON.stringify(session.answers)}`)
    await mkdir(dirname(SEED_PATH), { recursive: true })
    await writeFile(SEED_PATH, JSON.stringify({ ...session, custom_weekly_hours: 10 }, null, 2) + '\n')
  } finally {
    await browser.close()
  }
}
