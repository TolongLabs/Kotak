// Prints submission/RUNPOD PROOF OF USE.pdf and submission/REPLIT PROOF OF USE.pdf from the HTML beside this file.
// It serves the repo root (so proof.js can read Kopi and the screenshots onto a canvas) and prints each page with
// headless Chrome. Fonts load from Google Fonts, so it needs a network connection.
// Run: bun run build:proofs   (set CHROME to use another Chrome or Chromium binary)
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '../..')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PROOFS = { runpod: 'RUNPOD PROOF OF USE.pdf', replit: 'REPLIT PROOF OF USE.pdf' }

const server = Bun.serve({
  port: 0,
  fetch: async (request) => {
    const file = Bun.file(join(ROOT, decodeURIComponent(new URL(request.url).pathname)))
    return (await file.exists()) ? new Response(file) : new Response(null, { status: 404 })
  }
})
const profile = await mkdtemp(join(tmpdir(), 'proof-chrome-'))

try {
  for (const [name, file] of Object.entries(PROOFS)) {
    const out = join(ROOT, 'submission', file)
    const chrome = Bun.spawn(
      [
        CHROME,
        '--headless',
        `--user-data-dir=${profile}`,
        '--no-pdf-header-footer',
        '--virtual-time-budget=20000',
        `--print-to-pdf=${out}`,
        new URL(`/scripts/proof-of-use/${name}.html`, server.url).href
      ],
      { stdout: 'ignore', stderr: 'pipe' }
    )
    if ((await chrome.exited) !== 0)
      throw new Error(`Chrome failed on ${name}: ${await new Response(chrome.stderr).text()}`)
    console.log(`wrote submission/${file}`)
  }
} finally {
  server.stop(true)
  await rm(profile, { recursive: true, force: true })
}
