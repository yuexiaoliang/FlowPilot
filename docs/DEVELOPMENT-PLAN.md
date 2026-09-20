# FlowPilot Development Plan

This document is the canonical implementation sequence.

FlowPilot is developed through **gates**, not feature accumulation. A later phase starts only when the current phase has acceptance evidence in `ACCEPTANCE.md`.

GitHub Issues are optional. The repository documents are the source of truth.

---

# Delivery model

```
D0 Design Contract
        ↓
P0 Interactive Mock Prototype
        ↓
E0 Engineering Foundation
        ↓
E1 Intent Compiler (Goal / Task)
        ↓
E2 Source / InputBundle / Scheduling Semantics
        ↓
E3 Deterministic Workflow Runtime
        ↓
E4 AI Discovery / Repair
        ↓
E5 Human Takeover / Risk
        ↓
E6 WeChat Official Accounts MVP
        ↓
H0 Hardening / Runner / Expansion
```

The reason for this order is deliberate:

1. validate the product interaction before building infrastructure
2. keep human-facing semantics separate from machine execution
3. prove deterministic execution before adding self-healing AI
4. validate safety/intervention before real-platform expansion

---

# D0 — Design Contract

## Objective

Turn approved product principles and visual direction into an implementation-ready contract so future agents do not redesign FlowPilot while coding it.

## Required artifacts

Create under `design/`:

- `README.md`
- `DESIGN-PRINCIPLES.md`
- `DESIGN-SYSTEM.md`
- `INTERACTION-MODEL.md`
- `COMPONENTS.md`
- `SCREEN-SPECS.md`
- `FLOWS.md`

## Must encode

- Simple by default, transparent on demand
- intent-first, not dashboard-first
- natural language/Markdown is the primary authoring surface
- no required user-facing DSL or IDs
- progressive disclosure
- contextual/ephemeral UI
- professional Inspector available on demand
- minimal navigation
- clear separation of Simple / Execution / Inspection surfaces

## Golden screens

At minimum specify:

1. Intent Home
2. AI Understanding Review
3. contextual Source Connection
4. Input Preview
5. Execution
6. Confirmation / Human Takeover
7. Result
8. Inspector / professional detail
9. Repair Diff
10. existing Task/Goal view

## Exit

Acceptance D0.

---

# P0 — Interactive Mock Prototype

## Objective

Validate the product experience before connecting production infrastructure.

Build a real Electron + React desktop prototype with **mock services only**.

## Golden path

```
Intent
→ AI Understanding
→ Source resolution
→ Input preview
→ Run
→ Human confirmation
→ Success
→ Inspect details
```

## Mock only

Do not require:
- real LLM calls
- real WeChat
- production BrowserDriver
- real scheduler
- complex SQLite
- real Git parsing

Use deterministic mock fixtures.

## Prototype behavior

The user should be able to type naturally:

```md
每天早上 8 点检查我的行业学习仓库。

如果今天有新的文章，就发布到微信公众号。

正式发布之前让我确认。
```

The prototype should:
- present FlowPilot's structured understanding
- request Source connection only when missing
- show an input preview
- simulate execution
- pause for confirmation
- complete successfully
- reveal professional details only when requested

## Exit

Acceptance P0.

---

# E0 — Engineering Foundation

## Objective

Create a deterministic repository/runtime foundation suitable for multi-agent development.

## Deliverables

- pnpm workspace
- pinned Node/pnpm policy
- strict TypeScript
- Electron main/preload/renderer
- React + Vite
- ESLint + Prettier
- Vitest
- Playwright Test
- typed IPC skeleton
- secure Electron defaults
- GitHub Actions
- local deterministic fixture web application

Required root commands:

```
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm package
```

Fixture variants:
- normal flow
- changed DOM/layout
- ambiguous/interstitial
- auth expired
- security challenge
- upload
- publish success/failure

## Exit

Acceptance E0.

---

# E1 — Intent Compiler: Goal and Task

## Objective

Compile ordinary natural-language/Markdown intent into versioned structured plans without exposing machine syntax to users.

## Goal

Implement:
- Goal source/revisions
- GoalPlan schema
- intent
- required/optional inputs
- success/non-success criteria
- human confirmation/intervention policy

## Task

Implement:
- Task source/revisions
- TaskPlan schema
- semantic Goal reference
- schedule interpretation
- Source references
- selection rules
- policies
- source-hash → compiled-plan linkage

## Semantic resolution

Natural-language phrases resolve to stable internal entities.

Unambiguous:
- bind silently

Materially ambiguous:
- produce contextual clarification UI

Never require ordinary users to write:
- `@goal/...`
- `@source/...`
- UUIDs
- cron
- selectors
- retry DSL

## Provider boundary

Use provider-neutral structured-model interfaces.

Initially support deterministic fake providers/fixtures for tests before real providers.

## Exit

Acceptance E1.

---

# E2 — Source, InputBundle, and Scheduling Semantics

## Objective

Connect authorized external data to Tasks reproducibly and safely.

## Initial Sources

- Local Folder
- Local Git Repository

## Source rules

- explicit user authorization
- scoped root
- read-only by default
- no arbitrary filesystem expansion from prose
- provider interface isolated from domain model

## InputBundle

Before execution:

```
Task trigger
→ resolve Source
→ select content
→ bind Goal inputs
→ capture immutable provenance
→ validate
→ create InputBundle
```

A running Flow must not silently reread changing Source files.

Git provenance:
- source ID
- branch/ref
- exact commit SHA
- selected paths
- content hashes

## Idempotency

Recurring irreversible actions require deterministic duplicate prevention and consumption records.

A failed run must not falsely mark source input consumed.

## Schedule semantics

Compile natural language to normalized schedules with explicit timezone.

Support at least:
- SKIP missed schedule
- RUN_ON_NEXT_START

Runtime-active local scheduling is sufficient at this phase. Background daemon/cloud runner is deferred.

## Exit

Acceptance E2.

---

# E3 — Deterministic Workflow Runtime

## Objective

Execute a known Flow repeatedly without AI.

## Workflow IR

Implement:
- Flow
- immutable FlowRevision
- Step
- TargetDescriptor
- Condition
- Action
- RetryPolicy
- RepairPolicy
- typed error taxonomy

## BrowserDriver

Minimum surface:
- navigate
- snapshot
- find
- click
- fill
- upload
- waitFor
- screenshot

Runtime/domain code must not import Electron, Playwright, or CDP directly.

## ElectronDriver

Back BrowserDriver with WebContentsView/webContents/CDP as needed.

## Execution

Each meaningful Step:

```
precondition
→ target resolution
→ action
→ transition/wait
→ postcondition
→ evidence
```

Absence of an exception is not success.

## State machine

At least:
- PENDING
- PREPARING
- RUNNING
- VERIFYING
- SUCCEEDED
- FAILED
- CANCELLED

## Exit

Acceptance E3.

---

# E4 — AI Discovery and Repair

## Objective

Learn a Flow from a Goal and repair only failing regions when the environment changes.

## Discovery

Pipeline:

```
GoalPlan
+ sanitized page state
+ allowed actions
→ structured proposal
→ schema validation
→ policy validation
→ trial
→ persisted Flow revision
```

## Repair

RepairContext contains:
- typed failure
- failed Step
- last successful checkpoint
- bounded neighboring context
- expected target state
- sanitized page snapshot
- platform hints

Preferred output:
- smallest viable patch

A successful repair creates a new immutable Flow revision.

## Required proof

```
learn fixture v1
→ run with no AI
→ switch fixture to v2
→ typed failure
→ local repair
→ validate
→ revision N+1
→ next run succeeds with no AI
```

## Exit

Acceptance E4.

---

# E5 — Human Takeover and Risk

## Objective

Handle user/security intervention explicitly and safely.

## Risk taxonomy

At least:
- LOGIN_REQUIRED
- QR_REQUIRED
- CAPTCHA
- MFA_REQUIRED
- SECURITY_CHALLENGE
- ACCOUNT_WARNING
- RATE_LIMIT
- PERMISSION_DENIED
- DESTRUCTIVE_ACTION_CONFIRMATION
- UNKNOWN_INTERSTITIAL

## Runtime states

Add:
- PAUSED_HUMAN
- RETRY_WAIT
- REPAIRING

## Takeover

User can:
- take control
- complete login/verification/manual decision
- return control

Resume only after fresh snapshot + recognized safe state.

No CAPTCHA/MFA/security bypass.

## Exit

Acceptance E5.

---

# E6 — WeChat Official Accounts MVP

## Objective

Apply the proven model/runtime to the first real platform.

## Scope

- add account/platform
- manual QR login
- persistent account session
- learn article publishing
- title
- body
- cover
- summary when applicable
- publish confirmation
- success verification
- repair evidence

No production account in CI.

No stealth/fingerprint/CAPTCHA/MFA bypass.

## Exit

Acceptance E6.

---

# H0 — Hardening and Expansion

Only after E6:

- crash recovery
- resumable runs
- local background runner/daemon
- scheduler robustness
- application updates
- workflow/run Inspector polish
- diagnostics export with redaction
- compatibility matrix
- performance/memory profiling
- signed installers
- additional platforms
- official API-backed actions
- optional cloud runner
- team features

Any major expansion gets its own plan/ADR.

---

# How an agent chooses work

Unless explicitly assigned:

1. read `AGENTS.md`
2. read `PROJECT-STATE.md`
3. read this plan
4. read `ACCEPTANCE.md`
5. choose the smallest unfinished slice in the current phase
6. use `TASK-PACKET-TEMPLATE.md`
7. implement
8. validate
9. update PROJECT-STATE if current truth changed
10. leave a handoff

Do not jump to a later phase without gate evidence.
