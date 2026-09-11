import type { AdoptionRule } from '../domain/types'
import { clamp } from '../utils/math'

/**
 * Compute the adoption rate for a given simulation month based on the AdoptionRule.
 *
 * This function is ONLY called when `ToolSimState.adoptionOverridden === false`.
 * When `adoptionOverridden === true`, the engine uses the stored rate directly.
 *
 * Rules:
 * - flat: rate stays constant at targetRate (or initialAdoptionRate via caller)
 * - linear: rate grows linearly from 0 to targetRate over rampMonths
 * - exponential: rate grows exponentially toward targetRate
 * - stepped: rate jumps to targetRate at rampMonths
 */
export function computeAdoption(rule: AdoptionRule, month: number): number {
  let rate: number

  switch (rule.type) {
    case 'flat':
      rate = rule.targetRate
      break

    case 'linear': {
      if (rule.rampMonths <= 0) {
        rate = rule.targetRate
      } else {
        const progress = month / rule.rampMonths
        rate = Math.min(1, progress) * rule.targetRate
      }
      break
    }

    case 'exponential': {
      if (rule.rampMonths <= 0) {
        rate = rule.targetRate
      } else {
        // Exponential growth: rate = targetRate * (1 - e^(-k*month))
        // where k is chosen so that at rampMonths we reach ~95% of target
        const k = 3 / rule.rampMonths
        rate = rule.targetRate * (1 - Math.exp(-k * month))
      }
      break
    }

    case 'stepped': {
      if (rule.stepMonth !== undefined) {
        rate = month >= rule.stepMonth ? rule.targetRate : 0
      } else {
        rate = month >= rule.rampMonths ? rule.targetRate : 0
      }
      break
    }

    default:
      rate = rule.targetRate
  }

  return clamp(rate, 0, 1)
}
