import type { Scenario } from '../../domain/types'
import { EventType, EntityType } from '../../domain/types'

/**
 * Modernisation at Scale scenario.
 *
 * Context: Large enterprise migrating legacy systems.
 * Cost predictability is paramount.
 * Starting: 200 developers. Grows to 300 via acquisition at Month 6.
 *
 * Simulation start date: 2024-01-01
 * Duration: 24 months
 *
 * Events:
 *   Month 3:  Vendor announces price increase (Tool A) → VENDOR_PRICE_CHANGE (priority 10)
 *             (Note: Tool A's v2 version becomes effective 2024-04-01 = Month 3 via calendar, but
 *              we make it explicit here to test the override mechanism)
 *   Month 6:  Team headcount doubles via acquisition → HEADCOUNT_CHANGE (priority 5)
 *   Month 6:  Adoption drive → ADOPTION_CHANGE (priority 15; runs after headcount)
 *   Month 9:  New model drops token costs 40% (Tool B, Tool C) → VENDOR_PRICE_CHANGE (priority 10)
 *   Month 12: Security breach triggers remediation cost → SECURITY_REMEDIATION (priority 10)
 *   Month 18: Migration from Tool A to Tool C → MIGRATION_EVENT (priority 10)
 *   Month 20: Operational overhead increase (recurring) → OPERATIONAL_COST_CHANGE (priority 10)
 */
export const modernisationScenario: Scenario = {
  id: 'modernisation',
  name: 'Modernisation at Scale',
  description:
    'A large enterprise is migrating legacy systems to modern AI-assisted development. ' +
    'Cost predictability is paramount — budget overruns are politically sensitive. ' +
    'The organisation needs to understand the 24-month TCO before committing to any tool.',
  simulationStartDate: '2024-01-01',
  durationMonths: 24,
  currency: 'USD',
  startingDeveloperCount: 200,
  developerGrowthRule: {
    type: 'stepped',
    stepMonth: 6,
    stepDelta: 100,
  },
  toolConfigs: [
    {
      toolId: 'tool-a',
      pricingPlanId: 'plan-tool-a',
      initialAdoptionRate: 0.8,
      adoptionRule: {
        type: 'linear',
        targetRate: 0.95,
        rampMonths: 12,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 500_000,
        avgOutputTokensPerDevPerMonth: 100_000,
        agentCallsPerDevPerMonth: 0,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 0,
      },
    },
    {
      toolId: 'tool-b',
      pricingPlanId: 'plan-tool-b',
      initialAdoptionRate: 0.3,
      adoptionRule: {
        type: 'linear',
        targetRate: 0.6,
        rampMonths: 12,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 2_000_000,
        avgOutputTokensPerDevPerMonth: 400_000,
        agentCallsPerDevPerMonth: 0,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 0,
      },
    },
    {
      toolId: 'tool-c',
      pricingPlanId: 'plan-tool-c',
      initialAdoptionRate: 0.5,
      adoptionRule: {
        type: 'linear',
        targetRate: 0.8,
        rampMonths: 12,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 1_000_000,
        avgOutputTokensPerDevPerMonth: 200_000,
        agentCallsPerDevPerMonth: 0,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 0,
      },
    },
    {
      toolId: 'tool-d',
      pricingPlanId: 'plan-tool-d',
      initialAdoptionRate: 0.4,
      adoptionRule: {
        type: 'linear',
        targetRate: 0.7,
        rampMonths: 12,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 0,
        avgOutputTokensPerDevPerMonth: 0,
        agentCallsPerDevPerMonth: 0,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 15_000,
      },
    },
    {
      toolId: 'tool-e',
      pricingPlanId: 'plan-tool-e',
      initialAdoptionRate: 0.2,
      adoptionRule: {
        type: 'linear',
        targetRate: 0.5,
        rampMonths: 12,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 0,
        avgOutputTokensPerDevPerMonth: 0,
        agentCallsPerDevPerMonth: 150,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 0,
      },
    },
  ],
  events: [
    // Month 3: Vendor price increase for Tool A (explicitly overrides calendar version)
    {
      id: 'mod-evt-1',
      scenarioId: 'modernisation',
      effectiveMonth: 3,
      priority: 10,
      type: EventType.VENDOR_PRICE_CHANGE,
      description: 'Tool A vendor announces 20% price increase effective from April 2024',
      affectedToolIds: ['tool-a'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.VENDOR_PRICE_CHANGE,
        newVersionId: 'plan-tool-a-v2',
      },
    },
    // Month 6: Team headcount change (acquisition) — priority 5 (runs first)
    {
      id: 'mod-evt-2',
      scenarioId: 'modernisation',
      effectiveMonth: 6,
      priority: 5,
      type: EventType.HEADCOUNT_CHANGE,
      description: 'Acquisition adds 100 developers to the team',
      affectedToolIds: [],
      affectedEntityType: EntityType.TEAM,
      payload: {
        type: EventType.HEADCOUNT_CHANGE,
        mode: 'delta',
        value: 100,
      },
    },
    // Month 6: Adoption drive — priority 15 (runs after headcount)
    {
      id: 'mod-evt-3',
      scenarioId: 'modernisation',
      effectiveMonth: 6,
      priority: 15,
      type: EventType.ADOPTION_CHANGE,
      description: 'Onboarding drive increases Tool A adoption to 90%',
      affectedToolIds: ['tool-a'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.ADOPTION_CHANGE,
        newRate: 0.9,
      },
    },
    // Month 9: New model release drops token costs 40% (Tool B and Tool C)
    {
      id: 'mod-evt-4',
      scenarioId: 'modernisation',
      effectiveMonth: 9,
      priority: 10,
      type: EventType.VENDOR_PRICE_CHANGE,
      description: 'New model release reduces Tool B token costs by 40%',
      affectedToolIds: ['tool-b'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.VENDOR_PRICE_CHANGE,
        newVersionId: 'plan-tool-b-v2',
      },
    },
    // Month 12: Security breach triggers remediation cost
    {
      id: 'mod-evt-5',
      scenarioId: 'modernisation',
      effectiveMonth: 12,
      priority: 10,
      type: EventType.SECURITY_REMEDIATION,
      description: 'Security audit reveals vulnerabilities; remediation costs $50,000',
      affectedToolIds: ['tool-b', 'tool-c'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.SECURITY_REMEDIATION,
        cost: 50_000,
      },
    },
    // Month 18: Migration from Tool A to Tool C
    {
      id: 'mod-evt-6',
      scenarioId: 'modernisation',
      effectiveMonth: 18,
      priority: 10,
      type: EventType.MIGRATION_EVENT,
      description: 'Migration from Tool A legacy workflows to Tool C — one-time migration cost',
      affectedToolIds: ['tool-c'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.MIGRATION_EVENT,
        cost: 30_000,
      },
    },
    // Month 20: Recurring operational overhead increase
    {
      id: 'mod-evt-7',
      scenarioId: 'modernisation',
      effectiveMonth: 20,
      priority: 10,
      type: EventType.OPERATIONAL_COST_CHANGE,
      description: 'Platform support contract adds $5,000/month recurring operational cost to Tool C',
      affectedToolIds: ['tool-c'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.OPERATIONAL_COST_CHANGE,
        recurring: true,
        costPerMonth: 5_000,
      },
    },
  ],
  riskAssumptions: {
    securityRiskLevel: 'medium',
    migrationRiskLevel: 'high',
    notes:
      'Large legacy codebase increases migration complexity. Security risk moderate due to external API usage.',
  },
}
