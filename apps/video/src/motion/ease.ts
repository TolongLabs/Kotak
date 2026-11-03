import { Easing, interpolate } from 'remotion'

/** The demo graphics' one easing curve: every move eases in and out. */
export const EASE = Easing.bezier(0.65, 0, 0.35, 1)

/** A rectangle in composition pixels (1920×1080). */
export type Box = { x: number; y: number; width: number; height: number }

/** 0 at `start`, 1 at `start + length`, eased and clamped on both sides. */
export function ramp(frame: number, start: number, length: number): number {
  return interpolate(frame, [start, start + length], [0, 1], {
    easing: EASE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })
}

/** Opacity of a graphic that fades in over `fadeIn` frames from `from` and out over `fadeOut` frames, ending at `to`. */
export function inOut(frame: number, from: number, to: number, fadeIn: number, fadeOut: number): number {
  return Math.min(ramp(frame, from, fadeIn), 1 - ramp(frame, to - fadeOut, fadeOut))
}
