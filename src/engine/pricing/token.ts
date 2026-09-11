import type { PricingInputs, PricingRule, ComponentResult } from '../../domain/types'
import { buildExplanationEntry } from '../../utils/explanation'

/**
 * TokenCalculator — calculates input + output token costs.
 *
 * Formula:
 *   tokenCost = (totalInputTokens × inputRate + totalOutputTokens × outputRate) / 1_000_000
 *
 * Rules:
 *   - rule[0] = input token rule (metric: TOKEN_INPUT)
 *   - rule[1] = output token rule (metric: TOKEN_OUTPUT)
 *   If only one rule, it applies to both input and output with the same rate.
 */
export function calculateTokenCost(
  inputs: PricingInputs,
  rules: readonly PricingRule[]
): ComponentResult {
  const inputRule = rules[0]
  const outputRule = rules[1] ?? rules[0]

  if (!inputRule) {
    return { cost: 0, explanation: buildExplanationEntry('token', 'no-rule', {}, 0) }
  }

  const totalInputTokens = inputs.activeUsers * inputs.monthlyInputTokensPerUser
  const totalOutputTokens = inputs.activeUsers * inputs.monthlyOutputTokensPerUser

  const inputCost = (totalInputTokens * inputRule.unitCost) / 1_000_000
  const outputCost = (totalOutputTokens * (outputRule?.unitCost ?? inputRule.unitCost)) / 1_000_000
  const cost = inputCost + outputCost

  const formula =
    `(${totalInputTokens} input tokens × $${inputRule.unitCost}/1M) + ` +
    `(${totalOutputTokens} output tokens × $${outputRule?.unitCost ?? inputRule.unitCost}/1M)`

  return {
    cost,
    explanation: buildExplanationEntry(
      'token',
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
