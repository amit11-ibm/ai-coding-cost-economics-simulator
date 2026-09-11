import { describe, it, expect } from 'vitest'
import { calculateSeatCost } from '../../src/engine/pricing/seat'
import type { PricingInputs, PricingRule } from '../../src/domain/types'
import { PricingMetric } from '../../src/domain/types'

const makeInputs = (activeUsers: number): PricingInputs => ({
  activeUsers,
  monthlyInputTokensPerUser: 0,
  monthlyOutputTokensPerUser: 0,
  agentCallsPerUser: 0,
  apiCallsPerUser: 0,
  storageGbPerUser: 0,
  simulationMonth: 1,
  calendarDate: '2024-02-01',
})

const flatRule: PricingRule = {
  id: 'rule-seat',
  metric: PricingMetric.SEAT,
  unitLabel: 'seat/month',
  unitCost: 45,
}

describe('SeatCalculator', () => {
  it('calculates flat seat cost correctly', () => {
    const result = calculateSeatCost(makeInputs(100), [flatRule])
    expect(result.cost).toBe(4500)
  })

  it('returns zero cost when activeUsers is 0', () => {
    const result = calculateSeatCost(makeInputs(0), [flatRule])
    expect(result.cost).toBe(0)
  })

  it('calculates for 500 users', () => {
    const result = calculateSeatCost(makeInputs(500), [flatRule])
    expect(result.cost).toBe(22500)
  })

  it('handles tiered seat pricing', () => {
    const tieredRule: PricingRule = {
      id: 'rule-tiered-seat',
      metric: PricingMetric.SEAT,
      unitLabel: 'seat/month',
      unitCost: 50,
      tieredRates: [
        { upTo: 100, unitCost: 50 },
        { upTo: Infinity, unitCost: 40 },
      ],
    }
    // First 100 users: 100 × $50 = $5000; next 50 users: 50 × $40 = $2000; total = $7000
    const result = calculateSeatCost(makeInputs(150), [tieredRule])
    expect(result.cost).toBe(7000)
  })

  it('produces an explanation with correct formula', () => {
    const result = calculateSeatCost(makeInputs(100), [flatRule])
    expect(result.explanation.component).toBe('seat')
    expect(result.explanation.result).toBe(4500)
  })

  it('handles single user correctly', () => {
    const result = calculateSeatCost(makeInputs(1), [flatRule])
    expect(result.cost).toBe(45)
  })

  it('returns zero for empty rules', () => {
    const result = calculateSeatCost(makeInputs(100), [])
    expect(result.cost).toBe(0)
  })
})
