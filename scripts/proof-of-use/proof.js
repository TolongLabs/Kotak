// Draws the ASCII parts of a proof PDF before Chrome prints it: the cover's split hero (after ascii-magic's
// before/after slider), Kopi sitting on the box and the cut "kotak" wordmark (after the README banner and the
// landing footer). Glyphs are text, not pixels, so they stay sharp in the PDF.
const RAMP = ' .:-=+*#%@'
const SANS = '"Atkinson Hyperlegible Next"'
const MONO = '"Atkinson Hyperlegible Mono"'

// Seeded so every build draws the same glyphs.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const probe = document.createElement('canvas').getContext('2d')

// Sizes a mono grid so `cols` glyphs fill `width` exactly.
function grid(pre, width, height, cols) {
  probe.font = `500 100px ${MONO}`
  const advance = probe.measureText('M').width / 100
  const cell = width / cols
  const size = cell / advance
  pre.style.fontSize = `${size}px`
  pre.style.lineHeight = `${size}px`
  return { cols, rows: Math.ceil(height / size), cellWidth: cell, cellHeight: size }
}

// Writes glyphs row by row, joining runs of one colour class into a single span.
function paint(pre, cols, cells) {
  let html = ''
  for (let i = 0; i < cells.length; i += cols) {
    let run = ''
    let tone = ''
    for (const [glyph, cls] of cells.slice(i, i + cols)) {
      const next = glyph === ' ' ? tone : cls
      if (next !== tone) {
        html += tone ? `<span class="${tone}">${run}</span>` : run
        run = ''
        tone = next
      }
      run += glyph
    }
    html += (tone ? `<span class="${tone}">${run}</span>` : run) + '\n'
  }
  pre.innerHTML = html
}

function pixels(image, cols, rows, fit) {
  const canvas = document.createElement('canvas')
  canvas.width = cols
  canvas.height = rows
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.imageSmoothingQuality = 'high'
  fit(context, image)
  return context.getImageData(0, 0, cols, rows).data
}

async function load(src) {
  const image = new Image()
  image.src = src
  await image.decode()
  return image
}

// A screenshot redrawn in glyphs: brightness above the screen's own background picks the glyph, and saturated
// UI colour turns yellow.
async function split(figure) {
  const image = await load(figure.querySelector('img').src)
  const pre = figure.querySelector('pre')
  const { clientWidth: width, clientHeight: height } = figure
  const { cols, rows } = grid(pre, width, height, 170)
  const data = pixels(image, cols, rows, (context, art) => context.drawImage(art, 0, 0, cols, rows))
  const lights = []
  for (let i = 0; i < data.length; i += 4)
    lights.push((0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255)
  const sorted = [...lights].sort((a, b) => a - b)
  const [floor, peak] = [sorted[Math.floor(sorted.length * 0.5)], sorted[Math.floor(sorted.length * 0.995)]]
  const cells = lights.map((light, n) => {
    const [r, g, b] = [data[n * 4], data[n * 4 + 1], data[n * 4 + 2]]
    const max = Math.max(r, g, b)
    const saturation = max ? (max - Math.min(r, g, b)) / max : 0
    const density = Math.min(1, Math.max(0, (light - floor) / (peak - floor))) ** 0.6
    if (density < 0.1) return [' ', '']
    return [RAMP[Math.max(1, Math.round(density * 9))], saturation > 0.4 ? 'hot' : density > 0.5 ? 'hi' : '']
  })
  paint(pre, cols, cells)
}

// Kopi from the app's idle pose, sampled like KopiAscii: dense where the black cat is darkest, yellow eyes kept.
async function kopi(box) {
  const image = await load('/apps/web/public/kopi/idle.png')
  const pre = box.querySelector('pre')
  const { clientWidth: width, clientHeight: height } = box
  const { cols, rows, cellWidth, cellHeight } = grid(pre, width, height, 46)
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)
  const data = pixels(image, cols, rows, (context, art) =>
    context.drawImage(
      art,
      (width - art.naturalWidth * scale) / 2 / cellWidth,
      (height - art.naturalHeight * scale) / cellHeight,
      (art.naturalWidth * scale) / cellWidth,
      (art.naturalHeight * scale) / cellHeight
    )
  )
  // The cat is mostly one dark tone, so density follows the art's own light range rather than black-to-white.
  const opaque = []
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255
    if (alpha < 0.1) continue
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]].map((value) => Math.min(255, value / alpha))
    opaque.push({
      i: i / 4,
      alpha,
      yellow: r > 120 && g > 100 && b < 0.6 * g,
      light: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    })
  }
  const lights = opaque.map((cell) => cell.light)
  const darkest = Math.min(...lights)
  const range = Math.max(Math.max(...lights) - darkest, 0.05)
  const random = seeded(46)
  const cells = Array.from({ length: cols * rows }, () => [' ', ''])
  for (const { i, alpha, yellow, light } of opaque) {
    const density = Math.max(0, alpha * (0.25 + 0.75 * (1 - (light - darkest) / range)) - 0.25 * random())
    cells[i] = [RAMP[Math.max(1, Math.round(density * 9))], yellow ? 'hot' : density > 0.55 ? 'hi' : '']
  }
  paint(pre, cols, cells)
}

// The footer wordmark: "kotak" set in Next ExtraBold, read per cell and redrawn from the density ramp.
function wordmark(pre) {
  const word = pre.dataset.word
  const width = pre.parentElement.clientWidth - 2 * parseFloat(getComputedStyle(pre.parentElement).paddingLeft)
  probe.font = `800 100px ${SANS}`
  const metrics = probe.measureText(word)
  const scale = width / (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight)
  const height = (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) * scale
  const { cols, rows, cellWidth, cellHeight } = grid(pre, width, height, 150)

  const ink = document.createElement('canvas')
  ink.width = Math.ceil(width)
  ink.height = Math.ceil(rows * cellHeight)
  const context = ink.getContext('2d', { willReadFrequently: true })
  context.font = `800 ${100 * scale}px ${SANS}`
  context.fillText(word, metrics.actualBoundingBoxLeft * scale, metrics.actualBoundingBoxAscent * scale)
  const alpha = context.getImageData(0, 0, ink.width, ink.height).data
  const random = seeded(word.length * 7919)
  const cells = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const [x0, x1] = [Math.floor(col * cellWidth), Math.min(ink.width, Math.floor((col + 1) * cellWidth))]
      const [y0, y1] = [Math.floor(row * cellHeight), Math.min(ink.height, Math.floor((row + 1) * cellHeight))]
      let sum = 0
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) sum += alpha[(y * ink.width + x) * 4 + 3]
      const coverage = sum / 255 / Math.max(1, (x1 - x0) * (y1 - y0))
      const density = Math.max(0, coverage - 0.3 * random())
      cells.push([coverage < 0.12 ? ' ' : RAMP[Math.max(1, Math.round(density * 9))], ''])
    }
  }
  paint(pre, cols, cells)
}

// Sets each .fit title so its text fills the column, like an Awwwards headline.
function fit(title) {
  const text = title.querySelector('span')
  title.style.fontSize = '100px'
  title.style.fontSize = `${(100 * title.clientWidth) / text.getBoundingClientRect().width}px`
}

async function draw() {
  await Promise.all([document.fonts.load(`800 100px ${SANS}`), document.fonts.load(`500 100px ${MONO}`)])
  document.querySelectorAll('.fit').forEach(fit)
  document.querySelectorAll('pre[data-word]').forEach(wordmark)
  await Promise.all([
    ...[...document.querySelectorAll('.split')].map(split),
    ...[...document.querySelectorAll('.kopi')].map(kopi)
  ])
  document.documentElement.dataset.ready = 'true'
}

draw()
