import { app } from './app'
import { jobstreetDatabase } from './scrapers/jobstreet/database'
import { JOBSTREET_CAREERS } from './scrapers/jobstreet/careers'

type ScheduledController = { scheduledTime: number; cron: string }

function singaporeDate(date: Date) {
  const values = new Map(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  )
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`
}

export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: { DATABASE_URL?: string }) {
    const url = env.DATABASE_URL?.trim()
    if (!url) throw new Error('DATABASE_URL must be configured for the daily JobStreet queue')
    const sql = jobstreetDatabase(url)
    const scheduledFor = singaporeDate(new Date(controller.scheduledTime))
    for (const career of JOBSTREET_CAREERS) {
      await sql.query(
        `INSERT INTO jobstreet_scrape_runs (id, career_slug, mode, status, source, scheduled_for)
         SELECT $1, $2, 'breadth', 'queued', 'schedule', $3::date
         WHERE NOT EXISTS (
           SELECT 1 FROM jobstreet_scrape_runs
           WHERE career_slug = $2 AND status IN ('queued', 'running')
         )
         ON CONFLICT DO NOTHING`,
        [crypto.randomUUID(), career.slug, scheduledFor]
      )
    }
    console.info(`Queued daily JobStreet breadth refresh for ${scheduledFor} (Asia/Singapore).`)
  }
}
