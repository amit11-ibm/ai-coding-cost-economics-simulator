import type { PricingInputs, PricingRule, ComponentResult } from '../../domain/types'
import { buildExplanationEntry } from '../../utils/explanation'
import { applyTieredRates } from './tiered'

/**
 * SeatCalculator — calculates per-seat (per-developer) monthly costs.
 *
 * Formula: seatCost = activeUsers × unitCost
 * With tiers: applies tiered rates to the user count.
 */
export function calculateSeatCost(
  inputs: PricingInputs,
  rules: readonly PricingRule[]
): ComponentResult {
  const rule = rules[0]
  if (!rule || inputs.activeUsers === 0) {
    return {
      cost: 0,
      explanation: buildExplanationEntry('seat', 'activeUsers=0', { activeUsers: 0 }, 0),
    }
  }

  let cost: number
  let formula: string

  if (rule.tieredRates && rule.tieredRates.length > 0) {
    cost = applyTieredRates(rule.tieredRates, inputs.activeUsers)
    formula = `tiered(seats=${inputs.activeUsers})`
  } else {
    cost = inputs.activeUsers * rule.unitCost
    formula = `${inputs.activeUsers} seats × $${rule.unitCost}/seat`
  }

  return {
    cost,
    explanation: buildExplanationEntry(
      'seat',
      formula,
      { activeUsers: inputs.activeUsers, unitCost: rule.unitCost },
      cost
    ),
  }
}
