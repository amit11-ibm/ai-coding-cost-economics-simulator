import { useUIStore } from '../../state/uiStore'
import { ToolDetail } from '../tools/ToolDetail'
import { EventDetail } from '../events/EventDetail'
import { ScenarioOverview } from '../scenarios/ScenarioOverview'
import { OutcomePanel } from '../outcomes/OutcomePanel'
import { useSimulation } from '../../hooks/useSimulation'

export function DetailPanel() {
  const activeDetailPanel = useUIStore((s) => s.activeDetailPanel)
  const setActiveDetailPanel = useUIStore((s) => s.setActiveDetailPanel)
  const { currentMonth } = useSimulation()

  return (
    <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200 bg-white">
      {/* Panel tabs */}
      <div className="flex border-b border-gray-200 text-xs">
        {(['overview', 'tool', 'event'] as const).map((panel) => (
          <button
            key={panel}
            onClick={() => setActiveDetailPanel(panel)}
            className={[
              'px-3 py-2 font-medium capitalize transition-colors flex-1',
              activeDetailPanel === panel
                ? 'text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {panel === 'overview' ? 'Scenario' : panel === 'tool' ? 'Tool' : 'Event'}
          </button>
        ))}
      </div>

      {/* Panel content — scrollable on desktop sidebar, natural height on mobile */}
      <div className="lg:max-h-[560px] lg:overflow-y-auto">
        {activeDetailPanel === 'overview' && <ScenarioOverview />}
        {activeDetailPanel === 'tool' && <ToolDetail />}
        {activeDetailPanel === 'event' && <EventDetail />}
      </div>

      {/* Outcome panel (visible at Month 24) */}
      {currentMonth === 24 && (
        <div className="border-t border-gray-200">
          <OutcomePanel />
        </div>
      )}
    </div>
  )
}
