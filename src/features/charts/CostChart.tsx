import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { useChartData, useToolColors } from '../../hooks/useChartData'
import { useSimulationStore } from '../../state/simulationStore'
import { useUIStore } from '../../state/uiStore'
import { tools } from '../../data/index'
import { formatCurrency } from '../../utils/currency'
import { ChartToggle } from './ChartToggle'

const TOOL_IDS = ['tool-a', 'tool-b', 'tool-c', 'tool-d', 'tool-e']

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-white border border-gray-200 rounded shadow-md p-3 text-xs max-w-[200px]">
      <div className="font-semibold mb-1.5 text-gray-700">
        {label === 0 ? 'Month 0 — Baseline' : `Month ${label}`}
      </div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-3">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function CostChart() {
  const chartData = useChartData()
  const toolColors = useToolColors()
  const currentMonth = useSimulationStore((s) => s.currentMonth)
  const visibleToolIds = useUIStore((s) => s.visibleToolIds)
  const toggleToolVisibility = useUIStore((s) => s.toggleToolVisibility)
  const chartMode = useUIStore((s) => s.chartMode)

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading simulation...
      </div>
    )
  }

  // Find months with events (for reference lines)
  const eventMonths = chartData
    .filter((d) => d.hasEvent && d.month > 0)
    .map((d) => d.month as number)

  const toolList = tools.filter((t) => TOOL_IDS.includes(t.id))

  // Build accessible table data for screen readers
  const visibleTools = toolList.filter((t) => visibleToolIds.includes(t.id))

  return (
    <div className="flex flex-col">
      {/* Chart header — wraps on narrow screens */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
        <div className="text-xs font-medium text-gray-600">
          {chartMode === 'monthly' ? 'Monthly Cost' : 'Cumulative Cost'} — Month 0–24
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Tool visibility toggles */}
          <div className="flex flex-wrap gap-1">
            {toolList.map((tool) => (
              <button
                key={tool.id}
                onClick={() => toggleToolVisibility(tool.id)}
                title={visibleToolIds.includes(tool.id) ? `Hide ${tool.label}` : `Show ${tool.label}`}
                className={[
                  'px-2 py-0.5 text-xs rounded border transition-colors',
                  visibleToolIds.includes(tool.id)
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-400 border-gray-200',
                ].join(' ')}
                style={
                  visibleToolIds.includes(tool.id)
                    ? { backgroundColor: tool.color, borderColor: tool.color }
                    : {}
                }
                aria-pressed={visibleToolIds.includes(tool.id)}
              >
                {tool.label}
              </button>
            ))}
          </div>
          <ChartToggle />
        </div>
      </div>

      {/* Main chart — explicit height so ResponsiveContainer always has a bounded parent */}
      <div className="h-72 sm:h-80 lg:h-96" role="img" aria-label={`${chartMode} cost chart for months 0 through 24`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tickFormatter={(v) => (v === 0 ? 'Base' : `M${v}`)}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => {
                if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
                if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
                return `$${v}`
              }}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Event month reference lines */}
            {eventMonths.map((month) => (
              <ReferenceLine
                key={`event-${month}`}
                x={month}
                stroke="#f59e0b"
                strokeDasharray="4 2"
                strokeWidth={1.5}
                label={{
                  value: '⚡',
                  position: 'top',
                  fontSize: 10,
                  fill: '#f59e0b',
                }}
              />
            ))}

            {/* Current month reference line */}
            {currentMonth > 0 && (
              <ReferenceLine
                x={currentMonth}
                stroke="#3b82d4"
                strokeWidth={2}
                label={{
                  value: `M${currentMonth}`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: '#3b82d4',
                  fontWeight: 600,
                }}
              />
            )}

            {/* Tool series */}
            {visibleTools.map((tool) => (
              <Area
                key={tool.id}
                type="monotone"
                dataKey={tool.id}
                name={tool.label}
                stroke={tool.color}
                fill={`${tool.color}20`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Visually-hidden accessible table */}
      <table className="sr-only" aria-label="Cost data table">
        <caption>Monthly and cumulative costs by tool, months 0–24</caption>
        <thead>
          <tr>
            <th>Month</th>
            {visibleTools.map((t) => (
              <th key={t.id}>{t.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chartData.map((row) => (
            <tr key={row.month as number}>
              <td>{row.month === 0 ? 'Baseline' : `Month ${row.month}`}</td>
              {visibleTools.map((t) => (
                <td key={t.id}>{formatCurrency((row[t.id] as number) || 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
