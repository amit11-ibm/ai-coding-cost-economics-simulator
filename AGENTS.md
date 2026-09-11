# AGENTS.md (Agent / Coding Mode)

This file provides guidance to agents when writing or modifying code in this repository.

## Status

✅ MVP fully scaffolded and implemented.

## Commands

```bash
npm run dev           # Vite dev server (http://localhost:5173)
npm run build         # tsc -b && vite build → dist/
npm run test:run      # Single vitest run (CI)
npm test              # Watch mode
npm run test:coverage # Coverage report
npm run lint          # TypeScript type check (tsc --noEmit)
```

## Architecture

- **Engine layer** (`src/engine/`): Pure TypeScript functions only. No DOM, no imports from `src/state` or `src/features`.
- **Domain layer** (`src/domain/`): Type definitions and Zod schemas only. No logic.
- **Data layer** (`src/data/`): Static scenario, tool, and pricing data. May only import from `src/domain/`.
- **State layer** (`src/state/`): Zustand stores. May import from engine and data layers.
- **UI layer** (`src/features/`, `src/app/`): React components. May only import from state layer and hooks.
- **Hooks** (`src/hooks/`): React hooks that derive data from state stores. No business logic.

## Key Coupling Points

- `runSimulation(config, pricingPlanMap)` — the engine requires `pricingPlanMap` to be passed explicitly. The `pricingPlanMap` is defined in `src/data/pricing-plans.ts`.
- `simulateMonth` has the same signature. The simulation store assembles both before calling.
- `ToolSimState.usageProfile` is always used for `PricingInputs`, never `ToolConfig.usageProfile` directly — `TOKENISATION_CHANGE` events replace the state copy.
- Pending one-time costs are reset to `0` in `nextState` by `simulateMonth` — this is the consume-once mechanism.
- `recurringOperationalCostPerMonth` is never reset — it persists until replaced.

## Domain Conventions

- All currency amounts are plain USD `number` (no microdollars, no fixed-point integers).
- Token costs are per-1M-tokens (divide by 1_000_000 in the calculator).
- `effectiveFrom` / `effectiveTo` on `PricingVersion` are ISO date strings: `YYYY-MM-DD`.
- Simulation start date is `"2024-01-01"` for all three MVP scenarios.
- Month 0 = baseline (costs always $0). Months 1–24 = billing periods.

## Test Patterns

- Golden test snapshots are stored in `tests/scenarios/__snapshots__/` — do not edit manually.
- All engine tests use `node` environment (no DOM).
- Scenario integration tests import from `src/data/` and `src/engine/` only.

## No-Nos

- Do NOT add `tailwind.config.ts` — Tailwind v4 uses CSS-only config.
- Do NOT call `computeAdoption()` when `adoptionOverridden === true`.
- Do NOT mutate `ToolConfig.usageProfile` — always copy to `ToolSimState.usageProfile`.
- Do NOT add backend, auth, real vendor billing, scraping, LLMs, or IDE plugins to this MVP.
