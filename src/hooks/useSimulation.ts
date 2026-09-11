import { useSimulationStore } from '../state/simulationStore'
import { useUIStore } from '../state/uiStore'
import type { MonthlyResult, SimulationRun } from '../domain/types'

/**
 * useSimulation — convenience hook for reading simulation state.
 */
export function useSimulation() {
  const simulationRun = useSimulationStore((s) => s.simulationRun)
  const currentMonth = useSimulationStore((s) => s.currentMonth)
  const activeScenarioId = useSimulationStore((s) => s.activeScenarioId)
  const isPlaying = useSimulationStore((s) => s.isPlaying)
  const playbackIntervalMs = useSimulationStore((s) => s.playbackIntervalMs)

  const currentSnapshot: MonthlyResult | null =
    simulationRun?.snapshots[currentMonth] ?? null

  const finalSnapshot: MonthlyResult | null =
    simulationRun?.snapshots[24] ?? null

  return {
    simulationRun,
    currentMonth,
    activeScenarioId,
    isPlaying,
    playbackIntervalMs,
    currentSnapshot,
    finalSnapshot,
  }
}

/**
 * useSimulationActions — convenience hook for dispatching actions.
 */
export function useSimulationActions() {
  return {
    loadScenario: useSimulationStore((s) => s.loadScenario),
    advance: useSimulationStore((s) => s.advance),
    retreat: useSimulationStore((s) => s.retreat),
    nextEvent: useSimulationStore((s) => s.nextEvent),
    prevEvent: useSimulationStore((s) => s.prevEvent),
    reset: useSimulationStore((s) => s.reset),
    play: useSimulationStore((s) => s.play),
    pause: useSimulationStore((s) => s.pause),
  }
}
