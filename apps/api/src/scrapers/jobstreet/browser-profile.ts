import { withProfile } from '@kotak/browser'
import type { Page } from '@kotak/browser'
import { jobUrl, searchUrl } from './records'

export type JobstreetBrowserScope =
  { mode: 'breadth'; searchUrl: string } | { mode: 'depth'; jobIds: readonly string[] }

export interface BrowserProfileOptions {
  profileId?: string
  headless?: boolean
  browserScope?: JobstreetBrowserScope
}

function compiledScope(scope: JobstreetBrowserScope): (input: string) => boolean {
  if (scope.mode === 'depth') {
    const jobIds = new Set(
      scope.jobIds.map((id) => {
        if (!/^\d+$/.test(id)) throw new Error('Browser scope job IDs must contain only digits')
        return id
      })
    )
    return (input) => {
      try {
        const pathname = new URL(jobUrl(input)).pathname
        return jobIds.has(pathname.slice('/job/'.length))
      } catch {
        return false
      }
    }
  }

  const allowed = new URL(searchUrl(scope.searchUrl))
  allowed.searchParams.delete('page')
  allowed.searchParams.sort()
  return (input) => {
    try {
      const raw = new URL(input)
      const candidate = new URL(searchUrl(input))
      const pages = raw.searchParams.getAll('page')
      const rawPage = pages[0] ?? '1'
      const page = Number(rawPage)
      if (pages.length > 1 || !/^\d+$/.test(rawPage) || !Number.isSafeInteger(page) || page < 1) return false
      for (const key of raw.searchParams.keys()) {
        if (key !== 'page' && !key.startsWith('__cf_chl_') && !allowed.searchParams.has(key)) return false
      }
      candidate.searchParams.delete('page')
      candidate.searchParams.sort()
      return candidate.pathname === allowed.pathname && candidate.search === allowed.search
    } catch {
      return false
    }
  }
}

async function installBrowserScope(page: Page, scope: JobstreetBrowserScope): Promise<void> {
  const context = page.context()
  const allowsTaskDocument = compiledScope(scope)
  const preparedPages = new WeakSet<Page>()
  const preparePage = (candidate: Page) => {
    if (preparedPages.has(candidate)) return
    preparedPages.add(candidate)
    candidate.on('download', (download) => void download.cancel().catch(() => {}))
    if (candidate !== page) void candidate.close().catch(() => {})
  }

  await context.route('**/*', async (route) => {
    const request = route.request()
    if (!request.isNavigationRequest() || request.resourceType() !== 'document') {
      await route.fallback()
      return
    }
    let mainFrame = true
    let requestPage: Page | null = null
    try {
      const frame = request.frame()
      mainFrame = frame.parentFrame() === null
      requestPage = frame.page()
    } catch {
      // A popup's first navigation can precede creation of its Playwright Frame.
    }
    if (!mainFrame) {
      await route.fallback()
      return
    }
    let allowed = false
    try {
      const url = new URL(request.url())
      allowed =
        url.protocol === 'https:' &&
        url.host === 'my.jobstreet.com' &&
        (url.pathname.startsWith('/cdn-cgi/') || allowsTaskDocument(url.href))
    } catch {
      // Invalid and non-network URLs are outside the task scope.
    }
    if (allowed && (requestPage === page || requestPage === null)) {
      await route.fallback()
      return
    }
    await route.abort('blockedbyclient')
    if (requestPage) preparePage(requestPage)
  })
  // The route above sees only the first URL of a redirect chain, and no navigation that a service worker answers. So
  // the task page is also watched: a redirect hop or a committed navigation away from https://my.jobstreet.com
  // closes the page, which ends the scrape. (Blocking service workers instead would patch a browser API that
  // bot checks can see.)
  const leavesJobstreet = (input: string) => {
    if (input.startsWith('about:') || input.startsWith('chrome-error:')) return false
    try {
      const url = new URL(input)
      return url.protocol !== 'https:' || url.host !== 'my.jobstreet.com'
    } catch {
      return true
    }
  }
  const closeTaskPage = (input: string) => {
    let origin = 'an invalid URL'
    try {
      origin = new URL(input).origin
    } catch {
      // Reported as invalid.
    }
    console.error(`Closing the browser page: it left my.jobstreet.com for ${origin}`)
    // If the page cannot close, the whole browser context goes.
    void page.close().catch(() => context.close().catch(() => {}))
  }
  context.on('request', (request) => {
    if (!request.redirectedFrom() || !request.isNavigationRequest() || request.resourceType() !== 'document') return
    try {
      const frame = request.frame()
      if (frame.parentFrame() !== null || frame.page() !== page) return
    } catch {
      return
    }
    if (leavesJobstreet(request.url())) closeTaskPage(request.url())
  })
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame() && leavesJobstreet(frame.url())) closeTaskPage(frame.url())
  })
  context.on('page', preparePage)
  for (const candidate of context.pages()) preparePage(candidate)
  await Promise.all(
    context
      .pages()
      .filter((candidate) => candidate !== page)
      .map((candidate) => candidate.close().catch(() => {}))
  )
}

export function withBrowserProfile<T>(
  options: BrowserProfileOptions,
  run: (page: Page, profileId: string) => Promise<T>,
  onProfile?: (profileId: string) => Promise<void>
): Promise<T> {
  return withProfile(
    { profileId: options.profileId, headless: options.headless },
    async (page, profileId) => {
      if (options.browserScope) await installBrowserScope(page, options.browserScope)
      return run(page, profileId)
    },
    onProfile
  )
}
