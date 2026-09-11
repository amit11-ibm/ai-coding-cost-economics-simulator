/**
 * Data layer index — exports all static data and registries.
 * Import from here in the state and UI layers.
 */

export { vendors, vendorMap } from './vendors'
export { products, productMap } from './products'
export { tools, toolMap } from './tools'
export { pricingPlans, pricingPlanMap, getPricingPlanById } from './pricing-plans'
export { modernisationScenario } from './scenarios/modernisation'
export { agenticShiftScenario } from './scenarios/agentic-shift'
export { sovereigntyFirstScenario } from './scenarios/sovereignty-first'

import { modernisationScenario } from './scenarios/modernisation'
import { agenticShiftScenario } from './scenarios/agentic-shift'
import { sovereigntyFirstScenario } from './scenarios/sovereignty-first'
import type { Scenario } from '../domain/types'

export const scenarios: readonly Scenario[] = [
  modernisationScenario,
  agenticShiftScenario,
  sovereigntyFirstScenario,
]

export const scenarioMap: Readonly<Record<string, Scenario>> = Object.fromEntries(
  scenarios.map((s) => [s.id, s])
)

export function getScenarioById(id: string): Scenario {
  const scenario = scenarioMap[id]
  if (!scenario) throw new Error(`Scenario not found: ${id}`)
  return scenario
}
