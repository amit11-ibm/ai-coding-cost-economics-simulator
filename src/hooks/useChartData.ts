import { useMemo } from 'react'
import { useSimulationStore } from '../state/simulationStore'
import { useUIStore } from '../state/uiStore'
import type { ChartDataPoint } from '../domain/types'
import { toolMap } from '../data/index'

/**
 * useChartData — derives chart-ready data from the simulation snapshots.
 *
 * Returns 25 ChartDataPoints (months 0–24).
 * Month 0 always has value 0 for every tool (baseline, no billing).
 *
 * In monthly mode: value = totalMonthlyCost for each tool
 * In cumulative mode: value = cumulativeCost for each tool
 */
export function useChartData(): ChartDataPoint[] {
  const simulationRun = useSimulationStore((s) => s.simulationRun)
  const chartMode = useUIStore((s) => s.chartMode)
  const visibleToolIds = useUIStore((s) => s.visibleToolIds)

  return useMemo(() => {
    if (!simulationRun) return []

    return simulationRun.snapshots.map((snapshot) => {
      const point: Record<string, number | boolean | string | readonly string[]> = {
        month: snapshot.month,
        hasEvent: snapshot.appliedEvents.length > 0,
        eventLabels: snapshot.appliedEvents.map((e) => e.description),
      }

      for (const toolResult of snapshot.perToolResults) {
        if (!visibleToolIds.includes(toolResult.toolId)) continue

        if (snapshot.month === 0) {
          // Month 0 baseline: always 0
          point[toolResult.toolId] = 0
        } else if (chartMode === 'monthly') {
          point[toolResult.toolId] = toolResult.totalMonthlyCost
        } else {
          point[toolResult.toolId] = toolResult.cumulativeCost
        }
      }

      return point as ChartDataPoint
    })
  }, [simulationRun, chartMode, visibleToolIds])
}

/**
 * useToolColors — returns a map of toolId → color for chart series.
 */
export function useToolColors(): Record<string, string> {
  return useMemo(() => {
    const colors: Record<string, string> = {}
    for (const tool of Object.values(toolMap)) {
      colors[tool.id] = tool.color
    }
    return colors
  }, [])
}
