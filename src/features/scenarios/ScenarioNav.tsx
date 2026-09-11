import { useSimulationStore } from '../../state/simulationStore'
import { useUIStore } from '../../state/uiStore'
import { scenarios } from '../../data/index'
import { PricingReferenceTable } from '../tools/PricingReferenceTable'

const TABS = [
  ...scenarios.map((s) => ({ id: s.id, label: s.name, shortLabel: s.name.split(' ')[0] })),
  { id: 'pricing-reference', label: 'Pricing Reference', shortLabel: 'Pricing' },
]

interface ScenarioNavProps {
  children: React.ReactNode
}

export function ScenarioNav({ children }: ScenarioNavProps) {
  const activeScenarioId = useSimulationStore((s) => s.activeScenarioId)
  const loadScenario = useSimulationStore((s) => s.loadScenario)
  const activeDetailPanel = useUIStore((s) => s.activeDetailPanel)
  const setActiveDetailPanel = useUIStore((s) => s.setActiveDetailPanel)

  const [activeTab, setActiveTab] = React.useState(activeScenarioId)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    if (tabId !== 'pricing-reference') {
      loadScenario(tabId)
      setActiveDetailPanel('overview')
    }
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Scenario selection"
        className="flex border-b border-gray-200 bg-white px-4 gap-1 overflow-x-auto"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => handleTabChange(tab.id)}
            className={[
              'px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
            ].join(' ')}
          >
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'pricing-reference' ? (
        <div
          role="tabpanel"
          id="tabpanel-pricing-reference"
          aria-labelledby="tab-pricing-reference"
          className="flex-1 p-4"
        >
          <PricingReferenceTable />
        </div>
      ) : (
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="flex-1 flex flex-col"
        >
          {children}
        </div>
      )}
    </div>
  )
}

// Need to import React for useState
import React from 'react'
