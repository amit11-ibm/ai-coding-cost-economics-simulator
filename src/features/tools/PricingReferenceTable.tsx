import { useState, useCallback } from 'react'
import { tools, pricingPlanMap as basePricingPlanMap } from '../../data/index'
import { PricingMetric } from '../../domain/types'
import { formatCurrencyPrecise } from '../../utils/currency'
import { usePricingStore } from '../../state/pricingStore'
import { useSimulationStore } from '../../state/simulationStore'

const METRIC_LABELS: Record<string, string> = {
  [PricingMetric.SEAT]: 'Per Seat',
  [PricingMetric.TOKEN_INPUT]: 'Token (Input)',
  [PricingMetric.TOKEN_OUTPUT]: 'Token (Output)',
  [PricingMetric.API_CALL]: 'Per API Call',
  [PricingMetric.AGENT_CALL]: 'Per Agent Call',
  [PricingMetric.MODEL_PROVIDER]: 'Model Provider',
  [PricingMetric.OPERATIONAL]: 'Operational',
  [PricingMetric.STORAGE_GB]: 'Storage (GB)',
}

// ─── Editable Rate Cell ───────────────────────────────────────
interface RateCellProps {
  ruleId: string
  originalUnitCost: number
  unitLabel: string
  overrideUnitCost?: number
  onCommit: (ruleId: string, unitCost: number) => void
  onReset: (ruleId: string) => void
}

function RateCell({
  ruleId,
  originalUnitCost,
  unitLabel,
  overrideUnitCost,
  onCommit,
  onReset,
}: RateCellProps) {
  const current = overrideUnitCost ?? originalUnitCost
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const startEdit = () => {
    setDraft(String(current))
    setEditing(true)
  }

  const commit = () => {
    const parsed = parseFloat(draft)
    if (!isNaN(parsed) && parsed >= 0) {
      onCommit(ruleId, parsed)
    }
    setEditing(false)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  const isModified = overrideUnitCost !== undefined && overrideUnitCost !== originalUnitCost

  if (editing) {
    return (
      <td className="p-2 text-xs text-right font-medium tabular-nums">
        <div className="flex items-center justify-end gap-1">
          <span className="text-gray-400">$</span>
          <input
            autoFocus
            type="number"
            min={0}
            step="any"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKey}
            className="w-24 text-right border border-blue-400 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-gray-400">/{unitLabel}</span>
        </div>
      </td>
    )
  }

  return (
    <td className="p-2 text-xs text-right font-medium tabular-nums group">
      <div className="flex items-center justify-end gap-1.5">
        {isModified && (
          <button
            title={`Reset to original $${originalUnitCost}`}
            onClick={() => onReset(ruleId)}
            className="opacity-0 group-hover:opacity-100 text-orange-400 hover:text-orange-600 transition-opacity text-xs leading-none"
          >
            ↩
          </button>
        )}
        <button
          onClick={startEdit}
          title="Click to edit"
          className={[
            'rounded px-1 py-0.5 hover:bg-blue-50 transition-colors cursor-text',
            isModified ? 'text-blue-700 underline decoration-dotted' : 'text-gray-800',
          ].join(' ')}
        >
          {formatCurrencyPrecise(current)}/{unitLabel}
        </button>
      </div>
    </td>
  )
}

// ─── Editable Included-Units Cell ────────────────────────────
interface IncludedCellProps {
  ruleId: string
  originalIncluded: number | undefined
  overrideIncluded: number | undefined
  onCommit: (ruleId: string, includedUnits: number) => void
  onReset: (ruleId: string) => void
}

function IncludedCell({
  ruleId,
  originalIncluded,
  overrideIncluded,
  onCommit,
  onReset,
}: IncludedCellProps) {
  const current = overrideIncluded ?? originalIncluded
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const startEdit = () => {
    setDraft(String(current ?? ''))
    setEditing(true)
  }

  const commit = () => {
    const parsed = parseInt(draft, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      onCommit(ruleId, parsed)
    }
    setEditing(false)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  const isModified =
    overrideIncluded !== undefined && overrideIncluded !== originalIncluded

  if (editing) {
    return (
      <td className="p-2 text-xs">
        <input
          autoFocus
          type="number"
          min={0}
          step={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          className="w-20 border border-blue-400 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </td>
    )
  }

  return (
    <td className="p-2 text-xs text-gray-500 group">
      <div className="flex items-center gap-1">
        {isModified && (
          <button
            title={`Reset to original ${originalIncluded ?? '—'}`}
            onClick={() => onReset(ruleId)}
            className="opacity-0 group-hover:opacity-100 text-orange-400 hover:text-orange-600 transition-opacity text-xs leading-none"
          >
            ↩
          </button>
        )}
        <button
          onClick={startEdit}
          title="Click to edit"
          className={[
            'rounded px-1 py-0.5 hover:bg-blue-50 transition-colors cursor-text',
            isModified ? 'text-blue-700 underline decoration-dotted' : '',
          ].join(' ')}
        >
          {current !== undefined ? current.toLocaleString() : '—'}
        </button>
      </div>
    </td>
  )
}

// ─── Main Table ───────────────────────────────────────────────
export function PricingReferenceTable() {
  const { overrides, setOverride, resetRule, resetAll } = usePricingStore()
  const rerunSimulation = useSimulationStore((s) => s.rerunSimulation)

  const handleUnitCost = useCallback(
    (ruleId: string, unitCost: number) => {
      setOverride(ruleId, { unitCost })
      rerunSimulation()
    },
    [setOverride, rerunSimulation]
  )

  const handleIncluded = useCallback(
    (ruleId: string, includedUnits: number) => {
      setOverride(ruleId, { includedUnits })
      rerunSimulation()
    },
    [setOverride, rerunSimulation]
  )

  const handleResetRule = useCallback(
    (ruleId: string) => {
      resetRule(ruleId)
      rerunSimulation()
    },
    [resetRule, rerunSimulation]
  )

  const handleResetAll = useCallback(() => {
    resetAll()
    rerunSimulation()
  }, [resetAll, rerunSimulation])

  const hasAnyOverride = Object.keys(overrides).length > 0

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Pricing Reference</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            All tools and pricing are fictional for demonstration purposes.{' '}
            <span className="text-gray-400">
              Click any rate or included-units value to edit it — changes rerun the simulation instantly.
            </span>
          </p>
        </div>
        {hasAnyOverride && (
          <button
            onClick={handleResetAll}
            className="shrink-0 text-xs px-3 py-1.5 rounded border border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors whitespace-nowrap"
          >
            Reset all prices
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-px border-b border-dotted border-blue-500" />
          Modified value
        </span>
        <span className="flex items-center gap-1">↩ Reset to original</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Tool</th>
              <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Plan</th>
              <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Cost Component</th>
              <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Metric</th>
              <th className="text-right p-3 font-semibold text-gray-700 border-b border-gray-200">Rate</th>
              <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Included</th>
              <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Effective From</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => {
              const plan = basePricingPlanMap[
                tool.id === 'tool-a' ? 'plan-tool-a' :
                tool.id === 'tool-b' ? 'plan-tool-b' :
                tool.id === 'tool-c' ? 'plan-tool-c' :
                tool.id === 'tool-d' ? 'plan-tool-d' :
                'plan-tool-e'
              ]
              if (!plan) return null

              return plan.versions.flatMap((version, vi) =>
                version.components.flatMap((component, ci) =>
                  component.rules.map((rule, ri) => (
                    <tr
                      key={`${tool.id}-${vi}-${ci}-${ri}`}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      {ci === 0 && ri === 0 && vi === 0 ? (
                        <td
                          className="p-3 font-medium align-top"
                          rowSpan={plan.versions.reduce((acc, v) =>
                            acc + v.components.reduce((a, c) => a + c.rules.length, 0), 0
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: tool.color }}
                            />
                            {tool.label}
                          </div>
                        </td>
                      ) : null}
                      {ri === 0 ? (
                        <td
                          className="p-3 text-xs text-gray-600 align-top"
                          rowSpan={component.rules.length}
                        >
                          {plan.name.split('—')[1]?.trim() ?? plan.name}
                          <div className="text-gray-400">{version.notes}</div>
                        </td>
                      ) : null}
                      <td className="p-3 text-xs text-gray-700">
                        {component.id.replace(/^comp-[a-e]-/, '')}
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {METRIC_LABELS[rule.metric] ?? rule.metric}
                      </td>
                      <RateCell
                        ruleId={rule.id}
                        originalUnitCost={rule.unitCost}
                        unitLabel={rule.unitLabel}
                        overrideUnitCost={overrides[rule.id]?.unitCost}
                        onCommit={handleUnitCost}
                        onReset={handleResetRule}
                      />
                      <IncludedCell
                        ruleId={rule.id}
                        originalIncluded={rule.includedUnits}
                        overrideIncluded={overrides[rule.id]?.includedUnits}
                        onCommit={handleIncluded}
                        onReset={handleResetRule}
                      />
                      {ri === 0 && ci === 0 ? (
                        <td
                          className="p-3 text-xs text-gray-500 align-top"
                          rowSpan={component.rules.length}
                        >
                          {version.effectiveFrom}
                          {version.effectiveTo && <> — {version.effectiveTo}</>}
                        </td>
                      ) : null}
                    </tr>
                  ))
                )
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
