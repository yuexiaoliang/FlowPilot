# AGENTS.md

This file is mandatory reading for every agent working on FlowPilot.

## Required reading order

Before doing any work, read:

1. `docs/PROJECT-STATE.md`
2. `docs/DEVELOPMENT-PLAN.md`
3. `docs/ACCEPTANCE.md`
4. `docs/AGENT-OPERATING-PROTOCOL.md`
5. `docs/PRODUCT-MODEL.md`
6. `docs/NATURAL-LANGUAGE-UX.md`
7. `docs/TASK-SOURCE-RUNTIME.md`
8. relevant design/architecture/security/domain docs and ADRs

FlowPilot is **document-driven, not Issue-driven**. GitHub Issues are optional coordination artifacts.

## Mission

Build FlowPilot as an intent-first desktop automation runtime.

The user expresses desired outcomes and rules in natural language/Markdown. FlowPilot compiles that intent into structured plans, resolves authorized data Sources, executes deterministic versioned Flows, and uses AI for interpretation, discovery, and repair where appropriate.

The architecture must remain usable without any particular LLM vendor, browser automation library, or target platform.

## Non-negotiable product rules

1. **Simple by default, transparent on demand.**
2. **Natural language is the control plane.** Ordinary users must not be required to author internal IDs, `@goal/...`, `@source/...`, cron syntax, selectors, workflow nodes, or another FlowPilot DSL.
3. **Users write semantics; the system stores references.**
4. **Keep Goal, Task, Source, InputBundle, Flow, and Run separate.**
5. **UI is contextual, not configuration-first.** Prefer natural-language authoring plus concise understanding review and contextual UI primitives over permanent forms.
6. **Professional detail must remain inspectable.** Simplicity must not become a black box.
7. **Do not redesign approved product direction while implementing.** Follow the current design gate and written design contracts.

## Non-negotiable runtime rules

8. **Deterministic runtime first.** Do not add an LLM call to a known happy-path step when deterministic execution can do it.
9. **All browser operations go through BrowserDriver.**
10. **Workflow data is versioned and schema-validated.**
11. **Meaningful Steps require preconditions/postconditions.**
12. **Repair is local by default.**
13. **Human takeover is a first-class runtime state.**
14. **No bot-evasion features.** No CAPTCHA bypass, fingerprint spoofing, webdriver concealment, or anti-bot circumvention.
15. **Remote web content is untrusted.**
16. **Secrets do not enter prompts by default.**
17. **Source permissions are scoped and explicit.**
18. **Resolve Source data before execution.** A Run uses an immutable InputBundle; do not silently reread changing files mid-run.
19. **Scheduled irreversible actions require idempotency/deduplication.**
20. **No hidden fallback.** Uncertainty becomes a typed failure/clarification/intervention, not pretend success.

## Architecture change rule

No architecture drift without an ADR.

Changing any locked baseline such as:
- Electron
- React
- WebContentsView
- BrowserDriver boundary
- persistence model
- Workflow IR semantics
- trust/security boundaries

requires a documented decision and coordinated doc updates.

## Source-of-truth order

When instructions conflict:

1. direct maintainer decision
2. accepted ADR
3. `docs/ACCEPTANCE.md`
4. `docs/DEVELOPMENT-PLAN.md`
5. `docs/PROJECT-STATE.md` for current phase/status
6. product/design/architecture/security docs
7. Task Packets
8. GitHub Issues/task notes

A Task Packet or Issue may be stricter, but cannot silently weaken canonical rules.

## Layer boundaries

Expected dependency direction:

```
renderer UI
   ↓ IPC/contracts
desktop application services
   ↓
workflow runtime ──→ BrowserDriver interface
   ↓                     ↑
domain/storage       ElectronDriver / PlaywrightDriver
   ↓
AI interfaces ← interpretation/discovery/repair only
```

Forbidden:
- renderer importing Electron main implementation
- workflow/domain importing React/Electron
- platform adapters bypassing BrowserDriver
- AI provider SDK types leaking into domain models
- database row types becoming public domain types

## Implementation style

- TypeScript strict mode
- avoid unexplained `any`
- validate untrusted/persisted/model inputs with runtime schemas
- use typed errors/results at boundaries
- prefer small pure functions for compilation/state evaluation
- stable opaque IDs internally
- UTC ISO-8601 timestamps internally; explicit user timezone for schedules
- structured redacted logs
- timeout/cancellation for network/AI/browser operations

## Required validation

At minimum where applicable:
- domain/IR changes: unit + compatibility tests
- executor: deterministic runtime tests
- drivers: contract tests
- DB: migration tests
- IPC: contract tests
- discovery/repair: fixture-based tests
- critical UI flow: E2E/manual design-contract evidence
- design work: map explicitly to D0 acceptance criteria

Never use a live production account in CI.

## Agent execution

Follow `docs/AGENT-OPERATING-PROTOCOL.md`.

Use `docs/TASK-PACKET-TEMPLATE.md` for a bounded slice when useful.

At the end, use `docs/HANDOFF-TEMPLATE.md`.

If the maintainer says only:

> Continue FlowPilot according to the repository plan.

you must be able to identify the current phase and next appropriate slice from the repository.

## Definition of done

A task is done only when:
- implementation/design artifact exists
- relevant validation was actually performed
- applicable acceptance criteria are mapped to evidence
- project state is updated when current truth changed
- handoff is left for the next agent

"Works on my machine" or "looks good" is not sufficient.
