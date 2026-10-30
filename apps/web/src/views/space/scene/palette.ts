import { Color } from 'three'

// The two worlds as uniform values: slow is a gold dusk built from Kotak yellow, fast is a cool violet (the Threats
// tint family) with a white-hot ring. These ramps are scene-only and never used for text. Tip colours for the assessed
// and related jobs are the dark theme's tokens (color/accent/box, color/map/suggested). uHoverColor is the soft glow on
// the ground under the tuft in hand, kept dimmer than the blades' tips.

interface World {
  colors: Record<ColorKey, [string, number]>
  numbers: Record<NumberKey, number>
}

export type ColorKey =
  | 'uSkyZenith'
  | 'uSkyHorizon'
  | 'uBand'
  | 'uGlow'
  | 'uGround'
  | 'uRim'
  | 'uBoxLight'
  | 'uLine'
  | 'uRingCore'
  | 'uRingGlow'
  | 'uShadow'
  | 'uTipOther'
  | 'uBladeBase'
  | 'uDust'
  | 'uHoverColor'
export type NumberKey =
  'uBandWidth' | 'uBandSides' | 'uStars' | 'uFog' | 'uSwirl' | 'uDiskBand' | 'uRingWidth' | 'uShadowAlpha'

// [sRGB hex, intensity]; intensities above 1 feed the bloom.
export const WORLDS: Record<'slow' | 'fast', World> = {
  slow: {
    colors: {
      uSkyZenith: ['#040302', 1],
      uSkyHorizon: ['#1c0e04', 1],
      uBand: ['#ffa53d', 1.3],
      uGlow: ['#b8580f', 0.45],
      uGround: ['#0b0705', 1],
      uRim: ['#ff9d3a', 0.4],
      uBoxLight: ['#ffb54d', 0.35],
      uLine: ['#d9c9a8', 0.16],
      uRingCore: ['#fff0cf', 5],
      uRingGlow: ['#ff9426', 2.2],
      uShadow: ['#030201', 1],
      uTipOther: ['#ffd296', 1],
      uBladeBase: ['#0a0704', 1],
      uDust: ['#ffc477', 1.8],
      uHoverColor: ['#ffb54d', 0.3]
    },
    numbers: {
      uBandWidth: 0.013,
      uBandSides: 0.2,
      uStars: 0.8,
      uFog: 0.003,
      uSwirl: 1,
      uDiskBand: 0,
      uRingWidth: 0.03,
      uShadowAlpha: 0.94
    }
  },
  fast: {
    colors: {
      uSkyZenith: ['#0c0b1d', 1],
      uSkyHorizon: ['#5b5682', 1],
      uBand: ['#fff4ea', 2.6],
      uGlow: ['#a99ce0', 0.7],
      uGround: ['#0b0a1a', 1],
      uRim: ['#cbbcff', 0.55],
      uBoxLight: ['#ffc46a', 0.4],
      uLine: ['#e0dcf3', 0.16],
      uRingCore: ['#ffffff', 7],
      uRingGlow: ['#efe4ff', 1.6],
      uShadow: ['#24213d', 1],
      uTipOther: ['#ffd296', 1],
      uBladeBase: ['#0a0918', 1],
      uDust: ['#e6dcff', 1.6],
      uHoverColor: ['#c2b4ff', 0.3]
    },
    numbers: {
      uBandWidth: 0.012,
      uBandSides: 0.9,
      uStars: 0.35,
      uFog: 0.0055,
      uSwirl: 0,
      uDiskBand: 1,
      uRingWidth: 0.014,
      uShadowAlpha: 0.8
    }
  }
}

/** The tokens the tips use (dark theme): color/accent/box and color/map/suggested. */
export const TIP_YOURS: [string, number] = ['#efd127', 2.2]
export const TIP_RELATED: [string, number] = ['#7db0ff', 1.8]

/** The lights on the box and Kopi: a key light that turns from warm (slow) to cool (fast), a sky/ground fill, and the
 * lamp inside the box. */
export const KEY_LIGHT = { slow: '#ffd9a0', fast: '#d6ccff' } as const
export const FILL_SKY = '#8c7f9e'
export const FILL_GROUND = '#140f08'
export const BOX_LAMP = '#ffb24a'
/**
 * The box's self-light, in linear RGB. Its outer faces glow in the ratio that ACES tone mapping turns into Kotak yellow
 * (#EFD127, color/accent/box); its inner glow stays below the curve's shoulder, where it would wash out to cream.
 */
export const BOX_OUTER_GLOW = { rgb: [1, 0.58, 0], intensity: 0.95 } as const
export const BOX_INNER_GLOW = { rgb: [1, 0.46, 0.02], intensity: 0.75 } as const
/** The lamp's light through the closed lid's seam: above the bloom's threshold, so the seam glows. */
export const BOX_SEAM_GLOW = { rgb: [1, 0.5, 0.08], intensity: 2.6 } as const

export const linear = ([hex, intensity]: [string, number]) => new Color(hex).multiplyScalar(intensity)

/** Both worlds' colours in linear space, ready to blend each frame. */
export const WORLD_COLORS = {
  slow: Object.fromEntries(Object.entries(WORLDS.slow.colors).map(([k, v]) => [k, linear(v)])) as Record<
    ColorKey,
    Color
  >,
  fast: Object.fromEntries(Object.entries(WORLDS.fast.colors).map(([k, v]) => [k, linear(v)])) as Record<
    ColorKey,
    Color
  >
}
