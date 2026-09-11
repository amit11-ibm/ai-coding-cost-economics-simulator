import type { Scenario } from '../../domain/types'
import { EventType, EntityType } from '../../domain/types'

/**
 * Sovereignty First scenario.
 *
 * Context: Regulated organisation prioritising data residency.
 * On-premise or sovereign cloud models preferred.
 * Starting: 120 developers. Flat headcount.
 *
 * Simulation start date: 2024-01-01
 * Duration: 24 months
 *
 * Events:
 *   Month 2:  Compliance mandate triggers migration away from cloud tools → MIGRATION_EVENT (priority 10)
 *   Month 5:  Headcount change — specialist security team added → HEADCOUNT_CHANGE (priority 5)
 *   Month 5:  Reduced adoption of cloud tool (Tool B) → ADOPTION_CHANGE (priority 15)
 *   Month 8:  Vendor price increase for Tool A → VENDOR_PRICE_CHANGE (priority 10)
 *   Month 11: Security audit remediation cost → SECURITY_REMEDIATION (priority 10)
 *   Month 15: New sovereign model reduces token costs → TOKENISATION_CHANGE (priority 10)
 *   Month 20: Operational overhead for on-premise infra → OPERATIONAL_COST_CHANGE (priority 10)
 */
export const sovereigntyFirstScenario: Scenario = {
  id: 'sovereignty-first',
  name: 'Sovereignty First',
  description:
    'A regulated organisation (financial services or government) prioritises data residency ' +
    'and sovereign AI models. External API token usage is restricted. ' +
    'The total cost includes compliance overhead, restricted tooling, and on-premise infrastructure.',
  simulationStartDate: '2024-01-01',
  durationMonths: 24,
  currency: 'USD',
  startingDeveloperCount: 120,
  developerGrowthRule: {
    type: 'flat',
  },
  toolConfigs: [
    {
      toolId: 'tool-a',
      pricingPlanId: 'plan-tool-a',
      initialAdoptionRate: 0.9,
      adoptionRule: {
        type: 'flat',
        targetRate: 0.9,
        rampMonths: 0,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 200_000,
        avgOutputTokensPerDevPerMonth: 50_000,
        agentCallsPerDevPerMonth: 0,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 0,
      },
    },
    {
      toolId: 'tool-b',
      pricingPlanId: 'plan-tool-b',
      initialAdoptionRate: 0.4,
      adoptionRule: {
        type: 'linear',
        targetRate: 0.3,
        rampMonths: 12,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 800_000,
        avgOutputTokensPerDevPerMonth: 200_000,
        agentCallsPerDevPerMonth: 0,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 0,
      },
    },
    {
      toolId: 'tool-c',
      pricingPlanId: 'plan-tool-c',
      initialAdoptionRate: 0.6,
      adoptionRule: {
        type: 'flat',
        targetRate: 0.6,
        rampMonths: 0,
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
      toolId: 'tool-d',
      pricingPlanId: 'plan-tool-d',
      initialAdoptionRate: 0.5,
      adoptionRule: {
        type: 'flat',
        targetRate: 0.5,
        rampMonths: 0,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 0,
        avgOutputTokensPerDevPerMonth: 0,
        agentCallsPerDevPerMonth: 0,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 8_000,
      },
    },
    {
      toolId: 'tool-e',
      pricingPlanId: 'plan-tool-e',
      initialAdoptionRate: 0.1,
      adoptionRule: {
        type: 'flat',
        targetRate: 0.1,
        rampMonths: 0,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 0,
        avgOutputTokensPerDevPerMonth: 0,
        agentCallsPerDevPerMonth: 50,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 0,
      },
    },
  ],
  events: [
    // Month 2: Compliance mandate triggers migration cost
    {
      id: 'sov-evt-1',
      scenarioId: 'sovereignty-first',
      effectiveMonth: 2,
      priority: 10,
      type: EventType.MIGRATION_EVENT,
      description: 'Compliance mandate requires migration of data pipelines — one-time cost $40,000',
      affectedToolIds: ['tool-b'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.MIGRATION_EVENT,
        cost: 40_000,
      },
    },
    // Month 5: Security team addition (headcount) — priority 5
    {
      id: 'sov-evt-2',
      scenarioId: 'sovereignty-first',
      effectiveMonth: 5,
      priority: 5,
      type: EventType.HEADCOUNT_CHANGE,
      description: 'Security compliance team of 20 developers added',
      affectedToolIds: [],
      affectedEntityType: EntityType.TEAM,
      payload: {
        type: EventType.HEADCOUNT_CHANGE,
        mode: 'delta',
        value: 20,
      },
    },
    // Month 5: Reduced cloud adoption due to compliance — priority 15 (runs after headcount)
    {
      id: 'sov-evt-3',
      scenarioId: 'sovereignty-first',
      effectiveMonth: 5,
      priority: 15,
      type: EventType.ADOPTION_CHANGE,
      description: 'Data residency policy restricts Tool B usage to 15% of developers',
      affectedToolIds: ['tool-b'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.ADOPTION_CHANGE,
        newRate: 0.15,
      },
    },
    // Month 8: Vendor price increase for Tool A
    {
      id: 'sov-evt-4',
      scenarioId: 'sovereignty-first',
      effectiveMonth: 8,
      priority: 10,
      type: EventType.VENDOR_PRICE_CHANGE,
      description: 'Tool A vendor price increase triggers cost review',
      affectedToolIds: ['tool-a'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.VENDOR_PRICE_CHANGE,
        newVersionId: 'plan-tool-a-v2',
      },
    },
    // Month 11: Security audit remediation
    {
      id: 'sov-evt-5',
      scenarioId: 'sovereignty-first',
      effectiveMonth: 11,
      priority: 10,
      type: EventType.SECURITY_REMEDIATION,
      description: 'Annual security audit — critical finding remediation costs $60,000',
      affectedToolIds: ['tool-a', 'tool-c'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.SECURITY_REMEDIATION,
        cost: 60_000,
      },
    },
    // Month 15: Sovereign model reduces token consumption needs
    {
      id: 'sov-evt-6',
      scenarioId: 'sovereignty-first',
      effectiveMonth: 15,
      priority: 10,
      type: EventType.TOKENISATION_CHANGE,
      description: 'Sovereign AI model deployment reduces Token B external usage by 50%',
      affectedToolIds: ['tool-b'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.TOKENISATION_CHANGE,
        newUsageProfile: {
          avgInputTokensPerDevPerMonth: 400_000,
          avgOutputTokensPerDevPerMonth: 100_000,
          agentCallsPerDevPerMonth: 0,
          storageGbPerDev: 0,
          apiCallsPerDevPerMonth: 0,
        },
      },
    },
    // Month 20: On-premise infrastructure recurring cost
    {
      id: 'sov-evt-7',
      scenarioId: 'sovereignty-first',
      effectiveMonth: 20,
      priority: 10,
      type: EventType.OPERATIONAL_COST_CHANGE,
      description: 'On-premise AI inference infrastructure adds $10,000/month operational cost',
      affectedToolIds: ['tool-c'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.OPERATIONAL_COST_CHANGE,
        recurring: true,
        costPerMonth: 10_000,
      },
    },
  ],
  riskAssumptions: {
    securityRiskLevel: 'high',
    migrationRiskLevel: 'medium',
    notes:
      'Regulatory compliance drives tool selection. Security risk high due to data sovereignty requirements.',
  },
}
