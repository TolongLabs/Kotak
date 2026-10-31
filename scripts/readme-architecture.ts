// Archify owns the topology, routing and canonical HTML; Kotak and SDC style its SVG exports.
// bun scripts/readme-architecture.ts (ARCHIFY_BIN can point to an installed Archify CLI.)
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = join(import.meta.dir, '..')
const common = Bun.spawnSync(['git', 'rev-parse', '--git-common-dir'], { cwd: root })
if (common.exitCode !== 0) throw new Error('Run this generator inside the Kotak repository.')
const repository = dirname(resolve(root, common.stdout.toString().trim()))
const archify = resolve(process.env.ARCHIFY_BIN ?? join(repository, '.agents/skills/archify/bin/archify.mjs'))
if (!(await Bun.file(archify).exists()))
  throw new Error('Install the Archify skill or set ARCHIFY_BIN to its bin/archify.mjs.')
const artifacts = resolve(
  process.env.ARCHIFY_ARTIFACT_DIR ?? join(repository, '../.orchestration/readme-architecture', String(Date.now()))
)
const { mkdir } = await import('node:fs/promises')
await mkdir(artifacts, { recursive: true })
const html = join(artifacts, 'architecture.html')
const finalized = Bun.spawnSync(
  [
    process.execPath,
    archify,
    'finalize',
    'architecture',
    'docs/readme/architecture.json',
    html,
    '--repo-root',
    root,
    '--quality',
    'showcase',
    '--out-dir',
    artifacts,
    '--json'
  ],
  { cwd: root, stdout: 'inherit', stderr: 'inherit' }
)
if (finalized.exitCode !== 0) throw new Error('Archify did not pass every delivery gate; exports were not changed.')

// Reuse the browser workspace's existing dependency rather than adding another browser installation.
const { chromium } = createRequire(join(root, 'packages/browser/package.json'))('playwright-core')
const browser = await chromium.launch({ channel: 'chrome', downloadsPath: artifacts })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true })
const tokens = await Bun.file(join(root, 'apps/web/src/styles/tokens.css')).text()
const fonts = await Bun.file(join(root, 'docs/demo/final/assets/fonts.css')).text()
const submissionFont = Buffer.from(
  await Bun.file(join(root, 'scripts/submission/assets/montserrat-latin.woff2')).arrayBuffer()
).toString('base64')
const specification = await Bun.file(join(root, 'docs/readme/architecture.json')).json()
const vertical = specification.connections
  .filter((edge: { from: string; to: string }) => {
    const from = specification.components.find((node: { id: string }) => node.id === edge.from)
    const to = specification.components.find((node: { id: string }) => node.id === edge.to)
    return from.pos[0] + from.size[0] / 2 === to.pos[0] + to.size[0] / 2
  })
  .map((edge: { from: string; to: string }) => `${edge.from}:${edge.to}`)
try {
  await page.goto(pathToFileURL(html).href)
  for (const theme of ['light', 'dark', 'sdc'] as const) {
    await page
      .getByRole('button', { name: /Export/ })
      .first()
      .click()
    const pending = page.waitForEvent('download')
    await page.getByText(`SVG · ${theme === 'dark' ? 'Dark' : 'Light'}`, { exact: true }).click()
    const download = await pending
    const nativeFile = join(artifacts, `${theme}.native.svg`)
    await download.saveAs(nativeFile)
    const native = await Bun.file(nativeFile).text()
    const colours = new Map<string, string>()
    const declarations = theme === 'dark' ? tokens : tokens.split(":root[data-theme='dark']")[0]!
    for (const match of declarations.matchAll(/--k-color-([\w-]+):\s*(#[\da-f]+);/gi)) colours.set(match[1]!, match[2]!)
    const colour = (name: string) => {
      const value = colours.get(name)
      if (!value) throw new Error(`Missing Kotak colour token: ${name}`)
      return value
    }
    const style =
      theme === 'sdc'
        ? `
      @font-face { font-family: Montserrat; font-style: normal; font-weight: 400 700; src: url(data:font/woff2;base64,${submissionFont}) format('woff2'); }
      svg { background: transparent; }
      text { font-family: Montserrat, sans-serif; fill: #444; }
      .t-primary { font-size: 14px; font-weight: 700; }
      .t-muted { font-size: 11px; font-weight: 500; }
      [class^='t-edge-'] { font-size: 11px; font-weight: 600; }
      [class^='c-']:not(.c-mask):not(.c-region) { fill: #fff; stroke: #444; }
      .c-frontend { fill: #fbc20a !important; }
      .c-backend { stroke: #0078a8 !important; }
      .c-database { stroke: #4b9d37 !important; }
      .c-cloud { stroke: #c44a4f !important; }
      .c-mask { fill: #fff; }
      [data-node-id='web'] .c-mask { fill: #fbc20a; }
      .c-region { fill: #f5f5f5; stroke: #999; }
      [class^='a-'] { fill: none; stroke: #444; stroke-width: 1.5px; }
      .a-dashed { stroke-dasharray: 6 5; }
      [class^='m-'] { fill: #444; }
      .semantic-sigil { fill: none; stroke: #444; stroke-width: 1.2px; }
      .sigil-fill { fill: #444; stroke: none; }
      .t-cloud { font-size: 12px; font-weight: 600; }
    `
        : `${fonts}
      svg { background: transparent; ${['bg-default', 'bg-panel', 'text-primary', 'text-muted', 'border-subtle', 'accent-box', 'accent-on-box', 'accent-on-box-muted'].map((name) => `--${name}: ${colour(name)};`).join(' ')} }
      text { font-family: 'Atkinson Hyperlegible Next', sans-serif; fill: var(--text-primary); }
      .t-primary { font-size: 14px; font-weight: 700; }
      .t-muted { font-size: 12px; fill: var(--text-muted); }
      [class^='t-edge-'] { font-family: 'Atkinson Hyperlegible Mono', monospace; font-size: 12px; font-weight: 500; fill: var(--text-muted); }
      [class^='c-']:not(.c-mask):not(.c-region) { fill: var(--bg-panel); stroke: var(--border-subtle); }
      .c-frontend { fill: var(--accent-box) !important; stroke: var(--accent-on-box) !important; }
      .c-mask { fill: var(--bg-default); }
      .c-region { fill: var(--bg-panel); stroke: var(--border-subtle); }
      [data-node-id='web'] .c-mask { fill: var(--accent-box); }
      [data-node-id='web'] text { fill: var(--accent-on-box); }
      [data-node-id='web'] .t-muted { fill: var(--accent-on-box-muted); }
      [class^='a-'] { fill: none; stroke: var(--text-primary); stroke-width: 1.5px; }
      .a-dashed { stroke-dasharray: 6 5; }
      [class^='m-'] { fill: var(--text-primary); }
      .semantic-sigil { fill: none; stroke: var(--text-muted); stroke-width: 1.2px; }
      .sigil-fill { fill: var(--text-muted); stroke: none; }
      [data-node-id='web'] .semantic-sigil { stroke: var(--accent-on-box); }
      .t-cloud { font-size: 12px; fill: var(--text-muted); }
    `
    const svg = await page.evaluate(
      ({ native, style, theme, vertical }: { native: string; style: string; theme: string; vertical: string[] }) => {
        const document = new DOMParser().parseFromString(native, 'image/svg+xml')
        if (document.querySelector('parsererror')) throw new Error('Archify exported invalid SVG.')
        const svg = document.documentElement
        svg.querySelectorAll('style').forEach((element) => element.remove())
        const [, , width, height] = svg.getAttribute('viewBox')!.split(/\s+/).map(Number)
        // Remove only the canvas paint and grid. Nodes and label masks keep opaque fills.
        for (const child of [...svg.children]) {
          if (child.tagName !== 'rect') continue
          if (
            (child.getAttribute('width') === String(width) && child.getAttribute('height') === String(height)) ||
            child.getAttribute('fill') === 'url(#grid)'
          )
            child.remove()
        }
        // The opaque underlay and visible outline must share the same corner geometry.
        svg.querySelectorAll('[data-node-id] > rect').forEach((element) => {
          element.setAttribute('rx', '12')
          element.setAttribute('stroke-width', '1')
        })
        const frame = svg.querySelector('[data-composition-frame-kind="region"]')!
        const heading = svg.querySelector('[data-boundary-label]')!
        heading.setAttribute('x', String(Number(frame.getAttribute('x')) + Number(frame.getAttribute('width')) - 18))
        heading.setAttribute('y', String(Number(frame.getAttribute('y')) + 23))
        heading.setAttribute('text-anchor', 'end')
        // Native boundary labels have a canvas-coloured mask; the heading sits inside its frame now.
        if (heading.previousElementSibling?.matches('rect.c-mask')) heading.previousElementSibling.remove()
        // Kotak's larger source labels sit beside vertical paths, without canvas-coloured masks.
        svg.querySelectorAll('g[data-edge-from]').forEach((group) => {
          group.querySelectorAll('rect.c-mask').forEach((mask) => mask.remove())
          if (!vertical.includes(`${group.getAttribute('data-edge-from')}:${group.getAttribute('data-edge-to')}`))
            return
          group.querySelectorAll('text').forEach((text) => {
            text.setAttribute('text-anchor', 'end')
            text.setAttribute('dx', '-8')
          })
        })
        const css = document.createElementNS('http://www.w3.org/2000/svg', 'style')
        css.textContent = style
        svg.prepend(css)
        svg.setAttribute('data-theme', theme)
        svg.setAttribute('data-kotak-export', 'archify-canonical-svg; transparent-canvas')
        return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg) + '\n'
      },
      { native, style, theme, vertical }
    )
    const output =
      theme === 'sdc' ? 'scripts/submission/assets/system-diagram.svg' : `docs/readme/architecture-${theme}.svg`
    await Bun.write(join(root, output), svg.replace(/[ \t]+$/gm, ''))
  }
} finally {
  await browser.close()
}
