/**
 * Math utilities — pure functions, no side effects.
 */

/** Round to N decimal places using standard rounding. */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/** Clamp value between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Convert a decimal (0–1) to a percentage string. */
export function percent(value: number, decimals = 1): string {
  return `${roundTo(value * 100, decimals)}%`
}

/** Sum an array of numbers. */
export function sum(values: readonly number[]): number {
  return values.reduce((acc, v) => acc + v, 0)
}
