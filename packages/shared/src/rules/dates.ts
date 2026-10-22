// Calendar maths on YYYY-MM-DD strings, in UTC, so results never depend on the viewer's time zone.

const parts = (date: string) => date.split('-').map(Number) as [number, number, number]

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

const format = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** Months since year 0, with the day as a fraction, so the 1st of consecutive months is exactly 1 apart. */
export function monthIndex(date: string): number {
  const [y, m, d] = parts(date)
  return y * 12 + (m - 1) + (d - 1) / daysInMonth(y, m)
}

/** The same day `months` later, clamped to the end of a shorter month. */
export function addMonths(date: string, months: number): string {
  const [y, m, d] = parts(date)
  const total = y * 12 + (m - 1) + months
  const year = Math.floor(total / 12)
  const month = (total % 12) + 1
  return format(Date.UTC(year, month - 1, Math.min(d, daysInMonth(year, month))))
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = parts(date)
  return format(Date.UTC(y, m - 1, d + days))
}
