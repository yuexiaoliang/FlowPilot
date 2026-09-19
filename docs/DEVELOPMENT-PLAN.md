# FlowPilot Development Plan

This document is the **source of truth for implementation order**.

GitHub Issues may mirror items in this plan for tracking, but development is not required to start from or be organized around Issues. If an Issue conflicts with this document, this document wins unless an accepted ADR or a direct maintainer decision updates it.

## Working model

Development is organized into milestones and vertical slices.

Each slice must:
1. have a clearly defined input/output boundary
2. be independently testable
3. preserve repository architecture rules
4. include tests before being considered complete
5. satisfy the matching acceptance criteria in [ACCEPTANCE.md](./ACCEPTANCE.md)

Agents should work on the smallest coherent slice that moves the current milestone toward its exit criteria.

---

# Milestone 0 — Repository foundation

## Objective

Create a deterministic desktop development environment that any developer or coding agent can clone, install, test, build, and launch.

## Deliverables

### 0.1 Workspace bootstrap

Create:
- pnpm workspace
- root package.json
- pinned Node version policy
- pinned pnpm version
- TypeScript strict config
- shared tsconfig
- ESLint
- Prettier
- Vitest
- basic root scripts

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

### 0.2 Desktop shell

Create:
- Electron main process
- preload
- React renderer
- Vite build
- BrowserWindow
- safe default Electron security configuration

Renderer must not have Node integration.

### 0.3 Typed IPC boundary

Create initial typed request/event contracts.

Do not expose a generic IPC invocation function to Renderer.

### 0.4 CI

GitHub Actions must run:
- install
- typecheck
- lint
- unit tests
- build

Packaging smoke testing may initially be platform-limited but must be automated before release work.

### 0.5 Local fixture application

Build a small deterministic fake publishing platform.

It must support selectable states/versions:
- v1 normal flow
- v2 DOM/layout change
- v3 extra interstitial/ambiguity
- logged-out/auth-expired
- security challenge
- upload
- publish success
- publish failure

## Milestone exit

See Acceptance A0.

---

# Milestone 1 — Workflow runtime without AI

## Objective

Prove that FlowPilot can deterministically execute a known persisted workflow.

## Deliverables

### 1.1 Workflow IR v1

Implement:
- Flow
- FlowRevision
- Step
- TargetDescriptor
- Condition
- Action
- RetryPolicy
- RepairPolicy
- typed errors

Use Zod as the persisted/external schema boundary.

### 1.2 BrowserDriver v1

Minimum capabilities:
- navigate
- snapshot
- find
- click
- fill
- upload
- waitFor
- screenshot

Runtime/domain code must not import Electron, CDP, or Playwright.

### 1.3 ElectronDriver

Implement BrowserDriver using WebContentsView/webContents/CDP as needed.

### 1.4 Executor

Every meaningful step follows:

```
precondition
→ target resolution
→ action
→ wait/transition
→ postcondition
→ evidence
```

No thrown error does not equal success.

### 1.5 Run state machine

Implement at least:

```
PENDING
PREPARING
RUNNING
VERIFYING
SUCCEEDED
FAILED
CANCELLED
```

Later milestones add PAUSED_HUMAN, REPAIRING, RETRY_WAIT.

## Milestone exit

See Acceptance A1.

---

# Milestone 2 — Persistence and account sessions

## Objective

Persist application state and isolated platform identities across app restarts.

## Deliverables

### 2.1 SQLite persistence

Create migrations and repositories for:
- platforms
- accounts
- flows
- flow_versions
- runs
- run_steps
- repair_attempts
- publish_jobs

### 2.2 Account isolation

Each account gets an isolated persistent Electron session/partition.

### 2.3 Session lifecycle

Support:
- create account session
- load account session
- detect likely logged-in/logged-out state
- clear account session
- remove account locally

### 2.4 Secret abstraction

Secrets must not be stored as ordinary plaintext domain fields.

Use OS-backed secure storage where appropriate.

## Milestone exit

See Acceptance A2.

---

# Milestone 3 — AI Discovery

## Objective

Allow AI to learn a new workflow, compile it into Workflow IR, and then execute that workflow without AI.

## Deliverables

### 3.1 Provider-neutral model interface

Domain/runtime code must not depend on an OpenAI/Anthropic/etc SDK.

### 3.2 Sanitized page snapshot pipeline

Before model calls:
- remove auth/session material
- redact secret-like values
- bound page text
- identify sensitive form fields
- expose semantic page structure where possible

### 3.3 Structured discovery

Input:
- user goal
- sanitized page state
- current platform state
- allowed actions

Output:
- schema-validated workflow proposal

### 3.4 Compilation and validation

AI output must never directly become a trusted stored Flow.

Pipeline:

```
AI proposal
→ schema validation
→ policy validation
→ workflow compilation
→ trial/verification
→ persisted revision
```

## Milestone exit

See Acceptance A3.

---

# Milestone 4 — Repair loop

## Objective

Prove FlowPilot's central loop:

```
Learn → Run → Fail → Repair → Validate → Version → Run
```

## Deliverables

### 4.1 Failure classifier

Classify typed failures:
- target not found
- target ambiguous
- precondition failed
- postcondition failed
- unexpected navigation
- auth required
- security challenge
- rate limited
- permission denied
- unknown

### 4.2 Bounded RepairContext

Repair receives:
- failed step
- last successful checkpoint
- bounded neighboring steps
- expected target state
- sanitized current snapshot
- typed failure
- platform hints

### 4.3 Patch proposal

Repair should produce the smallest viable patch.

Do not regenerate the whole workflow unless explicitly escalated.

### 4.4 Trial and revision

A repair becomes durable only after validation.

Successful repair creates a new immutable Flow revision.

## Milestone exit

See Acceptance A4.

---

# Milestone 5 — Human takeover and risk engine

## Objective

Make security/user-intervention states safe and resumable.

## Deliverables

### 5.1 Risk taxonomy

Support:
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

### 5.2 Pause/resume

Runtime states now include:
- PAUSED_HUMAN
- RETRY_WAIT
- REPAIRING

### 5.3 User takeover UI

User can:
- take control
- complete login/verification/manual action
- return control

Runtime must re-snapshot and verify a known state before resuming.

## Milestone exit

See Acceptance A5.

---

# Milestone 6 — WeChat Official Accounts MVP

## Objective

Apply the proven architecture to the first real platform.

## Initial scope

- add WeChat Official Accounts platform
- manual first-time QR login
- persistent session
- article creation flow
- title
- body
- cover
- summary where applicable
- publish confirmation
- publish success verification
- repair evidence collection

## Out of scope

- CAPTCHA bypass
- MFA bypass
- stealth/fingerprint spoofing
- cloud execution
- multi-user collaboration
- dozens of platforms
- automatic irreversible publishing without configured confirmation policy

## Milestone exit

See Acceptance A6.

---

# Milestone 7 — Hardening

Only after the MVP loop is proven:

- crash recovery
- resumable runs
- app update mechanism
- workflow inspector
- diagnostic export with redaction
- compatibility matrix
- memory/performance profiling
- signed installers
- telemetry/diagnostics policy

---

# Milestone 8 — Expansion

Potential later work:
- additional platforms
- official API-backed actions
- scheduled jobs while app is open
- optional remote/browser execution
- workflow templates
- team features

Every major expansion requires its own scoped plan or ADR.

---

# Dependency order

The intended dependency chain is:

```
Foundation
   ↓
Deterministic Runtime
   ↓
Persistence / Sessions
   ↓
Discovery
   ↓
Repair
   ↓
Human Takeover / Risk
   ↓
Real Platform MVP
   ↓
Hardening
   ↓
Expansion
```

Do not invert this order without a documented reason.

---

# How agents should choose work

An agent should:

1. read AGENTS.md
2. read this plan
3. read ACCEPTANCE.md
4. inspect current repository state
5. identify the earliest incomplete milestone
6. select the smallest coherent unfinished slice
7. implement and validate it
8. update documentation when behavior changes
9. report what remains

GitHub Issues are optional coordination objects. They are not required to determine the next task.
