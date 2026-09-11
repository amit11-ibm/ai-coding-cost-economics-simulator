import { describe, it, expect } from 'vitest'
import { runSimulation } from '../../src/engine/simulation'
import { agenticShiftScenario } from '../../src/data/scenarios/agentic-shift'
import { pricingPlanMap } from '../../src/data/pricing-plans'

describe('Agentic Shift Scenario — Golden Tests', () => {
  const run = runSimulation(agenticShiftScenario, pricingPlanMap)

  it('produces exactly 25 snapshots', () => {
    expect(run.snapshots).toHaveLength(25)
  })

  it('month 0 baseline has zero costs for all tools', () => {
    const baseline = run.snapshots[0]
    expect(baseline.appliedEvents).toHaveLength(0)
    for (const toolResult of baseline.perToolResults) {
      expect(toolResult.totalMonthlyCost).toBe(0)
      expect(toolResult.cumulativeCost).toBe(0)
    }
  })

  it('month 24 has non-zero cumulative costs', () => {
    for (const toolResult of run.snapshots[24].perToolResults) {
      expect(toolResult.cumulativeCost).toBeGreaterThan(0)
    }
  })

  it('is deterministic', () => {
    const run2 = runSimulation(agenticShiftScenario, pricingPlanMap)
    expect(JSON.stringify(run.snapshots)).toBe(JSON.stringify(run2.snapshots))
  })

  it('TOKENISATION_CHANGE at month 4 affects tool-b costs from month 4 onward', () => {
    const m3 = run.snapshots[3].perToolResults.find((r) => r.toolId === 'tool-b')!
    const m4 = run.snapshots[4].perToolResults.find((r) => r.toolId === 'tool-b')!

    // After tokenisation change, token costs should be higher
    expect(m4.costBreakdown.tokenCost).toBeGreaterThan(m3.costBreakdown.tokenCost)
  })

  it('security remediation at month 10 affects tool-b and tool-e only', () => {
    const m10 = run.snapshots[10]
    const toolB = m10.perToolResults.find((r) => r.toolId === 'tool-b')!
    const toolE = m10.perToolResults.find((r) => r.toolId === 'tool-e')!
    const toolA = m10.perToolResults.find((r) => r.toolId === 'tool-a')!

    expect(toolB.costBreakdown.securityRemediationCost).toBeGreaterThan(0)
    expect(toolE.costBreakdown.securityRemediationCost).toBeGreaterThan(0)
    expect(toolA.costBreakdown.securityRemediationCost).toBe(0)
  })

  it('security remediation does not recur in month 11', () => {
    const m11 = run.snapshots[11]
    expect(m11.perToolResults.find((r) => r.toolId === 'tool-b')!.costBreakdown.securityRemediationCost).toBe(0)
  })

  it('tool-e adoption is overridden at month 18', () => {
    const m18 = run.snapshots[18].perToolResults.find((r) => r.toolId === 'tool-e')!
    expect(m18.adoptionRate).toBe(0.95)

    // Persists at month 19
    const m19 = run.snapshots[19].perToolResults.find((r) => r.toolId === 'tool-e')!
    expect(m19.adoptionRate).toBe(0.95)
  })

  it('recurring operational for tool-e starts at month 14', () => {
    const m13 = run.snapshots[13].perToolResults.find((r) => r.toolId === 'tool-e')!
    expect(m13.costBreakdown.operationalCost).toBe(0)

    for (let m = 14; m <= 24; m++) {
      const result = run.snapshots[m].perToolResults.find((r) => r.toolId === 'tool-e')!
      expect(result.costBreakdown.operationalCost).toBe(8_000)
    }
  })

  it('tool-b and tool-e month 24 cumulative costs match snapshots', () => {
    const m24toolB = run.snapshots[24].perToolResults.find((r) => r.toolId === 'tool-b')!
    const m24toolE = run.snapshots[24].perToolResults.find((r) => r.toolId === 'tool-e')!
    expect(Math.round(m24toolB.cumulativeCost)).toMatchSnapshot()
    expect(Math.round(m24toolE.cumulativeCost)).toMatchSnapshot()
  })
})
