import { describe, it, expect } from 'vitest'
import { runSimulation } from '../../src/engine/simulation'
import { modernisationScenario } from '../../src/data/scenarios/modernisation'
import { pricingPlanMap } from '../../src/data/pricing-plans'

describe('Modernisation Scenario — Golden Tests', () => {
  const run = runSimulation(modernisationScenario, pricingPlanMap)

  it('produces exactly 25 snapshots', () => {
    expect(run.snapshots).toHaveLength(25)
  })

  it('snapshot indices match month values (0–24)', () => {
    for (let i = 0; i < 25; i++) {
      expect(run.snapshots[i].month).toBe(i)
    }
  })

  it('month 0 baseline has zero costs for all tools', () => {
    const baseline = run.snapshots[0]
    expect(baseline.month).toBe(0)
    expect(baseline.appliedEvents).toHaveLength(0)
    for (const toolResult of baseline.perToolResults) {
      expect(toolResult.totalMonthlyCost).toBe(0)
      expect(toolResult.cumulativeCost).toBe(0)
    }
  })

  it('month 24 has non-zero cumulative costs for all tools', () => {
    const final = run.snapshots[24]
    for (const toolResult of final.perToolResults) {
      expect(toolResult.cumulativeCost).toBeGreaterThan(0)
    }
  })

  it('cumulative costs are monotonically non-decreasing across months', () => {
    for (const toolConfig of modernisationScenario.toolConfigs) {
      let prev = 0
      for (let m = 0; m <= 24; m++) {
        const result = run.snapshots[m].perToolResults.find(
          (r) => r.toolId === toolConfig.toolId
        )!
        expect(result.cumulativeCost).toBeGreaterThanOrEqual(prev)
        prev = result.cumulativeCost
      }
    }
  })

  it('is deterministic', () => {
    const run2 = runSimulation(modernisationScenario, pricingPlanMap)
    expect(JSON.stringify(run.snapshots)).toBe(JSON.stringify(run2.snapshots))
  })

  it('events fire at correct months', () => {
    // mod-evt-1: VENDOR_PRICE_CHANGE at month 3
    expect(run.snapshots[3].appliedEvents.some((e) => e.id === 'mod-evt-1')).toBe(true)
    // mod-evt-2, mod-evt-3: at month 6
    expect(run.snapshots[6].appliedEvents.some((e) => e.id === 'mod-evt-2')).toBe(true)
    expect(run.snapshots[6].appliedEvents.some((e) => e.id === 'mod-evt-3')).toBe(true)
    // mod-evt-5: SECURITY_REMEDIATION at month 12
    expect(run.snapshots[12].appliedEvents.some((e) => e.id === 'mod-evt-5')).toBe(true)
  })

  it('security remediation cost appears only at month 12 for tool-b and tool-c', () => {
    const m12 = run.snapshots[12]
    const toolB = m12.perToolResults.find((r) => r.toolId === 'tool-b')!
    const toolC = m12.perToolResults.find((r) => r.toolId === 'tool-c')!
    expect(toolB.costBreakdown.securityRemediationCost).toBeGreaterThan(0)
    expect(toolC.costBreakdown.securityRemediationCost).toBeGreaterThan(0)

    // Month 13: security cost should be zero
    const m13 = run.snapshots[13]
    expect(m13.perToolResults.find((r) => r.toolId === 'tool-b')!.costBreakdown.securityRemediationCost).toBe(0)
  })

  it('migration cost appears only at month 18 for tool-c', () => {
    const m18 = run.snapshots[18]
    const toolC = m18.perToolResults.find((r) => r.toolId === 'tool-c')!
    expect(toolC.costBreakdown.migrationCost).toBe(30_000)

    const m19 = run.snapshots[19]
    expect(m19.perToolResults.find((r) => r.toolId === 'tool-c')!.costBreakdown.migrationCost).toBe(0)
  })

  it('recurring operational cost for tool-c starts at month 20', () => {
    // Before month 20: no operational (from event; may have zero from base)
    const m19 = run.snapshots[19]
    expect(m19.perToolResults.find((r) => r.toolId === 'tool-c')!.costBreakdown.operationalCost).toBe(0)

    // Months 20–24: recurring $5000/month
    for (let m = 20; m <= 24; m++) {
      const result = run.snapshots[m].perToolResults.find((r) => r.toolId === 'tool-c')!
      expect(result.costBreakdown.operationalCost).toBe(5_000)
    }
  })

  it('tool-a adoption is overridden at month 6 via ADOPTION_CHANGE', () => {
    const m6 = run.snapshots[6]
    const toolA = m6.perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(toolA.adoptionRate).toBe(0.9)

    // Persists at month 7
    const m7 = run.snapshots[7]
    expect(m7.perToolResults.find((r) => r.toolId === 'tool-a')!.adoptionRate).toBe(0.9)
  })

  it('developer count increases at month 6 via HEADCOUNT_CHANGE', () => {
    const m5 = run.snapshots[5]
    const m6 = run.snapshots[6]
    expect(m6.developerCount).toBeGreaterThan(m5.developerCount)
  })

  // Golden fixture values — computed from the deterministic engine
  it('tool-a month 24 cumulative cost matches golden fixture', () => {
    const m24toolA = run.snapshots[24].perToolResults.find((r) => r.toolId === 'tool-a')!
    // This will be set to the actual computed value to lock it
    expect(m24toolA.cumulativeCost).toBeGreaterThan(0)
    // Log the actual value for fixture creation
    // console.log('tool-a M24 cumulative:', m24toolA.cumulativeCost)
    // Lock to computed value: run first, then update
    expect(Math.round(m24toolA.cumulativeCost)).toMatchSnapshot()
  })

  it('all tools have 5 tool results per snapshot', () => {
    for (const snapshot of run.snapshots) {
      expect(snapshot.perToolResults).toHaveLength(modernisationScenario.toolConfigs.length)
    }
  })
})
