import { Audio, Video } from '@remotion/media'
import type { CSSProperties } from 'react'
import { AbsoluteFill, Freeze, Sequence, staticFile, useCurrentFrame } from 'remotion'
import { END, PLACED, cameraFor, type Clip, type Framing, type Graphic, type Mark, type Part } from './edit'
import { FPS, easeInOut, pauses, ramp, sec, shot, voiceClip, voiceEnd, type Box, type Shot } from './lib'
import { ActBanner, Arrow, Callout, Hud, ResultCard, Ring, type ResultName } from './motion'
import { C } from './theme'

export { DEMO_FRAMES } from './edit'

/** A take played in pieces, split at its held beats: source range and its start in the part. */
function voicePieces(part: Part) {
  const cuts = pauses(part.id)
  const total = voiceEnd(part.id)
  const bounds = [0, ...cuts.map((c) => c.at), total]
  const cut = total < voiceClip(part.id).durationMs / 1000
  return bounds.slice(0, -1).map((a, k) => ({
    a,
    b: bounds[k + 1]!,
    fade: cut && k === bounds.length - 2,
    at: part.lead + a + cuts.slice(0, k).reduce((n, c) => n + c.seconds, 0)
  }))
}

// Each voice piece's and app sound's span in demo frames. The room tone fills everything between them.
const soundSpans = PLACED.flatMap(({ part, from }) => [
  ...voicePieces(part).map((v) => ({ start: from + sec(v.at), end: from + sec(v.at + v.b - v.a) })),
  ...part.sounds.map((s) => ({ start: from + sec(s.at), end: from + sec(s.at + s.seconds) }))
])
const ROOM_RAMP = 3 // frames
const roomVolume = (f: number) =>
  Math.min(
    1,
    ...soundSpans.map(({ start, end }) =>
      f <= start || f >= end
        ? 1
        : Math.min(1, Math.max(0, Math.max(start + ROOM_RAMP - f, f - (end - ROOM_RAMP)) / ROOM_RAMP))
    )
  )

const HUD_STEPS = PLACED.map(({ part, from }) => ({ step: part.step, from }))

/** Layers, bottom to top: the capture, rings and arrows, callouts and result cards, act banners, the HUD. */
export const Demo = () => (
  <AbsoluteFill style={{ background: C.ink }}>
    {PLACED.map(({ part, from, frames, sfx }) => (
      <Sequence key={part.id} name={part.id} from={from} durationInFrames={frames} premountFor={30}>
        <PartView part={part} frames={frames} />
        {sfx.map((x, k) => (
          <Sequence key={`fx${k}`} name={`${part.id} sfx ${x.src}`} from={sec(x.at)} layout="none">
            <Audio src={staticFile(`sfx/${x.src}.wav`)} volume={x.volume} />
          </Sequence>
        ))}
        {voicePieces(part).map((v, k) => (
          <Sequence key={k} name={`${part.id} voice ${k + 1}`} from={sec(v.at)} layout="none">
            <Audio
              src={staticFile(voiceClip(part.id).src)}
              trimBefore={sec(v.a)}
              trimAfter={sec(v.b)}
              // A take cut short ends on a 4-frame fade, so the cut never clicks.
              volume={(f) => (v.fade ? Math.min(1, Math.max(0, (sec(v.b - v.a) - f) / 4)) : 1)}
            />
          </Sequence>
        ))}
        {part.sounds.map((s, k) => (
          <Sequence key={`s${k}`} name={`${part.id} app sound`} from={sec(s.at)} layout="none">
            <Audio src={staticFile(s.src)} />
          </Sequence>
        ))}
      </Sequence>
    ))}
    {PLACED.filter((p) => p.part.act).map(({ part, from }) => (
      <ActBanner key={part.act} name={part.act!} from={from} />
    ))}
    <Hud steps={HUD_STEPS} />
    <Audio src={staticFile('voice/demo/room.wav')} loop loopVolumeCurveBehavior="extend" volume={roomVolume} />
  </AbsoluteFill>
)

/** Where the camera is at part time t: holds each framing, easing into the next over its `move`. */
function framingAt(keys: Framing[], t: number) {
  let cur = keys[0]!
  for (const k of keys.slice(1)) {
    const move = k.move ?? 0.5
    if (t >= k.at) {
      cur = k
      continue
    }
    if (t > k.at - move) {
      const p = ramp(t, k.at - move, k.at, easeInOut)
      return { x: cur.x + (k.x - cur.x) * p, y: cur.y + (k.y - cur.y) * p, z: cur.z + (k.z - cur.z) * p }
    }
    break
  }
  return cur
}

/** Scales a take into the frame around the framing's focus, never showing past its edges. */
function camera(s: Shot, f: { x: number; y: number; z: number }) {
  const S = (1920 / s.width) * f.z
  const tx = Math.min(0, Math.max(1920 - s.width * S, 960 - f.x * S))
  const ty = Math.min(0, Math.max(1080 - s.height * S, 540 - f.y * S))
  return { S, tx, ty }
}
type Cam = ReturnType<typeof camera>
const toFrame = (b: Box, { S, tx, ty }: Cam): Box => ({
  x: tx + b.x * S,
  y: ty + b.y * S,
  width: b.width * S,
  height: b.height * S
})

function PartView({ part, frames }: { part: Part; frames: number }) {
  const frame = useCurrentFrame()
  const s = shot(part.shot)
  const keys = cameraFor(part, s)
  const cam = camera(s, framingAt(keys, frame / FPS))
  const layer: CSSProperties = {
    position: 'absolute',
    width: s.width,
    height: s.height,
    transformOrigin: '0 0',
    transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.S})`
  }
  return (
    <>
      {part.clips.map((clip, i) => {
        const next = part.clips[i + 1]
        const from = sec(clip.from)
        const to = next ? sec(next.from) : frames
        if (to <= from || from >= frames) return null
        return (
          <Sequence key={i} name={`${part.id} · ${clip.freeze ? 'hold' : 'play'} ${clip.srcIn.toFixed(2)}`} from={from} durationInFrames={to - from}>
            <div style={layer}>
              <Footage s={s} clip={clip} />
            </div>
          </Sequence>
        )
      })}
      {part.marks.map((m, i) => (
        <MarkView key={i} mark={m} cam={cam} frames={frames} />
      ))}
      {part.graphics.map((g, i) => {
        const to = Math.min(sec(g.to), frames)
        return g.name.startsWith('r-') ? (
          <ResultCard key={i} name={g.name as ResultName} from={sec(g.from)} to={to} />
        ) : (
          <Callout key={i} name={g.name} from={sec(g.from)} to={to} {...calloutPlace(part, g, keys, s)} />
        )
      })}
    </>
  )
}

/** The take from `srcIn`; it holds its last frame once the take (plus ingest's 4 s pad) runs out. */
function Footage({ s, clip }: { s: Shot; clip: Clip }) {
  const trim = Math.round(clip.srcIn * FPS)
  const rate = clip.rate ?? 1
  const live = Math.max(0, Math.floor((Math.floor((s.seconds + 3.9) * FPS) - trim) / rate))
  const video = (
    <Video
      src={staticFile(s.src)}
      trimBefore={Math.min(trim, Math.floor((s.seconds + 3.9) * FPS))}
      playbackRate={rate}
      muted
      style={{ width: s.width, height: s.height }}
    />
  )
  if (clip.freeze) return <Freeze frame={0}>{video}</Freeze>
  return (
    <Freeze frame={live} active={(f) => f >= live}>
      {video}
    </Freeze>
  )
}

function MarkView({ mark, cam, frames }: { mark: Mark; cam: Cam; frames: number }) {
  const box = toFrame(mark.box, cam)
  const from = sec(mark.from)
  const to = Math.min(sec(mark.to), frames)
  if (mark.ring) return <Ring name={mark.ring} box={box} from={from} to={to} pad={mark.pad} />
  if (mark.arrow) return <Arrow dir={mark.arrow} box={box} from={from} to={to} />
  return null // a zoom-only mark
}

// Callouts sit smaller than the pack's, on the side clear of what the camera is on: by default over the empty
// sidebar and gutter on the left; on the right when the left one would cover a named element. Every c-* card
// ends at (1874, 950) in the pack; Callout's `scale` shrinks it toward that corner and `x`/`y` move it.
const CARD = { right: 1874, bottom: 950, width: 588, height: 210 }
const SCALE = 0.72
const PLACES = {
  // Low, just above the HUD: over the sidebar's empty foot and the gutter, clear of the page's content.
  left: { scale: SCALE, x: 24 + CARD.width * SCALE - CARD.right, y: 0 },
  right: { scale: SCALE, x: 0, y: 0 }
}
const rectOf = (p: (typeof PLACES)['left']): Box => ({
  x: CARD.right + p.x - CARD.width * p.scale,
  y: CARD.bottom + p.y - CARD.height * p.scale,
  width: CARD.width * p.scale,
  height: CARD.height * p.scale
})
const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))

function calloutPlace(part: Part, g: Graphic, keys: Framing[], s: Shot) {
  const t = g.from + 0.6
  const cam = camera(s, framingAt(keys, t))
  const named = part.marks.filter((m) => m.from <= t && (m.to >= END || m.to > t)).map((m) => toFrame(m.box, cam))
  const cost = (p: (typeof PLACES)['left']) => named.reduce((n, b) => n + overlap(rectOf(p), b), 0)
  // Zoomed toward the right, the empty sidebar and gutter leave the frame: the left spot would cover the page.
  const leftGone = cam.tx < -150 ? 1e9 : 0
  return cost(PLACES.left) + leftGone > cost(PLACES.right) ? PLACES.right : PLACES.left
}
