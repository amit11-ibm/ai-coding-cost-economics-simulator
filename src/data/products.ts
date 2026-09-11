import type { Product } from '../domain/types'
import { ProductCategory } from '../domain/types'

export const products: readonly Product[] = [
  {
    id: 'product-a',
    vendorId: 'vendor-alpha',
    name: 'AlphaCode Pro',
    description: 'Enterprise AI coding assistant with per-seat monthly billing',
    category: ProductCategory.AI_CODING_ASSISTANT,
  },
  {
    id: 'product-b',
    vendorId: 'vendor-beta',
    name: 'BetaInfer',
    description: 'Token-based AI code completion and generation API',
    category: ProductCategory.AI_CODING_ASSISTANT,
  },
  {
    id: 'product-c',
    vendorId: 'vendor-gamma',
    name: 'GammaAssist',
    description: 'Hybrid seat plus token overage AI coding platform',
    category: ProductCategory.AI_CODING_ASSISTANT,
  },
  {
    id: 'product-d',
    vendorId: 'vendor-delta',
    name: 'DeltaCode API',
    description: 'Usage-based API call developer productivity tool',
    category: ProductCategory.DEVTOOLS_PLATFORM,
  },
  {
    id: 'product-e',
    vendorId: 'vendor-epsilon',
    name: 'Epsilon Agents',
    description: 'Agentic AI platform: seat + per-agent-invocation billing',
    category: ProductCategory.AI_AGENT_PLATFORM,
  },
]

export const productMap: Readonly<Record<string, Product>> = Object.fromEntries(
  products.map((p) => [p.id, p])
)
