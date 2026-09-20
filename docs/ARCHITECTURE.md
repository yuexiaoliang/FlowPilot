# Architecture

## Architectural objective

FlowPilot is a local-first, intent-first desktop automation runtime. Human intent is authored primarily in natural language/Markdown and compiled into structured plans. Its durable assets include versioned GoalPlans, TaskPlans, Sources, Workflows, and Run provenance. AI helps interpret intent, discover workflows, and repair them; it is not the deterministic workflow runtime.

## Runtime topology

### Electron Main
Owns:
- application lifecycle
- windows and WebContentsView instances
- persistent Electron sessions/partitions
- permissions and navigation policy
- secure storage integration
- IPC endpoints
- BrowserDriver implementation wiring
- worker lifecycle

### Renderer
Owns:
- React UI
- platform/account management views
- flow/run inspection
- human takeover controls
- user confirmations
- settings

Renderer has no direct filesystem/database/Node access beyond narrow preload APIs.

### Automation Worker / Application Services
Owns:
- natural-language Goal/Task compilation orchestration
- semantic entity resolution
- Source Manager and InputBundle construction
- scheduler/task orchestration when enabled
- Flow loading
- planning of deterministic execution
- executor
- validators
- retries/backoff
- risk classification
- discovery/repair orchestration
- run event stream

CPU/long-running orchestration should not block Electron Main or Renderer.

## Core packages

Target monorepo:

```
apps/
  desktop/
    src/
      main/
      preload/
      renderer/
      workers/

packages/
  domain/             # entities, IDs, error taxonomy
  goal-ir/            # GoalPlan schema/compiler boundary
  task-ir/            # TaskPlan schema/compiler boundary
  source-core/        # Source providers, permissions, snapshots
  workflow-ir/        # Flow schema and compiler primitives
  workflow-runtime/   # executor, validator, retry, resume
  browser-driver/     # interface + contract tests
  electron-driver/    # WebContentsView/CDP implementation
  playwright-driver/  # dev/test/fallback adapter
  ai-core/            # provider-neutral AI request/result types
  ai-discovery/       # discovery orchestration
  ai-repair/          # local repair orchestration
  storage/            # repositories + SQLite mapping
  ipc-contracts/      # renderer/main typed boundary
  observability/      # logs/events/redaction
  platform-sdk/       # platform capabilities/adapters
```

Not all packages need to exist on day one. Extract only when a boundary becomes real, but preserve dependency direction.

## Product compilation model

FlowPilot separates the human source from machine execution:

```
Goal.md / Task.md
      ↓
semantic compilation
      ↓
GoalPlan / TaskPlan
      ↓
Source resolution
      ↓
immutable InputBundle
      ↓
Flow discovery/selection
      ↓
versioned Flow
      ↓
Run
```

Rules:
- human-facing Markdown remains normal prose and must not require internal IDs or DSL syntax
- semantic phrases are resolved to stable internal entity references
- materially ambiguous resolution pauses for a user choice rather than guessing
- compiled plans are versioned artifacts
- a Run binds exact plan/Flow revisions and immutable input provenance
- repair updates Flow revisions; it does not silently rewrite the user's Goal

See `PRODUCT-MODEL.md` and `TASK-SOURCE-RUNTIME.md`.

## Source and input model

A Source is an explicit permission boundary. Natural-language references never grant arbitrary filesystem or repository access.

Before execution, Source data is resolved into an immutable InputBundle. The workflow must not reread mutable Source data mid-run.

Scheduled/recurring tasks require deterministic idempotency and consumption semantics so the same source version is not accidentally published twice.

## Browser model

Production desktop browsing uses **Electron WebContentsView** controlled from Main. Electron documents WebContentsView as the high-control embedded-web option and discourages relying on the older webview tag.

Every platform account receives an isolated persistent session/partition. Session identity must never be mixed between accounts.

The runtime talks only to:

```ts
interface BrowserDriver {
  navigate(request: NavigateRequest): Promise<NavigationResult>;
  snapshot(options?: SnapshotOptions): Promise<PageSnapshot>;
  find(target: TargetDescriptor): Promise<TargetMatch[]>;
  click(target: ResolvedTarget, options?: ActionOptions): Promise<ActionResult>;
  fill(target: ResolvedTarget, value: string, options?: ActionOptions): Promise<ActionResult>;
  upload(target: ResolvedTarget, files: FileRef[]): Promise<ActionResult>;
  evaluate<T>(request: SafeEvaluation<T>): Promise<T>;
  waitFor(condition: Condition, options?: WaitOptions): Promise<ConditionResult>;
  screenshot(options?: ScreenshotOptions): Promise<ScreenshotRef>;
}
```

The exact interface can evolve, but callers must not know whether Electron/CDP or Playwright implements it.

## Authentication model

Preferred order:
1. persistent browser session/profile
2. platform-supported OAuth/API credentials
3. normal reauthentication flow
4. human takeover for QR, CAPTCHA, MFA, security challenges

Do not reverse-engineer or imitate undocumented token-refresh mechanisms as the default strategy.

Auth material is treated as secret. AI receives derived state ("logged in", "login page", "security challenge"), not raw credentials.

## Workflow runtime

A run is a state machine:

```
PENDING
→ PREPARING
→ RUNNING
→ [PAUSED_HUMAN | REPAIRING | RETRY_WAIT]
→ RUNNING
→ VERIFYING
→ SUCCEEDED

Any state → FAILED / CANCELLED
```

Each Step follows:
```
check preconditions
→ resolve target
→ execute action
→ await transition
→ validate expected state
→ record evidence
```

Thrown browser errors alone never determine success.

## AI discovery

Input should be minimized:
- user goal
- sanitized page snapshot
- allowed action vocabulary
- current URL/domain metadata
- platform capabilities
- prior relevant steps

Output must be structured and schema validated. AI proposals do not directly mutate stored workflows. They are compiled/validated first.

## AI repair

Repair starts from the failed step plus bounded neighboring context.

Repair algorithm:
1. classify failure
2. capture sanitized current state/evidence
3. ask repair agent for candidate patch
4. validate candidate against policy/schema
5. execute in a bounded sandbox/run
6. verify target state
7. persist new Flow version
8. link repair provenance and old/new diff

Never overwrite the prior Flow version.

## Risk engine

Typed risk events include:
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

Risk events can pause or stop execution. AI cannot override hard-stop policy.

## Platform abstraction

A Platform Adapter provides capabilities and hints, not a separate execution engine.

Example:
```ts
interface PlatformAdapter {
  id: PlatformId;
  allowedOrigins: string[];
  capabilities: PlatformCapabilities;
  detectState(snapshot: PageSnapshot): Promise<PlatformState>;
  safetyPolicy: PlatformSafetyPolicy;
}
```

Generic runtime behavior stays generic.

## Persistence

SQLite stores structured application state:
- platforms
- accounts (non-secret metadata)
- goals / goal revisions / compiled GoalPlans
- tasks / task revisions / compiled TaskPlans
- sources / scoped permissions / source cursors
- input bundles / source provenance / consumption records
- flows
- flow_versions
- runs
- run_steps
- repair_attempts
- publish_jobs
- event metadata

Browser profiles/session storage live in application data directories, not database blobs.

Secrets are encrypted via OS-backed secure storage where feasible.

## Observability

Every run emits structured events with correlation IDs:
- run.started
- step.started
- step.target_resolved
- step.succeeded
- step.failed
- repair.started
- repair.proposed
- repair.validated
- human_takeover.required
- run.succeeded / failed

Logs must be useful without exposing page secrets.

## API-first option

When a platform provides an official, authorized API for a capability, a platform adapter may implement the action through that API. Browser and API actions can coexist behind the same Flow action model where semantics match.

## Explicit non-goals for MVP

- cloud browser farm
- multi-user collaboration
- stealth/fingerprint spoofing
- CAPTCHA solving/bypass
- arbitrary user-authored JavaScript execution
- autonomous destructive actions
- dozens of platforms
- server-side scheduling while desktop app is offline
