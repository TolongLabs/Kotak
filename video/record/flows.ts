import { expect, type BrowserContext, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { BASE_URL, CLOCK, SHOTS, VIDEO_ROOT } from './contract'

export const SESSION_KEY = 'kotak:guest-session'
export const SEED_PATH = join(VIDEO_ROOT, 'record', '.state', 'guest-session.json')
export const KEYS = SHOTS.sample_profile.answer_keys_in_asking_order

// The intake from shots.json: Working; "web developer", pick Web Developers; Stay Strong in My Job.
// Each choice is a card: a label around a visually hidden radio, so the card is what a person clicks.
const card = (page: Page, group: string, name: RegExp) =>
  page
    .getByRole('radiogroup', { name: group })
    .locator('label')
    .filter({ has: page.getByRole('radio', { name }) })
export const situation = (page: Page) => card(page, 'Right Now, I’m', /^Working/)
export const jobField = (page: Page) => page.getByRole('combobox', { name: 'Your Job Title' })
export const jobOption = (page: Page) =>
  page
    .getByRole('listbox', { name: 'Your Job Title Suggestions' })
    .getByRole('option', { name: /^Web Developers\b/ })
    .first()
export const goal = (page: Page) => card(page, 'What Do You Want?', /^Stay Strong in My Job/)
export const startQuestions = (page: Page) => page.getByRole('button', { name: 'Start the 12 Questions' })
export const questionCounter = (page: Page, n: number) => page.getByText(`Question ${n} of 12`, { exact: true })
export const questionCard = (page: Page) => page.getByRole('region', { name: 'Question Card' })
export const answerButton = (page: Page, key: number) => page.getByRole('button', { name: new RegExp(`^${key} `) })

/** Answers question n (1-based) with its key from the answer key, and waits until the app moves on. */
export async function answer(page: Page, n: number): Promise<void> {
  await expect(questionCounter(page, n)).toBeVisible()
  await page.keyboard.press(String(KEYS[n - 1]))
  if (n < 12) await expect(questionCounter(page, n + 1)).toBeVisible({ timeout: 10_000 })
}

/** A fresh context's page on the fixed clock, Monday 2 November 2026, 09:00 MYT. */
export async function onClock(page: Page): Promise<void> {
  await page.clock.setFixedTime(CLOCK)
}

/**
 * Puts the finished check-up into a fresh context, once per context, as the app saved it at the end of the seed run
 * (global-setup.ts). Later reloads keep whatever the app writes, as a real visitor's browser would.
 */
export async function seedFinished(context: BrowserContext, changes: Record<string, unknown> = {}): Promise<void> {
  const session = { ...JSON.parse(await readFile(SEED_PATH, 'utf8')), ...changes }
  await context.addInitScript(
    ({ key, value }) => {
      if (sessionStorage.getItem('recorder-seeded')) return
      localStorage.clear()
      localStorage.setItem(key, value)
      sessionStorage.setItem('recorder-seeded', '1')
    },
    { key: SESSION_KEY, value: JSON.stringify(session) }
  )
}

export const url = (path: string) => `${BASE_URL}${path}`
