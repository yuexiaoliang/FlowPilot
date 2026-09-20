# FlowPilot

FlowPilot is an intent-first desktop AI automation runtime.

The user describes outcomes and rules in natural language. FlowPilot compiles that intent into structured plans, connects authorized data Sources, executes deterministic workflows, and repairs them when environments change.

> Natural language describes intent. Structured plans execute it. UI appears when humans need to observe, choose, approve, or intervene.

## Product principles

**Simple by default. Transparent on demand.**

- natural language/Markdown is the primary authoring surface
- users write semantics; the system stores internal references
- no required user-facing DSL
- default UI minimizes cognitive load
- professional inspection remains available for trust/debugging
- deterministic execution is preferred once a Flow is known
- AI is used for interpretation, discovery, and repair rather than routine known execution

## Core model

- **Goal** — the outcome the user wants
- **Task** — when and under what rules to pursue a Goal
- **Source** — an explicitly authorized data boundary
- **InputBundle** — immutable inputs resolved for one Run
- **Flow** — versioned executable strategy
- **Run** — one concrete execution with provenance
- **Human Takeover** — explicit pause/resume for login, verification, or risky decisions

## Technology baseline

- Electron
- TypeScript
- React + Vite
- WebContentsView
- BrowserDriver abstraction
- Playwright for testing/dev adapters
- SQLite
- Zod
- pnpm workspaces
- Vitest + Playwright Test
- GitHub Actions

Architecture changes require an ADR.

## Development model

FlowPilot is **document-driven, not Issue-driven**.

The repository is the shared memory for all human and AI contributors.

Start here:

- [AGENTS.md](./AGENTS.md) — non-negotiable rules
- [docs/PROJECT-STATE.md](./docs/PROJECT-STATE.md) — current phase and next recommended slice
- [docs/DEVELOPMENT-PLAN.md](./docs/DEVELOPMENT-PLAN.md) — canonical delivery order
- [docs/ACCEPTANCE.md](./docs/ACCEPTANCE.md) — gate/definition of done
- [docs/AGENT-OPERATING-PROTOCOL.md](./docs/AGENT-OPERATING-PROTOCOL.md) — multi-agent execution protocol
- [docs/AGENT-START-PROMPT.md](./docs/AGENT-START-PROMPT.md) — minimal prompt for a new agent
- [docs/TASK-PACKET-TEMPLATE.md](./docs/TASK-PACKET-TEMPLATE.md) — bounded assignment template
- [docs/HANDOFF-TEMPLATE.md](./docs/HANDOFF-TEMPLATE.md) — agent handoff format

Product/design/runtime references:

- [docs/PRODUCT-MODEL.md](./docs/PRODUCT-MODEL.md)
- [docs/NATURAL-LANGUAGE-UX.md](./docs/NATURAL-LANGUAGE-UX.md)
- [docs/TASK-SOURCE-RUNTIME.md](./docs/TASK-SOURCE-RUNTIME.md)
- [docs/TECH-STACK.md](./docs/TECH-STACK.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/WORKFLOW-IR.md](./docs/WORKFLOW-IR.md)
- [docs/SECURITY.md](./docs/SECURITY.md)
- [docs/adr/](./docs/adr/)

## Current delivery sequence

```
D0 Design Contract
→ P0 Interactive Mock Prototype
→ E0 Engineering Foundation
→ E1 Intent Compiler
→ E2 Source / InputBundle
→ E3 Deterministic Workflow Runtime
→ E4 AI Discovery / Repair
→ E5 Human Takeover / Risk
→ E6 WeChat MVP
```

See `PROJECT-STATE.md` for the current gate.

## Minimal instruction for another agent

You should be able to give a repository-aware agent only this:

> Continue FlowPilot according to the repository plan. Read AGENTS.md and the canonical project documents first, determine the current phase from docs/PROJECT-STATE.md, complete one bounded unfinished slice, validate it against docs/ACCEPTANCE.md, update project state if needed, and leave a handoff.

The maintainer should not need to restate project history or technology choices.
