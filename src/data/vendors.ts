import type { Vendor } from '../domain/types'

export const vendors: readonly Vendor[] = [
  {
    id: 'vendor-alpha',
    name: 'Alpha Technologies',
    description: 'Enterprise AI coding platform provider',
  },
  {
    id: 'vendor-beta',
    name: 'Beta AI Labs',
    description: 'Token-based AI model provider',
  },
  {
    id: 'vendor-gamma',
    name: 'Gamma Systems',
    description: 'Hybrid seat and token AI coding assistant',
  },
  {
    id: 'vendor-delta',
    name: 'Delta Cloud',
    description: 'API-first developer productivity platform',
  },
  {
    id: 'vendor-epsilon',
    name: 'Epsilon Autonomous',
    description: 'Agentic AI coding platform with per-task billing',
  },
]

export const vendorMap: Readonly<Record<string, Vendor>> = Object.fromEntries(
  vendors.map((v) => [v.id, v])
)
