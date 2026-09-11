import type {
  ScenarioConfig,
  SimulationRun,
  SimulationState,
  SimulationStep,
  MonthlyResult,
  ToolMonthlyResult,
  ToolSimState,
  PricingInputs,
  PendingCosts,
  PricingPlan,
  PricingComponent,
  SimulationEvent,
} from '../domain/types'
import { toCalendarDate, findActivePricingVersion } from '../utils/dates'
import { computeAdoption } from './adoption'
import { computeDeveloperGrowth } from './population'
import { sortEvents, applyEvents } from './events'
import { calculateCost } from './pricing/index'
import { zeroCostBreakdown } from '../utils/explanation'

/**
 * Build the Month 0 baseline snapshot and initial SimulationState.
 * All costs are zero; no events are applied.
 */
function buildBaselineSnapshot(
  config: ScenarioConfig,
  pricingPlans: Readonly<Record<string, PricingPlan>>
): {
  snapshot: MonthlyResult
  state: SimulationState
} {
  const calendarDate = toCalendarDate(config.simulationStartDate, 0)

  const toolStates: Record<string, ToolSimState> = {}

  for (const toolConfig of config.toolConfigs) {
    const plan = pricingPlans[toolConfig.pricingPlanId]
    if (!plan) {
      throw new Error(`PricingPlan not found: ${toolConfig.pricingPlanId}`)
    }

    let activePricingVersionId: string
    try {
      const version = findActivePricingVersion(plan, calendarDate)
      activePricingVersionId = version.id
    } catch {
      activePricingVersionId = plan.versions[0]?.id ?? ''
    }

    toolStates[toolConfig.toolId] = {
      toolId: toolConfig.toolId,
      adoptionRate: toolConfig.initialAdoptionRate,
      adoptionOverridden: false,
      activePricingVersionId,
      pricingVersionOverridden: false,
      usageProfile: { ...toolConfig.usageProfile }, // copy; never mutate ToolConfig
      pendingMigrationCost: 0,
      pendingSecurityCost: 0,
      pendingOneTimeOperationalCost: 0,
      recurringOperationalCostPerMonth: 0,
    }
  }

  const state: SimulationState = {
    month: 0,
    developerCount: config.startingDeveloperCount,
    toolStates,
  }

  const perToolResults: ToolMonthlyResult[] = config.toolConfigs.map((toolConfig) => ({
    toolId: toolConfig.toolId,
    adoptionRate: toolConfig.initialAdoptionRate,
    activeUsers: Math.round(config.startingDeveloperCount * toolConfig.initialAdoptionRate),
    costBreakdown: zeroCostBreakdown(),
    totalMonthlyCost: 0,
    cumulativeCost: 0,
    explanation: [],
  }))

  const snapshot: MonthlyResult = {
    month: 0,
    developerCount: config.startingDeveloperCount,
    perToolResults,
    appliedEvents: [],
  }

  return { snapshot, state }
}

/**
 * simulateMonth — pure function; returns a SimulationStep.
 * Never mutates input state.
 */
export function simulateMonth(
  state: SimulationState,
  config: ScenarioConfig,
  month: number,
  prevCumulativeCosts: Readonly<Record<string, number>>,
  sortedEvents: readonly SimulationEvent[],
  pricingPlans: Readonly<Record<string, PricingPlan>>
): SimulationStep {
  const calendarDate = toCalendarDate(config.simulationStartDate, month)

  // 1. Apply developer growth
  const developerCount = computeDeveloperGrowth(
    config.developerGrowthRule,
    month,
    config.startingDeveloperCount
  )

  // 2. Apply events for this month
  const monthEvents = sortedEvents.filter((e) => e.effectiveMonth === month)
  const stateAfterEvents = applyEvents({ ...state, developerCount }, monthEvents)

  // 3. For each tool, resolve adoption, pricing version, compute costs
  const perToolResults: ToolMonthlyResult[] = []

  for (const toolConfig of config.toolConfigs) {
    const toolState = stateAfterEvents.toolStates[toolConfig.toolId]
    if (!toolState) continue

    const plan = pricingPlans[toolConfig.pricingPlanId]
    if (!plan) {
      throw new Error(`PricingPlan not found: ${toolConfig.pricingPlanId}`)
    }

    // 3a. Resolve pricing version → components
    let components: readonly PricingComponent[]
    if (toolState.pricingVersionOverridden) {
      const version = plan.versions.find((v) => v.id === toolState.activePricingVersionId)
      components = version ? version.components : plan.components
    } else {
      try {
        const version = findActivePricingVersion(plan, calendarDate)
        components = version.components
      } catch {
        components = plan.components
      }
    }

    // 3b. Resolve adoption
    let effectiveAdoptionRate: number
    if (toolState.adoptionOverridden) {
      effectiveAdoptionRate = toolState.adoptionRate
    } else {
      effectiveAdoptionRate = computeAdoption(toolConfig.adoptionRule, month)
    }

    const activeUsers = Math.round(developerCount * effectiveAdoptionRate)

    // 3c. Build pricing inputs from toolState.usageProfile (not ToolConfig directly)
    const pricingInputs: PricingInputs = {
      activeUsers,
      monthlyInputTokensPerUser: toolState.usageProfile.avgInputTokensPerDevPerMonth,
      monthlyOutputTokensPerUser: toolState.usageProfile.avgOutputTokensPerDevPerMonth,
      agentCallsPerUser: toolState.usageProfile.agentCallsPerDevPerMonth,
      apiCallsPerUser: toolState.usageProfile.apiCallsPerDevPerMonth,
      storageGbPerUser: toolState.usageProfile.storageGbPerDev,
      simulationMonth: month,
      calendarDate,
    }

    // 3d. Build pending costs
    const pendingCosts: PendingCosts = {
      migrationCost: toolState.pendingMigrationCost,
      securityRemediationCost: toolState.pendingSecurityCost,
      operationalCost:
        toolState.pendingOneTimeOperationalCost + toolState.recurringOperationalCostPerMonth,
    }

    // 3e. Calculate costs
    const { breakdown, explanation } = calculateCost(components, pricingInputs, pendingCosts)

    const prevCumulative = prevCumulativeCosts[toolConfig.toolId] ?? 0
    const cumulativeCost = prevCumulative + breakdown.total

    perToolResults.push({
      toolId: toolConfig.toolId,
      adoptionRate: effectiveAdoptionRate,
      activeUsers,
      costBreakdown: breakdown,
      totalMonthlyCost: breakdown.total,
      cumulativeCost,
      explanation,
    })
  }

  const result: MonthlyResult = {
    month,
    developerCount,
    perToolResults,
    appliedEvents: monthEvents,
  }

  // 4. Produce nextState: reset one-time pending costs to 0
  const nextToolStates: Record<string, ToolSimState> = {}
  for (const toolId of Object.keys(stateAfterEvents.toolStates)) {
    const ts = stateAfterEvents.toolStates[toolId]
    nextToolStates[toolId] = {
      ...ts,
      pendingMigrationCost: 0,
      pendingSecurityCost: 0,
      pendingOneTimeOperationalCost: 0,
      // recurringOperationalCostPerMonth is carried forward unchanged
    }
  }

  const nextState: SimulationState = {
    ...stateAfterEvents,
    month,
    toolStates: nextToolStates,
  }

  return { result, nextState }
}

/**
 * runSimulation — primary API. Pure function, no side effects.
 * Returns a SimulationRun with exactly 25 snapshots (indices 0–24).
 *
 * @param config  The scenario configuration
 * @param pricingPlans  Map of pricingPlanId → PricingPlan (from data layer)
 */
export function runSimulation(
  config: ScenarioConfig,
  pricingPlans: Readonly<Record<string, PricingPlan>>
): SimulationRun {
  const { snapshot: baselineSnapshot, state: initialState } = buildBaselineSnapshot(
    config,
    pricingPlans
  )

  const snapshots: MonthlyResult[] = [baselineSnapshot]
  const sortedEvents = sortEvents(config.events)

  let currentState = initialState
  const cumulativeCosts: Record<string, number> = {}
  for (const toolConfig of config.toolConfigs) {
    cumulativeCosts[toolConfig.toolId] = 0
  }

  for (let month = 1; month <= 24; month++) {
    const step = simulateMonth(
      currentState,
      config,
      month,
      cumulativeCosts,
      sortedEvents,
      pricingPlans
    )

    for (const toolResult of step.result.perToolResults) {
      cumulativeCosts[toolResult.toolId] = toolResult.cumulativeCost
    }

    snapshots.push(step.result)
    currentState = step.nextState
  }

  return {
    id: `run-${config.id}-${Date.now()}`,
    scenarioId: config.id,
    runAt: new Date().toISOString(),
    snapshots,
  }
}
