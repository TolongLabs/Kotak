import type { Locator, Page } from '@kotak/browser'
import { searchUrl } from './records'

const between = (low: number, high: number) => low + Math.random() * (high - low)
const wheelNotch = 100

// Clearcote humanizes the trusted pointer and click input. This helper adds the
// whole-notch wheel flicks and pauses used to reach the already validated Next link.
export class PaginationHand {
  constructor(private page: Page) {}

  async clickNext(link: Locator, expectedUrl: string) {
    const deadline = Date.now() + 120_000
    let notches = 0
    let overshot = false
    let box = await link.boundingBox()
    const viewport = await this.page.evaluate(() => ({ height: innerHeight }))

    while (box && (box.y < 24 || box.y + box.height > viewport.height - 24)) {
      if (Date.now() >= deadline) throw new Error('Next link could not be reached by scrolling')
      const direction = box.y < 24 ? -1 : 1
      const roll = Math.random()
      const flickSize = roll < 0.22 ? 1 : roll < 0.56 ? 2 : roll < 0.84 ? 3 : 4
      const flick = Math.min(flickSize, 6 - (notches % 6))
      for (let index = 0; index < flick; index++) {
        await this.page.mouse.wheel(0, direction * wheelNotch)
        notches++
        if (index + 1 < flick) await Bun.sleep(between(22, 70))
      }
      box = await link.boundingBox()
      const visible = box && box.y >= 24 && box.y + box.height <= viewport.height - 24
      if (visible && !overshot && Math.random() < 0.22) {
        await this.page.mouse.wheel(0, direction * wheelNotch)
        notches++
        await Bun.sleep(between(90, 280))
        await this.page.mouse.wheel(0, -direction * wheelNotch)
        notches++
        overshot = true
        box = await link.boundingBox()
      }
      const stillOutside = box && (box.y < 24 || box.y + box.height > viewport.height - 24)
      await Bun.sleep(stillOutside ? between(140, 460) : between(22, 70))
    }
    if (!box || box.width < 2 || box.height < 2) throw new Error('Next link has no usable visible bounds')

    await Bun.sleep(between(40, 220))
    const href = await link.getAttribute('href')
    if (!href || searchUrl(new URL(href, this.page.url()).href) !== expectedUrl)
      throw new Error('Next link changed before the click')

    const previousUrl = this.page.url()
    await Promise.all([
      this.page.waitForURL((url) => url.href !== previousUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 }),
      link.click({ timeout: 60_000 })
    ])
    return { scroll_notches: notches }
  }
}
