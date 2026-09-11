import type { PricingPlan } from '../domain/types'
import { PricingMetric, PricingStrategyType } from '../domain/types'

/**
 * Pricing plans for all 5 MVP tools.
 *
 * Each plan uses PricingComponent[] (no single billingModel enum).
 * Versions are defined inline with ISO effectiveFrom dates.
 *
 * Simulation start date: 2024-01-01
 * Version v1 effective from 2024-01-01
 * Version v2 (price change) effective from 2024-04-01 (Month 3)
 *
 * All pricing uses fictional values for demonstration purposes.
 */

// ─── Tool A: Seat-based pricing ───────────────────────────────
// $45/dev/month baseline; v2 increases to $54/dev/month (20% increase at Month 3)

export const planA: PricingPlan = {
  id: 'plan-tool-a',
  productId: 'product-a',
  name: 'AlphaCode Pro — Standard',
  currency: 'USD',
  components: [
    {
      id: 'comp-a-seat',
      metric: PricingMetric.SEAT,
      strategy: PricingStrategyType.PER_UNIT,
      rules: [
        {
          id: 'rule-a-seat-v1',
          metric: PricingMetric.SEAT,
          unitLabel: 'seat/month',
          unitCost: 45,
        },
      ],
    },
  ],
  versions: [
    {
      id: 'plan-tool-a-v1',
      pricingPlanId: 'plan-tool-a',
      effectiveFrom: '2024-01-01',
      effectiveTo: '2024-04-01',
      components: [
        {
          id: 'comp-a-seat-v1',
          metric: PricingMetric.SEAT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [
            {
              id: 'rule-a-seat-v1',
              metric: PricingMetric.SEAT,
              unitLabel: 'seat/month',
              unitCost: 45,
            },
          ],
        },
      ],
      notes: 'Initial pricing: $45/seat/month',
    },
    {
      id: 'plan-tool-a-v2',
      pricingPlanId: 'plan-tool-a',
      effectiveFrom: '2024-04-01',
      components: [
        {
          id: 'comp-a-seat-v2',
          metric: PricingMetric.SEAT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [
            {
              id: 'rule-a-seat-v2',
              metric: PricingMetric.SEAT,
              unitLabel: 'seat/month',
              unitCost: 54,
              notes: '20% price increase effective April 2024',
            },
          ],
        },
      ],
      notes: 'Price increase: $54/seat/month',
    },
  ],
}

// ─── Tool B: Token-based pricing ──────────────────────────────
// Input: $3/1M tokens, Output: $12/1M tokens (v1)
// After model improvement at Month 9 (Oct 2024): Input $1.80/1M, Output $7.20/1M (-40%)

export const planB: PricingPlan = {
  id: 'plan-tool-b',
  productId: 'product-b',
  name: 'BetaInfer — Pay-as-you-go',
  currency: 'USD',
  components: [
    {
      id: 'comp-b-token-input',
      metric: PricingMetric.TOKEN_INPUT,
      strategy: PricingStrategyType.PER_UNIT,
      rules: [
        {
          id: 'rule-b-token-input-v1',
          metric: PricingMetric.TOKEN_INPUT,
          unitLabel: 'per 1M input tokens',
          unitCost: 3.0,
        },
      ],
    },
  ],
  versions: [
    {
      id: 'plan-tool-b-v1',
      pricingPlanId: 'plan-tool-b',
      effectiveFrom: '2024-01-01',
      effectiveTo: '2024-10-01',
      components: [
        {
          id: 'comp-b-token-input-v1',
          metric: PricingMetric.TOKEN_INPUT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [
            {
              id: 'rule-b-token-input-v1',
              metric: PricingMetric.TOKEN_INPUT,
              unitLabel: 'per 1M input tokens',
              unitCost: 3.0,
            },
            {
              id: 'rule-b-token-output-v1',
              metric: PricingMetric.TOKEN_OUTPUT,
              unitLabel: 'per 1M output tokens',
              unitCost: 12.0,
            },
          ],
        },
      ],
      notes: 'Initial token pricing',
    },
    {
      id: 'plan-tool-b-v2',
      pricingPlanId: 'plan-tool-b',
      effectiveFrom: '2024-10-01',
      components: [
        {
          id: 'comp-b-token-input-v2',
          metric: PricingMetric.TOKEN_INPUT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [
            {
              id: 'rule-b-token-input-v2',
              metric: PricingMetric.TOKEN_INPUT,
              unitLabel: 'per 1M input tokens',
              unitCost: 1.8,
            },
            {
              id: 'rule-b-token-output-v2',
              metric: PricingMetric.TOKEN_OUTPUT,
              unitLabel: 'per 1M output tokens',
              unitCost: 7.2,
            },
          ],
        },
      ],
      notes: 'Model improvement: 40% token cost reduction',
    },
  ],
}

// ─── Tool C: Seat + Token overage ─────────────────────────────
// $30/seat/month + $5/1M tokens (input and output combined)

export const planC: PricingPlan = {
  id: 'plan-tool-c',
  productId: 'product-c',
  name: 'GammaAssist — Team',
  currency: 'USD',
  components: [
    {
      id: 'comp-c-seat',
      metric: PricingMetric.SEAT,
      strategy: PricingStrategyType.PER_UNIT,
      rules: [
        {
          id: 'rule-c-seat',
          metric: PricingMetric.SEAT,
          unitLabel: 'seat/month',
          unitCost: 30,
        },
      ],
    },
    {
      id: 'comp-c-token-input',
      metric: PricingMetric.TOKEN_INPUT,
      strategy: PricingStrategyType.PER_UNIT,
      rules: [
        {
          id: 'rule-c-token-input',
          metric: PricingMetric.TOKEN_INPUT,
          unitLabel: 'per 1M tokens',
          unitCost: 5.0,
        },
        {
          id: 'rule-c-token-output',
          metric: PricingMetric.TOKEN_OUTPUT,
          unitLabel: 'per 1M output tokens',
          unitCost: 5.0,
        },
      ],
    },
  ],
  versions: [
    {
      id: 'plan-tool-c-v1',
      pricingPlanId: 'plan-tool-c',
      effectiveFrom: '2024-01-01',
      components: [
        {
          id: 'comp-c-seat-v1',
          metric: PricingMetric.SEAT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [
            {
              id: 'rule-c-seat-v1',
              metric: PricingMetric.SEAT,
              unitLabel: 'seat/month',
              unitCost: 30,
            },
          ],
        },
        {
          id: 'comp-c-token-input-v1',
          metric: PricingMetric.TOKEN_INPUT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [
            {
              id: 'rule-c-token-input-v1',
              metric: PricingMetric.TOKEN_INPUT,
              unitLabel: 'per 1M tokens',
              unitCost: 5.0,
            },
            {
              id: 'rule-c-token-output-v1',
              metric: PricingMetric.TOKEN_OUTPUT,
              unitLabel: 'per 1M output tokens',
              unitCost: 5.0,
            },
          ],
        },
      ],
      notes: 'Standard hybrid plan',
    },
  ],
}

// ─── Tool D: API Call / Usage-based ───────────────────────────
// 10,000 calls/dev/month included; $0.005/additional call
// Tiered overage: first 50k overage = $0.005; beyond = $0.003

export const planD: PricingPlan = {
  id: 'plan-tool-d',
  productId: 'product-d',
  name: 'DeltaCode API — Professional',
  currency: 'USD',
  components: [
    {
      id: 'comp-d-api',
      metric: PricingMetric.API_CALL,
      strategy: PricingStrategyType.INCLUDED_THEN_OVERAGE,
      rules: [
        {
          id: 'rule-d-api',
          metric: PricingMetric.API_CALL,
          unitLabel: 'API call',
          unitCost: 0.005,
          includedUnits: 10000,
        },
      ],
    },
  ],
  versions: [
    {
      id: 'plan-tool-d-v1',
      pricingPlanId: 'plan-tool-d',
      effectiveFrom: '2024-01-01',
      components: [
        {
          id: 'comp-d-api-v1',
          metric: PricingMetric.API_CALL,
          strategy: PricingStrategyType.INCLUDED_THEN_OVERAGE,
          rules: [
            {
              id: 'rule-d-api-v1',
              metric: PricingMetric.API_CALL,
              unitLabel: 'API call',
              unitCost: 0.005,
              includedUnits: 10000,
              tieredRates: [
                { upTo: 50000, unitCost: 0.005 },
                { upTo: Infinity, unitCost: 0.003 },
              ],
            },
          ],
        },
      ],
      notes: '10k included calls per dev; tiered overage',
    },
  ],
}

// ─── Tool E: Seat + Agent Call ────────────────────────────────
// $25/seat/month + 100 agent invocations/dev/month included; $0.50/additional invocation

export const planE: PricingPlan = {
  id: 'plan-tool-e',
  productId: 'product-e',
  name: 'Epsilon Agents — Enterprise',
  currency: 'USD',
  components: [
    {
      id: 'comp-e-seat',
      metric: PricingMetric.SEAT,
      strategy: PricingStrategyType.PER_UNIT,
      rules: [
        {
          id: 'rule-e-seat',
          metric: PricingMetric.SEAT,
          unitLabel: 'seat/month',
          unitCost: 25,
        },
      ],
    },
    {
      id: 'comp-e-agent',
      metric: PricingMetric.AGENT_CALL,
      strategy: PricingStrategyType.INCLUDED_THEN_OVERAGE,
      rules: [
        {
          id: 'rule-e-agent',
          metric: PricingMetric.AGENT_CALL,
          unitLabel: 'agent invocation',
          unitCost: 0.5,
          includedUnits: 100,
        },
      ],
    },
  ],
  versions: [
    {
      id: 'plan-tool-e-v1',
      pricingPlanId: 'plan-tool-e',
      effectiveFrom: '2024-01-01',
      effectiveTo: '2024-07-01',
      components: [
        {
          id: 'comp-e-seat-v1',
          metric: PricingMetric.SEAT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [
            {
              id: 'rule-e-seat-v1',
              metric: PricingMetric.SEAT,
              unitLabel: 'seat/month',
              unitCost: 25,
            },
          ],
        },
        {
          id: 'comp-e-agent-v1',
          metric: PricingMetric.AGENT_CALL,
          strategy: PricingStrategyType.INCLUDED_THEN_OVERAGE,
          rules: [
            {
              id: 'rule-e-agent-v1',
              metric: PricingMetric.AGENT_CALL,
              unitLabel: 'agent invocation',
              unitCost: 0.5,
              includedUnits: 100,
            },
          ],
        },
      ],
      notes: 'Initial agentic pricing',
    },
    {
      id: 'plan-tool-e-v2',
      pricingPlanId: 'plan-tool-e',
      effectiveFrom: '2024-07-01',
      components: [
        {
          id: 'comp-e-seat-v2',
          metric: PricingMetric.SEAT,
          strategy: PricingStrategyType.PER_UNIT,
          rules: [
            {
              id: 'rule-e-seat-v2',
              metric: PricingMetric.SEAT,
              unitLabel: 'seat/month',
              unitCost: 30,
              notes: 'Price increase',
            },
          ],
        },
        {
          id: 'comp-e-agent-v2',
          metric: PricingMetric.AGENT_CALL,
          strategy: PricingStrategyType.INCLUDED_THEN_OVERAGE,
          rules: [
            {
              id: 'rule-e-agent-v2',
              metric: PricingMetric.AGENT_CALL,
              unitLabel: 'agent invocation',
              unitCost: 0.75,
              includedUnits: 50,
              notes: 'Reduced included calls; higher overage rate',
            },
          ],
        },
      ],
      notes: 'Agent pricing change: $30/seat, 50 included calls, $0.75/overage',
    },
  ],
}

export const pricingPlans: readonly PricingPlan[] = [planA, planB, planC, planD, planE]

export const pricingPlanMap: Readonly<Record<string, PricingPlan>> = Object.fromEntries(
  pricingPlans.map((p) => [p.id, p])
)

export function getPricingPlanById(id: string): PricingPlan {
  const plan = pricingPlanMap[id]
  if (!plan) throw new Error(`PricingPlan not found: ${id}`)
  return plan
}
