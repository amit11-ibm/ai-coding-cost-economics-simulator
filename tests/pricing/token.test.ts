import { describe, it, expect } from 'vitest'
import { calculateTokenCost } from '../../src/engine/pricing/token'
import type { PricingInputs, PricingRule } from '../../src/domain/types'
import { PricingMetric } from '../../src/domain/types'

const makeInputs = (
  activeUsers: number,
  inputTokens: number,
  outputTokens: number
): PricingInputs => ({
  activeUsers,
  monthlyInputTokensPerUser: inputTokens,
  monthlyOutputTokensPerUser: outputTokens,
  agentCallsPerUser: 0,
  apiCallsPerUser: 0,
  storageGbPerUser: 0,
  simulationMonth: 1,
  calendarDate: '2024-02-01',
})

const inputRule: PricingRule = {
  id: 'rule-input',
  metric: PricingMetric.TOKEN_INPUT,
  unitLabel: 'per 1M input tokens',
  unitCost: 3.0,
}

const outputRule: PricingRule = {
  id: 'rule-output',
  metric: PricingMetric.TOKEN_OUTPUT,
  unitLabel: 'per 1M output tokens',
  unitCost: 12.0,
}

describe('TokenCalculator', () => {
  it('calculates input-only token cost', () => {
    // 1 user × 1M input tokens × $3/1M = $3
    const result = calculateTokenCost(makeInputs(1, 1_000_000, 0), [inputRule])
    expect(result.cost).toBeCloseTo(3.0)
  })

  it('calculates output-only token cost (uses same rule if only one)', () => {
    // 1 user × 1M output tokens × $3/1M = $3 (uses inputRule for output too)
    const result = calculateTokenCost(makeInputs(1, 0, 1_000_000), [inputRule])
    expect(result.cost).toBeCloseTo(3.0)
  })

  it('calculates combined input + output token cost', () => {
    // 10 users × 2M input × $3/1M = $60 input
    // 10 users × 400k output × $12/1M = $48 output
    // total = $108
    const result = calculateTokenCost(makeInputs(10, 2_000_000, 400_000), [inputRule, outputRule])
    expect(result.cost).toBeCloseTo(108.0)
  })

  it('returns zero when activeUsers is 0', () => {
    const result = calculateTokenCost(makeInputs(0, 1_000_000, 200_000), [inputRule, outputRule])
    expect(result.cost).toBe(0)
  })

  it('returns zero when both token counts are 0', () => {
    const result = calculateTokenCost(makeInputs(10, 0, 0), [inputRule, outputRule])
    expect(result.cost).toBe(0)
  })

  it('handles 1B tokens correctly', () => {
    // 1 user × 1B input tokens × $3/1M = $3000
    const result = calculateTokenCost(makeInputs(1, 1_000_000_000, 0), [inputRule])
    expect(result.cost).toBeCloseTo(3000)
  })

  it('handles per-million rate conversion correctly', () => {
    // 100 users × 500k input × $3/1M = 100 × 500000 × 3 / 1M = 150
    const result = calculateTokenCost(makeInputs(100, 500_000, 0), [inputRule])
    expect(result.cost).toBeCloseTo(150)
  })

  it('returns zero for empty rules', () => {
    const result = calculateTokenCost(makeInputs(10, 1_000_000, 0), [])
    expect(result.cost).toBe(0)
  })

  it('produces an explanation', () => {
    const result = calculateTokenCost(makeInputs(10, 1_000_000, 0), [inputRule])
    expect(result.explanation.component).toBe('token')
    expect(result.explanation.result).toBeCloseTo(30)
  })
})
