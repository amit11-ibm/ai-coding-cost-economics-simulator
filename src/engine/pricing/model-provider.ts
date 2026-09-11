import type { PricingInputs, PricingRule, ComponentResult } from '../../domain/types'
import { buildExplanationEntry } from '../../utils/explanation'

/**
 * ModelProviderCalculator — delegates to token rates defined in the rule.
 *
 * The rule's unitCost represents the blended or input-only per-1M-token rate.
 * If two rules are present, rule[0] = input, rule[1] = output (same as TokenCalculator).
 */
export function calculateModelProviderCost(
  inputs: PricingInputs,
  rules: readonly PricingRule[]
): ComponentResult {
  const inputRule = rules[0]
  const outputRule = rules[1] ?? rules[0]

  if (!inputRule) {
    return { cost: 0, explanation: buildExplanationEntry('model-provider', 'no-rule', {}, 0) }
  }

  const totalInputTokens = inputs.activeUsers * inputs.monthlyInputTokensPerUser
  const totalOutputTokens = inputs.activeUsers * inputs.monthlyOutputTokensPerUser

  const inputCost = (totalInputTokens * inputRule.unitCost) / 1_000_000
  const outputCost = (totalOutputTokens * (outputRule?.unitCost ?? inputRule.unitCost)) / 1_000_000
  const cost = inputCost + outputCost

  const formula =
    `model-provider: (${totalInputTokens} input × $${inputRule.unitCost}/1M) + ` +
    `(${totalOutputTokens} output × $${outputRule?.unitCost ?? inputRule.unitCost}/1M)`

  return {
    cost,
    explanation: buildExplanationEntry(
      'model-provider',
      formula,
      {
        activeUsers: inputs.activeUsers,
        totalInputTokens,
        totalOutputTokens,
        inputRatePer1M: inputRule.unitCost,
        outputRatePer1M: outputRule?.unitCost ?? inputRule.unitCost,
      },
      cost
    ),
  }
}
