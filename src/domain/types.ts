// ============================================================
// Domain Types — AI Coding Cost Economics Simulator
// ============================================================
// This file is the single source of truth for all domain types.
// No business logic here — only type definitions and enums.
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export enum ProductCategory {
  AI_CODING_ASSISTANT = 'AI_CODING_ASSISTANT',
  AI_AGENT_PLATFORM = 'AI_AGENT_PLATFORM',
  MODEL_PROVIDER = 'MODEL_PROVIDER',
  IDE_PLUGIN = 'IDE_PLUGIN',
  DEVTOOLS_PLATFORM = 'DEVTOOLS_PLATFORM',
}

export enum PricingMetric {
  SEAT = 'SEAT',
  TOKEN_INPUT = 'TOKEN_INPUT',
  TOKEN_OUTPUT = 'TOKEN_OUTPUT',
  API_CALL = 'API_CALL',
  AGENT_CALL = 'AGENT_CALL',
  MODEL_PROVIDER = 'MODEL_PROVIDER',
  OPERATIONAL = 'OPERATIONAL',
  STORAGE_GB = 'STORAGE_GB',
}

export enum PricingStrategyType {
  FLAT = 'FLAT',
  PER_UNIT = 'PER_UNIT',
  TIERED = 'TIERED',
  INCLUDED_THEN_OVERAGE = 'INCLUDED_THEN_OVERAGE',
}

export enum EventType {
  PRICING_VERSION_CHANGE = 'PRICING_VERSION_CHANGE',
  VENDOR_PRICE_CHANGE = 'VENDOR_PRICE_CHANGE',
  HEADCOUNT_CHANGE = 'HEADCOUNT_CHANGE',
  ADOPTION_CHANGE = 'ADOPTION_CHANGE',
  MIGRATION_EVENT = 'MIGRATION_EVENT',
  SECURITY_REMEDIATION = 'SECURITY_REMEDIATION',
  PROVIDER_MODEL_CHANGE = 'PROVIDER_MODEL_CHANGE',
  BILLING_MODEL_CHANGE = 'BILLING_MODEL_CHANGE',
  AGENT_PRICING_CHANGE = 'AGENT_PRICING_CHANGE',
  TOKENISATION_CHANGE = 'TOKENISATION_CHANGE',
  OPERATIONAL_COST_CHANGE = 'OPERATIONAL_COST_CHANGE',
}

export enum EntityType {
  TOOL = 'TOOL',
  VENDOR = 'VENDOR',
  TEAM = 'TEAM',
  PLATFORM = 'PLATFORM',
}

// ─── Vendor & Product ────────────────────────────────────────

export interface Vendor {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly website?: string
}

export interface Product {
  readonly id: string
  readonly vendorId: string
  readonly name: string
  readonly description: string
  readonly category: ProductCategory
}

// ─── Pricing Domain ──────────────────────────────────────────

export interface TierRate {
  readonly upTo: number // use Infinity for the final open tier
  readonly unitCost: number
}

export interface PricingRule {
  readonly id: string
  readonly metric: PricingMetric
  readonly unitLabel: string
  readonly unitCost: number
  readonly includedUnits?: number
  readonly tieredRates?: readonly TierRate[]
  readonly notes?: string
}

export interface PricingComponent {
  readonly id: string
  readonly metric: PricingMetric
  readonly strategy: PricingStrategyType
  readonly rules: readonly PricingRule[]
}

export interface PricingVersion {
  readonly id: string
  readonly pricingPlanId: string
  readonly effectiveFrom: string // ISO date e.g. "2024-01-01"
  readonly effectiveTo?: string  // ISO date; absent = currently active
  readonly components: readonly PricingComponent[]
  readonly notes?: string
}

export interface PricingPlan {
  readonly id: string
  readonly productId: string
  readonly name: string
  readonly currency: string
  readonly components: readonly PricingComponent[]
  readonly versions: readonly PricingVersion[]
}

// ─── Tool ───────────────────────────────────────────────────

export interface Tool {
  readonly id: string
  readonly productId: string
  readonly label: string
  readonly color: string
  readonly isActive: boolean
}

// ─── AI Model Provider ───────────────────────────────────────

export interface AIModel {
  readonly id: string
  readonly providerId: string
  readonly name: string
  readonly inputTokenCostPer1M: number
  readonly outputTokenCostPer1M: number
  readonly effectiveFrom: string // ISO date
  readonly effectiveTo?: string  // ISO date
}

export interface ModelProvider {
  readonly id: string
  readonly name: string
  readonly models: readonly AIModel[]
}

// ─── Scenario & Configuration ────────────────────────────────

export type AdoptionRuleType = 'linear' | 'exponential' | 'stepped' | 'flat'

export interface AdoptionRule {
  readonly type: AdoptionRuleType
  readonly targetRate: number  // 0–1
  readonly rampMonths: number
  readonly stepMonth?: number  // required for 'stepped' type
}

export interface UsageProfile {
  readonly avgInputTokensPerDevPerMonth: number
  readonly avgOutputTokensPerDevPerMonth: number
  readonly agentCallsPerDevPerMonth: number
  readonly storageGbPerDev: number
  readonly apiCallsPerDevPerMonth: number
}

export interface ToolConfig {
  readonly toolId: string
  readonly pricingPlanId: string
  readonly initialAdoptionRate: number // 0–1
  readonly adoptionRule: AdoptionRule
  readonly usageProfile: UsageProfile
}

export type GrowthRuleType = 'flat' | 'linear' | 'stepped'

export interface GrowthRule {
  readonly type: GrowthRuleType
  readonly monthlyDelta?: number   // for 'linear'
  readonly stepMonth?: number      // for 'stepped'
  readonly stepDelta?: number      // for 'stepped'
}

export interface RiskAssumptions {
  readonly securityRiskLevel: 'low' | 'medium' | 'high'
  readonly migrationRiskLevel: 'low' | 'medium' | 'high'
  readonly notes?: string
}

// ─── Event Payloads (Discriminated Union) ────────────────────

export interface PricingVersionChangePayload {
  readonly newVersionId: string
}

export interface VendorPriceChangePayload {
  readonly newVersionId: string
}

export interface HeadcountChangePayload {
  readonly mode: 'absolute' | 'delta'
  readonly value: number
}

export interface AdoptionChangePayload {
  readonly newRate: number // absolute 0–1
}

export interface MigrationEventPayload {
  readonly cost: number // one-time
}

export interface SecurityRemediationPayload {
  readonly cost: number // one-time
}

export interface ProviderModelChangePayload {
  readonly modelId: string
}

export interface BillingModelChangePayload {
  readonly newVersionId: string
}

export interface AgentPricingChangePayload {
  readonly newVersionId: string
}

export interface TokenisationChangePayload {
  readonly newUsageProfile: UsageProfile
}

export type OperationalCostChangePayload =
  | { readonly recurring: true; readonly costPerMonth: number }
  | { readonly recurring: false; readonly cost: number }

export type EventPayload =
  | ({ type: EventType.PRICING_VERSION_CHANGE } & PricingVersionChangePayload)
  | ({ type: EventType.VENDOR_PRICE_CHANGE } & VendorPriceChangePayload)
  | ({ type: EventType.HEADCOUNT_CHANGE } & HeadcountChangePayload)
  | ({ type: EventType.ADOPTION_CHANGE } & AdoptionChangePayload)
  | ({ type: EventType.MIGRATION_EVENT } & MigrationEventPayload)
  | ({ type: EventType.SECURITY_REMEDIATION } & SecurityRemediationPayload)
  | ({ type: EventType.PROVIDER_MODEL_CHANGE } & ProviderModelChangePayload)
  | ({ type: EventType.BILLING_MODEL_CHANGE } & BillingModelChangePayload)
  | ({ type: EventType.AGENT_PRICING_CHANGE } & AgentPricingChangePayload)
  | ({ type: EventType.TOKENISATION_CHANGE } & TokenisationChangePayload)
  | ({ type: EventType.OPERATIONAL_COST_CHANGE } & OperationalCostChangePayload)

export interface SimulationEvent {
  readonly id: string
  readonly scenarioId: string
  readonly effectiveMonth: number  // 1–24; events never fire at month 0
  readonly priority: number        // lower = earlier execution
  readonly type: EventType
  readonly description: string
  readonly affectedToolIds: readonly string[]
  readonly affectedEntityType: EntityType
  readonly payload: EventPayload
}

export interface Scenario {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly simulationStartDate: string // ISO date e.g. "2024-01-01"
  readonly durationMonths: number
  readonly currency: string
  readonly startingDeveloperCount: number
  readonly developerGrowthRule: GrowthRule
  readonly toolConfigs: readonly ToolConfig[]
  readonly events: readonly SimulationEvent[]
  readonly riskAssumptions: RiskAssumptions
}

// ─── Simulation State ────────────────────────────────────────

export interface ToolSimState {
  readonly toolId: string
  // Adoption
  readonly adoptionRate: number
  readonly adoptionOverridden: boolean
  // Pricing version
  readonly activePricingVersionId: string
  readonly pricingVersionOverridden: boolean
  // Provider
  readonly activeModelProviderId?: string
  // Usage profile (mutable via TOKENISATION_CHANGE)
  readonly usageProfile: UsageProfile
  // One-time pending costs (consumed after each month)
  readonly pendingMigrationCost: number
  readonly pendingSecurityCost: number
  readonly pendingOneTimeOperationalCost: number
  // Recurring operational cost (persists month-to-month)
  readonly recurringOperationalCostPerMonth: number
}

export interface SimulationState {
  readonly month: number
  readonly developerCount: number
  readonly toolStates: Readonly<Record<string, ToolSimState>>
}

// ─── Simulation Results ──────────────────────────────────────

export interface CostBreakdown {
  readonly seatCost: number
  readonly tokenCost: number
  readonly usageCost: number
  readonly agentCost: number
  readonly modelProviderCost: number
  readonly migrationCost: number
  readonly securityRemediationCost: number
  readonly operationalCost: number
  readonly total: number
}

export interface CostExplanation {
  readonly component: string
  readonly formula: string
  readonly inputs: Readonly<Record<string, number>>
  readonly result: number
}

export interface ToolMonthlyResult {
  readonly toolId: string
  readonly adoptionRate: number
  readonly activeUsers: number
  readonly costBreakdown: CostBreakdown
  readonly totalMonthlyCost: number // 0 for month 0
  readonly cumulativeCost: number   // 0 for month 0
  readonly explanation: readonly CostExplanation[]
}

export interface MonthlyResult {
  readonly month: number // 0–24
  readonly developerCount: number
  readonly perToolResults: readonly ToolMonthlyResult[]
  readonly appliedEvents: readonly SimulationEvent[] // empty for month 0
}

export interface SimulationRun {
  readonly id: string
  readonly scenarioId: string
  readonly runAt: string // ISO timestamp
  readonly snapshots: readonly MonthlyResult[] // length = 25, indices 0–24
}

export interface SimulationStep {
  readonly result: MonthlyResult
  readonly nextState: SimulationState
}

// ─── Pricing Engine Inputs ───────────────────────────────────

export interface PricingInputs {
  readonly activeUsers: number
  readonly monthlyInputTokensPerUser: number
  readonly monthlyOutputTokensPerUser: number
  readonly agentCallsPerUser: number
  readonly apiCallsPerUser: number
  readonly storageGbPerUser: number
  readonly simulationMonth: number
  readonly calendarDate: string // ISO date
}

export interface PendingCosts {
  readonly migrationCost: number
  readonly securityRemediationCost: number
  readonly operationalCost: number // pendingOneTimeOperationalCost + recurringOperationalCostPerMonth
}

export interface ComponentResult {
  readonly cost: number
  readonly explanation: CostExplanation
}

// ─── Chart Data Contract ─────────────────────────────────────

export interface ChartDataPoint {
  readonly month: number
  readonly [toolId: string]: number | boolean | string | readonly string[]
  readonly hasEvent: boolean
  readonly eventLabels: readonly string[]
}

// ─── Scenario Config alias (same as Scenario for now) ────────

export type ScenarioConfig = Scenario
