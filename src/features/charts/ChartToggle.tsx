import { useUIStore } from '../../state/uiStore'

export function ChartToggle() {
  const chartMode = useUIStore((s) => s.chartMode)
  const setChartMode = useUIStore((s) => s.setChartMode)

  return (
    <div
      role="group"
      aria-label="Chart view mode"
      className="flex rounded border border-gray-200 overflow-hidden text-sm"
    >
      <button
        role="radio"
        aria-checked={chartMode === 'monthly'}
        onClick={() => setChartMode('monthly')}
        className={[
          'px-3 py-1.5 text-xs font-medium transition-colors',
          chartMode === 'monthly'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50',
        ].join(' ')}
      >
        Monthly
      </button>
      <button
        role="radio"
        aria-checked={chartMode === 'cumulative'}
        onClick={() => setChartMode('cumulative')}
        className={[
          'px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200',
          chartMode === 'cumulative'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50',
        ].join(' ')}
      >
        Cumulative
      </button>
    </div>
  )
}
