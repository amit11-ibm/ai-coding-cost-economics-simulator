import { describe, it, expect } from 'vitest'
import { runSimulation } from '../../src/engine/simulation'
import { modernisationScenario } from '../../src/data/scenarios/modernisation'
import { agenticShiftScenario } from '../../src/data/scenarios/agentic-shift'
import { sovereigntyFirstScenario } from '../../src/data/scenarios/sovereignty-first'
import { pricingPlanMap } from '../../src/data/pricing-plans'
import type { Scenario } from '../../src/domain/types'

const ALL_SCENARIOS: Scenario[] = [
  modernisationScenario,
  agenticShiftScenario,
  sovereigntyFirstScenario,
]

describe('Full Run Integration', () => {
  for (const scenario of ALL_SCENARIOS) {
    describe(`Scenario: ${scenario.name}`, () => {
      it('produces exactly 25 snapshots', () => {
        const run = runSimulation(scenario, pricingPlanMap)
        expect(run.snapshots).toHaveLength(25)
      })

      it('snapshot 0 month is 0 and snapshot 24 month is 24', () => {
        const run = runSimulation(scenario, pricingPlanMap)
        expect(run.snapshots[0].month).toBe(0)
        expect(run.snapshots[24].month).toBe(24)
      })

      it('month 24 costs are non-zero for all tools', () => {
        const run = runSimulation(scenario, pricingPlanMap)
        for (const toolResult of run.snapshots[24].perToolResults) {
          expect(toolResult.cumulativeCost).toBeGreaterThan(0)
        }
      })

      it('is deterministic: two consecutive runs produce identical JSON', () => {
        const run1 = runSimulation(scenario, pricingPlanMap)
        const run2 = runSimulation(scenario, pricingPlanMap)
        expect(JSON.stringify(run1.snapshots)).toBe(JSON.stringify(run2.snapshots))
      })

      it('migration and security one-time costs do not recur', () => {
        const run = runSimulation(scenario, pricingPlanMap)
        // Find months with migration events
        const migrationEventMonths = scenario.events
          .filter((e) => e.type === 'MIGRATION_EVENT')
          .map((e) => e.effectiveMonth)

        for (const eventMonth of migrationEventMonths) {
          // Check that migration cost is only in the event month
          for (let m = eventMonth + 1; m <= 24; m++) {
            for (const toolResult of run.snapshots[m].perToolResults) {
              // Migration cost should not recur in subsequent months
              // (note: could be 0 even in non-event months, that's fine)
              // We just verify it's zero unless another migration event fires
              const hasMigrationEventThisMonth = scenario.events.some(
                (e) => e.type === 'MIGRATION_EVENT' && e.effectiveMonth === m && e.affectedToolIds.includes(toolResult.toolId)
              )
              if (!hasMigrationEventThisMonth) {
                expect(toolResult.costBreakdown.migrationCost).toBe(0)
              }
            }
          }
        }
      })
    })
  }
})
