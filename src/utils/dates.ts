/**
 * Date utilities for simulation month ↔ ISO date mapping.
 * All date arithmetic is performed in UTC to avoid timezone edge cases.
 */

import type { PricingPlan, PricingVersion } from '../domain/types'

/**
 * Given a simulation start date (ISO) and a simulation month offset (0-based),
 * returns the ISO date string for that month.
 *
 * Examples:
 *   toCalendarDate("2024-01-01", 0)  → "2024-01-01"  (Month 0 = baseline)
 *   toCalendarDate("2024-01-01", 1)  → "2024-02-01"  (Month 1 = Feb 2024)
 *   toCalendarDate("2024-01-01", 12) → "2025-01-01"
 */
export function toCalendarDate(simulationStartDate: string, monthOffset: number): string {
  const [year, month, day] = simulationStartDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + monthOffset, day))
  return date.toISOString().slice(0, 10)
}

/**
 * Add N months to an ISO date string.
 * Wrapper around toCalendarDate for clarity.
 */
export function addMonths(isoDate: string, months: number): string {
  return toCalendarDate(isoDate, months)
}

/**
 * Compare two ISO date strings. Returns:
 *   -1 if a < b
 *    0 if a === b
 *    1 if a > b
 */
export function compareIsoDates(a: string, b: string): -1 | 0 | 1 {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/**
 * Find the active PricingVersion for a given calendar date.
 *
 * A version is active when:
 *   effectiveFrom <= calendarDate  AND
 *   (effectiveTo is absent OR calendarDate < effectiveTo)
 *
 * If multiple versions qualify, the one with the latest effectiveFrom is returned.
 * Throws if no version is found.
 */
export function findActivePricingVersion(
  plan: PricingPlan,
  calendarDate: string
): PricingVersion {
  const candidates = plan.versions.filter(
    (v) =>
      v.effectiveFrom <= calendarDate &&
      (v.effectiveTo === undefined || calendarDate < v.effectiveTo)
  )

  if (candidates.length === 0) {
    throw new Error(
      `No active PricingVersion found for plan "${plan.id}" at date "${calendarDate}"`
    )
  }

  // Return the version with the latest effectiveFrom (most recently activated)
  return candidates.reduce((best, v) =>
    v.effectiveFrom > best.effectiveFrom ? v : best
  )
}

/**
 * Check whether an ISO date string is valid.
 */
export function isValidIsoDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date))
}
