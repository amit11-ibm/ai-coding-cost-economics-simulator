import { useSimulationStore } from '../../state/simulationStore'
import { useUIStore } from '../../state/uiStore'
import { scenarioMap, toolMap } from '../../data/index'
import { formatCurrency } from '../../utils/currency'

export function ScenarioOverview() {
  const activeScenarioId = useSimulationStore((s) => s.activeScenarioId)
  const simulationRun = useSimulationStore((s) => s.simulationRun)
  const selectEvent = useUIStore((s) => s.selectEvent)

  const scenario = scenarioMap[activeScenarioId]
  if (!scenario) return null

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{scenario.name}</h2>
        <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500">Starting developers</div>
          <div className="font-semibold">{scenario.startingDeveloperCount}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500">Duration</div>
          <div className="font-semibold">{scenario.durationMonths} months</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500">Tools compared</div>
          <div className="font-semibold">{scenario.toolConfigs.length}</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Economic Events Timeline
        </h3>
        <div className="space-y-1.5">
          {scenario.events.map((event) => {
            const hasApplied =
              simulationRun &&
              simulationRun.snapshots[event.effectiveMonth]?.appliedEvents.some(
                (e) => e.id === event.id
              )

            return (
              <button
                key={event.id}
                onClick={() => selectEvent(event.id)}
                className="w-full text-left flex items-start gap-2 p-2 rounded text-xs hover:bg-gray-50 transition-colors"
              >
                <span className="shrink-0 inline-flex items-center justify-center w-6 h-5 rounded bg-gray-200 text-gray-700 font-medium text-xs">
                  M{event.effectiveMonth}
                </span>
                <span className={hasApplied ? 'text-gray-900' : 'text-gray-500'}>
                  {event.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Tool Configurations</h3>
        <div className="space-y-1.5">
          {scenario.toolConfigs.map((tc) => {
            const tool = toolMap[tc.toolId]
            return (
              <div key={tc.toolId} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tool?.color }}
                />
                <span className="font-medium">{tool?.label}</span>
                <span className="text-gray-500">
                  {Math.round(tc.initialAdoptionRate * 100)}% initial adoption
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
