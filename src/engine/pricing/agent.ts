import type { PricingInputs, PricingRule, ComponentResult } from '../../domain/types'
import { buildExplanationEntry } from '../../utils/explanation'

/**
 * AgentCallCalculator — per agent invocation billing with optional included calls.
 *
 * Formula:
 *   if totalCalls <= includedUnits: cost = 0
 *   else: cost = (totalCalls - includedUnits) × unitCost
 */
export function calculateAgentCost(
  inputs: PricingInputs,
  rules: readonly PricingRule[]
): ComponentResult {
  const rule = rules[0]
  if (!rule) {
    return { cost: 0, explanation: buildExplanationEntry('agent', 'no-rule', {}, 0) }
  }

  const totalCalls = inputs.activeUsers * inputs.agentCallsPerUser
  const included = rule.includedUnits ?? 0
  const overage = Math.max(0, totalCalls - included)
  const cost = overage * rule.unitCost

  const formula =
    `(${totalCalls} - ${included} included) × $${rule.unitCost}/agent call = ${overage} overage`

  return {
    cost,
    explanation: buildExplanationEntry(
      'agent',
      formula,
      {
        activeUsers: inputs.activeUsers,
        agentCallsPerUser: inputs.agentCallsPerUser,
        totalCalls,
        includedUnits: included,
        overageCalls: overage,
        unitCost: rule.unitCost,
      },
      cost
    ),
  }
}
