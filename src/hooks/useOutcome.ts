import { useMemo } from 'react'
import { useSimulationStore } from '../state/simulationStore'
import { formatCurrency } from '../utils/currency'
import { toolMap } from '../data/index'
import type { ToolMonthlyResult } from '../domain/types'

export interface OutcomeSummary {
  isAtMonth24: boolean
  toolResults: OutcomeToolResult[]
  cheapestTool: OutcomeToolResult | null
  mostExpensiveTool: OutcomeToolResult | null
  totalCostAcrossAllTools: number
}

export interface OutcomeToolResult {
  toolId: string
  label: string
  color: string
  cumulativeCost: number
  formattedCost: string
  rank: number
}

/**
 * useOutcome — derives the 24-month outcome summary from the final snapshot.
 */
export function useOutcome(): OutcomeSummary {
  const simulationRun = useSimulationStore((s) => s.simulationRun)
  const currentMonth = useSimulationStore((s) => s.currentMonth)

  return useMemo(() => {
    if (!simulationRun) {
      return {
        isAtMonth24: false,
        toolResults: [],
        cheapestTool: null,
        mostExpensiveTool: null,
        totalCostAcrossAllTools: 0,
      }
    }

    const finalSnapshot = simulationRun.snapshots[24]
    const isAtMonth24 = currentMonth === 24

    const toolResults: OutcomeToolResult[] = finalSnapshot.perToolResults
      .map((tr: ToolMonthlyResult) => {
        const tool = toolMap[tr.toolId]
        return {
          toolId: tr.toolId,
          label: tool?.label ?? tr.toolId,
          color: tool?.color ?? '#888',
          cumulativeCost: tr.cumulativeCost,
          formattedCost: formatCurrency(tr.cumulativeCost),
          rank: 0,
        }
      })
      .sort((a, b) => a.cumulativeCost - b.cumulativeCost)
      .map((tr, i) => ({ ...tr, rank: i + 1 }))

    const cheapestTool = toolResults[0] ?? null
    const mostExpensiveTool = toolResults[toolResults.length - 1] ?? null
    const totalCostAcrossAllTools = toolResults.reduce((s, t) => s + t.cumulativeCost, 0)

    return {
      isAtMonth24,
      toolResults,
      cheapestTool,
      mostExpensiveTool,
      totalCostAcrossAllTools,
    }
  }, [simulationRun, currentMonth])
}
