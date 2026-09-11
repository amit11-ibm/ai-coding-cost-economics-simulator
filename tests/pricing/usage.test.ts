import { describe, it, expect } from 'vitest'
import { calculateUsageCost } from '../../src/engine/pricing/usage'
import type { PricingInputs, PricingRule } from '../../src/domain/types'
import { PricingMetric } from '../../src/domain/types'

const makeInputs = (activeUsers: number, apiCallsPerUser: number): PricingInputs => ({
  activeUsers,
  monthlyInputTokensPerUser: 0,
  monthlyOutputTokensPerUser: 0,
  agentCallsPerUser: 0,
  apiCallsPerUser,
  storageGbPerUser: 0,
  simulationMonth: 1,
  calendarDate: '2024-02-01',
})

const usageRule: PricingRule = {
  id: 'rule-api',
  metric: PricingMetric.API_CALL,
  unitLabel: 'API call',
  unitCost: 0.005,
  includedUnits: 10000,
}

describe('UsageCalculator', () => {
  it('returns zero when total calls are within included units', () => {
    // 1 user × 5000 calls = 5000 < 10000 included → free
    const result = calculateUsageCost(makeInputs(1, 5000), [usageRule])
    expect(result.cost).toBe(0)
  })

  it('returns zero when exactly at included limit', () => {
    // 1 user × 10000 calls = exactly 10000 → free
    const result = calculateUsageCost(makeInputs(1, 10000), [usageRule])
    expect(result.cost).toBe(0)
  })

  it('charges only overage above included units', () => {
    // 1 user × 15000 calls = 15000; overage = 5000 × $0.005 = $25
    const result = calculateUsageCost(makeInputs(1, 15000), [usageRule])
    expect(result.cost).toBeCloseTo(25)
  })

  it('handles no included units (all calls charged)', () => {
    const noIncludedRule: PricingRule = {
      id: 'rule-no-included',
      metric: PricingMetric.API_CALL,
      unitLabel: 'API call',
      unitCost: 0.01,
    }
    const result = calculateUsageCost(makeInputs(1, 1000), [noIncludedRule])
    expect(result.cost).toBeCloseTo(10)
  })

  it('handles tier boundary: just above limit', () => {
    // 1 user × 10001 calls = 1 overage × $0.005 = $0.005
    const result = calculateUsageCost(makeInputs(1, 10001), [usageRule])
    expect(result.cost).toBeCloseTo(0.005)
  })

  it('handles multi-user scenarios', () => {
    // 5 users × 15000 calls = 75000; included = 5 × 10000 = 50000; overage = 25000 × $0.005 = $125
    const result = calculateUsageCost(makeInputs(5, 15000), [usageRule])
    // total calls = 5 × 15000 = 75000; included = 10000 (not per-user); overage = 65000 × 0.005 = 325
    expect(result.cost).toBeCloseTo(325)
  })

  it('applies tiered rates to overage', () => {
    const tieredRule: PricingRule = {
      id: 'rule-tiered',
      metric: PricingMetric.API_CALL,
      unitLabel: 'API call',
      unitCost: 0.005,
      includedUnits: 10000,
      tieredRates: [
        { upTo: 50000, unitCost: 0.005 },
        { upTo: Infinity, unitCost: 0.003 },
      ],
    }
    // 1 user × 70000 calls; included = 10000; overage = 60000
    // First 50000 overage: 50000 × 0.005 = 250; next 10000: 10000 × 0.003 = 30; total = 280
    const result = calculateUsageCost(makeInputs(1, 70000), [tieredRule])
    expect(result.cost).toBeCloseTo(280)
  })

  it('returns zero for empty rules', () => {
    const result = calculateUsageCost(makeInputs(10, 20000), [])
    expect(result.cost).toBe(0)
  })
})
