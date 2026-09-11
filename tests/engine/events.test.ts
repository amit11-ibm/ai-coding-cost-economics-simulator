import { describe, it, expect } from 'vitest'
import { sortEvents, applyEvents } from '../../src/engine/events'
import type { SimulationEvent, SimulationState, UsageProfile } from '../../src/domain/types'
import { EventType, EntityType } from '../../src/domain/types'

// ─── Test Fixtures ────────────────────────────────────────────

const baseUsageProfile: UsageProfile = {
  avgInputTokensPerDevPerMonth: 1_000_000,
  avgOutputTokensPerDevPerMonth: 200_000,
  agentCallsPerDevPerMonth: 50,
  storageGbPerDev: 0,
  apiCallsPerDevPerMonth: 5000,
}

function makeState(overrides: Partial<SimulationState> = {}): SimulationState {
  return {
    month: 1,
    developerCount: 100,
    toolStates: {
      'tool-a': {
        toolId: 'tool-a',
        adoptionRate: 0.5,
        adoptionOverridden: false,
        activePricingVersionId: 'plan-tool-a-v1',
        pricingVersionOverridden: false,
        usageProfile: { ...baseUsageProfile },
        pendingMigrationCost: 0,
        pendingSecurityCost: 0,
        pendingOneTimeOperationalCost: 0,
        recurringOperationalCostPerMonth: 0,
      },
      'tool-b': {
        toolId: 'tool-b',
        adoptionRate: 0.4,
        adoptionOverridden: false,
        activePricingVersionId: 'plan-tool-b-v1',
        pricingVersionOverridden: false,
        usageProfile: { ...baseUsageProfile },
        pendingMigrationCost: 0,
        pendingSecurityCost: 0,
        pendingOneTimeOperationalCost: 0,
        recurringOperationalCostPerMonth: 0,
      },
    },
    ...overrides,
  }
}

function makeEvent(
  overrides: Partial<SimulationEvent> & Pick<SimulationEvent, 'type' | 'payload'>
): SimulationEvent {
  return {
    id: 'test-event',
    scenarioId: 'test',
    effectiveMonth: 1,
    priority: 10,
    description: 'Test event',
    affectedToolIds: ['tool-a'],
    affectedEntityType: EntityType.TOOL,
    ...overrides,
  }
}

// ─── Sort Tests ───────────────────────────────────────────────

describe('sortEvents', () => {
  it('sorts by effectiveMonth ASC', () => {
    const events: SimulationEvent[] = [
      makeEvent({ effectiveMonth: 10, type: EventType.ADOPTION_CHANGE, payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.8 } }),
      makeEvent({ effectiveMonth: 3, type: EventType.ADOPTION_CHANGE, payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.6 } }),
      makeEvent({ effectiveMonth: 7, type: EventType.ADOPTION_CHANGE, payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.7 } }),
    ]
    const sorted = sortEvents(events)
    expect(sorted[0].effectiveMonth).toBe(3)
    expect(sorted[1].effectiveMonth).toBe(7)
    expect(sorted[2].effectiveMonth).toBe(10)
  })

  it('sorts by priority ASC within same effectiveMonth', () => {
    const events: SimulationEvent[] = [
      makeEvent({ effectiveMonth: 6, priority: 20, type: EventType.ADOPTION_CHANGE, payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.9 } }),
      makeEvent({ effectiveMonth: 6, priority: 5, type: EventType.HEADCOUNT_CHANGE, payload: { type: EventType.HEADCOUNT_CHANGE, mode: 'delta', value: 50 } }),
      makeEvent({ effectiveMonth: 6, priority: 15, type: EventType.ADOPTION_CHANGE, payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.7 } }),
    ]
    const sorted = sortEvents(events)
    expect(sorted[0].priority).toBe(5)
    expect(sorted[1].priority).toBe(15)
    expect(sorted[2].priority).toBe(20)
  })

  it('does not mutate the input array', () => {
    const events = [
      makeEvent({ effectiveMonth: 5, type: EventType.ADOPTION_CHANGE, payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.8 } }),
      makeEvent({ effectiveMonth: 2, type: EventType.ADOPTION_CHANGE, payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.5 } }),
    ]
    const original = [...events]
    sortEvents(events)
    expect(events[0].effectiveMonth).toBe(original[0].effectiveMonth)
  })
})

// ─── Event Mutation Tests ─────────────────────────────────────

describe('applyEvents', () => {
  it('ADOPTION_CHANGE sets adoptionRate and adoptionOverridden=true', () => {
    const state = makeState()
    const event = makeEvent({
      type: EventType.ADOPTION_CHANGE,
      payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.85 },
    })
    const next = applyEvents(state, [event])
    expect(next.toolStates['tool-a']!.adoptionRate).toBe(0.85)
    expect(next.toolStates['tool-a']!.adoptionOverridden).toBe(true)
  })

  it('VENDOR_PRICE_CHANGE sets activePricingVersionId and pricingVersionOverridden=true', () => {
    const state = makeState()
    const event = makeEvent({
      type: EventType.VENDOR_PRICE_CHANGE,
      payload: { type: EventType.VENDOR_PRICE_CHANGE, newVersionId: 'plan-tool-a-v2' },
    })
    const next = applyEvents(state, [event])
    expect(next.toolStates['tool-a']!.activePricingVersionId).toBe('plan-tool-a-v2')
    expect(next.toolStates['tool-a']!.pricingVersionOverridden).toBe(true)
  })

  it('PRICING_VERSION_CHANGE sets activePricingVersionId and pricingVersionOverridden=true', () => {
    const state = makeState()
    const event = makeEvent({
      type: EventType.PRICING_VERSION_CHANGE,
      payload: { type: EventType.PRICING_VERSION_CHANGE, newVersionId: 'plan-tool-a-v2' },
    })
    const next = applyEvents(state, [event])
    expect(next.toolStates['tool-a']!.activePricingVersionId).toBe('plan-tool-a-v2')
    expect(next.toolStates['tool-a']!.pricingVersionOverridden).toBe(true)
  })

  it('BILLING_MODEL_CHANGE sets activePricingVersionId and pricingVersionOverridden=true', () => {
    const state = makeState()
    const event = makeEvent({
      type: EventType.BILLING_MODEL_CHANGE,
      payload: { type: EventType.BILLING_MODEL_CHANGE, newVersionId: 'plan-tool-a-v2' },
    })
    const next = applyEvents(state, [event])
    expect(next.toolStates['tool-a']!.activePricingVersionId).toBe('plan-tool-a-v2')
    expect(next.toolStates['tool-a']!.pricingVersionOverridden).toBe(true)
  })

  it('AGENT_PRICING_CHANGE sets activePricingVersionId and pricingVersionOverridden=true', () => {
    const state = makeState()
    const event = makeEvent({
      type: EventType.AGENT_PRICING_CHANGE,
      payload: { type: EventType.AGENT_PRICING_CHANGE, newVersionId: 'plan-tool-a-v2' },
    })
    const next = applyEvents(state, [event])
    expect(next.toolStates['tool-a']!.activePricingVersionId).toBe('plan-tool-a-v2')
    expect(next.toolStates['tool-a']!.pricingVersionOverridden).toBe(true)
  })

  it('HEADCOUNT_CHANGE with delta mode adds to developerCount', () => {
    const state = makeState()
    const event = makeEvent({
      affectedToolIds: [],
      type: EventType.HEADCOUNT_CHANGE,
      payload: { type: EventType.HEADCOUNT_CHANGE, mode: 'delta', value: 50 },
    })
    const next = applyEvents(state, [event])
    expect(next.developerCount).toBe(150)
  })

  it('HEADCOUNT_CHANGE with absolute mode sets developerCount', () => {
    const state = makeState()
    const event = makeEvent({
      affectedToolIds: [],
      type: EventType.HEADCOUNT_CHANGE,
      payload: { type: EventType.HEADCOUNT_CHANGE, mode: 'absolute', value: 300 },
    })
    const next = applyEvents(state, [event])
    expect(next.developerCount).toBe(300)
  })

  it('MIGRATION_EVENT adds to pendingMigrationCost', () => {
    const state = makeState()
    const event = makeEvent({
      type: EventType.MIGRATION_EVENT,
      payload: { type: EventType.MIGRATION_EVENT, cost: 30000 },
    })
    const next = applyEvents(state, [event])
    expect(next.toolStates['tool-a']!.pendingMigrationCost).toBe(30000)
  })

  it('SECURITY_REMEDIATION adds to pendingSecurityCost', () => {
    const state = makeState()
    const event = makeEvent({
      type: EventType.SECURITY_REMEDIATION,
      payload: { type: EventType.SECURITY_REMEDIATION, cost: 50000 },
    })
    const next = applyEvents(state, [event])
    expect(next.toolStates['tool-a']!.pendingSecurityCost).toBe(50000)
  })

  it('PROVIDER_MODEL_CHANGE sets activeModelProviderId', () => {
    const state = makeState()
    const event = makeEvent({
      type: EventType.PROVIDER_MODEL_CHANGE,
      payload: { type: EventType.PROVIDER_MODEL_CHANGE, modelId: 'model-gpt-4o' },
    })
    const next = applyEvents(state, [event])
    expect(next.toolStates['tool-a']!.activeModelProviderId).toBe('model-gpt-4o')
  })

  it('TOKENISATION_CHANGE replaces usageProfile in ToolSimState', () => {
    const state = makeState()
    const newProfile: UsageProfile = {
      avgInputTokensPerDevPerMonth: 5_000_000,
      avgOutputTokensPerDevPerMonth: 1_000_000,
      agentCallsPerDevPerMonth: 200,
      storageGbPerDev: 10,
      apiCallsPerDevPerMonth: 20000,
    }
    const event = makeEvent({
      type: EventType.TOKENISATION_CHANGE,
      payload: { type: EventType.TOKENISATION_CHANGE, newUsageProfile: newProfile },
    })
    const next = applyEvents(state, [event])
    expect(next.toolStates['tool-a']!.usageProfile).toEqual(newProfile)
  })

  it('OPERATIONAL_COST_CHANGE with recurring=true sets recurringOperationalCostPerMonth', () => {
    const state = makeState()
    const event = makeEvent({
      type: EventType.OPERATIONAL_COST_CHANGE,
      payload: { type: EventType.OPERATIONAL_COST_CHANGE, recurring: true, costPerMonth: 5000 },
    })
    const next = applyEvents(state, [event])
    expect(next.toolStates['tool-a']!.recurringOperationalCostPerMonth).toBe(5000)
    expect(next.toolStates['tool-a']!.pendingOneTimeOperationalCost).toBe(0)
  })

  it('OPERATIONAL_COST_CHANGE with recurring=false sets pendingOneTimeOperationalCost', () => {
    const state = makeState()
    const event = makeEvent({
      type: EventType.OPERATIONAL_COST_CHANGE,
      payload: { type: EventType.OPERATIONAL_COST_CHANGE, recurring: false, cost: 10000 },
    })
    const next = applyEvents(state, [event])
    expect(next.toolStates['tool-a']!.pendingOneTimeOperationalCost).toBe(10000)
    expect(next.toolStates['tool-a']!.recurringOperationalCostPerMonth).toBe(0)
  })

  it('immutability: input state is not mutated', () => {
    const state = makeState()
    const originalRate = state.toolStates['tool-a']!.adoptionRate
    const event = makeEvent({
      type: EventType.ADOPTION_CHANGE,
      payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.99 },
    })
    applyEvents(state, [event])
    expect(state.toolStates['tool-a']!.adoptionRate).toBe(originalRate)
  })

  it('same-month priority ordering: higher priority event wins on same field', () => {
    // Two ADOPTION_CHANGE events at same month; priority 20 wins
    const events = [
      makeEvent({
        id: 'evt-low',
        priority: 5,
        type: EventType.ADOPTION_CHANGE,
        payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.5 },
      }),
      makeEvent({
        id: 'evt-high',
        priority: 20,
        type: EventType.ADOPTION_CHANGE,
        payload: { type: EventType.ADOPTION_CHANGE, newRate: 0.9 },
      }),
    ]
    const sorted = sortEvents(events)
    const state = makeState()
    const next = applyEvents(state, sorted)
    expect(next.toolStates['tool-a']!.adoptionRate).toBe(0.9)
  })
})
