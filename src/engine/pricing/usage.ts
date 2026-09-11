import type { PricingInputs, PricingRule, ComponentResult } from '../../domain/types'
import { buildExplanationEntry } from '../../utils/explanation'
import { applyTieredRates } from './tiered'

/**
 * UsageCalculator — per API call billing with optional included units.
 *
 * Formula:
 *   if totalCalls <= includedUnits: cost = 0
 *   else: cost = (totalCalls - includedUnits) × unitCost
 *   With tiered rates: applies to the overage volume.
 */
export function calculateUsageCost(
  inputs: PricingInputs,
  rules: readonly PricingRule[]
): ComponentResult {
  const rule = rules[0]
  if (!rule) {
    return { cost: 0, explanation: buildExplanationEntry('usage', 'no-rule', {}, 0) }
  }

  const totalCalls = inputs.activeUsers * inputs.apiCallsPerUser
  const included = rule.includedUnits ?? 0
  const overage = Math.max(0, totalCalls - included)

  let cost: number
  let formula: string

  if (rule.tieredRates && rule.tieredRates.length > 0 && overage > 0) {
    cost = applyTieredRates(rule.tieredRates, overage)
    formula = `tiered(overage=${overage} calls)`
  } else {
    cost = overage * rule.unitCost
    formula = `(${totalCalls} - ${included} included) × $${rule.unitCost}/call = ${overage} overage calls`
  }

  return {
    cost,
    explanation: buildExplanationEntry(
      'usage',
      formula,
      {
        activeUsers: inputs.activeUsers,
        apiCallsPerUser: inputs.apiCallsPerUser,
        totalCalls,
        includedUnits: included,
        overageCalls: overage,
        unitCost: rule.unitCost,
      },
      cost
    ),
  }
}
