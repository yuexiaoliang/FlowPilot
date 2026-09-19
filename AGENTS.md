# AGENTS.md

This file is mandatory reading for every coding agent working on FlowPilot.

Before coding, also read:
- `docs/DEVELOPMENT-PLAN.md`
- `docs/ACCEPTANCE.md`
- `docs/AGENT-WORKFLOW.md`
- relevant architecture/security/domain documentation and ADRs

FlowPilot is **document-driven, not Issue-driven**. GitHub Issues are optional coordination artifacts and are not the source of truth for implementation order or acceptance.

## Mission

Build FlowPilot as a reliable desktop workflow runtime. The product learns web workflows with AI, persists them, executes them deterministically, and repairs only the failed region when websites change.

The architecture must remain usable without any particular LLM vendor, browser automation library, or target platform.

## Non-negotiable rules

1. **Deterministic runtime first.** Never add an LLM call to a normal happy-path step when a deterministic action/validator can do the job.
2. **AI does discovery and repair, not routine execution.**
3. **All browser operations go through BrowserDriver.** Feature code must not call Electron webContents, CDP, or Playwright directly outside driver implementations/adapters.
4. **Workflow data is versioned and schema-validated.** Never silently mutate an existing persisted Flow.
5. **Preconditions and postconditions are mandatory for meaningful workflow steps.** A click is not successful merely because it did not throw.
6. **Repair is local.** Repair the smallest failing region; do not regenerate an entire working Flow by default.
7. **Human takeover is a first-class runtime state.** CAPTCHA, MFA, QR login, security challenges, account warnings, legal/consent screens, and ambiguous destructive actions must pause for the user.
8. **No bot-evasion features.** Do not implement fingerprint spoofing, CAPTCHA bypass, webdriver concealment, anti-bot circumvention, or behavior intended to defeat platform security controls.
9. **Remote web content is untrusted.** Never expose Node.js, filesystem, shell, arbitrary IPC, or secrets to embedded third-party pages.
10. **Secrets never enter prompts by default.** Cookies, tokens, passwords, auth headers, session stores, and API keys must be redacted/excluded before AI context construction.
11. **No architecture drift without an ADR.** Changing Electron, React, WebContentsView, BrowserDriver boundaries, persistence model, or Workflow IR requires a documented Architecture Decision Record.
12. **Do not broaden the MVP until the learn → run → fail → repair → rerun loop is proven.**
13. **Do not add microservices, Redis, cloud infrastructure, or a remote database for the local MVP without an approved requirement.**
14. **Prefer boring dependencies.** Add a dependency only when it removes meaningful complexity; record why in the PR/handoff.
15. **No hidden fallback.** If a validator, repair, or browser action is uncertain, surface a typed failure rather than pretending success.

## Source-of-truth order

When instructions conflict, use this order:

1. direct maintainer decision
2. accepted ADR
3. `docs/ACCEPTANCE.md`
4. `docs/DEVELOPMENT-PLAN.md`
5. architecture/security/domain documentation
6. GitHub Issues or task notes

An Issue may add scope or stricter criteria, but must not silently weaken canonical acceptance rules.

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
AI interfaces ← discovery/repair only
```

Forbidden:
- renderer importing Electron main-process implementation
- workflow-core importing React/Electron
- platform adapters bypassing BrowserDriver
- AI provider SDK types leaking into domain models
- database row types becoming public domain types

## Implementation style

- TypeScript strict mode; avoid `any`. When unavoidable at an external boundary, validate immediately and narrow.
- Zod schemas define untrusted/persisted/external inputs.
- Domain code uses explicit result/error types or typed exceptions; do not rely on string matching.
- Prefer small pure functions for state evaluation and workflow compilation.
- IDs are stable and opaque.
- Store timestamps in UTC ISO-8601.
- Platform-specific behavior belongs in adapters/capabilities, not generic runtime logic.
- Selectors are hints, not truth. Prefer semantic targets and validators.
- Every network/AI/browser operation must support timeout/cancellation.
- Logs must be structured and redact sensitive fields.

## Required tests for changes

At minimum:
- domain/IR changes: unit tests + schema migration/compatibility tests
- executor changes: deterministic runtime tests
- driver changes: driver contract tests
- database changes: migration tests
- IPC changes: contract tests
- repair/discovery changes: fixture-based tests with recorded/synthetic snapshots
- user-visible critical path changes: Playwright E2E where feasible

Never use a live production account in CI.

## Workflow change protocol

When changing Workflow IR:
1. update `docs/WORKFLOW-IR.md`
2. update Zod schema/types
3. add migration/compatibility logic
4. update fixtures
5. add tests for old and new versions
6. document compatibility impact

## Database change protocol

Never edit an applied migration. Add a new migration. The app must either migrate atomically or leave the prior database usable.

## Agent handoff

Before ending work, leave the repository in a state another agent can understand:
- tests/lint/typecheck status reported
- completed acceptance criteria mapped to `docs/ACCEPTANCE.md`
- unfinished work documented in the handoff, plan note, or optionally an Issue
- no unexplained generated files
- no secrets/auth state committed
- architecture-affecting decisions documented
- README/docs updated when behavior or commands change

Follow the handoff format in `docs/AGENT-WORKFLOW.md`.

## Definition of done

A task is done only when implementation, tests, validation, failure behavior, documentation, and the applicable acceptance criteria agree. "Works on my machine" is not sufficient.
