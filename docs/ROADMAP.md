# Roadmap

The roadmap is risk-driven. Do not optimize for number of supported platforms before proving the runtime loop.

## Phase 0 — Foundation

Goal: repository can be safely developed by multiple agents.

Deliverables:
- workspace/tooling/bootstrap
- Electron shell + React renderer
- strict TypeScript/lint/test CI
- package boundaries
- SQLite migration mechanism
- typed IPC
- security defaults
- ADR process
- local fixture website

Exit: clean clone can install, test, build, and launch deterministically.

## Phase 1 — Deterministic workflow runtime

Goal: execute a known Flow without AI.

Deliverables:
- Workflow IR v1
- BrowserDriver v1
- ElectronDriver basic navigation/snapshot/find/click/fill/upload
- executor
- pre/postcondition validators
- run state machine
- typed errors
- structured event log
- local fixture flow

Exit: fixture workflow executes repeatedly with zero LLM calls.

## Phase 2 — Persistence and account/session model

Goal: survive app restarts.

Deliverables:
- platforms/accounts/flows/revisions/runs schema
- per-account persistent Electron sessions
- session health detection
- account removal/session cleanup
- encrypted secret abstraction

Exit: login/session and workflows persist across restarts in fixture environment.

## Phase 3 — Discovery

Goal: learn a flow from a goal and page state.

Deliverables:
- provider-neutral AI gateway
- sanitized snapshot pipeline
- structured discovery output
- workflow compiler/validator
- discovery UI and review
- cost/token/latency instrumentation

Exit: AI can learn fixture v1 and produce a Flow that later runs without AI.

## Phase 4 — Repair loop

Goal: self-heal a broken known workflow.

Deliverables:
- failure classifier
- bounded RepairContext
- repair proposal schema
- candidate patch validation
- safe trial execution
- new revision creation
- rollback/version inspection

Test fixture v2 must intentionally break v1 selectors/layout.

Exit:
```
learn v1 → run → switch site to v2 → fail → repair → validate → revision+1 → next run succeeds without AI
```

This is the key technical milestone.

## Phase 5 — Human takeover and risk engine

Goal: safely handle non-automatable/security states.

Deliverables:
- pause/resume state
- takeover UI
- risk event taxonomy
- QR/security/MFA fixtures
- confirmation checkpoints
- rate limiting/backoff

Exit: all hard-pause fixtures stop automation and resume only after verified user intervention.

## Phase 6 — WeChat Official Accounts MVP

Goal: real-world first adapter.

Scope:
- manual QR login
- persistent account session
- article editor discovery
- title/body/cover/summary input where supported
- publish flow
- confirmation before irreversible publish
- success verification
- repair evidence collection

Do not use production accounts in automated CI.

Exit: repeated article publishing works reliably for a controlled test account and a deliberately induced minor UI change can be repaired.

## Phase 7 — Product hardening

- crash recovery
- resumable runs
- update system
- export/import diagnostics without secrets
- workflow inspector
- platform compatibility matrix
- performance/memory profiling
- signed installers

## Phase 8 — Additional platforms and API actions

Only now add additional adapters, chosen by user demand.

Introduce official API-backed actions where available. Browser/API implementations should share capability semantics.

## Deferred

Not part of early releases:
- cloud browser execution
- background publishing while desktop is off
- team collaboration/RBAC
- workflow marketplace
- stealth browser / anti-detection evasion
- CAPTCHA solving
- arbitrary website destructive automation
