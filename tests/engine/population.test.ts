import { describe, it, expect } from 'vitest'
import { computeDeveloperGrowth } from '../../src/engine/population'
import type { GrowthRule } from '../../src/domain/types'

describe('computeDeveloperGrowth', () => {
  it('flat growth: count stays constant at starting count', () => {
    const rule: GrowthRule = { type: 'flat' }
    expect(computeDeveloperGrowth(rule, 0, 100)).toBe(100)
    expect(computeDeveloperGrowth(rule, 12, 100)).toBe(100)
    expect(computeDeveloperGrowth(rule, 24, 100)).toBe(100)
  })

  it('linear growth: count increases by monthlyDelta each month', () => {
    const rule: GrowthRule = { type: 'linear', monthlyDelta: 5 }
    expect(computeDeveloperGrowth(rule, 0, 100)).toBe(100)
    expect(computeDeveloperGrowth(rule, 1, 100)).toBe(105)
    expect(computeDeveloperGrowth(rule, 12, 100)).toBe(160)
  })

  it('linear growth: zero delta stays constant', () => {
    const rule: GrowthRule = { type: 'linear', monthlyDelta: 0 }
    expect(computeDeveloperGrowth(rule, 12, 100)).toBe(100)
  })

  it('stepped growth: steps up by stepDelta at stepMonth', () => {
    const rule: GrowthRule = { type: 'stepped', stepMonth: 6, stepDelta: 100 }
    // Before stepMonth
    expect(computeDeveloperGrowth(rule, 0, 200)).toBe(200)
    expect(computeDeveloperGrowth(rule, 5, 200)).toBe(200)
    // At and after stepMonth
    expect(computeDeveloperGrowth(rule, 6, 200)).toBe(300)
    expect(computeDeveloperGrowth(rule, 12, 200)).toBe(300)
  })

  it('count is always clamped to at least 1', () => {
    const rule: GrowthRule = { type: 'linear', monthlyDelta: -50 }
    // 10 + (-50 × 5) = -240 → clamped to 1
    expect(computeDeveloperGrowth(rule, 5, 10)).toBe(1)
  })

  it('handles starting count of 1', () => {
    const rule: GrowthRule = { type: 'flat' }
    expect(computeDeveloperGrowth(rule, 12, 1)).toBe(1)
  })
})
