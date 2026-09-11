import type { GrowthRule } from '../domain/types'
import { clamp } from '../utils/math'

/**
 * Compute the developer count for a given simulation month.
 *
 * Rules:
 * - flat: count stays constant at startingCount
 * - linear: count += monthlyDelta per month
 * - stepped: count stays constant until stepMonth, then steps by stepDelta
 *
 * Count is always clamped to minimum 1.
 */
export function computeDeveloperGrowth(
  rule: GrowthRule,
  month: number,
  startingCount: number
): number {
  let count: number

  switch (rule.type) {
    case 'flat':
      count = startingCount
      break

    case 'linear':
      count = startingCount + (rule.monthlyDelta ?? 0) * month
      break

    case 'stepped':
      if (
        rule.stepMonth !== undefined &&
        rule.stepDelta !== undefined &&
        month >= rule.stepMonth
      ) {
        count = startingCount + rule.stepDelta
      } else {
        count = startingCount
      }
      break

    default:
      count = startingCount
  }

  return clamp(Math.round(count), 1, Infinity)
}
