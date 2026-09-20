# FlowPilot Project State

This file is the canonical snapshot of **where the project is now**.

Keep it concise and current. Detailed history belongs in Git history, ADRs, design docs, or run artifacts.

Last architectural/product planning update: 2026-09-20

## Current phase

**D0 — Design Contract**

Status: IN PROGRESS

The product direction is approved:

> Simple by default. Transparent on demand.

> Users write semantics; the system stores references.

> Natural language is the control plane. Structured plans/workflows execute it. UI appears when humans need to observe, choose, compare, approve, or intervene.

## What is already decided

### Product model
Approved:
- Goal = desired outcome
- Task = when/rules for pursuing a Goal
- Source = explicitly authorized data boundary
- InputBundle = immutable inputs for one Run
- Flow = versioned executable strategy
- Run = one concrete execution with provenance

Canonical: `PRODUCT-MODEL.md`

### UX model
Approved:
- intent-first, not dashboard-first
- natural-language/Markdown authoring
- no required user-facing FlowPilot DSL
- default UI is extremely simple
- professional/technical transparency is available on demand
- progressive disclosure instead of permanently visible complexity
- contextual/ephemeral UI primitives rather than giant settings forms

Canonical: `NATURAL-LANGUAGE-UX.md`

### Visual direction
Approved direction:
- light, calm, modern desktop UI
- spacious layout
- minimal navigation
- natural-language intent surface as primary entry
- understanding review as structured explanation, not configuration form
- detailed execution/provenance behind expandable professional inspection
- prior dense SaaS/dashboard explorations are reference-only, not canonical

### Technology
Approved baseline:
- Electron
- TypeScript
- React + Vite
- WebContentsView
- BrowserDriver abstraction
- Playwright for testing/dev adapters
- SQLite
- Zod
- pnpm
- Vitest + Playwright Test

Canonical: `TECH-STACK.md`, ADR-0001

## Current deliverable

Create the **Design Contract** that future implementation agents can follow without redesigning the product.

Required artifacts:
- `design/README.md`
- `design/DESIGN-PRINCIPLES.md`
- `design/DESIGN-SYSTEM.md`
- `design/INTERACTION-MODEL.md`
- `design/COMPONENTS.md`
- `design/SCREEN-SPECS.md`
- `design/FLOWS.md`

The contract must cover at least:
- Intent Home
- AI Understanding Review
- contextual Source Connection
- Input Preview
- Execution
- Confirmation / Human Takeover
- Result
- progressive transparency / Inspector

## Gate after D0

**P0 — Interactive Mock Prototype**

Build an Electron + React prototype using mock services only.

The prototype should demonstrate the entire golden path without real AI, real WeChat, real Git parsing, or production automation.

Golden path:

```
Intent
→ Understanding
→ Source resolution
→ Input preview
→ Run
→ Human confirmation
→ Success
→ Inspect details
```

## Do not start yet

Until D0 and P0 are accepted, do not spend significant effort on:
- real WeChat integration
- AI repair
- production BrowserDriver/CDP behavior
- complex SQLite persistence
- cloud runner
- analytics/dashboard features
- template marketplace
- team/billing features

## Known open design questions

These should be resolved in D0/P0, not prematurely in backend code:
- exact minimal navigation model
- how Intent documents are represented in the main workspace
- depth/placement of professional Inspector
- how semantic entity bindings are visually indicated without exposing IDs
- how much structured understanding is shown before confirmation
- how editing an existing Task returns to natural-language source vs generated interpretation

## Recommended next slice

**D0.1 — Design principles + interaction hierarchy**

Formalize:
- "Simple by default, transparent on demand"
- Simple / Execution / Inspection layers
- progressive disclosure rules
- navigation rules
- when contextual UI appears
- which details are forbidden from default surfaces

Then proceed to component and screen specifications.
