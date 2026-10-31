import type { Scenario, SnapshotId } from '@kotak/shared'
import type { SpaceText } from '../../../i18n/messages/space'
import { hasNoEstimate } from '../format'
import type { SpaceJob, SpaceModel } from '../model'

// Where every mark in the space goes, from the model alone. The box stands at the origin and the horizon lies toward
// -Z. Each job is a tuft at distance 100 - fit from the box, on a fan facing the horizon whose angle is the job's SOC
// major group; each of its skills is one blade whose height is that skill's 12-month change in AI use (est.). Look
// Around has no fit, so a job's distance is its O*NET Job Zone instead: five bands, zone 1 nearest.

/** How long a switch moves the scene, in seconds: a flip of the AI future, a month switch, and either under reduced
 * motion. The ring and the HUD's ruler both follow them. */
export const FUTURE_SECONDS = 1.2
export const MONTH_SECONDS = 1.6
export const REDUCED_SECONDS = 0.2

/** Metres per fit point: a job with fit 0 stands FIT_SCALE * 100 from the box. */
const FIT_SCALE = 0.2
/**
 * The fan's total angle, in radians, centred on the horizon (-Z). The angle means only the group, so the fan is narrow
 * enough that the opening shot shows every ground ring's left end, and its name painted beyond it, on bare ground.
 */
const FAN = (90 * Math.PI) / 180
/** The gap between two groups' sectors, in radians. */
const SECTOR_GAP = (1.1 * Math.PI) / 180
/** A blade's height for no change in AI use, in metres. */
export const BLADE_H0 = 0.36
/** Above BLADE_H0, each doubling of AI use adds this much, in metres: tall enough that the fast lift reads from afar. */
const BLADE_PER_DOUBLING = 0.55
/** The stub a blade shrinks to at -100%, in metres. */
const BLADE_STUB = 0.05

/** The ground rings, in fit percent, named on the ground; 75% marks the field's inner edge. */
export const FIT_RINGS = [25, 50, 75] as const

export const radiusForFit = (fit: number) => FIT_SCALE * (100 - fit)

/** Look Around's Job Zone bands: zone 1 starts this many metres from the box, and each band is ZONE_DEPTH deep. */
const ZONE_START = 3.5
const ZONE_DEPTH = 3.3
/** The empty margin inside each band's edges, in metres, so the bands read apart. */
const ZONE_PAD = 0.35
const ZONES = [1, 2, 3, 4, 5] as const
const zoneEdge = (zone: number) => ZONE_START + (zone - 1) * ZONE_DEPTH

/** The ground's ring lines, in metres from the box, in the order of ringLabels: the fit rings with answers, each Job
 * Zone band's inner edge without. */
function groundRings(model: SpaceModel): number[] {
  if (model.answers) return FIT_RINGS.map(radiusForFit)
  return ZONES.map(zoneEdge)
}

/** Each ground ring's name in the language on show, in the order World paints them on the ground. */
export function ringLabels(model: SpaceModel, t: Pick<SpaceText, 'rings' | 'jobZone'>): string[] {
  return model.answers ? FIT_RINGS.map(t.rings.fit) : ZONES.map((zone) => t.jobZone(zone))
}

/** The fan's edge angle, in radians from the horizon, where the ground rings' lines end. */
export const FAN_EDGE = FAN / 2
/** Where the ground shader's ring lines have faded out past the fan's edge, in radians (shaders.ts, groundFragment). */
export const LINE_END = FAN_EDGE + 0.02

/**
 * A skill's blade height for its 12-month change in AI use (a fraction, 0.42 is +42%). Rising use climbs on a log scale,
 * BLADE_PER_DOUBLING per doubling; falling use shrinks in a straight line from BLADE_H0 at 0% to BLADE_STUB at -100%,
 * the lowest a change can go. Every distinct change gets its own height; nothing is clipped.
 */
function bladeHeight(change: number): number {
  if (change >= 0) return BLADE_H0 + BLADE_PER_DOUBLING * Math.log2(1 + change)
  return BLADE_STUB + (BLADE_H0 - BLADE_STUB) * (1 + Math.max(change, -1))
}

/** The ring's height above the horizon, in metres at RING_DISTANCE, per unit of an AI usage index. */
export const RING_DISTANCE = 600
export const RING_RADIUS = RING_DISTANCE * Math.tan((9 * Math.PI) / 180)
export const RING_PER_INDEX = RING_DISTANCE * Math.tan((1.8 * Math.PI) / 180)

type JobKind = 'other' | 'related' | 'yours' | 'none'
const KIND_CODE: Record<JobKind, number> = { other: 0, related: 1, yours: 2, none: 3 }

const jobKind = (job: SpaceJob): JobKind => (hasNoEstimate(job) ? 'none' : job.kind)

/** The two snapshots the space blends between: the older one (month 0) and the newer one (month 1). */
export function monthIds(model: SpaceModel): [SnapshotId, SnapshotId] {
  const ids = model.snapshots.map((s) => s.id)
  return [ids[0]!, ids.at(-1)!]
}

const SCENARIOS: Scenario[] = ['slow', 'fast']

/** A stable 0 to 1 hash of a string and a salt, so a job's tufts look the same on every load. */
function hash(text: string, salt: number): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  h = Math.imul(h ^ (h >>> 15), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export interface FieldLayout {
  /** Each job's angle on the fan, in radians from the horizon (negative is left). */
  angles: Float32Array
  /** Each job's distance from the box per state, in the order [month 0 slow, month 0 fast, month 1 slow, month 1 fast]. */
  radii: Float32Array
  bladeCount: number
  /** Per blade: the four states' radii of its job. */
  aRadius: Float32Array
  /** Per blade: the four states' heights, or -1 where the skill has no projection (Unknown). */
  aHeight: Float32Array
  /** Per blade: fan angle, yaw, lean, a 0 to 1 hash. */
  aBlade: Float32Array
  /** Per blade: offset x and z from the tuft's centre, width scale, job index. */
  aShape: Float32Array
  /** Per blade: the job's kind code (KIND_CODE), and its place in the month sweep (0 for the farthest job, 1 the nearest). */
  aMeta: Float32Array
  /** The newer month's slow-future radius of the job at each place in the sweep, farthest first, for the sweep's front. */
  sweepRadii: Float32Array
  /** The ground's ring lines, in metres from the box, in ringLabels' order. */
  rings: number[]
}

interface Sector {
  start: number
  width: number
}

/**
 * Each SOC major group's sector of the fan, as wide as its job count. The groups keep their SOC order, turned so the
 * assessed job's group faces the horizon straight ahead of the box; without one, the first group starts at the left.
 */
function fanSectors(jobs: SpaceJob[]): Map<string, Sector> {
  const groups: string[] = []
  const counts = new Map<string, number>()
  for (const job of jobs) {
    if (!counts.has(job.group)) groups.push(job.group)
    counts.set(job.group, (counts.get(job.group) ?? 0) + 1)
  }
  const usable = FAN - SECTOR_GAP * (groups.length - 1)
  const width = (group: string) => (usable * counts.get(group)!) / jobs.length
  const centreOf = (order: string[], group: string) => {
    let at = -FAN / 2
    for (const g of order) {
      if (g === group) return at + width(g) / 2
      at += width(g) + SECTOR_GAP
    }
    return 0
  }
  const own = jobs.find((job) => job.kind === 'yours')?.group
  const turns = groups.map((_, k) => [...groups.slice(k), ...groups.slice(0, k)])
  const order = own
    ? turns.reduce((best, turn) => (Math.abs(centreOf(turn, own)) < Math.abs(centreOf(best, own)) ? turn : best))
    : groups

  const sectors = new Map<string, Sector>()
  let at = -FAN / 2
  for (const group of order) {
    sectors.set(group, { start: at, width: width(group) })
    at += width(group) + SECTOR_GAP
  }
  return sectors
}

/** Every job's fan angle: its group's sector, alphabetical within. */
function fanAngles(jobs: SpaceJob[], sectors: Map<string, Sector>): Float32Array {
  const counts = new Map<string, number>()
  for (const job of jobs) counts.set(job.group, (counts.get(job.group) ?? 0) + 1)
  // model.jobs is sorted by group, then title, so each job's rank in its group is its alphabetical place.
  const seen = new Map<string, number>()
  const angles = new Float32Array(jobs.length)
  jobs.forEach((job, i) => {
    const rank = seen.get(job.group) ?? 0
    seen.set(job.group, rank + 1)
    const { start, width } = sectors.get(job.group)!
    angles[i] = start + ((rank + 0.5) / counts.get(job.group)!) * width
  })
  return angles
}

/**
 * Look Around: every job in its Job Zone's band and its group's sector. The jobs that share a band and a sector fill it
 * as a grid of near-square cells, in alphabetical order from left to right, each column from the box outward.
 */
function zoneGrid(jobs: SpaceJob[], sectors: Map<string, Sector>): { angles: Float32Array; radii: Float32Array } {
  const cells = new Map<string, number[]>()
  jobs.forEach((job, i) => {
    const key = `${job.zone}:${job.group}`
    cells.set(key, [...(cells.get(key) ?? []), i])
  })
  const angles = new Float32Array(jobs.length)
  const radii = new Float32Array(jobs.length)
  for (const members of cells.values()) {
    const { zone, group } = jobs[members[0]!]!
    const { start, width } = sectors.get(group)!
    const inner = zoneEdge(zone) + ZONE_PAD
    const depth = ZONE_DEPTH - 2 * ZONE_PAD
    const arc = width * (inner + depth / 2)
    const n = members.length
    const rows = Math.min(n, Math.max(1, Math.round(Math.sqrt((n * depth) / arc))))
    const cols = Math.ceil(n / rows)
    members.forEach((i, k) => {
      angles[i] = start + ((Math.floor(k / rows) + 0.5) / cols) * width
      radii[i] = inner + (((k % rows) + 0.5) / rows) * depth
    })
  }
  return { angles, radii }
}

export function fieldLayout(model: SpaceModel): FieldLayout {
  const { jobs } = model
  const months = monthIds(model)
  const sectors = fanSectors(jobs)
  const zones = model.answers ? null : zoneGrid(jobs, sectors)
  const angles = zones?.angles ?? fanAngles(jobs, sectors)
  const radii = new Float32Array(jobs.length * 4)
  jobs.forEach((job, i) => {
    months.forEach((id, m) =>
      SCENARIOS.forEach((s, f) => {
        radii[i * 4 + m * 2 + f] = zones?.radii[i] ?? radiusForFit(job.fit?.[id][s] ?? 0)
      })
    )
  })

  const bladeCount = jobs.reduce((n, job) => n + Math.max(1, job.skills.length), 0)
  const aRadius = new Float32Array(bladeCount * 4)
  const aHeight = new Float32Array(bladeCount * 4)
  const aBlade = new Float32Array(bladeCount * 4)
  const aShape = new Float32Array(bladeCount * 4)
  const aMeta = new Float32Array(bladeCount * 2)

  // The month sweeps from the horizon toward the box by rank, so its front crosses the crowded middle of the field as
  // slowly as its sparse edges.
  const byDistance = jobs.map((_, i) => i).sort((p, q) => radii[q * 4 + 2]! - radii[p * 4 + 2]!)
  const sweepAt = new Float32Array(jobs.length)
  byDistance.forEach((job, rank) => (sweepAt[job] = rank / Math.max(1, jobs.length - 1)))
  const sweepRadii = Float32Array.from(byDistance, (job) => radii[job * 4 + 2]!)

  let b = 0
  jobs.forEach((job, i) => {
    const n = Math.max(1, job.skills.length)
    const spin = hash(job.code, 1) * Math.PI * 2
    for (let k = 0; k < n; k++) {
      const skill = job.skills[k]
      const seed = `${job.code}:${skill?.corner_id ?? k}`
      // Blades splay out from the tuft's centre, like a clump of grass.
      const around = spin + (k / n) * Math.PI * 2 + (hash(seed, 2) - 0.5) * 0.6
      const reach = 0.05 + 0.09 * hash(seed, 3)
      const thick = (0.8 + 0.4 * hash(seed, 4)) * (job.kind === 'yours' ? 2.4 : 1)
      aShape.set([Math.cos(around) * reach, Math.sin(around) * reach, thick, i], b * 4)
      aBlade.set(
        [angles[i]!, around + Math.PI / 2 + (hash(seed, 5) - 0.5) * 0.8, 0.1 + 0.26 * hash(seed, 6), hash(seed, 7)],
        b * 4
      )
      aRadius.set(radii.subarray(i * 4, i * 4 + 4), b * 4)
      months.forEach((id, m) =>
        SCENARIOS.forEach((s, f) => {
          const change = skill?.growth[id][s] ?? null
          aHeight[b * 4 + m * 2 + f] = change === null ? -1 : bladeHeight(change)
        })
      )
      aMeta.set([KIND_CODE[jobKind(job)], sweepAt[i]!], b * 2)
      b++
    }
  })

  return { angles, radii, bladeCount, aRadius, aHeight, aBlade, aShape, aMeta, sweepRadii, rings: groundRings(model) }
}

/** A job's tuft centre on the ground for blend weights future (0 slow to 1 fast) and month (0 older to 1 newer). */
export function tuftPosition(layout: FieldLayout, i: number, future: number, month: number): [number, number] {
  const r = layout.radii
  const a = r[i * 4]! + (r[i * 4 + 1]! - r[i * 4]!) * future
  const b = r[i * 4 + 2]! + (r[i * 4 + 3]! - r[i * 4 + 2]!) * future
  const radius = a + (b - a) * month
  const angle = layout.angles[i]!
  return [Math.sin(angle) * radius, -Math.cos(angle) * radius]
}

export type ShotName = 'wide' | 'field' | 'tuft' | 'ring'
export interface Shot {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  /** On a tall screen the view widens until it spans this many degrees across (CameraRig's MIN_WIDE_FOV if unset). */
  wide?: number
}

/** Where a fly-to lands: the camera's eye and the point it looks at, which the orbit then turns around. */
export type FocusShot = Pick<Shot, 'position' | 'target'>

/**
 * A fly-to faces between these turns from the horizon, in radians (negative is left), as the opening shot looks a little
 * left: the ring stands right of the frame's middle, clear of the docked card top left and of the glow it trails to the
 * left, and short of the ruler on the right. A tuft further round the fan is seen from its outer side, across bare
 * ground. Where the turn nearest the tuft's own direction can't stand close, the others are tried too, TURN_STEPS of
 * them across the range.
 */
const FOCUS_TURN: [number, number] = [(-15 * Math.PI) / 180, (-8 * Math.PI) / 180]
const TURN_STEPS = 5
/**
 * It stops at least this far back from its tuft, in metres, and walks further back until clear, up to FOCUS_FAR, within
 * the orbit's reach (CameraRig's MAX_DISTANCE).
 */
const FOCUS_NEAR = 6
const FOCUS_FAR = 34
const FOCUS_STEP = 1
/** No tuft, and not the box, stands nearer the eye than this, in metres, so it never stands in the grass. */
const FOCUS_ROOM = 2
/**
 * The eye stands above the blades' tips, as high as the first of FOCUS_HEIGHTS that lets it stand close (a lower eye
 * sees the near ground higher in the frame, clear of a high foot, and the far field's tips nearer the horizon), and
 * looks this little down, so the field lies in a band across the frame's middle, with dark sky above and bare ground
 * below. The orbit's lowest view (CameraRig's MAX_POLAR) still has room under it.
 */
const FOCUS_HEIGHTS = [2.8, 2.2, 1.7, 1.3]
const FOCUS_PITCH = (3 * Math.PI) / 180
/** The orbit's target stays at least this high, in metres, on the line of sight (focusShot). */
const TARGET_FLOOR = 0.1
/** The focused tuft's foot stays at least this high in the frame, in normalised device coordinates (-1 is the bottom). */
const FOCUS_LOWEST = -0.55
/**
 * Nothing lit may show behind the HUD's text from the landing: no blade, as tall as its tuft's tallest and reaching out
 * from the tuft's centre as far as its tips splay and lean (BLADE_REACH metres, and BLADE_LEAN of its height); not the
 * glow on the ground under the focused tuft and your own (FOCUS_POOL metres round); not the box with its cat and its
 * glow; not the ring lines on the ground (tested in straight pieces LINE_PIECE metres long); and not the rings' names
 * painted past the lines' left ends (LABEL_LENGTH metres long at most). A text box counts FOCUS_MARGIN CSS pixels wider
 * all round, for the blades' glow.
 */
const BLADE_REACH = 0.14
const BLADE_LEAN = 0.44
const FOCUS_POOL = 1.2
const FOCUS_MARGIN = 14
const BOX = { height: 1.5, spread: 0.8, pool: 1.1 }
const LINE_PIECE = 1.5
const LABEL_LENGTH = 2.6

/** What a landing keeps clear: the lens (vertical field of view in degrees) and the HUD's text, in CSS pixels. */
export interface FocusView {
  fov: number
  width: number
  height: number
  text: { left: number; top: number; right: number; bottom: number }[]
}

/** Whether the segment from (x0, y0) to (x1, y1) meets the box from (left, top) to (right, bottom), by clipping it. */
function meets(x0: number, y0: number, x1: number, y1: number, l: number, t: number, r: number, b: number): boolean {
  let [lo, hi] = [0, 1]
  const [dx, dy] = [x1 - x0, y1 - y0]
  for (const [p, q] of [
    [-dx, x0 - l],
    [dx, r - x0],
    [-dy, y0 - t],
    [dy, b - y0]
  ] as const) {
    if (p === 0) {
      if (q < 0) return false
    } else if (p < 0) lo = Math.max(lo, q / p)
    else hi = Math.min(hi, q / p)
    if (lo > hi) return false
  }
  return true
}

/**
 * The fly-to's landing for job `i`, for blend weights future and month, on a screen as `view` shows it: back from its
 * tuft toward the box, turned within FOCUS_TURN, at the nearest distance from FOCUS_NEAR from which nothing lit shows
 * behind the HUD's text, so it stands as close as the screen's own HUD allows; the tuft stays in the frame's middle. If
 * no pose up to FOCUS_FAR is clear, it takes the one with the fewest things in the way.
 */
export function focusShot(layout: FieldLayout, i: number, future: number, month: number, view: FocusView): FocusShot {
  const [x, z] = tuftPosition(layout, i, future, month)
  const ty = Math.tan((view.fov * Math.PI) / 360)
  const tx = (ty * view.width) / view.height
  const [sinP, cosP] = [Math.sin(FOCUS_PITCH), Math.cos(FOCUS_PITCH)]

  // Every tuft's tallest blade now (a skill with no projection stands at BLADE_H0, as the shader draws it), and the lit
  // things to keep clear: a vertical span at a ground point, reaching `spread` metres either side.
  const tallest = new Float32Array(layout.angles.length)
  const h = layout.aHeight
  for (let b = 0; b < layout.bladeCount; b++) {
    const at = (state: number) => (h[b * 4 + state]! < 0 ? BLADE_H0 : h[b * 4 + state]!)
    const older = at(0) + (at(1) - at(0)) * future
    const height = older + (at(2) + (at(3) - at(2)) * future - older) * month
    const job = layout.aShape[b * 4 + 3]!
    tallest[job] = Math.max(tallest[job]!, height)
  }
  const yours = new Uint8Array(layout.angles.length)
  for (let b = 0; b < layout.bladeCount; b++) {
    if (layout.aMeta[b * 2] === KIND_CODE.yours) yours[layout.aShape[b * 4 + 3]!] = 1
  }
  // Each a span from a ground point up to `height`, `spread` metres either side, over a glow `pool` metres round.
  const lit: { x: number; z: number; height: number; spread: number; pool: number }[] = [{ x: 0, z: 0, ...BOX }]
  for (let j = 0; j < layout.angles.length; j++) {
    const [tx0, tz0] = tuftPosition(layout, j, future, month)
    const spread = BLADE_REACH + BLADE_LEAN * tallest[j]!
    lit.push({ x: tx0, z: tz0, height: tallest[j]!, spread, pool: j === i || yours[j] ? FOCUS_POOL : spread })
  }
  // The ring lines on the ground, as short straight pieces, and their names painted past the lines' left ends.
  const lines: [number, number, number, number][] = []
  for (const radius of layout.rings) {
    const angle = -LINE_END - LABEL_LENGTH / 2 / radius
    const [lx, lz] = [Math.sin(angle) * radius, -Math.cos(angle) * radius]
    lit.push({ x: lx, z: lz, height: 0, spread: LABEL_LENGTH / 2, pool: LABEL_LENGTH / 2 })
    const end = LINE_END
    const pieces = Math.ceil((2 * end * radius) / LINE_PIECE)
    for (let k = 0; k < pieces; k++) {
      const [a, b] = [-end + (2 * end * k) / pieces, -end + (2 * end * (k + 1)) / pieces]
      lines.push([Math.sin(a) * radius, -Math.cos(a) * radius, Math.sin(b) * radius, -Math.cos(b) * radius])
    }
  }
  // The text boxes, FOCUS_MARGIN wider; one inside another (a link inside its line) is left out, as its line covers it.
  const inside = (p: FocusView['text'][number], q: FocusView['text'][number]) =>
    p !== q && p.left >= q.left && p.right <= q.right && p.top >= q.top && p.bottom <= q.bottom
  const boxes = view.text
    .filter((p, k) => !view.text.some((q, n) => inside(p, q) && !(inside(q, p) && n > k)))
    .map((b) => ({
      l: b.left - FOCUS_MARGIN,
      t: b.top - FOCUS_MARGIN,
      r: b.right + FOCUS_MARGIN,
      b: b.bottom + FOCUS_MARGIN
    }))

  // How many lit things the eye `back` metres from the tuft and `eye` metres up, facing it at `turn`, sees behind the
  // text, counting up to `most` (a tuft's foot sunk low in the frame counts as one). What blocked the last try is tried
  // first, as it most likely blocks the next one too.
  let last = 0
  const inWay = (back: number, turn: number, eye: number, most: number) => {
    // The way back from the tuft; the eye looks the other way, level but for FOCUS_PITCH.
    const [dx, dz] = [-Math.sin(turn), Math.cos(turn)]
    const [cx, cz] = [x + dx * back, z + dz * back]
    // A point's place on screen, in CSS pixels, and its depth.
    const project = (px: number, py: number, pz: number) => {
      const [vx, vy, vz] = [px - cx, py - eye, pz - cz]
      const depth = -(vx * dx + vz * dz) * cosP - vy * sinP
      const sx = (vx * dz - vz * dx) / (depth * tx)
      const sy = (-(vx * dx + vz * dz) * sinP + vy * cosP) / (depth * ty)
      return [((sx + 1) / 2) * view.width, ((1 - sy) / 2) * view.height, depth] as const
    }
    // The focused tuft's foot stays in the frame's middle rows.
    let count = 1 - (2 * project(x, 0, z)[1]) / view.height >= FOCUS_LOWEST ? 0 : 1
    if (count >= most) return count
    const blocks = (thing: (typeof lit)[number]) => {
      const [vx, vz] = [thing.x - cx, thing.z - cz]
      if (vx * vx + vz * vz < FOCUS_ROOM ** 2) return true
      // Things behind the eye, or beside it out of view, don't show; ones at the frame's edge too near to project
      // reliably count as in the way.
      const reach = Math.max(thing.spread, thing.pool)
      const ahead = -(vx * dx + vz * dz)
      if (ahead < -reach || Math.abs(vx * dz - vz * dx) - reach > Math.max(0, ahead) * tx) return false
      if (ahead < reach + 0.5) return true
      // The glow's nearest edge, toward the eye, sits lowest on screen.
      const [x0, y0, d0] = project(thing.x + thing.pool * dx, 0, thing.z + thing.pool * dz)
      const [x1, y1, d1] = project(thing.x, thing.height, thing.z)
      const wide = (thing.spread / (Math.min(d0, d1) * tx)) * (view.width / 2)
      return boxes.some((box) => meets(x0, y0, x1, y1, box.l - wide, box.t, box.r + wide, box.b))
    }
    if (most === 1 && blocks(lit[last]!)) return 1
    for (let k = 0; k < lit.length; k++) {
      if (!blocks(lit[k]!)) continue
      last = k
      if (++count >= most) return count
    }
    for (const [ax, az, bx, bz] of lines) {
      let [a, b] = [project(ax, 0, az), project(bx, 0, bz)]
      if (a[2] < 0.5 && b[2] < 0.5) continue
      // A piece reaching behind the eye is cut where it passes half a metre in front of it.
      if (a[2] < 0.5 || b[2] < 0.5) {
        const s = (0.5 - a[2]) / (b[2] - a[2])
        const cut = project(ax + (bx - ax) * s, 0, az + (bz - az) * s)
        if (a[2] < 0.5) a = cut
        else b = cut
      }
      if (boxes.some((box) => meets(a[0], a[1], b[0], b[1], box.l, box.t, box.r, box.b)) && ++count >= most)
        return count
    }
    return count
  }

  // Facing the tuft as squarely as FOCUS_TURN allows first, then the other turns it allows, nearest first.
  const own = Math.min(FOCUS_TURN[1], Math.max(FOCUS_TURN[0], Math.atan2(x, -z)))
  const steps = Array.from(
    { length: TURN_STEPS },
    (_, k) => FOCUS_TURN[0] + ((FOCUS_TURN[1] - FOCUS_TURN[0]) * k) / (TURN_STEPS - 1)
  )
  const turns = [own, ...steps.filter((t) => Math.abs(t - own) > 1e-6)].sort(
    (a, b) => Math.abs(a - own) - Math.abs(b - own)
  )
  const poses: [number, number, number][] = []
  for (let b = FOCUS_NEAR; b <= FOCUS_FAR; b += FOCUS_STEP) {
    for (const t of turns) for (const e of FOCUS_HEIGHTS) poses.push([b, t, e])
  }
  let pose = poses.find(([b, t, e]) => inWay(b, t, e, 1) === 0)
  if (!pose) {
    let fewest = Infinity
    for (const [b, t, e] of poses) {
      const count = inWay(b, t, e, fewest)
      if (count < fewest) [fewest, pose] = [count, [b, t, e]]
    }
  }
  const [back, turn, eye] = pose!
  const [dx, dz] = [-Math.sin(turn), Math.cos(turn)]
  // The orbit turns round a point on the line of sight, no lower than TARGET_FLOOR, so it never orbits under the ground.
  const ahead = Math.min(back, (eye - TARGET_FLOOR) / Math.tan(FOCUS_PITCH))
  return {
    position: [x + dx * back, eye, z + dz * back],
    target: [x + dx * (back - ahead), eye - ahead * Math.tan(FOCUS_PITCH), z + dz * (back - ahead)]
  }
}

/**
 * The opening shot on a phone (usePhoneLayout), whose HUD stacks the switches, the numbers and the ruler below the scene:
 * as close behind the box as the wide shot and lower, turned a little to the left (6.3 degrees, to the wide shot's 8.3),
 * tilted down so the ring clears the title even in the fast future and the box stands just above the stack.
 */
export function phoneShot(): Shot {
  return { position: [0.42, 1.08, 4.9], target: [-4.95, -8.89, -43.8], fov: 56, wide: 44 }
}

/**
 * The opening shot on a short landscape screen (SpaceScene's SHORT): the wide shot's eye, close behind the box, with a
 * wider lens, so the ring stands clear under the title row's links and the box at the foot's middle, between the ruler
 * and the switches.
 */
export function shortShot(): Shot {
  return { position: [0.42, 2.72, 4.25], target: [-5.4, -3.6, -50], fov: 70 }
}

/**
 * The four locked camera shots; `tuft` frames the assessed job's tuft from the box's side. The opening `wide` shot stands
 * low and close behind the box, which fills the foot's middle, and looks a little left of it, so every ground ring's
 * left end, with its name, stays in frame, and the ring's glow, which brightens the fast future's sky around it, stands
 * clear of a card docked top left, even a compact one wrapped to three lines; on a narrow screen the view widens to keep
 * 80 degrees across.
 */
export function shots(tuft: [number, number]): Record<ShotName, Shot> {
  const [x, z] = tuft
  const len = Math.hypot(x, z) || 1
  const [ux, uz] = [x / len, z / len]
  return {
    wide: { position: [0.42, 2.72, 4.25], target: [-7.5, -3.6, -50], fov: 56, wide: 80 },
    field: { position: [0, 8.5, 5.5], target: [0, -1.6, -32], fov: 46 },
    tuft: {
      position: [x - ux * 4.2 + uz * 0.4, 2, z - uz * 4.2 - ux * 0.4],
      target: [x + ux * 60, -3.6, z + uz * 60],
      fov: 50
    },
    ring: { position: [0.3, 1, 5.6], target: [0, 66, -RING_DISTANCE], fov: 46 }
  }
}
