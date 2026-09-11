import { describe, it, expect } from 'vitest'
import { calculateCost } from '../../src/engine/pricing/index'
import type { PricingComponent, PricingInputs, PendingCosts } from '../../src/domain/types'
import { PricingMetric, PricingStrategyType } from '../../src/domain/types'

const makeInputs = (
  activeUsers: number,
  inputTokens: number,
  outputTokens: number,
  agentCalls: number
): PricingInputs => ({
  activeUsers,
  monthlyInputTokensPerUser: inputTokens,
  monthlyOutputTokensPerUser: outputTokens,
  agentCallsPerUser: agentCalls,
  apiCallsPerUser: 0,
  storageGbPerUser: 0,
  simulationMonth: 1,
  calendarDate: '2024-02-01',
})

const zeroPending: PendingCosts = {
  migrationCost: 0,
  securityRemediationCost: 0,
  operationalCost: 0,
}

const seatComponent: PricingComponent = {
  id: 'comp-seat',
  metric: PricingMetric.SEAT,
  strategy: PricingStrategyType.PER_UNIT,
  rules: [
    {
      id: 'rule-seat',
      metric: PricingMetric.SEAT,
      unitLabel: 'seat/month',
      unitCost: 45,
    },
  ],
}

const tokenComponent: PricingComponent = {
  id: 'comp-token',
  metric: PricingMetric.TOKEN_INPUT,
  strategy: PricingStrategyType.PER_UNIT,
  rules: [
    {
      id: 'rule-input',
      metric: PricingMetric.TOKEN_INPUT,
      unitLabel: 'per 1M input tokens',
      unitCost: 3.0,
    },
    {
      id: 'rule-output',
      metric: PricingMetric.TOKEN_OUTPUT,
      unitLabel: 'per 1M output tokens',
      unitCost: 12.0,
    },
  ],
}

const agentComponent: PricingComponent = {
  id: 'comp-agent',
  metric: PricingMetric.AGENT_CALL,
  strategy: PricingStrategyType.INCLUDED_THEN_OVERAGE,
  rules: [
    {
      id: 'rule-agent',
      metric: PricingMetric.AGENT_CALL,
      unitLabel: 'agent invocation',
      unitCost: 0.5,
      includedUnits: 100,
    },
  ],
}

describe('hybrid-components', () => {
  it('seat+token plan produces correct split breakdown', () => {
    // 10 users × $45/seat = $450 seat
    // 10 users × 1M input × $3/1M = $30 input token
    // 10 users × 200k output × $12/1M = $24 output token
    // total = $504
    const result = calculateCost(
      [seatComponent, tokenComponent],
      makeInputs(10, 1_000_000, 200_000, 0),
      zeroPending
    )
    expect(result.breakdown.seatCost).toBeCloseTo(450)
    expect(result.breakdown.tokenCost).toBeCloseTo(54)
    expect(result.breakdown.total).toBeCloseTo(504)
  })

  it('seat+token+agent plan: breakdown sum equals total', () => {
    const result = calculateCost(
      [seatComponent, tokenComponent, agentComponent],
      makeInputs(10, 500_000, 100_000, 150),
      zeroPending
    )

    const { breakdown } = result
    const componentSum =
      breakdown.seatCost +
      breakdown.tokenCost +
      breakdown.usageCost +
      breakdown.agentCost +
      breakdown.modelProviderCost +
      breakdown.migrationCost +
      breakdown.securityRemediationCost +
      breakdown.operationalCost

    expect(componentSum).toBeCloseTo(breakdown.total)
  })

  it('pending costs are merged into breakdown correctly', () => {
    const pending: PendingCosts = {
      migrationCost: 5000,
      securityRemediationCost: 2000,
      operationalCost: 1000,
    }
    const result = calculateCost([seatComponent], makeInputs(10, 0, 0, 0), pending)
    expect(result.breakdown.migrationCost).toBe(5000)
    expect(result.breakdown.securityRemediationCost).toBe(2000)
    expect(result.breakdown.operationalCost).toBe(1000)
    expect(result.breakdown.seatCost).toBe(450)
    expect(result.breakdown.total).toBe(450 + 5000 + 2000 + 1000)
  })

  it('zero inputs produce zero cost', () => {
    const result = calculateCost(
      [seatComponent, tokenComponent, agentComponent],
      makeInputs(0, 0, 0, 0),
      zeroPending
    )
    expect(result.breakdown.total).toBe(0)
  })
})
