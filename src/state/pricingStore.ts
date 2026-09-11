/**
 * Pricing Override Store
 *
 * Allows users to override individual PricingRule values (unitCost and
 * includedUnits) without mutating the static data layer.
 *
 * overrides: Record<ruleId, { unitCost?: number; includedUnits?: number }>
 *
 * applyOverrides(plan) returns a deep copy of a PricingPlan with the
 * stored overrides merged in — safe to pass to runSimulation().
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PricingPlan } from '../domain/types'

export interface PricingRuleOverride {
  unitCost?: number
  includedUnits?: number
}

interface PricingStoreState {
  /** Map of ruleId → override values */
  overrides: Record<string, PricingRuleOverride>

  /** Set one or more fields on a rule override */
  setOverride: (ruleId: string, values: PricingRuleOverride) => void

  /** Reset a single rule to its original values */
  resetRule: (ruleId: string) => void

  /** Reset ALL overrides */
  resetAll: () => void
}

export const usePricingStore = create<PricingStoreState>()(
  persist(
    (set) => ({
      overrides: {},

      setOverride: (ruleId, values) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [ruleId]: { ...state.overrides[ruleId], ...values },
          },
        })),

      resetRule: (ruleId) =>
        set((state) => {
          const next = { ...state.overrides }
          delete next[ruleId]
          return { overrides: next }
        }),

      resetAll: () => set({ overrides: {} }),
    }),
    { name: 'pricing-overrides' }
  )
)

/**
 * Returns a deep copy of the given PricingPlan with user overrides applied.
 * When there are no overrides for a plan the original object is returned as-is.
 */
export function applyOverrides(
  plan: PricingPlan,
  overrides: Record<string, PricingRuleOverride>
): PricingPlan {
  // Quick exit — nothing to merge
  const anyRuleAffected = plan.versions.some((v) =>
    v.components.some((c) => c.rules.some((r) => overrides[r.id] !== undefined))
  )
  if (!anyRuleAffected) return plan

  return {
    ...plan,
    versions: plan.versions.map((version) => ({
      ...version,
      components: version.components.map((component) => ({
        ...component,
        rules: component.rules.map((rule) => {
          const o = overrides[rule.id]
          if (!o) return rule
          return {
            ...rule,
            ...(o.unitCost !== undefined ? { unitCost: o.unitCost } : {}),
            ...(o.includedUnits !== undefined
              ? { includedUnits: o.includedUnits }
              : {}),
          }
        }),
      })),
    })),
  }
}
