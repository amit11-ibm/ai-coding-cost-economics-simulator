import { useSimulation } from '../../hooks/useSimulation'
import { toolMap } from '../../data/index'
import { formatCurrency } from '../../utils/currency'

export function MetricsBar() {
  const { currentMonth, currentSnapshot, simulationRun } = useSimulation()

  // Find cheapest tool at current month
  let cheapestToolId: string | null = null
  let cheapestCost = Infinity

  if (currentSnapshot && currentMonth > 0) {
    for (const toolResult of currentSnapshot.perToolResults) {
      if (toolResult.totalMonthlyCost < cheapestCost) {
        cheapestCost = toolResult.totalMonthlyCost
        cheapestToolId = toolResult.toolId
      }
    }
  }

  const cheapestTool = cheapestToolId ? toolMap[cheapestToolId] : null

  // Final month cumulative totals
  const finalSnapshot = simulationRun?.snapshots[24]

  return (
    <div
      className="flex items-center flex-wrap gap-x-3 gap-y-1 px-4 py-2 bg-white border-b border-gray-200"
      role="region"
      aria-label="Simulation metrics"
    >
      {/* Current Month */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500 text-xs">Month</span>
        <span
          className="font-bold text-base text-blue-700 tabular-nums"
          aria-live="polite"
          aria-label={`Current simulation month: ${currentMonth === 0 ? 'Baseline' : currentMonth}`}
        >
          {currentMonth === 0 ? 'Baseline' : `${currentMonth}/24`}
        </span>
      </div>

      {/* Events this month */}
      {currentSnapshot && currentSnapshot.appliedEvents.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-orange-500 text-xs">⚡</span>
          <span className="text-xs text-orange-700 font-medium">
            {currentSnapshot.appliedEvents.length} event{currentSnapshot.appliedEvents.length > 1 ? 's' : ''} this month
          </span>
        </div>
      )}

      {/* Cheapest tool */}
      {cheapestTool && currentMonth > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 text-xs hidden sm:inline">Cheapest</span>
          <span
            className="font-medium text-xs px-1.5 py-0.5 rounded"
            style={{
              color: cheapestTool.color,
              backgroundColor: `${cheapestTool.color}15`,
            }}
          >
            {cheapestTool.label}
          </span>
          <span className="text-xs font-medium">{formatCurrency(cheapestCost)}</span>
        </div>
      )}

      {/* Developer count */}
      {currentSnapshot && (
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-xs">Devs</span>
          <span className="font-medium text-xs">{currentSnapshot.developerCount}</span>
        </div>
      )}
    </div>
  )
}
