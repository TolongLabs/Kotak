// Renders the D3 job-ads callout with the numbers read off the card on the recording day, from the pack's
// own source (docs/demo/prelim/graphics/overlays.html in this repo), as public/graphics/c-d3-jobs-day.png.
// Usage: bun scripts/day-card.ts <ad count, rounded to ten> <median RM> <date, e.g. "25 Oct 2026">
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from '../record/node_modules/playwright'

const [count, median, date] = process.argv.slice(2)
if (!count || !median || !date) throw new Error('Usage: bun scripts/day-card.ts 220 6,800 "25 Oct 2026"')
const root = resolve(import.meta.dirname, '..')
const srcDir = resolve(root, '../docs/demo/prelim/graphics')
const html = readFileSync(join(srcDir, 'overlays.html'), 'utf8')
  .replace('<p>About 170 Ads in Malaysia</p>', `<p>About ${count} Ads in Malaysia</p>`)
  .replace('<span>Median RM6,300 a month · as of 24 Oct 2026.</span>', `<span>Median RM${median} a month · as of ${date}.</span>`)
  // Relative fonts and images still resolve against the pack, and nothing is written into docs/.
  .replace('<head>', `<head><base href="file://${srcDir}/">`)
if (!html.includes(`About ${count} Ads`)) throw new Error('overlays.html no longer has the c-d3-jobs text this script replaces')
const page = join(root, 'out/.day-card.html')
mkdirSync(join(root, 'out'), { recursive: true })
writeFileSync(page, html)
const browser = await chromium.launch()
try {
  const tab = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  await tab.goto(`file://${page}`)
  // The pack's export mode: no checkerboard behind the graphics.
  await tab.evaluate(() => document.body.classList.add('render'))
  await tab.evaluate(() => document.fonts.ready)
  const el = tab.locator('#c-d3-jobs')
  await el.screenshot({ path: join(root, 'public/graphics/c-d3-jobs-day.png'), omitBackground: true })
} finally {
  await browser.close()
  rmSync(page)
}
console.log(`Wrote public/graphics/c-d3-jobs-day.png: About ${count} Ads, median RM${median}, as of ${date}`)
