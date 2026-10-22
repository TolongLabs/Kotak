// Rule constants. TRD.md "Engine" fixes most of them; the rest answer the open questions on #81 and #83.
// Each line says why, so the team can confirm or change one value in one place.

import type { Scenario } from './schemas'

// Projections (#81)
export const HORIZON_MONTHS = 12 // TRD: each trend runs 12 months ahead, counted from the latest data month, not today, so we never extrapolate over months with no data
export const RISING_THRESHOLD = 0.05 // TRD: "more than 5%", read as a relative change, because usage shares are small percentages that rarely move 5 points
export const FAST_CONVERGENCE = 0.5 // TRD: fast moves Malaysia halfway to Singapore's usage level
export const DEFAULT_SCENARIO: Scenario = 'slow' // Malaysia's observed pace assumes nothing the data hasn't shown; it also sets which corners are asked first

// Target level (#81)
export const TARGET_BASE = 2.0 // TRD target formula
export const TARGET_MIN = 1.0 // TRD target formula
export const TARGET_MAX = 3.0 // TRD target formula
export const AI_EFFECT_HALF_GROWTH = 0.5 // ai_effect size = growth / (growth + 0.5): half strength at +50% projected growth, never quite 1, so every data change moves the red line
export const DEMAND_EFFECT = { up: 0.5, flat: 0, unknown: 0, down: -0.5 } as const // TRD target formula; Unknown adds 0

// Roadmap (#83)
export const LESS_IMPORTANT_TAG = 'less important by 2027' // TRD wording for declining gaps
export const DIVIDEND_SHARE = 0.2 // Dividen's default pledge: one hour in five of the time AI saves goes to learning
export const WORK_WEEK_HOURS = 40 // a standard full-time week, split evenly across the role's corners, so the dividend isn't overstated
export const MIN_WEEKLY_HOURS = 1 // floor so a role with no declining corner still gets a finish date; the user can edit it
