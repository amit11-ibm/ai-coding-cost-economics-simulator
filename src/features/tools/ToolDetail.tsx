import { useSimulation } from '../../hooks/useSimulation'
import { useUIStore } from '../../state/uiStore'
import { toolMap } from '../../data/index'
import { formatCurrency, formatCurrencyPrecise } from '../../utils/currency'

export function ToolDetail() {
  const selectedToolId = useUIStore((s) => s.selectedToolId)
  const { currentSnapshot, currentMonth } = useSimulation()

  if (!selectedToolId) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        Select a tool from the chart legend to see details.
      </div>
    )
  }

  const tool = toolMap[selectedToolId]
  const toolResult = currentSnapshot?.perToolResults.find(
    (r) => r.toolId === selectedToolId
  )

  if (!tool || !toolResult) {
    return <div className="p-4 text-sm text-gray-500">Tool data not available.</div>
  }

  const isBaseline = currentMonth === 0
  const { costBreakdown } = toolResult

  const components = [
    { label: 'Seat', value: costBreakdown.seatCost },
    { label: 'Token', value: costBreakdown.tokenCost },
    { label: 'Usage (API)', value: costBreakdown.usageCost },
    { label: 'Agent calls', value: costBreakdown.agentCost },
    { label: 'Model provider', value: costBreakdown.modelProviderCost },
    { label: 'Migration', value: costBreakdown.migrationCost },
    { label: 'Security remediation', value: costBreakdown.securityRemediationCost },
    { label: 'Operational', value: costBreakdown.operationalCost },
  ].filter((c) => c.value > 0)

  return (
    <div className="p-4 space-y-4 text-sm">
      {/* Tool header */}
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: tool.color }}
        />
        <span className="font-semibold text-base">{tool.label}</span>
      </div>

      {/* Month label */}
      <div className="text-xs text-gray-500">
        {isBaseline ? 'Month 0 — Baseline (no billing)' : `Month ${currentMonth}`}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500">Monthly cost</div>
          <div className="font-bold text-base">
            {isBaseline ? '$0' : formatCurrency(toolResult.totalMonthlyCost)}
          </div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500">Cumulative</div>
          <div className="font-bold text-base">
            {formatCurrency(toolResult.cumulativeCost)}
          </div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500">Active users</div>
          <div className="font-semibold">{toolResult.activeUsers}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500">Adoption rate</div>
          <div className="font-semibold">
            {Math.round(toolResult.adoptionRate * 100)}%
          </div>
        </div>
      </div>

      {/* Cost breakdown */}
      {!isBaseline && components.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-700 mb-1.5">Cost Breakdown</div>
          <div className="space-y-1">
            {components.map((c) => (
              <div key={c.label} className="flex justify-between text-xs">
                <span className="text-gray-600">{c.label}</span>
                <span className="font-medium tabular-nums">
                  {formatCurrencyPrecise(c.value)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-semibold border-t border-gray-200 pt-1 mt-1">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(costBreakdown.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Explanation */}
      {!isBaseline && toolResult.explanation.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-700 mb-1.5">Calculation Detail</div>
          <div className="space-y-1 text-xs text-gray-500">
            {toolResult.explanation.map((exp, i) => (
              <div key={i} className="bg-gray-50 rounded p-1.5">
                <div className="font-medium text-gray-700">{exp.component}</div>
                <div className="font-mono text-xs mt-0.5 break-all">{exp.formula}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
