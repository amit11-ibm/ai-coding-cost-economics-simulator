import { z } from 'zod'
import {
  ProductCategory,
  PricingMetric,
  PricingStrategyType,
  EventType,
  EntityType,
} from './types'

// ─── Base Schemas ────────────────────────────────────────────

export const VendorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  website: z.string().url().optional(),
})

export const ProductSchema = z.object({
  id: z.string().min(1),
  vendorId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: z.nativeEnum(ProductCategory),
})

export const TierRateSchema = z.object({
  upTo: z.number().positive(),
  unitCost: z.number().nonnegative(),
})

export const PricingRuleSchema = z.object({
  id: z.string().min(1),
  metric: z.nativeEnum(PricingMetric),
  unitLabel: z.string().min(1),
  unitCost: z.number().nonnegative(),
  includedUnits: z.number().nonnegative().optional(),
  tieredRates: z.array(TierRateSchema).optional(),
  notes: z.string().optional(),
})

export const PricingComponentSchema = z.object({
  id: z.string().min(1),
  metric: z.nativeEnum(PricingMetric),
  strategy: z.nativeEnum(PricingStrategyType),
  rules: z.array(PricingRuleSchema).min(1),
})

export const PricingVersionSchema = z.object({
  id: z.string().min(1),
  pricingPlanId: z.string().min(1),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be ISO date YYYY-MM-DD'),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  components: z.array(PricingComponentSchema).min(1),
  notes: z.string().optional(),
})

export const PricingPlanSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  name: z.string().min(1),
  currency: z.string().length(3),
  components: z.array(PricingComponentSchema).min(1),
  versions: z.array(PricingVersionSchema).min(1),
})

export const ToolSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  label: z.string().min(1),
  color: z.string().min(1),
  isActive: z.boolean(),
})

// ─── Adoption & Growth ───────────────────────────────────────

export const AdoptionRuleSchema = z.object({
  type: z.enum(['linear', 'exponential', 'stepped', 'flat']),
  targetRate: z.number().min(0).max(1),
  rampMonths: z.number().int().nonnegative(),
  stepMonth: z.number().int().positive().optional(),
})

export const UsageProfileSchema = z.object({
  avgInputTokensPerDevPerMonth: z.number().nonnegative(),
  avgOutputTokensPerDevPerMonth: z.number().nonnegative(),
  agentCallsPerDevPerMonth: z.number().nonnegative(),
  storageGbPerDev: z.number().nonnegative(),
  apiCallsPerDevPerMonth: z.number().nonnegative(),
})

export const ToolConfigSchema = z.object({
  toolId: z.string().min(1),
  pricingPlanId: z.string().min(1),
  initialAdoptionRate: z.number().min(0).max(1),
  adoptionRule: AdoptionRuleSchema,
  usageProfile: UsageProfileSchema,
})

export const GrowthRuleSchema = z.object({
  type: z.enum(['flat', 'linear', 'stepped']),
  monthlyDelta: z.number().optional(),
  stepMonth: z.number().int().positive().optional(),
  stepDelta: z.number().optional(),
})

export const RiskAssumptionsSchema = z.object({
  securityRiskLevel: z.enum(['low', 'medium', 'high']),
  migrationRiskLevel: z.enum(['low', 'medium', 'high']),
  notes: z.string().optional(),
})

// ─── Event Payloads ──────────────────────────────────────────

const PricingVersionChangePayloadSchema = z.object({
  type: z.literal(EventType.PRICING_VERSION_CHANGE),
  newVersionId: z.string().min(1),
})

const VendorPriceChangePayloadSchema = z.object({
  type: z.literal(EventType.VENDOR_PRICE_CHANGE),
  newVersionId: z.string().min(1),
})

const HeadcountChangePayloadSchema = z.object({
  type: z.literal(EventType.HEADCOUNT_CHANGE),
  mode: z.enum(['absolute', 'delta']),
  value: z.number(),
})

const AdoptionChangePayloadSchema = z.object({
  type: z.literal(EventType.ADOPTION_CHANGE),
  newRate: z.number().min(0).max(1),
})

const MigrationEventPayloadSchema = z.object({
  type: z.literal(EventType.MIGRATION_EVENT),
  cost: z.number().nonnegative(),
})

const SecurityRemediationPayloadSchema = z.object({
  type: z.literal(EventType.SECURITY_REMEDIATION),
  cost: z.number().nonnegative(),
})

const ProviderModelChangePayloadSchema = z.object({
  type: z.literal(EventType.PROVIDER_MODEL_CHANGE),
  modelId: z.string().min(1),
})

const BillingModelChangePayloadSchema = z.object({
  type: z.literal(EventType.BILLING_MODEL_CHANGE),
  newVersionId: z.string().min(1),
})

const AgentPricingChangePayloadSchema = z.object({
  type: z.literal(EventType.AGENT_PRICING_CHANGE),
  newVersionId: z.string().min(1),
})

const TokenisationChangePayloadSchema = z.object({
  type: z.literal(EventType.TOKENISATION_CHANGE),
  newUsageProfile: UsageProfileSchema,
})

const OperationalCostChangeRecurringSchema = z.object({
  type: z.literal(EventType.OPERATIONAL_COST_CHANGE),
  recurring: z.literal(true),
  costPerMonth: z.number().nonnegative(),
})

const OperationalCostChangeOneTimeSchema = z.object({
  type: z.literal(EventType.OPERATIONAL_COST_CHANGE),
  recurring: z.literal(false),
  cost: z.number().nonnegative(),
})

export const EventPayloadSchema = z.discriminatedUnion('type', [
  PricingVersionChangePayloadSchema,
  VendorPriceChangePayloadSchema,
  HeadcountChangePayloadSchema,
  AdoptionChangePayloadSchema,
  MigrationEventPayloadSchema,
  SecurityRemediationPayloadSchema,
  ProviderModelChangePayloadSchema,
  BillingModelChangePayloadSchema,
  AgentPricingChangePayloadSchema,
  TokenisationChangePayloadSchema,
  OperationalCostChangeRecurringSchema,
  OperationalCostChangeOneTimeSchema,
])

export const SimulationEventSchema = z.object({
  id: z.string().min(1),
  scenarioId: z.string().min(1),
  effectiveMonth: z.number().int().min(1).max(24),
  priority: z.number().int().nonnegative(),
  type: z.nativeEnum(EventType),
  description: z.string().min(1),
  affectedToolIds: z.array(z.string()),
  affectedEntityType: z.nativeEnum(EntityType),
  payload: EventPayloadSchema,
})

export const ScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  simulationStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMonths: z.number().int().positive(),
  currency: z.string().length(3),
  startingDeveloperCount: z.number().int().positive(),
  developerGrowthRule: GrowthRuleSchema,
  toolConfigs: z.array(ToolConfigSchema).min(1),
  events: z.array(SimulationEventSchema),
  riskAssumptions: RiskAssumptionsSchema,
})
