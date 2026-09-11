import { describe, it, expect } from 'vitest'
import { runSimulation } from '../../src/engine/simulation'
import type { ScenarioConfig, PricingPlan } from '../../src/domain/types'
import { EventType, EntityType, PricingMetric, PricingStrategyType } from '../../src/domain/types'

// Minimal test plan for event progression tests
const testPlan: PricingPlan = {
  id: 'evt-test-plan',
  productId: 'prod-test',
  name: 'Event Test Plan',
  currency: 'USD',
  components: [
    {
      id: 'comp-seat',
      metric: PricingMetric.SEAT,
      strategy: PricingStrategyType.PER_UNIT,
      rules: [
        {
          id: 'rule-seat',
          metric: PricingMetric.SEAT,
          unitLabel: 'seat/month',
          unitCost: 100,
        },
      ],
    },
  ],
  versions: [
    {
      id: 'evt-test-plan-v1',
      pricingPlanId: 'evt-test-plan',
      effectiveFrom: '2024-01-01',
      components: [
        {
          id: 'comp-seat-v1',
          metric: PricingMetric.SEAT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [{ id: 'rule-seat-v1', metric: PricingMetric.SEAT, unitLabel: 'seat/month', unitCost: 100 }],
        },
      ],
    },
    {
      id: 'evt-test-plan-v2',
      pricingPlanId: 'evt-test-plan',
      effectiveFrom: '2025-01-01', // far future; only active if explicitly overridden
      components: [
        {
          id: 'comp-seat-v2',
          metric: PricingMetric.SEAT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [{ id: 'rule-seat-v2', metric: PricingMetric.SEAT, unitLabel: 'seat/month', unitCost: 200 }],
        },
      ],
    },
  ],
}

const plans = { 'evt-test-plan': testPlan }

const baseScenario: ScenarioConfig = {
  id: 'evt-test',
  name: 'Event Progression Test',
  description: 'For event progression integration tests',
  simulationStartDate: '2024-01-01',
  durationMonths: 24,
  currency: 'USD',
  startingDeveloperCount: 10,
  developerGrowthRule: { type: 'flat' },
  toolConfigs: [
    {
      toolId: 'tool-a',
      pricingPlanId: 'evt-test-plan',
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

describe('Event Progression Integration', () => {
  it('events fire at correct months (not before or after)', () => {
    const scenario: ScenarioConfig = {
      ...baseScenario,
      events: [
        {
          id: 'evt-m5',
          scenarioId: 'evt-test',
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
    const run = runSimulation(scenario, plans)

    // Event appears only in month 5's appliedEvents
    for (let m = 0; m <= 24; m++) {
      const hasEvent = run.snapshots[m].appliedEvents.some((e) => e.id === 'evt-m5')
      expect(hasEvent).toBe(m === 5)
    }
  })

  it('same-month multi-event priority: higher priority event wins', () => {
    // Two adoption changes in month 6: low priority (0.3) and high priority (0.7)
    const scenario: ScenarioConfig = {
      ...baseScenario,
      events: [
        {
          id: 'evt-low-priority',
          scenarioId: 'evt-test',
          effectiveMonth: 6,
          priority: 5,
          type: EventType.ADOPTION_CHANGE,
          description: 'Low priority adoption change',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.3 },
        },
        {
          id: 'evt-high-priority',
          scenarioId: 'evt-test',
          effectiveMonth: 6,
          priority: 15,
          type: EventType.ADOPTION_CHANGE,
          description: 'High priority adoption change',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.7 },
        },
      ],
    }
    const run = runSimulation(scenario, plans)
    const m6 = run.snapshots[6].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m6.adoptionRate).toBe(0.7)
  })

  it('pricing version change reflected in cost from event month onward', () => {
    const scenario: ScenarioConfig = {
      ...baseScenario,
      events: [
        {
          id: 'evt-pricing',
          scenarioId: 'evt-test',
          effectiveMonth: 6,
          priority: 10,
          type: EventType.PRICING_VERSION_CHANGE,
          description: 'Switch to v2 pricing at month 6',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: { type: EventType.PRICING_VERSION_CHANGE, newVersionId: 'evt-test-plan-v2' },
        },
      ],
    }
    const run = runSimulation(scenario, plans)

    // Month 5: v1 pricing → $100/seat × 10 devs = $1000
    const m5 = run.snapshots[5].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m5.costBreakdown.seatCost).toBeCloseTo(1000)

    // Month 6+: v2 pricing → $200/seat × 10 devs = $2000
    const m6 = run.snapshots[6].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m6.costBreakdown.seatCost).toBeCloseTo(2000)

    const m12 = run.snapshots[12].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m12.costBreakdown.seatCost).toBeCloseTo(2000)
  })

  it('adoption event persists across subsequent months', () => {
    const scenario: ScenarioConfig = {
      ...baseScenario,
      events: [
        {
          id: 'evt-adopt',
          scenarioId: 'evt-test',
          effectiveMonth: 4,
          priority: 10,
          type: EventType.ADOPTION_CHANGE,
          description: 'Adoption set to 0.6',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.6 },
        },
      ],
    }
    const run = runSimulation(scenario, plans)

    // Month 3: not yet applied → flat 1.0
    const m3 = run.snapshots[3].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m3.adoptionRate).toBeCloseTo(1.0)

    // Month 4+: adoption overridden to 0.6
    for (let m = 4; m <= 24; m++) {
      const result = run.snapshots[m].perToolResults.find((r) => r.toolId === 'tool-a')!
      expect(result.adoptionRate).toBe(0.6)
    }
  })

  it('TOKENISATION_CHANGE changes usage-derived costs from event month onward', () => {
    const tokenPlan: PricingPlan = {
      id: 'token-evt-plan',
      productId: 'prod-test',
      name: 'Token Event Plan',
      currency: 'USD',
      components: [
        {
          id: 'comp-token',
          metric: PricingMetric.TOKEN_INPUT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [{ id: 'rule-token', metric: PricingMetric.TOKEN_INPUT, unitLabel: 'per 1M', unitCost: 5.0 }],
        },
      ],
      versions: [
        {
          id: 'token-evt-plan-v1',
          pricingPlanId: 'token-evt-plan',
          effectiveFrom: '2024-01-01',
          components: [
            {
              id: 'comp-token-v1',
              metric: PricingMetric.TOKEN_INPUT,
              strategy: PricingStrategyType.PER_UNIT,
              rules: [{ id: 'rule-token-v1', metric: PricingMetric.TOKEN_INPUT, unitLabel: 'per 1M', unitCost: 5.0 }],
            },
          ],
        },
      ],
    }

    const tokenPlans = { 'token-evt-plan': tokenPlan }
    const tokenScenario: ScenarioConfig = {
      ...baseScenario,
      toolConfigs: [
        {
          toolId: 'tool-a',
          pricingPlanId: 'token-evt-plan',
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
          id: 'evt-token',
          scenarioId: 'evt-test',
          effectiveMonth: 8,
          priority: 10,
          type: EventType.TOKENISATION_CHANGE,
          description: 'Token usage doubles',
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

    const run = runSimulation(tokenScenario, tokenPlans)

    // Month 7: 10 devs × 1M tokens × $5/1M = $50
    const m7 = run.snapshots[7].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m7.costBreakdown.tokenCost).toBeCloseTo(50)

    // Month 8+: 10 devs × 2M tokens × $5/1M = $100
    for (let m = 8; m <= 24; m++) {
      const result = run.snapshots[m].perToolResults.find((r) => r.toolId === 'tool-a')!
      expect(result.costBreakdown.tokenCost).toBeCloseTo(100)
    }
  })

  it('recurring operational cost appears every month after event; one-time costs do not recur', () => {
    const scenario: ScenarioConfig = {
      ...baseScenario,
      events: [
        {
          id: 'evt-recurring',
          scenarioId: 'evt-test',
          effectiveMonth: 10,
          priority: 10,
          type: EventType.OPERATIONAL_COST_CHANGE,
          description: 'Recurring $500/month',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: { type: EventType.OPERATIONAL_COST_CHANGE, recurring: true, costPerMonth: 500 },
        },
        {
          id: 'evt-onetime',
          scenarioId: 'evt-test',
          effectiveMonth: 15,
          priority: 10,
          type: EventType.OPERATIONAL_COST_CHANGE,
          description: 'One-time $2000',
          affectedToolIds: ['tool-a'],
          affectedEntityType: EntityType.TOOL,
          payload: { type: EventType.OPERATIONAL_COST_CHANGE, recurring: false, cost: 2000 },
        },
      ],
    }
    const run = runSimulation(scenario, plans)

    // Months 10–14: recurring $500/month (no one-time yet)
    for (let m = 10; m <= 14; m++) {
      const result = run.snapshots[m].perToolResults.find((r) => r.toolId === 'tool-a')!
      expect(result.costBreakdown.operationalCost).toBe(500)
    }

    // Month 15: recurring $500 + one-time $2000 = $2500
    const m15 = run.snapshots[15].perToolResults.find((r) => r.toolId === 'tool-a')!
    expect(m15.costBreakdown.operationalCost).toBe(2500)

    // Month 16+: recurring $500 only (one-time consumed)
    for (let m = 16; m <= 24; m++) {
      const result = run.snapshots[m].perToolResults.find((r) => r.toolId === 'tool-a')!
      expect(result.costBreakdown.operationalCost).toBe(500)
    }
  })
})
