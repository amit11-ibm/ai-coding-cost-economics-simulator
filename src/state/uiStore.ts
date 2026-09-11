import { create } from 'zustand'

interface UIStoreState {
  selectedToolId: string | null
  selectedEventId: string | null
  chartMode: 'monthly' | 'cumulative'
  visibleToolIds: string[]
  activeDetailPanel: 'tool' | 'event' | 'overview'

  selectTool: (toolId: string) => void
  selectEvent: (eventId: string) => void
  setChartMode: (mode: 'monthly' | 'cumulative') => void
  toggleToolVisibility: (toolId: string) => void
  setActiveDetailPanel: (panel: 'tool' | 'event' | 'overview') => void
  setVisibleToolIds: (toolIds: string[]) => void
}

const ALL_TOOL_IDS = ['tool-a', 'tool-b', 'tool-c', 'tool-d', 'tool-e']

export const useUIStore = create<UIStoreState>()((set, get) => ({
  selectedToolId: null,
  selectedEventId: null,
  chartMode: 'monthly',
  visibleToolIds: [...ALL_TOOL_IDS],
  activeDetailPanel: 'overview',

  selectTool: (toolId: string) => {
    set({ selectedToolId: toolId, activeDetailPanel: 'tool' })
  },

  selectEvent: (eventId: string) => {
    set({ selectedEventId: eventId, activeDetailPanel: 'event' })
  },

  setChartMode: (mode: 'monthly' | 'cumulative') => {
    set({ chartMode: mode })
  },

  toggleToolVisibility: (toolId: string) => {
    const { visibleToolIds } = get()
    if (visibleToolIds.includes(toolId)) {
      // Don't allow hiding the last visible tool
      if (visibleToolIds.length > 1) {
        set({ visibleToolIds: visibleToolIds.filter((id) => id !== toolId) })
      }
    } else {
      set({ visibleToolIds: [...visibleToolIds, toolId] })
    }
  },

  setActiveDetailPanel: (panel: 'tool' | 'event' | 'overview') => {
    set({ activeDetailPanel: panel })
  },

  setVisibleToolIds: (toolIds: string[]) => {
    set({ visibleToolIds: toolIds })
  },
}))
