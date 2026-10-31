// Render the README diagram with Kotak's own colours and embedded typefaces.
// bun scripts/readme-architecture.ts
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
type Point = [number, number]
interface Diagram {
  meta: { title: string; description: string; tokens: string; fonts: string }
  canvas: { width: number; height: number }
  components: { id: string; label: string; sublabel: string[]; pos: Point; size: Point; emphasis?: boolean }[]
  boundaries: { label: string; description: string; pos: Point; size: Point }[]
  connections: {
    id: string
    label: string
    points: Point[]
    label_pos: Point
    variant?: string
    bidirectional?: boolean
  }[]
}
const diagram: Diagram = await Bun.file(join(root, 'docs/readme/architecture.json')).json()
const tokens = await Bun.file(join(root, diagram.meta.tokens)).text()
const fonts = await Bun.file(join(root, diagram.meta.fonts)).text()
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!
  )

for (const theme of ['light', 'dark'] as const) {
  const colours = new Map<string, string>()
  const declarations = theme === 'light' ? tokens.split(":root[data-theme='dark']")[0]! : tokens
  for (const match of declarations.matchAll(/--k-color-([\w-]+):\s*(#[\da-f]+);/gi)) colours.set(match[1]!, match[2]!)
  const colour = (name: string) => {
    const value = colours.get(name)
    if (!value) throw new Error(`Missing design token: ${name}`)
    return value
  }
  const css = `
    ${fonts}
    :root { ${['bg-default', 'bg-panel', 'text-primary', 'text-muted', 'border-subtle', 'accent-box', 'accent-on-box', 'accent-on-box-muted'].map((name) => `--${name}: ${colour(name)};`).join(' ')} }
    text { font-family: 'Atkinson Hyperlegible Next', sans-serif; fill: var(--text-primary); }
    .title { font-size: 33px; font-weight: 800; letter-spacing: -.33px; }
    .body { font-size: 16px; fill: var(--text-muted); }
    .node-title { font-size: 23px; font-weight: 700; }
    .node-detail { font-size: 14px; fill: var(--text-muted); }
    .mono { font-family: 'Atkinson Hyperlegible Mono', monospace; font-size: 14px; font-weight: 500; fill: var(--text-muted); }
    .card { fill: var(--bg-default); stroke: var(--border-subtle); }
    .emphasis .card { fill: var(--accent-box); stroke: var(--accent-on-box); }
    .emphasis text { fill: var(--accent-on-box); }
    .emphasis .node-detail { fill: var(--accent-on-box-muted); }
    .wire { fill: none; stroke: var(--text-primary); stroke-width: 1.5; stroke-linejoin: round; }
    .dashed { stroke-dasharray: 6 5; }
  `
  const boundaries = diagram.boundaries
    .map(
      ({ label, description, pos: [x, y], size: [w, h] }) => `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="var(--bg-panel)" stroke="var(--border-subtle)"/>
    <text x="${x + 32}" y="${y + 40}" class="node-title">${escape(label)}</text>
    <text x="${x + w - 32}" y="${y + 40}" text-anchor="end" class="body">${escape(description)}</text>
  </g>`
    )
    .join('\n')
  const connections = diagram.connections
    .map(
      ({ id, label, points, label_pos: [x, y], variant, bidirectional }) => `<g id="${escape(id)}">
    <path class="wire ${variant === 'dashed' ? 'dashed' : ''}" d="${points.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px} ${py}`).join(' ')}" marker-end="url(#arrow)" ${bidirectional ? 'marker-start="url(#arrow)"' : ''}/>
    <text x="${x}" y="${y}" text-anchor="middle" class="mono">${escape(label)}</text>
  </g>`
    )
    .join('\n')
  const components = diagram.components
    .map(({ id, label, sublabel, pos: [x, y], size: [w, h], emphasis }) => {
      const titleY = y + (h >= 144 ? 44 : h <= 80 ? 32 : 36)
      return `<g id="${escape(id)}" class="${emphasis ? 'emphasis' : ''}">
      <rect class="card" x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>
      <text class="node-title" x="${x + 24}" y="${titleY}">${escape(label)}</text>
      ${sublabel.map((line, i) => `<text class="node-detail" x="${x + 24}" y="${titleY + 28 + i * 24}">${escape(line)}</text>`).join('\n')}
    </g>`
    })
    .join('\n')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${diagram.canvas.width}" height="${diagram.canvas.height}" viewBox="0 0 ${diagram.canvas.width} ${diagram.canvas.height}" role="img" aria-labelledby="title description">
    <title id="title">${escape(diagram.meta.title)}</title>
    <desc id="description">${escape(diagram.meta.description)} Workers use the React app and fixed SDK rules over dated JSON. The Hono API connects MCP clients, Claude, ElevenLabs and Neon. Before deploy, Bun ingests public data and uses a one-time RunPod batch to draft skills.</desc>
    <style>${css}</style>
    <defs><marker id="arrow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1 1 L 11 6 L 1 11" fill="none" stroke="${colour('text-primary')}" stroke-width="1.5"/></marker></defs>
    <rect width="100%" height="100%" fill="var(--bg-default)"/>
    <text x="48" y="60" class="title">${escape(diagram.meta.title)}</text>
    <text x="48" y="92" class="body">${escape(diagram.meta.description)}</text>
    <g class="emphasis"><rect class="card" x="1288" y="36" width="264" height="48" rx="6"/><text x="1420" y="67" text-anchor="middle" font-size="16" font-weight="600">Fixed Rules Decide</text></g>
    ${boundaries}
    ${connections}
    ${components}
  </svg>\n`
  const output = join(root, `docs/readme/architecture-${theme}.svg`)
  await Bun.write(output, svg)
  console.info(`${output}: ${diagram.canvas.width} × ${diagram.canvas.height}`)
}
