import type { Locator, Page } from 'playwright-core'
import { searchUrl } from './records'

const between = (low: number, high: number) => low + Math.random() * (high - low)
const gaussian = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random())

// Adapted from TolongLarp/browser/human.py: bounded wheel notches, Fitts reach time,
// off-centre aiming, a curved pointer path, and a nonzero press dwell.
// This helper is restricted to the already validated pagination link.
export class PaginationHand {
  private at = { x: 0, y: 0 }

  constructor(private page: Page) {}

  private async reach(target: { x: number; y: number }, width: number, viewport: { width: number; height: number }) {
    const origin = { ...this.at }
    const dx = target.x - origin.x
    const dy = target.y - origin.y
    const distance = Math.hypot(dx, dy) || 1
    const bow = gaussian() * distance * 0.1
    const c1 = { x: origin.x + dx / 3 - (dy / distance) * bow, y: origin.y + dy / 3 + (dx / distance) * bow }
    const c2 = {
      x: origin.x + (dx * 2) / 3 - (dy / distance) * bow,
      y: origin.y + (dy * 2) / 3 + (dx / distance) * bow
    }
    const seconds = Math.min(
      1.6,
      Math.max(0.12, (0.08 + 0.14 * Math.log2(1 + distance / Math.max(6, width))) * between(0.85, 1.15))
    )
    const moves = Math.max(12, Math.ceil(seconds * 80))
    for (let index = 1; index <= moves; index++) {
      const t = index / moves
      const u = 1 - (1 - t) ** 3
      const v = 1 - u
      const x = v ** 3 * origin.x + 3 * v ** 2 * u * c1.x + 3 * v * u ** 2 * c2.x + u ** 3 * target.x
      const y = v ** 3 * origin.y + 3 * v ** 2 * u * c1.y + 3 * v * u ** 2 * c2.y + u ** 3 * target.y
      await this.page.mouse.move(
        Math.max(0, Math.min(viewport.width - 1, x)),
        Math.max(0, Math.min(viewport.height - 1, y))
      )
      await Bun.sleep((seconds * 1000) / moves)
    }
    this.at = target
    return moves
  }

  async clickNext(link: Locator, expectedUrl: string) {
    const deadline = Date.now() + 120_000
    let notches = 0
    let box = await link.boundingBox()
    const viewport = await this.page.evaluate(() => ({ width: innerWidth, height: innerHeight }))
    let moves = await this.reach(
      { x: viewport.width * between(0.35, 0.7), y: viewport.height * between(0.35, 0.7) },
      200,
      viewport
    )
    while (box && (box.y < 24 || box.y + box.height > viewport.height - 24)) {
      if (Date.now() >= deadline) throw new Error('Next link could not be reached by scrolling')
      const direction = box.y < 24 ? -1 : 1
      await this.page.mouse.wheel(0, direction * between(90, 130))
      notches++
      await Bun.sleep(between(35, 145))
      if (notches % 6 === 0) await Bun.sleep(between(800, 1800))
      box = await link.boundingBox()
    }
    if (!box || box.width < 2 || box.height < 2) throw new Error('Next link has no usable visible bounds')
    const marginX = Math.min(8, box.width / 4)
    const marginY = Math.min(8, box.height / 4)
    const target = {
      x: Math.min(
        box.x + box.width - marginX,
        Math.max(box.x + marginX, box.x + box.width / 2 + (gaussian() * box.width) / 8)
      ),
      y: Math.min(
        box.y + box.height - marginY,
        Math.max(box.y + marginY, box.y + box.height / 2 + (gaussian() * box.height) / 8)
      )
    }
    if (target.x < 0 || target.x >= viewport.width || target.y < 0 || target.y >= viewport.height)
      throw new Error('Next link is outside the browser viewport')
    moves += await this.reach(target, box.width, viewport)
    await Bun.sleep(between(40, 220))
    const href = await link.getAttribute('href')
    if (!href || searchUrl(new URL(href, this.page.url()).href) !== expectedUrl)
      throw new Error('Next link changed before the click')
    const uncovered = await link.evaluate(
      (element, point) => document.elementFromPoint(point.x, point.y)?.closest('a') === element,
      target
    )
    if (!uncovered) throw new Error('Next link is covered by another element; refusing to click')
    const dwell = between(55, 130)
    const previousUrl = this.page.url()
    // Start navigation waiting only after the potentially lengthy scroll and pointer movement.
    await Promise.all([
      this.page.waitForURL((url) => url.href !== previousUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 }),
      (async () => {
        try {
          await this.page.mouse.down()
          await Bun.sleep(dwell)
        } finally {
          await this.page.mouse.up()
        }
      })()
    ])
    return { scroll_notches: notches, pointer_moves: moves, press_ms: Math.round(dwell) }
  }
}
