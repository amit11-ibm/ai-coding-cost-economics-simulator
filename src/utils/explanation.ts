import type { CostBreakdown, CostExplanation, PricingInputs, PricingRule } from '../domain/types'

/**
 * Build a CostExplanation entry for a given cost component.
 */
export function buildExplanationEntry(
  component: string,
  formula: string,
  inputs: Record<string, number>,
  result: number
): CostExplanation {
  return { component, formula, inputs, result }
}

/**
 * Build a zero-cost CostBreakdown.
 */
export function zeroCostBreakdown(): CostBreakdown {
  return {
    seatCost: 0,
    tokenCost: 0,
    usageCost: 0,
    agentCost: 0,
    modelProviderCost: 0,
    migrationCost: 0,
    securityRemediationCost: 0,
    operationalCost: 0,
    total: 0,
  }
}

/**
 * Compute the total from individual components and return a final breakdown.
 */
export function finaliseCostBreakdown(
  partial: Omit<CostBreakdown, 'total'>
): CostBreakdown {
  const total =
    partial.seatCost +
    partial.tokenCost +
    partial.usageCost +
    partial.agentCost +
    partial.modelProviderCost +
    partial.migrationCost +
    partial.securityRemediationCost +
    partial.operationalCost

  return { ...partial, total }
}

/**
 * Format the tier-rate formula for explanation output.
 */
export function buildTieredFormula(
  inputs: PricingInputs,
  rules: readonly PricingRule[],
  volume: number
): string {
  void inputs
  void rules
  return `tiered(volume=${volume})`
}
