import { describe, it, expect } from 'vitest'
import { calculateAgentCost } from '../../src/engine/pricing/agent'
import type { PricingInputs, PricingRule } from '../../src/domain/types'
import { PricingMetric } from '../../src/domain/types'

const makeInputs = (activeUsers: number, agentCallsPerUser: number): PricingInputs => ({
  activeUsers,
  monthlyInputTokensPerUser: 0,
  monthlyOutputTokensPerUser: 0,
  agentCallsPerUser,
  apiCallsPerUser: 0,
  storageGbPerUser: 0,
  simulationMonth: 1,
  calendarDate: '2024-02-01',
})

const agentRule: PricingRule = {
  id: 'rule-agent',
  metric: PricingMetric.AGENT_CALL,
  unitLabel: 'agent invocation',
  unitCost: 0.5,
  includedUnits: 100,
}

describe('AgentCallCalculator', () => {
  it('returns zero cost when within included calls', () => {
    // 1 user × 80 calls = 80 < 100 included → free
    const result = calculateAgentCost(makeInputs(1, 80), [agentRule])
    expect(result.cost).toBe(0)
  })

  it('returns zero when exactly at included limit', () => {
    const result = calculateAgentCost(makeInputs(1, 100), [agentRule])
    expect(result.cost).toBe(0)
  })

  it('charges overage above included calls', () => {
    // 1 user × 150 calls; overage = 50 × $0.50 = $25
    const result = calculateAgentCost(makeInputs(1, 150), [agentRule])
    expect(result.cost).toBeCloseTo(25)
  })

  it('returns zero when activeUsers is 0', () => {
    const result = calculateAgentCost(makeInputs(0, 200), [agentRule])
    expect(result.cost).toBe(0)
  })

  it('handles no included units', () => {
    const noIncludedRule: PricingRule = {
      id: 'rule-no-included',
      metric: PricingMetric.AGENT_CALL,
      unitLabel: 'agent invocation',
      unitCost: 1.0,
    }
    // 5 users × 10 calls = 50 × $1.00 = $50
    const result = calculateAgentCost(makeInputs(5, 10), [noIncludedRule])
    expect(result.cost).toBeCloseTo(50)
  })

  it('returns zero for empty rules', () => {
    const result = calculateAgentCost(makeInputs(10, 200), [])
    expect(result.cost).toBe(0)
  })

  it('produces an explanation', () => {
    const result = calculateAgentCost(makeInputs(1, 150), [agentRule])
    expect(result.explanation.component).toBe('agent')
    expect(result.explanation.result).toBeCloseTo(25)
  })
})
