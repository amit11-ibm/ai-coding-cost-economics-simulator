import { useSimulationStore } from '../../state/simulationStore'
import { useUIStore } from '../../state/uiStore'
import { scenarioMap, toolMap } from '../../data/index'
import { formatCurrency } from '../../utils/currency'

export function EventDetail() {
  const selectedEventId = useUIStore((s) => s.selectedEventId)
  const simulationRun = useSimulationStore((s) => s.simulationRun)
  const activeScenarioId = useSimulationStore((s) => s.activeScenarioId)

  const scenario = scenarioMap[activeScenarioId]
  const event = scenario?.events.find((e) => e.id === selectedEventId)

  if (!event) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        Select an event from the timeline to see details.
      </div>
    )
  }

  const snapshot = simulationRun?.snapshots[event.effectiveMonth]
  const hasApplied = snapshot?.appliedEvents.some((e) => e.id === event.id)

  return (
    <div className="p-4 space-y-3 text-sm">
      <div className="flex items-start gap-2">
        <span className="shrink-0 inline-flex items-center justify-center w-8 h-6 rounded bg-orange-100 text-orange-700 font-bold text-xs">
          M{event.effectiveMonth}
        </span>
        <div>
          <div className="font-semibold text-gray-900">{event.description}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Type: {event.type} · Priority: {event.priority}
          </div>
        </div>
      </div>

      {/* Applied status */}
      <div className={[
        'text-xs font-medium px-2 py-1 rounded inline-block',
        hasApplied
          ? 'bg-green-50 text-green-700'
          : 'bg-gray-50 text-gray-500'
      ].join(' ')}>
        {hasApplied ? '✓ Applied' : '⏳ Pending'}
      </div>

      {/* Affected tools */}
      {event.affectedToolIds.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Affected tools</div>
          <div className="flex gap-1 flex-wrap">
            {event.affectedToolIds.map((toolId) => {
              const tool = toolMap[toolId]
              return (
                <span
                  key={toolId}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    color: tool?.color ?? '#888',
                    backgroundColor: `${tool?.color ?? '#888'}15`,
                  }}
                >
                  {tool?.label ?? toolId}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Economic impact in the affected month */}
      {hasApplied && snapshot && (
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">
            Economic impact at Month {event.effectiveMonth}
          </div>
          <div className="space-y-1">
            {event.affectedToolIds.map((toolId) => {
              const toolResult = snapshot.perToolResults.find((r) => r.toolId === toolId)
              const tool = toolMap[toolId]
              if (!toolResult) return null
              return (
                <div key={toolId} className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tool?.color }}
                    />
                    {tool?.label}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatCurrency(toolResult.totalMonthlyCost)}/mo
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
