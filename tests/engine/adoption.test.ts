import { describe, it, expect } from 'vitest'
import { computeAdoption } from '../../src/engine/adoption'
import type { AdoptionRule } from '../../src/domain/types'

describe('computeAdoption', () => {
  describe('flat rule', () => {
    it('returns targetRate at any month', () => {
      const rule: AdoptionRule = { type: 'flat', targetRate: 0.8, rampMonths: 0 }
      expect(computeAdoption(rule, 0)).toBe(0.8)
      expect(computeAdoption(rule, 12)).toBe(0.8)
      expect(computeAdoption(rule, 24)).toBe(0.8)
    })
  })

  describe('linear rule', () => {
    it('grows linearly from 0 to targetRate over rampMonths', () => {
      const rule: AdoptionRule = { type: 'linear', targetRate: 1.0, rampMonths: 12 }
      expect(computeAdoption(rule, 0)).toBe(0)
      expect(computeAdoption(rule, 6)).toBeCloseTo(0.5)
      expect(computeAdoption(rule, 12)).toBeCloseTo(1.0)
    })

    it('stays at targetRate after rampMonths', () => {
      const rule: AdoptionRule = { type: 'linear', targetRate: 0.8, rampMonths: 6 }
      expect(computeAdoption(rule, 7)).toBeCloseTo(0.8)
      expect(computeAdoption(rule, 24)).toBeCloseTo(0.8)
    })

    it('returns targetRate immediately when rampMonths is 0', () => {
      const rule: AdoptionRule = { type: 'linear', targetRate: 0.9, rampMonths: 0 }
      expect(computeAdoption(rule, 0)).toBeCloseTo(0.9)
      expect(computeAdoption(rule, 1)).toBeCloseTo(0.9)
    })
  })

  describe('stepped rule', () => {
    it('stays at 0 before step month, jumps to target at step month', () => {
      const rule: AdoptionRule = { type: 'stepped', targetRate: 0.9, rampMonths: 6, stepMonth: 6 }
      expect(computeAdoption(rule, 5)).toBe(0)
      expect(computeAdoption(rule, 6)).toBeCloseTo(0.9)
      expect(computeAdoption(rule, 12)).toBeCloseTo(0.9)
    })
  })

  describe('exponential rule', () => {
    it('grows asymptotically toward targetRate', () => {
      const rule: AdoptionRule = { type: 'exponential', targetRate: 1.0, rampMonths: 12 }
      const r0 = computeAdoption(rule, 0)
      const r6 = computeAdoption(rule, 6)
      const r12 = computeAdoption(rule, 12)
      expect(r0).toBeCloseTo(0)
      expect(r6).toBeGreaterThan(0.4)
      expect(r12).toBeGreaterThan(0.9)
    })
  })

  describe('clamping', () => {
    it('never returns rate > 1', () => {
      const rule: AdoptionRule = { type: 'linear', targetRate: 1.5, rampMonths: 1 }
      expect(computeAdoption(rule, 5)).toBeLessThanOrEqual(1)
    })

    it('never returns rate < 0', () => {
      const rule: AdoptionRule = { type: 'linear', targetRate: -0.5, rampMonths: 12 }
      expect(computeAdoption(rule, 0)).toBeGreaterThanOrEqual(0)
    })
  })
})
