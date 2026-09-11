import { CostChart } from '../features/charts/CostChart'
import { SimulationControls } from '../features/simulation/SimulationControls'
import { MetricsBar } from '../features/simulation/MetricsBar'
import { DetailPanel } from '../features/simulation/DetailPanel'
import { ToolComparisonTable } from '../features/tools/ToolComparisonTable'
import { OutcomePanel } from '../features/outcomes/OutcomePanel'
import { ScenarioNav } from '../features/scenarios/ScenarioNav'
import { useSimulationStore } from '../state/simulationStore'
import { useEffect } from 'react'

function SimulatorWorkspace() {
  return (
    <div className="flex flex-col">
      {/* Metrics bar */}
      <MetricsBar />

      {/* Main content: chart + detail panel — side-by-side on lg+, stacked below */}
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        {/* Cost chart — takes remaining width on lg, full width below */}
        <div className="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
          <CostChart />
        </div>

        {/* Detail panel — full width below lg, fixed 300px sidebar on lg+ */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0">
          <DetailPanel />
        </div>
      </div>

      {/* Simulation controls */}
      <SimulationControls />

      {/* TCO comparison table */}
      <div className="border-t border-gray-200 bg-white p-4">
        <ToolComparisonTable />
      </div>
    </div>
  )
}

export function App() {
  const loadScenario = useSimulationStore((s) => s.loadScenario)
  const simulationRun = useSimulationStore((s) => s.simulationRun)
  const activeScenarioId = useSimulationStore((s) => s.activeScenarioId)

  // Load default scenario on first render if not already loaded
  useEffect(() => {
    if (!simulationRun) {
      loadScenario(activeScenarioId)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs shrink-0">
            $
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 leading-tight truncate">
              AI Coding Cost Economics Simulator
            </h1>
            <p className="text-xs text-gray-400 leading-tight hidden sm:block">
              24-month TCO — fictional pricing for demonstration
            </p>
          </div>
        </div>
      </header>

      {/* Scenario navigation with workspace — natural scroll */}
      <div className="flex-1 flex flex-col">
        <ScenarioNav>
          <SimulatorWorkspace />
        </ScenarioNav>
      </div>
    </div>
  )
}
