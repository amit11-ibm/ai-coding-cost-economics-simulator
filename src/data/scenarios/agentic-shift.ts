import type { Scenario } from '../../domain/types'
import { EventType, EntityType } from '../../domain/types'

/**
 * The Agentic Shift scenario.
 *
 * Context: Organisation rapidly adopts autonomous AI agents.
 * Token and agent costs dominate. Fast-moving environment.
 * Starting: 80 developers. Growing steadily.
 *
 * Simulation start date: 2024-01-01
 * Duration: 24 months
 *
 * Events:
 *   Month 2:  Agentic platform pricing change → AGENT_PRICING_CHANGE (priority 10)
 *   Month 4:  Usage pattern shift: agents make more calls → TOKENISATION_CHANGE (priority 10)
 *   Month 6:  Headcount growth → HEADCOUNT_CHANGE (priority 5)
 *   Month 8:  Tool B model upgrade (cheaper) → VENDOR_PRICE_CHANGE (priority 10)
 *   Month 10: Security compliance audit → SECURITY_REMEDIATION (priority 10)
 *   Month 14: Operational infrastructure cost added → OPERATIONAL_COST_CHANGE (priority 10)
 *   Month 18: Adoption boost for Tool E → ADOPTION_CHANGE (priority 10)
 */
export const agenticShiftScenario: Scenario = {
  id: 'agentic-shift',
  name: 'The Agentic Shift',
  description:
    'An organisation rapidly adopts autonomous AI agents for end-to-end development tasks. ' +
    'Token consumption and agent invocation costs dominate. ' +
    'Understanding burn rate under high-velocity AI usage is critical.',
  simulationStartDate: '2024-01-01',
  durationMonths: 24,
  currency: 'USD',
  startingDeveloperCount: 80,
  developerGrowthRule: {
    type: 'linear',
    monthlyDelta: 3,
  },
  toolConfigs: [
    {
      toolId: 'tool-a',
      pricingPlanId: 'plan-tool-a',
      initialAdoptionRate: 0.5,
      adoptionRule: {
        type: 'linear',
        targetRate: 0.7,
        rampMonths: 12,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 300_000,
        avgOutputTokensPerDevPerMonth: 60_000,
        agentCallsPerDevPerMonth: 0,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 0,
      },
    },
    {
      toolId: 'tool-b',
      pricingPlanId: 'plan-tool-b',
      initialAdoptionRate: 0.6,
      adoptionRule: {
        type: 'linear',
        targetRate: 0.9,
        rampMonths: 12,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 5_000_000,
        avgOutputTokensPerDevPerMonth: 1_000_000,
        agentCallsPerDevPerMonth: 0,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 0,
      },
    },
    {
      toolId: 'tool-c',
      pricingPlanId: 'plan-tool-c',
      initialAdoptionRate: 0.4,
      adoptionRule: {
        type: 'linear',
        targetRate: 0.7,
        rampMonths: 12,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 2_000_000,
        avgOutputTokensPerDevPerMonth: 500_000,
        agentCallsPerDevPerMonth: 0,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 0,
      },
    },
    {
      toolId: 'tool-d',
      pricingPlanId: 'plan-tool-d',
      initialAdoptionRate: 0.3,
      adoptionRule: {
        type: 'linear',
        targetRate: 0.5,
        rampMonths: 12,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 0,
        avgOutputTokensPerDevPerMonth: 0,
        agentCallsPerDevPerMonth: 0,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 20_000,
      },
    },
    {
      toolId: 'tool-e',
      pricingPlanId: 'plan-tool-e',
      initialAdoptionRate: 0.4,
      adoptionRule: {
        type: 'linear',
        targetRate: 0.85,
        rampMonths: 12,
      },
      usageProfile: {
        avgInputTokensPerDevPerMonth: 0,
        avgOutputTokensPerDevPerMonth: 0,
        agentCallsPerDevPerMonth: 300,
        storageGbPerDev: 0,
        apiCallsPerDevPerMonth: 0,
      },
    },
  ],
  events: [
    // Month 2: Agent pricing change for Tool E
    {
      id: 'agt-evt-1',
      scenarioId: 'agentic-shift',
      effectiveMonth: 2,
      priority: 10,
      type: EventType.AGENT_PRICING_CHANGE,
      description: 'Epsilon Agents introduces new pricing tier with higher agent call rates',
      affectedToolIds: ['tool-e'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.AGENT_PRICING_CHANGE,
        newVersionId: 'plan-tool-e-v2',
      },
    },
    // Month 4: Usage profile shift — more tokens due to agentic patterns
    {
      id: 'agt-evt-2',
      scenarioId: 'agentic-shift',
      effectiveMonth: 4,
      priority: 10,
      type: EventType.TOKENISATION_CHANGE,
      description: 'Agentic workflows drive 2x token consumption for Tool B',
      affectedToolIds: ['tool-b'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.TOKENISATION_CHANGE,
        newUsageProfile: {
          avgInputTokensPerDevPerMonth: 10_000_000,
          avgOutputTokensPerDevPerMonth: 2_000_000,
          agentCallsPerDevPerMonth: 0,
          storageGbPerDev: 0,
          apiCallsPerDevPerMonth: 0,
        },
      },
    },
    // Month 6: Headcount growth (priority 5) + adoption boost for Tool E (priority 10)
    {
      id: 'agt-evt-3',
      scenarioId: 'agentic-shift',
      effectiveMonth: 6,
      priority: 5,
      type: EventType.HEADCOUNT_CHANGE,
      description: 'Team expands to 150 developers as agentic initiatives scale',
      affectedToolIds: [],
      affectedEntityType: EntityType.TEAM,
      payload: {
        type: EventType.HEADCOUNT_CHANGE,
        mode: 'absolute',
        value: 150,
      },
    },
    // Month 8: Tool B token cost reduction
    {
      id: 'agt-evt-4',
      scenarioId: 'agentic-shift',
      effectiveMonth: 8,
      priority: 10,
      type: EventType.VENDOR_PRICE_CHANGE,
      description: 'New BetaInfer model reduces token costs by 40%',
      affectedToolIds: ['tool-b'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.VENDOR_PRICE_CHANGE,
        newVersionId: 'plan-tool-b-v2',
      },
    },
    // Month 10: Security audit
    {
      id: 'agt-evt-5',
      scenarioId: 'agentic-shift',
      effectiveMonth: 10,
      priority: 10,
      type: EventType.SECURITY_REMEDIATION,
      description: 'Security compliance audit for agentic workflows — remediation cost $75,000',
      affectedToolIds: ['tool-b', 'tool-e'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.SECURITY_REMEDIATION,
        cost: 75_000,
      },
    },
    // Month 14: Recurring operational cost for infrastructure
    {
      id: 'agt-evt-6',
      scenarioId: 'agentic-shift',
      effectiveMonth: 14,
      priority: 10,
      type: EventType.OPERATIONAL_COST_CHANGE,
      description: 'Agent orchestration infrastructure adds $8,000/month to Tool E',
      affectedToolIds: ['tool-e'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.OPERATIONAL_COST_CHANGE,
        recurring: true,
        costPerMonth: 8_000,
      },
    },
    // Month 18: Adoption boost for Tool E
    {
      id: 'agt-evt-7',
      scenarioId: 'agentic-shift',
      effectiveMonth: 18,
      priority: 10,
      type: EventType.ADOPTION_CHANGE,
      description: 'Company mandates Tool E usage — adoption jumps to 95%',
      affectedToolIds: ['tool-e'],
      affectedEntityType: EntityType.TOOL,
      payload: {
        type: EventType.ADOPTION_CHANGE,
        newRate: 0.95,
      },
    },
  ],
  riskAssumptions: {
    securityRiskLevel: 'high',
    migrationRiskLevel: 'low',
    notes:
      'High token consumption creates cost unpredictability. Agentic workflows create new attack surfaces.',
  },
}
