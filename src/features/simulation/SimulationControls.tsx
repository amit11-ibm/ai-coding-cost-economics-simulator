import { useSimulation, useSimulationActions } from '../../hooks/useSimulation'

export function SimulationControls() {
  const { currentMonth, isPlaying, simulationRun } = useSimulation()
  const { play, pause, nextEvent, prevEvent, reset } = useSimulationActions()

  const hasEvents = simulationRun !== null

  // Check if there's a next event month
  const hasNextEvent = simulationRun
    ? simulationRun.snapshots.slice(currentMonth + 1).some((s) => s.appliedEvents.length > 0)
    : false

  // Check if there's a previous event month
  const hasPrevEvent = simulationRun
    ? simulationRun.snapshots.slice(0, currentMonth).some((s) => s.appliedEvents.length > 0)
    : false

  return (
    <div
      className="flex items-center justify-center flex-wrap gap-2 px-4 py-3 bg-white border-t border-gray-200"
      role="group"
      aria-label="Simulation playback controls"
    >
      {/* Previous Event */}
      <button
        onClick={prevEvent}
        disabled={!hasEvents || (!hasPrevEvent && currentMonth === 0)}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        aria-label="Go to previous event"
        title="Previous event"
      >
        ◀ Prev Event
      </button>

      {/* Play / Pause */}
      <button
        onClick={isPlaying ? pause : play}
        disabled={!hasEvents || currentMonth >= 24}
        className="px-4 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium min-w-[90px] justify-center"
        aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
      >
        {isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>

      {/* Next Event */}
      <button
        onClick={nextEvent}
        disabled={!hasEvents || !hasNextEvent}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        aria-label="Go to next event"
        title="Next event"
      >
        Next Event ▶
      </button>

      {/* Reset */}
      <button
        onClick={reset}
        disabled={!hasEvents || currentMonth === 0}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        aria-label="Reset simulation to Month 0"
        title="Reset to baseline"
      >
        ↺ Reset
      </button>
    </div>
  )
}
