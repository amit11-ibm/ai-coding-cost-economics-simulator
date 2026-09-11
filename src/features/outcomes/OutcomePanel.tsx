import { useOutcome } from '../../hooks/useOutcome'
import { formatCurrency } from '../../utils/currency'

export function OutcomePanel() {
  const { isAtMonth24, toolResults, cheapestTool, mostExpensiveTool, totalCostAcrossAllTools } =
    useOutcome()

  if (!isAtMonth24) {
    return (
      <div className="p-4 text-sm text-center text-gray-400">
        Advance to Month 24 to see the full outcome summary.
      </div>
    )
  }

  if (!cheapestTool) return null

  const savingsVsExpensive = mostExpensiveTool
    ? mostExpensiveTool.cumulativeCost - cheapestTool.cumulativeCost
    : 0

  return (
    <div className="p-4 space-y-4 text-sm">
      <div>
        <h3 className="font-semibold text-gray-900 text-base">24-Month Outcome Summary</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Final simulation complete. All figures are fictional.
        </p>
      </div>

      {/* Recommendation */}
      <div className="bg-green-50 border border-green-200 rounded p-3">
        <div className="text-xs font-semibold text-green-800 mb-1">Lowest TCO</div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: cheapestTool.color }}
          />
          <span className="font-bold text-green-900">{cheapestTool.label}</span>
          <span className="font-semibold text-green-800">
            {cheapestTool.formattedCost}
          </span>
        </div>
        {mostExpensiveTool && savingsVsExpensive > 0 && (
          <div className="text-xs text-green-700 mt-1">
            Saves {formatCurrency(savingsVsExpensive)} vs {mostExpensiveTool.label} over 24 months
          </div>
        )}
      </div>

      {/* Ranked results */}
      <div>
        <div className="text-xs font-semibold text-gray-700 mb-1.5">
          Cost Ranking (24-month cumulative)
        </div>
        <div className="space-y-1.5">
          {toolResults.map((tr) => (
            <div key={tr.toolId} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-5 text-center">#{tr.rank}</span>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: tr.color }}
              />
              <span className="flex-1 text-sm font-medium">{tr.label}</span>
              <span className="tabular-nums text-sm font-semibold">{tr.formattedCost}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key insights */}
      <div className="bg-gray-50 rounded p-3 space-y-1.5 text-xs text-gray-600">
        <div className="font-semibold text-gray-700">Key Drivers</div>
        <div>• Seat costs provide cost predictability; token costs scale with usage</div>
        <div>• One-time migration and security costs have outsized impact on final TCO</div>
        <div>• Recurring operational costs compound significantly over 24 months</div>
        <div>• Adoption rate changes from events can dramatically shift cost trajectory</div>
      </div>
    </div>
  )
}
