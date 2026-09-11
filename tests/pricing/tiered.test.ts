import { describe, it, expect } from 'vitest'
import { applyTieredRates } from '../../src/engine/pricing/tiered'

describe('TieredVolumeCalculator', () => {
  const tiers = [
    { upTo: 100, unitCost: 1.0 },
    { upTo: 500, unitCost: 0.8 },
    { upTo: Infinity, unitCost: 0.5 },
  ]

  it('returns zero for zero volume', () => {
    expect(applyTieredRates(tiers, 0)).toBe(0)
  })

  it('returns zero for negative volume', () => {
    expect(applyTieredRates(tiers, -10)).toBe(0)
  })

  it('applies first tier only when below first boundary', () => {
    // 50 × $1.0 = $50
    expect(applyTieredRates(tiers, 50)).toBeCloseTo(50)
  })

  it('applies exactly at first tier boundary', () => {
    // 100 × $1.0 = $100
    expect(applyTieredRates(tiers, 100)).toBeCloseTo(100)
  })

  it('applies two tiers when just above first boundary', () => {
    // 100 × $1.0 + 1 × $0.8 = $100.8
    expect(applyTieredRates(tiers, 101)).toBeCloseTo(100.8)
  })

  it('applies all three tiers', () => {
    // 100 × $1.0 + 400 × $0.8 + 100 × $0.5 = 100 + 320 + 50 = $470
    expect(applyTieredRates(tiers, 600)).toBeCloseTo(470)
  })

  it('handles single flat tier', () => {
    const flatTier = [{ upTo: Infinity, unitCost: 0.01 }]
    expect(applyTieredRates(flatTier, 1000)).toBeCloseTo(10)
  })

  it('handles empty tiers', () => {
    expect(applyTieredRates([], 100)).toBe(0)
  })

  it('calculates exactly at second tier boundary', () => {
    // 100 × $1.0 + 400 × $0.8 = 100 + 320 = $420
    expect(applyTieredRates(tiers, 500)).toBeCloseTo(420)
  })

  it('just above second tier boundary transitions to third tier', () => {
    // 100 × $1.0 + 400 × $0.8 + 1 × $0.5 = 420.5
    expect(applyTieredRates(tiers, 501)).toBeCloseTo(420.5)
  })
})
