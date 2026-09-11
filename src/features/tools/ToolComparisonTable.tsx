import { useSimulation } from '../../hooks/useSimulation'
import { toolMap } from '../../data/index'
import { formatCurrency } from '../../utils/currency'

export function ToolComparisonTable() {
  const { finalSnapshot, currentSnapshot } = useSimulation()

  if (!finalSnapshot) return null

  const toolResults = [...finalSnapshot.perToolResults].sort(
    (a, b) => a.cumulativeCost - b.cumulativeCost
  )

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        24-Month Total Cost of Ownership
      </h3>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 text-xs font-semibold text-gray-600">Rank</th>
            <th className="text-left p-2 text-xs font-semibold text-gray-600">Tool</th>
            <th className="text-right p-2 text-xs font-semibold text-gray-600">24M Cumulative</th>
            <th className="text-right p-2 text-xs font-semibold text-gray-600">Final Monthly</th>
          </tr>
        </thead>
        <tbody>
          {toolResults.map((tr, i) => {
            const tool = toolMap[tr.toolId]
            return (
              <tr key={tr.toolId} className="border-t border-gray-100">
                <td className="p-2 text-xs text-gray-500">#{i + 1}</td>
                <td className="p-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tool?.color }}
                    />
                    <span className="text-sm font-medium">{tool?.label}</span>
                  </div>
                </td>
                <td className="p-2 text-right font-semibold tabular-nums text-sm">
                  {formatCurrency(tr.cumulativeCost)}
                </td>
                <td className="p-2 text-right text-xs tabular-nums text-gray-600">
                  {formatCurrency(tr.totalMonthlyCost)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
