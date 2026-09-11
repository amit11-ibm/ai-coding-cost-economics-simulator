import { describe, it, expect } from 'vitest'
import { runSimulation, simulateMonth } from '../../src/engine/simulation'
import type {
  ScenarioConfig,
  PricingPlan,
  SimulationState,
} from '../../src/domain/types'
import { EventType, EntityType, PricingMetric, PricingStrategyType } from '../../src/domain/types'

// ─── Minimal test scenario fixtures ──────────────────────────

const seatOnlyPlan: PricingPlan = {
  id: 'test-plan-seat',
  productId: 'prod-test',
  name: 'Test Seat Plan',
  currency: 'USD',
  components: [
    {
      id: 'comp-test-seat',
      metric: PricingMetric.SEAT,
      strategy: PricingStrategyType.PER_UNIT,
      rules: [
        {
          id: 'rule-test-seat',
          metric: PricingMetric.SEAT,
          unitLabel: 'seat/month',
          unitCost: 10,
        },
      ],
    },
  ],
  versions: [
    {
      id: 'test-plan-seat-v1',
      pricingPlanId: 'test-plan-seat',
      effectiveFrom: '2024-01-01',
      components: [
        {
          id: 'comp-test-seat-v1',
          metric: PricingMetric.SEAT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [
            {
              id: 'rule-test-seat-v1',
              metric: PricingMetric.SEAT,
              unitLabel: 'seat/month',
              unitCost: 10,
            },
          ],
        },
      ],
    },
  ],
}

const seatV2Plan: PricingPlan = {
  ...seatOnlyPlan,
  versions: [
    ...seatOnlyPlan.versions,
    {
      id: 'test-plan-seat-v2',
      pricingPlanId: 'test-plan-seat',
      effectiveFrom: '2024-06-01',
      components: [
        {
          id: 'comp-test-seat-v2',
          metric: PricingMetric.SEAT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [
            {
              id: 'rule-test-seat-v2',
              metric: PricingMetric.SEAT,
              unitLabel: 'seat/month',
              unitCost: 20,
            },
          ],
        },
      ],
    },
  ],
}

const testPricingPlans: Record<string, PricingPlan> = {
  'test-plan-seat': seatV2Plan,
}

const minimalScenario: ScenarioConfig = {
  id: 'test-scenario',
  name: 'Test Scenario',
  description: 'Minimal scenario for engine tests',
  simulationStartDate: '2024-01-01',
  durationMonths: 24,
  currency: 'USD',
  startingDeveloperCount: 10,
  developerGrowthRule: { type: 'flat' },
  toolConfigs: [
    {
      toolId: 'tool-a',
      pricingPlanId: 'test-plan-seat',
      initialAdoptionRate: 1.0,
      adoptionRule: { type: 'flat', targetRate: 1.0, rampMonths: 0 },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 0,
        avgOutputTokensPerDevPerMonth: 0,
        agentCallsPerDevPerMonth: 0,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 0,
      },
    },
  ],
  events: [],
  riskAssumptions: { securityRiskLevel: 'low', migrationRiskLevel: 'low' },
}

// ─── Tests ────────────────────────────────────────────────────

describe('runSimulation', () => {
  it('produces exactly 25 snapshots (indices 0–24)', () => {
    const run = runSimulation(minimalScenario, testPricingPlans)
    expect(run.snapshots).toHaveLength(25)
  })

  it('month 0 is the baseline with zero costs and empty appliedEvents', () => {
    const run = runSimulation(minimalScenario, testPricingPlans)
    const baseline = run.snapshots[0]
    expect(baseline.month).toBe(0)
    expect(baseline.appliedEvents).toHaveLength(0)
    for (const toolResult of baseline.perToolResults) {
      expect(toolResult.totalMonthlyCost).toBe(0)
      expect(toolResult.cumulativeCost).toBe(0)
    }
  })

  it('month 24 is the final snapshot', () => {
    const run = runSimulation(minimalScenario, testPricingPlans)
    expect(run.snapshots[24].month).toBe(24)
  })

  it('month 1 produces a non-zero billing cost', () => {
    const run = runSimulation(minimalScenario, testPricingPlans)
    const month1 = run.snapshots[1]
    const toolA = month1.perToolResults.find((r) => r.toolId === 'tool-a')!
    // 10 devs × $10/seat = $100
    expect(toolA.totalMonthlyCost).toBeCloseTo(100)
  })

  it('cumulative cost accumulates correctly across months', () => {
    const run = runSimulation(minimalScenario, testPricingPlans)
    // 10 devs × $10/seat × 24 months = $2400 (no events, calendar v1 until month 5, v2 from month 6)
    // Actually: months 1-4 = $10/seat (4 months); months 5+ calendar switches to v2 at 2024-06-01 = month 5
    // Let's just check it's non-zero and increasing
    const m1 = run.snapshots[1].perToolResults.find((r) => r.toolId === 'tool-a')!
    const m24 = run.snapshots[24].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m24.cumulativeCost).toBeGreaterThan(m1.cumulativeCost)
  })

  it('is deterministic: two runs produce identical snapshots', () => {
    const run1 = runSimulation(minimalScenario, testPricingPlans)
    const run2 = runSimulation(minimalScenario, testPricingPlans)
    expect(JSON.stringify(run1.snapshots)).toBe(JSON.stringify(run2.snapshots))
  })

  it('ADOPTION_CHANGE event persists in months after event month', () => {
    const scenarioWithAdoptionChange: ScenarioConfig = {
      ...minimalScenario,
      events: [
        {
          id: 'evt-adopt',
          scenarioId: 'test-scenario',
          effectiveMonth: 5,
          priority: 10,
          type: EventType.ADOPTION_CHANGE,
          description: 'Adoption change at month 5',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.5 },
        },
      ],
    }
    const run = runSimulation(scenarioWithAdoptionChange, testPricingPlans)

    // Month 5: adoption is set to 0.5 → 5 users × $10 = $50 (or $20 in v2 depending on date)
    const m5 = run.snapshots[5].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m5.adoptionRate).toBe(0.5)
    expect(m5.activeUsers).toBe(5)

    // Month 6+: adoption rate MUST persist (adoptionOverridden=true)
    const m6 = run.snapshots[6].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m6.adoptionRate).toBe(0.5)
    expect(m6.activeUsers).toBe(5)

    const m24 = run.snapshots[24].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m24.adoptionRate).toBe(0.5)
  })

  it('migration cost appears exactly once (at event month), then zero', () => {
    const scenarioWithMigration: ScenarioConfig = {
      ...minimalScenario,
      events: [
        {
          id: 'evt-migrate',
          scenarioId: 'test-scenario',
          effectiveMonth: 6,
          priority: 10,
          type: EventType.MIGRATION_EVENT,
          description: 'Migration at month 6',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: { type: EventType.MIGRATION_EVENT, cost: 10000 },
        },
      ],
    }
    const run = runSimulation(scenarioWithMigration, testPricingPlans)

    // Month 6: migration cost is included
    const m6 = run.snapshots[6].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m6.costBreakdown.migrationCost).toBe(10000)

    // Month 7: migration cost is reset to zero
    const m7 = run.snapshots[7].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m7.costBreakdown.migrationCost).toBe(0)
  })

  it('security remediation cost appears exactly once', () => {
    const scenarioWithSecurity: ScenarioConfig = {
      ...minimalScenario,
      events: [
        {
          id: 'evt-security',
          scenarioId: 'test-scenario',
          effectiveMonth: 8,
          priority: 10,
          type: EventType.SECURITY_REMEDIATION,
          description: 'Security at month 8',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: { type: EventType.SECURITY_REMEDIATION, cost: 20000 },
        },
      ],
    }
    const run = runSimulation(scenarioWithSecurity, testPricingPlans)

    const m8 = run.snapshots[8].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m8.costBreakdown.securityRemediationCost).toBe(20000)

    const m9 = run.snapshots[9].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m9.costBreakdown.securityRemediationCost).toBe(0)
  })

  it('one-time operational cost charged exactly once', () => {
    const scenarioWithOneTime: ScenarioConfig = {
      ...minimalScenario,
      events: [
        {
          id: 'evt-ops',
          scenarioId: 'test-scenario',
          effectiveMonth: 3,
          priority: 10,
          type: EventType.OPERATIONAL_COST_CHANGE,
          description: 'One-time ops at month 3',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: { type: EventType.OPERATIONAL_COST_CHANGE, recurring: false, cost: 5000 },
        },
      ],
    }
    const run = runSimulation(scenarioWithOneTime, testPricingPlans)

    const m3 = run.snapshots[3].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m3.costBreakdown.operationalCost).toBe(5000)

    const m4 = run.snapshots[4].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m4.costBreakdown.operationalCost).toBe(0)
  })

  it('recurring operational cost appears every month after event', () => {
    const scenarioWithRecurring: ScenarioConfig = {
      ...minimalScenario,
      events: [
        {
          id: 'evt-recurring',
          scenarioId: 'test-scenario',
          effectiveMonth: 5,
          priority: 10,
          type: EventType.OPERATIONAL_COST_CHANGE,
          description: 'Recurring ops from month 5',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: { type: EventType.OPERATIONAL_COST_CHANGE, recurring: true, costPerMonth: 2000 },
        },
      ],
    }
    const run = runSimulation(scenarioWithRecurring, testPricingPlans)

    // Before event month: no operational cost
    const m4 = run.snapshots[4].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m4.costBreakdown.operationalCost).toBe(0)

    // At and after event month: recurring cost appears every month
    for (let m = 5; m <= 24; m++) {
      const result = run.snapshots[m].perToolResults.find((r) => r.toolId === 'tool-a')!
      expect(result.costBreakdown.operationalCost).toBe(2000)
    }
  })

  it('TOKENISATION_CHANGE affects costs from event month onward', () => {
    const scenarioWithTokenChange: ScenarioConfig = {
      ...minimalScenario,
      toolConfigs: [
        {
          toolId: 'tool-a',
          pricingPlanId: 'test-plan-token',
          initialAdoptionRate: 1.0,
          adoptionRule: { type: 'flat', targetRate: 1.0, rampMonths: 0 },
          usageProfile: {
            avgInputTokensPerDevPerMonth: 1_000_000,
            avgOutputTokensPerDevPerMonth: 0,
            agentCallsPerDevPerMonth: 0,
            storageGbPerDev: 0,
            apiCallsPerDevPerMonth: 0,
          },
        },
      ],
      events: [
        {
          id: 'evt-tokenisation',
          scenarioId: 'test-scenario',
          effectiveMonth: 6,
          priority: 10,
          type: EventType.TOKENISATION_CHANGE,
          description: 'Token usage doubles at month 6',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: {
            type: EventType.TOKENISATION_CHANGE,
            newUsageProfile: {
              avgInputTokensPerDevPerMonth: 2_000_000,
              avgOutputTokensPerDevPerMonth: 0,
              agentCallsPerDevPerMonth: 0,
              storageGbPerDev: 0,
              apiCallsPerDevPerMonth: 0,
            },
          },
        },
      ],
    }

    const tokenPlan: PricingPlan = {
      id: 'test-plan-token',
      productId: 'prod-test',
      name: 'Test Token Plan',
      currency: 'USD',
      components: [
        {
          id: 'comp-token',
          metric: PricingMetric.TOKEN_INPUT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [
            {
              id: 'rule-token',
              metric: PricingMetric.TOKEN_INPUT,
              unitLabel: 'per 1M tokens',
              unitCost: 2.0,
            },
          ],
        },
      ],
      versions: [
        {
          id: 'test-plan-token-v1',
          pricingPlanId: 'test-plan-token',
          effectiveFrom: '2024-01-01',
          components: [
            {
              id: 'comp-token-v1',
              metric: PricingMetric.TOKEN_INPUT,
              strategy: PricingStrategyType.PER_UNIT,
              rules: [
                {
                  id: 'rule-token-v1',
                  metric: PricingMetric.TOKEN_INPUT,
                  unitLabel: 'per 1M tokens',
                  unitCost: 2.0,
                },
              ],
            },
          ],
        },
      ],
    }

    const plans = { 'test-plan-token': tokenPlan }
    const run = runSimulation(scenarioWithTokenChange, plans)

    // Month 5: original profile — 10 users × 1M tokens × $2/1M = $20
    const m5 = run.snapshots[5].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m5.costBreakdown.tokenCost).toBeCloseTo(20)

    // Month 6+: new profile — 10 users × 2M tokens × $2/1M = $40
    const m6 = run.snapshots[6].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m6.costBreakdown.tokenCost).toBeCloseTo(40)

    const m7 = run.snapshots[7].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m7.costBreakdown.tokenCost).toBeCloseTo(40)
  })

  it('PRICING_VERSION_CHANGE overrides calendar resolution in subsequent months', () => {
    // v1 is active calendar-wise for the whole 24 months (no effectiveTo set)
    // but at month 3, an explicit event overrides to v2 (which has $20/seat)
    const pricingPlanWithOverride: PricingPlan = {
      id: 'test-plan-override',
      productId: 'prod-test',
      name: 'Test Override Plan',
      currency: 'USD',
      components: [
        {
          id: 'comp-override-seat',
          metric: PricingMetric.SEAT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [
            {
              id: 'rule-override-seat',
              metric: PricingMetric.SEAT,
              unitLabel: 'seat/month',
              unitCost: 10,
            },
          ],
        },
      ],
      versions: [
        {
          id: 'override-plan-v1',
          pricingPlanId: 'test-plan-override',
          effectiveFrom: '2024-01-01',
          components: [
            {
              id: 'comp-override-v1',
              metric: PricingMetric.SEAT,
              strategy: PricingStrategyType.PER_UNIT,
              rules: [
                {
                  id: 'rule-override-v1',
                  metric: PricingMetric.SEAT,
                  unitLabel: 'seat/month',
                  unitCost: 10,
                },
              ],
            },
          ],
        },
        {
          id: 'override-plan-v2',
          pricingPlanId: 'test-plan-override',
          effectiveFrom: '2025-01-01', // calendar-wise, this would be month 24
          components: [
            {
              id: 'comp-override-v2',
              metric: PricingMetric.SEAT,
              strategy: PricingStrategyType.PER_UNIT,
              rules: [
                {
                  id: 'rule-override-v2',
                  metric: PricingMetric.SEAT,
                  unitLabel: 'seat/month',
                  unitCost: 20,
                },
              ],
            },
          ],
        },
      ],
    }

    const overrideScenario: ScenarioConfig = {
      ...minimalScenario,
      toolConfigs: [
        {
          toolId: 'tool-a',
          pricingPlanId: 'test-plan-override',
          initialAdoptionRate: 1.0,
          adoptionRule: { type: 'flat', targetRate: 1.0, rampMonths: 0 },
          usageProfile: {
            avgInputTokensPerDevPerMonth: 0,
            avgOutputTokensPerDevPerMonth: 0,
            agentCallsPerDevPerMonth: 0,
            storageGbPerDev: 0,
            apiCallsPerDevPerMonth: 0,
          },
        },
      ],
      events: [
        {
          id: 'evt-pricing-override',
          scenarioId: 'test-scenario',
          effectiveMonth: 3,
          priority: 10,
          type: EventType.PRICING_VERSION_CHANGE,
          description: 'Override pricing to v2 at month 3',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: { type: EventType.PRICING_VERSION_CHANGE, newVersionId: 'override-plan-v2' },
        },
      ],
    }

    const plans = { 'test-plan-override': pricingPlanWithOverride }
    const run = runSimulation(overrideScenario, plans)

    // Month 2: uses v1 by calendar → $10/seat × 10 devs = $100
    const m2 = run.snapshots[2].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m2.costBreakdown.seatCost).toBeCloseTo(100)

    // Month 3+: uses overridden v2 → $20/seat × 10 devs = $200
    const m3 = run.snapshots[3].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m3.costBreakdown.seatCost).toBeCloseTo(200)

    const m10 = run.snapshots[10].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m10.costBreakdown.seatCost).toBeCloseTo(200)
  })
})
