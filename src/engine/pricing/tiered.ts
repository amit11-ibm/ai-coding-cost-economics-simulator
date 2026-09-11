import type { PricingInputs, PricingRule, ComponentResult, TierRate } from '../../domain/types'
import { buildExplanationEntry } from '../../utils/explanation'

/**
 * Apply tiered rates to a volume and return the total cost.
 * Tiers are cumulative: each tier costs its portion of the volume.
 *
 * Example tiers: [{upTo:1000, unitCost:0.10}, {upTo:Infinity, unitCost:0.05}]
 * For volume 1500: cost = 1000*0.10 + 500*0.05 = 100 + 25 = 125
 */
export function applyTieredRates(tiers: readonly TierRate[], volume: number): number {
  if (volume <= 0 || tiers.length === 0) return 0

  let remaining = volume
  let cost = 0
  let previousUpTo = 0

  for (const tier of tiers) {
    if (remaining <= 0) break
    const tierCapacity = tier.upTo - previousUpTo
    const tierVolume = Math.min(remaining, tierCapacity === Infinity ? remaining : tierCapacity)
    cost += tierVolume * tier.unitCost
    remaining -= tierVolume
    previousUpTo = tier.upTo === Infinity ? previousUpTo : tier.upTo
  }

  return cost
}

/**
 * TieredVolumeCalculator — can be used as a decorator or standalone.
 * Computes cost for any volume using tiered rates from the first rule.
 */
export function calculateTieredCost(
  volume: number,
  rules: readonly PricingRule[],
  inputs: PricingInputs,
  componentName: string
): ComponentResult {
  const rule = rules[0]
  if (!rule) {
    return {
      cost: 0,
      explanation: buildExplanationEntry(componentName, 'no-rule', {}, 0),
    }
  }

  if (rule.tieredRates && rule.tieredRates.length > 0) {
    const cost = applyTieredRates(rule.tieredRates, volume)
    return {
      cost,
      explanation: buildExplanationEntry(
        componentName,
        `tiered(volume=${volume})`,
        { volume, ...Object.fromEntries(inputs ? [['activeUsers', inputs.activeUsers]] : []) },
        cost
      ),
    }
  }

  // Fall back to flat rate
  const cost = volume * rule.unitCost
  return {
    cost,
    explanation: buildExplanationEntry(
      componentName,
      `${volume} × ${rule.unitCost}`,
      { volume, unitCost: rule.unitCost },
      cost
    ),
  }
}
