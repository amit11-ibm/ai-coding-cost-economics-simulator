import type {
  SimulationEvent,
  SimulationState,
  ToolSimState,
} from '../domain/types'
import { EventType } from '../domain/types'

/**
 * Sort events: effectiveMonth ASC, then priority ASC (lower priority number = earlier execution).
 * Higher-priority events execute last and win on same-field conflicts.
 */
export function sortEvents(events: readonly SimulationEvent[]): SimulationEvent[] {
  return [...events].sort((a, b) => {
    if (a.effectiveMonth !== b.effectiveMonth) {
      return a.effectiveMonth - b.effectiveMonth
    }
    return a.priority - b.priority
  })
}

/**
 * Apply a list of events (pre-sorted) to a SimulationState.
 * Returns a new immutable SimulationState — never mutates input.
 */
export function applyEvents(
  state: SimulationState,
  events: readonly SimulationEvent[]
): SimulationState {
  let current = state

  for (const event of events) {
    current = applySingleEvent(current, event)
  }

  return current
}

function applySingleEvent(
  state: SimulationState,
  event: SimulationEvent
): SimulationState {
  const { type, payload, affectedToolIds } = event

  switch (type) {
    case EventType.PRICING_VERSION_CHANGE:
    case EventType.VENDOR_PRICE_CHANGE:
    case EventType.BILLING_MODEL_CHANGE:
    case EventType.AGENT_PRICING_CHANGE: {
      const p = payload as { newVersionId: string }
      return updateToolStates(state, affectedToolIds, (ts) => ({
        ...ts,
        activePricingVersionId: p.newVersionId,
        pricingVersionOverridden: true,
      }))
    }

    case EventType.HEADCOUNT_CHANGE: {
      const p = payload as { mode: 'absolute' | 'delta'; value: number }
      const newCount =
        p.mode === 'absolute'
          ? p.value
          : state.developerCount + p.value
      return { ...state, developerCount: Math.max(1, Math.round(newCount)) }
    }

    case EventType.ADOPTION_CHANGE: {
      const p = payload as { newRate: number }
      return updateToolStates(state, affectedToolIds, (ts) => ({
        ...ts,
        adoptionRate: p.newRate,
        adoptionOverridden: true,
      }))
    }

    case EventType.MIGRATION_EVENT: {
      const p = payload as { cost: number }
      return updateToolStates(state, affectedToolIds, (ts) => ({
        ...ts,
        pendingMigrationCost: ts.pendingMigrationCost + p.cost,
      }))
    }

    case EventType.SECURITY_REMEDIATION: {
      const p = payload as { cost: number }
      return updateToolStates(state, affectedToolIds, (ts) => ({
        ...ts,
        pendingSecurityCost: ts.pendingSecurityCost + p.cost,
      }))
    }

    case EventType.PROVIDER_MODEL_CHANGE: {
      const p = payload as { modelId: string }
      return updateToolStates(state, affectedToolIds, (ts) => ({
        ...ts,
        activeModelProviderId: p.modelId,
      }))
    }

    case EventType.TOKENISATION_CHANGE: {
      const p = payload as { newUsageProfile: ToolSimState['usageProfile'] }
      return updateToolStates(state, affectedToolIds, (ts) => ({
        ...ts,
        usageProfile: p.newUsageProfile,
      }))
    }

    case EventType.OPERATIONAL_COST_CHANGE: {
      const p = payload as
        | { recurring: true; costPerMonth: number }
        | { recurring: false; cost: number }
      if (p.recurring) {
        return updateToolStates(state, affectedToolIds, (ts) => ({
          ...ts,
          recurringOperationalCostPerMonth: p.costPerMonth,
        }))
      } else {
        return updateToolStates(state, affectedToolIds, (ts) => ({
          ...ts,
          pendingOneTimeOperationalCost: ts.pendingOneTimeOperationalCost + p.cost,
        }))
      }
    }

    default:
      return state
  }
}

/**
 * Helper: update specific tool states by ID, returning a new state.
 */
function updateToolStates(
  state: SimulationState,
  toolIds: readonly string[],
  updater: (ts: ToolSimState) => ToolSimState
): SimulationState {
  const newToolStates = { ...state.toolStates }

  for (const toolId of toolIds) {
    const ts = newToolStates[toolId]
    if (ts) {
      newToolStates[toolId] = updater(ts)
    }
  }

  return { ...state, toolStates: newToolStates }
}
