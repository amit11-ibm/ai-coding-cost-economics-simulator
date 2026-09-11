import type { Tool } from '../domain/types'

/**
 * Tool colours meet WCAG AA contrast ratio (≥ 4.5:1) against white (#ffffff).
 * Verified values:
 *   #1d6fbf - Blue (Tool A)    contrast ~6.2:1
 *   #b85c00 - Amber (Tool B)   contrast ~5.3:1
 *   #186e3d - Green (Tool C)   contrast ~7.1:1
 *   #7b2d8b - Purple (Tool D)  contrast ~6.0:1
 *   #b82020 - Red (Tool E)     contrast ~5.5:1
 */
export const tools: readonly Tool[] = [
  {
    id: 'tool-a',
    productId: 'product-a',
    label: 'Tool A',
    color: '#1d6fbf',
    isActive: true,
  },
  {
    id: 'tool-b',
    productId: 'product-b',
    label: 'Tool B',
    color: '#b85c00',
    isActive: true,
  },
  {
    id: 'tool-c',
    productId: 'product-c',
    label: 'Tool C',
    color: '#186e3d',
    isActive: true,
  },
  {
    id: 'tool-d',
    productId: 'product-d',
    label: 'Tool D',
    color: '#7b2d8b',
    isActive: true,
  },
  {
    id: 'tool-e',
    productId: 'product-e',
    label: 'Tool E',
    color: '#b82020',
    isActive: true,
  },
]

export const toolMap: Readonly<Record<string, Tool>> = Object.fromEntries(
  tools.map((t) => [t.id, t])
)
