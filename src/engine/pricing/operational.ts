import type { PricingInputs, PricingRule, ComponentResult } from '../../domain/types'
import { buildExplanationEntry } from '../../utils/explanation'

/**
 * OperationalCalculator — flat monthly or per-user operational overhead.
 *
 * If rule.unitLabel contains "per-user", cost = activeUsers × unitCost.
 * Otherwise, cost = unitCost (flat monthly).
 */
export function calculateOperationalCost(
  inputs: PricingInputs,
  rules: readonly PricingRule[]
): ComponentResult {
  const rule = rules[0]
  if (!rule) {
    return { cost: 0, explanation: buildExplanationEntry('operational', 'no-rule', {}, 0) }
  }

  const isPerUser = rule.unitLabel.toLowerCase().includes('per-user') ||
    rule.unitLabel.toLowerCase().includes('per user')

  const cost = isPerUser ? inputs.activeUsers * rule.unitCost : rule.unitCost
  const formula = isPerUser
    ? `${inputs.activeUsers} users × $${rule.unitCost}/user/month`
    : `flat $${rule.unitCost}/month`

  return {
    cost,
    explanation: buildExplanationEntry(
      'operational',
      formula,
      { activeUsers: inputs.activeUsers, unitCost: rule.unitCost },
      cost
    ),
  }
}
