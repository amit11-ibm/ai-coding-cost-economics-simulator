import type {
  PricingComponent,
  PricingInputs,
  PendingCosts,
  CostBreakdown,
  CostExplanation,
} from '../../domain/types'
import { PricingMetric } from '../../domain/types'
import { finaliseCostBreakdown } from '../../utils/explanation'
import { calculateSeatCost } from './seat'
import { calculateTokenCost } from './token'
import { calculateUsageCost } from './usage'
import { calculateAgentCost } from './agent'
import { calculateModelProviderCost } from './model-provider'
import { calculateOperationalCost } from './operational'

/**
 * Main pricing calculation entry point.
 *
 * Iterates over all PricingComponents, invokes the registered calculator for each,
 * accumulates results into a CostBreakdown, then merges in PendingCosts.
 */
export function calculateCost(
  components: readonly PricingComponent[],
  inputs: PricingInputs,
  pendingCosts: PendingCosts
): { breakdown: CostBreakdown; explanation: readonly CostExplanation[] } {
  let seatCost = 0
  let tokenCost = 0
  let usageCost = 0
  let agentCost = 0
  let modelProviderCost = 0
  let operationalCost = 0
  const explanations: CostExplanation[] = []

  for (const component of components) {
    const rules = component.rules

    switch (component.metric) {
      case PricingMetric.SEAT: {
        const result = calculateSeatCost(inputs, rules)
        seatCost += result.cost
        explanations.push(result.explanation)
        break
      }
      case PricingMetric.TOKEN_INPUT:
      case PricingMetric.TOKEN_OUTPUT: {
        // TOKEN components are processed together; skip TOKEN_OUTPUT if it came before TOKEN_INPUT
        // We handle this by only processing TOKEN_INPUT (which reads both rules)
        if (component.metric === PricingMetric.TOKEN_INPUT) {
          const result = calculateTokenCost(inputs, rules)
          tokenCost += result.cost
          explanations.push(result.explanation)
        }
        break
      }
      case PricingMetric.API_CALL: {
        const result = calculateUsageCost(inputs, rules)
        usageCost += result.cost
        explanations.push(result.explanation)
        break
      }
      case PricingMetric.AGENT_CALL: {
        const result = calculateAgentCost(inputs, rules)
        agentCost += result.cost
        explanations.push(result.explanation)
        break
      }
      case PricingMetric.MODEL_PROVIDER: {
        const result = calculateModelProviderCost(inputs, rules)
        modelProviderCost += result.cost
        explanations.push(result.explanation)
        break
      }
      case PricingMetric.OPERATIONAL: {
        const result = calculateOperationalCost(inputs, rules)
        operationalCost += result.cost
        explanations.push(result.explanation)
        break
      }
      case PricingMetric.STORAGE_GB:
        // Storage not priced in MVP; costs zero
        break
    }
  }

  // Merge pending costs (already computed externally from ToolSimState)
  const migrationCost = pendingCosts.migrationCost
  const securityRemediationCost = pendingCosts.securityRemediationCost
  operationalCost += pendingCosts.operationalCost

  const breakdown = finaliseCostBreakdown({
    seatCost,
    tokenCost,
    usageCost,
    agentCost,
    modelProviderCost,
    migrationCost,
    securityRemediationCost,
    operationalCost,
  })

  return { breakdown, explanation: explanations }
}
