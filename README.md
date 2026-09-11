# AI Coding Cost Economics Simulator

A browser-based simulation tool for modelling the total cost of ownership (TCO) of AI-assisted coding tools over a 24-month horizon.

## What It Does

The simulator helps engineering leaders and finance teams understand and compare the economics of adopting AI coding tools across three realistic scenarios:

| Scenario | Description |
|---|---|
| **Modernisation** | A software modernisation programme rolls out AI tooling incrementally across a growing team |
| **Agentic Shift** | Rapid adoption of agentic (autonomous) AI workflows drives high token consumption |
| **Sovereignty First** | Security and compliance constraints restrict external API usage, favouring on-premises models |

Each scenario runs a 24-month discrete-time simulation with configurable:
- Developer population growth
- Tool adoption curves
- Pricing plan changes (seat-based, token-based, usage-based, hybrid)
- Contractual and market events (price increases, model releases, vendor changes)

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18, TypeScript 5, Tailwind CSS v4 |
| State | Zustand 5 |
| Charts | Recharts 2 |
| Validation | Zod 3 |
| Build | Vite 6 |
| Tests | Vitest 2, Testing Library |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

Output is placed in `dist/`.

### Run tests

```bash
npm run test:run      # Single run (CI)
npm test              # Watch mode
npm run test:coverage # Coverage report
```

### Type-check / lint

```bash
npm run lint
```

## Project Structure

```
src/
├── app/            # Root application shell (App.tsx)
├── components/     # Shared layout components (Header, Layout)
├── data/           # Static scenario, tool, and pricing data
├── domain/         # TypeScript types and Zod schemas only
├── engine/         # Pure TS simulation engine (no DOM, no React)
├── features/       # React UI feature components
├── hooks/          # React hooks that derive data from stores
├── state/          # Zustand stores
├── styles/         # Global CSS (Tailwind v4)
└── utils/          # Pure utility functions (currency, dates, math)
tests/
├── engine/         # Unit tests for engine functions
├── pricing/        # Unit tests for pricing calculators
├── scenarios/      # Golden-snapshot integration tests
└── integration/    # Full simulation run tests

```

## Architecture

The codebase enforces a strict layered dependency order:

```
domain → data → engine → state → hooks → features/app
```

- **Engine layer** is pure TypeScript — no DOM, no React, no side effects.
- **Data layer** contains only static configuration — no runtime fetching.
- **All pricing/scenario data is fictional** and intended for modelling purposes only.

## Important Notes

- All pricing data is **fictional and illustrative**. It does not reflect actual vendor pricing.
- No backend, authentication, or external API calls are present in this version.
- No personal data is collected or processed.


