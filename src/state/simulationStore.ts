import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { runSimulation } from '../engine/simulation'
import { getScenarioById, pricingPlanMap as basePricingPlanMap } from '../data/index'
import type { PricingPlan, SimulationRun } from '../domain/types'
import { applyOverrides, usePricingStore } from './pricingStore'

/** Build a pricingPlanMap with user overrides merged in. */
function buildPlanMap(
  overrides: Record<string, { unitCost?: number; includedUnits?: number }>
): Readonly<Record<string, PricingPlan>> {
  return Object.fromEntries(
    Object.entries(basePricingPlanMap).map(([id, plan]) => [
      id,
      applyOverrides(plan, overrides),
    ])
  )
}

interface SimulationStoreState {
  // Data
  activeScenarioId: string
  simulationRun: SimulationRun | null
  currentMonth: number // 0–24

  // Playback
  isPlaying: boolean
  playbackIntervalMs: number
  _intervalId: ReturnType<typeof setInterval> | null

  // Actions
  loadScenario: (scenarioId: string) => void
  rerunSimulation: () => void
  advance: () => void
  retreat: () => void
  nextEvent: () => void
  prevEvent: () => void
  reset: () => void
  play: () => void
  pause: () => void
  setPlaybackInterval: (ms: number) => void
}

export const useSimulationStore = create<SimulationStoreState>()(
  persist(
    (set, get) => ({
      activeScenarioId: 'modernisation',
      simulationRun: null,
      currentMonth: 0,
      isPlaying: false,
      playbackIntervalMs: 800,
      _intervalId: null,

      loadScenario: (scenarioId: string) => {
        const scenario = getScenarioById(scenarioId)
        const overrides = usePricingStore.getState().overrides
        const simulationRun = runSimulation(scenario, buildPlanMap(overrides))

        if (simulationRun.snapshots.length !== 25) {
          throw new Error(
            `Expected 25 snapshots, got ${simulationRun.snapshots.length}`
          )
        }

        // Clear any active playback
        const { _intervalId } = get()
        if (_intervalId !== null) {
          clearInterval(_intervalId)
        }

        set({
          activeScenarioId: scenarioId,
          simulationRun,
          currentMonth: 0,
          isPlaying: false,
          _intervalId: null,
        })
      },

      rerunSimulation: () => {
        const { activeScenarioId, _intervalId } = get()
        const scenario = getScenarioById(activeScenarioId)
        const overrides = usePricingStore.getState().overrides
        const simulationRun = runSimulation(scenario, buildPlanMap(overrides))
        if (_intervalId !== null) clearInterval(_intervalId)
        set({ simulationRun, isPlaying: false, _intervalId: null })
      },

      advance: () => {
        const { currentMonth, simulationRun, pause } = get()
        if (currentMonth >= 24) {
          pause()
          return
        }
        set({ currentMonth: currentMonth + 1 })
        if (currentMonth + 1 >= 24) {
          pause()
        }
        void simulationRun // suppress unused warning
      },

      retreat: () => {
        const { currentMonth } = get()
        if (currentMonth > 0) {
          set({ currentMonth: currentMonth - 1 })
        }
      },

      nextEvent: () => {
        const { simulationRun, currentMonth } = get()
        if (!simulationRun) return

        const nextEventMonth = simulationRun.snapshots
          .slice(currentMonth + 1)
          .findIndex((s) => s.appliedEvents.length > 0)

        if (nextEventMonth !== -1) {
          set({ currentMonth: currentMonth + 1 + nextEventMonth })
        }
      },

      prevEvent: () => {
        const { simulationRun, currentMonth } = get()
        if (!simulationRun) return

        // Scan backwards from currentMonth - 1
        const snapshots = simulationRun.snapshots
        for (let m = currentMonth - 1; m >= 1; m--) {
          if (snapshots[m] && snapshots[m].appliedEvents.length > 0) {
            set({ currentMonth: m })
            return
          }
        }
        // Fall back to Month 0
        set({ currentMonth: 0 })
      },

      reset: () => {
        const { _intervalId } = get()
        if (_intervalId !== null) {
          clearInterval(_intervalId)
        }
        set({ currentMonth: 0, isPlaying: false, _intervalId: null })
      },

      play: () => {
        const { isPlaying, _intervalId, playbackIntervalMs } = get()
        if (isPlaying) return

        const id = setInterval(() => {
          const { currentMonth, pause } = get()
          if (currentMonth >= 24) {
            pause()
            return
          }
          set((state) => ({ currentMonth: state.currentMonth + 1 }))
        }, playbackIntervalMs)

        if (_intervalId !== null) {
          clearInterval(_intervalId)
        }

        set({ isPlaying: true, _intervalId: id })
      },

      pause: () => {
        const { _intervalId } = get()
        if (_intervalId !== null) {
          clearInterval(_intervalId)
        }
        set({ isPlaying: false, _intervalId: null })
      },

      setPlaybackInterval: (ms: number) => {
        set({ playbackIntervalMs: ms })
      },
    }),
    {
      name: 'simulation-store',
      // Only persist lightweight fields; re-run simulation on hydration
      partialize: (state) => ({
        activeScenarioId: state.activeScenarioId,
        currentMonth: state.currentMonth,
      }),
      onRehydrateStorage: () => (state) => {
        // After hydration, re-run the simulation for the persisted scenario
        if (state) {
          const scenario = getScenarioById(state.activeScenarioId)
          const overrides = usePricingStore.getState().overrides
          const simulationRun = runSimulation(scenario, buildPlanMap(overrides))
          state.simulationRun = simulationRun
        }
      },
    }
  )
)
